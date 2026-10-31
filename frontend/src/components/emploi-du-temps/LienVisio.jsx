import { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { VideoCall } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { domaineDuLien, motifLienVisioRefuse } from '../../../../shared/lienVisio.js';
import { affectationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Lien de visioconférence d'une séance à distance, dans sa fiche (lot EC-11,
 * conception-ec11-groupe-b.md) : « Rejoindre sur … » pour tous ceux qui voient la séance ; le champ
 * pour l'enseignant de la séance et l'administration. Le domaine est montré pour que l'étudiant
 * sache où il va (V-8). `onChange(id, lien)` signale le lien enregistré (ou null).
 */
export default function LienVisio({ session: s, onChange }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [valeur, setValeur] = useState(s.lienVisio ?? '');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  // Une autre séance : tout repart de zéro
  useEffect(() => {
    setErreur('');
    setEnregistre(false);
  }, [s.id]);
  // Le lien reçu (celui qu'on vient d'enregistrer compris) : le champ le reprend, « Lien enregistré » reste
  useEffect(() => {
    setValeur(s.lienVisio ?? '');
  }, [s.id, s.lienVisio]);

  const peutModifier = s.aDistance && (user?.role === 'admin' || (user?.role === 'enseignant' && user.id_user === s.teacherId));
  if (!s.aDistance && !s.lienVisio) return null;

  const enregistrer = async (lien) => {
    const motif = lien ? motifLienVisioRefuse(lien) : null;
    if (motif) return setErreur(t(`visio.refus.${motif}`));
    setEnvoi(true);
    setErreur('');
    try {
      const reponse = await affectationAPI.lienVisio(s.id, lien || null);
      onChange?.(s.id, reponse.lien_visio);
      setEnregistre(true);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {s.lienVisio && s.status !== 'annule' ? (
        <Button variant="contained" startIcon={<VideoCall />} href={s.lienVisio} target="_blank" rel="noopener noreferrer">
          {t('visio.rejoindre', { domaine: domaineDuLien(s.lienVisio) })}
        </Button>
      ) : (
        !peutModifier && !s.lienVisio && <Typography variant="body2" color="text.secondary">{t('visio.pasEncore')}</Typography>
      )}
      {peutModifier && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }} alignItems={{ sm: 'flex-start' }}>
          <TextField
            size="small"
            fullWidth
            label={t('visio.champ')}
            placeholder="https://"
            value={valeur}
            onChange={(e) => { setValeur(e.target.value); setErreur(''); setEnregistre(false); }}
            error={Boolean(erreur)}
            helperText={erreur || (enregistre ? t('visio.enregistre') : t('visio.aide'))}
            inputProps={{ maxLength: 500 }}
          />
          <Button variant="outlined" disabled={envoi || valeur.trim() === (s.lienVisio ?? '')} onClick={() => enregistrer(valeur.trim())}>
            {t('common.save')}
          </Button>
          {s.lienVisio && (
            <Button color="error" disabled={envoi} onClick={() => enregistrer('')}>
              {t('visio.retirer')}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
