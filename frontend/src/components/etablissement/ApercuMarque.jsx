import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { ds } from '../../design-system/tokens';
import { FlapTiles } from '../../design-system/board';
import { nuancesMarque, verifierCouleur } from '../../../../shared/couleurs.js';

/**
 * Aperçu des couleurs avant d'enregistrer : un morceau de menu, le panneau de l'accueil et un
 * bouton, avec les nuances que le site calculera (design-system/marque.js). Rien n'est appliqué
 * au site tant que l'administration n'a pas enregistré.
 */
export default function ApercuMarque({ nomCourt, principale, accent, logo }) {
  const { t } = useTranslation();
  const lisibles = verifierCouleur(principale, 'principale').valide && verifierCouleur(accent, 'accent').valide;
  if (!lisibles) return null;
  const n = nuancesMarque({ couleur_principale: principale, couleur_accent: accent });

  return (
    <Box aria-label={t('etablissement.apercu')} role="img" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, borderRadius: `${ds.radius.lg}px`, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      {/* Menu */}
      <Box sx={{ bgcolor: n.navy, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ bgcolor: ds.white, borderRadius: `${ds.radius.md}px`, px: 1, py: 0.75, alignSelf: 'flex-start', minHeight: 30, display: 'flex', alignItems: 'center' }}>
          {logo ? (
            <Box component="img" src={logo} alt="" sx={{ height: 20, display: 'block' }} />
          ) : (
            <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, color: n.navy, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{nomCourt}</Typography>
          )}
        </Box>
        {/* Trois rubriques du menu, la première sélectionnée */}
        {['85%', '85%', '60%'].map((largeur, i) => (
          <Box key={i} sx={{ height: 10, borderRadius: 1, width: largeur, bgcolor: i === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)' }} />
        ))}
      </Box>
      {/* Panneau de l'accueil et bouton */}
      <Box sx={{ bgcolor: ds.boardBrut.ground, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ bgcolor: n.frame, p: '5px', borderRadius: `${ds.radius.md}px` }}>
          <Box sx={{ bgcolor: ds.boardBrut.ground, borderRadius: `${ds.radius.sm}px`, px: 1.5, py: 1.25, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {nomCourt && nomCourt !== 'Planner' && <FlapTiles value={nomCourt.toUpperCase()} size="1.25rem" />}
            <FlapTiles value="PLANNER" size="1.25rem" color={n.orange} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box component="span" sx={{ bgcolor: n.navy, color: '#FFFFFF', px: 2, py: 0.75, borderRadius: `${ds.radius.sm}px`, fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('etablissement.apercuBouton')}
          </Box>
          <Box component="span" sx={{ bgcolor: n.navySoft, color: n.navy, px: 2, py: 0.75, borderRadius: `${ds.radius.sm}px`, fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('etablissement.apercuBouton')}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
