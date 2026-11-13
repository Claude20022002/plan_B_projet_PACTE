/**
 * Préparation du banc PLA-06 (plan, § 9, étape 3). Deux usages :
 * - sur le PC du banc, hors conteneur : `node preparer.mjs initialiser` crée .local/secrets.json et
 *   .local/mesure.env (mot de passe root de MySQL), jamais commités ;
 * - dans le conteneur du banc : `node /banc/preparer.mjs bases --ecoles 200` construit la base
 *   modèle (62 migrations, seed, séances synthétiques, mois publiés), la copie en 200 bases avec un
 *   utilisateur chacune, contrôle le tout et mesure M5a (base neuve) et M7 (disque et tables).
 * Options : --ecoles N ; --etapes modele,seances,publier,copies,controles (toutes par défaut) ;
 * `nettoyer` supprime bases et utilisateurs du banc.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { BASE_MODELE, BASE_VIERGE, NB_ECOLES, ecrireResultat, initialiserSecrets, lireSecrets, motDePasseEcole, nomEcole } from "./lib/config.mjs";
import { lundis, planifierSemaine, premierLundiDeLAnnee, seancesDeLAnnee } from "./lib/seances.mjs";

const args = process.argv.slice(2);
const option = (nom, defaut) => {
    const i = args.indexOf(`--${nom}`);
    return i >= 0 ? args[i + 1] : defaut;
};
const journal = (m) => console.log(`[préparation ${new Date().toISOString().slice(11, 19)}] ${m}`);

/**
 * Lance un programme Node avec l'environnement donné, depuis /app (où sont les paquets du serveur,
 * comme en production) ; `entree` est envoyée sur son entrée standard.
 */
const lancer = (argsNode, env, entree = null) =>
    new Promise((resoudre, rejeter) => {
        const debut = Date.now();
        const p = spawn("node", argsNode, { cwd: "/app", env: { ...process.env, ...env }, stdio: [entree ? "pipe" : "ignore", "inherit", "inherit"] });
        if (entree) p.stdin.end(entree);
        p.on("error", rejeter);
        p.on("exit", (code) => (code === 0 ? resoudre(Date.now() - debut) : rejeter(new Error(`node ${argsNode.join(" ")} : code ${code}`))));
    });

/** Environnement du serveur pour une base donnée, en root (préparation seulement). */
const envBase = (base, root) => ({ DB_HOST: process.env.DB_HOST || "mysql", DB_NAME: base, DB_USER: "root", DB_PASSWORD: root, NODE_ENV: "development" });

/** M5a : une base neuve, les 62 migrations seules. */
const mesurerBaseNeuve = async (bases, root) => {
    await bases.recreerBase(bases.pool, BASE_VIERGE);
    Object.assign(process.env, envBase(BASE_VIERGE, root));
    const { Sequelize } = createRequire("/app/package.json")("sequelize");
    const { migrateurPour } = await import("/app/migrations/migrator.js");
    const connexion = new Sequelize(BASE_VIERGE, "root", root, { host: process.env.DB_HOST, dialect: "mysql", logging: false });
    const debut = Date.now();
    const appliquees = await migrateurPour(connexion).up();
    const duree = Date.now() - debut;
    await connexion.close();
    await bases.pool.query(`DROP DATABASE \`${BASE_VIERGE}\``);
    return { migrations: appliquees.length, duree_ms: duree };
};

/** Séances synthétiques dans la base modèle (C-5) ; rend leur nombre et le premier mois. */
const ajouterSeances = async (pool) => {
    const q = async (sql) => (await pool.query(sql))[0];
    const enseignements = await q(`SELECT e.id_enseignement, eg.id_groupe, MIN(cc.id_cours) AS id_cours, MIN(ee.id_user) AS id_user_enseignant
        FROM ${BASE_MODELE}.Enseignements e
        JOIN ${BASE_MODELE}.EnseignementGroupes eg ON eg.id_enseignement = e.id_enseignement
        JOIN ${BASE_MODELE}.CoursComposantes cc ON cc.id_composante = e.id_composante
        JOIN ${BASE_MODELE}.EnseignementEnseignants ee ON ee.id_enseignement = e.id_enseignement
        GROUP BY e.id_enseignement, eg.id_groupe`);
    const creneaux = await q(`SELECT MIN(id_creneau) AS id_creneau, jour_semaine, heure_debut, MIN(duree_minutes) AS duree_minutes
        FROM ${BASE_MODELE}.Creneaux WHERE regime = 'initiale' AND variante = 'normale' GROUP BY jour_semaine, heure_debut`);
    const salles = await q(`SELECT id_salle FROM ${BASE_MODELE}.Salles ORDER BY id_salle`);
    const [{ id_user: admin }] = await q(`SELECT id_user FROM ${BASE_MODELE}.Users WHERE role = 'admin' ORDER BY id_user LIMIT 1`);
    const premier = premierLundiDeLAnnee();
    const annee = seancesDeLAnnee(planifierSemaine({ enseignements, creneaux, salles }), lundis(premier, 36));
    const colonnes = (await q(`SHOW COLUMNS FROM ${BASE_MODELE}.Affectations`)).map((c) => c.Field);
    const horodate = ["createdAt", "updatedAt"].filter((c) => colonnes.includes(c));
    const champs = ["date_seance", "statut", "id_cours", "id_groupe", "id_user_enseignant", "id_salle", "id_enseignement", "id_creneau", "id_user_admin", ...horodate];
    const maintenant = new Date();
    for (let i = 0; i < annee.length; i += 1000) {
        const lot = annee.slice(i, i + 1000).map((s) => [s.date_seance, "planifie", s.id_cours, s.id_groupe, s.id_user_enseignant, s.id_salle, s.id_enseignement, s.id_creneau, admin, ...horodate.map(() => maintenant)]);
        await pool.query(`INSERT INTO ${BASE_MODELE}.Affectations (${champs.join(", ")}) VALUES ?`, [lot]);
    }
    return { seances: annee.length, enseignements: enseignements.length, premier_lundi: premier, mois_debut: premier.slice(0, 7) };
};

