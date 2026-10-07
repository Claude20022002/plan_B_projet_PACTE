// Petits mots retirés des titres dans la grille : la colonne d'un jour ne tient que 6 à 8 lettres
const MOTS_VIDES = new Set(['de', 'des', 'du', 'la', 'le', 'les', 'et', 'à', 'au', 'aux', 'en', 'pour', 'sur', 'the', 'of', 'and', 'for', 'to', 'in']);

/**
 * Titre de cours pour une colonne étroite : sans les petits mots, et chaque mot trop long coupé
 * avant une voyelle, avec un point (« Intelligence Artificielle » → « Intell. Artific. »),
 * pour qu'aucun mot ne soit coupé au milieu par le retour à la ligne.
 */
export function abregerCours(nom, max = 8) {
  if (!nom) return '';
  const mots = nom.split(/\s+/).filter(Boolean);
  const utiles = mots.filter((m) => !MOTS_VIDES.has(m.toLowerCase()));
  return (utiles.length ? utiles : mots)
    .map((m) => {
      if (m.length <= max) return m;
      const coupe = m.slice(0, max - 1).replace(/[^\p{L}\p{N}]+$/u, '');
      // Finir sur une consonne : « Computi » → « Comput. »
      const sansVoyelle = coupe.replace(/[aeiouyàâäéèêëîïôöùûü]+$/iu, '');
      return `${sansVoyelle.length >= 3 ? sansVoyelle : coupe}.`;
    })
    .join(' ');
}
