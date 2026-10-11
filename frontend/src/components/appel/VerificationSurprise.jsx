import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { presenceAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Vérification surprise de l'appel, facultative : quelques présents par scan tirés au hasard, que
 * l'enseignant appelle à voix haute ; un absent perd sa présence et est signalé.
 * @param {{ id: string|number, ouvert: boolean, fermer: () => void, modifie?: () => void }} props
 */
export default function VerificationSurprise({ id, ouvert, fermer, modifie }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [nombre, setNombre] = useState(3);
  const [tirage, setTirage] = useState(null); // { etudiants, restants }
  const [resultats, setResultats] = useState({}); // { [id_user]: bool }

  // Chaque ouverture repart d'un tirage neuf
  useEffect(() => {
    if (!ouvert) return;
    setTirage(null);
    setResultats({});
  }, [ouvert]);

  const tirer = async () => {
    try {
      setTirage(await presenceAPI.tirerVerification(id, nombre));
      setResultats({});
    } catch (e) {
      toast.error(e?.message || t('appel.erreur'));
    }
  };

  const constater = async (etudiant, present) => {
    try {
      await presenceAPI.verifier(id, etudiant.id_user, present);
      setResultats((r) => ({ ...r, [etudiant.id_user]: present }));
      modifie?.();
    } catch (e) {
      toast.error(e?.message || t('appel.erreur'));
    }
  };

  return (
    <Dialog open={ouvert} onClose={fermer} fullWidth maxWidth="xs">
      <DialogTitle>{t('appel.verifierTitre')}</DialogTitle>
      <DialogContent>
        {!tirage && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('appel.verifierAide')}</Typography>
            <TextField select fullWidth size="small" label={t('appel.verifierNombre')} value={nombre} onChange={(ev) => setNombre(Number(ev.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </>
        )}
        {tirage && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('appel.verifierConsigne')}</Typography>
            {tirage.etudiants.length === 0 && <Alert severity="info">{t('appel.aucunATirer')}</Alert>}
            <List dense>
              {tirage.etudiants.map((e) => {
                const resultat = resultats[e.id_user];
                return (
                  <ListItem key={e.id_user} disableGutters secondaryAction={
                    resultat === undefined ? (
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" color="success" onClick={() => constater(e, true)}>{t('appel.vu')}</Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => constater(e, false)}>{t('appel.absent')}</Button>
                      </Stack>
                    ) : (
                      <Chip size="small" color={resultat ? 'success' : 'error'} label={t(resultat ? 'appel.vu' : 'appel.absent')} />
                    )
                  }>
                    <ListItemText primary={`${e.nom} ${e.prenom}`} primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItem>
                );
              })}
            </List>
            {tirage.restants > 0 && (
              <Typography variant="caption" color="text.secondary">{t('appel.restants', { count: tirage.restants })}</Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer}>{t('appel.fermerVerification')}</Button>
        <Button variant="contained" onClick={tirer}>{t('appel.tirer')}</Button>
      </DialogActions>
    </Dialog>
  );
}
