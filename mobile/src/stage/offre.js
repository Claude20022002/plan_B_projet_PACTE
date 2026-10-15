/**
 * Offres partagées par un lien : dates du formulaire (saisies en jj/mm/aaaa, envoyées en ISO) et
 * champs obligatoires avant publication.
 */

/** « 2026-12-15 » → « 15/12/2026 » */
export const dateLisible = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

/** « 15/12/2026 » → « 2026-12-15 » ; vide : null ; date mal formée ou impossible : false */
export const versDateIso = (saisie) => {
  const texte = (saisie ?? '').trim();
  if (!texte) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texte);
  if (!m) return false;
  const [, j, mo, a] = m.map(Number);
  const date = new Date(Date.UTC(a, mo - 1, j));
  if (date.getUTCDate() !== j || date.getUTCMonth() !== mo - 1) return false;
  return date.toISOString().slice(0, 10);
};

/** Lien d'offre acceptable : https seulement (comme le serveur) */
export const lienHttps = (url) => /^https:\/\/\S+\.\S+/.test((url ?? '').trim());

/** Le formulaire est-il publiable ? (poste, entreprise, lien https, date lisible si donnée) */
export const offreValide = (c) => Boolean(c.title.trim() && c.company_name.trim() && lienHttps(c.apply_url) && versDateIso(c.deadline) !== false);
