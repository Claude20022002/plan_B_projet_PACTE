import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Menu, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { AutoAwesome, CheckCircle, MoreVert, Save } from '@mui/icons-material';
import { validerQuestion } from '../../../../../shared/quiz/studio/types.js';
import { studioAPI } from '../../../services/studioApi';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDialog from '../../common/ConfirmDialog';
import { IconeType } from '../typesQuestion';
import { ChampsChoix, ChampsVraiFaux } from './ChampsChoix';
import { ChampsCourte, ChampsLibre, ChampsNumerique, ChampsTrous } from './ChampsSaisie';
import { ChampsAssociation, ChampsOrdre, ChampsZone } from './ChampsInteractifs';
import MediaEditeur from './MediaEditeur';

/**
 * Édition d'une question : énoncé, champs propres au type, média, points, temps en direct
 * (facultatif : sinon celui de la diffusion), explication. La
 * validation tourne à chaque frappe (même règles que le serveur, shared/quiz/studio/types.js) et
 * dit ce qui manque avant d'enregistrer. Enregistrer une question proposée par l'IA vaut relecture.
 */

const CHAMPS = { choix_unique: ChampsChoix, choix_multiple: ChampsChoix, vrai_faux: ChampsVraiFaux, reponse_courte: ChampsCourte, numerique: ChampsNumerique, texte_trous: ChampsTrous, association: ChampsAssociation, ordre: ChampsOrdre, zone_image: ChampsZone, reponse_libre: ChampsLibre };

const vide = (liste) => (liste ?? []).map((x) => String(x ?? '').trim()).filter(Boolean);

/** Retire les lignes vides des listes éditées une valeur par ligne. */
const nettoyer = (q) => {
  const d = { ...q.donnees };
  if (d.acceptees) d.acceptees = vide(d.acceptees);
  if (d.distracteurs) d.distracteurs = vide(d.distracteurs);
  if (d.trous) d.trous = d.trous.map((tr) => ({ ...tr, acceptees: vide(tr.acceptees), ...(vide(tr.options).length ? { options: vide(tr.options) } : { options: undefined }) }));
  return { type: q.type, enonce: q.enonce, points: q.points, explication: q.explication || null, id_media: q.id_media ?? null, extrait: q.extrait ?? null, duree_s: q.duree_s ?? null, donnees: d };
};

