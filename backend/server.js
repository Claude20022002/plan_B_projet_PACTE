import dotenv from "dotenv";
import app from "./app.js";
import { testConnection } from "./config/db.js";
import { Users } from "./models/index.js";
import { runMigrations } from "./migrations/migrator.js";
import { marquerRealisees } from "./services/planning/suivi.js";
import { demarrerRenvoiQuotidien } from "./services/calendrier/envoiEdt.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

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

        // Le schéma ne change que par migrations versionnées (backend/migrations/) :
        // aucune table n'est créée, modifiée ou supprimée implicitement au démarrage.
        const applied = await runMigrations();
        console.log(applied.length ? `--> ${applied.length} migration(s) appliquée(s)` : "--> Schéma à jour");

        await seedIfRequested();

        app.listen(PORT, () => {
            console.log(`--> Serveur lancé sur http://localhost:${PORT}`);
        });

        // Séances confirmées et passées → réalisées (suivi du réalisé, phase P7) : au démarrage puis chaque heure
        const actualiserRealise = () =>
            marquerRealisees()
                .then((n) => n && console.log(`--> ${n} séance(s) marquée(s) réalisée(s)`))
                .catch((error) => console.error("--> Suivi du réalisé :", error.message));
        actualiserRealise();
        setInterval(actualiserRealise, 60 * 60 * 1000).unref();

        // Emploi du temps du mois (R4) : chaque soir, les mois publiés qui ont changé sont renvoyés aux classes
        demarrerRenvoiQuotidien();
    } catch (error) {
        console.error("--> Erreur serveur :", error);
        process.exit(1);
    }
})();
