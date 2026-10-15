import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Divider, Tooltip } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { domaineDe, familleDuSupport, tailleCourte } from './iconeSupport';

/**
 * Un support dans sa section. Toute la ligne ouvre le support ; le menu « ⋮ » (auteur ou
 * administration seulement) renomme, masque, déplace, publie dans la Bibliothèque ou retire.
 */
export default function LigneSupport({ support, gere, sections, idSection, premier, dernier, onOuvrir, onAction }) {
  const { t, i18n } = useTranslation();
  const [ancre, setAncre] = useState(null);
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
  const { Icone, libelle } = familleDuSupport(support);
  const date = support.createdAt ? new Date(support.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : null;
  const auteur = support.auteur ? `${support.auteur.prenom ?? ''} ${support.auteur.nom ?? ''}`.trim() : null;
  const details = [
    support.type === 'lien' ? domaineDe(support.url) : t(`espaceCours.familles.${libelle}`, libelle),
    tailleCourte(support.taille, locale),
    gere && auteur ? t('espaceCours.parAuteur', { auteur }) : null,
    date,
  ].filter(Boolean).join(' · ');

  const action = (nom, valeur) => () => {
    setAncre(null);
    onAction(nom, support, valeur);
  };
  const autresSections = sections.filter((s) => s.id_section !== idSection);

  return (
    <ListItem
      disablePadding
      secondaryAction={
        gere && support.modifiable ? (
          <IconButton edge="end" aria-label={t('espaceCours.actionsSupport', { titre: support.titre })} onClick={(e) => setAncre(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        ) : null
      }
    >
      <ListItemButton onClick={() => onOuvrir(support)} sx={{ borderRadius: 1, opacity: support.visible ? 1 : 0.6 }}>
        <ListItemIcon sx={{ minWidth: 44, color: 'primary.main' }}>
          <Icone aria-hidden="true" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box component="span" sx={{ fontWeight: 500 }}>{support.titre}</Box>
              {!support.visible && <Chip size="small" label={t('espaceCours.masque')} variant="outlined" />}
              {gere && support.dans_bibliotheque && (
                <Tooltip title={t('espaceCours.dansBibliothequeAide')}>
                  <Chip size="small" label={t('espaceCours.dansBibliotheque')} color="primary" variant="outlined" />
                </Tooltip>
              )}
            </Box>
          }
          secondary={details}
        />
      </ListItemButton>
      <Menu anchorEl={ancre} open={Boolean(ancre)} onClose={() => setAncre(null)}>
        <MenuItem onClick={action('renommer')}>{t('espaceCours.renommer')}</MenuItem>
        <MenuItem onClick={action('visibilite')}>{t(support.visible ? 'espaceCours.masquer' : 'espaceCours.afficher')}</MenuItem>
        {!premier && <MenuItem onClick={action('monter')}>{t('espaceCours.monter')}</MenuItem>}
        {!dernier && <MenuItem onClick={action('descendre')}>{t('espaceCours.descendre')}</MenuItem>}
        {autresSections.map((s) => (
          <MenuItem key={s.id_section} onClick={action('deplacer', s.id_section)}>
            {t('espaceCours.deplacerVers', { section: s.titre })}
          </MenuItem>
        ))}
        {support.type === 'document' && !support.dans_bibliotheque && <MenuItem onClick={action('publier')}>{t('espaceCours.publier')}</MenuItem>}
        <Divider />
        <MenuItem onClick={action('retirer')} sx={{ color: 'error.main' }}>{t('espaceCours.retirer')}</MenuItem>
      </Menu>
    </ListItem>
  );
}
