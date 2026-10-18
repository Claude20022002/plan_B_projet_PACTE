import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { sessionsJeuAPI } from '../../../services/api';
import { libelle } from '../../../../../shared/jeux/catalogue.js';

/**
 * Lancer un jeu en classe : le module (ses étudiants seuls pourront entrer) et la façon de jouer,
 * chacun sur son téléphone ou tous ensemble au tableau. Le QR code s'affiche ensuite sur la page
 * de la session, à projeter.
 * @param {{ jeu: { code, titre, modes }|null, modules: { id_cours, code, nom }[], onFermer: () => void }} props
 */
export default function LancerJeuDialog({ jeu, modules, onFermer }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [idCours, setIdCours] = useState('');
  const [mode, setMode] = useState('individuel');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const modes = jeu?.modes?.length ? jeu.modes : ['individuel'];

  // Nouveau jeu : premier module et premier mode proposés
  useEffect(() => {
    if (!jeu) return;
    setIdCours(modules.length === 1 ? modules[0].id_cours : '');
    setMode(jeu.modes?.[0] ?? 'individuel');
    setErreur('');
  }, [jeu, modules]);

  const lancer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const session = await sessionsJeuAPI.lancer(jeu.code, idCours, mode);
      navigate(`/jeux/sessions/${session.id_session_jeu}`);
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={Boolean(jeu)} onClose={envoi ? undefined : onFermer} fullWidth maxWidth="sm" aria-labelledby="lancer-jeu-titre">
      <DialogTitle id="lancer-jeu-titre">{jeu ? t('sessionsJeu.lancer.titre', { jeu: libelle(jeu.titre, i18n.language) }) : ''}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2.5, pt: 1 }}>
          {erreur && <Alert severity="error">{erreur}</Alert>}
          {modules.length === 0 ? (
            <Alert severity="info">{t('jeux.modules.aucun')}</Alert>
          ) : (
            <TextField select label={t('sessionsJeu.lancer.module')} value={idCours} onChange={(e) => setIdCours(e.target.value)} helperText={t('sessionsJeu.lancer.moduleAide')}>
              {modules.map((m) => (
                <MenuItem key={m.id_cours} value={m.id_cours}>{m.code} · {m.nom}</MenuItem>
              ))}
            </TextField>
          )}
          <Box>
            <Typography variant="subtitle2" component="p" id="mode-jeu" sx={{ mb: 0.5 }}>{t('sessionsJeu.lancer.mode')}</Typography>
            <RadioGroup aria-labelledby="mode-jeu" value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map((m) => (
                <FormControlLabel
                  key={m}
                  value={m}
                  control={<Radio />}
                  sx={{ alignItems: 'flex-start', mb: 1, '& .MuiRadio-root': { pt: 0.5 } }}
                  label={
                    <Box>
                      <Box sx={{ fontWeight: 600 }}>{t(`sessionsJeu.modes.${m}.nom`)}</Box>
                      <Typography variant="body2" color="text.secondary">{t(`sessionsJeu.modes.${m}.description`)}</Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer} disabled={envoi}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={lancer} disabled={envoi || !idCours}>{t('sessionsJeu.lancer.action')}</Button>
      </DialogActions>
    </Dialog>
  );
}
