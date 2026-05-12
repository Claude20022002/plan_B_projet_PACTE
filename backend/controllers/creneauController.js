import { Creneau } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { tenantWhere, withTenant } from "../utils/tenantHelper.js";

/**
 * Contrôleur pour les créneaux
 */

// 🔍 Récupérer tous les créneaux (avec pagination)
export const getAllCreneaux = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 20);

    // Filtres optionnels
    const where = tenantWhere(req);
    if (req.query.jour_semaine) {
        where.jour_semaine = req.query.jour_semaine;
    }

    const { count, rows: creneaux } = await Creneau.findAndCountAll({
        where,
        limit,
        offset,
        order: [
            ["jour_semaine", "ASC"],
            ["heure_debut", "ASC"],
        ],
    });

    res.json(createPaginationResponse(creneaux, count, page, limit));
});

// 🔍 Récupérer un créneau par ID
export const getCreneauById = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: tenantWhere(req, { id_creneau: req.params.id }) });

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
    // Vérifier l'unicité du créneau (jour + heure_debut + heure_fin)
    if (req.body.jour_semaine && req.body.heure_debut && req.body.heure_fin) {
        const existingCreneau = await Creneau.findOne({
            where: {
                jour_semaine: req.body.jour_semaine,
                heure_debut: req.body.heure_debut,
                heure_fin: req.body.heure_fin,
                id_institution: req.tenant.id_institution,
            },
        });
        if (existingCreneau) {
            return res.status(409).json({
                message: "Créneau déjà existant",
                error: `Un créneau avec ces caractéristiques existe déjà`,
            });
        }
    }

    const creneau = await Creneau.create(withTenant(req, req.body));

    res.status(201).json({
        message: "Créneau créé avec succès",
        creneau,
    });
});

// ✏️ Mettre à jour un créneau
export const updateCreneau = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: tenantWhere(req, { id_creneau: req.params.id }) });

    if (!creneau) {
        return res.status(404).json({
            message: "Créneau non trouvé",
            error: `Aucun créneau trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Vérifier l'unicité si les horaires changent
    if (
        (req.body.jour_semaine || req.body.heure_debut || req.body.heure_fin) &&
        (req.body.jour_semaine !== creneau.jour_semaine ||
            req.body.heure_debut !== creneau.heure_debut ||
            req.body.heure_fin !== creneau.heure_fin)
    ) {
        const existingCreneau = await Creneau.findOne({
            where: {
                jour_semaine: req.body.jour_semaine || creneau.jour_semaine,
                heure_debut: req.body.heure_debut || creneau.heure_debut,
                heure_fin: req.body.heure_fin || creneau.heure_fin,
                id_institution: req.tenant.id_institution,
            },
        });
        if (existingCreneau && existingCreneau.id_creneau !== creneau.id_creneau) {
            return res.status(409).json({
                message: "Créneau déjà existant",
                error: `Un créneau avec ces caractéristiques existe déjà`,
            });
        }
    }

    await creneau.update(withTenant(req, req.body));

    res.json({
        message: "Créneau mis à jour avec succès",
        creneau,
    });
});

// 🗑️ Supprimer un créneau
export const deleteCreneau = asyncHandler(async (req, res) => {
    const creneau = await Creneau.findOne({ where: tenantWhere(req, { id_creneau: req.params.id }) });

    if (!creneau) {
        return res.status(404).json({
            message: "Créneau non trouvé",
            error: `Aucun créneau trouvé avec l'ID ${req.params.id}`,
        });
    }

    await creneau.destroy();

    res.json({
        message: "Créneau supprimé avec succès",
    });
});
