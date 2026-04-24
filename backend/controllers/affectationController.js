import {
    Affectation,
    Cours,
    Groupe,
    Salle,
    Creneau,
    Users,
} from "../models/index.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { verifierEtCreerConflits } from "../utils/detectConflicts.js";
import { notifierNouvelleAffectation } from "../utils/notificationHelper.js";

/**
 * Contrôleur pour les affectations
 */

// 🔍 Récupérer toutes les affectations (avec pagination)
export const getAllAffectations = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.statut) {
        where.statut = req.query.statut;
    }
    if (req.query.date_seance) {
        where.date_seance = req.query.date_seance;
    }
    // Filtre incrémental pour la sync offline (updated_after)
    if (req.query.updated_after) {
        where.updatedAt = { [Op.gt]: new Date(req.query.updated_after) };
    }

    const { count, rows: affectations } = await Affectation.findAndCountAll({
        where,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            {
                model: Users,
                as: "admin_createur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        limit,
        offset,
        order: [["date_seance", "DESC"], ["id_affectation", "DESC"]],
    });

    res.json(createPaginationResponse(affectations, count, page, limit));
});

// 🔍 Récupérer une affectation par ID
export const getAffectationById = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id, {
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            {
                model: Users,
                as: "admin_createur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!affectation) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id}`,
        });
    }

    res.json(affectation);
});

// ➕ Créer une affectation
export const createAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.create(req.body);

    // Détecter les conflits automatiquement
    const conflits = await verifierEtCreerConflits(affectation);

    const affectationComplete = await Affectation.findByPk(
        affectation.id_affectation,
        {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    // Notifier l'enseignant de la nouvelle affectation
    if (affectation.id_user_enseignant) {
        try {
            await notifierNouvelleAffectation({
                id_user_enseignant: affectation.id_user_enseignant,
                affectation: affectationComplete,
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi de la notification:", error);
            // Ne pas bloquer la réponse si la notification échoue
        }
    }

    res.status(201).json({
        message: "Affectation créée avec succès",
        affectation: affectationComplete,
        conflits_detectes: conflits.length,
        conflits: conflits,
    });
});

// ✏️ Mettre à jour une affectation
export const updateAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id);

    if (!affectation) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id}`,
        });
    }

    await affectation.update(req.body);

    // Re-vérifier les conflits après modification
    const conflits = await verifierEtCreerConflits(affectation);

    const affectationComplete = await Affectation.findByPk(
        affectation.id_affectation,
        {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.json({
        message: "Affectation mise à jour avec succès",
        affectation: affectationComplete,
        conflits_detectes: conflits.length,
        conflits: conflits,
    });
});

// 🗑️ Supprimer une affectation
export const deleteAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id);

    if (!affectation) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id}`,
        });
    }

    await affectation.destroy();

    res.json({
        message: "Affectation supprimée avec succès",
    });
});

// 🔍 Récupérer les affectations par enseignant (avec pagination)
export const getAffectationsByEnseignant = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = { id_user_enseignant: req.params.id_enseignant };
    if (req.query.date_from && req.query.date_to) {
        where.date_seance = { [Op.between]: [req.query.date_from, req.query.date_to] };
    } else if (req.query.date_from) {
        where.date_seance = { [Op.gte]: req.query.date_from };
    }

    const { count, rows: affectations } = await Affectation.findAndCountAll({
        where,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        limit,
        offset,
        order: [["date_seance", "ASC"], ["id_affectation", "ASC"]],
    });

    res.json(createPaginationResponse(affectations, count, page, limit));
});

// ✅ Confirmer une affectation (Enseignant propriétaire seulement)
export const confirmerAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id);

    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    const isOwner = affectation.id_user_enseignant === req.user.id_user;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Accès refusé : cette affectation ne vous appartient pas" });
    }

    if (affectation.statut !== "planifie") {
        return res.status(400).json({
            message: `Impossible de confirmer : statut actuel "${affectation.statut}"`,
        });
    }

    await affectation.update({ statut: "confirme" });

    res.json({ message: "Affectation confirmée avec succès", affectation });
});

// 🔍 Récupérer les affectations par groupe (avec pagination)
export const getAffectationsByGroupe = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = { id_groupe: req.params.id_groupe };
    if (req.query.date_from && req.query.date_to) {
        where.date_seance = { [Op.between]: [req.query.date_from, req.query.date_to] };
    } else if (req.query.date_from) {
        where.date_seance = { [Op.gte]: req.query.date_from };
    }

    const { count, rows: affectations } = await Affectation.findAndCountAll({
        where,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        limit,
        offset,
        order: [["date_seance", "ASC"], ["id_affectation", "ASC"]],
    });

    res.json(createPaginationResponse(affectations, count, page, limit));
});
