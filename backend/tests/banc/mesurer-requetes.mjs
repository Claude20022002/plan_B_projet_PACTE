/**
 * Banc des requêtes SQL : pour chaque route principale (administration, enseignant, étudiant),
 * nombre de requêtes, temps SQL cumulé, requête la plus lente et durée totale de la réponse, sur
 * la base de banc (18 000 séances). Repère les boucles de requêtes (N+1) et, avec --explain, les
 * lectures de table entière (EXPLAIN type ALL) des requêtes lentes.
 *
 * Lancement (depuis backend/, conteneur hestim_mysql_test démarré, base créée par preparer-base.mjs) :
 *   node tests/banc/mesurer-requetes.mjs [--explain] [--seuil=20] [--filtre=stat] [--verifier]
 * --verifier (CI) : échec si une route ne répond pas 200 ou dépasse son budget de requêtes SQL
 * (une boucle N+1 introduite fait grandir le nombre de requêtes avec les données). Après une
 * optimisation, abaisser le budget de la route pour verrouiller le gain.
 * Les migrations sont appliquées à la base de banc au départ. Aucune donnée n'est modifiée, hormis
 * une session de connexion par rôle (supprimée à la fin).
 */
import "./env.mjs";
import crypto from "crypto";
import request from "supertest";
import sequelize from "../../config/db.js";
import { runMigrations } from "../../migrations/migrator.js";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const SEUIL_MS = Number(args.seuil ?? 20);

await runMigrations();
const { default: app } = await import("../../app.js");
const { AuthSession, Users, Affectation, Appartenir, Groupe, Periode } = await import("../../models/index.js");
const { signerJetonAcces } = await import("../../utils/jetons.js");

// Journal des requêtes : chaque requête SQL et sa durée (option benchmark de Sequelize)
let journal = [];
sequelize.options.benchmark = true;
sequelize.options.logging = (sql, ms) => journal.push({ sql: sql.replace(/^Executed \([^)]*\): /, ""), ms });

// Comptes du banc : le premier admin, l'enseignant le plus chargé, un étudiant d'une promotion chargée
const [[plusCharge]] = await sequelize.query("SELECT id_user_enseignant AS id FROM Affectations GROUP BY id_user_enseignant ORDER BY COUNT(*) DESC LIMIT 1");
const [[groupeCharge]] = await sequelize.query("SELECT id_groupe AS id FROM Affectations GROUP BY id_groupe ORDER BY COUNT(*) DESC LIMIT 1");
const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
const enseignant = await Users.findByPk(plusCharge.id);
const appartenance = await Appartenir.findOne({ where: { id_groupe: groupeCharge.id } }) ?? (await Appartenir.findOne());
const etudiant = await Users.findByPk(appartenance.id_user_etudiant);
const [[bornes]] = await sequelize.query("SELECT MIN(date_seance) AS debut, MAX(date_seance) AS fin FROM Affectations");
const debut = String(bornes.debut).slice(0, 10);
const mois = debut.slice(0, 7);
const finMois = new Date(new Date(`${mois}-01T00:00:00Z`).setUTCMonth(new Date(`${mois}-01T00:00:00Z`).getUTCMonth() + 1) - 86400000).toISOString().slice(0, 10);
const periode = await Periode.findOne({ order: [["id_periode", "ASC"]] });
const groupe = await Groupe.findByPk(appartenance.id_groupe);

const sessions = [];
const jetonPour = async (user) => {
    const sid = crypto.randomUUID();
    sessions.push(sid);
    await AuthSession.create({ id_user: user.id_user, session_id: sid, family_id: sid, refresh_token_hash: crypto.randomBytes(16).toString("hex"), expires_at: new Date(Date.now() + 3600e3) });
    return signerJetonAcces({ sub: String(user.id_user), sid, fid: sid, role: user.role }, 3600);
};
const jetons = { admin: await jetonPour(admin), enseignant: await jetonPour(enseignant), etudiant: await jetonPour(etudiant) };

