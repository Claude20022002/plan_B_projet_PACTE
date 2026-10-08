import express from "express";
import { Disponibilite, Users, Creneau } from "../models/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
} from "../middleware/index.js";
import { detailErreur } from "../middleware/errorHandler.js";
import { pick } from "../utils/validationHelper.js";

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
            error: detailErreur(error),
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
            error: detailErreur(error),
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
            error: detailErreur(error),
        });
    }
});

// 🔍 Récupérer une disponibilité par ID (tout utilisateur authentifié)
router.get("/:id", authenticateToken, requireEnseignant, async (req, res) => {
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
            error: detailErreur(error),
        });
    }
});

// Champs modifiables d'une déclaration ; l'enseignant concerné vient de la session pour un enseignant
const DISPONIBILITE_FIELDS = ["disponible", "raison_indisponibilite", "preference", "date_debut", "date_fin", "id_creneau", "id_user_enseignant"];

const preparerDisponibilite = (req) => {
    const data = pick(req.body, DISPONIBILITE_FIELDS);
    // Un enseignant ne déclare que pour lui-même ; l'administration peut déclarer pour n'importe qui
    if (req.user.role !== "admin") data.id_user_enseignant = req.user.id_user;
    return data;
};

const proprietaireOuAdmin = (req, disponibilite) =>
    req.user.role === "admin" || disponibilite.id_user_enseignant === req.user.id_user;

// ➕ Créer une disponibilité (enseignant pour lui-même, ou admin)
router.post("/", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.create(preparerDisponibilite(req));
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
            error: detailErreur(error),
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
        if (!proprietaireOuAdmin(req, disponibilite)) {
            return res.status(403).json({ message: "Accès interdit", error: "Vous ne pouvez modifier que vos propres disponibilités" });
        }
        await disponibilite.update(preparerDisponibilite(req));
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
            error: detailErreur(error),
        });
    }
});

// 🗑️ Supprimer une disponibilité (l'enseignant concerné ou l'administration)
router.delete("/:id", authenticateToken, requireEnseignant, async (req, res) => {
    try {
        const disponibilite = await Disponibilite.findByPk(req.params.id);
        if (!disponibilite) {
            return res
                .status(404)
                .json({ message: "Disponibilité non trouvée" });
        }
        if (!proprietaireOuAdmin(req, disponibilite)) {
            return res.status(403).json({ message: "Accès interdit", error: "Vous ne pouvez supprimer que vos propres disponibilités" });
        }
        await disponibilite.destroy();
        res.json({ message: "Disponibilité supprimée avec succès" });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression de la disponibilité",
            error: detailErreur(error),
        });
    }
});

export default router;