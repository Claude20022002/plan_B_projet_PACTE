import express from "express";
import { Op } from "sequelize";
import { Conflit, ConflitAffectation, Affectation } from "../models/index.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

const router = express.Router();

// 🔍 Récupérer tous les conflits (paginé) — admin uniquement
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req, 10);

        const where = {};
        if (req.query.resolu !== undefined) {
            where.resolu = req.query.resolu === 'true';
        }

        const { count, rows: conflits } = await Conflit.findAndCountAll({
            where,
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    through: { attributes: [] },
                },
            ],
            limit,
            offset,
            order: [["id_conflit", "DESC"]],
        });

        res.json(createPaginationResponse(conflits, count, page, limit));
    } catch (error) {
        res.status(500).json({ message: "Erreur de récupération des conflits", error: error.message });
    }
});

// 🔍 Récupérer les conflits non résolus (paginé) — avant /:id pour éviter le shadowing
router.get("/non-resolus/liste", authenticateToken, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req, 10);

        const { count, rows: conflits } = await Conflit.findAndCountAll({
            where: { resolu: false },
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    through: { attributes: [] },
                },
            ],
            limit,
            offset,
            order: [["id_conflit", "DESC"]],
        });

        res.json(createPaginationResponse(conflits, count, page, limit));
    } catch (error) {
        res.status(500).json({ message: "Erreur de récupération des conflits non résolus", error: error.message });
    }
});

// 🔍 Récupérer un conflit par ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const conflit = await Conflit.findByPk(req.params.id, {
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    through: { attributes: [] },
                },
            ],
        });
        if (!conflit) {
            return res.status(404).json({ message: "Conflit non trouvé" });
        }
        res.json(conflit);
    } catch (error) {
        res.status(500).json({ message: "Erreur de récupération du conflit", error: error.message });
    }
});

// ➕ Créer un conflit — admin uniquement
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const conflit = await Conflit.create(req.body);
        const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    through: { attributes: [] },
                },
            ],
        });
        res.status(201).json(conflitComplete);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la création du conflit", error: error.message });
    }
});

// ✏️ Mettre à jour un conflit (résolution) — admin uniquement
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const conflit = await Conflit.findByPk(req.params.id);
        if (!conflit) {
            return res.status(404).json({ message: "Conflit non trouvé" });
        }
        await conflit.update(req.body);
        const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    through: { attributes: [] },
                },
            ],
        });
        res.json(conflitComplete);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la mise à jour du conflit", error: error.message });
    }
});

// 🗑️ Supprimer un conflit — admin uniquement
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const conflit = await Conflit.findByPk(req.params.id);
        if (!conflit) {
            return res.status(404).json({ message: "Conflit non trouvé" });
        }
        await conflit.destroy();
        res.json({ message: "Conflit supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression du conflit", error: error.message });
    }
});

// ➕ Associer une affectation à un conflit — admin uniquement
router.post("/:id_conflit/affectation/:id_affectation", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const conflitAffectation = await ConflitAffectation.create({
            id_conflit: req.params.id_conflit,
            id_affectation: req.params.id_affectation,
        });
        res.status(201).json(conflitAffectation);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de l'association du conflit à l'affectation", error: error.message });
    }
});

// 🗑️ Dissocier une affectation d'un conflit — admin uniquement
router.delete("/:id_conflit/affectation/:id_affectation", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const conflitAffectation = await ConflitAffectation.findOne({
            where: {
                id_conflit: req.params.id_conflit,
                id_affectation: req.params.id_affectation,
            },
        });
        if (!conflitAffectation) {
            return res.status(404).json({ message: "Association non trouvée" });
        }
        await conflitAffectation.destroy();
        res.json({ message: "Association supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la dissociation", error: error.message });
    }
});

export default router;
