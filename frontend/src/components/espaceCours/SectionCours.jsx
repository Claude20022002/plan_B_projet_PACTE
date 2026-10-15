import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, IconButton, List, Menu, MenuItem, Divider, Paper, Typography } from '@mui/material';
import { AddLink, MoreVert } from '@mui/icons-material';
import LigneSupport from './LigneSupport';
import ZoneDepot from './ZoneDepot';

/**
 * Une section de l'espace de cours : son titre, ses supports, et pour l'enseignant la zone de
 * dépôt, l'ajout d'un lien et le menu de la section (renommer, masquer, monter, descendre,
 * supprimer si elle est vide). L'étudiant ne voit que le titre et les supports.
 */
export default function SectionCours({ section, sections, gere, premiere, derniere, onOuvrir, onActionSupport, onActionSection, onRecharger }) {
  const { t } = useTranslation();
  const [ancre, setAncre] = useState(null);
  const titreId = `section-${section.id_section}`;
  const action = (nom) => () => {
    setAncre(null);
    onActionSection(nom, section);
  };

  return (
    <Paper variant="outlined" component="section" aria-labelledby={titreId} sx={{ p: { xs: 1.5, sm: 2 }, opacity: section.visible ? 1 : 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: section.supports.length || gere ? 1 : 0 }}>
        <Typography id={titreId} component="h2" variant="h6" sx={{ flex: 1, textTransform: 'none', letterSpacing: 0, fontSize: '1.0625rem', fontWeight: 600 }}>
          {section.titre}
        </Typography>
        {!section.visible && <Chip size="small" variant="outlined" label={t('espaceCours.sectionMasquee')} />}
        {gere && (
          <IconButton aria-label={t('espaceCours.actionsSection', { titre: section.titre })} onClick={(e) => setAncre(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        )}
      </Box>

      {section.supports.length > 0 ? (
        <List dense disablePadding>
          {section.supports.map((s, i) => (
            <LigneSupport
              key={s.id_support}
              support={s}
              gere={gere}
              sections={sections}
              idSection={section.id_section}
              premier={i === 0}
              dernier={i === section.supports.length - 1}
              onOuvrir={onOuvrir}
              onAction={onActionSupport}
            />
          ))}
        </List>
      ) : (
        gere && <Typography variant="body2" color="text.secondary">{t('espaceCours.sectionVide')}</Typography>
      )}

      {gere && (
        <>
          <ZoneDepot idSection={section.id_section} onDepose={onRecharger} />
          <Button size="small" startIcon={<AddLink />} onClick={() => onActionSection('lien', section)} sx={{ mt: 1, textTransform: 'none' }}>
            {t('espaceCours.ajouterLien')}
          </Button>
        </>
      )}

      <Menu anchorEl={ancre} open={Boolean(ancre)} onClose={() => setAncre(null)}>
        <MenuItem onClick={action('renommer')}>{t('espaceCours.renommer')}</MenuItem>
        <MenuItem onClick={action('visibilite')}>{t(section.visible ? 'espaceCours.masquerSection' : 'espaceCours.afficherSection')}</MenuItem>
        {!premiere && <MenuItem onClick={action('monter')}>{t('espaceCours.monter')}</MenuItem>}
        {!derniere && <MenuItem onClick={action('descendre')}>{t('espaceCours.descendre')}</MenuItem>}
        <Divider />
        <MenuItem onClick={action('supprimer')} disabled={section.supports.length > 0} sx={{ color: 'error.main' }}>
          {t(section.supports.length ? 'espaceCours.supprimerSectionPleine' : 'espaceCours.supprimerSection')}
        </MenuItem>
      </Menu>
    </Paper>
  );
}
