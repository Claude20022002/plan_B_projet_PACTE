import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import {
    accueilJeux,
    choisirAvatar,
    enregistrerReussite,
    modulesDuJeu,
    progressionDuJeu,
    proposerDansModule,
    retirerDuModule,
    suiviDuModule,
} from "../services/jeux/jeux.js";

/**
 * Jeux intégrés à Planner (terminal Linux…). Les quiz en direct restent dans ClassQuiz (/api/quiz).
 *  - GET  /api/jeux                              mon personnage, catalogue, progression et jeux de mes modules
 *  - PUT  /api/jeux/profil                       { avatar } : choisir mon personnage
 *  - GET  /api/jeux/:code/progression            défis que j'ai réussis
 *  - POST /api/jeux/:code/defis/:id/reussite     { indices, commandes } : rejoue la partie, enregistre la réussite
 *  - GET  /api/jeux/:code/modules                modules où le jeu est proposé (enseignants, admin)
 *  - POST /api/jeux/:code/modules                { id_cours } : proposer le jeu dans un module
 *  - DELETE /api/jeux/:code/modules/:idCours     retirer le jeu d'un module
 *  - GET  /api/jeux/:code/modules/:idCours/suivi progression des étudiants du module
 */
const router = express.Router();

router.use(authenticateToken);

const enseignantOuAdmin = (req, res, next) =>
    ["enseignant", "admin"].includes(req.user.role) ? next() : res.status(403).json({ message: "Accès interdit", error: "Réservé aux enseignants et à l'administration" });

router.get("/", planification(async (req, res) => {
    res.json(await accueilJeux(req.user));
}));

router.put("/profil", planification(async (req, res) => {
    res.json(await choisirAvatar(req.user, req.body?.avatar));
}));

router.get("/:code/progression", planification(async (req, res) => {
    res.json(await progressionDuJeu(req.user, req.params.code));
}));

router.post("/:code/defis/:idDefi/reussite", planification(async (req, res) => {
    const resultat = await enregistrerReussite(req.user, req.params.code, req.params.idDefi, req.body?.indices, req.body?.commandes);
    res.status(resultat.cree ? 201 : 200).json(resultat);
}));

router.get("/:code/modules", enseignantOuAdmin, planification(async (req, res) => {
    res.json({ data: await modulesDuJeu(req.params.code) });
}));

router.post("/:code/modules", enseignantOuAdmin, planification(async (req, res) => {
    const resultat = await proposerDansModule(req.user, req.params.code, req.body?.id_cours);
    res.status(resultat.cree ? 201 : 200).json(resultat);
}));

router.delete("/:code/modules/:idCours", enseignantOuAdmin, planification(async (req, res) => {
    const retires = await retirerDuModule(req.user, req.params.code, req.params.idCours);
    res.json({ retires });
}));

router.get("/:code/modules/:idCours/suivi", enseignantOuAdmin, planification(async (req, res) => {
    res.json(await suiviDuModule(req.user, req.params.code, req.params.idCours));
}));

export default router;
