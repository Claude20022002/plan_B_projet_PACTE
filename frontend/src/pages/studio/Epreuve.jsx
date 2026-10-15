import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack, ArrowForward, Flag, FlagOutlined } from '@mui/icons-material';
import useEpreuve from '../../components/studio/joueur/useEpreuve';
import BarreEpreuve from '../../components/studio/joueur/BarreEpreuve';
import VueEnsemble, { RendreDialog } from '../../components/studio/joueur/VueEnsemble';
import { aUneReponse, choixAuClavier } from '../../components/studio/outils';
import ResultatCopie, { RetourQuestion } from '../../components/studio/joueur/ResultatCopie';
import MediaQuestion from '../../components/studio/MediaQuestion';
import ReponseQuestion from '../../components/studio/reponses/ReponseQuestion';
import { passationAPI } from '../../services/studioApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * Épreuve du Studio quiz, sur le modèle de l'examen Cisco : une question par écran, l'énoncé et
 * son média en tête, barre d'actions en bas (Précédent, À revoir, Suivant), vue d'ensemble pour
 * aller où l'on veut et rendre. Écran sans menu latéral : rien ne distrait de l'épreuve.
 */

const DANS_UN_CHAMP = (el) => el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable || el.getAttribute('role') === 'application' || el.getAttribute('role') === 'combobox');

