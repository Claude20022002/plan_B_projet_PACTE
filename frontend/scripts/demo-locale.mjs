/**
 * Démonstration locale sur des données réalistes (retours du 21 octobre, lot R-0) :
 * `npm run demo` (dans frontend/). Les données des parcours (filière « Génération », séance
 * 00:05–23:55) servent aux tests, pas aux démonstrations.
 *
 * 1. Crée la base de démonstration et lance le serveur, qui applique les migrations et le jeu de
 *    données de backend/seed.js (filières, salles, enseignants, étudiants, services) ;
 * 2. lance le vrai solveur (image hestim-solver:parcours) et, si la base n'a pas encore de séance,
 *    génère le S1 de toutes les filières, comme le ferait l'administration ;
 * 3. lance le site, puis affiche l'adresse et les comptes.
 * La double authentification de l'administration est coupée ici seulement (MFA_ADMINS_OBLIGATOIRE).
 *
 * Variables (facultatives) : DEMO_DB_PORT (3311, conteneur hestim_mysql_test_cours), DEMO_DB
 * (hestim_demo), DB_USER et DB_PASSWORD (ceux des conteneurs de test), DEMO_PORT_API (5091),
 * DEMO_PORT_SITE (5194), DEMO_PORT_SOLVEUR (8091). `--neuf` repart d'une base vide.
 * Ctrl+C arrête le serveur, le site et le solveur.
 */
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "../..");
const portApi = process.env.DEMO_PORT_API || "5091";
const portSite = process.env.DEMO_PORT_SITE || "5194";
const portSolveur = process.env.DEMO_PORT_SOLVEUR || "8091";
const base = process.env.DEMO_DB || "hestim_demo";
const conteneurSolveur = "hestim-solveur-demo";
const jetonSolveur = crypto.randomBytes(24).toString("hex");
const API = `http://127.0.0.1:${portApi}/api`;
// Le mot de passe des comptes de backend/seed.js (données fictives, jamais en production)
const MOT_DE_PASSE = "password123";

const env = {
  ...process.env,
  NODE_ENV: "development",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: process.env.DEMO_DB_PORT || "3311",
  DB_NAME: base,
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "test_root",
  DB_DIALECT: "mysql",
  PORT: portApi,
  JWT_SECRET: crypto.randomBytes(32).toString("hex"),
  JWT_ACCESS_SECRET: crypto.randomBytes(32).toString("hex"),
  CSRF_SECRET: crypto.randomBytes(32).toString("hex"),
  FRONTEND_URL: `http://localhost:${portSite}`,
  ALLOWED_ORIGINS: `http://localhost:${portSite}`,
  SEED_ON_EMPTY: "true",
  MFA_ADMINS_OBLIGATOIRE: "false",
  MOTS_DE_PASSE_FUITES: "false",
  SOLVER_URL: `http://127.0.0.1:${portSolveur}`,
  SOLVER_TOKEN: jetonSolveur,
  // Aucun e-mail ni service externe depuis une démonstration
  SMTP_USER: "",
  EMAIL_USER: "",
  QUIZ_URL: "",
  INTEGRATION_TOKEN: "",
};

const enfants = [];
const arreter = () => {
  for (const enfant of enfants) enfant.kill();
  try {
    execFileSync("docker", ["rm", "-f", conteneurSolveur], { stdio: "ignore" });
  } catch {
    // Solveur déjà arrêté
  }
  process.exit(0);
};
process.on("SIGINT", arreter);
process.on("SIGTERM", arreter);

const attendre = async (url, nom, secondes = 180) => {
  for (let i = 0; i < secondes; i += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${nom} ne répond pas sur ${url}`);
};

/** Requête à l'API avec le jeton de l'administration (connexion « mobile », sans cookie). */
const appeler = async (jeton, chemin, options = {}) => {
  const reponse = await fetch(`${API}${chemin}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Client": "mobile", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
  });
  const corps = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(`${chemin} : ${reponse.status} ${corps.message ?? ""}`);
  return corps;
};

