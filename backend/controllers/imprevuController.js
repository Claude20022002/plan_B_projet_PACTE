import { Affectation } from "../models/index.js";
import { planification } from "../utils/erreursPlanning.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { proposerCreneauxReservation, proposerCreneauxSeance, proposerPourSeance } from "../services/planning/assistant.js";
import { annulerJournee, declarerAbsence, relogerSeances, remplacantsPossibles, remplacerEnseignant, seancesDuJour } from "../services/planning/imprevus.js";

/**
 * Imprévus (phase P6) et assistant de créneaux (I8).
 */

const dateValide = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
const exigerDates = (debut, fin) => {
    if (!dateValide(debut) || !dateValide(fin)) throw new ErreurMetier("Dates de début et de fin requises (AAAA-MM-JJ)", 400);
    if (fin < debut) throw new ErreurMetier("La date de fin précède la date de début", 400);
};

// 🧭 Créneaux libres pour une séance existante (administration, ou son enseignant) ou à créer (administration)
export const creneauxPourSeance = planification(async (req, res) => {
    const { date_debut, date_fin, garder_salle: garderSalle = false, limite = 8 } = req.body;
    exigerDates(date_debut, date_fin);
    if (req.body.id_affectation) {
        const affectation = await Affectation.findByPk(req.body.id_affectation);
        if (!affectation) throw new ErreurMetier("Affectation non trouvée", 404);
        if (req.user.role !== "admin" && affectation.id_user_enseignant !== req.user.id_user) throw new ErreurMetier("Vous ne pouvez chercher des créneaux que pour vos séances", 403);
        return res.json(await proposerPourSeance({ id: affectation.id_affectation, date_debut, date_fin, garderSalle, limite: Math.min(Number(limite) || 8, 20) }));
    }
    if (req.user.role !== "admin") throw new ErreurMetier("Précisez la séance concernée", 403);
    const seance = {
        id_groupe: Number(req.body.id_groupe),
        id_user_enseignant: Number(req.body.id_user_enseignant),
        id_cours: Number(req.body.id_cours),
        id_enseignement: req.body.id_enseignement ? Number(req.body.id_enseignement) : null,
        id_salle: req.body.id_salle ? Number(req.body.id_salle) : null,
    };
    if (!seance.id_groupe || !seance.id_user_enseignant || !seance.id_cours) throw new ErreurMetier("Groupe, enseignant et module requis", 400);
    res.json(await proposerCreneauxSeance({ seance, date_debut, date_fin, garderSalle, limite: Math.min(Number(limite) || 8, 20) }));
});

// 🧭 Plages libres pour une réservation (soutenance, réunion…)
export const creneauxPourReservation = planification(async (req, res) => {
    const { date_debut, date_fin, type = "soutenance", duree_minutes: duree = 60, id_salle = null, participants = [], limite = 8 } = req.body;
    exigerDates(date_debut, date_fin);
    if (!(Number(duree) >= 15 && Number(duree) <= 480)) throw new ErreurMetier("Durée entre 15 et 480 minutes", 400);
    res.json(await proposerCreneauxReservation({ type, participants: Array.isArray(participants) ? participants : [], duree_minutes: Number(duree), date_debut, date_fin, id_salle: id_salle ? Number(id_salle) : null, limite: Math.min(Number(limite) || 8, 20) }));
});

// 🤒 Absence d'un enseignant (lui-même ou l'administration)
export const postAbsence = planification(async (req, res) => {
    const { date_debut, date_fin, motif } = req.body;
    exigerDates(date_debut, date_fin);
    if (!String(motif || "").trim()) throw new ErreurMetier("Indiquez le motif de l'absence", 400);
    const idUser = req.user.role === "admin" ? Number(req.body.id_user) : req.user.id_user;
    if (!idUser) throw new ErreurMetier("Enseignant requis", 400);
    res.status(201).json(await declarerAbsence({ id_user: idUser, date_debut, date_fin, motif: motif.trim(), user: req.user }));
});

export const getRemplacants = planification(async (req, res) => {
    const seance = await Affectation.findByPk(req.params.id, { include: ["creneau"] });
    if (!seance) throw new ErreurMetier("Affectation non trouvée", 404);
    res.json(await remplacantsPossibles(seance, { limite: 10 }));
});

export const postRemplacer = planification(async (req, res) => {
    if (!req.body.id_user) throw new ErreurMetier("Remplaçant requis", 400);
    const resultat = await remplacerEnseignant({ id: Number(req.params.id), id_user: Number(req.body.id_user), user: req.user, forcer: req.body.forcer === true, justification: req.body.justification });
    res.json({ message: "Séance confiée au remplaçant", affectation: resultat.affectation, violations: resultat.violations, force: resultat.force });
});

export const postReloger = planification(async (req, res) => {
    const { date_debut, date_fin, appliquer = false } = req.body;
    exigerDates(date_debut, date_fin);
    res.json(await relogerSeances({ id_salle: Number(req.params.id), date_debut, date_fin, appliquer: appliquer === true, user: req.user }));
});

export const getJour = planification(async (req, res) => {
    if (!dateValide(req.params.date)) throw new ErreurMetier("Date invalide (AAAA-MM-JJ)", 400);
    res.json(await seancesDuJour({ date: req.params.date, id_filiere: req.query.id_filiere || null }));
});

export const postAnnulerJour = planification(async (req, res) => {
    if (!dateValide(req.params.date)) throw new ErreurMetier("Date invalide (AAAA-MM-JJ)", 400);
    res.json(await annulerJournee({ date: req.params.date, motif: req.body.motif, id_filiere: req.body.id_filiere || null, user: req.user }));
});
