import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Umzug, SequelizeStorage } from "umzug";
import sequelize from "../config/db.js";

const migrationsDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migrations versionnées du schéma (seule source de vérité de la base).
 * Fichiers : migrations/NNNN-nom.js, exportant up({ context }) et down({ context }) ;
 * context = { queryInterface, sequelize }. Historique dans la table SequelizeMeta.
 */
export const migrator = new Umzug({
    migrations: {
        glob: ["[0-9][0-9][0-9][0-9]-*.js", { cwd: migrationsDir }],
        resolve: ({ name, path: filePath, context }) => ({
            name,
            up: async () => (await import(pathToFileURL(filePath).href)).up(context),
            down: async () => (await import(pathToFileURL(filePath).href)).down(context),
        }),
    },
    context: { queryInterface: sequelize.getQueryInterface(), sequelize },
    storage: new SequelizeStorage({ sequelize }),
    logger: process.env.NODE_ENV === "test" ? undefined : console,
});

/** Applique toutes les migrations en attente (idempotent). */
export const runMigrations = () => migrator.up();
