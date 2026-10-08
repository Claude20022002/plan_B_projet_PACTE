import { Platform } from 'react-native';
import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Documents de la bibliothèque sur le téléphone : téléchargés une fois (avec progression), gardés
 * dans le cache de l'application pour être relus hors ligne, et affichés dans l'application quand
 * c'est possible (PDF, images) ; sinon ouverts avec l'application adaptée (Word, PowerPoint…).
 */

/** Au-delà, l'étudiant confirme avant de télécharger sur les données mobiles. */
export const SEUIL_CONFIRMATION_OCTETS = 10 * 1024 * 1024;

const FORMATS = [
  { test: (m) => m.includes('pdf'), format: 'PDF', extension: 'pdf', lecture: 'pdf' },
  { test: (m) => m.startsWith('image/png'), format: 'PNG', extension: 'png', lecture: 'image' },
  { test: (m) => m.startsWith('image/jpeg'), format: 'JPG', extension: 'jpg', lecture: 'image' },
  { test: (m) => m.startsWith('image/webp'), format: 'WEBP', extension: 'webp', lecture: 'image' },
  { test: (m) => m.includes('presentation') || m.includes('powerpoint'), format: 'PPTX', extension: 'pptx', lecture: 'externe' },
  { test: (m) => m.includes('spreadsheet') || m.includes('excel'), format: 'XLSX', extension: 'xlsx', lecture: 'externe' },
  { test: (m) => m.includes('word') || m.includes('opendocument.text'), format: 'DOCX', extension: 'docx', lecture: 'externe' },
  { test: (m) => m.includes('zip'), format: 'ZIP', extension: 'zip', lecture: 'externe' },
  { test: (m) => m.startsWith('text/'), format: 'TXT', extension: 'txt', lecture: 'externe' },
];

/** Format affiché, extension du fichier local et mode de lecture (pdf, image ou externe). */
export const formatDe = (mime) => {
  const m = String(mime ?? '').toLowerCase();
  return FORMATS.find((f) => f.test(m)) ?? { format: 'FICHIER', extension: 'bin', lecture: 'externe' };
};

export const formatTaille = (octets) => {
  if (!octets) return '';
  return octets >= 1048576 ? `${(octets / 1048576).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`;
};

const dossierCache = () => {
  const dossier = new Directory(Paths.cache, 'bibliotheque');
  if (!dossier.exists) dossier.create({ intermediates: true });
  return dossier;
};

/** Fichier local d'un document : l'identifiant et la taille changent si le document est remplacé. */
export const fichierLocal = (doc) => new File(dossierCache(), `${doc.id}-${doc.file_size ?? 0}.${formatDe(doc.mime_type).extension}`);

export const dejaTelecharge = (doc) => {
  try {
    const fichier = fichierLocal(doc);
    return fichier.exists && (fichier.size ?? 0) > 0 ? fichier : null;
  } catch {
    return null;
  }
};

/** Vrai sur les données mobiles (la confirmation des gros fichiers ne gêne pas en Wi-Fi). */
export const surDonneesMobiles = async () => {
  try {
    return (await Network.getNetworkStateAsync()).type === Network.NetworkStateType.CELLULAR;
  } catch {
    return false;
  }
};

/**
 * Télécharge depuis l'URL signée vers le cache, avec la progression (0 à 1). Renvoie le fichier et
 * une fonction d'annulation ; un téléchargement interrompu ne laisse pas de fichier partiel.
 */
export const telecharger = (doc, url, surProgression) => {
  const destination = fichierLocal(doc);
  const tache = new DownloadTask(url, destination);
  const abonnement = tache.addListener('progress', ({ bytesWritten, totalBytes }) => {
    const total = totalBytes > 0 ? totalBytes : doc.file_size;
    if (total) surProgression(Math.min(1, bytesWritten / total));
  });
  const promesse = tache
    .downloadAsync()
    .then((fichier) => {
      if (!fichier) throw new Error('annulé');
      return fichier;
    })
    .catch((erreur) => {
      try {
        if (destination.exists) destination.delete();
      } catch {
        // rien à nettoyer
      }
      throw erreur;
    })
    .finally(() => abonnement.remove());
  return { promesse, annuler: () => tache.cancel() };
};

/** Ouvre le fichier avec une autre application (Word, PowerPoint, lecteur PDF…). */
export const ouvrirAvec = async (fichier, mime) => {
  if (Platform.OS === 'android') {
    try {
      // FLAG_GRANT_READ_URI_PERMISSION : l'application choisie peut lire le fichier du cache
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: fichier.contentUri, flags: 1, type: mime || '*/*' });
      return;
    } catch {
      // aucune application ne sait l'ouvrir : on propose le partage
    }
  }
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fichier.uri, { mimeType: mime || undefined });
};