// [rôle, adresse, budget de requêtes SQL] : budgets mesurés sur la base de preparer-base.mjs
// (dont 2 requêtes d'authentification par appel)
const ROUTES = [
    ["admin", "/api/statistiques/dashboard", 12],
    ["admin", "/api/statistiques/kpis", 14],
    ["admin", "/api/statistiques/salles/occupation", 6],
    ["admin", "/api/statistiques/salles/frequence", 4],
    ["admin", "/api/statistiques/enseignants/charge", 7],
    ["admin", "/api/statistiques/groupes/occupation", 6],
    ["admin", "/api/statistiques/activite/heures-creuses", 5],
    ["admin", "/api/statistiques/activite/pics", 5],
    ["admin", "/api/affectations?page=1&limit=50", 6],
    ["admin", `/api/affectations?date_from=${debut}&date_to=${finMois}&limit=500`, 6],
    ["admin", `/api/emplois-du-temps/groupe/${groupe.id_groupe}?date_debut=${debut}&date_fin=${finMois}`, 5],
    ["admin", `/api/emplois-du-temps/groupe/${groupe.id_groupe}/mensuel?mois=${mois}`, 12],
    ["admin", "/api/salles", 4],
    ["admin", "/api/enseignants", 4],
    ["admin", "/api/etudiants?page=1&limit=50", 4],
    ["admin", "/api/groupes", 4],
    ["admin", "/api/groupes/arbre", 3],
    ["admin", "/api/cours", 4],
    ["admin", "/api/filieres", 4],
    ["admin", "/api/conflits", 4],
    ["admin", "/api/demandes-report", 3],
    ["admin", "/api/reservations", 3],
    ["admin", "/api/examens", 3],
    ["admin", `/api/suivi/modules?id_periode=${periode.id_periode}`, 7],
    ["admin", `/api/suivi/enseignants?mois=${mois}`, 5],
    ["admin", `/api/preparation?id_periode=${periode.id_periode}`, 12],
    ["admin", `/api/enseignements?id_periode=${periode.id_periode}`, 4],
    ["admin", "/api/annonces/envoyees", 3],
    ["admin", "/api/presences/signalements", 4],
    ["enseignant", "/api/auth/me", 5],
    ["enseignant", `/api/emplois-du-temps/enseignant/${enseignant.id_user}?date_debut=${debut}&date_fin=${finMois}`, 4],
    ["enseignant", "/api/activites", 13],
    ["enseignant", "/api/devoirs", 3],
    ["enseignant", "/api/annonces", 7],
    ["enseignant", "/api/services/mes-services", 3],
    ["enseignant", "/api/examens/mes-surveillances", 4],
    ["enseignant", `/api/disponibilites/enseignant/${enseignant.id_user}`, 3],
    ["enseignant", "/api/suivi/retours/mes-modules", 4],
    ["enseignant", "/api/quiz/parties/en-cours", 3],
    ["etudiant", "/api/auth/me", 4],
    ["etudiant", `/api/emplois-du-temps/moi?du=${debut}&au=${finMois}`, 10],
    ["etudiant", `/api/emplois-du-temps/etudiant/${etudiant.id_user}?date_debut=${debut}&date_fin=${finMois}`, 6],
    ["etudiant", "/api/activites", 17],
    ["etudiant", "/api/devoirs", 9],
    ["etudiant", "/api/annonces", 7],
    ["etudiant", "/api/quiz/parties/en-cours", 3],
    ["etudiant", "/api/presences/miennes", 3],
    ["etudiant", "/api/examens/mes-examens", 7],
    ["etudiant", "/api/suivi/retours/a-donner", 7],
    ["etudiant", `/api/notifications/user/${etudiant.id_user}`, 3],
].filter(([, url]) => !args.filtre || url.includes(args.filtre));

const lignes = [];
const lentes = new Map();
for (const [role, url, budget] of ROUTES) {
    // Une première passe à blanc (caches, compilation), puis la mesure
    await request(app).get(url).set("Authorization", `Bearer ${jetons[role]}`);
    journal = [];
    const t0 = performance.now();
    const res = await request(app).get(url).set("Authorization", `Bearer ${jetons[role]}`);
    const total = performance.now() - t0;
    const requetes = journal;
    const sqlMs = requetes.reduce((s, r) => s + r.ms, 0);
    const pire = requetes.reduce((p, r) => (r.ms > (p?.ms ?? -1) ? r : p), null);
    // Requêtes répétées à l'identique (hors valeurs) : signe d'une boucle N+1
    const formes = new Map();
    for (const r of requetes) {
        const forme = r.sql.replace(/'[^']*'/g, "?").replace(/\b\d+\b/g, "?");
        formes.set(forme, (formes.get(forme) ?? 0) + 1);
    }
    const repetee = Math.max(0, ...formes.values());
    lignes.push({ role, url: url.replace(/\?.*/, "").slice(0, 52), statut: res.status, ms: Math.round(total), requetes: requetes.length, budget, sql_ms: sqlMs, pire_ms: pire?.ms ?? 0, repetee });
    for (const r of requetes) if (r.ms >= SEUIL_MS && !lentes.has(r.sql)) lentes.set(r.sql, { ...r, route: url });
}

console.table(lignes);
console.log(`Requêtes de ${SEUIL_MS} ms ou plus : ${lentes.size}`);

if (args.explain) {
    for (const lente of [...lentes.values()].sort((a, b) => b.ms - a.ms).slice(0, 15)) {
        if (!/^\s*SELECT/i.test(lente.sql)) continue;
        sequelize.options.logging = false;
        const [plan] = await sequelize.query(`EXPLAIN ${lente.sql.replace(/;\s*$/, "")}`);
        console.log(`\n${lente.ms} ms · ${lente.route}\n${lente.sql.slice(0, 400)}${lente.sql.length > 400 ? "…" : ""}`);
        console.table(plan.map((p) => ({ table: p.table, type: p.type, cle: p.key, lignes: p.rows, filtre: p.filtered, extra: p.Extra })));
    }
}

sequelize.options.logging = false;
await AuthSession.destroy({ where: { session_id: sessions } });
await sequelize.close();

if (args.verifier) {
    const echecs = lignes.filter((l) => l.statut !== 200 || l.requetes > l.budget);
    for (const l of echecs) {
        console.error(`✗ ${l.role} ${l.url} : ${l.statut !== 200 ? `statut ${l.statut}` : `${l.requetes} requêtes pour un budget de ${l.budget}`}`);
    }
    if (echecs.length) process.exit(1);
    console.log(`✓ ${lignes.length} routes : statut 200 et budget de requêtes respecté`);
}
