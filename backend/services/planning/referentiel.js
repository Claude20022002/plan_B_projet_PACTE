import { Creneau, ParametrePlanning, TrajetCampus } from "../../models/index.js";
import { PARAMETRES_PLANNING } from "../../config/parametresPlanning.js";

/**
 * Recalcule le rang (position dans la journée) des créneaux d'une grille :
 * même jour, même régime, même variante, triés par heure de début.
 */
export const recalculerRangs = async ({ jour_semaine, regime, variante }, transaction) => {
    const creneaux = await Creneau.findAll({
        where: { jour_semaine, regime, variante },
        order: [["heure_debut", "ASC"], ["heure_fin", "ASC"]],
        transaction,
    });
    for (const [index, creneau] of creneaux.entries()) {
        if (creneau.rang !== index + 1) {
            await creneau.update({ rang: index + 1 }, { transaction });
        }
    }
};

/** Paramètres de planification : valeurs modifiées en base, sinon valeurs par défaut. */
export const lireParametres = async () => {
    const lignes = await ParametrePlanning.findAll();
    const enBase = new Map(lignes.map((ligne) => [ligne.cle, ligne.valeur]));
    return Object.fromEntries(
        Object.entries(PARAMETRES_PLANNING).map(([cle, { defaut, description }]) => [
            cle,
            { valeur: enBase.has(cle) ? enBase.get(cle) : defaut, defaut, description, modifie: enBase.has(cle) },
        ])
    );
};

export const lireParametre = async (cle) => {
    const ligne = await ParametrePlanning.findByPk(cle);
    return ligne ? ligne.valeur : PARAMETRES_PLANNING[cle]?.defaut;
};

/** Paire de campus rangée (a < b) : une seule ligne de trajet par paire. */
export const paireCampus = (idA, idB) => {
    const [a, b] = [Number(idA), Number(idB)].sort((x, y) => x - y);
    return { id_campus_a: a, id_campus_b: b };
};

/** Minutes nécessaires pour passer d'un campus à un autre (0 sur le même campus). */
export const minutesTrajet = async (idCampusDepart, idCampusArrivee) => {
    if (Number(idCampusDepart) === Number(idCampusArrivee)) return 0;
    const trajet = await TrajetCampus.findOne({ where: paireCampus(idCampusDepart, idCampusArrivee) });
    return trajet ? trajet.minutes : lireParametre("trajet_inter_campus_defaut_minutes");
};
