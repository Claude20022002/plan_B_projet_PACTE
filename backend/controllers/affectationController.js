import {
    Affectation,
    Cours,
    Groupe,
    Salle,
    Creneau,
    Users,
} from "../models/index.js";
import { Op } from "sequelize";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { ViolationsBloquantes, enregistrerSeance, notifierChangementSeance, supprimerSeance, verifierSeance } from "../services/planning/seances.js";
import { STATUTS_ACTIFS, aujourdhui } from "../services/planning/affectationRules.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { notifierNouvelleAffectation } from "../utils/notificationHelper.js";
import { pick } from "../utils/validationHelper.js";
import { appliquerRamadan } from "../services/planning/ramadan.js";
import { etudiantAppartientAuGroupe } from "../middleware/accessMiddleware.js";

/**
 * Contrôleur pour les affectations
 */

// 🔍 Récupérer toutes les affectations (avec pagination)
export const getAllAffectations = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.statut) {
        where.statut = req.query.statut;
    }
    if (req.query.date_seance) {
        where.date_seance = req.query.date_seance;
    } else if (req.query.date_from && req.query.date_to) {
        where.date_seance = { [Op.between]: [req.query.date_from, req.query.date_to] };
    } else if (req.query.date_from) {
        where.date_seance = { [Op.gte]: req.query.date_from };
    }

    // En deux temps : total et identifiants de la page sans jointure (lus dans l'index de date),
    // puis ces seules séances avec leurs détails. Trier le résultat joint complet avant LIMIT
    // coûtait ~230 ms sur une année de séances.
    const ordre = [["date_seance", "DESC"], ["id_affectation", "DESC"]];
    const [count, pageIds] = await Promise.all([
        Affectation.count({ where }),
        Affectation.findAll({ where, attributes: ["id_affectation"], order: ordre, limit, offset, raw: true }),
    ]);
    const affectations = !pageIds.length
        ? []
        : await Affectation.findAll({
            where: { id_affectation: pageIds.map((p) => p.id_affectation) },
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
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
            order: ordre,
        });
    await appliquerRamadan(affectations);

    res.json(createPaginationResponse(affectations, count, page, limit));
});

