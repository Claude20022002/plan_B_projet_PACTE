import dotenv from "dotenv";
import { DataTypes } from "sequelize";
import app from "./app.js";
import sequelize, { testConnection, cleanupOldTables } from "./config/db.js";
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
    Conflit,
    ConflitAffectation,
    PasswordResetToken,
    Evenement,
    AuthSession,
    Institution,
    InstitutionUser,
    Plan,
    Subscription,
    GenerationSession,
    PlanningSnapshot,
} from "./models/index.js";
import { getDefaultInstitution, TENANT_MODELS, ensureUserMembership } from "./utils/tenantHelper.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

/**
 * Ordre de synchronisation : tables sans dépendance d'abord, puis tables qui les référencent.
 * Aucune table n'est jamais supprimée automatiquement : une erreur de schéma arrête le démarrage
 * pour qu'un humain la traite (les migrations versionnées remplaceront ce bloc).
 */
const MODELS_IN_SYNC_ORDER = [
    Users,
    Institution,
    Plan,
    Filiere,
    Salle,
    Creneau,
    Enseignant,
    Etudiant,
    Notification,
    PasswordResetToken,
    Evenement,
    InstitutionUser,
    Subscription,
    AuthSession,
    GenerationSession,
    PlanningSnapshot,
    Groupe,
    Cours,
    Affectation,
    Disponibilite,
    Appartenir,
    DemandeReport,
    Conflit,
    ConflitAffectation,
];

const runIncrementalMigrations = async () => {
    // Migration incrémentale : ajout de la colonne lien si absente
    try {
        await sequelize.query(
            "ALTER TABLE Notifications ADD COLUMN IF NOT EXISTS lien VARCHAR(500) NULL DEFAULT NULL"
        );
    } catch (_) { /* colonne déjà présente ou MySQL < 8 — ignoré */ }

    try {
        const queryInterface = sequelize.getQueryInterface();
        const affectationColumns = await queryInterface.describeTable("Affectations");
        const missingColumns = {
            id_snapshot: { type: DataTypes.INTEGER, allowNull: true },
            id_generation_session: { type: DataTypes.INTEGER, allowNull: true },
            is_generated: { type: DataTypes.BOOLEAN, defaultValue: false },
            score_contrib: { type: DataTypes.FLOAT, allowNull: true },
        };
        for (const [column, definition] of Object.entries(missingColumns)) {
            if (!affectationColumns[column]) {
                await queryInterface.addColumn("Affectations", column, definition);
            }
        }
    } catch (error) {
        console.warn("Migration snapshots Affectations ignoree:", error.message);
    }

    try {
        const queryInterface = sequelize.getQueryInterface();
        const defaultInstitution = await getDefaultInstitution();

        for (const tableName of TENANT_MODELS) {
            const columns = await queryInterface.describeTable(tableName).catch(() => null);
            if (!columns) continue;

            if (!columns.id_institution) {
                await queryInterface.addColumn(tableName, "id_institution", {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                });
            }

            await sequelize.query(
                `UPDATE ${tableName} SET id_institution = :idInstitution WHERE id_institution IS NULL`,
                { replacements: { idInstitution: defaultInstitution.id_institution } }
            ).catch(() => null);
        }

        const users = await Users.findAll();
        for (const user of users) {
            await ensureUserMembership(user, defaultInstitution);
        }
    } catch (error) {
        console.warn("Migration multi-tenant ignoree:", error.message);
    }
};

/**
 * Seed automatique d'une base vide : uniquement en développement et sur demande explicite
 * (SEED_ON_EMPTY=true). En production, les comptes de démonstration ne doivent jamais exister.
 */
const seedIfRequested = async () => {
    if (isProduction || process.env.SEED_ON_EMPTY !== "true") return;

    const userCount = await Users.count();
    if (userCount > 0) {
        console.log(`✅ Données existantes (${userCount} utilisateurs), seed non nécessaire`);
        return;
    }

    console.log("🌱 Base vide et SEED_ON_EMPTY=true : exécution du seed de démonstration...");
    const seedModule = await import("./seed.js");
    await seedModule.default();
    console.log("✅ Seed exécuté avec succès !");
};

(async () => {
    try {
        const connected = await testConnection();
        if (!connected) {
            throw new Error("Connexion à la base de données impossible");
        }

        await cleanupOldTables();

        console.log("🔄 Synchronisation des tables...");
        for (const model of MODELS_IN_SYNC_ORDER) {
            await model.sync();
        }
        console.log("--> Toutes les tables synchronisées avec succès !");

        await seedIfRequested();
        await runIncrementalMigrations();

        app.listen(PORT, () => {
            console.log(`--> Serveur lancé sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("--> Erreur serveur :", error);
        process.exit(1);
    }
})();
