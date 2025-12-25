import express from "express";
import { Appartenir, Etudiant, Groupe, Users } from "../models/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les appartenances
router.get("/", async (req, res) => {
    try {
        const appartenances = await Appartenir.findAll({
            include: [
                {
                    model: Etudiant,
                    as: "etudiant",
                    include: [{ model: Users, as: "user" }],
                },
                { model: Groupe, as: "groupe" },
            ],
        });
        res.json(appartenances);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des appartenances",
            error: error.message,
        });
    }
});

// ➕ Ajouter un étudiant à un groupe
router.post("/", async (req, res) => {
    try {
        const appartenance = await Appartenir.create(req.body);
        const appartenanceComplete = await Appartenir.findOne({
            where: {
                id_user_etudiant: appartenance.id_user_etudiant,
                id_groupe: appartenance.id_groupe,
            },
            include: [
                {
                    model: Etudiant,
                    as: "etudiant",
                    include: [{ model: Users, as: "user" }],
                },
                { model: Groupe, as: "groupe" },
            ],
        });
        res.status(201).json(appartenanceComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de l'ajout de l'étudiant au groupe",
            error: error.message,
        });
    }
});

// 🗑️ Retirer un étudiant d'un groupe
router.delete("/etudiant/:id_etudiant/groupe/:id_groupe", async (req, res) => {
    try {
        const appartenance = await Appartenir.findOne({
            where: {
                id_user_etudiant: req.params.id_etudiant,
                id_groupe: req.params.id_groupe,
            },
        });
        if (!appartenance) {
            return res
                .status(404)
                .json({ message: "Appartenance non trouvée" });
        }
        await appartenance.destroy();
        res.json({ message: "Étudiant retiré du groupe avec succès" });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors du retrait de l'étudiant",
            error: error.message,
        });
    }
});

// 🔍 Récupérer le groupe d'un étudiant
router.get("/etudiant/:id_etudiant", async (req, res) => {
    try {
        const appartenance = await Appartenir.findOne({
            where: { id_user_etudiant: req.params.id_etudiant },
            include: [{ model: Groupe, as: "groupe" }],
        });
        if (!appartenance) {
            return res
                .status(404)
                .json({ message: "L'étudiant n'appartient à aucun groupe" });
        }
        res.json(appartenance);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération du groupe",
            error: error.message,
        });
    }
});

// 🔍 Récupérer tous les étudiants d'un groupe
router.get("/groupe/:id_groupe", async (req, res) => {
    try {
        const appartenances = await Appartenir.findAll({
            where: { id_groupe: req.params.id_groupe },
            include: [
                {
                    model: Etudiant,
                    as: "etudiant",
                    include: [{ model: Users, as: "user" }],
                },
            ],
        });
        res.json(appartenances);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des étudiants",
            error: error.message,
        });
    }
});

export default router;
