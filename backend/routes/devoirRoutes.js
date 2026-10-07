import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import {
    TAILLE_MAX_FICHIER,
    TYPES_DEVOIRS,
    creerDevoir,
    deposerCopie,
    deposerEnonce,
    devoirsDe,
    lireFichierDevoir,
    noterCopie,
    quizDisponibles,
    rendreDevoir,
    resultatsDuDevoir,
    sujetDuDevoir,
    supprimerDevoir,
} from "../services/quiz/devoirs.js";
import { enTetesTelechargement } from "../utils/fichiers.js";

/**
 * Devoirs notés : un quiz ClassQuiz corrigé par Planner (phase Q), ou un devoir « fichier » rendu
 * par dépôt et noté par l'enseignant (R3, remplace Google Classroom).
 *  - GET    /api/devoirs                   mes devoirs (étudiant) ou ceux que j'ai donnés (enseignant)
 *  - GET    /api/devoirs/quiz-disponibles  mes quiz ClassQuiz (enseignant)
 *  - POST   /api/devoirs                   { quiz_id, id_cours, id_groupe?, date_limite }
 *                                          ou { type: "fichier", titre, consignes?, id_cours, id_groupe?, date_limite }
 *  - PUT    /api/devoirs/:id/enonce        corps brut, ?nom=… : énoncé (enseignant du module)
 *  - GET    /api/devoirs/:id/enonce        télécharger l'énoncé
 *  - PUT    /api/devoirs/:id/copie         corps brut, ?nom=… : ma copie (étudiant ; en retard après la date limite)
 *  - GET    /api/devoirs/:id/copies/:idUser            télécharger une copie (son auteur, enseignants du module)
 *  - PUT    /api/devoirs/:id/copies/:idUser/note       { note, commentaire } : noter sur 20 (enseignant du module)
 *  - GET    /api/devoirs/:id               sujet (sans réponses), correction après la date limite
 *  - POST   /api/devoirs/:id/rendu         { reponses } : une copie, notée sur 20
 *  - GET    /api/devoirs/:id/resultats     notes des étudiants visés (enseignant)
 *  - DELETE /api/devoirs/:id               supprimer le devoir
 */
const router = express.Router();
router.use(authenticateToken);

router.get("/", planification(async (req, res) => {
    res.json({ data: await devoirsDe(req.user) });
}));

router.get("/quiz-disponibles", planification(async (req, res) => {
    res.json({ data: await quizDisponibles(req.user) });
}));

router.post("/", planification(async (req, res) => {
    res.status(201).json(await creerDevoir(req.user, req.body ?? {}));
}));

router.get("/:id", planification(async (req, res) => {
    res.json(await sujetDuDevoir(req.user, req.params.id));
}));

router.post("/:id/rendu", planification(async (req, res) => {
    res.status(201).json(await rendreDevoir(req.user, req.params.id, req.body?.reponses));
}));

router.get("/:id/resultats", planification(async (req, res) => {
    res.json(await resultatsDuDevoir(req.user, req.params.id));
}));

// Fichiers en corps brut, 10 Mo au plus (+ marge) ; au-delà, 413 avant toute lecture en base
const corpsBrut = express.raw({ type: TYPES_DEVOIRS, limit: TAILLE_MAX_FICHIER + 1024 });
const recevoirFichier = (req, res, next) =>
    corpsBrut(req, res, (err) => (err ? res.status(err.status === 413 ? 413 : 400).json({ message: err.status === 413 ? "Fichier : 10 Mo au plus" : "Fichier illisible" }) : next()));
const fichierRecu = (req) => ({ contenu: Buffer.isBuffer(req.body) ? req.body : null, type: req.get("Content-Type"), nom: req.query.nom });
const idEtudiant = (req) => {
    const id = Number(req.params.idUser);
    return Number.isInteger(id) && id > 0 ? id : -1;
};
const envoyerFichier = (res, fichier) => {
    res.set(enTetesTelechargement(fichier));
    res.end(fichier.contenu);
};

router.put("/:id/enonce", recevoirFichier, planification(async (req, res) => {
    res.json(await deposerEnonce(req.user, req.params.id, fichierRecu(req)));
}));

router.get("/:id/enonce", planification(async (req, res) => {
    envoyerFichier(res, await lireFichierDevoir(req.user, req.params.id, null));
}));

router.put("/:id/copie", recevoirFichier, planification(async (req, res) => {
    res.json(await deposerCopie(req.user, req.params.id, fichierRecu(req)));
}));

router.get("/:id/copies/:idUser", planification(async (req, res) => {
    envoyerFichier(res, await lireFichierDevoir(req.user, req.params.id, idEtudiant(req)));
}));

router.put("/:id/copies/:idUser/note", planification(async (req, res) => {
    res.json(await noterCopie(req.user, req.params.id, idEtudiant(req), req.body ?? {}));
}));

router.delete("/:id", planification(async (req, res) => {
    res.json(await supprimerDevoir(req.user, req.params.id));
}));

export default router;
