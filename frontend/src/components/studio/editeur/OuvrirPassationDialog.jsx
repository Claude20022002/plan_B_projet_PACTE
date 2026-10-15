import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { enseignantAPI } from '../../../services/api';
import { studioAPI } from '../../../services/studioApi';
import FormReglages from './FormReglages';
import CodeAcces from './CodeAcces';

/**
 * Ouvrir une passation : titre, réglages repris du quiz (modifiables), classe et dates facultatives.
 * Une fois ouverte, la fenêtre montre les deux accès : le code et le QR code.
 */

// Valeur d'un champ datetime-local → ISO (heure locale de l'enseignant)
const versIso = (valeur) => (valeur ? new Date(valeur).toISOString() : null);

export default function OuvrirPassationDialog({ ouvert, onFermer, quiz, onOuverte }) {
  const { t } = useTranslation();
  const [titre, setTitre] = useState('');
  const [reglages, setReglages] = useState(quiz.reglages);
  const [classes, setClasses] = useState([]);
  const [groupe, setGroupe] = useState('');
  const [ouverture, setOuverture] = useState('');
  const [fermeture, setFermeture] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!ouvert) return;
    setTitre('');
    setReglages(quiz.reglages);
    setGroupe('');
    setOuverture('');
    setFermeture('');
    setErreur(null);
    setSession(null);
    enseignantAPI
      .mesClasses()
      .then((r) => {
        const liste = Array.isArray(r) ? r : r?.classes ?? [];
        setClasses([...new Map(liste.map((c) => [c.id_groupe, c])).values()]);
      })
      .catch(() => setClasses([]));
  }, [ouvert, quiz.reglages]);

  const ouvrir = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      const s = await studioAPI.ouvrir(quiz.id_questionnaire, { titre: titre || undefined, reglages, id_groupe: groupe || undefined, ouverture: versIso(ouverture), fermeture: versIso(fermeture) });
      setSession(s);
      onOuverte(s);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={onFermer} maxWidth="sm" fullWidth>
      <DialogTitle>{session ? session.titre : t('studio.passation.titre')}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {session ? (
          <CodeAcces code={session.code} titre={session.titre} />
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {t('studio.passation.aide')}
            </Typography>
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <TextField label={t('studio.passation.titrePassation')} placeholder={quiz.titre} value={titre} onChange={(e) => setTitre(e.target.value)} inputProps={{ maxLength: 200 }} />
            <TextField select label={t('studio.passation.classe')} value={groupe} onChange={(e) => setGroupe(e.target.value)} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value="">{t('studio.passation.toutes')}</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id_groupe} value={c.id_groupe}>
                  {c.nom_groupe}
                  {c.nom_cours ? ` · ${c.nom_cours}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField type="datetime-local" label={t('studio.passation.ouverture')} value={ouverture} onChange={(e) => setOuverture(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="datetime-local" label={t('studio.passation.fermeture')} value={fermeture} onChange={(e) => setFermeture(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <FormReglages reglages={reglages} onChange={setReglages} compact />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{session ? t('common.close') : t('common.cancel')}</Button>
        {!session && (
          <Button variant="contained" onClick={ouvrir} disabled={envoi}>
            {t('studio.passation.ouvrir')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
