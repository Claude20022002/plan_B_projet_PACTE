import { Notification } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sansNotificationsDeDevoirs } from "../services/quiz/devoirsActifs.js";

/**
 * Contrôleur des notifications.
 * Un utilisateur ne voit et ne modifie que ses propres notifications. Elles sont créées par le
 * serveur (changements de séance, devoirs, appel…) ; pour écrire aux étudiants ou aux
 * enseignants, l'administration passe par les annonces.
 * Les listes renvoient des tableaux simples (contrat existant du frontend).
 */


const notFound = (res) => res.status(404).json({ message: "Notification non trouvée" });

/**
 * Charge la notification si elle appartient à l'utilisateur courant (ou si c'est un admin).
 * Renvoie null (avec la réponse déjà envoyée) sinon. Une notification d'autrui répond 404
 * plutôt que 403 pour ne pas révéler son existence.
 */
const findOwnedNotification = async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);
    const isAdmin = req.user.role === "admin";
    if (!notification || (!isAdmin && notification.id_user !== req.user.id_user)) {
        notFound(res);
        return null;
    }
    return notification;
};

// 🔍 Une notification (propriétaire ou admin)
export const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await findOwnedNotification(req, res);
    if (notification) res.json(notification);
});

// 🗑️ Supprimer une notification (propriétaire ou admin)
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await findOwnedNotification(req, res);
    if (!notification) return;

    await notification.destroy();
    res.json({ message: "Notification supprimée avec succès" });
});

// Historique affiché : les plus récentes seulement (chaque changement de séance en crée une,
// la liste grandirait sans fin). Les non lues restent toutes renvoyées : le badge les compte.
const HISTORIQUE_MAX = 200;

// 🔍 Notifications d'un utilisateur (propriétaire ou admin, contrôlé par la route)
export const getNotificationsByUser = asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
        where: sansNotificationsDeDevoirs({ id_user: req.params.id_user }),
        order: [["date_envoi", "DESC"], ["id_notification", "DESC"]],
        limit: HISTORIQUE_MAX,
    });
    res.json(notifications);
});

// 🔍 Notifications non lues d'un utilisateur (propriétaire ou admin, contrôlé par la route)
export const getNotificationsNonLuesByUser = asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
        where: sansNotificationsDeDevoirs({ id_user: req.params.id_user, lue: false }),
        order: [["date_envoi", "DESC"]],
    });
    res.json(notifications);
});

// ✅ Marquer une notification comme lue (propriétaire ou admin)
export const marquerNotificationCommeLue = asyncHandler(async (req, res) => {
    const notification = await findOwnedNotification(req, res);
    if (!notification) return;

    await notification.update({ lue: true });
    res.json(notification);
});

// ✅ Marquer toutes les notifications d'un utilisateur comme lues (propriétaire ou admin)
export const marquerToutesCommeLues = asyncHandler(async (req, res) => {
    const [updated] = await Notification.update(
        { lue: true },
        { where: { id_user: req.params.id_user, lue: false } }
    );
    res.json({ message: "Notifications marquées comme lues", updated });
});
