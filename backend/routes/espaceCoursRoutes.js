import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { contexteDe } from "../services/journalSecurite.js";
import { creerSection, lireEspace, modifierSection, ordonnerSections, supprimerSection } from "../services/cours/sections.js";
import { ajouterLien, chercherBibliotheque, deposerFichier, epinglerDocument, mesCours, modifierSupport, ouvrirSupport, publierSupport, retirerSupport } from "../services/cours/supports.js";
import { jetonDe } from "../services/cours/studylib.js";
import { appelsDeLaClasse, elevesDeLaClasse, exporterPresences } from "../services/presences/historique.js";

/**
 * Espace de cours d'une classe (docs/plans/espace-de-cours.md, § 7). Une classe est désignée par
 * son module et son groupe ; les droits sont vérifiés dans services/cours/droits.js. Les fichiers
 * vont dans StudyLib : le dépôt est transmis en flux, sans être lu ici (pas de lecteur de corps
 * multipart dans Planner).
 */
const router = express.Router();

// 30 dépôts par heure et par enseignant (StudyLib a aussi sa limite)
const limiteDepots = createRateLimiter({
    nom: "depots-cours",
    persistant: true,
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.user?.id_user ?? null,
    message: "Trop de dépôts en une heure : réessayez plus tard.",
});

const classe = (req) => ({ idCours: req.params.idCours, idGroupe: req.params.idGroupe, jeton: jetonDe(req) });
const section = (req) => ({ idSection: req.params.id, jeton: jetonDe(req) });

// ── Espace d'une classe ────────────────────────────────────────────────
router.get("/classes/:idCours/:idGroupe/supports", authenticateToken, planification(async (req, res) => {
    res.json(await lireEspace(req.user, req.params.idCours, req.params.idGroupe));
}));
router.post("/classes/:idCours/:idGroupe/sections", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await creerSection(req.user, req.params.idCours, req.params.idGroupe, req.body));
}));
router.put("/classes/:idCours/:idGroupe/sections/ordre", authenticateToken, planification(async (req, res) => {
    await ordonnerSections(req.user, req.params.idCours, req.params.idGroupe, req.body?.ids);
    res.status(204).end();
}));
// Ajouts sans section choisie : dans « Général »
router.post("/classes/:idCours/:idGroupe/fichiers", authenticateToken, limiteDepots, planification(async (req, res) => {
    res.status(201).json(await deposerFichier(req, classe(req)));
}));
router.post("/classes/:idCours/:idGroupe/liens", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await ajouterLien(req.user, classe(req), req.body));
}));
// Recherche des documents de la Bibliothèque à épingler (lot E-9)
router.get("/classes/:idCours/:idGroupe/bibliotheque", authenticateToken, planification(async (req, res) => {
    res.json(await chercherBibliotheque(req.user, classe(req), req.query.q));
}));
router.post("/classes/:idCours/:idGroupe/bibliotheque", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await epinglerDocument(req.user, classe(req), req.body));
}));

// ── Appel de la classe (lot E-6) ───────────────────────────────────────
router.get("/classes/:idCours/:idGroupe/appels", authenticateToken, planification(async (req, res) => {
    res.json(await appelsDeLaClasse(req.user, req.params.idCours, req.params.idGroupe));
}));
router.get("/classes/:idCours/:idGroupe/eleves", authenticateToken, planification(async (req, res) => {
    res.json(await elevesDeLaClasse(req.user, req.params.idCours, req.params.idGroupe));
}));
router.get("/classes/:idCours/:idGroupe/presences.csv", authenticateToken, planification(async (req, res) => {
    const { nom, contenu } = await exporterPresences(req.user, req.params.idCours, req.params.idGroupe, contexteDe(req));
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nom}"`, "Cache-Control": "no-store" }).send(contenu);
}));

// ── Sections ───────────────────────────────────────────────────────────
router.put("/sections-cours/:id", authenticateToken, planification(async (req, res) => {
    res.json(await modifierSection(req.user, req.params.id, req.body));
}));
router.delete("/sections-cours/:id", authenticateToken, planification(async (req, res) => {
    await supprimerSection(req.user, req.params.id);
    res.status(204).end();
}));
router.post("/sections-cours/:id/fichiers", authenticateToken, limiteDepots, planification(async (req, res) => {
    res.status(201).json(await deposerFichier(req, section(req)));
}));
router.post("/sections-cours/:id/liens", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await ajouterLien(req.user, section(req), req.body));
}));
router.post("/sections-cours/:id/bibliotheque", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await epinglerDocument(req.user, section(req), req.body));
}));

// ── Supports ───────────────────────────────────────────────────────────
router.put("/supports-cours/:id", authenticateToken, planification(async (req, res) => {
    res.json(await modifierSupport(req.user, req.params.id, req.body));
}));
router.delete("/supports-cours/:id", authenticateToken, planification(async (req, res) => {
    await retirerSupport(req.user, jetonDe(req), req.params.id, contexteDe(req));
    res.status(204).end();
}));
router.post("/supports-cours/:id/publier", authenticateToken, planification(async (req, res) => {
    res.json(await publierSupport(req.user, jetonDe(req), req.params.id, contexteDe(req)));
}));
// Le site ouvre l'adresse rendue ; l'application aussi (pas de redirection : le lien signé expire vite)
router.get("/supports-cours/:id/ouvrir", authenticateToken, planification(async (req, res) => {
    res.set("Cache-Control", "no-store").json({ url: await ouvrirSupport(req.user, req.params.id) });
}));

// ── Étudiant ───────────────────────────────────────────────────────────
router.get("/etudiant/cours", authenticateToken, planification(async (req, res) => {
    res.json(await mesCours(req.user));
}));

export default router;
