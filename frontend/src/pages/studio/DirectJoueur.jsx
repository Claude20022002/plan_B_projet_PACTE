import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { CancelOutlined, CheckCircleOutline, HourglassEmpty } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import QuestionDirect from '../../components/studio/direct/QuestionDirect';
import { Podium } from '../../components/studio/direct/Classement';
import { correctionDe, useRelecture, useRestant } from '../../components/studio/direct/outilsDirect';
import { directAPI } from '../../services/studioApi';

/**
 * Quiz en direct, écran de l'étudiant (lot SC-1b), sur téléphone comme sur ordinateur : attendre
 * le lancement, répondre pendant le chrono (un choix unique ou un vrai-faux part au toucher),
 * voir son résultat à la correction, puis le podium. Seul le serveur corrige et compte les points.
 */

// Ces réponses partent dès le toucher ; les autres attendent « Valider »
const ENVOI_IMMEDIAT = ['choix_unique', 'vrai_faux'];

function Resultat({ vue }) {
  const { t } = useTranslation();
  const statut = vue.ma_reponse?.statut ?? 'sans_reponse';
  const juste = statut === 'juste';
  const cle = { juste: 'juste', partiel: 'partiel', faux: 'faux' }[statut] ?? 'sansReponse';
  return (
    <Paper variant="outlined" role="status" sx={{ p: 2, borderRadius: 3, borderWidth: 2, borderColor: juste ? 'success.main' : statut === 'partiel' ? 'warning.main' : 'error.main' }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {juste ? <CheckCircleOutline color="success" sx={{ fontSize: 40 }} /> : <CancelOutlined color={statut === 'partiel' ? 'warning' : 'error'} sx={{ fontSize: 40 }} />}
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{t(`direct.joueur.${cle}`)}</Typography>
          {vue.ma_reponse?.points > 0 && <Typography sx={{ fontWeight: 600 }}>{t('direct.joueur.gagnes', { count: vue.ma_reponse.points })}</Typography>}
        </Box>
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
        {vue.mon_rang === 1 ? t('direct.joueur.total_un', { points: vue.mon_total, joueurs: vue.joueurs }) : t('direct.joueur.total', { points: vue.mon_total, rang: vue.mon_rang, joueurs: vue.joueurs })}
      </Typography>
    </Paper>
  );
}

export default function DirectJoueur() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [vue, setVue] = useState(null);
  const [heure, setHeure] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [termine, setTermine] = useState(false);
  const [valeur, setValeur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const version = useRef(undefined);
  const index = useRef(null);
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const recevoir = (v) => {
    setHeure(v.maintenant_ms);
    if (v.inchange) return;
    version.current = v.version;
    // Nouvelle question : on repart d'une réponse vide
    if (index.current !== v.index) setValeur(null);
    index.current = v.index;
    setVue(v);
  };

  const lire = useCallback(async () => {
    try {
      const v = version.current === undefined ? await directAPI.rejoindre(id) : await directAPI.joueur(id, version.current);
      if (monte.current) {
        recevoir(v);
        setErreur(null);
      }
    } catch (e) {
      if (!monte.current) return;
      const code = e?.response?.data?.code;
      if (code === 'PAS_REJOINT') version.current = undefined;
      else if (code === 'DIRECT_TERMINE') setTermine(true);
      else setErreur(e?.message || t('direct.joueur.erreur'));
    }
  }, [id, t]);
  useRelecture(lire, !termine && vue?.etape !== 'termine');
  const restant = useRestant(vue, heure);

  const envoyer = async (reponse) => {
    setEnvoi(true);
    try {
      await directAPI.repondre(id, vue.index, reponse);
      setVue((v) => ({ ...v, repondu: true }));
    } catch (e) {
      setErreur(e?.message || t('direct.joueur.erreur'));
    } finally {
      setEnvoi(false);
    }
  };

  const changer = (r) => {
    setValeur(r);
    if (ENVOI_IMMEDIAT.includes(vue.question.type)) envoyer(r);
  };

  const enQuestion = vue?.etape === 'question';
  const srcMedia = vue?.media ? directAPI.urlMedia(id, vue.media.id_media) : null;
  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'grid', gap: 2 }}>
        <Typography component="h1" sx={{ fontWeight: 700, fontSize: 22 }}>
          {vue?.titre}
        </Typography>
        {erreur && <Alert severity="error">{erreur}</Alert>}
        {termine && <Alert severity="info">{t('direct.joueur.termine')}</Alert>}
        {!vue && !erreur && !termine && <Skeleton variant="rounded" height={240} />}

        {vue?.etape === 'attente' && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <HourglassEmpty color="primary" sx={{ fontSize: 48 }} aria-hidden />
            <Typography sx={{ fontSize: 18, mt: 1 }}>{t('direct.joueur.pret')}</Typography>
          </Paper>
        )}

        {vue?.question && ['question', 'correction', 'classement'].includes(vue.etape) && (
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            {!enQuestion && <Box sx={{ mb: 2 }}><Resultat vue={vue} /></Box>}
            <QuestionDirect
              vue={vue}
              restant={restant}
              srcMedia={srcMedia}
              valeur={enQuestion ? valeur : vue.ma_reponse?.reponse ?? null}
              onChange={changer}
              desactive={!enQuestion || vue.repondu || envoi || restant === 0}
              correction={enQuestion ? null : correctionDe(vue.bonne_reponse, vue.ma_reponse?.statut ?? 'sans_reponse')}
            />
            {enQuestion && !vue.repondu && !ENVOI_IMMEDIAT.includes(vue.question.type) && (
              <Button variant="contained" size="large" fullWidth sx={{ mt: 2, minHeight: 52 }} disabled={envoi || valeur === null || valeur === '' || restant === 0} onClick={() => envoyer(valeur)}>
                {t('direct.joueur.valider')}
              </Button>
            )}
            {enQuestion && vue.repondu && (
              <Alert severity="success" sx={{ mt: 2 }} role="status">
                {t('direct.joueur.envoyee')}
              </Alert>
            )}
            {vue.etape === 'classement' && <Typography color="text.secondary" sx={{ mt: 2 }}>{t('direct.joueur.attenteSuite')}</Typography>}
          </Paper>
        )}

        {vue?.etape === 'termine' && (
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 32 }}>
              {t('direct.joueur.finTitre')}
            </Typography>
            {vue.mon_rang && (
              <Typography sx={{ fontSize: 18 }}>
                {vue.mon_rang === 1 ? t('direct.joueur.monRang_un', { joueurs: vue.joueurs, points: vue.mon_total }) : t('direct.joueur.monRang', { rang: vue.mon_rang, joueurs: vue.joueurs, points: vue.mon_total })}
              </Typography>
            )}
            <Podium joueurs={vue.podium ?? []} />
          </Stack>
        )}

        {(vue?.etape === 'termine' || termine) && (
          <Button component={RouterLink} to="/quiz" variant="outlined" sx={{ justifySelf: 'center' }}>
            {t('direct.joueur.retour')}
          </Button>
        )}
      </Box>
    </DashboardLayout>
  );
}
