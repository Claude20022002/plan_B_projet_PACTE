import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

/**
 * Photo d'illustration d'un retour de stage, réduite sur le téléphone avant l'envoi : une photo
 * d'appareil (4 à 8 Mo) devient un JPEG de 1600 px de large au plus (≈ 200 à 400 Ko). La limite du
 * serveur (2 Mo) est vérifiée ici, avec un message clair, plutôt qu'au refus de l'envoi.
 */

export const PHOTO_MAX_OCTETS = 2 * 1024 * 1024;
const LARGEUR_MAX = 1600;
const QUALITES = [0.72, 0.55, 0.4];

export class PhotoTropLourde extends Error {}

const taille = (uri) => {
  try {
    return new File(uri).size ?? 0;
  } catch {
    return 0;
  }
};

/** Réduit une image (dimension et compression) jusqu'à passer sous la limite du serveur. */
export const reduirePhoto = async ({ uri, width }) => {
  const contexte = ImageManipulator.manipulate(uri);
  if (width > LARGEUR_MAX) contexte.resize({ width: LARGEUR_MAX });
  const image = await contexte.renderAsync();
  for (const compress of QUALITES) {
    const resultat = await image.saveAsync({ compress, format: SaveFormat.JPEG });
    const octets = taille(resultat.uri);
    if (octets && octets <= PHOTO_MAX_OCTETS) return { uri: resultat.uri, largeur: resultat.width, hauteur: resultat.height, octets };
  }
  throw new PhotoTropLourde();
};

/** Ouvre la galerie (une seule image) ; null si l'étudiant annule. */
export const choisirPhoto = async () => {
  const choix = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1, exif: false });
  if (choix.canceled || !choix.assets?.length) return null;
  return reduirePhoto(choix.assets[0]);
};

export const formatTaille = (octets) => (octets >= 1048576 ? `${(octets / 1048576).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`);
