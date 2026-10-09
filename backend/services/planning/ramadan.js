import { Op } from "sequelize";
import { Creneau, Evenement } from "../../models/index.js";

/**
 * Grille du Ramadan (phase P6) : entre les dates d'un événement « ramadan », une séance garde
 * son rang mais prend les horaires du créneau « ramadan » de même jour, même grille et même
 * rang. La semaine type ne bouge pas ; seuls les horaires changent. Sans créneau ramadan
 * correspondant, les horaires normaux restent.
 */

/** Variantes applicables entre deux dates, ou null s'il n'y a pas de Ramadan sur la plage. */
const variantesEntre = async (debut, fin, transaction) => {
    const periodes = await Evenement.findAll({
        where: { type_evenement: "ramadan", date_debut: { [Op.lte]: fin }, date_fin: { [Op.gte]: debut } },
        attributes: ["date_debut", "date_fin"],
        transaction,
    });
    if (!periodes.length) return null;
    const creneaux = await Creneau.findAll({ where: { variante: "ramadan" }, transaction });
    const parCle = new Map(creneaux.map((c) => [`${c.jour_semaine}|${c.regime}|${c.rang}`, c]));
    return {
        estRamadan: (date) => periodes.some((p) => p.date_debut <= date && date <= p.date_fin),
        variante: (creneau) => parCle.get(`${creneau.jour_semaine}|${creneau.regime}|${creneau.rang}`) ?? null,
    };
};

/**
 * Créneau effectif d'une séance à une date : le créneau lui-même, ou une copie portant les
 * horaires ramadan (même identifiant : disponibilités et vœux restent ceux du créneau normal).
 */
export const creneauEffectif = async (creneau, date, { transaction, cache = null } = {}) => {
    if (!creneau || creneau.variante === "ramadan") return creneau;
    // Avec un cache : une seule lecture du calendrier par date
    const variantes = cache
        ? await (cache.get(`ramadan|${date}`) ?? cache.set(`ramadan|${date}`, variantesEntre(date, date, transaction)).get(`ramadan|${date}`))
        : await variantesEntre(date, date, transaction);
    const ramadan = variantes?.estRamadan(date) ? variantes.variante(creneau) : null;
    if (!ramadan) return creneau;
    const base = typeof creneau.get === "function" ? creneau.get({ plain: true }) : creneau;
    return { ...base, heure_debut: ramadan.heure_debut, heure_fin: ramadan.heure_fin, variante_appliquee: "ramadan" };
};

/**
 * Pour les calculs en masse sur des lignes brutes (sans instances à modifier) : renvoie
 * (créneau, date) → créneau ramadan correspondant, ou le créneau lui-même. Une seule lecture
 * du calendrier pour toute la plage.
 */
export const horairesSurPlage = async (debut, fin, { transaction } = {}) => {
    const variantes = debut ? await variantesEntre(debut, fin, transaction) : null;
    return (creneau, date) => (variantes && creneau && creneau.variante !== "ramadan" && variantes.estRamadan(date) && variantes.variante(creneau)) || creneau;
};

/**
 * Remplace, dans des séances chargées avec leur créneau, les horaires des jours de Ramadan
 * (pour l'affichage et pour les calculs d'occupation). Modifie les instances en mémoire.
 */
export const appliquerRamadan = async (affectations, { transaction } = {}) => {
    const concernees = affectations.filter((a) => a?.creneau && a.creneau.variante !== "ramadan");
    if (!concernees.length) return affectations;
    const dates = concernees.map((a) => String(a.date_seance).slice(0, 10)).sort();
    const variantes = await variantesEntre(dates[0], dates[dates.length - 1], transaction);
    if (!variantes) return affectations;
    for (const a of concernees) {
        if (!variantes.estRamadan(String(a.date_seance).slice(0, 10))) continue;
        const ramadan = variantes.variante(a.creneau);
        if (!ramadan) continue;
        a.creneau.setDataValue("heure_debut", ramadan.heure_debut);
        a.creneau.setDataValue("heure_fin", ramadan.heure_fin);
        a.creneau.setDataValue("variante_appliquee", "ramadan");
    }
    return affectations;
};
