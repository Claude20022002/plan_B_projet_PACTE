import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import "./models/index.js"; // Import pour initialiser les relations
import { parseCookies } from "./middleware/cookieMiddleware.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";
import { exigerChangementMotDePasse } from "./middleware/passwordChangeMiddleware.js";

// Import des routes
import userRoutes from "./routes/userRoutes.js";
import enseignantRoutes from "./routes/enseignantRoutes.js";
import etudiantRoutes from "./routes/etudiantRoutes.js";
import filiereRoutes from "./routes/filiereRoutes.js";
import groupeRoutes from "./routes/groupeRoutes.js";
import salleRoutes from "./routes/salleRoutes.js";
import coursRoutes from "./routes/coursRoutes.js";
import creneauRoutes from "./routes/creneauRoutes.js";
import affectationRoutes from "./routes/affectationRoutes.js";
import demandeReportRoutes from "./routes/demandeReportRoutes.js";
import conflitRoutes from "./routes/conflitRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
// historiqueAffectationRoutes désactivé — fonctionnalité non utilisée par le frontend
import disponibiliteRoutes from "./routes/disponibiliteRoutes.js";
import appartenirRoutes from "./routes/appartenirRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emploiDuTempsRoutes from "./routes/emploiDuTempsRoutes.js";
import statistiquesRoutes from "./routes/statistiquesRoutes.js";
import generationAutomatiqueRoutes from "./routes/generationAutomatiqueRoutes.js";
import campusRoutes from "./routes/campusRoutes.js";
import calendrierRoutes from "./routes/calendrierRoutes.js";
import evenementRoutes from "./routes/evenementRoutes.js";
import parametrePlanningRoutes from "./routes/parametrePlanningRoutes.js";
import composanteRoutes from "./routes/composanteRoutes.js";
import enseignementRoutes from "./routes/enseignementRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import examenRoutes from "./routes/examenRoutes.js";
import imprevuRoutes from "./routes/imprevuRoutes.js";
import suiviRoutes from "./routes/suiviRoutes.js";
import preparationRoutes from "./routes/preparationRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import pushTokenRoutes from "./routes/pushTokenRoutes.js";
import oidcRoutes from "./routes/oidcRoutes.js";
import quizRoutes, { webhookQuiz } from "./routes/quizRoutes.js";
import jeuxRoutes from "./routes/jeuxRoutes.js";
import annonceRoutes from "./routes/annonceRoutes.js";
import agendaRoutes from "./routes/agendaRoutes.js";
import presenceRoutes from "./routes/presenceRoutes.js";
import devoirRoutes from "./routes/devoirRoutes.js";
import { MONTAGE as OIDC_MONTAGE } from "./services/oidc/provider.js";

// Import des middlewares
import {
    logger,
    errorLogger,
    securityHeaders,
    customSecurityHeaders,
    apiRateLimiter,
    errorHandler,
    notFound,
    optionalAuth,
} from "./middleware/index.js";

dotenv.config();

/**
 * Application Express sans démarrage du serveur ni accès à la base au chargement.
 * Le démarrage (connexion DB, synchronisation, listen) est fait par server.js ;
 * les tests d'intégration importent directement cette app.
 */
const app = express();

// Derrière nginx : l'IP réelle du client est dans X-Forwarded-For.
// Indispensable pour que le rate limiting ne traite pas toute l'école comme une seule IP.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

// ==================== MIDDLEWARES GLOBAUX ====================

// Sécurité
app.use(securityHeaders);
app.use(customSecurityHeaders);

// CORS — restreindre aux origines connues (frontend dev + prod via ALLOWED_ORIGINS)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
    cors({
        // Origine inconnue : pas d'en-têtes CORS (le navigateur bloque la lecture) plutôt
        // qu'une erreur 500 ; les écritures sont de plus refusées par la protection CSRF.
        origin: (origin, callback) => {
            callback(null, !origin || allowedOrigins.includes(origin));
        },
        credentials: true,
    })
);

// Fournisseur OpenID Connect (ClassQuiz) : avant les lecteurs de corps, qu'oidc-provider gère
// lui-même ; hors CSRF (le client s'authentifie par son secret sur /token)
app.use(OIDC_MONTAGE, apiRateLimiter, oidcRoutes);
// Webhook signé de ClassQuiz (« partie démarrée ») : corps brut pour vérifier la signature HMAC
app.use("/api/quiz/webhook", apiRateLimiter, webhookQuiz);

// Body parser - Augmenter la limite pour permettre l'upload d'images en base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(parseCookies);

// Rate limiting global
app.use(apiRateLimiter);
app.use(optionalAuth);

// Logging
app.use(logger);

// ==================== ROUTES ====================

// Protection CSRF (cookie-to-header) sur toutes les méthodes modifiantes ;
// les routes d'authentification publiques sont exemptées dans le middleware.
app.use(csrfProtection);

// Mot de passe provisoire ou invitation : rien d'autre tant qu'il n'est pas changé
app.use(exigerChangementMotDePasse);

app.use("/api/auth", authRoutes);
// JWKS (public) et référentiel pour StudyLib (jeton de service) : connexion unique, phase C
app.use("/api", integrationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/enseignants", enseignantRoutes);
app.use("/api/etudiants", etudiantRoutes);
app.use("/api/filieres", filiereRoutes);
app.use("/api/groupes", groupeRoutes);
app.use("/api/salles", salleRoutes);
app.use("/api/cours", coursRoutes);
app.use("/api/creneaux", creneauRoutes);
app.use("/api/affectations", affectationRoutes);
app.use("/api/demandes-report", demandeReportRoutes);
app.use("/api/conflits", conflitRoutes);
app.use("/api/notifications", notificationRoutes);
// /api/historiques désactivé — HistoriqueAffectation non utilisé côté frontend
app.use("/api/disponibilites", disponibiliteRoutes);
app.use("/api/appartenances", appartenirRoutes);
app.use("/api/emplois-du-temps", emploiDuTempsRoutes);
app.use("/api/statistiques", statistiquesRoutes);
app.use("/api/generation-automatique", generationAutomatiqueRoutes);
app.use("/api/campus", campusRoutes);
app.use("/api/calendrier", calendrierRoutes);
app.use("/api/evenements", evenementRoutes);
app.use("/api/parametres-planning", parametrePlanningRoutes);
app.use("/api/composantes", composanteRoutes);
app.use("/api/enseignements", enseignementRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/examens", examenRoutes);
app.use("/api/imprevus", imprevuRoutes);
app.use("/api/suivi", suiviRoutes);
app.use("/api/preparation", preparationRoutes);
app.use("/api/push-tokens", pushTokenRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/jeux", jeuxRoutes);
app.use("/api/annonces", annonceRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/presences", presenceRoutes);
app.use("/api/devoirs", devoirRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "HESTIM Planner Backend 🚀",
        version: "1.0.0",
        status: "running",
    });
});

// Route de santé (health check)
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ==================== GESTION DES ERREURS ====================

// Route non trouvée (404)
app.use(notFound);

// Logger d'erreurs
app.use(errorLogger);

// Gestionnaire d'erreurs global
app.use(errorHandler);

export default app;
