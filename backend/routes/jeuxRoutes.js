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
import { historiqueEnseignant } from "../services/jeux/historique.js";

/**
 * Jeux intégrés à Planner (terminal Linux…), pour les étudiants et les enseignants : l'administration
 * ne gère pas les jeux. Les quiz en direct restent dans ClassQuiz (/api/quiz).
 *  - GET  /api/jeux                              mon personnage, catalogue, progression et jeux de mes modules
 *  - GET  /api/jeux/historique                    petit historique de l'enseignant (quiz, devoirs, défis)
 *  - PUT  /api/jeux/profil                       { avatar } : choisir mon personnage
 *  - GET  /api/jeux/:code/progression            défis que j'ai réussis
 *  - POST /api/jeux/:code/defis/:id/reussite     { indices, commandes } : rejoue la partie, enregistre la réussite
 *  - GET  /api/jeux/:code/modules                modules où le jeu est proposé (enseignants)
 *  - POST /api/jeux/:code/modules                { id_cours } : proposer le jeu dans un module
 *  - DELETE /api/jeux/:code/modules/:idCours     retirer le jeu d'un module
 *  - GET  /api/jeux/:code/modules/:idCours/suivi progression des étudiants du module
 */
const router = express.Router();

router.use(authenticateToken);

router.use((req, res, next) =>
    ["etudiant", "enseignant"].includes(req.user.role) ? next() : res.status(403).json({ message: "Accès interdit", error: "Les jeux sont réservés aux enseignants et aux étudiants" })
);

const enseignantSeul = (req, res, next) =>
    req.user.role === "enseignant" ? next() : res.status(403).json({ message: "Accès interdit", error: "Réservé aux enseignants" });

router.get("/", planification(async (req, res) => {
    res.json(await accueilJeux(req.user));
}));

router.get("/historique", enseignantSeul, planification(async (req, res) => {
    res.json({ data: await historiqueEnseignant(req.user) });
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

router.get("/:code/modules", enseignantSeul, planification(async (req, res) => {
    res.json({ data: await modulesDuJeu(req.params.code) });
}));

router.post("/:code/modules", enseignantSeul, planification(async (req, res) => {
    const resultat = await proposerDansModule(req.user, req.params.code, req.body?.id_cours, { but: req.body?.but, notion: req.body?.notion });
    res.status(resultat.cree ? 201 : 200).json(resultat);
}));

router.delete("/:code/modules/:idCours", enseignantSeul, planification(async (req, res) => {
    const retires = await retirerDuModule(req.user, req.params.code, req.params.idCours);
    res.json({ retires });
}));

router.get("/:code/modules/:idCours/suivi", enseignantSeul, planification(async (req, res) => {
    res.json(await suiviDuModule(req.user, req.params.code, req.params.idCours));
}));

export default router;
