/**
 * Serveur des parcours de démonstration (lot B-8), lancé par playwright.parcours.config.cjs :
 * prépare la base de test jetable, écrit les comptes créés dans .donnees.json (lu par les tests,
 * jamais versionné), puis démarre le serveur de Planner sur cette base.
 *
 * Variables (toutes facultatives) : PARCOURS_PORT_API (5001, port du groupe B), PARCOURS_PORT_SITE
 * (5174), PARCOURS_DB (hestim_b_parcours_test ; le nom doit finir par _test, sinon la
 * réinitialisation refuse de vider la base), et DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
 * (conteneur hestim_mysql_test par défaut, voir backend/tests/integration/setupEnv.js).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { preparerDonnees } from "./donnees.mjs";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "../../..");
const portSite = process.env.PARCOURS_PORT_SITE || "5174";

process.env.DB_NAME = process.env.PARCOURS_DB || "hestim_b_parcours_test";
process.env.PORT = process.env.PARCOURS_PORT_API || "5001";
process.env.FRONTEND_URL = `http://localhost:${portSite}`;
process.env.ALLOWED_ORIGINS = `http://localhost:${portSite}`;
await import(pathToFileURL(path.join(racine, "backend/tests/integration/setupEnv.js")).href);

// La base doit exister avant que le serveur s'y connecte
const mysql = (await import(pathToFileURL(path.join(racine, "backend/node_modules/mysql2/promise.js")).href)).default;
const connexion = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD });
await connexion.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4`);
await connexion.end();

const donnees = await preparerDonnees(racine);
writeFileSync(path.join(ici, ".donnees.json"), JSON.stringify(donnees, null, 2));

await import(pathToFileURL(path.join(racine, "backend/server.js")).href);
