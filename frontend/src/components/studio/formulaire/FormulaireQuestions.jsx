import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Add, AutoAwesome } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirmation } from '../../../contexts/ConfirmationContext';
import CarteQuestion from './CarteQuestion';
import ApercuQuestion from './ApercuQuestion';
import { nouvelleQuestion } from './brouillon';

/**
 * Questions d'un quiz du Studio, éditées comme un Google Form : une colonne de cartes, une seule
 * ouverte à la fois ; « Ajouter une question » ajoute un choix unique juste sous la carte ouverte,
 * qu'on change de type d'un menu ; chaque carte s'enregistre seule.
 *
 * Chaque carte a une clé stable (« cle ») : une question nouvelle garde la sienne quand le serveur
 * la crée, pour ne pas perdre le curseur pendant la frappe. `version` change quand la question est
 * remplacée de l'extérieur (régénérée, relue) : la carte repart alors de la version du serveur.
 */
const depuis = (q) => ({ cle: `q${q.id_question}`, version: 0, enregistree: q, brouillon: q });

export default function FormulaireQuestions({ quiz, setQuiz, medias, dispo, onMediaMaj, onGenerer }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirmer = useConfirmation();
  const [elements, setElements] = useState(() => quiz.questions.map(depuis));
  const [ouverte, setOuverte] = useState(() => (quiz.questions[0] ? `q${quiz.questions[0].id_question}` : null));
  const compteur = useRef(0);

  // Questions arrivées du serveur (génération par l'IA en cours) : ajoutées à la fin, les autres gardées
  useEffect(() => {
    setElements((liste) => {
      const connues = new Set(liste.map((e) => e.enregistree?.id_question).filter(Boolean));
      const arrivees = quiz.questions.filter((q) => !connues.has(q.id_question));
      return arrivees.length ? [...liste, ...arrivees.map(depuis)] : liste;
    });
  }, [quiz.questions]);

  const majElement = useCallback((cle, champs) => setElements((liste) => liste.map((e) => (e.cle === cle ? { ...e, ...champs } : e))), []);
  const idsDans = (liste) => liste.map((e) => e.enregistree?.id_question).filter(Boolean);

  // L'ordre du serveur suit celui des cartes (une question créée ou dupliquée y arrive en dernier)
  const ranger = async (liste) => {
    const ids = idsDans(liste);
    if (ids.join() === quiz.questions.map((q) => q.id_question).join()) return;
    try {
      setQuiz(await studioAPI.reordonner(quiz.id_questionnaire, ids));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const inserer = (apres, element) => {
    const liste = [...elements];
    const i = apres ? liste.findIndex((e) => e.cle === apres) : liste.length - 1;
    liste.splice(i + 1, 0, element);
    setElements(liste);
    setOuverte(element.cle);
    return liste;
  };

  const ajouter = () => {
    compteur.current += 1;
    inserer(ouverte, { cle: `n${compteur.current}`, version: 0, enregistree: null, brouillon: nouvelleQuestion() });
  };

  // Lue au retour du serveur : l'enregistrement est asynchrone, la liste a pu changer entre-temps
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const enregistree = (cle) => (q) => {
    const nouvelle = !elementsRef.current.find((e) => e.cle === cle)?.enregistree;
    const liste = elementsRef.current.map((e) => (e.cle === cle ? { ...e, enregistree: q } : e));
    setElements((courante) => courante.map((e) => (e.cle === cle ? { ...e, enregistree: q } : e)));
    setQuiz((z) => ({ ...z, questions: z.questions.some((x) => x.id_question === q.id_question) ? z.questions.map((x) => (x.id_question === q.id_question ? q : x)) : [...z.questions, q] }));
    if (nouvelle) ranger(liste);
  };

  const remplacee = (cle) => (q) => {
    setElements((liste) => liste.map((e) => (e.cle === cle ? { ...e, enregistree: q, brouillon: q, version: e.version + 1 } : e)));
    setQuiz((z) => ({ ...z, questions: z.questions.map((x) => (x.id_question === q.id_question ? q : x)) }));
  };

  const dupliquer = async (element) => {
    try {
      const copie = await studioAPI.dupliquerQuestion(element.enregistree.id_question);
      setQuiz((z) => ({ ...z, questions: [...z.questions, copie] }));
      ranger(inserer(element.cle, depuis(copie)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const supprimer = async (element) => {
    if (element.enregistree) {
      if (!(await confirmer({ message: t('studio.formulaire.supprimerConfirmation'), libelle: t('common.delete') }))) return;
      try {
        await studioAPI.supprimerQuestion(element.enregistree.id_question);
      } catch (e) {
        toast.error(e.message);
        return;
      }
      setQuiz((z) => ({ ...z, questions: z.questions.filter((x) => x.id_question !== element.enregistree.id_question) }));
    }
    const i = elements.findIndex((e) => e.cle === element.cle);
    const liste = elements.filter((e) => e.cle !== element.cle);
    setElements(liste);
    setOuverte(liste[Math.max(0, i - 1)]?.cle ?? null);
  };

  const deplacer = (element, pas) => {
    const liste = [...elements];
    const i = liste.findIndex((e) => e.cle === element.cle);
    if (i + pas < 0 || i + pas >= liste.length) return;
    [liste[i], liste[i + pas]] = [liste[i + pas], liste[i]];
    setElements(liste);
    ranger(liste);
  };

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Stack spacing={2}>
        {elements.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('studio.formulaire.vide')}</Typography>
          </Paper>
        )}
        {elements.map((e, i) =>
          e.cle === ouverte ? (
            <CarteQuestion
              key={`${e.cle}-${e.version}`}
              idQuestionnaire={quiz.id_questionnaire}
              element={e}
              numero={i + 1}
              premiere={i === 0}
              derniere={i === elements.length - 1}
              medias={medias}
              dispo={dispo}
              onMediaMaj={onMediaMaj}
              onChange={(brouillon) => majElement(e.cle, { brouillon })}
              onEnregistree={enregistree(e.cle)}
              onRemplacee={remplacee(e.cle)}
              onDupliquer={() => dupliquer(e)}
              onSupprimer={() => supprimer(e)}
              onDeplacer={(pas) => deplacer(e, pas)}
            />
          ) : (
            <ApercuQuestion key={e.cle} element={e} numero={i + 1} onOuvrir={() => setOuverte(e.cle)} />
          )
        )}
      </Stack>
      {/* Toujours visible sous les questions : on ajoute sans chercher de menu */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" sx={{ mt: 2, position: 'sticky', bottom: 16, zIndex: 2 }}>
        <Button variant="contained" size="large" startIcon={<Add />} onClick={ajouter} sx={{ boxShadow: 3 }}>
          {t('studio.formulaire.ajouter')}
        </Button>
        {dispo?.texte && (
          <Button variant="outlined" size="large" startIcon={<AutoAwesome />} onClick={onGenerer} sx={{ bgcolor: 'background.paper' }}>
            {t('studio.editeur.generer')}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
