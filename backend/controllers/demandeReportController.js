import { DemandeReport, Affectation, Users } from "../models/index.js";
import { notifierDemandeReport } from "../utils/notificationHelper.js";

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
        // Récupérer tous les administrateurs actifs
        const admins = await Users.findAll({
            where: { role: "admin", actif: true },
            attributes: ['id_user'],
        });

        // Notifier chaque administrateur
        for (const admin of admins) {
            await notifierDemandeReport({
                id_user_admin: admin.id_user,
                demande: demandeComplete,
            });
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
