import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize, { testConnection, cleanupOldTables } from "./config/db.js";
import "./models/index.js"; // Import pour initialiser les relations
import {
    Users,
    Filiere,
    Salle,
    Creneau,
    Enseignant,
    Etudiant,
    Notification,
    Groupe,
    Cours,
    Affectation,
    Disponibilite,
    Appartenir,
    DemandeReport,
    HistoriqueAffectation,
    Conflit,
    ConflitAffectation,
} from "./models/index.js";

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
import historiqueAffectationRoutes from "./routes/historiqueAffectationRoutes.js";
import disponibiliteRoutes from "./routes/disponibiliteRoutes.js";
import appartenirRoutes from "./routes/appartenirRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emploiDuTempsRoutes from "./routes/emploiDuTempsRoutes.js";
import statistiquesRoutes from "./routes/statistiquesRoutes.js";

// Import des middlewares
import {
    logger,
    errorLogger,
    securityHeaders,
    customSecurityHeaders,
    apiRateLimiter,
    errorHandler,
    notFound,
} from "./middleware/index.js";

dotenv.config();
const app = express();

// ==================== MIDDLEWARES GLOBAUX ====================

// Sécurité
app.use(securityHeaders);
app.use(customSecurityHeaders);

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use(apiRateLimiter);

// Logging
app.use(logger);

// ==================== ROUTES ====================

// Routes
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
app.use("/api/historiques", historiqueAffectationRoutes);
app.use("/api/disponibilites", disponibiliteRoutes);
app.use("/api/appartenances", appartenirRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/emplois-du-temps", emploiDuTempsRoutes);
app.use("/api/statistiques", statistiquesRoutes);

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

// ==================== DÉMARRAGE DU SERVEUR ====================

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        // Test de connexion à la base de données
        await testConnection();

        // Nettoyer les anciennes tables avec mauvais noms
        await cleanupOldTables();

        // Synchronisation des modèles dans l'ordre correct
        console.log("🔄 Synchronisation des tables...");

        // Option : Supprimer toutes les tables existantes pour recréer avec la bonne structure
        // Décommenter la ligne suivante si vous voulez forcer la recréation de toutes les tables
        // ATTENTION : Cela supprimera toutes les données !
        /*
        if (process.env.FORCE_RECREATE_TABLES === "true") {
            console.log("⚠️ Suppression de toutes les tables existantes...");
            await sequelize.drop({ cascade: true });
            console.log("🗑️ Anciennes tables supprimées");
        }
        */

        // Synchronisation séquentielle : créer les tables sans FK, puis Sequelize ajoutera les FK via les associations
        // Niveau 1 : Tables sans dépendances
        // Gestion spéciale : si erreur de trop d'index, supprimer toutes les tables et les recréer
        let tablesRecreated = false;
        
        // Fonction helper pour synchroniser avec gestion d'erreur
        // Utilise force: false pour éviter les problèmes de trop d'index
        const safeSync = async (model, modelName) => {
            try {
                // Utiliser force: false (créer si n'existe pas, ne pas modifier si existe)
                await model.sync({ force: false });
            } catch (error) {
                if (
                    error.name === "SequelizeDatabaseError" &&
                    error.parent?.code === "ER_TOO_MANY_KEYS"
                ) {
                    if (!tablesRecreated) {
                        console.log(
                            "⚠️ Trop d'index détecté, suppression de toutes les tables..."
                        );
                        console.log(
                            "⚠️ ATTENTION : Toutes les données seront supprimées !"
                        );
                        // Désactiver les vérifications de contraintes FK avant suppression
                        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
                        // Supprimer toutes les tables
                        await sequelize.drop({ cascade: true });
                        // Réactiver les vérifications de contraintes FK
                        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
                        console.log("🗑️ Toutes les tables supprimées");
                        console.log("🔄 Recréation de toutes les tables...");
                        tablesRecreated = true;
                    }
                    // Recréer la table sans alter
                    await model.sync({ force: false });
                    console.log(`✅ Table ${modelName} recréée`);
                } else {
                    throw error;
                }
            }
        };

        // Synchroniser Users en premier
        await safeSync(Users, "Users");
        
        // Fonction helper pour synchroniser avec gestion d'erreur ER_TOO_MANY_KEYS
        // Utilise force: false pour éviter les problèmes de trop d'index
        const syncTableSafe = async (model, modelName) => {
            try {
                // Essayer d'abord avec force: false (créer si n'existe pas, ne pas modifier si existe)
                await model.sync({ force: false });
            } catch (error) {
                // Si erreur de trop d'index, supprimer toutes les tables et les recréer
                if (error.parent?.code === "ER_TOO_MANY_KEYS") {
                    if (!tablesRecreated) {
                        console.log(
                            "⚠️ Trop d'index détecté, suppression de toutes les tables..."
                        );
                        console.log(
                            "⚠️ ATTENTION : Toutes les données seront supprimées !"
                        );
                        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
                        await sequelize.drop({ cascade: true });
                        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
                        console.log("🗑️ Toutes les tables supprimées");
                        console.log("🔄 Recréation de toutes les tables...");
                        tablesRecreated = true;
                    }
                    await model.sync({ force: false });
                    console.log(`✅ Table ${modelName} recréée`);
                } else {
                    throw error;
                }
            }
        };
        
        // Synchroniser les autres tables avec gestion d'erreur
        await syncTableSafe(Filiere, "Filiere");
        await syncTableSafe(Salle, "Salle");
        await syncTableSafe(Creneau, "Creneau");
        console.log("--> Niveau 1 : Tables de base synchronisées");

        // Niveau 2 : Tables qui dépendent de Users
        await syncTableSafe(Enseignant, "Enseignant");
        await syncTableSafe(Etudiant, "Etudiant");
        await syncTableSafe(Notification, "Notification");
        console.log("--> Niveau 2 : Tables dépendantes de Users synchronisées");

        // Niveau 3 : Tables qui dépendent de Filiere
        await syncTableSafe(Groupe, "Groupe");
        await syncTableSafe(Cours, "Cours");
        console.log(
            "--> Niveau 3 : Tables dépendantes de Filiere synchronisées"
        );

        // Niveau 4 : Tables qui dépendent de plusieurs tables
        await syncTableSafe(Affectation, "Affectation");
        await syncTableSafe(Disponibilite, "Disponibilite");
        await syncTableSafe(Appartenir, "Appartenir");
        console.log("--> Niveau 4 : Tables complexes synchronisées");

        // Niveau 5 : Tables qui dépendent d'Affectation
        await syncTableSafe(DemandeReport, "DemandeReport");
        await syncTableSafe(HistoriqueAffectation, "HistoriqueAffectation");
        console.log(
            "--> Niveau 5 : Tables dépendantes d'Affectation synchronisées"
        );

        // Niveau 6 : Tables de liaison
        await syncTableSafe(Conflit, "Conflit");
        await syncTableSafe(ConflitAffectation, "ConflitAffectation");
        console.log("--> Niveau 6 : Tables de liaison synchronisées");

        // Maintenant, Sequelize va ajouter les clés étrangères via les associations
        // en utilisant les noms de tables définis avec freezeTableName
        console.log("--> Toutes les tables synchronisées avec succès !");

        // Démarrage du serveur
        app.listen(PORT, () => {
            console.log(`--> Serveur lancé sur http://localhost:${PORT}`);
            //console.log(`--> Documentation API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("--> Erreur serveur :", error);
        process.exit(1);
    }
})();
