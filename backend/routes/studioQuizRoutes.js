import express from "express";
import { authenticateToken, requireRole } from "../middleware/index.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { repondreErreur } from "../utils/erreurs.js";
import { contexteDe } from "../services/journalSecurite.js";
import { TAILLE_MAX, TYPES_SUPPORTS } from "../services/ia/extraction.js";
import * as banque from "../services/studio/questionnaires.js";
import * as medias from "../services/studio/medias.js";
import * as sessions from "../services/studio/sessions.js";
import * as ia from "../services/studio/iaGeneration.js";

/**
 * Studio quiz, côté enseignant (docs/plans/studio-quiz.md). Tout est réservé à l'auteur : un quiz,
 * un média, une passation ou une copie d'un collègue répond 404.
 *
 *  Banque       GET/POST /questionnaires · GET/PUT/DELETE /questionnaires/:id
 *               POST /questionnaires/:id/dupliquer · GET /questionnaires/:id/export · POST /import
 *  Questions    POST /questionnaires/:id/questions · PUT /questionnaires/:id/ordre
 *               PUT/DELETE /questions/:id · POST /questions/:id/relue · POST /questions/:id/dupliquer
 *  Médias       GET /medias · POST /medias (corps brut, ?nom=&description=&duree=) · GET/PUT/DELETE /medias/:id
 *               GET /medias/:id/contenu (Range accepté)
 *  IA           GET /ia · POST /ia/generations (corps brut facultatif : support PDF, DOCX, PPTX)
 *               POST /questions/:id/regenerer · POST /questions/:id/illustrer · POST /medias/voix
 *               POST /medias/:id/transcrire
 *  Passations   GET /sessions?id_questionnaire= · POST /questionnaires/:id/sessions · PUT/DELETE /sessions/:id
 *               GET /sessions/:id/resultats (.csv) · GET /copies/:id · PUT /copies/:id/questions/:idq/note
 */
const router = express.Router();
router.use(authenticateToken, requireRole("enseignant"));

const parEnseignant = (req) => (req.user ? `enseignant:${req.user.id_user}` : null);
const limiteIa = createRateLimiter({ nom: "studio-ia", persistant: true, windowMs: 15 * 60 * 1000, max: 30, keyGenerator: parEnseignant, message: "Trop de demandes à l'IA : réessayez dans quelques minutes." });
const limiteDepot = createRateLimiter({ nom: "studio-depot", persistant: true, windowMs: 60 * 60 * 1000, max: 60, keyGenerator: parEnseignant, message: "Trop de fichiers déposés : réessayez dans une heure." });

/** Corps brut limité ; au-delà, 413 avant toute lecture. */
const corpsBrut = (types, limite, libelle) => {
    const lire = express.raw({ type: types, limit: limite + 1024 });
    return (req, res, next) => lire(req, res, (err) => (err ? repondreErreur(res, err.status === 413 ? 413 : 400, err.status === 413 ? `${libelle} : ${Math.round(limite / 1024 / 1024)} Mo au plus` : "Fichier illisible") : next()));
};
const lireMedia = corpsBrut(medias.TYPES_MEDIAS_ACCEPTES, medias.TAILLE_MAX_DEPOT, "Média");
const lireSupport = corpsBrut(TYPES_SUPPORTS, TAILLE_MAX, "Support");
const fichierDe = (req) => ({ contenu: Buffer.isBuffer(req.body) ? req.body : null, type: req.get("Content-Type"), nom: req.query.nom });

const route = (fn, statut = 200) => planification(async (req, res) => res.status(statut).json(await fn(req)));
const sansContenu = (fn) => planification(async (req, res) => {
    await fn(req);
    res.status(204).end();
});

// ── Banque ──
router.get("/questionnaires", route((req) => banque.listerQuestionnaires(req.user, req.query)));
router.post("/questionnaires", route((req) => banque.creerQuestionnaire(req.user, req.body), 201));
router.post("/import", route((req) => banque.importerQuestionnaire(req.user, req.body), 201));
router.get("/questionnaires/:id", route((req) => banque.detailQuestionnaire(req.user, req.params.id)));
router.put("/questionnaires/:id", route((req) => banque.modifierQuestionnaire(req.user, req.params.id, req.body)));
router.delete("/questionnaires/:id", sansContenu((req) => banque.supprimerQuestionnaire(req.user, req.params.id)));
router.post("/questionnaires/:id/dupliquer", route((req) => banque.dupliquerQuestionnaire(req.user, req.params.id), 201));
router.get(
    "/questionnaires/:id/export",
    planification(async (req, res) => {
        const donnees = await banque.exporterQuestionnaire(req.user, req.params.id);
        res.setHeader("Content-Disposition", `attachment; filename="quiz-${Number(req.params.id)}.json"`);
        res.json(donnees);
    })
);

