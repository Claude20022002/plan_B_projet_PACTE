import {
    Affectation,
    Conflit,
    ConflitAffectation,
    Creneau,
    Users,
} from "../models/index.js";
import { Op } from "sequelize";
import { notifierConflit, notifierAdministrateurs } from "./notificationHelper.js";

/**
 * Utilitaires pour la détection automatique des conflits d'horaires
 */

/**
 * Vérifie si deux créneaux se chevauchent
 * @param {Object} creneau1 - Premier créneau
 * @param {Object} creneau2 - Deuxième créneau
 * @param {string} date1 - Date de la première affectation (YYYY-MM-DD)
 * @param {string} date2 - Date de la deuxième affectation (YYYY-MM-DD)
 * @returns {boolean} - True si les créneaux se chevauchent
 */
const creneauxSeChevauchent = (creneau1, creneau2, date1, date2) => {
    // Si les dates sont différentes, pas de conflit
    if (date1 !== date2) {
        return false;
    }

    // Si les jours de la semaine sont différents, pas de conflit
    if (creneau1.jour_semaine !== creneau2.jour_semaine) {
        return false;
    }

    // Convertir les heures en minutes pour faciliter la comparaison
    const heureEnMinutes = (heure) => {
        const [h, m] = heure.split(":").map(Number);
        return h * 60 + m;
    };

    const debut1 = heureEnMinutes(creneau1.heure_debut);
    const fin1 = heureEnMinutes(creneau1.heure_fin);
    const debut2 = heureEnMinutes(creneau2.heure_debut);
    const fin2 = heureEnMinutes(creneau2.heure_fin);

    // Vérifier si les créneaux se chevauchent
    return debut1 < fin2 && fin1 > debut2;
};

/**
 * Détecte les conflits pour une nouvelle affectation
 * @param {Object} nouvelleAffectation - L'affectation à vérifier
 * @returns {Array} - Liste des conflits détectés
 */
export const detecterConflitsPourAffectation = async (nouvelleAffectation) => {
    const conflits = [];

    // Récupérer le créneau de la nouvelle affectation
    const creneau = await Creneau.findByPk(nouvelleAffectation.id_creneau);
    if (!creneau) {
        return conflits;
    }

    // Récupérer toutes les affectations existantes pour la même date
    const affectationsExistantes = await Affectation.findAll({
        where: {
            date_seance: nouvelleAffectation.date_seance,
            statut: {
                [Op.in]: ["planifie", "confirme"], // Ignorer les annulées/reportées
            },
            id_affectation: {
                [Op.ne]: nouvelleAffectation.id_affectation || -1, // Exclure l'affectation actuelle si mise à jour
            },
        },
        include: [{ model: Creneau, as: "creneau" }],
    });

    for (const affectationExistante of affectationsExistantes) {
        const creneauExistant = affectationExistante.creneau;

        // Vérifier si les créneaux se chevauchent
        if (
            creneauxSeChevauchent(
                creneau,
                creneauExistant,
                nouvelleAffectation.date_seance,
                affectationExistante.date_seance
            )
        ) {
            // Conflit de salle
            if (
                nouvelleAffectation.id_salle === affectationExistante.id_salle
            ) {
                conflits.push({
                    type: "salle",
                    affectation1: nouvelleAffectation.id_affectation,
                    affectation2: affectationExistante.id_affectation,
                    description: `Conflit de salle : la salle est déjà occupée à ce créneau horaire`,
                });
            }

            // Conflit d'enseignant
            if (
                nouvelleAffectation.id_user_enseignant ===
                affectationExistante.id_user_enseignant
            ) {
                conflits.push({
                    type: "enseignant",
                    affectation1: nouvelleAffectation.id_affectation,
                    affectation2: affectationExistante.id_affectation,
                    description: `Conflit d'enseignant : l'enseignant a déjà un cours à ce créneau horaire`,
                });
            }

            // Conflit de groupe
            if (
                nouvelleAffectation.id_groupe === affectationExistante.id_groupe
            ) {
                conflits.push({
                    type: "groupe",
                    affectation1: nouvelleAffectation.id_affectation,
                    affectation2: affectationExistante.id_affectation,
                    description: `Conflit de groupe : le groupe a déjà un cours à ce créneau horaire`,
                });
            }
        }
    }

    return conflits;
};

/**
 * Détecte tous les conflits dans les affectations existantes
 * @returns {Array} - Liste de tous les conflits détectés
 */
