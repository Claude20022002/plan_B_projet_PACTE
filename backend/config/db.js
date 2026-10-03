import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
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

export { sequelize };
export default sequelize;
