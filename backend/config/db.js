import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || "mysql",
        logging: false,
        define: {
            freezeTableName: true, // Désactive la pluralisation automatique par défaut
            underscored: false,
        },
    }
);

// Test de connexion (sera fait au démarrage du serveur)
export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Connexion à MySQL réussie !");
        return true;
    } catch (error) {
        console.error("❌ Erreur de connexion à MySQL :", error);
        return false;
    }
};

// Fonction pour nettoyer les anciennes tables avec mauvais noms
export const cleanupOldTables = async () => {
    try {
        console.log("🧹 Nettoyage des anciennes tables avec mauvais noms...");
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Liste des anciens noms de tables à supprimer (en minuscules et pluriels incorrects)
        const oldTableNames = [
            "creneaus", // Ancien pluriel incorrect
            "filieres", // Ancien pluriel
            "users", // Si existe en minuscule
            "enseignants", // Si existe en minuscule
            "etudiants", // Si existe en minuscule
            "notifications", // Si existe en minuscule
            "groupes", // Si existe en minuscule
            "salles", // Si existe en minuscule
            "cours", // Si existe en minuscule
            "affectations", // Si existe en minuscule
            "disponibilites", // Si existe en minuscule
            "demandereports", // Si existe en minuscule
            "conflits", // Si existe en minuscule
            "historiqueaffectations", // Si existe en minuscule
            "conflitaffectations", // Si existe en minuscule
            "appartenir", // Si existe en minuscule
        ];

        let cleanedCount = 0;
        for (const tableName of oldTableNames) {
            try {
                // Vérifier d'abord si la table existe
                const [tables] = await sequelize.query(
                    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' AND TABLE_NAME = '${tableName}'`
                );
                if (tables.length > 0) {
                    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
                    console.log(`  ✓ Table ${tableName} supprimée`);
                    cleanedCount++;
                }
            } catch (error) {
                // Ignorer les erreurs si la table n'existe pas
            }
        }

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        if (cleanedCount > 0) {
            console.log(`✅ Nettoyage terminé : ${cleanedCount} table(s) supprimée(s)`);
        } else {
            console.log("✅ Nettoyage terminé : aucune table incorrecte trouvée");
        }
    } catch (error) {
        console.error(
            "⚠️ Erreur lors du nettoyage des anciennes tables:",
            error.message
        );
    }
};

export { sequelize };
export default sequelize;
