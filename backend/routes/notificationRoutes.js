import express from "express";
import {
    authenticateToken,
    requireAdmin,
    requireOwnResourceOrAdmin,
} from "../middleware/index.js";
import {
    getAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getNotificationsByUser,
    getNotificationsNonLuesByUser,
    marquerNotificationCommeLue,
    marquerToutesCommeLues,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authenticateToken);

// Routes "par utilisateur" avant "/:id" pour éviter les collisions
router.get("/user/:id_user", requireOwnResourceOrAdmin("id_user"), getNotificationsByUser);
router.get("/user/:id_user/non-lues", requireOwnResourceOrAdmin("id_user"), getNotificationsNonLuesByUser);
router.patch("/user/:id_user/tout-lire", requireOwnResourceOrAdmin("id_user"), marquerToutesCommeLues);

// Administration des notifications
router.get("/", requireAdmin, getAllNotifications);
router.post("/", requireAdmin, createNotification);
router.put("/:id", requireAdmin, updateNotification);

// Propriétaire ou admin (contrôlé dans le contrôleur)
router.get("/:id", getNotificationById);
router.patch("/:id/lire", marquerNotificationCommeLue);
router.delete("/:id", deleteNotification);

export default router;
