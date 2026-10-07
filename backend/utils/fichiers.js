import { ErreurMetier } from "../services/planning/enseignements.js";

/**
 * Fichiers déposés par les utilisateurs (pièces jointes d'annonces, énoncés et copies de devoirs),
 * stockés en base : le type annoncé doit correspondre à la signature du contenu, pour qu'un
 * fichier renommé (un exécutable en « .pdf ») soit refusé.
 */

const commencePar = (octets) => (b) => b.length >= octets.length && b.subarray(0, octets.length).equals(Buffer.from(octets));
const pdf = (b) => b.subarray(0, 4).toString("latin1") === "%PDF";
const png = commencePar([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = commencePar([0xff, 0xd8, 0xff]);
const webp = (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
// Archive ZIP (et documents Office, qui en sont) : en-tête local ou archive vide
const zip = (b) => commencePar([0x50, 0x4b, 0x03, 0x04])(b) || commencePar([0x50, 0x4b, 0x05, 0x06])(b);

export const SIGNATURES = {
    "application/pdf": pdf,
    "image/png": png,
    "image/jpeg": jpeg,
    "image/webp": webp,
    "application/zip": zip,
    "application/x-zip-compressed": zip,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": zip,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": zip,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": zip,
};

export const TYPES_IMAGES_PDF = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const TYPES_DEVOIRS = Object.keys(SIGNATURES);

/** Nom de fichier sûr : sans chemin ni caractère de contrôle, 200 caractères au plus. */
export const nomSur = (nom) =>
    String(nom ?? "")
        .split(/[\\/]/)
        .pop()
        .replace(/[\u0000-\u001f\u007f"]/g, "")
        .trim()
        .slice(0, 200) || "fichier";

/**
 * Vérifie un fichier reçu en corps brut et renvoie { nom, type_mime, taille, contenu }.
 * @param {{ contenu: Buffer, type: string, nom: string }} fichier
 * @param {{ types: string[], tailleMax: number, libelleTypes: string }} regles
 */
export const verifierFichier = ({ contenu, type, nom }, { types, tailleMax, libelleTypes }) => {
    const typeMime = String(type ?? "").split(";")[0].trim().toLowerCase();
    if (!types.includes(typeMime)) throw new ErreurMetier(`Fichier : ${libelleTypes} seulement`, 415);
    if (!Buffer.isBuffer(contenu) || !contenu.length) throw new ErreurMetier("Fichier vide");
    if (contenu.length > tailleMax) throw new ErreurMetier(`Fichier : ${Math.round(tailleMax / 1024 / 1024)} Mo au plus`, 413);
    if (!SIGNATURES[typeMime](contenu)) throw new ErreurMetier("Le contenu du fichier ne correspond pas à son type", 415);
    return { nom: nomSur(nom), type_mime: typeMime, taille: contenu.length, contenu };
};

/** En-têtes de téléchargement d'un fichier stocké (toujours en pièce jointe, jamais affiché en ligne). */
export const enTetesTelechargement = (fichier) => ({
    "Content-Type": fichier.type_mime,
    "Content-Length": String(fichier.taille),
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fichier.nom)}`,
    "Cache-Control": "private, no-store",
});
