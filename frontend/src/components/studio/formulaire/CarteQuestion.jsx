import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Divider, IconButton, ListItemIcon, Menu, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { AddPhotoAlternate, AutoAwesome, CheckCircle, ContentCopy, DeleteOutline, KeyboardArrowDown, KeyboardArrowUp, MoreVert, Subject } from '@mui/icons-material';
import { IconeType } from '../typesQuestion';
import { TYPES_ORDONNES } from '../outils';
import { ChampsChoix, ChampsVraiFaux } from '../editeur/ChampsChoix';
import { ChampsCourte, ChampsLibre, ChampsNumerique, ChampsTrous } from '../editeur/ChampsSaisie';
import { ChampsAssociation, ChampsOrdre, ChampsZone } from '../editeur/ChampsInteractifs';
import MediaEditeur from '../editeur/MediaEditeur';
import { studioAPI } from '../../../services/studioApi';
import useSauvegardeAuto from './useSauvegardeAuto';
import { changerType } from './brouillon';

const CHAMPS = { choix_unique: ChampsChoix, choix_multiple: ChampsChoix, vrai_faux: ChampsVraiFaux, reponse_courte: ChampsCourte, numerique: ChampsNumerique, texte_trous: ChampsTrous, association: ChampsAssociation, ordre: ChampsOrdre, zone_image: ChampsZone, reponse_libre: ChampsLibre };
const COULEUR_STATUT = { enregistree: 'text.secondary', en_cours: 'text.secondary', attente: 'text.secondary', incomplete: 'warning.main', erreur: 'error.main' };

/**
 * La question en cours d'édition, comme une carte de Google Forms : l'énoncé et le type sur une
 * ligne, les réponses dessous, puis une barre d'outils (média, explication, déplacer, dupliquer,
 * supprimer, points). Rien à enregistrer : la carte s'enregistre seule dès qu'elle est complète.
 */
