import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { CancelOutlined, CheckCircleOutline, HourglassEmpty, RemoveCircleOutline } from '@mui/icons-material';
import MediaQuestion from '../MediaQuestion';
import ReponseQuestion from '../reponses/ReponseQuestion';

/** Statut d'une réponse corrigée : texte et icône (jamais la couleur seule). */
export function StatutCorrection({ correction }) {
  const { t } = useTranslation();
  if (!correction) return null;
  const statuts = {
    juste: { label: t('studio.joueur.juste'), color: 'success', icon: <CheckCircleOutline /> },
    partiel: { label: t('studio.joueur.partiel'), color: 'warning', icon: <RemoveCircleOutline /> },
    faux: { label: t('studio.joueur.fausse'), color: 'error', icon: <CancelOutlined /> },
    sans_reponse: { label: t('studio.joueur.sansReponse'), color: 'error', icon: <CancelOutlined /> },
    a_corriger: { label: t('studio.joueur.aCorriger'), color: 'default', icon: <HourglassEmpty /> },
  };
  const s = statuts[correction.points === null ? 'a_corriger' : correction.statut] ?? statuts.faux;
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Chip size="small" color={s.color} icon={s.icon} label={s.label} variant={s.color === 'default' ? 'outlined' : 'filled'} />
      {correction.points !== null && (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {correction.points} / {correction.max}
        </Typography>
      )}
    </Stack>
  );
}

/** Correction d'une question : statut, explication, commentaire de l'enseignant. */
export function RetourQuestion({ correction }) {
  const { t } = useTranslation();
  if (!correction) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Typography variant="overline" component="p" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {t('studio.joueur.retour')}
      </Typography>
      <StatutCorrection correction={correction} />
      {correction.explication && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
          {correction.explication}
        </Typography>
      )}
      {correction.commentaire && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          « {correction.commentaire} »
        </Typography>
      )}
    </Paper>
  );
}

export default function ResultatCopie({ copie, srcMedia, onNouvelle, onRetour, libelleRetour }) {
  const { t } = useTranslation();
  const r = copie.resultat;
  const session = copie.session;
  const peutRecommencer = session.ouverte && session.tentatives_restantes !== 0 && !session.essai;
  const parId = Object.fromEntries((r?.detail ?? []).map((d) => [d.id_question, d]));
  return (
    <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {t('studio.joueur.resultatTitre')}
        </Typography>
        {r?.mode === 'jamais' && <Typography sx={{ mt: 2 }}>{t('studio.joueur.resultatJamais')}</Typography>}
        {r && r.mode !== 'jamais' && (
          <>
            <Typography component="p" sx={{ mt: 2, fontSize: { xs: 48, sm: 64 }, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {r.pourcentage ?? 0} %
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t('studio.joueur.resultatScore', { points: r.points ?? 0, max: r.max ?? 0 })} · {t('studio.joueur.resultatSeuil', { seuil: session.seuil_reussite })}
            </Typography>
            {r.reussi !== null && (
              <Chip
                sx={{ mt: 2, fontWeight: 700 }}
                color={r.reussi ? 'success' : 'error'}
                icon={r.reussi ? <CheckCircleOutline /> : <CancelOutlined />}
                label={r.reussi ? t('studio.resultats.reussi') : t('studio.resultats.echoue')}
              />
            )}
            {!r.complet && (
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                {t('studio.joueur.resultatAttente')}
              </Alert>
            )}
          </>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" sx={{ mt: 3 }}>
          {peutRecommencer && (
            <Button variant="contained" onClick={onNouvelle}>
              {t('studio.joueur.nouvelleTentative')}
            </Button>
          )}
          <Button variant={peutRecommencer ? 'outlined' : 'contained'} onClick={onRetour}>
            {libelleRetour}
          </Button>
        </Stack>
      </Paper>

      {r?.detail && (
        <Box sx={{ mt: 4 }}>
          {!r.reponses_visibles && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('studio.joueur.reponsesCachees')}
            </Alert>
          )}
          <Stack spacing={2} divider={<Divider flexItem />}>
            {copie.questions.map((q, i) => {
              const correction = parId[q.id_question];
              const media = q.id_media ? copie.medias[q.id_media] : null;
              return (
                <Box key={q.id_question} component="section" aria-labelledby={`q-${q.id_question}`}>
                  <Typography variant="overline" color="text.secondary">
                    {t('studio.joueur.question', { n: i + 1, total: copie.questions.length })}
                  </Typography>
                  <Typography id={`q-${q.id_question}`} variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, whiteSpace: 'pre-line' }}>
                    {q.enonce}
                  </Typography>
                  {media && q.type !== 'zone_image' && (
                    <Box sx={{ mb: 2 }}>
                      <MediaQuestion media={media} src={srcMedia(q.id_media)} extrait={q.extrait} transcription={media.transcription} />
                    </Box>
                  )}
                  <ReponseQuestion
                    question={q}
                    valeur={copie.reponses[q.id_question] ?? null}
                    correction={r.reponses_visibles ? correction : null}
                    desactive
                    srcMedia={q.id_media ? srcMedia(q.id_media) : null}
                    media={media}
                  />
                  {r.reponses_visibles ? <RetourQuestion correction={correction} /> : <Box sx={{ mt: 1.5 }}><StatutCorrection correction={correction} /></Box>}
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
