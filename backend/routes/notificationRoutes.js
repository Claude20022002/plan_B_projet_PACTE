import express from "express";
import {
    authenticateToken,
    requireOwnResourceOrAdmin,
} from "../middleware/index.js";
import {
    getNotificationById,
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

// Pas de création ni de liste globale à la main : le serveur crée les notifications, et
// l'administration écrit par les annonces
// Propriétaire ou admin (contrôlé dans le contrôleur)
router.get("/:id", getNotificationById);
router.patch("/:id/lire", marquerNotificationCommeLue);
router.delete("/:id", deleteNotification);

export default router;
