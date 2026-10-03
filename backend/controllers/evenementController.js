import { Op } from "sequelize";
import { Evenement, Campus, Filiere, Groupe } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Événements du calendrier : vacances, fériés, examens, Ramadan, stages, réunions…
 * Un événement « bloquant » interdit les séances de sa portée sur ses dates.
 */

const EVENEMENT_FIELDS = [
    "titre",
    "description",
    "date_debut",
    "date_fin",
    "type_evenement",
    "bloque_affectations",
    "portee",
    "id_cible",
    "niveau",
    "date_confirmee",
];

const CIBLE_PAR_PORTEE = { campus: Campus, filiere: Filiere, niveau: Filiere, groupe: Groupe };

const introuvable = (res, id) =>
    res.status(404).json({ message: "Événement non trouvé", error: `Aucun événement avec l'ID ${id}` });

/** Cohérence dates / portée / cible. Retourne un message d'erreur ou null. */
const verifierEvenement = async (data) => {
    if (data.date_fin < data.date_debut) return "La date de fin doit être égale ou postérieure à la date de début";

    const portee = data.portee || "etablissement";
    if (portee === "etablissement") {
        data.id_cible = null;
        data.niveau = null;
        return null;
    }
    if (!data.id_cible) return `La portée « ${portee} » demande une cible (id_cible)`;
    const cible = await CIBLE_PAR_PORTEE[portee].findByPk(data.id_cible);
    if (!cible) return `Cible introuvable pour la portée « ${portee} »`;
    if (portee === "niveau" && !data.niveau) return "La portée « niveau » demande le niveau concerné";
    if (portee !== "niveau") data.niveau = null;
    return null;
};

// 🔍 Liste, filtrable par période (date_from / date_to), type et confirmation
export const getEvenements = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.date_from && req.query.date_to) {
        where.date_debut = { [Op.lte]: req.query.date_to };
        where.date_fin = { [Op.gte]: req.query.date_from };
    }
    if (req.query.type_evenement) where.type_evenement = req.query.type_evenement;
    if (req.query.a_confirmer === "true") where.date_confirmee = false;

    const evenements = await Evenement.findAll({ where, order: [["date_debut", "ASC"]] });
    res.json(evenements);
});

export const getEvenementById = asyncHandler(async (req, res) => {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return introuvable(res, req.params.id);
    res.json(evenement);
});

export const createEvenement = asyncHandler(async (req, res) => {
    const data = pick(req.body, EVENEMENT_FIELDS);
    const probleme = await verifierEvenement(data);
    if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });

    const evenement = await Evenement.create({ ...data, id_user_createur: req.user.id_user });
    res.status(201).json({ message: "Événement créé", evenement });
});

export const updateEvenement = asyncHandler(async (req, res) => {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return introuvable(res, req.params.id);

    const data = { ...evenement.toJSON(), ...pick(req.body, EVENEMENT_FIELDS) };
    const probleme = await verifierEvenement(data);
    if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });

    await evenement.update(pick(data, EVENEMENT_FIELDS));
    res.json({ message: "Événement mis à jour", evenement });
});

/**
 * ✔️ Confirmer une date (fête religieuse annoncée officiellement), éventuellement décalée.
 * Les séances touchées par un décalage seront replanifiées en phase P6.
 */
export const confirmerEvenement = asyncHandler(async (req, res) => {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return introuvable(res, req.params.id);

    const data = {
        date_debut: req.body.date_debut ?? evenement.date_debut,
        date_fin: req.body.date_fin ?? evenement.date_fin,
    };
    if (data.date_fin < data.date_debut) {
        return res.status(400).json({ message: "Erreur de validation", error: "La date de fin doit suivre la date de début" });
    }
    const decale = data.date_debut !== evenement.date_debut || data.date_fin !== evenement.date_fin;

    await evenement.update({ ...data, date_confirmee: true });
    res.json({ message: decale ? "Date confirmée et décalée" : "Date confirmée", decale, evenement });
});

export const deleteEvenement = asyncHandler(async (req, res) => {
    const evenement = await Evenement.findByPk(req.params.id);
    if (!evenement) return introuvable(res, req.params.id);
    await evenement.destroy();
    res.json({ message: "Événement supprimé" });
});
