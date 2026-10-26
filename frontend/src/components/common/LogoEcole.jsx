import { useState } from 'react';
import { Box } from '@mui/material';
import { ds } from '../../design-system/tokens';
import { adresseLogo, identiteEcole } from '../../services/etablissement';

// Hauteur simple (26) ou par taille d'écran ({ xs: 24, md: 28 }), multipliée
const echelle = (hauteur, facteur) =>
  typeof hauteur === 'object' ? Object.fromEntries(Object.entries(hauteur).map(([cle, valeur]) => [cle, valeur * facteur])) : hauteur * facteur;

/**
 * Logo de l'école (panneau de configuration, D-21). Sans logo, ou si l'image ne se charge pas,
 * le nom court de l'école à la même hauteur, dans la couleur de l'école : jamais un logo d'une
 * autre école. Posé sur fond blanc (cadre blanc du menu et de l'accueil, page de connexion).
 */
export default function LogoEcole({ hauteur = 26, sx }) {
  const identite = identiteEcole();
  const adresse = adresseLogo(identite);
  const [echec, setEchec] = useState(false);

  if (adresse && !echec) {
    return <Box component="img" src={adresse} alt={identite.nom} onError={() => setEchec(true)} sx={{ height: hauteur, maxWidth: '100%', display: 'block', ...sx }} />;
  }
  return (
    <Box
      component="span"
      role="img"
      aria-label={identite.nom}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: hauteur,
        fontFamily: ds.font.board,
        fontWeight: 700,
        fontSize: echelle(hauteur, 0.8),
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1,
        color: ds.brand.navy,
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {identite.nom_court}
    </Box>
  );
}
