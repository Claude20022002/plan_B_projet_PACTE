import { Notification, Users } from "../models/index.js";

/**
 * Contrôleur pour les notifications
 */

// 🔍 Récupérer toutes les notifications
export const getAllNotifications = async (req, res) => {
    const notifications = await Notification.findAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json(notifications);
};

// 🔍 Récupérer une notification par ID
export const getNotificationById = async (req, res) => {
    const notification = await Notification.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
    }

    res.json(notification);
};

// ➕ Créer une notification
export const createNotification = async (req, res) => {
    const notification = await Notification.create(req.body);

    const notificationComplete = await Notification.findByPk(
        notification.id_notification,
        {
            include: [
                {
                    model: Users,
                    as: "user",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.status(201).json(notificationComplete);
};

// ✏️ Mettre à jour une notification
export const updateNotification = async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
    }

    await notification.update(req.body);

    const notificationComplete = await Notification.findByPk(
        notification.id_notification,
        {
            include: [
                {
                    model: Users,
                    as: "user",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.json(notificationComplete);
};

// 🗑️ Supprimer une notification
export const deleteNotification = async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
    }

    await notification.destroy();

    res.json({ message: "Notification supprimée avec succès" });
};

// 🔍 Récupérer les notifications d'un utilisateur
export const getNotificationsByUser = async (req, res) => {
    const notifications = await Notification.findAll({
        where: { id_user: req.params.id_user },
        order: [["date_envoi", "DESC"]],
    });

    res.json(notifications);
};

// 🔍 Récupérer les notifications non lues d'un utilisateur
export const getNotificationsNonLuesByUser = async (req, res) => {
    const notifications = await Notification.findAll({
        where: {
            id_user: req.params.id_user,
            lue: false,
        },
        order: [["date_envoi", "DESC"]],
    });

    res.json(notifications);
};

// ✏️ Marquer une notification comme lue
export const marquerNotificationCommeLue = async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
    }

    await notification.update({ lue: true });

    res.json(notification);
};
