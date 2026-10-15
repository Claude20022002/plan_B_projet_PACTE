import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Stack, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import { ArrowBack, PlayCircleOutline, Send } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ListeQuestions from '../../components/studio/editeur/ListeQuestions';
import EditeurQuestion from '../../components/studio/editeur/EditeurQuestion';
import GenererIaDialog from '../../components/studio/editeur/GenererIaDialog';
import OuvrirPassationDialog from '../../components/studio/editeur/OuvrirPassationDialog';
import { OngletPassations, OngletReglages } from '../../components/studio/editeur/OngletsQuiz';
import { questionVide } from '../../../../shared/quiz/studio/types.js';
import { passationAPI, studioAPI } from '../../services/studioApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * Éditeur d'un quiz du Studio : trois onglets (Questions, Réglages, Passations), l'onglet est
 * gardé dans l'adresse. Une action principale, « Ouvrir une passation » ; « Aperçu » fait passer
 * le quiz à l'enseignant comme un étudiant, sans que cela compte.
 */
export default function EditeurQuiz() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const large = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [params, setParams] = useSearchParams();
  const onglet = ['questions', 'reglages', 'passations'].includes(params.get('onglet')) ? params.get('onglet') : 'questions';
  const [quiz, setQuiz] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [medias, setMedias] = useState({});
  const [dispo, setDispo] = useState(null);
  const [selection, setSelection] = useState(null);
  const [nouvelle, setNouvelle] = useState(null);
  const [generer, setGenerer] = useState(false);
  const [ouvrir, setOuvrir] = useState(false);
  const [rafraichir, setRafraichir] = useState(0);

  const charger = useCallback(async () => {
    try {
      const q = await studioAPI.detail(id);
      setQuiz(q);
      setSelection((s) => s ?? q.questions[0]?.id_question ?? null);
      setErreur(null);
    } catch (e) {
      setErreur(e.message);
    }
  }, [id]);

  useEffect(() => {
    charger();
    studioAPI.medias().then((r) => setMedias(Object.fromEntries(r.medias.map((m) => [m.id_media, m])))).catch(() => {});
    studioAPI.disponibiliteIa().then(setDispo).catch(() => setDispo(null));
  }, [charger]);

  // Pendant une génération, les questions arrivent seules
  const enGeneration = quiz?.generation?.statut === 'en_cours';
  useEffect(() => {
    if (!enGeneration) return undefined;
    const minuterie = setInterval(charger, 2500);
    return () => clearInterval(minuterie);
  }, [enGeneration, charger]);

  const aRelire = useMemo(() => (quiz ? quiz.questions.filter((q) => q.a_relire).length : 0), [quiz]);
  const points = useMemo(() => (quiz ? Math.round(quiz.questions.reduce((s, q) => s + q.points, 0) * 100) / 100 : 0), [quiz]);
  const courante = nouvelle ?? quiz?.questions.find((q) => q.id_question === selection) ?? null;
  const numero = nouvelle ? (quiz?.questions.length ?? 0) + 1 : (quiz?.questions.findIndex((q) => q.id_question === selection) ?? -1) + 1;

  const remplacer = (question) => {
    setQuiz((q) => ({ ...q, questions: q.questions.some((x) => x.id_question === question.id_question) ? q.questions.map((x) => (x.id_question === question.id_question ? question : x)) : [...q.questions, question] }));
    setNouvelle(null);
    setSelection(question.id_question);
  };
  const deplacer = async (de, vers) => {
    if (vers < 0 || vers >= quiz.questions.length) return;
    const ids = quiz.questions.map((q) => q.id_question);
    [ids[de], ids[vers]] = [ids[vers], ids[de]];
    try {
      setQuiz(await studioAPI.reordonner(id, ids));
    } catch (e) {
      toastRef.current.error(e.message);
    }
  };
  const apercu = async () => {
    try {
      const session = await studioAPI.ouvrir(id, { essai: true });
      const r = await passationAPI.commencer(session.id_session);
      navigate(`/quiz/tentative/${r.id_tentative}`);
    } catch (e) {
      toastRef.current.error(e.message);
    }
  };

  if (erreur) {
    return (
      <DashboardLayout>
        <Alert severity="error" action={<Button onClick={() => navigate('/studio-quiz')}>{t('studio.editeur.retour')}</Button>}>
          {erreur}
        </Alert>
      </DashboardLayout>
    );
  }
  if (!quiz) {
    return (
      <DashboardLayout>
        <CircularProgress aria-label={t('common.loading')} />
      </DashboardLayout>
    );
  }

  const afficherListe = large || !courante;
  const afficherEditeur = large || courante;
  return (
    <DashboardLayout>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/studio-quiz')} sx={{ mb: 1 }}>
        {t('studio.editeur.retour')}
      </Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h1" component="h1" sx={{ overflowWrap: 'anywhere' }}>
            {quiz.titre}
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              {t('studio.editeur.total', { questions: quiz.questions.length, points })}
            </Typography>
            {quiz.etiquettes.map((e) => (
              <Chip key={e} size="small" label={e} sx={{ bgcolor: 'action.hover' }} />
            ))}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PlayCircleOutline />} onClick={apercu} disabled={!quiz.questions.length || enGeneration} title={t('studio.editeur.apercuAide')}>
            {t('studio.editeur.apercu')}
          </Button>
          <Button variant="contained" startIcon={<Send />} onClick={() => setOuvrir(true)} disabled={!quiz.questions.length || aRelire > 0 || enGeneration}>
            {t('studio.editeur.ouvrir')}
          </Button>
        </Stack>
      </Stack>

      {enGeneration && (
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('studio.editeur.generationEnCours')}
          </Typography>
          <LinearProgress />
        </Alert>
      )}
      {quiz.generation?.statut === 'erreur' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {quiz.generation.erreur}
        </Alert>
      )}
      {aRelire > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('studio.editeur.aRelireBandeau', { count: aRelire })}
        </Alert>
      )}

      <Tabs value={onglet} onChange={(_, v) => setParams({ onglet: v }, { replace: true })} variant="scrollable" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {['questions', 'reglages', 'passations'].map((o) => (
          <Tab key={o} value={o} label={t(`studio.editeur.onglets.${o}`)} />
        ))}
      </Tabs>

      {onglet === 'questions' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 340px) 1fr' }, gap: 2, alignItems: 'start' }}>
          {afficherListe && (
            <ListeQuestions
              questions={quiz.questions}
              selection={nouvelle ? null : selection}
              onSelection={(idq) => {
                setNouvelle(null);
                setSelection(idq);
              }}
              onDeplacer={deplacer}
              onAjouter={(type) => setNouvelle({ ...questionVide(type), id_question: null })}
              onGenerer={() => setGenerer(true)}
              iaDisponible={Boolean(dispo?.texte)}
            />
          )}
          {afficherEditeur && (
            <Box>
              {!large && (
                <Button startIcon={<ArrowBack />} onClick={() => { setNouvelle(null); setSelection(null); }} sx={{ mb: 1 }}>
                  {t('studio.editeur.onglets.questions')}
                </Button>
              )}
              {courante ? (
                <EditeurQuestion
                  key={courante.id_question ?? `nouvelle-${courante.type}`}
                  idQuestionnaire={quiz.id_questionnaire}
                  question={courante}
                  numero={numero}
                  medias={medias}
                  dispo={dispo}
                  onMediaMaj={(m) => setMedias((x) => ({ ...x, [m.id_media]: m }))}
                  onEnregistree={remplacer}
                  onDupliquee={remplacer}
                  onSupprimee={(idq) => {
                    setQuiz((q) => ({ ...q, questions: q.questions.filter((x) => x.id_question !== idq) }));
                    setSelection(null);
                  }}
                />
              ) : (
                <Typography color="text.secondary" sx={{ p: 2 }}>
                  {t('studio.editeur.selectionner')}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
      {onglet === 'reglages' && <OngletReglages key={quiz.modifie_le} quiz={quiz} onModifie={setQuiz} />}
      {onglet === 'passations' && <OngletPassations quiz={quiz} rafraichir={rafraichir} />}

      <GenererIaDialog
        ouvert={generer}
        onFermer={() => setGenerer(false)}
        idQuestionnaire={quiz.id_questionnaire}
        onLancee={() => {
          setGenerer(false);
          toast.info(t('studio.ia.lance'));
          charger();
        }}
      />
      <OuvrirPassationDialog
        ouvert={ouvrir}
        onFermer={() => setOuvrir(false)}
        quiz={quiz}
        onOuverte={() => setRafraichir((n) => n + 1)}
      />
    </DashboardLayout>
  );
}
