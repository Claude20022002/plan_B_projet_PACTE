import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Skeleton, Typography } from '@mui/material';
import { AutoAwesome, Campaign, FactCheck, Grading, LocalLibrary, Quiz, SportsEsports, WorkOutline } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageHeader from '../design-system/components/PageHeader';
import Panneau, { Capitales, LignePanneau } from '../components/jeux/Panneau';
import { boutonPanneau, boutonPanneauPlein } from '../components/jeux/styles';
import { enseignantAPI, quizAPI, quizIaAPI } from '../services/api';
import { supportsDuCours } from '../utils/supports';
import { adresseEspace } from '../../../shared/espaces.js';
import useLiveRefresh from '../hooks/useLiveRefresh';
import { ds } from '../design-system/tokens';

// Le rappel de l'appel s'affiche dans les dernières minutes de la séance (le serveur envoie
// aussi une notification, même page fermée : RAPPEL_APPEL_MINUTES)
const RAPPEL_MINUTES = 5;

const cleClasse = (c) => `${c.id_cours}:${c.id_groupe}`;
const nomClasse = (c) => `${c.nom_cours} · ${c.nom_groupe}`;
const minutesAvantFin = (seance, maintenant) => Math.ceil((new Date(`${seance.date}T${seance.heure_fin}:00`) - maintenant) / 60000);

/**
 * Mes classes (enseignant) : la classe en cours d'abord, avec tout ce que j'y fais (appel, devoir
 * ou quiz, message à la classe, offre de stage, supports de cours), puis mes autres classes.
 * Dans les 5 dernières minutes d'une séance sans appel terminé, un rappel s'affiche.
 */
