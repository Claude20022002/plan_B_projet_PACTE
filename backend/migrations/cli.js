import sequelize from "../config/db.js";
import { migrator } from "./migrator.js";

/**
 * npm run migrate            -> applique les migrations en attente
 * npm run migrate -- pending -> liste les migrations en attente
 * npm run migrate -- executed
 */
const command = process.argv[2] || "up";

try {
    if (command === "up") {
        const applied = await migrator.up();
        console.log(applied.length ? `${applied.length} migration(s) appliquée(s)` : "Base déjà à jour");
    } else if (command === "pending" || command === "executed") {
        const list = await migrator[command]();
        console.log(list.map((m) => m.name).join("\n") || "(aucune)");
    } else {
        throw new Error(`Commande inconnue : ${command} (up | pending | executed)`);
    }
} catch (error) {
    console.error("Échec des migrations :", error.message);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}
