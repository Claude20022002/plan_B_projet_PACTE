import { ACCESS_COOKIE } from "../../config/authCookies.js";
import { signerJetonService } from "../../utils/jetons.js";
import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Client de l'API de StudyLib pour l'espace de cours (docs/plans/espace-de-cours.md, § 3).
 * StudyLib est la seule réserve des fichiers : Planner y transmet le dépôt de l'enseignant avec
 * le jeton de celui-ci (StudyLib applique ses propres contrôles), et demande les liens des
 * étudiants avec un jeton de service limité à un document. Planner ne lit ni ne garde de fichier.
 */

// Adresse interne (réseau Docker) ; le conteneur de StudyLib écoute sur 8080
const BASE = () => (process.env.STUDYLIB_API_URL || "http://studylib:8080/api").replace(/\/$/, "");
const DELAI_MS = 60_000;
// 20 Mo acceptés par StudyLib, plus l'enveloppe du formulaire
export const TAILLE_MAX_DEPOT = 21 * 1024 * 1024;

// Remplaçable dans les tests (même principe que le client du service de quiz)
let client = (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(DELAI_MS) });
export const definirClientStudyLib = (fn) => {
    client = fn ?? ((url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(DELAI_MS) }));
};

/** Jeton de l'utilisateur pour cette requête (cookie du site ou Bearer de l'application). */
export const jetonDe = (req) => {
    if (req.cookies?.[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE];
    const entete = req.headers.authorization;
    return entete?.startsWith("Bearer ") ? entete.slice(7) : null;
};

const appeler = async (chemin, options) => {
    let res;
    try {
        res = await client(`${BASE()}${chemin}`, { ...options, headers: { Accept: "application/json", ...options.headers } });
    } catch {
        throw new ErreurMetier("La Bibliothèque ne répond pas, réessayez dans un instant", 502);
    }
    const corps = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, corps };
};

const echec = (status, corps) => {
    if (status === 422) {
        const premier = Object.values(corps?.errors ?? {})[0]?.[0];
        return new ErreurMetier(premier ?? corps?.message ?? "Fichier refusé par la Bibliothèque", 400);
    }
    if (status === 404 || status === 403) return new ErreurMetier("Document introuvable", 404);
    if (status === 429) return new ErreurMetier("Trop d'envois d'un coup : patientez une minute", 429);
    return new ErreurMetier("La Bibliothèque a refusé l'opération", 502);
};

/**
 * Transmet tel quel le formulaire multipart du navigateur (fichier, titre) à StudyLib, sans le
 * lire ; le module de la classe (codes de la filière et du module) part dans l'adresse. Rend le
 * document créé ({ id, mime_type, file_size, module: { code } }).
 */
export const transmettreDepot = async (req, { filiere, module } = {}) => {
    const taille = Number(req.headers["content-length"]);
    if (!Number.isFinite(taille) || taille <= 0) throw new ErreurMetier("Taille du fichier inconnue", 411);
    if (taille > TAILLE_MAX_DEPOT) throw new ErreurMetier("Fichier trop volumineux (20 Mo au plus)", 413);
    if (!String(req.headers["content-type"] ?? "").startsWith("multipart/form-data")) throw new ErreurMetier("Formulaire de dépôt attendu", 400);

    const { status, corps } = await appeler(`/classe/documents?${new URLSearchParams({ filiere: filiere ?? "", module: module ?? "" })}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jetonDe(req)}`, "Content-Type": req.headers["content-type"], "Content-Length": String(taille) },
        body: req,
        duplex: "half",
    });
    if (status !== 201 || !corps?.data?.id) throw echec(status, corps);
    return corps.data;
};

/** Document vu par l'utilisateur : le sien, ou un document publié de la Bibliothèque. */
export const lireDocument = async (jeton, id) => {
    const { status, corps } = await appeler(`/classe/documents/${encodeURIComponent(id)}`, { method: "GET", headers: { Authorization: `Bearer ${jeton}` } });
    if (status !== 200 || !corps?.data) throw echec(status, corps);
    return corps.data;
};

export const publierDocument = async (jeton, id) => {
    const { status, corps } = await appeler(`/classe/documents/${encodeURIComponent(id)}/publier`, { method: "PATCH", headers: { Authorization: `Bearer ${jeton}` } });
    if (status !== 200) throw echec(status, corps);
    return corps.data;
};

export const supprimerDocument = async (jeton, id) => {
    const { status, corps } = await appeler(`/classe/documents/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${jeton}` } });
    // Déjà absent de StudyLib : rien à retirer
    if (status !== 204 && status !== 404) throw echec(status, corps);
};

/** Lien signé de 5 minutes, pour un utilisateur dont Planner a vérifié les droits. */
export const lienDocument = async (id, idUser) => {
    const jeton = signerJetonService({ scope: "document:lien", doc: id, sub: idUser });
    const { status, corps } = await appeler(`/interne/documents/${encodeURIComponent(id)}/lien`, { method: "GET", headers: { Authorization: `Bearer ${jeton}` } });
    if (status !== 200 || typeof corps?.url !== "string") throw echec(status, corps);
    return corps.url;
};
