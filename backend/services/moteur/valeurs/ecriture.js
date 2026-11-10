import { coherenceDesValeurs, valeurDuBonType } from "../catalogue/verifier.js";
import { porteeAdmise } from "./resolution.js";

/**
 * Contrôle d'une valeur avant son écriture (lot MP-1). Fonction pure : la route rend ces erreurs
 * telles quelles, chacune avec un code et une phrase qui dit quoi faire.
 * Une école ne rend jamais une règle stricte : un profil ou la Plateforme seuls le peuvent (D-09,
 * amendée le 4 novembre 2026). Une règle stricte de trop rend le calcul impossible sans dire pourquoi.
 */

// Qui peut modifier quoi, du plus restreint au plus large : chacun peut aussi ce qu'un rang inférieur peut
const RANGS = ["personne", "responsable", "etablissement", "plateforme"];

const erreur = (code, message) => ({ code, message });

/**
 * @param {object} o
 * @param {object} o.parametre le paramètre, tel que le catalogue le décrit
 * @param {string} o.portee etablissement, cycle, niveau, filiere, ou la cible individuelle
 * @param {*} [o.valeur] la nouvelle valeur (absente si on ne change que le poids)
 * @param {string} [o.force] strict ou souple
 * @param {number} [o.poids] poids d'une règle souple
 * @param {string} o.auteur personne, responsable, etablissement, plateforme
 * @param {Map} [o.valeurs] valeurs résolues pour cette cible, pour contrôler les bornes
 * @param {object[]} [o.dependances]
 * @returns {{ code: string, message: string }[]} vide si l'écriture est permise
 */
export const controlerEcriture = ({ parametre: p, portee, valeur, force, poids, auteur, valeurs, dependances = [] }) => {
    const erreurs = [];
    if (p.modifiable === "non") return [erreur("non_modifiable", `${p.nom} ne se modifie pas : c'est une règle ou une valeur calculée par Planner.`)];
    if (RANGS.indexOf(auteur) < RANGS.indexOf(p.modifiable)) erreurs.push(erreur("droit_insuffisant", `${p.nom} ne peut être modifié qu'au niveau « ${p.modifiable} ».`));
    if (!porteeAdmise(p, portee)) erreurs.push(erreur("portee_interdite", `${p.nom} ne se règle pas au niveau « ${portee} ».`));

    if (valeur !== undefined) {
        if (!valeurDuBonType(p, valeur)) erreurs.push(erreur("type_invalide", `${p.nom} attend une valeur de type « ${p.type} ».`));
        if (p.type === "enum" && valeur !== null && !p.valeurs.includes(valeur)) erreurs.push(erreur("hors_liste", `${p.nom} : valeurs admises : ${p.valeurs.join(", ")}.`));
        if (p.role === "regle" && p.obligatoire && (valeur === false || valeur === null)) erreurs.push(erreur("regle_obligatoire", `${p.nom} est obligatoire et ne peut pas être désactivée.`));
    }

    if (force !== undefined) {
        if (!p.force_reglable) erreurs.push(erreur("force_figee", `La force de ${p.nom} est fixée par Planner.`));
        else if (auteur !== "plateforme") erreurs.push(erreur("force_interdite", `Une école ne rend pas ${p.nom} stricte : choisissez « indispensable », un poids très fort que le rapport signale s'il n'est pas tenu.`));
    }

    if (poids !== undefined) {
        const souple = (force ?? p.force) === "souple";
        if (p.role !== "regle" || !souple) erreurs.push(erreur("poids_interdit", `${p.nom} n'est pas une règle souple : elle n'a pas de poids.`));
        else if (!Number.isInteger(poids) || poids <= 0) erreurs.push(erreur("poids_invalide", "Un poids est un entier supérieur à zéro."));
    }

    // Bornes : la valeur demandée est essayée sur les valeurs en vigueur, loi du pays comprise
    if (valeurs && valeur !== undefined && !erreurs.length) {
        const essai = new Map(valeurs).set(p.id, valeur);
        const miennes = dependances.filter((d) => ["borne", "exclut"].includes(d.type) && (d.de === p.id || d.vers === p.id));
        for (const message of coherenceDesValeurs(essai, miennes)) erreurs.push(erreur("borne_depassee", message));
    }
    return erreurs;
};