// ── Questions ──
router.post("/questionnaires/:id/questions", route((req) => banque.ajouterQuestion(req.user, req.params.id, req.body), 201));
router.put("/questionnaires/:id/ordre", route((req) => banque.reordonnerQuestions(req.user, req.params.id, req.body?.ids)));
router.put("/questions/:id", route((req) => banque.modifierQuestion(req.user, req.params.id, req.body)));
router.delete("/questions/:id", sansContenu((req) => banque.supprimerQuestion(req.user, req.params.id)));
router.post("/questions/:id/relue", route((req) => banque.marquerRelue(req.user, req.params.id)));
router.post("/questions/:id/dupliquer", route((req) => banque.dupliquerQuestion(req.user, req.params.id), 201));

// ── Médias ──
router.get("/medias", route((req) => medias.listerMedias(req.user, req.query)));
router.post("/medias/voix", limiteIa, route((req) => ia.creerVoix(req.user, req.body, contexteDe(req)), 201));
router.post("/medias", limiteDepot, lireMedia, route((req) => medias.enregistrerMedia(req.user, { ...fichierDe(req), description: req.query.description, duree: req.query.duree }), 201));
router.get("/medias/:id", route((req) => medias.detailMedia(req.user, req.params.id)));
router.put("/medias/:id", route((req) => medias.modifierMedia(req.user, req.params.id, req.body)));
router.delete("/medias/:id", sansContenu((req) => medias.supprimerMedia(req.user, req.params.id)));
router.get("/medias/:id/contenu", planification(async (req, res) => medias.diffuserMedia(req, res, await medias.mediaDe(req.user, req.params.id, { contenu: true }))));
router.post("/medias/:id/transcrire", limiteIa, route((req) => ia.transcrireMedia(req.user, req.params.id, req.body, contexteDe(req))));

// ── IA ──
router.get("/ia", route((req) => ia.disponibiliteIa(req.user)));
router.post(
    "/ia/generations",
    limiteIa,
    lireSupport,
    route(
        (req) =>
            ia.lancerGenerationStudio(
                req.user,
                {
                    id_questionnaire: req.query.id_questionnaire,
                    titre: req.query.titre,
                    etiquettes: req.query.etiquettes ? String(req.query.etiquettes).split(",") : undefined,
                    reglages: { nombre: req.query.nombre === undefined ? undefined : Number(req.query.nombre), difficulte: req.query.difficulte, langue: req.query.langue, types: req.query.types },
                    fichier: fichierDe(req),
                    plage: req.query.plage,
                    id_media: req.query.id_media,
                    sujet: req.query.sujet,
                    ecoute: req.query.ecoute,
                },
                contexteDe(req)
            ),
        202
    )
);
router.post("/questions/:id/regenerer", limiteIa, route((req) => ia.regenererQuestion(req.user, req.params.id, contexteDe(req))));
router.post("/questions/:id/illustrer", limiteIa, route((req) => ia.illustrerQuestion(req.user, req.params.id, req.body, contexteDe(req))));

// ── Passations ──
router.get("/sessions", route((req) => sessions.listerSessions(req.user, req.query)));
router.post("/questionnaires/:id/sessions", route((req) => sessions.ouvrirSession(req.user, req.params.id, req.body), 201));
router.put("/sessions/:id", route((req) => sessions.modifierSession(req.user, req.params.id, req.body)));
router.delete("/sessions/:id", sansContenu((req) => sessions.supprimerSession(req.user, req.params.id)));
router.get("/sessions/:id/resultats", route((req) => sessions.resultatsSession(req.user, req.params.id)));
router.get(
    "/sessions/:id/resultats.csv",
    planification(async (req, res) => {
        const { nom, contenu } = await sessions.resultatsCsv(req.user, req.params.id);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${nom}"`);
        res.send(contenu);
    })
);
router.get("/copies/:id", route((req) => sessions.detailCopie(req.user, req.params.id)));
router.put("/copies/:id/questions/:idq/note", route((req) => sessions.noterCopieAMain(req.user, req.params.id, req.params.idq, req.body)));

export default router;