/** Copie la base modèle en N bases, 4 à la fois, avec un utilisateur chacune ; rend les durées. */
const copierToutes = async (bases, n, maitre) => {
    const definitions = await bases.definitionsDesTables(bases.pool, BASE_MODELE);
    const durees = new Array(n);
    let suivante = 1;
    const ouvrier = async () => {
        while (suivante <= n) {
            const k = suivante++;
            durees[k - 1] = await bases.copierBase(bases.pool, BASE_MODELE, nomEcole(k), definitions);
            await bases.creerUtilisateur(bases.pool, nomEcole(k), motDePasseEcole(maitre, k));
            if (k % 20 === 0) journal(`${k} bases copiées`);
        }
    };
    await Promise.all([ouvrier(), ouvrier(), ouvrier(), ouvrier()]);
    return { tables: definitions.length, durees_ms: durees };
};

/** Contrôles de fin (plan, § 8) : chaque base comme la base modèle, et l'isolation entre écoles. */
const controler = async (bases, n, maitre) => {
    const attendu = await bases.compter(bases.pool, BASE_MODELE);
    const ecarts = [];
    for (let k = 1; k <= n; k++) {
        const c = await bases.compter(bases.pool, nomEcole(k));
        if (JSON.stringify(c) !== JSON.stringify(attendu)) ecarts.push({ ecole: k, ...c });
    }
    const isolement = [];
    for (let i = 0; i < Math.min(5, n - 1); i++) {
        const a = 1 + Math.floor(Math.random() * n);
        const b = (a % n) + 1;
        isolement.push({ a, b, ...(await bases.verifierIsolement(nomEcole(a), motDePasseEcole(maitre, a), nomEcole(b))) });
    }
    return { attendu, ecarts, isolement, isolement_ok: isolement.every((r) => r.lit && r.refuse) };
};

const preparerBases = async () => {
    const n = Number(option("ecoles", NB_ECOLES));
    const etapes = new Set(option("etapes", "modele,seances,publier,copies,controles").split(","));
    const { root, maitre } = lireSecrets();
    // Copie du module (son objet n'est pas extensible) pour y ranger le groupe de connexions
    const bases = { ...(await import("./lib/bases.mjs")) };
    bases.pool = bases.poolRoot(root);
    const rapport = { debut: new Date().toISOString(), ecoles: n, etapes: [...etapes] };
    try {
        if (etapes.has("modele")) {
            journal("M5a : base neuve, migrations seules");
            rapport.m5a = await mesurerBaseNeuve(bases, root);
            journal(`base modèle : migrations et seed (${BASE_MODELE})`);
            await bases.recreerBase(bases.pool, BASE_MODELE);
            rapport.seed_ms = await lancer(["/app/seed.js"], envBase(BASE_MODELE, root));
        }
        if (etapes.has("seances")) {
            rapport.seances = await ajouterSeances(bases.pool);
            journal(`${rapport.seances.seances} séances synthétiques`);
        }
        if (etapes.has("publier")) {
            const mois = rapport.seances?.mois_debut ?? premierLundiDeLAnnee().slice(0, 7);
            journal(`mois publiés à partir de ${mois} (deploy/vps/marquer-edt-publie.mjs)`);
            const script = readFileSync("/deploy/vps/marquer-edt-publie.mjs");
            rapport.publication_ms = await lancer(["--input-type=module", "-"], { ...envBase(BASE_MODELE, root), MOIS_DEBUT: mois }, script);
        }
        if (etapes.has("copies")) {
            journal(`copie en ${n} bases`);
            rapport.copies = await copierToutes(bases, n, maitre);
            rapport.m7 = await bases.mesurerDisque(bases.pool);
        }
        if (etapes.has("controles")) {
            rapport.controles = await controler(bases, n, maitre);
            const ok = !rapport.controles.ecarts.length && rapport.controles.isolement_ok && rapport.controles.attendu.seances > 0;
            journal(ok ? "contrôles réussis" : "CONTRÔLES EN ÉCHEC : voir le fichier de résultat");
            rapport.controles_ok = ok;
        }
    } finally {
        rapport.fin = new Date().toISOString();
        journal(`résultat : ${ecrireResultat(`preparation-${rapport.debut.replace(/[:.]/g, "-")}.json`, rapport)}`);
        await bases.pool.end();
    }
    if (rapport.controles_ok === false) process.exitCode = 1;
};

const commande = args[0];
if (commande === "initialiser") {
    initialiserSecrets();
    console.log("Secrets du banc prêts dans .local/ (ignoré par Git). Ne jamais les commiter.");
} else if (commande === "bases") {
    await preparerBases();
} else if (commande === "nettoyer") {
    const bases = await import("./lib/bases.mjs");
    const pool = bases.poolRoot(lireSecrets().root);
    console.log(await bases.toutSupprimer(pool));
    await pool.end();
} else {
    console.error("Usage : node preparer.mjs initialiser | bases [--ecoles N] [--etapes …] | nettoyer");
    process.exitCode = 2;
}
