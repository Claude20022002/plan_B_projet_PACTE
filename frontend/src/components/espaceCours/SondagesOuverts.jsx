import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { CheckCircle, Poll } from '@mui/icons-material';
import { espaceCoursAPI } from '../../services/espaceCours';
import { useToast } from '../../contexts/ToastContext';
import { localeEcran } from '../../utils/dates';

/** Un sondage ouvert : les choix et « Répondre », ou le merci une fois la réponse envoyée. */
function SondageARepondre({ sondage, onRecharger }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [choix, setChoix] = useState('');
  const [enCours, setEnCours] = useState(false);
  const idQuestion = `sondage-${sondage.id_sondage}`;

  const repondre = async () => {
    setEnCours(true);
    try {
      await espaceCoursAPI.repondreSondage(sondage.id_sondage, Number(choix));
      toast.success(t('espaceCours.sondages.merci'));
    } catch (e) {
      // Fermé ou déjà répondu (autre onglet) : le message du serveur le dit, la liste se met à jour
      toast.error(e.message);
    } finally {
      setEnCours(false);
      onRecharger();
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderLeft: 4, borderLeftColor: 'primary.main' }} component="section" aria-labelledby={idQuestion}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
        <Poll fontSize="small" aria-hidden />
        <Typography variant="overline" sx={{ lineHeight: 1.5 }}>
          {t('espaceCours.sondages.etiquette')}
        </Typography>
        {sondage.ferme_le && (
          <Typography variant="caption" sx={{ ml: 'auto' }}>
            {t('espaceCours.sondages.jusquAu', { date: new Date(`${sondage.ferme_le}T12:00:00`).toLocaleDateString(localeEcran(i18n.language), { day: 'numeric', month: 'short' }) })}
          </Typography>
        )}
      </Box>
      <Typography id={idQuestion} component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {sondage.question}
      </Typography>
      {sondage.a_repondu ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircle fontSize="small" aria-hidden />
          <Typography variant="body2">{t('espaceCours.sondages.dejaRepondu')}</Typography>
        </Box>
      ) : (
        <>
          <RadioGroup aria-labelledby={idQuestion} value={choix} onChange={(e) => setChoix(e.target.value)}>
            {sondage.choix.map((c) => (
              <FormControlLabel key={c.id_choix} value={String(c.id_choix)} control={<Radio />} label={c.libelle} />
            ))}
          </RadioGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={repondre} disabled={!choix || enCours} sx={{ textTransform: 'none' }}>
              {t('espaceCours.sondages.repondre')}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
              {t('espaceCours.sondages.anonyme')}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

/**
 * Sondages ouverts d'une classe, pour l'étudiant (lot EC-9) : au-dessus des supports, une carte par
 * sondage. La réponse est anonyme et définitive (règles S-5 et S-6).
 */
export default function SondagesOuverts({ sondages, onRecharger }) {
  if (!sondages.length) return null;
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      {sondages.map((s) => (
        <SondageARepondre key={s.id_sondage} sondage={s} onRecharger={onRecharger} />
      ))}
    </Stack>
  );
}
