import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Réglages d'un quiz du Studio. Le quiz garde des valeurs par défaut ; chaque passation peut les
 * changer à l'ouverture (une révision en autonomie, un contrôle chronométré…).
 *  - duree_min : temps total en minutes (0 : pas de limite) ;
 *  - navigation : « libre » (retour en arrière, marques pour révision, comme à l'examen Cisco) ou
 *    « lineaire » (une question validée ne se reprend plus) ;
 *  - correction : « immediate » (entraînement : correction après chaque question), « fin » (score
 *    et corrigé détaillé après avoir rendu), « score » (le score seul) ou « jamais » ;
 *  - notation_partielle : une partie des points pour une réponse en partie juste ;
 *  - seuil_reussite : pourcentage pour « réussi » ;
 *  - tentatives_max : 0 pour illimité.
 */

export const REGLAGES_DEFAUT = Object.freeze({
    duree_min: 0,
    melanger_questions: false,
    melanger_options: true,
    navigation: "libre",
    correction: "fin",
    notation_partielle: true,
    seuil_reussite: 70,
    tentatives_max: 1,
});

const NAVIGATIONS = ["libre", "lineaire"];
const CORRECTIONS = ["immediate", "fin", "score", "jamais"];

const entier = (valeur, min, max, libelle) => {
    const n = Number(valeur);
    if (!Number.isInteger(n) || n < min || n > max) throw new ErreurMetier(`${libelle} : de ${min} à ${max}`, 400);
    return n;
};

/** Réglages complets et vérifiés ; `base` donne les valeurs non fournies. */
export const lireReglages = (brut = {}, base = REGLAGES_DEFAUT) => {
    const r = { ...REGLAGES_DEFAUT, ...base, ...(brut && typeof brut === "object" ? brut : {}) };
    if (!NAVIGATIONS.includes(r.navigation)) throw new ErreurMetier("Navigation : libre ou lineaire", 400);
    if (!CORRECTIONS.includes(r.correction)) throw new ErreurMetier("Correction : immediate, fin, score ou jamais", 400);
    return {
        duree_min: entier(r.duree_min, 0, 600, "Durée (minutes)"),
        melanger_questions: r.melanger_questions === true,
        melanger_options: r.melanger_options !== false,
        navigation: r.navigation,
        correction: r.correction,
        notation_partielle: r.notation_partielle !== false,
        seuil_reussite: entier(r.seuil_reussite, 0, 100, "Seuil de réussite (%)"),
        tentatives_max: entier(r.tentatives_max, 0, 20, "Tentatives"),
    };
};

/** Étiquettes libres (module, chapitre…) : 8 au plus, 40 caractères chacune, sans doublon. */
export const lireEtiquettes = (brut) => {
    if (brut === undefined || brut === null) return [];
    if (!Array.isArray(brut)) throw new ErreurMetier("Étiquettes : une liste", 400);
    const propres = [...new Set(brut.map((e) => String(e ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean))];
    if (propres.length > 8) throw new ErreurMetier("8 étiquettes au plus", 400);
    if (propres.some((e) => e.length > 40)) throw new ErreurMetier("Étiquette : 40 caractères au plus", 400);
    return propres;
};

export const lireTitre = (brut, { requis = true } = {}) => {
    const titre = String(brut ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (!titre && requis) throw new ErreurMetier("Donnez un titre au quiz", 400);
    if (titre.length > 200) throw new ErreurMetier("Titre : 200 caractères au plus", 400);
    return titre;
};

export const lireDescription = (brut) => {
    if (brut === undefined || brut === null || brut === "") return null;
    const texte = String(brut).replace(/<[^>]*>/g, "").trim();
    if (texte.length > 2000) throw new ErreurMetier("Description : 2 000 caractères au plus", 400);
    return texte || null;
};
