import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { COULEURS_REPONSES, encrePour } from '../../../../shared/quiz/couleurs.js';

// Arrivée d'un joueur dans la salle d'attente (sans mouvement sous prefers-reduced-motion : index.css)
const arrivee = keyframes`
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
`;

/** Couleur stable d'un pseudo (même pseudo, même couleur), tirée de la palette de jeu. */
const couleurDe = (nom) => {
  let somme = 0;
  for (const c of String(nom)) somme = (somme * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS_REPONSES[somme % COULEURS_REPONSES.length];
};

/** Joueur arrivé dans la salle d'attente : pastille ronde à son initiale, puis son pseudo. */
export default function BulleJoueur({ nom }) {
  const couleur = couleurDe(nom);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        pl: 0.5,
        pr: 1.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        fontWeight: 600,
        fontSize: 'clamp(0.95rem, 2.2vh, 1.25rem)',
        animation: `${arrivee} 220ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      <Box component="span" aria-hidden="true" sx={{ width: '1.9em', height: '1.9em', flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: couleur, color: encrePour(couleur), fontWeight: 700 }}>
        {String(nom).trim().charAt(0).toUpperCase()}
      </Box>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {nom}
      </Box>
    </Box>
  );
}
