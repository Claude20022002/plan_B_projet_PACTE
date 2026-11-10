/**
 * Serveur de banc PLA-06 (plan, § 4.1 ; étape 4), dans le conteneur du banc. Il sert l'application
 * réelle (backend/app.js, rien n'y est changé) à N écoles, une base chacune, choisies par le nom
 * d'hôte (ecole-001.banc …), avec les tâches périodiques sur toutes les écoles.
 * Variables : MESURE_ECOLES (200), MESURE_MODE (a : toutes chargées avant d'écouter, M4a ;
 * b : chacune à sa première requête, M4b), MESURE_TACHES (oui/non), MESURE_INACTIVITE_MS (600000).
 * Routes du banc, hors de l'application : /banc/sante, /banc/memoire, /banc/taches,
 * /banc/base et /banc/etudiants (dans le contexte de l'école de l'en-tête Host).
 */
import { generateKeyPairSync } from "node:crypto";
import http from "node:http";
import { NB_ECOLES, PORT_BANC, lireSecrets, motDePasseEcole, nomEcole, numeroDeHote } from "./lib/config.mjs";

const debutProcessus = Date.now();
const secrets = lireSecrets();
const N = Number(process.env.MESURE_ECOLES || NB_ECOLES);
const MODE = process.env.MESURE_MODE === "b" ? "b" : "a";
const TACHES = process.env.MESURE_TACHES !== "non";
const INACTIVITE_MS = Number(process.env.MESURE_INACTIVITE_MS || 10 * 60 * 1000);
const journal = (m) => console.log(`[banc ${new Date().toISOString().slice(11, 19)}] ${m}`);

// Environnement du serveur AVANT d'importer l'application (config/db.js et utils/jetons.js le lisent
// au chargement). L'école 001 est l'école par défaut (C-21) : 200 bases, pas 201.
Object.assign(process.env, {
    DB_NAME: nomEcole(1),
    DB_USER: nomEcole(1),
    DB_PASSWORD: motDePasseEcole(secrets.maitre, 1),
    JWT_SECRET: secrets.jwt,
    CSRF_SECRET: secrets.csrf,
    JWT_PRIVATE_KEY: generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }),
    // C-3 : la limite de l'API se compte par numéro de compte, commun aux écoles ; relevée pour la mesure
    RATE_LIMIT_API_MAX: "100000000",
    // Chaque utilisateur virtuel a sa propre adresse (X-Forwarded-For) : limites de connexion tenues
    TRUST_PROXY_HOPS: "1",
    // Jeton d'accès de 4 h (15 min en production) : une série dure plus de 15 min, et des 401
    // très rapides fausseraient la montée en charge (charge.mjs invalide la série s'il en voit)
    JWT_ACCESS_TTL_SECONDS: "14400",
});

const { default: app } = await import("/app/app.js");
const { dansEtablissement } = await import("/app/contexte/etablissement.js");
const { Users } = await import("/app/models/index.js");
const { creerEcoles, bilanEcoles } = await import("./lib/ecoles.mjs");
const { demarrerTaches, statsTaches } = await import("./lib/taches.mjs");

const ecoles = creerEcoles(N, secrets.maitre);

const json = (res, statut, corps) => {
    res.writeHead(statut, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(corps));
};

/** Réglages réellement appliqués par MySQL : serie.mjs les compare au réglage demandé. */
const variablesMysql = async () => {
    const ecole = ecoles.get(1);
    const [lignes] = await ecole.occuper(() =>
        ecole.contexte.sequelize.query("SHOW GLOBAL VARIABLES WHERE Variable_name IN ('max_connections', 'table_open_cache', 'innodb_buffer_pool_size', 'open_files_limit')")
    );
    return Object.fromEntries(lignes.map((l) => [l.Variable_name, Number(l.Value)]));
};