export default function EditeurQuestion({ idQuestionnaire, question, numero, medias, onMediaMaj, onEnregistree, onSupprimee, onDupliquee, dispo }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [brouillon, setBrouillon] = useState(question);
  const [envoi, setEnvoi] = useState(false);
  const [menu, setMenu] = useState(null);
  const [supprimer, setSupprimer] = useState(false);
  const [illustrer, setIllustrer] = useState(null);

  useEffect(() => setBrouillon(question), [question]);

  const modifiee = useMemo(() => JSON.stringify(nettoyer(brouillon)) !== JSON.stringify(nettoyer(question)), [brouillon, question]);
  const verification = useMemo(() => validerQuestion(nettoyer(brouillon)), [brouillon]);
  const media = brouillon.id_media ? medias[brouillon.id_media] : null;
  const Champs = CHAMPS[brouillon.type];
  // Question ajoutée mais pas encore enregistrée : le serveur la crée au premier enregistrement
  const nouvelle = !question.id_question;

  const enregistrer = async () => {
    if (!verification.ok) return toast.error(verification.raison);
    setEnvoi(true);
    try {
      onEnregistree(nouvelle ? await studioAPI.ajouterQuestion(idQuestionnaire, nettoyer(brouillon)) : await studioAPI.modifierQuestion(question.id_question, nettoyer(brouillon)));
      toast.success(t('studio.question.enregistree'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  // Ctrl+S (ou Cmd+S) enregistre, partout dans l'éditeur
  useEffect(() => {
    const clavier = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (modifiee || question.a_relire) enregistrer();
      }
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  });

  const action = async (fn, messageOk) => {
    setMenu(null);
    setEnvoi(true);
    try {
      const r = await fn();
      if (messageOk) toast.success(messageOk);
      return r;
    } catch (e) {
      toast.error(e.message);
      return null;
    } finally {
      setEnvoi(false);
    }
  };

  const valider = async () => {
    const r = await action(() => studioAPI.marquerRelue(question.id_question));
    if (r) onEnregistree(r);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <IconeType type={brouillon.type} color="primary" />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          {numero}. {t(`studio.types.${brouillon.type}.nom`)}
        </Typography>
        {question.a_relire && <Chip size="small" color="warning" label={t('studio.editeur.aRelire')} />}
        {question.origine === 'ia' && <Chip size="small" variant="outlined" icon={<AutoAwesome />} label={t('studio.question.origineIa')} />}
        {question.source && <Chip size="small" variant="outlined" label={t('studio.question.source', { source: question.source })} />}
        <Box sx={{ flex: 1 }} />
        {!nouvelle && (
          <IconButton onClick={(e) => setMenu(e.currentTarget)} aria-label={t('studio.banque.actions')} aria-haspopup="menu">
            <MoreVert />
          </IconButton>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t(`studio.types.${brouillon.type}.aide`)}
      </Typography>

      <Stack spacing={2.5}>
        <TextField label={t('studio.question.enonce')} multiline minRows={2} value={brouillon.enonce} onChange={(e) => setBrouillon({ ...brouillon, enonce: e.target.value })} helperText={t('studio.question.enonceAide')} inputProps={{ maxLength: 1500 }} fullWidth />
        <MediaEditeur question={brouillon} media={media} dispo={dispo} onMediaMaj={onMediaMaj} onChanger={(champs) => setBrouillon({ ...brouillon, ...champs })} />
        <Champs question={brouillon} maj={(donnees) => setBrouillon({ ...brouillon, donnees })} srcImage={media?.type === 'image' ? studioAPI.urlMedia(media.id_media) : null} />
        <Divider />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField type="number" label={t('studio.question.points')} value={brouillon.points} onChange={(e) => setBrouillon({ ...brouillon, points: e.target.value === '' ? '' : Number(e.target.value) })} inputProps={{ min: 0, max: 100, step: 0.5 }} sx={{ width: { sm: 120 } }} />
          <TextField
            type="number"
            label={t('studio.question.duree')}
            value={brouillon.duree_s ?? ''}
            onChange={(e) => setBrouillon({ ...brouillon, duree_s: e.target.value === '' ? null : Number(e.target.value) })}
            helperText={t('studio.question.dureeAide')}
            inputProps={{ min: 5, max: 120, step: 5 }}
            sx={{ width: { sm: 220 }, flexShrink: 0 }}
          />
          <TextField label={t('studio.question.explication')} multiline minRows={1} value={brouillon.explication ?? ''} onChange={(e) => setBrouillon({ ...brouillon, explication: e.target.value })} inputProps={{ maxLength: 1500 }} fullWidth />
        </Stack>
      </Stack>

      {!verification.ok && (modifiee || question.a_relire) && (
        <Alert severity="warning" sx={{ mt: 2 }} role="status">
          {verification.raison}
        </Alert>
      )}
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mt: 3 }}>
        <Typography variant="caption" color={modifiee ? 'warning.main' : 'text.secondary'} sx={{ flex: 1 }} role="status">
          {modifiee ? t('studio.question.modifiee') : t('studio.question.raccourci')}
        </Typography>
        {question.a_relire && !modifiee ? (
          <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={valider} disabled={envoi || !verification.ok}>
            {t('studio.question.valider')}
          </Button>
        ) : (
          <Button variant="contained" startIcon={<Save />} onClick={enregistrer} disabled={envoi || !modifiee}>
            {question.a_relire ? t('studio.question.enregistrerRelire') : t('studio.question.enregistrer')}
          </Button>
        )}
      </Stack>

      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={async () => { const r = await action(() => studioAPI.dupliquerQuestion(question.id_question)); if (r) onDupliquee(r); }}>{t('studio.question.dupliquer')}</MenuItem>
        {dispo?.texte && brouillon.type !== 'zone_image' && (
          <MenuItem onClick={async () => { const r = await action(() => studioAPI.regenerer(question.id_question), t('studio.question.regeneree')); if (r) onEnregistree(r); }}>{t('studio.question.regenerer')}</MenuItem>
        )}
        {dispo?.image && brouillon.type !== 'zone_image' && <MenuItem onClick={() => { setMenu(null); setIllustrer(''); }}>{t('studio.question.illustrer')}</MenuItem>}
        <MenuItem onClick={() => { setMenu(null); setSupprimer(true); }} sx={{ color: 'error.main' }}>{t('studio.question.supprimer')}</MenuItem>
      </Menu>
      <ConfirmDialog open={supprimer} title={t('studio.question.supprimer')} message={brouillon.enonce.slice(0, 160)} confirmLabel={t('common.delete')} onCancel={() => setSupprimer(false)} onConfirm={async () => { setSupprimer(false); const ok = await action(() => studioAPI.supprimerQuestion(question.id_question), t('studio.question.supprimee')); if (ok !== null) onSupprimee(question.id_question); }} />
      <Dialog open={illustrer !== null} onClose={() => setIllustrer(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('studio.question.illustrer')}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField fullWidth multiline minRows={2} label={t('studio.question.illustrerConsigne')} value={illustrer ?? ''} onChange={(e) => setIllustrer(e.target.value)} inputProps={{ maxLength: 600 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIllustrer(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" startIcon={<AutoAwesome />} disabled={envoi} onClick={async () => { const consigne = illustrer; setIllustrer(null); const r = await action(() => studioAPI.illustrer(question.id_question, consigne), t('studio.question.illustree')); if (r) { onMediaMaj(r.media); onEnregistree(r.question); } }}>
            {t('studio.question.illustrer')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
