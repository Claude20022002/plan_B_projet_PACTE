import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';

/**
 * Petite fenêtre de saisie : un titre (section, renommage) ou un lien (titre et adresse).
 * `champs` : [{ nom, libelle, valeur, type, requis, aide }] ; `onValider(valeurs)` rend une promesse.
 */
export default function SaisieDialog({ ouvert, titre, champs = [], libelleValider, onFermer, onValider }) {
  const { t } = useTranslation();
  const [valeurs, setValeurs] = useState({});
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (ouvert) setValeurs(Object.fromEntries(champs.map((c) => [c.nom, c.valeur ?? ''])));
    // Réinitialisé à chaque ouverture seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert]);

  const incomplet = champs.some((c) => c.requis && !String(valeurs[c.nom] ?? '').trim());
  const valider = async (e) => {
    e.preventDefault();
    if (incomplet) return;
    setEnCours(true);
    try {
      await onValider(valeurs);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={onFermer} fullWidth maxWidth="xs" component="form" onSubmit={valider}>
      <DialogTitle>{titre}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {champs.map((c, i) => (
            <TextField
              key={c.nom}
              autoFocus={i === 0}
              label={c.libelle}
              type={c.type ?? 'text'}
              required={c.requis}
              helperText={c.aide}
              value={valeurs[c.nom] ?? ''}
              onChange={(e) => setValeurs((v) => ({ ...v, [c.nom]: e.target.value }))}
              inputProps={{ maxLength: c.max ?? 200 }}
              fullWidth
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{t('common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={incomplet || enCours}>
          {libelleValider ?? t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
