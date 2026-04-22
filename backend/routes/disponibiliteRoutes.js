import express from "express";
import { Disponibilite, Users, Creneau } from "../models/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
} from "../middleware/index.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification

// 🔍 Récupérer toutes les disponibilités (admin uniquement)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const disponibilites = await Disponibilite.findAll({
            include: [
                { model: Users, as: "enseignant" },
                { model: Creneau, as: "creneau" },
            ],
        });
        res.json(disponibilites);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des disponibilités",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les disponibilités d'un enseignant (avant /:id pour éviter le shadowing)
// Accessible par l'enseignant concerné ou l'admin
router.get("/enseignant/:id_enseignant", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const disponibilites = await Disponibilite.findAll({
            where: { id_user_enseignant: req.params.id_enseignant },
            include: [{ model: Creneau, as: "creneau" }],
        });
        res.json(disponibilites);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des disponibilités",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les indisponibilités d'un enseignant (avant /:id pour éviter le shadowing)
// Accessible par l'enseignant concerné ou l'admin
router.get("/enseignant/:id_enseignant/indisponibilites", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const indisponibilites = await Disponibilite.findAll({
            where: {
                id_user_enseignant: req.params.id_enseignant,
                disponible: false,
            },
            include: [{ model: Creneau, as: "creneau" }],
        });
        res.json(indisponibilites);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des indisponibilités",
            error: error.message,
        });
    }
});

// 🔍 Récupérer une disponibilité par ID (tout utilisateur authentifié)
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.findByPk(req.params.id, {
            include: [
                { model: Users, as: "enseignant" },
                { model: Creneau, as: "creneau" },
            ],
        });
        if (!disponibilite) {
            return res
                .status(404)
                .json({ message: "Disponibilité non trouvée" });
        }
        res.json(disponibilite);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de la disponibilité",
            error: error.message,
        });
    }
});

// ➕ Créer une disponibilité (enseignant ou admin)
router.post("/", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.create(req.body);
        const disponibiliteComplete = await Disponibilite.findByPk(
            disponibilite.id_disponibilite,
            {
                include: [
                    { model: Users, as: "enseignant" },
                    { model: Creneau, as: "creneau" },
                ],
            }
        );
        res.status(201).json(disponibiliteComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la création de la disponibilité",
            error: error.message,
        });
    }
});

// ✏️ Mettre à jour une disponibilité (enseignant ou admin)
router.put("/:id", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.findByPk(req.params.id);
        if (!disponibilite) {
            return res
                .status(404)
                .json({ message: "Disponibilité non trouvée" });
        }
        await disponibilite.update(req.body);
        const disponibiliteComplete = await Disponibilite.findByPk(
            disponibilite.id_disponibilite,
            {
                include: [
                    { model: Users, as: "enseignant" },
                    { model: Creneau, as: "creneau" },
                ],
            }
        );
        res.json(disponibiliteComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la mise à jour de la disponibilité",
            error: error.message,
        });
    }
});

// 🗑️ Supprimer une disponibilité (admin uniquement)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.findByPk(req.params.id);
        if (!disponibilite) {
            return res
                .status(404)
                .json({ message: "Disponibilité non trouvée" });
        }
        await disponibilite.destroy();
        res.json({ message: "Disponibilité supprimée avec succès" });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression de la disponibilité",
            error: error.message,
        });
    }
});

export default router;