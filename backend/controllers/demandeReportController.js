import { DemandeReport, Affectation, Users, Cours, Groupe, Salle, Creneau, Appartenir, Etudiant } from "../models/index.js";
import { notifierAdministrateurs } from "../utils/notificationHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Contrôleur pour les demandes de report
 */

// 🔍 Récupérer toutes les demandes de report
export const getAllDemandesReport = async (req, res) => {
    const demandes = await DemandeReport.findAll({
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Affectation, as: "affectation" },
        ],
    });

    res.json(demandes);
};

// 🔍 Récupérer une demande de report par ID
export const getDemandeReportById = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Affectation, as: "affectation" },
        ],
    });

    if (!demande) {
        return res
            .status(404)
            .json({ message: "Demande de report non trouvée" });
    }

    res.json(demande);
};

// ➕ Créer une demande de report
export const createDemandeReport = async (req, res) => {
    const demande = await DemandeReport.create(req.body);

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Affectation, as: "affectation" },
        ],
    });

    // Notifier les administrateurs de la nouvelle demande
    try {
        const enseignantNom = demandeComplete.enseignant 
            ? `${demandeComplete.enseignant.prenom || ''} ${demandeComplete.enseignant.nom || ''}`.trim()
            : 'Un enseignant';
        
        // Utiliser notifierAdministrateurs pour notifier tous les admins en une fois
        await notifierAdministrateurs({
            titre: "Nouvelle demande de report",
            message: `${enseignantNom} a soumis une demande de report pour le ${demandeComplete.nouvelle_date}. Motif : ${demandeComplete.motif || 'Non spécifié'}`,
            type_notification: "info",
        });
        
        // Envoyer aussi des emails aux admins si configuré
        const { sendDemandeReportNotification } = await import("../utils/sendEmail.js");
        const admins = await Users.findAll({
            where: { role: "admin", actif: true },
            attributes: ['id_user', 'email'],
        });
        
        for (const admin of admins) {
            if (admin.email) {
                try {
                    await sendDemandeReportNotification({
                        to: admin.email,
                        demande: demandeComplete,
                    });
                } catch (emailError) {
                    console.error(`Erreur lors de l'envoi de l'email à l'admin ${admin.id_user}:`, emailError);
                }
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de la notification de demande de report:", error);
        // Ne pas bloquer la réponse si la notification échoue
    }

    res.status(201).json(demandeComplete);
};

// ✏️ Mettre à jour une demande de report
export const updateDemandeReport = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);

    if (!demande) {
        return res
            .status(404)
            .json({ message: "Demande de report non trouvée" });
    }

    await demande.update(req.body);

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Affectation, as: "affectation" },
        ],
    });

    res.json(demandeComplete);
};

