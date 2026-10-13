/**
 * Styles partagés des cartes (DESIGN.md, Cards et Liste des séances) : surface, ombre selon le
 * mode, titre de carte et largeur des colonnes de la liste des séances.
 */
import { ds } from '../tokens';

/** Ombre de carte selon le mode : douce en clair, aucune la nuit (le relief vient du filet). */
export const ombreCarte = (theme) => (theme.palette.mode === 'dark' ? 'none' : ds.shadow.card);

/** Ombre relevée (carte en vedette, survol d'une carte cliquable), aucune la nuit. */
export const ombreRelevee = (theme) => (theme.palette.mode === 'dark' ? 'none' : ds.shadow.raised);

/** Style d'une carte posée sur le sol : fond, filet, rayon et ombre. */
export const carteSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${ds.radius.md}px`,
  boxShadow: ombreCarte,
  overflow: 'hidden',
};

/** Titre de carte (Title) : Barlow 600 en casse normale. */
export const titreCarteSx = { fontFamily: ds.font.body, fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.3 };

/** Largeur des colonnes fixes de la liste des séances, en pixels (les autres se partagent le reste). */
export const largeurColonne = (compact) => ({
  time: compact ? 56 : 80,
  room: compact ? 72 : 120,
  group: 120,
  teacher: 180,
  status: compact ? 96 : 140,
});
