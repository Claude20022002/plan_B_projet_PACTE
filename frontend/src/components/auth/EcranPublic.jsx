import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import { ds } from '../../design-system/tokens';
import { FlapTiles } from '../../design-system/board';
import PanneauAccueil from './PanneauAccueil';
import useTitreOnglet from '../../hooks/useTitreOnglet';
import LogoEcole from '../common/LogoEcole';
import { identiteEcole } from '../../services/etablissement';
import { photosEcole } from '../../design-system/photosEcole';

/**
 * Mise en page des écrans publics (connexion, mot de passe oublié, réinitialisation) : le panneau
 * sur la photo d'une salle à gauche, le logo, le choix de la langue et le formulaire à droite.
 * Sur téléphone, le panneau devient un bandeau. Avant l'audit du 15 octobre, les pages du mot de
 * passe avaient leur propre style.
 */
export default function EcranPublic({ children }) {
  const { t, i18n } = useTranslation();
  const ecole = identiteEcole();
  const photo = photosEcole(ecole.nom_court)?.salle;

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, bgcolor: 'background.paper' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: ds.board.ground,
          // Une vraie salle de l'école derrière le panneau, si elle en a une photo : voile léger au
          // centre (la salle se voit), plus dense vers les bords ; le panneau garde son fond noir
          backgroundImage: photo
            ? `radial-gradient(ellipse at 50% 55%, rgba(11, 11, 13, 0.35) 0%, rgba(11, 11, 13, 0.55) 55%, rgba(11, 11, 13, 0.85) 100%), url(${photo})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: '50% 60%',
          px: { md: 5, lg: 8 },
          py: 6,
        }}
      >
        <PanneauAccueil />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Téléphone : le panneau en bandeau, première chose que voit un étudiant */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, bgcolor: ds.board.frame, p: '6px' }}>
          <Box sx={{ bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px`, px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ecole.nom_court !== 'Planner' && <FlapTiles value={ecole.nom_court.toUpperCase()} size="1.5rem" />}
            <FlapTiles value="PLANNER" size="1.5rem" color={ds.brand.orange} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 3 } }}>
          <LogoEcole hauteur={{ xs: 32, sm: 38 }} />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={i18n.language}
            onChange={(_, value) => value && i18n.changeLanguage(value)}
            aria-label={t('common.language')}
            sx={{ '& .MuiToggleButton-root': { fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.08em', px: 1.25, py: 0.25 } }}
          >
            {LANGUAGES.map((lang) => (
              <ToggleButton key={lang.code} value={lang.code} aria-label={lang.label}>
                {lang.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 4 }, py: { xs: 4, sm: 6 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

/** Titre et phrase d'introduction d'un écran public, au style de la connexion ; c'est aussi le titre de l'onglet. */
export function TitreEcran({ titre, sousTitre }) {
  useTitreOnglet(titre);
  return (
    <>
      <Typography component="h1" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: { xs: '2rem', sm: '2.25rem' }, lineHeight: 1.1 }}>
        {titre}
      </Typography>
      {sousTitre && <Typography sx={{ mt: 1, mb: 3.5, color: 'text.secondary', fontSize: '1rem' }}>{sousTitre}</Typography>}
    </>
  );
}
