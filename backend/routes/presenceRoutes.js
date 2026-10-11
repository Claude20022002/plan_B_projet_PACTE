import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { ACCESS_COOKIE } from "../config/authCookies.js";
import { planification } from "../utils/erreursPlanning.js";
import { contexteDe } from "../services/journalSecurite.js";
import {
    codeDeLAppel,
    delierTelephone,
    fermerAppel,
    listeDAppel,
    marquerPresence,
    mesPresences,
    ouvrirAppel,
    scannerCode,
    signalementsRecents,
    telephoneDeLEtudiant,
    tirerVerification,
    verifierEtudiant,
} from "../services/presences/appel.js";
import { deciderDemande, demanderChangement, demandesTelephone, maDemandeTelephone } from "../services/presences/changementTelephone.js";

/**
 * Appel par QR code (phase I1) :
 *  - POST /api/presences/seances/:id/ouvrir                  ouvrir l'appel (enseignant de la séance, le jour même)
 *  - GET  /api/presences/seances/:id/code                    code à afficher (change toutes les 30 s) et nombre de présents
 *  - GET  /api/presences/seances/:id                         liste d'appel : attendus, présents
 *  - PUT  /api/presences/seances/:id/etudiants/:idUser       { present } : cocher ou décocher à la main
 *  - POST /api/presences/seances/:id/fermer                  fermer l'appel ; la séance est marquée réalisée
 *  - POST /api/presences/seances/:id/verification            { nombre } : vérification surprise facultative (tirage)
 *  - PUT  /api/presences/seances/:id/verification/:idUser    { present } : vu dans la salle, ou absent (signalé)
 *  - POST /api/presences/scanner                             { code } : l'étudiant scanne le QR, depuis l'application
 *  - GET  /api/presences/miennes                             mes présences (étudiant)
 *  - GET  /api/presences/signalements                        soupçons de fraude récents (administration)
 *  - GET  /api/presences/etudiants/:idUser/telephone         téléphone lié au compte : { lie, lie_le } (administration)
 *  - DELETE /api/presences/etudiants/:idUser/telephone       délier (nouveau téléphone) : { delie } (administration)
 * Changement de téléphone (R-10) :
 *  - POST /api/presences/telephone/demande                   { motif? } : l'étudiant déclare le téléphone en main, depuis l'application
 *  - GET  /api/presences/telephone/demande                   sa dernière demande, ou null (étudiant)
 *  - GET  /api/presences/demandes-telephone?statut=          demandes à traiter (administration)
 *  - POST /api/presences/demandes-telephone/:id/accepter     lier le téléphone déclaré (administration)
 *  - POST /api/presences/demandes-telephone/:id/refuser      { motif? } (administration)
 */
const router = express.Router();
router.use(authenticateToken);

const idEtudiant = (req) => {
    const id = Number(req.params.idUser);
    return Number.isInteger(id) && id > 0 ? id : -1;
};

// Le scan n'est accepté que de l'application : jeton en Bearer (pas le cookie du site) et
// identifiant d'installation en X-Appareil. Un compte prêté ouvert dans un navigateur ne pointe pas.
const appareilDeLApplication = (req) =>
    req.get("X-Client") === "mobile" && /^Bearer /.test(req.get("Authorization") ?? "") && !req.cookies?.[ACCESS_COOKIE] ? req.get("X-Appareil") ?? null : null;

router.post("/scanner", planification(async (req, res) => {
    res.json(await scannerCode(req.user, req.body?.code, new Date(), appareilDeLApplication(req)));
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

router.post("/seances/:id/verification", planification(async (req, res) => {
    res.json(await tirerVerification(req.user, req.params.id, req.body?.nombre));
}));

router.put("/seances/:id/verification/:idUser", planification(async (req, res) => {
    res.json(await verifierEtudiant(req.user, req.params.id, idEtudiant(req), req.body?.present === true));
}));

router.get("/signalements", planification(async (req, res) => {
    res.json({ data: await signalementsRecents(req.user) });
}));

router.get("/etudiants/:idUser/telephone", planification(async (req, res) => {
    res.json(await telephoneDeLEtudiant(req.user, idEtudiant(req)));
}));

router.delete("/etudiants/:idUser/telephone", planification(async (req, res) => {
    res.json(await delierTelephone(req.user, idEtudiant(req), contexteDe(req)));
}));

router.post("/telephone/demande", planification(async (req, res) => {
    res.status(201).json(await demanderChangement(req.user, appareilDeLApplication(req), { motif: req.body?.motif }, contexteDe(req)));
}));

router.get("/telephone/demande", planification(async (req, res) => {
    res.json({ data: await maDemandeTelephone(req.user) });
}));

router.get("/demandes-telephone", planification(async (req, res) => {
    res.json({ data: await demandesTelephone(req.user, { statut: req.query.statut || undefined }) });
}));

const idDemande = (req) => {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : -1;
};

router.post("/demandes-telephone/:id/accepter", planification(async (req, res) => {
    res.json(await deciderDemande(req.user, idDemande(req), true, {}, contexteDe(req)));
}));

router.post("/demandes-telephone/:id/refuser", planification(async (req, res) => {
    res.json(await deciderDemande(req.user, idDemande(req), false, { motif: req.body?.motif }, contexteDe(req)));
}));

export default router;