export default function CarteQuestion({ idQuestionnaire, element, numero, premiere, derniere, medias, dispo, onMediaMaj, onChange, onEnregistree, onRemplacee, onDupliquer, onSupprimer, onDeplacer }) {
  const { t } = useTranslation();
  const { brouillon, enregistree } = element;
  const sauvegarde = useSauvegardeAuto({ idQuestionnaire, brouillon, enregistree, onEnregistree });
  const [avecMedia, setAvecMedia] = useState(Boolean(brouillon.id_media));
  const [avecExplication, setAvecExplication] = useState(Boolean(brouillon.explication));
  const [menu, setMenu] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const media = brouillon.id_media ? medias[brouillon.id_media] : null;
  const Champs = CHAMPS[brouillon.type];
  const maj = (champs) => onChange({ ...brouillon, ...champs });

  // Régénérer ou illustrer avec l'IA : la question rendue par le serveur remplace le brouillon
  const ia = async (appel) => {
    setMenu(null);
    setOccupe(true);
    try {
      const r = await appel();
      if (r?.media) onMediaMaj(r.media);
      onRemplacee(r?.question ?? r);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, boxShadow: 3, p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
        <TextField
          autoFocus={!enregistree}
          variant="filled"
          multiline
          fullWidth
          placeholder={t('studio.formulaire.question', { n: numero })}
          value={brouillon.enonce}
          onChange={(e) => maj({ enonce: e.target.value })}
          inputProps={{ maxLength: 1500, 'aria-label': t('studio.formulaire.question', { n: numero }) }}
        />
        <Select
          size="small"
          value={brouillon.type}
          onChange={(e) => onChange(changerType(brouillon, e.target.value))}
          sx={{ minWidth: { sm: 230 } }}
          inputProps={{ 'aria-label': t('studio.formulaire.type') }}
          renderValue={(type) => (
            <Stack direction="row" spacing={1} alignItems="center">
              <IconeType type={type} fontSize="small" color="primary" />
              <span>{t(`studio.types.${type}.nom`)}</span>
            </Stack>
          )}
        >
          {TYPES_ORDONNES.map((type) => (
            <MenuItem key={type} value={type}>
              <ListItemIcon>
                <IconeType type={type} fontSize="small" />
              </ListItemIcon>
              {t(`studio.types.${type}.nom`)}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {(enregistree?.a_relire || enregistree?.origine === 'ia') && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {enregistree.a_relire && <Chip size="small" color="warning" label={t('studio.editeur.aRelire')} />}
          {enregistree.origine === 'ia' && <Chip size="small" variant="outlined" icon={<AutoAwesome />} label={t('studio.question.origineIa')} />}
        </Stack>
      )}

      <Stack spacing={2.5} sx={{ mt: 2.5 }}>
        {avecMedia && <MediaEditeur question={brouillon} media={media} dispo={dispo} onMediaMaj={onMediaMaj} onChanger={maj} />}
        <Champs question={brouillon} maj={(donnees) => maj({ donnees })} srcImage={media?.type === 'image' ? studioAPI.urlMedia(media.id_media) : null} />
        {avecExplication && (
          <TextField label={t('studio.question.explication')} multiline value={brouillon.explication ?? ''} onChange={(e) => maj({ explication: e.target.value })} inputProps={{ maxLength: 1500 }} fullWidth size="small" />
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
        <Typography variant="caption" role="status" sx={{ flex: '1 1 200px', color: COULEUR_STATUT[sauvegarde.statut] }}>
          {t(`studio.formulaire.statuts.${sauvegarde.statut}`, { raison: sauvegarde.message })}
        </Typography>
        {enregistree?.a_relire && sauvegarde.statut === 'enregistree' && (
          <Button size="small" color="success" startIcon={<CheckCircle />} disabled={occupe} onClick={() => ia(() => studioAPI.marquerRelue(enregistree.id_question))}>
            {t('studio.question.valider')}
          </Button>
        )}
        <Tooltip title={t('studio.formulaire.media')}>
          <IconButton onClick={() => setAvecMedia((v) => !v)} color={avecMedia ? 'primary' : 'default'} aria-pressed={avecMedia}>
            <AddPhotoAlternate />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('studio.formulaire.explication')}>
          <IconButton onClick={() => setAvecExplication((v) => !v)} color={avecExplication ? 'primary' : 'default'} aria-pressed={avecExplication}>
            <Subject />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('studio.editeur.monter')}>
          <span>
            <IconButton onClick={() => onDeplacer(-1)} disabled={premiere || !enregistree}>
              <KeyboardArrowUp />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('studio.editeur.descendre')}>
          <span>
            <IconButton onClick={() => onDeplacer(1)} disabled={derniere || !enregistree}>
              <KeyboardArrowDown />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('studio.question.dupliquer')}>
          <span>
            <IconButton onClick={onDupliquer} disabled={!enregistree || occupe}>
              <ContentCopy />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('studio.question.supprimer')}>
          <IconButton onClick={onSupprimer} disabled={occupe}>
            <DeleteOutline />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <TextField
          type="number"
          size="small"
          label={t('studio.question.points')}
          value={brouillon.points}
          onChange={(e) => maj({ points: e.target.value === '' ? '' : Number(e.target.value) })}
          inputProps={{ min: 0, max: 100, step: 0.5 }}
          sx={{ width: 90 }}
        />
        {enregistree && (dispo?.texte || dispo?.image) && brouillon.type !== 'zone_image' && (
          <IconButton onClick={(e) => setMenu(e.currentTarget)} aria-label={t('studio.banque.actions')} aria-haspopup="menu">
            <MoreVert />
          </IconButton>
        )}
      </Stack>
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {dispo?.texte && <MenuItem onClick={() => ia(() => studioAPI.regenerer(enregistree.id_question))}>{t('studio.question.regenerer')}</MenuItem>}
        {dispo?.image && <MenuItem onClick={() => ia(() => studioAPI.illustrer(enregistree.id_question, ''))}>{t('studio.question.illustrer')}</MenuItem>}
      </Menu>
    </Paper>
  );
}
