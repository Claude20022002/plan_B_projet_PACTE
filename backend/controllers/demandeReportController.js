import { DemandeReport, Affectation, Users, Cours, Groupe, Salle, Creneau } from "../models/index.js";
import { notifierAdministrateurs } from "../utils/notificationHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { ViolationsBloquantes, enregistrerSeance, notifierChangementSeance } from "../services/planning/seances.js";
import { jourDe } from "../services/planning/affectationRules.js";
import { ErreurMetier } from "../services/planning/enseignements.js";

/**
 * Créneau d'arrivée d'un report : celui que la demande précise, sinon le créneau de même rang
 * (même grille, même variante) le jour de la nouvelle date — les créneaux sont propres à un jour.
 */
const creneauDuReport = async (demande, creneauActuel) => {
    if (demande.id_creneau_nouveau) return Creneau.findByPk(demande.id_creneau_nouveau);
    const jour = jourDe(String(demande.nouvelle_date).slice(0, 10));
    if (creneauActuel.jour_semaine === jour) return creneauActuel;
    return Creneau.findOne({
        where: { jour_semaine: jour, rang: creneauActuel.rang, regime: creneauActuel.regime, variante: creneauActuel.variante },
    });
};

/**
 * Contrôleur pour les demandes de report
 */

// 🔍 Récupérer toutes les demandes de report
export const getAllDemandesReport = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
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
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});

// 🔍 Récupérer une demande de report par ID
export const getDemandeReportById = asyncHandler(async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id, {
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

    const isOwner = demande?.id_user_enseignant === req.user.id_user;
    if (!demande || (req.user.role !== "admin" && !isOwner)) {
        return res
            .status(404)
            .json({ message: "Demande de report non trouvée" });
    }

    res.json(demande);
});

const EDITABLE_FIELDS = ["motif", "nouvelle_date", "id_creneau_nouveau"];

/**
 * Charge une demande modifiable par l'utilisateur courant :
 * l'admin peut tout gérer, un enseignant seulement ses demandes encore en attente.
 * Envoie la réponse d'erreur et renvoie null si l'accès est refusé.
 */
const loadEditableDemande = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);
    const isAdmin = req.user.role === "admin";

    if (!demande || (!isAdmin && demande.id_user_enseignant !== req.user.id_user)) {
        res.status(404).json({ message: "Demande de report non trouvée" });
        return null;
    }
    if (!isAdmin && demande.statut_demande !== "en_attente") {
        res.status(400).json({
            message: "Demande déjà traitée",
            error: "Une demande approuvée ou refusée ne peut plus être modifiée",
        });
        return null;
    }
    return demande;
};

// ➕ Créer une demande de report
export const createDemandeReport = asyncHandler(async (req, res) => {
    const data = pick(req.body, [...EDITABLE_FIELDS, "id_affectation"]);

    const affectation = await Affectation.findByPk(data.id_affectation);
    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // L'enseignant et le statut sont déterminés par le serveur, jamais par le client
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && affectation.id_user_enseignant !== req.user.id_user) {
        return res.status(403).json({
            message: "Accès interdit",
            error: "Vous ne pouvez demander le report que de vos propres séances",
        });
    }

    const demandeEnCours = await DemandeReport.findOne({
        where: { id_affectation: affectation.id_affectation, statut_demande: "en_attente" },
    });
    if (demandeEnCours) {
        return res.status(409).json({
            message: "Demande déjà en cours",
            error: "Une demande de report est déjà en attente pour cette séance",
        });
    }

    const demande = await DemandeReport.create({
        ...data,
        id_user_enseignant: affectation.id_user_enseignant,
        statut_demande: "en_attente",
    });

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
            lien: "/gestion/demandes-report",
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
});

