import { planification } from "../utils/erreursPlanning.js";
import { ErreurMetier } from "../services/planning/enseignements.js";
import { etatPreparation, relancerVacataires } from "../services/planning/preparation.js";
import { edtMensuel } from "../services/planning/edtMensuel.js";
import { Appartenir, EnvoiEdt } from "../models/index.js";
import { lignesPubliees } from "../services/calendrier/versionPubliee.js";

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
    // Les étudiants voient le mois tel que publié pour la classe, rien avant (décisions du 21 octobre 2026)
    let publication = null;
    if (req.user.role === "etudiant") {
        const classes = (await Appartenir.findAll({ where: { id_user_etudiant: req.user.id_user }, attributes: ["id_groupe"] })).map((a) => a.id_groupe);
        const mois = String(req.query.mois ?? "");
        // La classe demandée si elle est publiée, sinon celle de l'étudiant
        const envois = await EnvoiEdt.findAll({ where: { id_groupe: [Number(req.params.id), ...classes], mois } });
        const envoi = envois.find((e) => e.id_groupe === Number(req.params.id)) ?? envois.find((e) => classes.includes(e.id_groupe));
        if (!envoi) throw new ErreurMetier("L'emploi du temps de ce mois n'est pas encore publié. Vous serez prévenu dès qu'il le sera.", 404, "EDT_NON_PUBLIE");
        publication = lignesPubliees([envoi]);
    }
    res.json(await edtMensuel({ id_groupe: Number(req.params.id), mois: req.query.mois, publication }));
});
