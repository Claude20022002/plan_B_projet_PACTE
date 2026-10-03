import sequelize from "../config/db.js";
import { Affectation, Creneau } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";
import { recalculerRangs } from "../services/planning/referentiel.js";

/**
 * Contrôleur pour les créneaux : une grille horaire par régime (initiale, continue,
 * executive) et par variante (normale, ramadan). Le rang de chaque créneau dans sa
 * journée est recalculé à chaque modification de la grille.
 */

const CRENEAU_FIELDS = ["jour_semaine", "heure_debut", "heure_fin", "periode", "duree_minutes", "regime", "variante"];

const enMinutes = (heure) => {
    const [h, m] = String(heure).split(":").map(Number);
    return h * 60 + m;
};

const normaliserHeure = (heure) => (heure && String(heure).length === 5 ? `${heure}:00` : heure);

const grilleDe = (creneau) => ({
    jour_semaine: creneau.jour_semaine,
    regime: creneau.regime,
    variante: creneau.variante,
});

const memeGrille = (a, b) => a.jour_semaine === b.jour_semaine && a.regime === b.regime && a.variante === b.variante;

const preparerCreneau = (body, base = {}) => {
    const data = pick(body, CRENEAU_FIELDS);
    if (data.heure_debut) data.heure_debut = normaliserHeure(data.heure_debut);
    if (data.heure_fin) data.heure_fin = normaliserHeure(data.heure_fin);
    const debut = data.heure_debut ?? base.heure_debut;
    const fin = data.heure_fin ?? base.heure_fin;
    if (data.duree_minutes === undefined && debut && fin && (data.heure_debut || data.heure_fin)) {
        data.duree_minutes = enMinutes(fin) - enMinutes(debut);
    }
    return data;
};

const doublon = (data, idExclu = null) =>
    Creneau.findOne({
        where: {
            jour_semaine: data.jour_semaine,
            heure_debut: data.heure_debut,
            heure_fin: data.heure_fin,
            regime: data.regime ?? "initiale",
            variante: data.variante ?? "normale",
        },
    }).then((existant) => existant && existant.id_creneau !== idExclu);

// 🔍 Récupérer tous les créneaux (avec pagination)
export const getAllCreneaux = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 20);

    const where = {};
    for (const filtre of ["jour_semaine", "regime", "variante"]) {
        if (req.query[filtre]) where[filtre] = req.query[filtre];
    }

    const { count, rows: creneaux } = await Creneau.findAndCountAll({
        where,
        limit,
        offset,
        order: [
            ["regime", "ASC"],
            ["variante", "ASC"],
            ["jour_semaine", "ASC"],
            ["rang", "ASC"],
            ["heure_debut", "ASC"],
        ],
    });

    res.json(createPaginationResponse(creneaux, count, page, limit));
});

// 🔍 Récupérer un créneau par ID
export const getCreneauById = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: { id_creneau: req.params.id } });

    if (!creneau) {
        return res.status(404).json({
            message: "Créneau non trouvé",
            error: `Aucun créneau trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(creneau);
});

// ➕ Créer un créneau
export const createCreneau = asyncHandler(async (req, res) => {
    const data = preparerCreneau(req.body);
    if (enMinutes(data.heure_fin) <= enMinutes(data.heure_debut)) {
        return res.status(400).json({ message: "Erreur de validation", error: "L'heure de fin doit suivre l'heure de début" });
    }
    if (await doublon(data)) {
        return res.status(409).json({
            message: "Créneau déjà existant",
            error: "Un créneau identique existe déjà dans cette grille",
        });
    }

    const creneau = await sequelize.transaction(async (transaction) => {
        const cree = await Creneau.create(data, { transaction });
        await recalculerRangs(grilleDe(cree), transaction);
        return cree.reload({ transaction });
    });

    res.status(201).json({
        message: "Créneau créé avec succès",
        creneau,
    });
});

// ✏️ Mettre à jour un créneau
export const updateCreneau = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: { id_creneau: req.params.id } });

    if (!creneau) {
        return res.status(404).json({
            message: "Créneau non trouvé",
            error: `Aucun créneau trouvé avec l'ID ${req.params.id}`,
        });
    }

    const data = preparerCreneau(req.body, creneau);
    const apres = { ...creneau.toJSON(), ...data };
    if (enMinutes(apres.heure_fin) <= enMinutes(apres.heure_debut)) {
        return res.status(400).json({ message: "Erreur de validation", error: "L'heure de fin doit suivre l'heure de début" });
    }
    if (await doublon(apres, creneau.id_creneau)) {
        return res.status(409).json({
            message: "Créneau déjà existant",
            error: "Un créneau identique existe déjà dans cette grille",
        });
    }

    const grilleAvant = grilleDe(creneau);
    await sequelize.transaction(async (transaction) => {
        await creneau.update(data, { transaction });
        await recalculerRangs(grilleDe(creneau), transaction);
        if (!memeGrille(grilleAvant, grilleDe(creneau))) await recalculerRangs(grilleAvant, transaction);
        await creneau.reload({ transaction });
    });

    res.json({
        message: "Créneau mis à jour avec succès",
        creneau,
    });
});

// 🗑️ Supprimer un créneau
export const deleteCreneau = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: { id_creneau: req.params.id } });

    if (!creneau) {
        return res.status(404).json({
            message: "Créneau non trouvé",
            error: `Aucun créneau trouvé avec l'ID ${req.params.id}`,
        });
    }

    const seances = await Affectation.count({ where: { id_creneau: creneau.id_creneau } });
    if (seances > 0) {
        return res.status(409).json({
            message: "Créneau utilisé",
            error: `${seances} séance(s) utilisent ce créneau : déplacez-les avant de le supprimer`,
        });
    }

    await sequelize.transaction(async (transaction) => {
        await creneau.destroy({ transaction });
        await recalculerRangs(grilleDe(creneau), transaction);
    });

    res.json({
        message: "Créneau supprimé avec succès",
    });
});