export default function MesClasses() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [maintenant, setMaintenant] = useState(() => new Date());
  // Quiz en direct (ClassQuiz) : proposé seulement si la plateforme en a un
  const [quiz, setQuiz] = useState(null);
  // Génération de quiz par l'IA : proposée seulement si le serveur est configuré
  const [quizIa, setQuizIa] = useState(false);
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';

  const charger = useCallback(
    () =>
      enseignantAPI
        .mesClasses()
        .then((liste) => {
          setClasses(Array.isArray(liste) ? liste : []);
          setErreur(false);
        })
        .catch(() => setErreur(true))
        .finally(() => setMaintenant(new Date())),
    []
  );

  useEffect(() => {
    charger();
  }, [charger]);
  useLiveRefresh(charger);

  useEffect(() => {
    let actif = true;
    quizAPI
      .getConfig()
      .then((c) => actif && setQuiz(c?.peutLancer && /^https?:\/\//.test(c.url ?? '') ? c : null))
      .catch(() => actif && setQuiz(null));
    quizIaAPI
      .disponibilite()
      .then((d) => actif && setQuizIa(Boolean(d?.disponible)))
      .catch(() => actif && setQuizIa(false));
    return () => {
      actif = false;
    };
  }, []);

  const enCours = useMemo(() => (classes ?? []).filter((c) => c.en_cours), [classes]);
  const autres = useMemo(() => (classes ?? []).filter((c) => !c.en_cours), [classes]);
  const aRappeler = enCours.filter((c) => c.prochaine_seance.appel !== 'ferme' && minutesAvantFin(c.prochaine_seance, maintenant) <= RAPPEL_MINUTES);

  const ouvrirSupports = async (classe) => {
    const supports = await supportsDuCours(classe.code_cours);
    // La bibliothèque (StudyLib) est une autre application sur la même origine : navigation complète
    window.location.assign(supports?.url ?? '/biblio/');
  };

  const libelleSeance = (c) => {
    const s = c.prochaine_seance;
    if (!s) return t('classes.sansSeance');
    const jour = new Date(`${s.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    return [c.en_cours ? t('classes.enCours', { fin: s.heure_fin }) : t('classes.prochaine', { date: jour, heure: s.heure_debut }), s.salle].filter(Boolean).join(' · ');
  };

  const actions = (c) => {
    const seance = c.prochaine_seance;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* Appel : le jour de la séance seulement (le serveur le refuse un autre jour) */}
        {seance?.appel && (
          <Button
            size="small"
            variant={c.en_cours && seance.appel !== 'ferme' ? 'contained' : 'outlined'}
            sx={c.en_cours && seance.appel !== 'ferme' ? boutonPanneauPlein : boutonPanneau}
            startIcon={<FactCheck />}
            onClick={() => navigate(`/appel/${seance.id_affectation}`)}
          >
            {t(`classes.page.appel.${seance.appel}`)}
          </Button>
        )}
        <Button size="small" variant="outlined" sx={boutonPanneau} startIcon={<Quiz />} onClick={() => navigate('/jeux', { state: { donnerDevoir: { id_cours: c.id_cours, id_groupe: c.id_groupe } } })}>
          {t('classes.page.devoir')}
        </Button>
        {quizIa && (
          <Button size="small" variant="outlined" sx={boutonPanneau} startIcon={<AutoAwesome />} onClick={() => navigate('/jeux', { state: { genererQuiz: { id_cours: c.id_cours, id_groupe: c.id_groupe } } })}>
            {t('classes.page.quizIa')}
          </Button>
        )}
        {quiz && c.en_cours && (
          <Button size="small" variant="outlined" sx={boutonPanneau} startIcon={<SportsEsports />} href={adresseEspace('quiz', { role: 'enseignant', urlQuiz: quiz.url })}>
            {t('classes.page.quizDirect')}
          </Button>
        )}
        <Button size="small" variant="outlined" sx={boutonPanneau} startIcon={<Campaign />} onClick={() => navigate('/annonces', { state: { nouvelle: { id_groupe: c.id_groupe } } })}>
          {t('classes.page.ecrire')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          sx={boutonPanneau}
          startIcon={<WorkOutline />}
          onClick={() => navigate('/annonces', { state: { nouvelle: { id_groupe: c.id_groupe, titre: t('classes.page.titreStage') } } })}
        >
          {t('classes.page.stage')}
        </Button>
        <Button size="small" variant="outlined" sx={boutonPanneau} startIcon={<LocalLibrary />} onClick={() => ouvrirSupports(c)}>
          {t('classes.page.supports')}
        </Button>
      </Box>
    );
  };

  const ligne = (c, i) => (
    <LignePanneau key={cleClasse(c)} premier={i === 0} lampe={c.en_cours ? ds.board.live : null}>
      <Box sx={{ fontWeight: 600 }}>
        {c.code_cours} {nomClasse(c)}
      </Box>
      <Capitales sx={{ display: 'block', mt: 0.25, mb: 1.25, fontSize: '0.8125rem', color: ds.board.letterDim }}>
        {[t('classes.effectif', { count: c.effectif }), libelleSeance(c)].join(' · ')}
      </Capitales>
      {actions(c)}
    </LignePanneau>
  );

  return (
    <DashboardLayout>
      <PageHeader title={t('classes.page.titre')} subtitle={t('classes.page.sousTitre')} />
      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('common.errorLoad')}
        </Alert>
      )}
      {aRappeler.map((c) => (
        <Alert
          key={cleClasse(c)}
          severity="warning"
          role="alert"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate(`/appel/${c.prochaine_seance.id_affectation}`)}>
              {t(`classes.page.appel.${c.prochaine_seance.appel}`)}
            </Button>
          }
        >
          {t(c.prochaine_seance.appel === 'ouvert' ? 'classes.page.rappelTerminer' : 'classes.page.rappelFaire', { classe: nomClasse(c), fin: c.prochaine_seance.heure_fin })}
        </Alert>
      ))}

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        {classes === null && !erreur && <Skeleton variant="rectangular" height={160} />}
        {classes?.length === 0 && <Alert severity="info">{t('classes.aucune')}</Alert>}

        {enCours.length > 0 && (
          <Panneau titre={t('classes.page.enCours')} titreId="classes-en-cours">
            {enCours.map(ligne)}
          </Panneau>
        )}
        {autres.length > 0 && (
          <Panneau titre={t(enCours.length ? 'classes.page.autres' : 'classes.page.toutes')} titreId="classes-autres">
            {autres.map(ligne)}
          </Panneau>
        )}

        {classes?.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('classes.page.bientot')}
            </Typography>
            <Chip size="small" variant="outlined" icon={<Grading />} label={t('classes.page.notes')} />
            <Chip size="small" variant="outlined" icon={<LocalLibrary />} label={t('classes.page.genererSupports')} />
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
