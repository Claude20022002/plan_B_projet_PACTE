import { Description, FolderZip, Image, InsertDriveFile, Link as LienIcon, PictureAsPdf, Slideshow, TableChart } from '@mui/icons-material';

/**
 * Icône et libellé court d'un support, d'après son type MIME (le type réel, lu par la
 * Bibliothèque au dépôt) : ce que l'enseignant et l'étudiant reconnaissent d'un coup d'œil.
 */
const FAMILLES = [
  [/pdf/, PictureAsPdf, 'PDF'],
  [/presentation|powerpoint/, Slideshow, 'Diaporama'],
  [/spreadsheet|excel|csv/, TableChart, 'Tableur'],
  [/word|opendocument\.text|msword/, Description, 'Texte'],
  [/^image\//, Image, 'Image'],
  [/zip/, FolderZip, 'Archive'],
  [/^text\//, Description, 'Texte'],
];

export const familleDuSupport = (support) => {
  if (support.type === 'lien') return { Icone: LienIcon, libelle: 'Lien' };
  const trouvee = FAMILLES.find(([motif]) => motif.test(support.type_mime ?? ''));
  return trouvee ? { Icone: trouvee[1], libelle: trouvee[2] } : { Icone: InsertDriveFile, libelle: 'Fichier' };
};

/** Taille lisible : « 850 Ko », « 1,2 Mo ». */
export const tailleCourte = (octets, locale = 'fr-FR') => {
  if (!Number.isFinite(octets) || octets <= 0) return null;
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  return `${(octets / 1024 / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} Mo`;
};

/** Domaine d'un lien, montré à côté du titre pour savoir où l'on va. */
export const domaineDe = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};