export default function Epreuve() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const e = useEpreuve(id);
  const [vue, setVue] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const titreQuestion = useRef(null);
  const premierAffichage = useRef(true);

  const copie = e.copie;
  const question = copie?.questions[e.index];
  const lineaire = copie?.session.navigation === 'lineaire';
  const immediate = copie?.session.correction === 'immediate';
  const verrouillee = question ? e.verrouillees.includes(question.id_question) : false;
  const derniere = copie ? e.index === copie.questions.length - 1 : false;
  const repondues = useMemo(() => (copie ? copie.questions.filter((q) => aUneReponse(e.reponses[q.id_question])).length : 0), [copie, e.reponses]);
  const srcMedia = (idMedia) => passationAPI.urlMedia(id, idMedia);

  // Nouvelle question : le focus va sur son énoncé (lecteurs d'écran, clavier)
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    titreQuestion.current?.focus();
  }, [e.index]);

  const suivant = async () => {
    if (!question) return;
    // Linéaire ou entraînement : « Suivant » valide d'abord la question
    if ((lineaire || immediate) && !verrouillee) {
      const ok = await e.valider(question.id_question);
      if (!ok || immediate) return;
    }
    if (derniere) setConfirmer(true);
    else e.aller(e.index + 1);
  };

  useEffect(() => {
    const clavier = (ev) => {
      if (!question || vue || confirmer || ev.ctrlKey || ev.metaKey || ev.altKey || DANS_UN_CHAMP(document.activeElement)) return;
      if (ev.key === 'ArrowRight' && !lineaire) e.aller(e.index + 1);
      else if (ev.key === 'ArrowLeft' && !lineaire) e.aller(e.index - 1);
      else if (ev.key.toLowerCase() === 'm') e.basculerMarque(question.id_question);
      else if (/^[1-9]$/.test(ev.key) && !verrouillee) {
        const valeur = choixAuClavier(question, e.reponses[question.id_question], Number(ev.key));
        if (valeur !== undefined) e.repondre(question.id_question, valeur);
      } else return;
      ev.preventDefault();
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [question, vue, confirmer, lineaire, verrouillee, e]);

  const rendre = async () => {
    setEnvoi(true);
    await e.rendre();
    setEnvoi(false);
    setConfirmer(false);
    window.scrollTo({ top: 0 });
  };

  const nouvelle = async () => {
    try {
      const r = await passationAPI.commencer(copie.session.id_session);
      navigate(`/quiz/tentative/${r.id_tentative}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const retour = () => (copie?.session.essai ? navigate(-1) : navigate('/quiz'));

  if (e.erreur && !copie) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', p: 3 }}>
        <Alert severity="error" action={<Button onClick={() => e.recharger()}>{t('common.retry')}</Button>}>
          {e.erreur}
        </Alert>
      </Box>
    );
  }
  if (!copie) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress aria-label={t('common.loading')} />
      </Box>
    );
  }
  if (copie.statut === 'rendue') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <ResultatCopie copie={copie} srcMedia={srcMedia} onNouvelle={nouvelle} onRetour={retour} libelleRetour={copie.session.essai ? t('studio.joueur.quitterApercu') : t('studio.joueur.retourQuiz')} />
      </Box>
    );
  }

  const media = question.id_media ? copie.medias[question.id_media] : null;
  const marquee = e.marquees.includes(question.id_question);
  const libelleSuivant = (lineaire || immediate) && !verrouillee ? t('studio.joueur.valider') : derniere ? t('studio.joueur.terminer') : t('studio.joueur.suivant');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <BarreEpreuve titre={copie.session.titre} index={e.index} total={copie.questions.length} repondues={repondues} restant={e.restant} enregistrement={e.enregistrement} onVueEnsemble={() => setVue(true)} />
      {copie.session.essai && (
        <Alert severity="info" square>
          {t('studio.joueur.apercu')}
        </Alert>
      )}
      <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 820, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="overline" color="text.secondary">
            {t('studio.joueur.question', { n: e.index + 1, total: copie.questions.length })}
          </Typography>
          <Chip size="small" variant="outlined" label={t('studio.joueur.points', { count: question.points })} />
        </Stack>
        <Typography ref={titreQuestion} tabIndex={-1} variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2, whiteSpace: 'pre-line', outline: 'none' }}>
          {question.enonce}
        </Typography>
        {media && question.type !== 'zone_image' && (
          <Box sx={{ mb: 3 }}>
            <MediaQuestion key={question.id_question} media={media} src={srcMedia(question.id_media)} extrait={question.extrait} />
          </Box>
        )}
        <ReponseQuestion
          question={question}
          valeur={e.reponses[question.id_question] ?? null}
          onChange={(valeur) => e.repondre(question.id_question, valeur)}
          desactive={verrouillee}
          srcMedia={question.id_media ? srcMedia(question.id_media) : null}
          media={media}
        />
        {immediate && <RetourQuestion correction={e.retours[question.id_question]} />}
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, mt: 4 }}>
          {t('studio.joueur.raccourcis')}
        </Typography>
      </Box>

      <Paper square elevation={0} sx={{ position: 'sticky', bottom: 0, borderTop: 1, borderColor: 'divider', px: { xs: 1.5, sm: 3 }, py: 1.5, pb: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Stack direction="row" spacing={1} sx={{ maxWidth: 820, mx: 'auto' }} alignItems="center">
          <Button startIcon={<ArrowBack />} onClick={() => e.aller(e.index - 1)} disabled={e.index === 0 || lineaire} sx={{ minHeight: 44 }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {t('studio.joueur.precedent')}
            </Box>
          </Button>
          <Button
            variant={marquee ? 'contained' : 'outlined'}
            color="warning"
            startIcon={marquee ? <Flag /> : <FlagOutlined />}
            onClick={() => e.basculerMarque(question.id_question)}
            aria-pressed={marquee}
            sx={{ minHeight: 44 }}
          >
            {marquee ? t('studio.joueur.marquee') : t('studio.joueur.marquer')}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" endIcon={!derniere || ((lineaire || immediate) && !verrouillee) ? <ArrowForward /> : null} onClick={suivant} sx={{ minHeight: 44, minWidth: 120 }}>
            {libelleSuivant}
          </Button>
        </Stack>
      </Paper>

      <VueEnsemble
        ouvert={vue}
        onFermer={() => setVue(false)}
        questions={copie.questions}
        reponses={e.reponses}
        marquees={e.marquees}
        index={e.index}
        lineaire={lineaire}
        onAller={e.aller}
        onRendre={() => {
          setVue(false);
          setConfirmer(true);
        }}
      />
      <RendreDialog ouvert={confirmer} onFermer={() => setConfirmer(false)} onConfirmer={rendre} envoi={envoi} sansReponse={copie.questions.length - repondues} marquees={e.marquees.length} />
    </Box>
  );
}
