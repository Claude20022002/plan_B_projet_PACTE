import express from "express";
import { HistoriqueAffectation, Affectation, Users } from "../models/index.js";

const router = express.Router();

// 🔍 Récupérer tout l'historique des affectations
router.get("/", async (req, res) => {
    try {
        const historiques = await HistoriqueAffectation.findAll({
            include: [
                { model: Affectation, as: "affectation" },
                { model: Users, as: "user_modificateur" },
            ],
            order: [["date_action", "DESC"]],
        });
        res.json(historiques);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de l'historique",
            error: error.message,
        });
    }
});

// 🔍 Récupérer un historique par ID
router.get("/:id", async (req, res) => {
    try {
        const historique = await HistoriqueAffectation.findByPk(req.params.id, {
            include: [
                { model: Affectation, as: "affectation" },
                { model: Users, as: "user_modificateur" },
            ],
        });
        if (!historique) {
            return res.status(404).json({ message: "Historique non trouvé" });
        }
        res.json(historique);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de l'historique",
            error: error.message,
        });
    }
});

// ➕ Créer un historique
router.post("/", async (req, res) => {
    try {
        const historique = await HistoriqueAffectation.create(req.body);
        const historiqueComplete = await HistoriqueAffectation.findByPk(
            historique.id_historique,
            {
                include: [
                    { model: Affectation, as: "affectation" },
                    { model: Users, as: "user_modificateur" },
                ],
            }
        );
        res.status(201).json(historiqueComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la création de l'historique",
            error: error.message,
        });
    }
});

// 🔍 Récupérer l'historique d'une affectation
router.get("/affectation/:id_affectation", async (req, res) => {
    try {
        const historiques = await HistoriqueAffectation.findAll({
            where: { id_affectation: req.params.id_affectation },
            include: [{ model: Users, as: "user_modificateur" }],
            order: [["date_action", "DESC"]],
        });
        res.json(historiques);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de l'historique",
            error: error.message,
        });
    }
});

// 🔍 Récupérer l'historique par utilisateur
router.get("/user/:id_user", async (req, res) => {
    try {
        const historiques = await HistoriqueAffectation.findAll({
            where: { id_user: req.params.id_user },
            include: [{ model: Affectation, as: "affectation" }],
            order: [["date_action", "DESC"]],
        });
        res.json(historiques);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de l'historique",
            error: error.message,
        });
    }
});

// 🔍 Récupérer l'historique par action
router.get("/action/:action", async (req, res) => {
    try {
        const historiques = await HistoriqueAffectation.findAll({
            where: { action: req.params.action },
            include: [
                { model: Affectation, as: "affectation" },
                { model: Users, as: "user_modificateur" },
            ],
            order: [["date_action", "DESC"]],
        });
        res.json(historiques);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de l'historique",
            error: error.message,
        });
    }
});

export default router;
