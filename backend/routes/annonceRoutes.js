import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import {
    TAILLE_MAX_PIECE,
    TYPES_PIECE,
    annoncesEnvoyees,
    annoncesRecues,
    ciblesPossibles,
    deposerPieceJointe,
    detailAnnonce,
    lecteurs,
    lirePieceJointe,
    marquerLue,
    publierAnnonce,
    relancer,
    supprimerAnnonce,
} from "../services/annonces/annonces.js";

/**
 * Annonces ciblées (phase R1) :
 *  - GET    /api/annonces                    mes annonces reçues et le nombre de non-lues
 *  - GET    /api/annonces/cibles             portées, publics, campus, filières et groupes que je peux viser
 *  - GET    /api/annonces/envoyees           annonces que j'ai envoyées (toutes pour l'administration), avec les lus
 *  - POST   /api/annonces                    { titre, corps, portee, id_cible, niveau, public, envoyer_email }
 *  - GET    /api/annonces/:id                l'annonce (destinataire, auteur ou administration)
 *  - POST   /api/annonces/:id/lue            accusé de lecture
 *  - GET    /api/annonces/:id/lecteurs       qui a lu, qui n'a pas lu (auteur)
 *  - POST   /api/annonces/:id/relancer       rappel aux non-lus (auteur, toutes les 12 h au plus)
 *  - PUT    /api/annonces/:id/piece-jointe   corps brut PDF ou image, ?nom=… (auteur, 5 Mo au plus)
 *  - GET    /api/annonces/:id/piece-jointe   téléchargement
 *  - DELETE /api/annonces/:id                supprimer (auteur)
 */
const router = express.Router();

router.use(authenticateToken);

const idAnnonce = (req) => {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : -1;
};

router.get("/", planification(async (req, res) => {
    res.json(await annoncesRecues(req.user, { limite: req.query.limite }));
}));

router.get("/cibles", planification(async (req, res) => {
    res.json(await ciblesPossibles(req.user));
}));

router.get("/envoyees", planification(async (req, res) => {
    res.json({ data: await annoncesEnvoyees(req.user) });
}));

router.post("/", planification(async (req, res) => {
    const { titre, corps, portee, niveau, envoyer_email } = req.body ?? {};
    const idCible = req.body?.id_cible === null || req.body?.id_cible === undefined ? null : Number(req.body.id_cible);
    res.status(201).json(await publierAnnonce(req.user, { titre, corps, portee, id_cible: idCible, niveau, public: req.body?.public, envoyer_email }));
}));

router.get("/:id", planification(async (req, res) => {
    res.json(await detailAnnonce(req.user, idAnnonce(req)));
}));

router.post("/:id/lue", planification(async (req, res) => {
    res.json(await marquerLue(req.user, idAnnonce(req)));
}));

router.get("/:id/lecteurs", planification(async (req, res) => {
    res.json({ data: await lecteurs(req.user, idAnnonce(req)) });
}));

router.post("/:id/relancer", planification(async (req, res) => {
    res.json(await relancer(req.user, idAnnonce(req)));
}));

// Corps brut limité à 5 Mo (+ marge) ; au-delà, 413 avant toute lecture en base
const corpsBrut = express.raw({ type: TYPES_PIECE, limit: TAILLE_MAX_PIECE + 1024 });
router.put(
    "/:id/piece-jointe",
    (req, res, next) => corpsBrut(req, res, (err) => (err ? res.status(err.status === 413 ? 413 : 400).json({ message: err.status === 413 ? "Pièce jointe : 5 Mo au plus" : "Fichier illisible" }) : next())),
    planification(async (req, res) => {
        const contenu = Buffer.isBuffer(req.body) ? req.body : null;
        res.json(await deposerPieceJointe(req.user, idAnnonce(req), { contenu, type: req.get("Content-Type"), nom: req.query.nom }));
    })
);

router.get("/:id/piece-jointe", planification(async (req, res) => {
    const piece = await lirePieceJointe(req.user, idAnnonce(req));
    res.set({
        "Content-Type": piece.type_mime,
        "Content-Length": String(piece.taille),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(piece.nom)}`,
        "Cache-Control": "private, no-store",
    });
    res.end(piece.contenu);
}));

router.delete("/:id", planification(async (req, res) => {
    await supprimerAnnonce(req.user, idAnnonce(req));
    res.status(204).end();
}));

export default router;
