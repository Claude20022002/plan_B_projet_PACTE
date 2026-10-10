import dotenv from "dotenv";
import app from "./app.js";
import { testConnection } from "./config/db.js";
import { Users } from "./models/index.js";
import { runMigrations } from "./migrations/migrator.js";
import { marquerRealisees } from "./services/planning/suivi.js";
import { purgerJournal } from "./services/journalSecurite.js";
import { purgerCompteursDebit } from "./middleware/rateLimiterMiddleware.js";
import { purgerGenerations } from "./services/ia/quiz.js";
import { demarrerRenvoiQuotidien } from "./services/calendrier/envoiEdt.js";
import { demarrerRappelsAppel } from "./services/presences/rappelAppel.js";

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

        // Séances planifiées ou confirmées, une fois passées → réalisées (suivi du réalisé, phase P7) : au démarrage puis chaque heure
        const actualiserRealise = () =>
            marquerRealisees()
                .then((n) => n && console.log(`--> ${n} séance(s) marquée(s) réalisée(s)`))
                .catch((error) => console.error("--> Suivi du réalisé :", error.message));
        actualiserRealise();
        setInterval(actualiserRealise, 60 * 60 * 1000).unref();

        // Journal de sécurité (au-delà de la durée de conservation) et compteurs des limiteurs de
        // connexion (fenêtres terminées) : au démarrage puis chaque jour
        const purgerSecurite = () => {
            purgerJournal()
                .then((n) => n && console.log(`--> Journal de sécurité : ${n} événement(s) ancien(s) supprimé(s)`))
                .catch((error) => console.error("--> Journal de sécurité :", error.message));
            purgerCompteursDebit().catch((error) => console.error("--> Limiteurs de débit :", error.message));
            // Quiz par IA : générations interrompues, brouillons et supports de plus de 30 jours
            purgerGenerations().catch((error) => console.error("--> Quiz par IA :", error.message));
        };
        purgerSecurite();
        setInterval(purgerSecurite, 24 * 60 * 60 * 1000).unref();

        // Emploi du temps du mois (R4) : chaque soir, les mois publiés qui ont changé sont renvoyés aux classes
        demarrerRenvoiQuotidien();

        // Appel : rappel à l'enseignant quelques minutes avant la fin d'une séance sans appel terminé
        demarrerRappelsAppel();
    } catch (error) {
        console.error("--> Erreur serveur :", error);
        process.exit(1);
    }
})();