// ✅ Valider ou refuser une demande de report
export const traiterDemandeReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // "approuver" ou "refuser"

    if (!action || !["approuver", "refuser"].includes(action)) {
        return res.status(400).json({
            message: "Action invalide",
            error: "L'action doit être 'approuver' ou 'refuser'",
        });
    }

    const demande = await DemandeReport.findByPk(id, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
                include: [
                    { model: Cours, as: "cours" },
                    { model: Groupe, as: "groupe" },
                    {
                        model: Users,
                        as: "enseignant",
                        attributes: { exclude: ["password_hash"] },
                    },
                    { model: Salle, as: "salle" },
                    { model: Creneau, as: "creneau" },
                ],
            },
        ],
    });

    if (!demande) {
        return res.status(404).json({
            message: "Demande de report non trouvée",
        });
    }

    if (demande.statut_demande !== "en_attente") {
        return res.status(400).json({
            message: "Demande déjà traitée",
            error: `Cette demande a déjà été ${demande.statut_demande === "approuve" ? "approuvée" : "refusée"}`,
        });
    }

    const nouveauStatut = action === "approuver" ? "approuve" : "refuse";
    await demande.update({ statut_demande: nouveauStatut });

    // Si la demande est approuvée, mettre à jour l'affectation et notifier
    if (action === "approuver") {
        const { notifierNouvelleAffectation, notifierEtudiantsGroupe } = await import("../utils/notificationHelper.js");
        const { sendReportConfirmation, sendAnnulationSeance } = await import("../utils/sendEmail.js");
        const { verifierEtCreerConflits } = await import("../utils/detectConflicts.js");

        // Mettre à jour la date de l'affectation
        const affectation = await Affectation.findByPk(demande.id_affectation, {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
            ],
        });

        if (!affectation) {
            return res.status(404).json({
                message: "Affectation non trouvée",
            });
        }

        const ancienneDate = affectation.date_seance;

        // Mettre à jour l'affectation avec la nouvelle date
        await affectation.update({
            date_seance: demande.nouvelle_date,
        });

        // Recharger l'affectation mise à jour
        const affectationMiseAJour = await Affectation.findByPk(affectation.id_affectation, {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
            ],
        });

        // Vérifier les conflits avec la nouvelle date
        const conflits = await verifierEtCreerConflits(affectationMiseAJour);

        // Notifier l'enseignant (confirmation)
        try {
            await notifierNouvelleAffectation({
                id_user_enseignant: affectation.id_user_enseignant,
                affectation: affectationMiseAJour,
            });

            // Envoyer un email de confirmation à l'enseignant
            const enseignant = await Users.findByPk(affectation.id_user_enseignant, {
                attributes: ["email"],
            });
            if (enseignant?.email) {
                await sendReportConfirmation({
                    to: enseignant.email,
                    demande,
                    affectation: affectationMiseAJour,
                });
            }
        } catch (error) {
            console.error("Erreur lors de la notification de l'enseignant:", error);
        }

        // Notifier les étudiants du groupe (annulation de l'ancienne séance)
        try {
            await notifierEtudiantsGroupe({
                id_groupe: affectation.id_groupe,
                titre: "Séance reportée",
                message: `La séance du ${ancienneDate} a été reportée au ${demande.nouvelle_date}. Veuillez consulter votre emploi du temps.`,
                type_notification: "warning",
            });

            // Envoyer des emails aux étudiants
            const appartenances = await Appartenir.findAll({
                where: { id_groupe: affectation.id_groupe },
                include: [
                    {
                        model: Etudiant,
                        as: "etudiant",
                        include: [
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id_user", "email"],
                            },
                        ],
                    },
                ],
            });

            for (const app of appartenances) {
                if (app.etudiant?.user?.email) {
                    try {
                        await sendAnnulationSeance({
                            to: app.etudiant.user.email,
                            affectation: {
                                ...affectation.toJSON(),
                                date_seance: ancienneDate,
                            },
                            nouvelle_date: demande.nouvelle_date,
                        });
                    } catch (emailError) {
                        console.error(`Erreur lors de l'envoi de l'email à l'étudiant ${app.etudiant.user.id_user}:`, emailError);
                    }
                }
            }
        } catch (error) {
            console.error("Erreur lors de la notification des étudiants:", error);
        }
    } else {
        // Si refusé, notifier l'enseignant
        try {
            const { creerNotification } = await import("../utils/notificationHelper.js");
            await creerNotification({
                id_user: demande.id_user_enseignant,
                titre: "Demande de report refusée",
                message: `Votre demande de report pour le ${demande.nouvelle_date} a été refusée.`,
                type_notification: "error",
            });
        } catch (error) {
            console.error("Erreur lors de la notification de refus:", error);
        }
    }

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
                include: [
                    { model: Cours, as: "cours" },
                    { model: Groupe, as: "groupe" },
                    {
                        model: Users,
                        as: "enseignant",
                        attributes: { exclude: ["password_hash"] },
                    },
                    { model: Salle, as: "salle" },
                    { model: Creneau, as: "creneau" },
                ],
            },
        ],
    });

    res.json({
        message: `Demande ${action === "approuver" ? "approuvée" : "refusée"} avec succès`,
        demande: demandeComplete,
    });
});

// 🗑️ Supprimer une demande de report
export const deleteDemandeReport = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);

    if (!demande) {
        return res
            .status(404)
            .json({ message: "Demande de report non trouvée" });
    }

    await demande.destroy();

    res.json({ message: "Demande de report supprimée avec succès" });
};

// 🔍 Récupérer les demandes de report par enseignant
export const getDemandesReportByEnseignant = async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { id_user_enseignant: req.params.id_enseignant },
        include: [{ model: Affectation, as: "affectation" }],
    });

    res.json(demandes);
};

// 🔍 Récupérer les demandes de report par statut
export const getDemandesReportByStatut = async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { statut_demande: req.params.statut },
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Affectation, as: "affectation" },
        ],
    });

    res.json(demandes);
};
