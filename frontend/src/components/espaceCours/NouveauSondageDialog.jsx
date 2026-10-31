import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { espaceCoursAPI } from '../../services/espaceCours';
import { SONDAGE, verifierSondage } from '../../../../shared/sondages.js';
import { aujourdhui } from '../../../../shared/dates.js';

const VIDE = { question: '', choix: ['', ''], ferme_le: '' };

/**
 * Création d'un sondage (lot EC-9) : une question, 2 à 6 choix, un dernier jour facultatif. La règle
 * de shared/sondages.js (S-3) est vérifiée avant l'envoi, avec le même motif que le serveur ; un
 * sondage ne se modifie plus une fois publié, d'où l'avertissement.
 */
export default function NouveauSondageDialog({ ouvert, idCours, idGroupe, onFermer, onCree }) {
  const { t } = useTranslation();
  const [valeurs, setValeurs] = useState(VIDE);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (ouvert) {
      setValeurs(VIDE);
      setErreur(null);
    }
  }, [ouvert]);

  const changerChoix = (i, texte) => setValeurs((v) => ({ ...v, choix: v.choix.map((c, j) => (j === i ? texte : c)) }));
  const retirerChoix = (i) => setValeurs((v) => ({ ...v, choix: v.choix.filter((_, j) => j !== i) }));
  const ajouterChoix = () => setValeurs((v) => ({ ...v, choix: [...v.choix, ''] }));

  const publier = async (e) => {
    e.preventDefault();
    const { motif, sondage } = verifierSondage(valeurs, aujourdhui());
    if (motif) {
      setErreur(t(`espaceCours.sondages.motifs.${motif}`));
      return;
    }
    setEnCours(true);
    try {
      await espaceCoursAPI.creerSondage(idCours, idGroupe, sondage);
      onCree();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={onFermer} fullWidth maxWidth="sm" component="form" onSubmit={publier} noValidate>
      <DialogTitle>{t('espaceCours.sondages.nouveau')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label={t('espaceCours.sondages.question')}
            value={valeurs.question}
            onChange={(e) => setValeurs((v) => ({ ...v, question: e.target.value }))}
            inputProps={{ maxLength: SONDAGE.questionMax }}
            multiline
            required
            fullWidth
          />
          {valeurs.choix.map((c, i) => (
            <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                label={t('espaceCours.sondages.choixN', { n: i + 1 })}
                value={c}
                onChange={(e) => changerChoix(i, e.target.value)}
                inputProps={{ maxLength: SONDAGE.libelleMax }}
                required
                fullWidth
              />
              {valeurs.choix.length > SONDAGE.choixMin && (
                <IconButton onClick={() => retirerChoix(i)} aria-label={t('espaceCours.sondages.retirerChoix', { n: i + 1 })}>
                  <Close />
                </IconButton>
              )}
            </Stack>
          ))}
          {valeurs.choix.length < SONDAGE.choixMax && (
            <Button startIcon={<Add />} onClick={ajouterChoix} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
              {t('espaceCours.sondages.ajouterChoix')}
            </Button>
          )}
          <TextField
            type="date"
            label={t('espaceCours.sondages.fermeLe')}
            helperText={t('espaceCours.sondages.fermeLeAide')}
            value={valeurs.ferme_le}
            onChange={(e) => setValeurs((v) => ({ ...v, ferme_le: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: aujourdhui() } }}
            fullWidth
          />
          <Alert severity="info">{t('espaceCours.sondages.avantPublier')}</Alert>
          {erreur && <Alert severity="warning">{erreur}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{t('common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={enCours}>
          {t('espaceCours.sondages.publier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