// 1. La base, vide ou conservée
const mysql = (await import(pathToFileURL(path.join(racine, "backend/node_modules/mysql2/promise.js")).href)).default;
const connexion = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD });
if (process.argv.includes("--neuf")) await connexion.query(`DROP DATABASE IF EXISTS \`${base}\``);
await connexion.query(`CREATE DATABASE IF NOT EXISTS \`${base}\` CHARACTER SET utf8mb4`);

// 2. Le solveur, puis le serveur (migrations et jeu de données au premier lancement)
try {
  execFileSync("docker", ["rm", "-f", conteneurSolveur], { stdio: "ignore" });
} catch {
  // Aucun conteneur resté d'un lancement précédent
}
enfants.push(spawn("docker", ["run", "--rm", "--name", conteneurSolveur, "-p", `${portSolveur}:8080`, "-e", `SOLVER_TOKEN=${jetonSolveur}`, "hestim-solver:parcours"], { stdio: "ignore" }));
console.log("Serveur : migrations et jeu de données (une minute au premier lancement)…");
enfants.push(spawn(process.execPath, ["server.js"], { cwd: path.join(racine, "backend"), env, stdio: ["ignore", "ignore", "inherit"] }));
await attendre(`http://127.0.0.1:${portApi}/health`, "Le serveur", 600);
await attendre(`http://127.0.0.1:${portSolveur}/health`, "Le solveur");

// 3. Une génération du S1 si la base n'a encore aucune séance
await connexion.changeUser({ database: base });
const [[{ seances }]] = await connexion.query("SELECT COUNT(*) AS seances FROM Affectations");
if (seances === 0) {
  const { access_token: jeton } = await appeler(null, "/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@hestim.ma", password: MOT_DE_PASSE }) });
  const annees = await appeler(jeton, "/calendrier/annees");
  const periode = annees.filter((a) => a.active).flatMap((a) => a.periodes).find((p) => p.code === "S1");
  console.log(`Génération du ${periode.code} de toutes les filières (une à deux minutes)…`);
  const { session } = await appeler(jeton, "/generation-automatique/generer", { method: "POST", body: JSON.stringify({ id_periode: periode.id_periode, duree_secondes: 60 }) });
  let suivi = session;
  while (suivi.status === "running") {
    await new Promise((r) => setTimeout(r, 3000));
    suivi = await appeler(jeton, `/generation-automatique/sessions/${session.id_generation_session}`);
  }
  console.log(`Génération : ${suivi.last_message}`);
}

// 4. Le site
enfants.push(
  spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "--port", portSite, "--strictPort"], {
    cwd: path.join(racine, "frontend"),
    env: { ...process.env, VITE_PROXY_TARGET: `http://localhost:${portApi}`, VITE_API_URL: "/api" },
    stdio: "ignore",
    shell: process.platform === "win32",
  })
);
await attendre(`http://localhost:${portSite}`, "Le site");

// Des comptes qui ont des séances, pour que chaque rôle voie un emploi du temps rempli
const [[enseignant]] = await connexion.query("SELECT u.email FROM Users u JOIN Affectations a ON a.id_user_enseignant = u.id_user GROUP BY u.id_user ORDER BY COUNT(*) DESC LIMIT 1");
const [[responsable]] = await connexion.query("SELECT u.email, f.code_filiere FROM ResponsablesFilieres r JOIN Users u ON u.id_user = r.id_user JOIN Filiere f ON f.id_filiere = r.id_filiere ORDER BY f.code_filiere = 'IIIA' DESC LIMIT 1");
const [[etudiant]] = await connexion.query("SELECT u.email FROM Users u JOIN Appartenir ap ON ap.id_user_etudiant = u.id_user JOIN Affectations a ON a.id_groupe = ap.id_groupe GROUP BY u.id_user ORDER BY COUNT(*) DESC LIMIT 1");
await connexion.end();

console.log(`
Démonstration prête : http://localhost:${portSite}   (mot de passe de tous les comptes : ${MOT_DE_PASSE})
  Administration      admin@hestim.ma
  Enseignant          ${enseignant?.email ?? "—"}
  Responsable ${String(responsable?.code_filiere ?? "").padEnd(8)}${responsable?.email ?? "—"}
  Étudiant            ${etudiant?.email ?? "—"}
Ctrl+C pour tout arrêter.`);
