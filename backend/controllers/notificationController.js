import { Notification, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Contrôleur des notifications.
 * Un utilisateur ne voit et ne modifie que ses propres notifications ;
 * l'administrateur peut en créer pour n'importe qui.
 * Les listes renvoient des tableaux simples (contrat existant du frontend).
 */

const NOTIFICATION_FIELDS = ["titre", "message", "type_notification", "lien", "id_user"];
const USER_SUMMARY = { model: Users, as: "user", attributes: ["id_user", "nom", "prenom", "email", "role"] };

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

// 🔍 Toutes les notifications (admin)
export const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
        include: [USER_SUMMARY],
        order: [["date_envoi", "DESC"]],
    });
    res.json(notifications);
});

// 🔍 Une notification (propriétaire ou admin)
export const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await findOwnedNotification(req, res);
    if (notification) res.json(notification);
});

// ➕ Créer une notification (admin)
export const createNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.create(pick(req.body, NOTIFICATION_FIELDS));
    const notificationComplete = await Notification.findByPk(notification.id_notification, {
        include: [USER_SUMMARY],
    });
    res.status(201).json(notificationComplete);
});

// ✏️ Mettre à jour une notification (admin)
export const updateNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return notFound(res);

    await notification.update(pick(req.body, [...NOTIFICATION_FIELDS, "lue"]));
    const notificationComplete = await Notification.findByPk(notification.id_notification, {
        include: [USER_SUMMARY],
    });
    res.json(notificationComplete);
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
        where: { id_user: req.params.id_user },
        order: [["date_envoi", "DESC"], ["id_notification", "DESC"]],
        limit: HISTORIQUE_MAX,
    });
    res.json(notifications);
});

// 🔍 Notifications non lues d'un utilisateur (propriétaire ou admin, contrôlé par la route)
export const getNotificationsNonLuesByUser = asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
        where: { id_user: req.params.id_user, lue: false },
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