/** Routes du banc ; celles qui portent sur une école passent par son contexte (D-03), comme l'application. */
const routesBanc = async (req, res, ecole) => {
    const url = new URL(req.url, "http://banc");
    if (url.pathname === "/banc/sante") return json(res, 200, { ok: true, mode: MODE, ecoles: N, demarrage_ms: demarrage, chargees: bilanEcoles(ecoles).chargees, mysql: await variablesMysql() });
    if (url.pathname === "/banc/memoire") return json(res, 200, { memoire: process.memoryUsage(), ecoles: { ...bilanEcoles(ecoles), reveils_ms: undefined } });
    if (url.pathname === "/banc/taches") return json(res, 200, statsTaches);
    if (url.pathname === "/banc/reveils") return json(res, 200, { reveils_ms: bilanEcoles(ecoles).reveils_ms });
    if (!ecole) return json(res, 404, { message: "Route du banc inconnue, ou école absente de l'en-tête Host" });
    if (url.pathname === "/banc/base") {
        // La base vue à travers les résolveurs de models/index.js : c'est la vérification d'isolation
        const [[ligne]] = await ecole.occuper(() => dansEtablissement(ecole.contexte, () => Users.sequelize.query("SELECT DATABASE() AS base")));
        return json(res, 200, { ecole: ecole.n, base: ligne.base });
    }
    if (url.pathname === "/banc/etudiants") {
        const n = Math.min(500, Number(url.searchParams.get("n") || 50));
        const lignes = await ecole.occuper(() =>
            dansEtablissement(ecole.contexte, () => Users.findAll({ where: { role: "etudiant", actif: true }, attributes: ["email"], order: [["id_user", "ASC"]], limit: n }))
        );
        return json(res, 200, { emails: lignes.map((u) => u.email) });
    }
    return json(res, 404, { message: "Route du banc inconnue" });
};

const serveur = http.createServer(async (req, res) => {
    const n = numeroDeHote(req.headers.host);
    const ecole = n ? ecoles.get(n) : null;
    try {
        if (req.url.startsWith("/banc/")) return await routesBanc(req, res, ecole);
        if (!ecole) return json(res, 404, { message: "École inconnue du banc (en-tête Host)" });
        ecole.enCours += 1;
        ecole.derniere = Date.now();
        res.on("close", () => {
            ecole.enCours -= 1;
            ecole.derniere = Date.now();
        });
        const reveil = await ecole.charger();
        if (reveil) res.setHeader("X-Banc-Chargement-Ms", String(reveil));
        app(req, res);
    } catch (erreur) {
        journal(`erreur : ${erreur.message}`);
        if (!res.headersSent) json(res, 503, { message: "Erreur du banc", erreur: erreur.message });
    }
});
serveur.keepAliveTimeout = 65_000;

// M4a : toutes les écoles chargées et leurs migrations vérifiées avant d'écouter
let migrationsEnAttente = 0;
if (MODE === "a") {
    for (const ecole of ecoles.values()) migrationsEnAttente += await ecole.migrationsEnAttente();
    journal(`${N} écoles chargées, ${migrationsEnAttente} migration(s) en attente`);
}
const demarrage = Date.now() - debutProcessus;

serveur.listen(PORT_BANC, "0.0.0.0", () => {
    journal(`écoute sur ${PORT_BANC} : mode ${MODE}, ${N} écoles, démarrage en ${demarrage} ms, tâches ${TACHES ? "en route" : "arrêtées"}`);
    if (TACHES) demarrerTaches(ecoles);
});

// Libération des écoles endormies (P-8), toutes les 30 s
setInterval(async () => {
    let liberees = 0;
    for (const ecole of ecoles.values()) if (await ecole.libererSiInactive(INACTIVITE_MS)) liberees += 1;
    if (liberees) journal(`${liberees} école(s) libérée(s) après ${INACTIVITE_MS / 60000} min sans activité`);
}, 30_000).unref();

const arreter = () => {
    journal("arrêt");
    serveur.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5_000).unref();
};
process.on("SIGTERM", arreter);
process.on("SIGINT", arreter);
