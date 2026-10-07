import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { codeDeLAppel, fermerAppel, listeDAppel, marquerPresence, mesPresences, ouvrirAppel, scannerCode } from "../services/presences/appel.js";

/**
 * Appel par QR code (phase I1) :
 *  - POST /api/presences/seances/:id/ouvrir                  ouvrir l'appel (enseignant de la séance, le jour même)
 *  - GET  /api/presences/seances/:id/code                    code à afficher (change toutes les 30 s) et nombre de présents
 *  - GET  /api/presences/seances/:id                         liste d'appel : attendus, présents
 *  - PUT  /api/presences/seances/:id/etudiants/:idUser       { present } : cocher ou décocher à la main
 *  - POST /api/presences/seances/:id/fermer                  fermer l'appel ; la séance est marquée réalisée
 *  - POST /api/presences/scanner                             { code } : l'étudiant scanne le QR
 *  - GET  /api/presences/miennes                             mes présences (étudiant)
 */
const router = express.Router();
router.use(authenticateToken);

const idEtudiant = (req) => {
    const id = Number(req.params.idUser);
    return Number.isInteger(id) && id > 0 ? id : -1;
};

router.post("/scanner", planification(async (req, res) => {
    res.json(await scannerCode(req.user, req.body?.code));
}));

router.get("/miennes", planification(async (req, res) => {
    res.json({ data: await mesPresences(req.user) });
}));

router.post("/seances/:id/ouvrir", planification(async (req, res) => {
    res.json(await ouvrirAppel(req.user, req.params.id));
}));

router.get("/seances/:id/code", planification(async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(await codeDeLAppel(req.user, req.params.id));
}));

router.get("/seances/:id", planification(async (req, res) => {
    res.json(await listeDAppel(req.user, req.params.id));
}));

router.put("/seances/:id/etudiants/:idUser", planification(async (req, res) => {
    res.json(await marquerPresence(req.user, req.params.id, idEtudiant(req), req.body?.present === true));
}));

router.post("/seances/:id/fermer", planification(async (req, res) => {
    res.json(await fermerAppel(req.user, req.params.id));
}));

export default router;
