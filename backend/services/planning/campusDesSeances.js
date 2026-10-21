import { Op } from "sequelize";
import { Affectation, Salle } from "../../models/index.js";
import { STATUTS_ACTIFS } from "./affectationRules.js";

/**
 * Une filière ou une classe n'a pas de campus (décision du 21 octobre 2026) : ses séances vont dans
 * les salles libres de n'importe quel bâtiment. Ce qui s'adresse à « un campus » (événement,
 * annonce) concerne donc les classes qui y ont réellement cours, d'après les salles de leurs séances.
 */

const ajouterJours = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

/** Campus des salles des séances actives de ces groupes entre deux dates (incluses). */
export const campusDesGroupes = async (idsGroupes, debut, fin) => {
    if (!idsGroupes.length) return [];
    const seances = await Affectation.findAll({
        where: { id_groupe: idsGroupes, statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [debut, fin] }, id_salle: { [Op.ne]: null } },
        attributes: ["id_affectation"],
        include: [{ model: Salle, as: "salle", attributes: ["id_campus"] }],
    });
    return [...new Set(seances.map((s) => s.salle?.id_campus).filter(Boolean))];
};

/**
 * Groupes qui ont au moins une séance active dans une salle du campus, du jour donné aux `jours`
 * suivants (30 par défaut) : les destinataires d'une annonce « campus ».
 */
export const groupesAuCampus = async (idCampus, depuis, jours = 30) => {
    const seances = await Affectation.findAll({
        where: { statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [depuis, ajouterJours(depuis, jours)] } },
        attributes: ["id_groupe"],
        include: [{ model: Salle, as: "salle", attributes: [], where: { id_campus: idCampus }, required: true }],
    });
    return [...new Set(seances.map((s) => s.id_groupe))];
};
