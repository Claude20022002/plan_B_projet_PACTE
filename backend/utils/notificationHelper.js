import { Notification, Users } from "../models/index.js";
import { sendAffectationNotification, sendConflitNotification, sendDemandeReportNotification } from "./sendEmail.js";

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
    const admins = await Users.findAll({
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

    // Créer la notification en base de données
    const notification = await creerNotification({
        id_user: id_user_enseignant,
        titre,
        message,
        type_notification: "info",
    });

    // Envoyer un email si l'enseignant a un email
    try {
        const enseignant = await Users.findByPk(id_user_enseignant, {
            attributes: ['email'],
        });
        if (enseignant && enseignant.email) {
            await sendAffectationNotification({
                to: enseignant.email,
                affectation,
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de notification d'affectation:", error);
        // Ne pas bloquer si l'email échoue
    }

    return notification;
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

    // Créer les notifications en base de données
    const notifications = await creerNotificationsMultiples({
        id_users,
        titre,
        message,
        type_notification: "warning",
    });

    // Envoyer des emails aux utilisateurs concernés
    try {
        const users = await Users.findAll({
            where: { id_user: id_users },
            attributes: ['id_user', 'email'],
        });
        
        for (const user of users) {
            if (user.email) {
                await sendConflitNotification({
                    to: user.email,
                    conflit,
                });
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi des emails de notification de conflit:", error);
        // Ne pas bloquer si l'email échoue
    }

    return notifications;
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

    // Créer la notification en base de données
    const notification = await creerNotification({
        id_user: id_user_admin,
        titre,
        message,
        type_notification: "info",
    });

    // Envoyer un email si l'admin a un email
    try {
        const admin = await Users.findByPk(id_user_admin, {
            attributes: ['email'],
        });
        if (admin && admin.email) {
            await sendDemandeReportNotification({
                to: admin.email,
                demande,
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de notification de demande de report:", error);
        // Ne pas bloquer si l'email échoue
    }

    return notification;
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
