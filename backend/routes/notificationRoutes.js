import express from "express";
import { Notification, User } from "../models/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les notifications
router.get("/", async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            include: [{ model: User, as: "user" }],
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des notifications",
            error: error.message,
        });
    }
});

// 🔍 Récupérer une notification par ID
router.get("/:id", async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id, {
            include: [{ model: User, as: "user" }],
        });
        if (!notification) {
            return res
                .status(404)
                .json({ message: "Notification non trouvée" });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération de la notification",
            error: error.message,
        });
    }
});

// ➕ Créer une notification
router.post("/", async (req, res) => {
    try {
        const notification = await Notification.create(req.body);
        const notificationComplete = await Notification.findByPk(
            notification.id_notification,
            {
                include: [{ model: User, as: "user" }],
            }
        );
        res.status(201).json(notificationComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la création de la notification",
            error: error.message,
        });
    }
});

// ✏️ Mettre à jour une notification
router.put("/:id", async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res
                .status(404)
                .json({ message: "Notification non trouvée" });
        }
        await notification.update(req.body);
        const notificationComplete = await Notification.findByPk(
            notification.id_notification,
            {
                include: [{ model: User, as: "user" }],
            }
        );
        res.json(notificationComplete);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la mise à jour de la notification",
            error: error.message,
        });
    }
});

// 🗑️ Supprimer une notification
router.delete("/:id", async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res
                .status(404)
                .json({ message: "Notification non trouvée" });
        }
        await notification.destroy();
        res.json({ message: "Notification supprimée avec succès" });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression de la notification",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les notifications d'un utilisateur
router.get("/user/:id_user", async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { id_user: req.params.id_user },
            order: [["date_envoi", "DESC"]],
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des notifications",
            error: error.message,
        });
    }
});

// 🔍 Récupérer les notifications non lues d'un utilisateur
router.get("/user/:id_user/non-lues", async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                id_user: req.params.id_user,
                lue: false,
            },
            order: [["date_envoi", "DESC"]],
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Erreur de récupération des notifications non lues",
            error: error.message,
        });
    }
});

// ✏️ Marquer une notification comme lue
router.patch("/:id/lire", async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res
                .status(404)
                .json({ message: "Notification non trouvée" });
        }
        await notification.update({ lue: true });
        res.json(notification);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la mise à jour de la notification",
            error: error.message,
        });
    }
});

export default router;
