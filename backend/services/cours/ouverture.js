import { Op } from "sequelize";
import { aujourdhui } from "../planning/affectationRules.js";
import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Ouverture d'une section ou d'un support de cours (plan multi-établissements, fichier 14, lot EC-1).
 * Un élément est visible des étudiants si l'interrupteur « visible » est allumé **et** si le jour
 * de l'école tombe entre sa date d'ouverture (`visible_du`) et sa date de fermeture
 * (`visible_jusqu_au`), l'une et l'autre incluses et facultatives. L'enseignant voit toujours tout.
 * Une section fermée cache ses supports, quelles que soient leurs propres dates.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Condition Sequelize « visible des étudiants aujourd'hui », à mettre dans un where. */
export const conditionOuverte = (jour = aujourdhui()) => ({
    visible: true,
    [Op.and]: [
        { [Op.or]: [{ visible_du: null }, { visible_du: { [Op.lte]: jour } }] },
        { [Op.or]: [{ visible_jusqu_au: null }, { visible_jusqu_au: { [Op.gte]: jour } }] },
    ],
});

/** Même règle pour un élément déjà chargé. */
export const estOuvert = (element, jour = aujourdhui()) =>
    Boolean(element.visible) && (!element.visible_du || element.visible_du <= jour) && (!element.visible_jusqu_au || element.visible_jusqu_au >= jour);

const lireDate = (valeur, nom) => {
    if (valeur === null || valeur === "") return null;
    const texte = String(valeur);
    // Aller-retour : « 2026-02-30 » est lu comme le 2 mars par Date.parse, mais refusé par MySQL
    const existe = DATE.test(texte) && !Number.isNaN(Date.parse(texte)) && new Date(`${texte}T00:00:00Z`).toISOString().slice(0, 10) === texte;
    if (!existe) throw new ErreurMetier(`${nom} : date invalide (AAAA-MM-JJ)`, 400);
    return texte;
};

/**
 * Changements de dates demandés (null ou chaîne vide : retirer la date), contrôlés avec les dates
 * déjà enregistrées : la fermeture ne précède pas l'ouverture. Rend les seuls champs à écrire.
 */
export const changementsOuverture = ({ visible_du, visible_jusqu_au } = {}, existant = {}) => {
    const changements = {};
    if (visible_du !== undefined) changements.visible_du = lireDate(visible_du, "Date d'ouverture");
    if (visible_jusqu_au !== undefined) changements.visible_jusqu_au = lireDate(visible_jusqu_au, "Date de fermeture");
    const du = "visible_du" in changements ? changements.visible_du : existant.visible_du;
    const jusqu = "visible_jusqu_au" in changements ? changements.visible_jusqu_au : existant.visible_jusqu_au;
    if (du && jusqu && jusqu < du) throw new ErreurMetier("La date de fermeture précède la date d'ouverture", 400);
    return changements;
};
