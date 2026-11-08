/**
 * Compteurs de la supervision (lot ME-21) : requêtes, temps de réponse, erreurs 500 et courriels
 * en échec, minute par minute, gardés en mémoire sur la dernière heure. Aucune donnée personnelle :
 * des durées et des codes, jamais d'adresse, de compte ni de chemin.
 *
 * Une instance du serveur aujourd'hui ; avec plusieurs instances ou plusieurs écoles (D-03), les
 * compteurs seront rangés par établissement (audit d'isolation, I-10).
 */
const MINUTES_GARDEES = 60;
// Durées gardées par minute : au-delà, les centiles se calculent sur un échantillon
const DUREES_PAR_MINUTE = 2000;

let minutes = new Map();
let horloge = () => Date.now();

const minuteCourante = () => {
    const cle = Math.floor(horloge() / 60_000);
    let m = minutes.get(cle);
    if (!m) {
        m = { requetes: 0, erreurs5xx: 0, courrielsEnEchec: 0, durees: [] };
        minutes.set(cle, m);
        for (const ancienne of minutes.keys()) if (ancienne <= cle - MINUTES_GARDEES) minutes.delete(ancienne);
    }
    return m;
};

/** Une requête terminée : sa durée (ms) et son code HTTP. */
export const noterRequete = (dureeMs, statut) => {
    const m = minuteCourante();
    m.requetes += 1;
    if (statut >= 500) m.erreurs5xx += 1;
    if (m.durees.length < DUREES_PAR_MINUTE) m.durees.push(dureeMs);
};

/** Un courriel que le serveur d'envoi a refusé (la « boîte d'envoi » de ME-21). */
export const noterEchecCourriel = () => {
    minuteCourante().courrielsEnEchec += 1;
};

const centile = (triees, p) => (triees.length ? triees[Math.min(triees.length - 1, Math.floor((p / 100) * triees.length))] : null);

/** Résumé des `fenetre` dernières minutes (minute en cours comprise). */
export const resume = (fenetre = 15) => {
    const depuis = Math.floor(horloge() / 60_000) - fenetre + 1;
    const total = { requetes: 0, erreurs5xx: 0, courrielsEnEchec: 0 };
    const durees = [];
    for (const [cle, m] of minutes) {
        if (cle < depuis) continue;
        total.requetes += m.requetes;
        total.erreurs5xx += m.erreurs5xx;
        total.courrielsEnEchec += m.courrielsEnEchec;
        durees.push(...m.durees);
    }
    durees.sort((a, b) => a - b);
    return { ...total, p50: centile(durees, 50), p95: centile(durees, 95) };
};

/** Tests : horloge remplaçable et compteurs remis à zéro. */
export const reinitialiserCompteurs = (nouvelleHorloge = () => Date.now()) => {
    minutes = new Map();
    horloge = nouvelleHorloge;
};
