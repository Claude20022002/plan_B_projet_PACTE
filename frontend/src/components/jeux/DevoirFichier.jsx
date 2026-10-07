import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { AttachFile, UploadFile } from '@mui/icons-material';
import { devoirsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';
import { ACCEPT_DEVOIRS, erreurFichierDevoir, tailleLisible } from '../../utils/fichiers';

/**
 * Devoir « fichier » côté étudiant (R3) : consignes et énoncé, dépôt de la copie (remplaçable tant
 * qu'elle n'est pas corrigée, acceptée en retard après la date limite), puis note et commentaire.
 */
export default function DevoirFichier({ donnees, recharger }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const d = donnees.devoir;
  const rendu = donnees.rendu;
  const corrige = rendu && rendu.note !== null;
  const date = (iso) => new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  const telecharger = async (action) => {
    try {
      await action();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const deposer = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    const probleme = erreurFichierDevoir(fichier);
    if (probleme) return setErreur(t(probleme));
    setErreur('');
    setEnvoi(true);
    try {
      const r = await devoirsAPI.deposerCopie(d.id, fichier);
      toast.success(r.en_retard ? `${t('jeux.devoirs.copieDeposee')} · ${t('jeux.devoirs.enRetard')}` : t('jeux.devoirs.copieDeposee'));
      await recharger();
    } catch (err) {
      setErreur(err?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {corrige && (
        <Alert severity="success" icon={false}>
          <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '2rem' }}>{t('jeux.devoirs.note', { note: rendu.note.toLocaleString(i18n.language) })}</Typography>
          {rendu.commentaire && (
            <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              <strong>{t('jeux.devoirs.commentaire')} : </strong>
              {rendu.commentaire}
            </Typography>
          )}
        </Alert>
      )}

      <Card variant="outlined" component="section" aria-labelledby="consignes-titre">
        <CardContent>
          <Typography id="consignes-titre" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{t('jeux.devoirs.consignes')}</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} color={d.consignes ? 'text.primary' : 'text.secondary'}>
            {d.consignes || t('jeux.devoirs.sansConsignes')}
          </Typography>
          {d.enonce && (
            <Button startIcon={<AttachFile />} variant="outlined" sx={{ mt: 2 }} onClick={() => telecharger(() => devoirsAPI.telechargerEnonce(d.id, d.enonce.nom))}>
              {t('jeux.devoirs.telechargerEnonce', { nom: d.enonce.nom })} · {tailleLisible(d.enonce.taille)}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" component="section" aria-labelledby="copie-titre">
        <CardContent>
          <Typography id="copie-titre" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{t('jeux.devoirs.maCopieTitre')}</Typography>
          {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}
          {rendu ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography>{t('jeux.devoirs.copieRendue', { date: date(rendu.rendu_le) })}</Typography>
              {rendu.en_retard && <Chip size="small" color="warning" label={t('jeux.devoirs.enRetard')} />}
              {!corrige && <Chip size="small" variant="outlined" label={t('jeux.devoirs.enCorrection')} />}
            </Box>
          ) : (
            <Typography color="text.secondary">{t(d.ouvert ? 'jeux.devoirs.pasEncoreRendu' : 'jeux.devoirs.pasRenduRetard')}</Typography>
          )}
          {rendu?.fichier && (
            <Button size="small" startIcon={<AttachFile />} sx={{ mt: 1 }} onClick={() => telecharger(() => devoirsAPI.telechargerCopie(d.id, user.id_user, rendu.fichier.nom))}>
              {rendu.fichier.nom} · {tailleLisible(rendu.fichier.taille)}
            </Button>
          )}
          {!corrige && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mt: 2 }}>
              <Button component="label" variant="contained" startIcon={<UploadFile />} disabled={envoi}>
                {envoi ? t('jeux.devoirs.envoiCopie') : rendu ? t('jeux.devoirs.remplacer') : t('jeux.devoirs.deposer')}
                <input type="file" hidden accept={ACCEPT_DEVOIRS} onChange={deposer} />
              </Button>
              <Typography variant="body2" color="text.secondary">{t('jeux.devoirs.formatsCopie')}</Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