// ✏️ Mettre à jour une demande de report
export const updateDemandeReport = asyncHandler(async (req, res) => {
    const demande = await loadEditableDemande(req, res);
    if (!demande) return;

    // Le statut ne change que via PATCH /:id/traiter (qui applique le report)
    await demande.update(pick(req.body, EDITABLE_FIELDS));

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

    res.json(demandeComplete);
});

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

    // Approuver = déplacer la séance, sous les mêmes règles qu'une séance créée à la main :
    // 409 si une règle bloque (la demande reste en attente), sauf forçage justifié.
    if (action === "approuver") {
        const affectation = await Affectation.findByPk(demande.id_affectation, { include: [{ model: Creneau, as: "creneau" }, { model: Cours, as: "cours" }] });
        if (!affectation) {
            return res.status(404).json({ message: "Affectation non trouvée" });
        }

        const creneau = await creneauDuReport(demande, affectation.creneau);
        if (!creneau) {
            return res.status(409).json({
                message: "Aucun créneau pour la nouvelle date",
                error: `La grille n'a pas de créneau de même rang le ${jourDe(String(demande.nouvelle_date))} : précisez le créneau visé`,
                violations: [{ code: "creneau_introuvable", bloquant: true, message: "Aucun créneau de même rang ce jour-là" }],
            });
        }

        const ancienneDate = affectation.date_seance;
        try {
            await enregistrerSeance({
                id: affectation.id_affectation,
                donnees: {
                    date_seance: String(demande.nouvelle_date).slice(0, 10),
                    id_creneau: creneau.id_creneau,
                    statut: "reporte",
                    // Première date et heure de la séance, gardées même après plusieurs reports
                    date_seance_initiale: affectation.date_seance_initiale ?? affectation.date_seance,
                    id_creneau_initial: affectation.id_creneau_initial ?? affectation.id_creneau,
                },
                user: req.user,
                forcer: req.body.forcer === true,
                justification: req.body.justification,
                action: "report",
            });
        } catch (error) {
            if (error instanceof ViolationsBloquantes) {
                return res.status(409).json({ message: error.message, error: error.violations.find((v) => v.bloquant)?.message, violations: error.violations });
            }
            if (error instanceof ErreurMetier) return res.status(error.status).json({ message: error.message, error: error.message });
            throw error;
        }
        await demande.update({ statut_demande: nouveauStatut, id_creneau_nouveau: creneau.id_creneau });

        const heure = String(creneau.heure_debut).slice(0, 5);
        const coursNom = affectation.cours?.nom_cours || "votre cours";
        try {
            const { creerNotification } = await import("../utils/notificationHelper.js");
            await creerNotification({
                id_user: affectation.id_user_enseignant,
                titre: "Demande de report approuvée",
                message: `Votre demande de report pour « ${coursNom} » a été approuvée : ${demande.nouvelle_date} à ${heure}.`,
                type_notification: "success",
                lien: "/demandes-report",
            });
            const { sendReportConfirmation } = await import("../utils/sendEmail.js");
            const enseignant = await Users.findByPk(affectation.id_user_enseignant, { attributes: ["email"] });
            if (enseignant?.email) {
                await sendReportConfirmation({ to: enseignant.email, demande, affectation: await Affectation.findByPk(affectation.id_affectation, { include: [{ model: Cours, as: "cours" }, { model: Salle, as: "salle" }, { model: Creneau, as: "creneau" }] }) });
            }
        } catch (error) {
            console.error("Erreur lors de la notification de l'enseignant:", error);
        }
        // Étudiants du groupe et de ses sous-groupes
        await notifierChangementSeance({
            affectation,
            notifierEnseignant: false,
            titre: "Séance reportée",
            message: `« ${coursNom} » du ${ancienneDate} est reportée au ${demande.nouvelle_date} à ${heure}.`,
        });
    } else {
        await demande.update({ statut_demande: nouveauStatut });
        // Si refusé, notifier l'enseignant
        try {
            const { creerNotification } = await import("../utils/notificationHelper.js");
            await creerNotification({
                id_user: demande.id_user_enseignant,
                titre: "Demande de report refusée",
                message: `Votre demande de report pour le ${demande.nouvelle_date} a été refusée.`,
                type_notification: "error",
                lien: "/demandes-report",
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
export const deleteDemandeReport = asyncHandler(async (req, res) => {
    const demande = await loadEditableDemande(req, res);
    if (!demande) return;

    await demande.destroy();

    res.json({ message: "Demande de report supprimée avec succès" });
});

// 🔍 Récupérer les demandes de report par enseignant
export const getDemandesReportByEnseignant = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { id_user_enseignant: req.params.id_enseignant },
        include: [
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
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});

// 🔍 Récupérer les demandes de report par statut
export const getDemandesReportByStatut = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { statut_demande: req.params.statut },
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
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});
