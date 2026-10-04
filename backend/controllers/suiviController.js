import { planification } from "../utils/erreursPlanning.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import {
    deposerRetour,
    exportVacataires,
    marquerRealisees,
    realiserSeance,
    retoursADonner,
    retoursEnseignant,
    suiviEnseignants,
    suiviModules,
} from "../services/planning/suivi.js";

/**
 * Suivi du réalisé (phase P7) et retours de séance (I7).
 */

export const patchRealiser = planification(async (req, res) => {
    res.json({ message: "Séance marquée réalisée", affectation: await realiserSeance({ id: Number(req.params.id), user: req.user }) });
});

export const postActualiser = planification(async (req, res) => {
    res.json({ realisees: await marquerRealisees() });
});

export const getModules = planification(async (req, res) => {
    if (!req.query.id_periode) throw new ErreurMetier("Période requise", 400);
    res.json(await suiviModules({ id_periode: Number(req.query.id_periode), id_filiere: req.query.id_filiere || null, user: req.user }));
});

export const getEnseignants = planification(async (req, res) => {
    res.json(await suiviEnseignants({ mois: req.query.mois }));
});

export const getExportVacataires = planification(async (req, res) => {
    const csv = await exportVacataires({ mois: req.query.mois });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="heures-vacataires-${req.query.mois}.csv"`);
    res.send(csv);
});

// Retours de séance
export const getRetoursADonner = planification(async (req, res) => {
    res.json(await retoursADonner({ user: req.user }));
});

export const postRetour = planification(async (req, res) => {
    res.status(201).json(await deposerRetour({ id_affectation: Number(req.params.id), user: req.user, note: Number(req.body.note), mot: req.body.mot }));
});

export const getMesRetours = planification(async (req, res) => {
    res.json(await retoursEnseignant({ id_user: req.user.id_user }));
});

export const getRetoursEnseignant = planification(async (req, res) => {
    res.json(await retoursEnseignant({ id_user: Number(req.params.id) }));
});
