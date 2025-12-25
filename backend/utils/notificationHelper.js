import { Notification, User } from "../models/index.js";

/**
 * Utilitaires pour créer et gérer les notifications
 */

/**
 * Crée une notification pour un utilisateur
 * @param {Object} options - Options de la notification
 * @param {number} options.id_user - ID de l'utilisateur
 * @param {string} options.titre - Titre de la notification
 * @param {string} options.message - Message de la notification
 * @param {string} options.type_notification - Type (info, warning, error, success)
 * @returns {Promise<Object>} - La notification créée
 */
export const creerNotification = async ({
    id_user,
    titre,
    message,
    type_notification = "info",
}) => {
    const notification = await Notification.create({
        id_user,
        titre,
        message,
        type_notification,
        lue: false,
    });

    return notification;
};

/**
 * Crée une notification pour plusieurs utilisateurs
 * @param {Object} options - Options
 * @param {Array<number>} options.id_users - Liste des IDs utilisateurs
 * @param {string} options.titre - Titre
 * @param {string} options.message - Message
 * @param {string} options.type_notification - Type
 * @returns {Promise<Array>} - Liste des notifications créées
 */
export const creerNotificationsMultiples = async ({
    id_users,
    titre,
    message,
    type_notification = "info",
}) => {
    const notifications = [];

    for (const id_user of id_users) {
        const notification = await creerNotification({
            id_user,
            titre,
            message,
            type_notification,
        });
        notifications.push(notification);
    }

    return notifications;
};

/**
 * Crée une notification pour tous les administrateurs
 * @param {Object} options - Options
 * @param {string} options.titre - Titre
 * @param {string} options.message - Message
 * @param {string} options.type_notification - Type
 * @returns {Promise<Array>} - Liste des notifications créées
 */
export const notifierAdministrateurs = async ({
    titre,
    message,
    type_notification = "info",
}) => {
    const admins = await User.findAll({
        where: { role: "admin", actif: true },
    });

    const id_users = admins.map((admin) => admin.id_user);

    return await creerNotificationsMultiples({
        id_users,
        titre,
        message,
        type_notification,
    });
};

/**
 * Crée une notification de nouvelle affectation
 * @param {Object} options - Options
 * @param {number} options.id_user_enseignant - ID de l'enseignant
 * @param {Object} options.affectation - Données de l'affectation
 * @returns {Promise<Object>}
 */
export const notifierNouvelleAffectation = async ({
    id_user_enseignant,
    affectation,
}) => {
    const titre = "Nouvelle affectation de cours";
    const message = `Une nouvelle affectation a été créée pour vous le ${affectation.date_seance}.`;

    return await creerNotification({
        id_user: id_user_enseignant,
        titre,
        message,
        type_notification: "info",
    });
};

/**
 * Crée une notification de conflit détecté
 * @param {Object} options - Options
 * @param {Array<number>} options.id_users - IDs des utilisateurs concernés
 * @param {Object} options.conflit - Données du conflit
 * @returns {Promise<Array>}
 */
export const notifierConflit = async ({ id_users, conflit }) => {
    const titre = "⚠️ Conflit d'horaires détecté";
    const message = `Un conflit de type "${conflit.type_conflit}" a été détecté : ${conflit.description}`;

    return await creerNotificationsMultiples({
        id_users,
        titre,
        message,
        type_notification: "warning",
    });
};

/**
 * Crée une notification de demande de report
 * @param {Object} options - Options
 * @param {number} options.id_user_admin - ID de l'admin
 * @param {Object} options.demande - Données de la demande
 * @returns {Promise<Object>}
 */
export const notifierDemandeReport = async ({ id_user_admin, demande }) => {
    const titre = "Nouvelle demande de report";
    const message = `Une demande de report a été soumise pour le ${demande.nouvelle_date}. Motif : ${demande.motif}`;

    return await creerNotification({
        id_user: id_user_admin,
        titre,
        message,
        type_notification: "info",
    });
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 * @param {number} id_user - ID de l'utilisateur
 * @returns {Promise<number>} - Nombre de notifications mises à jour
 */
export const marquerToutesCommeLues = async (id_user) => {
    const [count] = await Notification.update(
        { lue: true },
        {
            where: {
                id_user,
                lue: false,
            },
        }
    );

    return count;
};
