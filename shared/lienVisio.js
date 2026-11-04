/**
 * Lien de visioconférence d'une séance à distance (plan multi-établissements, lot EC-11 ;
 * conception-ec11-groupe-b.md, règle V-2). Partagé par le serveur, le site et l'application : la
 * même adresse est refusée partout, avec le même motif.
 *
 * Pas de liste fermée de fournisseurs (chaque école a le sien) : une adresse https, 500 caractères
 * au plus, un nom d'hôte avec un point, sans identifiant ni mot de passe dans l'adresse.
 */

export const LONGUEUR_MAX_LIEN_VISIO = 500;

/** Rend null si l'adresse est acceptable, sinon le motif : 'longueur', 'adresse', 'https', 'hote' ou 'identifiants'. */
export const motifLienVisioRefuse = (adresse) => {
  const texte = String(adresse ?? '').trim();
  if (texte.length > LONGUEUR_MAX_LIEN_VISIO) return 'longueur';
  let url;
  try {
    url = new URL(texte);
  } catch {
    return 'adresse';
  }
  if (url.protocol !== 'https:') return 'https';
  if (!url.hostname.includes('.') || url.hostname.endsWith('.')) return 'hote';
  if (url.username || url.password) return 'identifiants';
  return null;
};

/** Vrai pour une adresse acceptable (règle V-2). */
export const lienVisioValide = (adresse) => motifLienVisioRefuse(adresse) === null;

/** Nom de domaine montré sur le bouton « Rejoindre » (« meet.google.com ») ; '' si l'adresse est illisible. */
export const domaineDuLien = (adresse) => {
  try {
    return new URL(String(adresse)).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};
