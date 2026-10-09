import { Op } from "sequelize";
import { Appartenir, SessionExamen, SessionExamenGroupe, Surveillance } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { ViolationsBloquantes } from "../services/planning/seances.js";
import { avecAncetres } from "../services/planning/groupes.js";
import {
    INCLUDES_EXAMEN,
    affecterSurveillants,
    chargeSurveillances,
    definirSurveillants,
    enregistrerExamen,
    publierExamen,
    validerExamen,
} from "../services/planning/examens.js";

/**
 * Examens et surveillances (phase P5) : planifiés par l'administration ; les enseignants voient
 * leurs surveillances, les étudiants les épreuves publiées de leurs groupes.
 */

const CHAMPS = ["titre", "id_cours", "id_periode", "nature", "date", "heure_debut", "heure_fin"];

const lire = (body) => {
    const donnees = pick(body, CHAMPS);
    if (donnees.date) donnees.date = String(donnees.date).slice(0, 10);
    return donnees;
};
const lireSalles = (body) =>
    Array.isArray(body.salles) ? body.salles.map((s) => ({ id_salle: Number(s.id_salle), ...(Number.isInteger(s.effectif) ? { effectif: s.effectif } : {}) })) : undefined;
const lireGroupes = (body) => (Array.isArray(body.groupes) ? [...new Set(body.groupes.map(Number))] : undefined);

const repondreErreur = (res, error) => {
    if (error instanceof ViolationsBloquantes) {
        return res.status(409).json({ message: "L'épreuve enfreint des règles", error: error.violations.find((v) => v.bloquant)?.message, violations: error.violations });
    }
    if (error instanceof ErreurMetier) return res.status(error.status).json({ message: error.message, error: error.message });
    throw error;
};

export const getExamens = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.id_periode) where.id_periode = Number(req.query.id_periode);
    if (req.query.date_from || req.query.date_to) {
        where.date = { ...(req.query.date_from ? { [Op.gte]: req.query.date_from } : {}), ...(req.query.date_to ? { [Op.lte]: req.query.date_to } : {}) };
    }
    res.json(await SessionExamen.findAll({ where, include: INCLUDES_EXAMEN, order: [["date", "ASC"], ["heure_debut", "ASC"]] }));
});

export const getExamen = asyncHandler(async (req, res) => {
    const examen = await SessionExamen.findByPk(req.params.id, { include: INCLUDES_EXAMEN });
    if (!examen) return res.status(404).json({ message: "Épreuve non trouvée", error: "Épreuve non trouvée" });
    res.json(examen);
});

// 👁️ Enseignant : ses surveillances (épreuves publiées)
export const getMesSurveillances = asyncHandler(async (req, res) => {
    const surveillances = await Surveillance.findAll({ where: { id_user: req.user.id_user }, attributes: ["id_session"] });
    res.json(
        await SessionExamen.findAll({
            where: { id_session: surveillances.map((s) => s.id_session), statut: "publiee" },
            include: INCLUDES_EXAMEN,
            order: [["date", "ASC"], ["heure_debut", "ASC"]],
        })
    );
});

// 🎓 Étudiant : épreuves publiées de son groupe et des groupes qui le contiennent
export const getMesExamens = asyncHandler(async (req, res) => {
    const appartenances = await Appartenir.findAll({ where: { id_user_etudiant: req.user.id_user }, attributes: ["id_groupe"] });
    const ids = await avecAncetres(appartenances.map((a) => a.id_groupe));
    const liens = await SessionExamenGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_session"] });
    res.json(
        await SessionExamen.findAll({
            where: { id_session: [...new Set(liens.map((l) => l.id_session))], statut: "publiee" },
            include: INCLUDES_EXAMEN,
            order: [["date", "ASC"], ["heure_debut", "ASC"]],
        })
    );
});

export const verifierExamen = asyncHandler(async (req, res) => {
    res.json(await validerExamen({ ...lire(req.body), groupes: lireGroupes(req.body) ?? [], salles: lireSalles(req.body) ?? [], id_session: req.body.id_session }));
});

export const createExamen = asyncHandler(async (req, res) => {
    try {
        const resultat = await enregistrerExamen({ donnees: lire(req.body), groupes: lireGroupes(req.body) ?? [], salles: lireSalles(req.body) ?? [], user: req.user, forcer: req.body.forcer === true, justification: req.body.justification });
        res.status(201).json({ message: "Épreuve planifiée", ...resultat });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const updateExamen = asyncHandler(async (req, res) => {
    try {
        const resultat = await enregistrerExamen({ id: Number(req.params.id), donnees: lire(req.body), groupes: lireGroupes(req.body), salles: lireSalles(req.body), user: req.user, forcer: req.body.forcer === true, justification: req.body.justification });
        res.json({ message: "Épreuve mise à jour", ...resultat });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const deleteExamen = asyncHandler(async (req, res) => {
    const examen = await SessionExamen.findByPk(req.params.id);
    if (!examen) return res.status(404).json({ message: "Épreuve non trouvée", error: "Épreuve non trouvée" });
    // Une épreuve publiée est annulée (les personnes prévenues la voient barrée), un brouillon supprimé
    if (examen.statut === "publiee") await examen.update({ statut: "annulee" });
    else await examen.destroy();
    res.json({ message: examen.statut === "annulee" ? "Épreuve annulée" : "Épreuve supprimée" });
});

export const autoSurveillants = asyncHandler(async (req, res) => {
    try {
        const resultat = await affecterSurveillants(Number(req.params.id));
        res.json({ message: resultat.manquants ? `${resultat.manquants} surveillant(s) manquant(s) : pas assez d'enseignants libres` : "Surveillants affectés", ...resultat });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const setSurveillants = asyncHandler(async (req, res) => {
    const surveillances = (Array.isArray(req.body.surveillances) ? req.body.surveillances : []).map((s) => ({ id_salle: Number(s.id_salle), id_user: Number(s.id_user) }));
    try {
        res.json({ message: "Surveillants enregistrés", ...(await definirSurveillants({ id: Number(req.params.id), surveillances, user: req.user, forcer: req.body.forcer === true, justification: req.body.justification })) });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const publier = asyncHandler(async (req, res) => {
    try {
        res.json({ message: "Épreuve publiée", examen: await publierExamen(Number(req.params.id)) });
    } catch (error) {
        return repondreErreur(res, error);
    }
});

export const getChargeSurveillances = asyncHandler(async (req, res) => {
    res.json(await chargeSurveillances({ idPeriode: req.query.id_periode ? Number(req.query.id_periode) : null }));
});
