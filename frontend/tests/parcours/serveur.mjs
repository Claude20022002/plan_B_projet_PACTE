/**
 * Serveur des parcours de démonstration (lot B-8), lancé par playwright.parcours.config.cjs :
 * prépare la base de test jetable, écrit les comptes créés dans .donnees.json (lu par les tests,
 * jamais versionné), puis démarre le serveur de Planner sur cette base.
 *
 * Variables (toutes facultatives) : PARCOURS_PORT_API (5001, port du groupe B), PARCOURS_PORT_SITE
 * (5174), PARCOURS_DB (hestim_b_parcours_test ; le nom doit finir par _test, sinon la
 * réinitialisation refuse de vider la base), et DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
 * (conteneur hestim_mysql_test par défaut, voir backend/tests/integration/setupEnv.js).
 * PARCOURS_PORT_QUIZ (5199) : le faux service de quiz (fauxServiceQuiz.mjs), avec un quiz de
 * l'enseignante, déposé ici et décrit dans .donnees.json. PARCOURS_PORT_IA (5198) : la fausse IA
 * (fausseIa.mjs), pour « Créer un quiz ».
 */
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { preparerDonnees } from "./donnees.mjs";
import { demarrerFauxServiceQuiz } from "./fauxServiceQuiz.mjs";
import { demarrerFausseIa } from "./fausseIa.mjs";
import { demarrerFausseBibliotheque } from "./fausseBibliotheque.mjs";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "../../..");
const portSite = process.env.PARCOURS_PORT_SITE || "5174";

process.env.DB_NAME = process.env.PARCOURS_DB || "hestim_b_parcours_test";
process.env.PORT = process.env.PARCOURS_PORT_API || "5001";
process.env.FRONTEND_URL = `http://localhost:${portSite}`;
process.env.ALLOWED_ORIGINS = `http://localhost:${portSite}`;
// Le service de quiz est remplacé par un faux, posé avant setupEnv.js qui viderait ces variables
const portQuiz = process.env.PARCOURS_PORT_QUIZ || "5199";
process.env.QUIZ_URL = `http://127.0.0.1:${portQuiz}`;
process.env.QUIZ_API_INTERNE = `http://127.0.0.1:${portQuiz}`;
process.env.QUIZ_WEBHOOK_SECRET = crypto.randomBytes(24).toString("hex");
// L'IA aussi : un faux fournisseur « compatible OpenAI »
const portIa = process.env.PARCOURS_PORT_IA || "5198";
process.env.IA_FOURNISSEUR = "openai-compatible";
process.env.IA_URL = `http://127.0.0.1:${portIa}/v1`;
process.env.IA_CLE = "cle-des-parcours";
process.env.IA_MODELE = "fausse-ia";
// La Bibliothèque (StudyLib) aussi, pour l'espace de cours (fausseBibliotheque.mjs)
const portBibliotheque = process.env.PARCOURS_PORT_BIBLIOTHEQUE || "5197";
process.env.STUDYLIB_API_URL = `http://127.0.0.1:${portBibliotheque}/api`;
// Tous les parcours viennent de 127.0.0.1 : la limite globale de l'API (500 requêtes en 15 min)
// ferait échouer les derniers quand la série est rapide (CI)
process.env.RATE_LIMIT_API_MAX = "20000";
await import(pathToFileURL(path.join(racine, "backend/tests/integration/setupEnv.js")).href);

// La base doit exister avant que le serveur s'y connecte
const mysql = (await import(pathToFileURL(path.join(racine, "backend/node_modules/mysql2/promise.js")).href)).default;
const connexion = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD });
await connexion.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4`);
await connexion.end();

const donnees = await preparerDonnees(racine);
const service = await demarrerFauxServiceQuiz(portQuiz, process.env.QUIZ_WEBHOOK_SECRET);
await demarrerFausseIa(portIa);
await demarrerFausseBibliotheque(portBibliotheque);
const idQuiz = crypto.randomUUID();
const qcm = (question, reponses, juste) => ({ question, time: "30", type: "ABCD", image: null, answers: reponses.map((answer, i) => ({ answer, right: i === juste, color: null })) });
service.quiz.set(idQuiz, {
  proprietaire: donnees.enseignante.email,
  titre: "Routage IP",
  description: "",
  questions: [qcm("Quel protocole route entre systèmes autonomes ?", ["BGP", "OSPF", "RIP"], 0), qcm("Port par défaut de HTTPS ?", ["80", "443"], 1)],
  modifie_le: new Date().toISOString(),
});
donnees.quiz = { id: idQuiz, titre: "Routage IP" };
writeFileSync(path.join(ici, ".donnees.json"), JSON.stringify(donnees, null, 2));

await import(pathToFileURL(path.join(racine, "backend/server.js")).href);