export const detecterTousLesConflits = async () => {
    const conflits = [];

    // Récupérer toutes les affectations actives
    const affectations = await Affectation.findAll({
        where: {
            statut: {
                [Op.in]: ["planifie", "confirme"],
            },
        },
        include: [{ model: Creneau, as: "creneau" }],
        order: [["date_seance", "ASC"]],
    });

    // Comparer chaque paire d'affectations
    for (let i = 0; i < affectations.length; i++) {
        for (let j = i + 1; j < affectations.length; j++) {
            const affectation1 = affectations[i];
            const affectation2 = affectations[j];

            const creneau1 = affectation1.creneau;
            const creneau2 = affectation2.creneau;

            // Vérifier si les créneaux se chevauchent
            if (
                creneauxSeChevauchent(
                    creneau1,
                    creneau2,
                    affectation1.date_seance,
                    affectation2.date_seance
                )
            ) {
                // Conflit de salle
                if (affectation1.id_salle === affectation2.id_salle) {
                    conflits.push({
                        type: "salle",
                        affectation1: affectation1.id_affectation,
                        affectation2: affectation2.id_affectation,
                        description: `Conflit de salle : deux cours utilisent la même salle au même créneau`,
                    });
                }

                // Conflit d'enseignant
                if (
                    affectation1.id_user_enseignant ===
                    affectation2.id_user_enseignant
                ) {
                    conflits.push({
                        type: "enseignant",
                        affectation1: affectation1.id_affectation,
                        affectation2: affectation2.id_affectation,
                        description: `Conflit d'enseignant : l'enseignant a deux cours au même créneau`,
                    });
                }

                // Conflit de groupe
                if (affectation1.id_groupe === affectation2.id_groupe) {
                    conflits.push({
                        type: "groupe",
                        affectation1: affectation1.id_affectation,
                        affectation2: affectation2.id_affectation,
                        description: `Conflit de groupe : le groupe a deux cours au même créneau`,
                    });
                }
            }
        }
    }

    return conflits;
};

/**
 * Crée un conflit dans la base de données
 * @param {Object} conflitData - Données du conflit
 * @returns {Object} - Le conflit créé
 */
export const creerConflit = async (conflitData) => {
    const conflit = await Conflit.create({
        type_conflit: conflitData.type,
        description: conflitData.description,
        resolu: false,
    });

    // Associer les affectations au conflit
    if (conflitData.affectation1) {
        await ConflitAffectation.create({
            id_conflit: conflit.id_conflit,
            id_affectation: conflitData.affectation1,
        });
    }

    if (conflitData.affectation2) {
        await ConflitAffectation.create({
            id_conflit: conflit.id_conflit,
            id_affectation: conflitData.affectation2,
        });
    }

    // Notifier les utilisateurs concernés
    try {
        const id_enseignants = [];
        const id_admins = [];
        
        // Récupérer les affectations pour obtenir les IDs des enseignants et admins
        if (conflitData.affectation1) {
            const affectation1 = await Affectation.findByPk(conflitData.affectation1, {
                attributes: ['id_user_enseignant', 'id_user_admin'],
            });
            if (affectation1) {
                if (affectation1.id_user_enseignant) {
                    id_enseignants.push(affectation1.id_user_enseignant);
                }
                if (affectation1.id_user_admin) {
                    id_admins.push(affectation1.id_user_admin);
                }
            }
        }
        
        if (conflitData.affectation2) {
            const affectation2 = await Affectation.findByPk(conflitData.affectation2, {
                attributes: ['id_user_enseignant', 'id_user_admin'],
            });
            if (affectation2) {
                if (affectation2.id_user_enseignant && !id_enseignants.includes(affectation2.id_user_enseignant)) {
                    id_enseignants.push(affectation2.id_user_enseignant);
                }
                if (affectation2.id_user_admin && !id_admins.includes(affectation2.id_user_admin)) {
                    id_admins.push(affectation2.id_user_admin);
                }
            }
        }

        // Notifier tous les administrateurs (pour qu'ils soient au courant de tous les conflits)
        await notifierAdministrateurs({
            titre: "⚠️ Conflit d'horaires détecté",
            message: `Un conflit de type "${conflitData.type}" a été détecté : ${conflitData.description}`,
            type_notification: "warning",
        });

        // Notifier les enseignants concernés par le conflit
        if (id_enseignants.length > 0) {
            await notifierConflit({
                id_users: [...new Set(id_enseignants)], // Supprimer les doublons
                conflit: {
                    type_conflit: conflitData.type,
                    description: conflitData.description,
                },
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi des notifications de conflit:", error);
        // Ne pas bloquer la création du conflit si la notification échoue
    }

    return conflit;
};

/**
 * Vérifie et crée automatiquement les conflits pour une affectation
 * @param {Object} affectation - L'affectation à vérifier
 * @returns {Array} - Liste des conflits créés
 */
export const verifierEtCreerConflits = async (affectation) => {
    const conflitsDetectes = await detecterConflitsPourAffectation(affectation);
    const conflitsCrees = [];

    for (const conflitData of conflitsDetectes) {
        // Vérifier si le conflit n'existe pas déjà
        const conflitExistant = await Conflit.findOne({
            where: {
                type_conflit: conflitData.type,
                resolu: false,
            },
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    where: {
                        id_affectation: {
                            [Op.in]: [
                                conflitData.affectation1,
                                conflitData.affectation2,
                            ],
                        },
                    },
                },
            ],
        });

        if (!conflitExistant) {
            const conflit = await creerConflit(conflitData);
            conflitsCrees.push(conflit);
        }
    }

    return conflitsCrees;
};
