import { dansEtablissement, etablissementParDefaut } from "../contexte/etablissement.js";

/**
 * Établissement de la requête (D-03, essai réduit de ME-3a) : choisi par le nom d'hôte
 * (« ecole.planner.ma »), puis porté par AsyncLocalStorage jusqu'au bout de la requête.
 * Hôte inconnu : l'école par défaut, sauf en mode strict (404).
 */
const parHote = new Map();

export const enregistrerEtablissement = (hote, contexte) => parHote.set(hote, contexte);
export const oublierEtablissements = () => parHote.clear();

export const choisirEtablissement = (req, res, next) => {
    const contexte = parHote.get(req.hostname) ?? (process.env.CONTEXTE_STRICT === "true" ? null : etablissementParDefaut());
    if (!contexte) return res.status(404).json({ message: "Établissement inconnu" });
    req.etablissement = contexte;
    // Le contexte survit aux lecteurs de corps (express.json, express.raw) : vérifié en mode strict
    // par tests/integration/contexteEtablissement.test.js
    return dansEtablissement(contexte, next);
};
