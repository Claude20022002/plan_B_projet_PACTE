import { TYPES } from "./types.js";

/**
 * Correction d'une réponse (Studio quiz). Fonctions pures, exécutées par le serveur seulement :
 * le navigateur de l'étudiant ne reçoit jamais les bonnes réponses avant d'avoir rendu.
 *
 * Format des réponses de l'étudiant, par type :
 *   choix_unique « o2 » · choix_multiple ["o1","o3"] · vrai_faux true · reponse_courte « texte »
 *   numerique 12.5 · texte_trous { "1": "…" } · association { p1: "p3", p2: "d1" } · ordre ["e2","e1"]
 *   zone_image { x, y } (en % de l'image) · reponse_libre « texte »
 *
 * Notation partielle (réglage du quiz) : choix multiple, trous, association et ordre rapportent
 * une part des points ; sinon tout ou rien, comme un examen Cisco sans crédit partiel.
 */

/** Texte comparable : espaces resserrés, ponctuation finale retirée, casse et accents selon les options. */
export const normaliser = (texte, { casse = false, accents = false } = {}) => {
    let t = String(texte ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.;:!?]+$/, "")
        .trim();
    if (!accents) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!casse) t = t.toLowerCase();
    return t;
};

/**
 * Distance d'édition de Damerau (lettre ajoutée, retirée, changée, ou deux lettres voisines
 * inversées, la faute de frappe la plus courante), arrêtée dès qu'elle dépasse `max`.
 */
export const distance = (a, b, max = 2) => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let avant = null;
    let precedente = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i += 1) {
        const ligne = [i];
        let minimum = i;
        for (let j = 1; j <= b.length; j += 1) {
            ligne[j] = Math.min(precedente[j] + 1, ligne[j - 1] + 1, precedente[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (avant && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) ligne[j] = Math.min(ligne[j], avant[j - 2] + 1);
            minimum = Math.min(minimum, ligne[j]);
        }
        if (minimum > max) return max + 1;
        avant = precedente;
        precedente = ligne;
    }
    return precedente[b.length];
};

/** La saisie correspond-elle à l'une des réponses acceptées ? Une faute de frappe tolérée sur un mot long. */
export const texteAccepte = (saisie, acceptees, { casse, accents, fautes = false } = {}) => {
    const s = normaliser(saisie, { casse, accents });
    if (!s) return false;
    return acceptees.some((a) => {
        const n = normaliser(a, { casse, accents });
        return n === s || (fautes && n.length >= 6 && distance(n, s, 1) <= 1);
    });
};

const nombreDe = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".").replace(/\s/g, "")) : NaN);
const arrondi = (v) => Math.round(v * 100) / 100;
const vide = (reponse) =>
    reponse === undefined || reponse === null || reponse === "" || (Array.isArray(reponse) && !reponse.length) || (typeof reponse === "object" && !Array.isArray(reponse) && !Object.keys(reponse).length);

/** Part juste (0 à 1) de la réponse, par type ; null pour une réponse à corriger à la main. */
const PARTS = {
    choix_unique: (d, r) => (r === d.bonne ? 1 : 0),
    choix_multiple: (d, r, partiel) => {
        const choisies = new Set(Array.isArray(r) ? r : []);
        const justes = d.bonnes.filter((id) => choisies.has(id)).length;
        const fausses = [...choisies].filter((id) => !d.bonnes.includes(id)).length;
        if (!partiel) return justes === d.bonnes.length && fausses === 0 ? 1 : 0;
        // Chaque mauvaise case cochée annule une bonne : cocher tout ne rapporte rien
        return Math.max(0, (justes - fausses) / d.bonnes.length);
    },
    vrai_faux: (d, r) => (r === d.reponse ? 1 : 0),
    reponse_courte: (d, r) => (texteAccepte(r, d.acceptees, d) ? 1 : 0),
    numerique: (d, r) => {
        const v = nombreDe(r);
        return Number.isFinite(v) && Math.abs(v - d.valeur) <= d.tolerance + 1e-9 ? 1 : 0;
    },
    texte_trous: (d, r, partiel) => {
        const saisies = r && typeof r === "object" ? r : {};
        const justes = d.trous.filter((t) => texteAccepte(saisies[t.id], t.acceptees, d)).length;
        return partiel ? justes / d.trous.length : justes === d.trous.length ? 1 : 0;
    },
    association: (d, r, partiel) => {
        const choix = r && typeof r === "object" ? r : {};
        const justes = d.paires.filter((p) => choix[p.id] === p.id).length;
        return partiel ? justes / d.paires.length : justes === d.paires.length ? 1 : 0;
    },
    ordre: (d, r, partiel) => {
        const proposes = Array.isArray(r) ? r : [];
        const justes = d.elements.filter((e, i) => proposes[i] === e.id).length;
        return partiel ? justes / d.elements.length : justes === d.elements.length ? 1 : 0;
    },
    zone_image: (d, r) => {
        const x = nombreDe(r?.x);
        const y = nombreDe(r?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
        return d.zones.some((z) => x >= z.x && x <= z.x + z.l && y >= z.y && y <= z.y + z.h) ? 1 : 0;
    },
    reponse_libre: () => null,
};

/**
 * Corrige une réponse.
 * @param {{ type: string, points: number, donnees: object }} question
 * @param {*} reponse
 * @param {{ partiel?: boolean }} options
 * @returns {{ points: number|null, max: number, statut: "juste"|"partiel"|"faux"|"sans_reponse"|"a_corriger" }}
 */
export const corriger = (question, reponse, { partiel = false } = {}) => {
    const max = question.points;
    if (vide(reponse)) return { points: 0, max, statut: "sans_reponse" };
    if (!TYPES[question.type]?.auto) return { points: null, max, statut: "a_corriger" };
    const part = PARTS[question.type](question.donnees, reponse, partiel);
    const points = arrondi(part * max);
    return { points, max, statut: part >= 1 ? "juste" : part > 0 ? "partiel" : "faux" };
};

/** La bonne réponse, dans le format d'une réponse d'étudiant (affichée à la correction). */
export const bonneReponse = (question) => {
    const d = question.donnees;
    switch (question.type) {
        case "choix_unique":
            return d.bonne;
        case "choix_multiple":
            return d.bonnes;
        case "vrai_faux":
            return d.reponse;
        case "reponse_courte":
            return d.acceptees;
        case "numerique":
            return { valeur: d.valeur, tolerance: d.tolerance, unite: d.unite };
        case "texte_trous":
            return Object.fromEntries(d.trous.map((t) => [t.id, t.acceptees]));
        case "association":
            return Object.fromEntries(d.paires.map((p) => [p.id, p.id]));
        case "ordre":
            return d.elements.map((e) => e.id);
        case "zone_image":
            return { zones: d.zones };
        default:
            return d.corrige ?? null;
    }
};

/** Score total d'une copie : points, maximum, pourcentage ; `complet` faux tant qu'une réponse attend la main de l'enseignant. */
export const totaliser = (corrections) => {
    const max = arrondi(corrections.reduce((s, c) => s + c.max, 0));
    const points = arrondi(corrections.reduce((s, c) => s + (c.points ?? 0), 0));
    return { points, max, pourcentage: max ? Math.round((points / max) * 1000) / 10 : 0, complet: corrections.every((c) => c.points !== null) };
};
