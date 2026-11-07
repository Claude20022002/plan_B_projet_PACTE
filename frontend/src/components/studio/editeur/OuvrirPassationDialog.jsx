import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { enseignantAPI } from '../../../services/api';
import { directAPI, studioAPI } from '../../../services/studioApi';
import { DUREE_QUESTION } from '../../../../../shared/quiz/studio/direct.js';
import FormReglages from './FormReglages';
import CodeAcces from './CodeAcces';

/**
 * Diffuser un quiz, de deux façons : chacun à son rythme (titre, réglages repris du quiz, classe et
 * dates facultatives ; la fenêtre montre ensuite le code et le QR code), ou en direct (classe et
 * temps par question ; l'écran à projeter s'ouvre aussitôt, lot SC-1b).
 */

const DUREES = [10, DUREE_QUESTION.defaut, 30, 60];

// Valeur d'un champ datetime-local → ISO (heure locale de l'enseignant)
const versIso = (valeur) => (valeur ? new Date(valeur).toISOString() : null);

export default function OuvrirPassationDialog({ ouvert, onFermer, quiz, onOuverte }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('rythme');
  const [duree, setDuree] = useState(DUREE_QUESTION.defaut);
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
    setMode('rythme');
    setDuree(DUREE_QUESTION.defaut);
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
      if (mode === 'direct') {
        const direct = await directAPI.lancer({ id_questionnaire: quiz.id_questionnaire, titre: titre || undefined, id_groupe: groupe || undefined, duree_question_s: duree });
        onFermer();
        navigate(`/studio-quiz/direct/${direct.id_session}`);
        return;
      }
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
            <ToggleButtonGroup exclusive fullWidth color="primary" value={mode} onChange={(_, v) => v && setMode(v)} aria-label={t('direct.mode.titre')}>
              <ToggleButton value="rythme">{t('direct.mode.rythme')}</ToggleButton>
              <ToggleButton value="direct">{t('direct.mode.direct')}</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              {mode === 'direct' ? t('direct.mode.directAide') : t('studio.passation.aide')}
            </Typography>
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <TextField label={t('studio.passation.titrePassation')} placeholder={quiz.titre} value={titre} onChange={(e) => setTitre(e.target.value)} inputProps={{ maxLength: 200 }} />
            <TextField select label={t('studio.passation.classe')} value={groupe} onChange={(e) => setGroupe(e.target.value)} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }} helperText={mode === 'direct' ? t('direct.lancer.classeAide') : undefined}>
              <MenuItem value="">{t('studio.passation.toutes')}</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id_groupe} value={c.id_groupe}>
                  {c.nom_groupe}
                  {c.nom_cours ? ` · ${c.nom_cours}` : ''}
                </MenuItem>
              ))}
            </TextField>
            {mode === 'direct' && (
              <TextField select label={t('direct.lancer.duree')} value={duree} onChange={(e) => setDuree(Number(e.target.value))}>
                {DUREES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {t('direct.lancer.secondes', { count: s })}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {mode === 'rythme' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField type="datetime-local" label={t('studio.passation.ouverture')} value={ouverture} onChange={(e) => setOuverture(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="datetime-local" label={t('studio.passation.fermeture')} value={fermeture} onChange={(e) => setFermeture(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            )}
            {mode === 'rythme' && <FormReglages reglages={reglages} onChange={setReglages} compact />}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{session ? t('common.close') : t('common.cancel')}</Button>
        {!session && (
          <Button variant="contained" onClick={ouvrir} disabled={envoi}>
            {mode === 'direct' ? t('direct.lancer.action') : t('studio.passation.ouvrir')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
