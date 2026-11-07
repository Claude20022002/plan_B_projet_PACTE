import crypto from "crypto";
import { ErreurMetier } from "../planning/enseignements.js";
import { exigerClassQuiz } from "../etablissement/fonctionnalites.js";

/**
 * Client du fork ClassQuiz (l'espace « Quiz » dans les écrans) : requêtes signées vers ses routes
 * /api/v1/hestim/…, qui ne servent qu'à Planner. Le secret est celui du webhook
 * (QUIZ_WEBHOOK_SECRET, 32 caractères au moins) ; sans lui ou sans adresse, tout appel répond 503.
 */

const secret = () => {
    const valeur = process.env.QUIZ_WEBHOOK_SECRET || "";
    return valeur.length >= 32 ? valeur : null;
};
// Adresse interne de l'API ClassQuiz (réseau docker) ; QUIZ_URL publique en repli
const baseClassQuiz = () => (process.env.QUIZ_API_INTERNE || process.env.QUIZ_URL || "").replace(/\/$/, "");

/**
 * Signature d'une requête vers le fork : HMAC-SHA256 de « horodatage.MÉTHODE.chemin », suivi pour
 * une écriture de « .<SHA-256 du corps> » (un corps modifié en chemin est refusé).
 */
export const signatureClassQuiz = (cle, horodatage, methode, chemin, corps = null) =>
    crypto
        .createHmac("sha256", cle)
        .update(`${horodatage}.${methode}.${chemin}${corps === null ? "" : `.${crypto.createHash("sha256").update(corps).digest("hex")}`}`)
        .digest("hex");

const detailDe = async (reponse) => {
    try {
        const { detail } = await reponse.json();
        return typeof detail === "string" && detail ? ` : ${detail.slice(0, 200)}` : "";
    } catch {
        return "";
    }
};

/** Lecture (GET) ou, avec un corps, écriture (POST, JSON) signée. Lecture introuvable : null. */
let client = async (chemin, corps = null) => {
    const cle = secret();
    const base = baseClassQuiz();
    if (!cle || !base) throw new ErreurMetier("Le service de quiz n'est pas configuré", 503);
    const horodatage = String(Math.floor(Date.now() / 1000));
    const methode = corps === null ? "GET" : "POST";
    const texte = corps === null ? null : JSON.stringify(corps);
    const entetes = { "X-Hestim-Timestamp": horodatage, "X-Hestim-Signature": signatureClassQuiz(cle, horodatage, methode, chemin, texte) };
    let reponse;
    try {
        reponse = await fetch(`${base}${chemin}`, {
            method: methode,
            headers: texte === null ? entetes : { ...entetes, "Content-Type": "application/json" },
            ...(texte === null ? {} : { body: texte }),
            signal: AbortSignal.timeout(texte === null ? 8000 : 15000),
        });
    } catch {
        throw new ErreurMetier("Le service de quiz est injoignable", 502);
    }
    if (reponse.status === 404) {
        if (texte === null) return null;
        // Route d'écriture absente : le fork en ligne est plus ancien que Planner
        throw new ErreurMetier("Le service de quiz ne connaît pas encore cette action : mettez-le à jour", 502);
    }
    if (reponse.status === 422) throw new ErreurMetier(`Le service de quiz a refusé la demande${await detailDe(reponse)}`, 422);
    if (!reponse.ok) throw new ErreurMetier(`Le service de quiz a répondu ${reponse.status}`, 502);
    return reponse.json();
};

/**
 * Appelle le fork et rend sa réponse JSON : lecture si `corps` est absent, écriture sinon. Refusé
 * (503) quand ClassQuiz est éteint pour l'école (lot ME-0c), même avec un client de test.
 */
export const appelerClassQuiz = async (chemin, corps = null) => {
    await exigerClassQuiz();
    return client(chemin, corps);
};

/** Tests : remplace l'appel à ClassQuiz ((chemin, corps) → données) */
export const definirClientClassQuiz = (remplacant) => {
    client = remplacant;
};

/** Chemin suivi de ses paramètres, tel qu'il est signé puis appelé. */
export const cheminSigne = (chemin, params) => `${chemin}?${new URLSearchParams(params).toString()}`;
