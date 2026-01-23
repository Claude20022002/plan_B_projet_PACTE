import express from "express";
import { DemandeReport, Affectation, Users } from "../models/index.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { traiterDemandeReport } from "../controllers/demandeReportController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// 🔍 Récupérer toutes les demandes de report
router.get("/", async (req, res) => {
    try {
        const demandes = await DemandeReport.findAll({
            include: [
                { model: Users, as: "enseignant" },
                { model: Affectation, as: "affectation" },
            ],
        });
        res.json(demandes);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des demandes de report",
            error: error.message,
        });
    }
});

// 🔍 Récupérer une demande de report par ID
router.get("/:id", async (req, res) => {
    try {
        const demande = await DemandeReport.findByPk(req.params.id, {
            include: [
                { model: Users, as: "enseignant" },
                { model: Affectation, as: "affectation" },
            ],
        });
        if (!demande) {
            return res
                .status(404)
                .json({ message: "Demande de report non trouvée" });
        }
        res.json(demande);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de la demande de report",
            error: error.message,
        });
    }
});

// ➕ Créer une demande de report
router.post("/", async (req, res) => {
    try {
        const demande = await DemandeReport.create(req.body);
        const demandeComplete = await DemandeReport.findByPk(
            demande.id_demande,
            {
                include: [
                    { model: Users, as: "enseignant" },
                    { model: Affectation, as: "affectation" },
                ],
            }
        );
        res.status(201).json(demandeComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la création de la demande de report",
            error: error.message,
        });
    }
});

// ✏️ Mettre à jour une demande de report
router.put("/:id", async (req, res) => {
    try {
        const demande = await DemandeReport.findByPk(req.params.id);
        if (!demande) {
            return res
                .status(404)
                .json({ message: "Demande de report non trouvée" });
        }
        await demande.update(req.body);
        const demandeComplete = await DemandeReport.findByPk(
            demande.id_demande,
            {
                include: [
                    { model: Users, as: "enseignant" },
                    { model: Affectation, as: "affectation" },
                ],
            }
        );
        res.json(demandeComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la mise à jour de la demande de report",
            error: error.message,
        });
    }
});

// 🗑️ Supprimer une demande de report
router.delete("/:id", async (req, res) => {
    try {
        const demande = await DemandeReport.findByPk(req.params.id);
        if (!demande) {
            return res
                .status(404)
                .json({ message: "Demande de report non trouvée" });
        }
        await demande.destroy();
        res.json({ message: "Demande de report supprimée avec succès" });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression de la demande de report",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les demandes de report par enseignant
router.get("/enseignant/:id_enseignant", async (req, res) => {
    try {
        const demandes = await DemandeReport.findAll({
            where: { id_user_enseignant: req.params.id_enseignant },
            include: [{ model: Affectation, as: "affectation" }],
        });
        res.json(demandes);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des demandes de report",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les demandes de report par statut
router.get("/statut/:statut", async (req, res) => {
    try {
        const demandes = await DemandeReport.findAll({
            where: { statut_demande: req.params.statut },
            include: [
                { model: Users, as: "enseignant" },
                { model: Affectation, as: "affectation" },
            ],
        });
        res.json(demandes);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des demandes de report",
            error: error.message,
        });
    }
});

// ✅ Traiter une demande de report (approuver ou refuser) - Admin seulement
router.patch(
    "/:id/traiter",
    authenticateToken,
    requireAdmin,
    asyncHandler(traiterDemandeReport)
);

export default router;