// 🔍 Récupérer une affectation par ID
export const getAffectationById = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findOne({
        where: { id_affectation: req.params.id },
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
            {
                model: Users,
                as: "admin_createur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    // Admin : tout ; enseignant : ses séances ; étudiant : les séances de son groupe.
    // Une séance inaccessible répond 404 pour ne pas révéler son existence.
    const canRead =
        affectation &&
        (req.user.role === "admin" ||
            affectation.id_user_enseignant === req.user.id_user ||
            (req.user.role === "etudiant" &&
                (await etudiantAppartientAuGroupe(req.user.id_user, affectation.id_groupe))));

    if (!canRead) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id}`,
        });
    }

    res.json(affectation);
});

// Champs qu'un administrateur peut renseigner ; id_user_admin vient toujours de la session.
const AFFECTATION_FIELDS = [
    "date_seance",
    "statut",
    "commentaire",
    "id_cours",
    "id_groupe",
    "id_user_enseignant",
    "id_salle",
    "id_creneau",
    "id_enseignement",
];

const INCLUDES_AFFECTATION = [
    { model: Cours, as: "cours" },
    { model: Groupe, as: "groupe" },
    { model: Users, as: "enseignant", attributes: { exclude: ["password_hash"] } },
    { model: Salle, as: "salle" },
    { model: Creneau, as: "creneau" },
    { model: Users, as: "admin_createur", attributes: { exclude: ["password_hash"] } },
];

// La date arrive en chaîne « AAAA-MM-JJ » (le validateur ne la convertit plus en Date)
const lireDonnees = (body) => {
    const donnees = pick(body, AFFECTATION_FIELDS);
    if (donnees.date_seance) donnees.date_seance = String(donnees.date_seance).slice(0, 10);
    if (donnees.id_salle === "") donnees.id_salle = null;
    return donnees;
};

/** 409 avec la liste des règles enfreintes, 4xx métier, sinon l'erreur remonte. */
const repondreErreur = (res, error) => {
    if (error instanceof ViolationsBloquantes) {
        return res.status(409).json({ message: error.message, error: error.violations.find((v) => v.bloquant)?.message, violations: error.violations });
    }
    if (error instanceof ErreurMetier) return res.status(error.status).json({ message: error.message, error: error.message });
    throw error;
};

const jourLisible = (affectation) => `${affectation.date_seance}${affectation.creneau ? ` à ${String(affectation.creneau.heure_debut).slice(0, 5)}` : ""}`;

// 🧪 Vérifier une séance sans l'enregistrer : liste des règles enfreintes
export const verifierAffectation = asyncHandler(async (req, res) => {
    const seance = { ...lireDonnees(req.body), ...(req.body.id_affectation ? { id_affectation: Number(req.body.id_affectation) } : {}) };
    const resultat = await verifierSeance(seance);
    res.json(resultat);
});

// ➕ Créer une affectation (refus 409 si une règle bloque, sauf forçage justifié)
export const createAffectation = asyncHandler(async (req, res) => {
    let resultat;
    try {
        resultat = await enregistrerSeance({
            donnees: lireDonnees(req.body),
            user: req.user,
            forcer: req.body.forcer === true,
            justification: req.body.justification,
        });
    } catch (error) {
        return repondreErreur(res, error);
    }

    const affectationComplete = await Affectation.findByPk(resultat.affectation.id_affectation, { include: INCLUDES_AFFECTATION });
    try {
        await notifierNouvelleAffectation({ id_user_enseignant: affectationComplete.id_user_enseignant, affectation: affectationComplete });
    } catch (error) {
        console.error("Erreur lors de l'envoi de la notification:", error);
    }

    res.status(201).json({
        message: resultat.force ? "Affectation enregistrée malgré les règles (forçage)" : "Affectation créée avec succès",
        affectation: affectationComplete,
        force: resultat.force,
        violations: resultat.violations,
    });
});

// ✏️ Mettre à jour une affectation (mêmes règles que la création)
export const updateAffectation = asyncHandler(async (req, res) => {
    let resultat;
    try {
        resultat = await enregistrerSeance({
            id: Number(req.params.id),
            donnees: lireDonnees(req.body),
            user: req.user,
            forcer: req.body.forcer === true,
            justification: req.body.justification,
        });
    } catch (error) {
        return repondreErreur(res, error);
    }

    const affectationComplete = await Affectation.findByPk(resultat.affectation.id_affectation, { include: INCLUDES_AFFECTATION });
    if (resultat.changement) {
        const annulee = affectationComplete.statut === "annule";
        await notifierChangementSeance({
            affectation: affectationComplete,
            titre: annulee ? "Séance annulée" : "Séance modifiée",
            message: annulee
                ? `${affectationComplete.cours?.nom_cours ?? "Une séance"} du ${resultat.avant.date_seance} est annulée.`
                : `${affectationComplete.cours?.nom_cours ?? "Une séance"} a changé : ${jourLisible(affectationComplete)}${affectationComplete.salle ? `, ${affectationComplete.salle.nom_salle}` : ""}.`,
        });
    }

    res.json({
        message: resultat.force ? "Affectation enregistrée malgré les règles (forçage)" : "Affectation mise à jour avec succès",
        affectation: affectationComplete,
        force: resultat.force,
        violations: resultat.violations,
    });
});

// 🗑️ Supprimer une affectation (ses conflits sont résolus, les personnes concernées prévenues)
export const deleteAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id, { include: [{ model: Cours, as: "cours" }] });
    if (!affectation) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id}`,
        });
    }
    const etaitActive = STATUTS_ACTIFS.includes(affectation.statut);
    await supprimerSeance(affectation.id_affectation);
    if (etaitActive && affectation.date_seance >= aujourdhui()) {
        await notifierChangementSeance({
            affectation,
            titre: "Séance supprimée",
            message: `${affectation.cours?.nom_cours ?? "Une séance"} du ${affectation.date_seance} est retirée de l'emploi du temps.`,
        });
    }

    res.json({
        message: "Affectation supprimée avec succès",
    });
});

// 🔍 Récupérer les affectations par enseignant (avec pagination)
export const getAffectationsByEnseignant = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = { id_user_enseignant: req.params.id_enseignant };
    if (req.query.date_from && req.query.date_to) {
        where.date_seance = { [Op.between]: [req.query.date_from, req.query.date_to] };
    } else if (req.query.date_from) {
        where.date_seance = { [Op.gte]: req.query.date_from };
    }

    const { count, rows: affectations } = await Affectation.findAndCountAll({
        where,
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
        limit,
        offset,
        order: [["date_seance", "ASC"], ["id_affectation", "ASC"]],
    });
    await appliquerRamadan(affectations);

    res.json(createPaginationResponse(affectations, count, page, limit));
});

// ✅ Confirmer une affectation (Enseignant propriétaire seulement)
export const confirmerAffectation = asyncHandler(async (req, res) => {
    const affectation = await Affectation.findOne({ where: { id_affectation: req.params.id } });

    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    const isOwner = affectation.id_user_enseignant === req.user.id_user;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Accès refusé : cette affectation ne vous appartient pas" });
    }

    if (affectation.statut !== "planifie") {
        return res.status(400).json({
            message: `Impossible de confirmer : statut actuel "${affectation.statut}"`,
        });
    }

    await affectation.update({ statut: "confirme" });

    res.json({ message: "Affectation confirmée avec succès", affectation });
});

// 🔍 Récupérer les affectations par groupe (avec pagination)
export const getAffectationsByGroupe = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = { id_groupe: req.params.id_groupe };
    if (req.query.date_from && req.query.date_to) {
        where.date_seance = { [Op.between]: [req.query.date_from, req.query.date_to] };
    } else if (req.query.date_from) {
        where.date_seance = { [Op.gte]: req.query.date_from };
    }

    const { count, rows: affectations } = await Affectation.findAndCountAll({
        where,
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
        limit,
        offset,
        order: [["date_seance", "ASC"], ["id_affectation", "ASC"]],
    });
    await appliquerRamadan(affectations);

    res.json(createPaginationResponse(affectations, count, page, limit));
});
