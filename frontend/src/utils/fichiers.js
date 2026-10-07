/**
 * Fichiers déposés (copies et énoncés de devoirs) : mêmes types que le serveur
 * (backend/utils/fichiers.js). Certains navigateurs ne donnent pas le type d'une archive ou d'un
 * document Office : il est alors déduit de l'extension.
 */

const PAR_EXTENSION = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const TYPES_DEVOIRS = [...new Set([...Object.values(PAR_EXTENSION), 'application/x-zip-compressed'])];
export const ACCEPT_DEVOIRS = [...Object.keys(PAR_EXTENSION).map((e) => `.${e}`), ...TYPES_DEVOIRS].join(',');
export const TAILLE_MAX_DEVOIR = 10 * 1024 * 1024;

/** Type MIME d'un fichier choisi, déduit de l'extension si le navigateur ne le donne pas. */
export const typeDuFichier = (fichier) => {
  if (fichier?.type && TYPES_DEVOIRS.includes(fichier.type)) return fichier.type;
  const extension = String(fichier?.name ?? '').split('.').pop().toLowerCase();
  return PAR_EXTENSION[extension] ?? fichier?.type ?? '';
};

/** Erreur à afficher (clé de traduction) ou null si le fichier convient. */
export const erreurFichierDevoir = (fichier) => {
  if (!TYPES_DEVOIRS.includes(typeDuFichier(fichier))) return 'jeux.devoirs.typeFichierRefuse';
  if (fichier.size > TAILLE_MAX_DEVOIR) return 'jeux.devoirs.tailleFichier';
  return null;
};

export const tailleLisible = (octets) => (octets < 1024 * 1024 ? `${Math.max(1, Math.round(octets / 1024))} Ko` : `${(octets / 1024 / 1024).toFixed(1)} Mo`);
