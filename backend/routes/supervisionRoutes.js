import crypto from "node:crypto";
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { etatDeSante, mesuresDuServeur } from "../services/supervision/etat.js";

/**
 * Supervision (lot ME-21), lue par la sonde extérieure toutes les quelques minutes :
 *  - GET /api/supervision/sante   public : { etat, base, solveur, erreurs } ; 200, ou 503 si la base
 *    ne répond pas. La sonde alerte sur le code et sur les mots « "solveur":"ok" », « "erreurs":"ok" ».
 *  - GET /api/supervision/mesures en-tête X-Supervision-Jeton = SUPERVISION_TOKEN (32 caractères au
 *    moins) : trafic, temps de réponse, erreurs, courriels en échec, générations, connexions MySQL.
 *    404 tant que le jeton n'est pas configuré.
 * Rien de personnel dans les deux réponses ; jamais mises en cache.
 */
const router = express.Router();

const jetonValide = (recu) => {
    const attendu = Buffer.from(process.env.SUPERVISION_TOKEN || "");
    const donne = Buffer.from(typeof recu === "string" ? recu : "");
    return attendu.length >= 32 && attendu.length === donne.length && crypto.timingSafeEqual(attendu, donne);
};

router.get("/sante", asyncHandler(async (req, res) => {
    const etat = await etatDeSante();
    res.set("Cache-Control", "no-store").status(etat.base === "ok" ? 200 : 503).json(etat);
}));

router.get("/mesures", asyncHandler(async (req, res) => {
    if (!process.env.SUPERVISION_TOKEN) return res.status(404).json({ message: "Mesures de supervision non configurées" });
    if (!jetonValide(req.get("X-Supervision-Jeton"))) return res.status(401).json({ message: "Jeton de supervision invalide" });
    res.set("Cache-Control", "no-store").json(await mesuresDuServeur());
}));

export default router;
