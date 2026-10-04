import { planification } from "../utils/erreursPlanning.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { etatPreparation, relancerVacataires } from "../services/planning/preparation.js";
import { edtMensuel } from "../services/planning/edtMensuel.js";

/**
 * Préparation du semestre (phase P4) et emploi du temps mensuel au format HESTIM.
 */

export const getPreparation = planification(async (req, res) => {
    if (!req.query.id_periode) throw new ErreurMetier("Période requise", 400);
    res.json(await etatPreparation({ id_periode: Number(req.query.id_periode), user: req.user }));
});

export const postRelancer = planification(async (req, res) => {
    res.json(await relancerVacataires({ id_periode: Number(req.body.id_periode), id_filiere: Number(req.body.id_filiere) }));
});

export const getEdtMensuel = planification(async (req, res) => {
    res.json(await edtMensuel({ id_groupe: Number(req.params.id), mois: req.query.mois }));
});
