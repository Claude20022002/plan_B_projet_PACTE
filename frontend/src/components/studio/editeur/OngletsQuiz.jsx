import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import { Assessment, QrCode2 } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDialog from '../../common/ConfirmDialog';
import FormReglages from './FormReglages';
import CodeAcces from './CodeAcces';
import { ChampEtiquettes } from './NouveauQuizDialog';
import { localeEcran } from '../../../utils/dates';

/** Onglet « Réglages » : titre, consignes, étiquettes et réglages par défaut du quiz. */
export function OngletReglages({ quiz, onModifie }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [champs, setChamps] = useState({ titre: quiz.titre, description: quiz.description ?? '', etiquettes: quiz.etiquettes, reglages: quiz.reglages });
  const [envoi, setEnvoi] = useState(false);
  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      onModifie(await studioAPI.modifier(quiz.id_questionnaire, champs));
      toast.success(t('studio.reglages.enregistres'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <Paper component="form" onSubmit={enregistrer} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, maxWidth: 760 }}>
      <Stack spacing={2}>
        <TextField label={t('studio.reglages.titreQuiz')} value={champs.titre} onChange={(e) => setChamps({ ...champs, titre: e.target.value })} required inputProps={{ maxLength: 200 }} />
        <TextField label={t('studio.reglages.description')} value={champs.description} onChange={(e) => setChamps({ ...champs, description: e.target.value })} multiline minRows={2} inputProps={{ maxLength: 2000 }} />
        <ChampEtiquettes valeur={champs.etiquettes} onChange={(etiquettes) => setChamps({ ...champs, etiquettes })} />
        <Box>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
            {t('studio.reglages.titre')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('studio.reglages.aide')}
          </Typography>
          <FormReglages reglages={champs.reglages} onChange={(reglages) => setChamps({ ...champs, reglages })} />
        </Box>
        <Box>
          <Button type="submit" variant="contained" disabled={envoi || !champs.titre.trim()}>
            {t('studio.reglages.enregistrer')}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

/** Onglet « Passations » : code et QR code de chacune, état, copies, accès aux résultats. */
export function OngletPassations({ quiz, rafraichir }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [sessions, setSessions] = useState(null);
  const [acces, setAcces] = useState(null);
  const [aFermer, setAFermer] = useState(null);

  const charger = useCallback(() => studioAPI.sessions(quiz.id_questionnaire).then(setSessions).catch(() => setSessions([])), [quiz.id_questionnaire]);
  useEffect(() => {
    charger();
  }, [charger, rafraichir]);

  const changerStatut = async (s, statut) => {
    try {
      await studioAPI.modifierSession(s.id_session, { statut });
      charger();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (sessions === null) return null;
  if (!sessions.length) return <Typography color="text.secondary">{t('studio.passation.aucune')}</Typography>;
  const date = (d) => new Date(d).toLocaleString(localeEcran(i18n.language), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
      <List disablePadding>
        {sessions.map((s) => (
          <ListItem key={s.id_session} divider sx={{ flexWrap: 'wrap', gap: 1.5, py: 1.5 }}>
            <ListItemText
              sx={{ flex: '1 1 260px' }}
              primary={
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>{s.code}</Typography>
                  <Chip size="small" color={s.statut === 'ouverte' ? 'success' : 'default'} variant={s.statut === 'ouverte' ? 'filled' : 'outlined'} label={s.statut === 'ouverte' ? t('studio.passation.ouverte') : t('studio.passation.fermee')} />
                  <Typography variant="body2">{s.titre}</Typography>
                </Stack>
              }
              secondary={[
                date(s.cree_le),
                t('studio.passation.copies', { count: s.copies_rendues }),
                s.copies_en_cours ? t('studio.passation.enCours', { count: s.copies_en_cours }) : null,
                s.moyenne !== null ? t('studio.passation.moyenne', { valeur: s.moyenne }) : null,
                s.fermeture ? t('studio.passation.jusqua', { date: date(s.fermeture) }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {s.statut === 'ouverte' && (
                <Button size="small" startIcon={<QrCode2 />} onClick={() => setAcces(s)}>
                  {t('studio.passation.qr')}
                </Button>
              )}
              <Button size="small" variant="outlined" startIcon={<Assessment />} onClick={() => navigate(`/studio-quiz/passations/${s.id_session}`)}>
                {t('studio.passation.resultats')}
              </Button>
              {s.statut === 'ouverte' ? (
                <Button size="small" color="error" onClick={() => setAFermer(s)}>
                  {t('studio.passation.fermer')}
                </Button>
              ) : (
                <Button size="small" onClick={() => changerStatut(s, 'ouverte')}>
                  {t('studio.passation.rouvrir')}
                </Button>
              )}
            </Stack>
          </ListItem>
        ))}
      </List>
      <Dialog open={Boolean(acces)} onClose={() => setAcces(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{acces?.titre}</DialogTitle>
        <DialogContent>{acces && <CodeAcces code={acces.code} titre={acces.titre} />}</DialogContent>
        <DialogActions>
          <Button onClick={() => setAcces(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={Boolean(aFermer)}
        title={t('studio.passation.fermerTitre')}
        message={t('studio.passation.fermerTexte')}
        confirmLabel={t('studio.passation.fermer')}
        onCancel={() => setAFermer(null)}
        onConfirm={() => {
          changerStatut(aFermer, 'fermee');
          setAFermer(null);
        }}
      />
    </Paper>
  );
}
