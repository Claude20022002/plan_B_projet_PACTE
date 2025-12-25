import express from "express";
import { Disponibilite, Users, Creneau } from "../models/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les disponibilités
router.get("/", async (req, res) => {
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

// 🔍 Récupérer une disponibilité par ID
router.get("/:id", async (req, res) => {
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

// ➕ Créer une disponibilité
router.post("/", async (req, res) => {
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

// ✏️ Mettre à jour une disponibilité
router.put("/:id", async (req, res) => {
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

// 🗑️ Supprimer une disponibilité
router.delete("/:id", async (req, res) => {
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

// 🔍 Récupérer les disponibilités d'un enseignant
router.get("/enseignant/:id_enseignant", async (req, res) => {
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

// 🔍 Récupérer les indisponibilités d'un enseignant
router.get("/enseignant/:id_enseignant/indisponibilites", async (req, res) => {
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

export default router;
