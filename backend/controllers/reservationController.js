import { Op } from "sequelize";
import { Reservation, ReservationParticipant } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { ViolationsBloquantes } from "../services/planning/seances.js";
import {
    INCLUDES_RESERVATION,
    annulerReservation,
    creerReservation,
    refuserDemande,
    validerDemande,
    validerReservation,
} from "../services/planning/reservations.js";

/**
 * Réservations de salles hors cours (phase P5) : les enseignants demandent, l'administration
 * valide ; mêmes règles d'occupation que les séances (409 + liste, forçage justifié).
 */

const CHAMPS = ["type", "titre", "description", "id_salle", "date", "heure_debut", "heure_fin", "id_affectation_origine"];

const lire = (body) => {
    const donnees = pick(body, CHAMPS);
    if (donnees.date) donnees.date = String(donnees.date).slice(0, 10);
    if (donnees.id_salle === "") donnees.id_salle = null;
    return donnees;
};
const lireParticipants = (body) =>
    (Array.isArray(body.participants) ? body.participants : []).map((p) => ({
        id_user: p.id_user ? Number(p.id_user) : null,
        id_groupe: p.id_groupe ? Number(p.id_groupe) : null,
        role: p.role || "participant",
    }));

const repondreErreur = (res, error) => {
    if (error instanceof ViolationsBloquantes) {
        return res.status(409).json({ message: "La réservation enfreint des règles", error: error.violations.find((v) => v.bloquant)?.message, violations: error.violations });
    }
    if (error instanceof ErreurMetier) return res.status(error.status).json({ message: error.message, error: error.message });
    throw error;
};

/** Visible par l'administration, le demandeur et les personnes participantes. */
const peutVoir = (reservation, user) =>
    user.role === "admin" || reservation.id_demandeur === user.id_user || reservation.participants.some((p) => p.id_user === user.id_user);

// 🔍 Liste : tout pour l'administration ; ses demandes et ses participations pour les autres
export const getReservations = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.type) where.type = req.query.type;
    if (req.query.id_salle) where.id_salle = Number(req.query.id_salle);
    if (req.query.date_from || req.query.date_to) {
        where.date = { ...(req.query.date_from ? { [Op.gte]: req.query.date_from } : {}), ...(req.query.date_to ? { [Op.lte]: req.query.date_to } : {}) };
    }
    if (req.user.role !== "admin") {
        const participations = await ReservationParticipant.findAll({ where: { id_user: req.user.id_user }, attributes: ["id_reservation"] });
        where[Op.or] = [{ id_demandeur: req.user.id_user }, { id_reservation: participations.map((p) => p.id_reservation) }];
    }
    const reservations = await Reservation.findAll({ where, include: INCLUDES_RESERVATION, order: [["date", "ASC"], ["heure_debut", "ASC"]] });
    res.json(reservations);
});

export const getReservation = asyncHandler(async (req, res) => {
    const reservation = await Reservation.findByPk(req.params.id, { include: INCLUDES_RESERVATION });
    if (!reservation || !peutVoir(reservation, req.user)) return res.status(404).json({ message: "Réservation non trouvée", error: "Réservation non trouvée" });
    res.json(reservation);
});

// 🧪 Vérifier sans enregistrer
export const verifierReservation = asyncHandler(async (req, res) => {
    res.json(await validerReservation({ ...lire(req.body), participants: lireParticipants(req.body) }));
});

// ➕ Demander (enseignant) ou réserver (administration)
export const createReservation = asyncHandler(async (req, res) => {
    const donnees = lire(req.body);
    if (donnees.type === "examen" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès interdit", error: "Les examens sont planifiés par l'administration" });
    }
    try {
        const resultat = await creerReservation({
            donnees,
            participants: lireParticipants(req.body),
            user: req.user,
            forcer: req.body.forcer === true,
            justification: req.body.justification,
        });
        res.status(201).json({
            message: resultat.reservation.statut === "validee" ? "Réservation enregistrée" : "Demande envoyée à l'administration",
            ...resultat,
        });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const validerReservationDemandee = asyncHandler(async (req, res) => {
    try {
        res.json({ message: "Réservation validée", ...(await validerDemande({ id: Number(req.params.id), user: req.user, forcer: req.body.forcer === true, justification: req.body.justification })) });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const refuserReservation = asyncHandler(async (req, res) => {
    try {
        res.json({ message: "Réservation refusée", reservation: await refuserDemande({ id: Number(req.params.id), user: req.user, motif: req.body.motif }) });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const annulerReservationExistante = asyncHandler(async (req, res) => {
    try {
        res.json({ message: "Réservation annulée", reservation: await annulerReservation({ id: Number(req.params.id), user: req.user }) });
    } catch (error) {
        return repondreErreur(res, error);
    }
});
