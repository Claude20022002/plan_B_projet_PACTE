/**
 * Couleurs de l'école (plan multi-établissements, D-11 et D-21, lot ME-11) : contrôle de lisibilité
 * commun au serveur (refus à l'enregistrement) et au site (avertissement pendant la saisie).
 * Formule de contraste des WCAG 2.2 : luminance relative, puis (L1 + 0,05) / (L2 + 0,05).
 *  - couleur principale : boutons et bandeaux avec un texte blanc, contraste d'au moins 4,5:1 ;
 *  - couleur d'accent : éléments d'interface et grands textes, au moins 3:1 sur blanc (WCAG 1.4.11),
 *    et aussi sur le fond noir du panneau des séances, où elle écrit « PLANNER ».
 */

export const HEXA = /^#[0-9A-Fa-f]{6}$/;

export const SEUILS = { principale: 4.5, accent: 3 };

// Fond du panneau des séances (shared/design-tokens.json, board.ground)
export const FOND_PANNEAU = "#0B0B0D";
// Texte foncé posé sur l'accent (boutons d'appel), le même que celui du thème
export const TEXTE_FONCE = "#1A0A02";

const canal = (valeur) => {
    const c = valeur / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Luminance relative d'une couleur #RRGGBB (0 = noir, 1 = blanc). */
export const luminance = (hexa) => {
    const n = parseInt(hexa.slice(1), 16);
    return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
};

/** Rapport de contraste entre deux couleurs #RRGGBB, arrondi au centième (1 à 21). */
export const contraste = (a, b) => {
    const [claire, foncee] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return Math.round(((claire + 0.05) / (foncee + 0.05)) * 100) / 100;
};

const hexa2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

/** Mélange deux couleurs #RRGGBB : t = 0 rend a, t = 1 rend b. */
export const melanger = (a, b, t) => {
    const [x, y] = [parseInt(a.slice(1), 16), parseInt(b.slice(1), 16)];
    const voie = (n, decalage) => ((n >> decalage) & 255);
    return `#${[16, 8, 0].map((d) => hexa2(voie(x, d) + (voie(y, d) - voie(x, d)) * t)).join("")}`.toUpperCase();
};

/**
 * Nuances tirées des deux couleurs de l'école, mêmes noms que les jetons partagés
 * (shared/design-tokens.json, brand) pour que le site et l'application les remplacent sans
 * toucher aux écrans : navy (principale), navyDeep (survol, plus foncée), navySoft (fonds de
 * sélection, très claire), orange (accent), et frame, le cadre du panneau des séances.
 */
export const nuancesMarque = ({ couleur_principale: principale, couleur_accent: accent }) => ({
    navy: principale,
    navyDeep: melanger(principale, "#000000", 0.45),
    navySoft: melanger(principale, "#FFFFFF", 0.9),
    // Variantes du mode sombre : navyNight lisible sur le fond noir, navyLight un cran plus clair
    navyNight: melanger(principale, "#FFFFFF", 0.55),
    navyLight: melanger(principale, "#FFFFFF", 0.2),
    orange: accent,
    frame: principale,
});

// Les messages sont en français : virgule décimale (« 4,5:1 »)
const fr = (n) => String(n).replace(".", ",");

/** Texte le plus lisible sur un fond : blanc, ou le texte foncé du thème. */
export const texteSur = (fond) => (contraste(fond, "#FFFFFF") > contraste(fond, TEXTE_FONCE) ? "#FFFFFF" : TEXTE_FONCE);

/**
 * Vérifie une couleur de l'école pour son usage (« principale » ou « accent ») contre le blanc.
 * Rend { valide, contraste (sur blanc), seuil, message } ; le message dit quoi faire.
 */
export const verifierCouleur = (hexa, usage) => {
    if (!HEXA.test(String(hexa ?? ""))) return { valide: false, contraste: null, seuil: SEUILS[usage], message: "Couleur au format #RRGGBB, par exemple #001861" };
    const rapport = contraste(hexa, "#FFFFFF");
    const seuil = SEUILS[usage];
    if (rapport < seuil) {
        const quoi = usage === "accent" ? "elle ne se lit pas sur fond blanc" : "le texte blanc ne s'y lit pas";
        return { valide: false, contraste: rapport, seuil, message: `Couleur trop claire : ${quoi} (contraste ${fr(rapport)}:1, il faut au moins ${fr(seuil)}:1). Choisissez une teinte plus foncée.` };
    }
    if (usage === "accent") {
        const surPanneau = contraste(hexa, FOND_PANNEAU);
        if (surPanneau < seuil) return { valide: false, contraste: rapport, seuil, message: `Couleur trop foncée : elle ne se lit pas sur le panneau noir de l'accueil (contraste ${fr(surPanneau)}:1, il faut au moins ${fr(seuil)}:1). Choisissez une teinte plus vive.` };
    }
    return { valide: true, contraste: rapport, seuil, message: null };
};
