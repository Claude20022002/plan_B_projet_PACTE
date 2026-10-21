import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { ArrowBack, Fullscreen, FullscreenExit, Stop } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CodeAcces from '../../components/studio/editeur/CodeAcces';
import QuestionDirect from '../../components/studio/direct/QuestionDirect';
import Repartition from '../../components/studio/direct/Repartition';
import Classement, { Podium } from '../../components/studio/direct/Classement';
import { correctionDe, useRelecture, useRestant } from '../../components/studio/direct/outilsDirect';
import { directAPI } from '../../services/studioApi';

/**
 * Quiz en direct, écran de l'enseignant à projeter (lot SC-1b) : le QR code pendant l'attente,
 * puis chaque question avec son chrono, la correction (bonne réponse, répartition, nuage), le
 * classement et le podium. L'enseignant fait avancer la partie ; le serveur ferme une question
 * dès que le temps est écoulé ou que tout le monde a répondu.
 */

/** Actions proposées à chaque étape : [action, clé du libellé], la principale en dernier. */
const actionsDe = (vue) => {
  const derniere = vue.index + 1 >= vue.total;
  if (vue.etape === 'attente') return [['suivante', 'commencer']];
  if (vue.etape === 'question') return [['fermer', 'voirReponses']];
  if (vue.etape === 'correction') return [['classement', 'classement'], ['suivante', derniere ? 'podium' : 'suivante']];
  if (vue.etape === 'classement') return [['suivante', derniere ? 'podium' : 'suivante']];
  return [];
};

function Attente({ vue }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { md: '1fr 1fr' }, alignItems: 'start' }}>
      <CodeAcces code={vue.code} titre={vue.titre} aide={t('direct.ecran.attente')} />
      <Box>
        <Typography component="h2" sx={{ mb: 1, fontSize: 24, fontWeight: 700 }} aria-live="polite">
          {vue.joueurs ? t('direct.ecran.arrives', { count: vue.joueurs }) : t('direct.ecran.personne')}
        </Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {(vue.arrivees ?? []).map((nom) => (
            <Chip key={nom} label={nom} sx={{ fontSize: 16 }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default function DirectProjection() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [vue, setVue] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [terminer, setTerminer] = useState(false);
  const [plein, setPlein] = useState(false);
  const ecran = useRef(null);
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const lire = useCallback(async () => {
    try {
      const v = await directAPI.vue(id);
      if (monte.current) {
        setVue(v);
        setErreur(null);
      }
    } catch (e) {
      if (monte.current) setErreur(e?.message || t('direct.ecran.erreur'));
    }
  }, [id, t]);
  useRelecture(lire, vue?.etape !== 'termine');
  const restant = useRestant(vue, vue?.maintenant_ms);

  useEffect(() => {
    const suivre = () => setPlein(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', suivre);
    return () => document.removeEventListener('fullscreenchange', suivre);
  }, []);
  const basculerPleinEcran = () => (document.fullscreenElement ? document.exitFullscreen() : ecran.current?.requestFullscreen?.());

  const agir = async (action) => {
    setEnvoi(true);
    try {
      setVue(await directAPI.agir(id, action));
      setErreur(null);
    } catch (e) {
      setErreur(e?.message || t('direct.ecran.erreur'));
    } finally {
      setEnvoi(false);
    }
  };

  const enJeu = vue && vue.etape !== 'termine';
  return (
    <DashboardLayout>
      <Box ref={ecran} sx={{ bgcolor: 'background.default', p: plein ? { xs: 2, md: 5 } : 0, minHeight: plein ? '100vh' : undefined, overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {!plein && (
            <Button component={RouterLink} to="/studio-quiz" startIcon={<ArrowBack />}>
              {t('direct.ecran.retour')}
            </Button>
          )}
          <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: 22, md: 28 }, flex: 1, minWidth: 200 }}>
            {vue?.titre}
          </Typography>
          {vue?.code && enJeu && <Chip label={vue.code} sx={{ fontWeight: 700, letterSpacing: '0.2em', fontSize: 18 }} />}
          <Button onClick={basculerPleinEcran} startIcon={plein ? <FullscreenExit /> : <Fullscreen />}>
            {plein ? t('direct.ecran.quitterPleinEcran') : t('direct.ecran.pleinEcran')}
          </Button>
          {enJeu && (
            <Button color="error" startIcon={<Stop />} onClick={() => setTerminer(true)}>
              {t('direct.ecran.terminer')}
            </Button>
          )}
        </Stack>

        {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}
        {!vue && !erreur && <Skeleton variant="rounded" height={320} />}

        {vue?.etape === 'attente' && <Attente vue={vue} />}

        {vue?.question && ['question', 'correction'].includes(vue.etape) && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
            <QuestionDirect vue={vue} restant={restant} grand srcMedia={vue.media ? directAPI.urlMedia(id, vue.media.id_media) : null} correction={vue.correction ? correctionDe(vue.correction.bonne_reponse) : null} />
            <Typography sx={{ mt: 3, fontSize: 20, fontWeight: 600 }} aria-live="polite">
              {vue.etape === 'question' ? t('direct.ecran.recues', { recues: vue.reponses_recues, joueurs: vue.joueurs }) : t('direct.ecran.justes', { justes: vue.correction.justes, recues: vue.reponses_recues })}
            </Typography>
            {vue.correction && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Repartition question={vue.question} correction={vue.correction} />
                {vue.correction.explication && (
                  <Alert severity="info" variant="outlined">
                    <strong>{t('direct.ecran.explication')} : </strong>
                    {vue.correction.explication}
                  </Alert>
                )}
              </Stack>
            )}
          </Paper>
        )}

        {vue?.etape === 'classement' && <Classement classement={vue.classement} equipes={vue.equipes} />}

        {vue?.etape === 'termine' && (
          <Stack spacing={4}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 32, md: 44 }, textAlign: 'center' }}>
              {t('direct.ecran.finTitre')}
            </Typography>
            <Podium joueurs={vue.classement ?? []} />
            <Classement classement={vue.classement} equipes={vue.equipes} limite={100} />
          </Stack>
        )}

        {vue && (
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            {actionsDe(vue).map(([action, libelle], i, liste) => (
              <Button key={action} size="large" variant={i === liste.length - 1 ? 'contained' : 'outlined'} onClick={() => agir(action)} disabled={envoi} sx={{ minHeight: 52, minWidth: 180 }}>
                {t(`direct.ecran.${libelle}`)}
              </Button>
            ))}
          </Stack>
        )}
      </Box>
      <ConfirmDialog
        open={terminer}
        title={t('direct.ecran.terminerTitre')}
        message={t('direct.ecran.terminerTexte')}
        confirmLabel={t('direct.ecran.terminer')}
        onConfirm={() => {
          setTerminer(false);
          agir('terminer');
        }}
        onCancel={() => setTerminer(false)}
      />
    </DashboardLayout>
  );
}
