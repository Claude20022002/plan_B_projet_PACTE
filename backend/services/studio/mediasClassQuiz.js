import { ErreurMetier } from "../planning/enseignements.js";
import { TAILLE_MAX_DEPOT, enregistrerMedia, typeDuContenu } from "./medias.js";

/**
 * Images (ou vidéos) des questions de ClassQuiz, copiées dans les médias du Studio de l'enseignant
 * à l'import (décision du 21 octobre 2026 : tout est repris chez nous, rien ne reste lié au fork).
 * Le fork les sert par /api/v1/storage/download/<nom>, sans signature ; le nom est vérifié avant
 * l'appel (« uuid » ou « uuid--uuid », comme le fork l'exige), et seule l'adresse du fork est appelée.
 */

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const NOM_FICHIER = new RegExp(`^${UUID}(--${UUID})?$`, "i");
const DELAI_MS = 15000;

// Adresse interne de ClassQuiz (réseau docker), comme pour les routes signées
const baseClassQuiz = () => (process.env.QUIZ_API_INTERNE || process.env.QUIZ_URL || "").replace(/\/$/, "");

/** Téléchargeur du fork : (nom) → { contenu: Buffer, type } ; remplaçable dans les tests. */
let telecharger = async (nom) => {
    const base = baseClassQuiz();
    if (!base) throw new ErreurMetier("Le service de quiz n'est pas configuré", 503);
    let reponse;
    try {
        reponse = await fetch(`${base}/api/v1/storage/download/${encodeURIComponent(nom)}`, { signal: AbortSignal.timeout(DELAI_MS) });
    } catch {
        throw new ErreurMetier("le service de quiz est injoignable", 502);
    }
    if (!reponse.ok) throw new ErreurMetier(`le service de quiz a répondu ${reponse.status}`, 502);
    if (Number(reponse.headers.get("content-length") || 0) > TAILLE_MAX_DEPOT) throw new ErreurMetier("fichier trop lourd", 413);
    const contenu = Buffer.from(await reponse.arrayBuffer());
    return { contenu, type: reponse.headers.get("content-type") || "" };
};

/** Tests : remplace le téléchargement depuis le fork. */
export const definirTelechargeurClassQuiz = (remplacant) => {
    telecharger = remplacant;
};

/**
 * Copie un fichier du fork dans les médias de l'enseignant ; rend { id_media } ou { raison } si la
 * copie est impossible (la question est importée sans son image, et le bilan le dit).
 */
export const copierMediaClassQuiz = async (user, nom) => {
    if (!NOM_FICHIER.test(String(nom ?? ""))) return { raison: "image : nom de fichier illisible" };
    try {
        const { contenu, type } = await telecharger(nom);
        if (contenu.length > TAILLE_MAX_DEPOT) return { raison: "image : fichier trop lourd" };
        // Le fork annonce parfois « image/* » : le type se lit alors dans le contenu
        const typeSur = typeDuContenu(contenu) ?? type;
        const media = await enregistrerMedia(user, { contenu, type: typeSur, nom: `classquiz-${nom.slice(0, 8)}` }, { origine: "import" });
        return { id_media: media.id_media };
    } catch (erreur) {
        if (!(erreur instanceof ErreurMetier)) throw erreur;
        return { raison: `image non reprise : ${erreur.message}` };
    }
};
