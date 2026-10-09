/**
 * Base du banc des requêtes, reproductible : le référentiel de seed.js (filières, groupes,
 * enseignants, étudiants, enseignements) puis une année de séances générées de façon
 * déterministe (18 000 par défaut), rattachées à leurs enseignements (mutualisations comprises)
 * et sans chevauchement de groupe, d'enseignant ni de salle.
 *
 * Lancement (depuis backend/, conteneur hestim_mysql_test démarré) :
 *   node tests/banc/preparer-base.mjs [--seances=18000] [--reinitialiser]
 * Une base déjà remplie est laissée telle quelle ; --reinitialiser la recrée.
 */
import "./env.mjs";
import mysql from "mysql2/promise";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const CIBLE = Number(args.seances ?? 18000);
const SEMAINES = 36;
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// La base est créée (ou recréée) avant le premier accès de Sequelize
const serveur = await mysql.createConnection({ host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD });
if (args.reinitialiser) await serveur.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
await serveur.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await serveur.end();

const { default: sequelize } = await import("../../config/db.js");
const { default: seed } = await import("../../seed.js");
const { Affectation, CoursComposante, Creneau, Enseignement, EnseignementEnseignant, EnseignementGroupe, Periode, Salle, Users } = await import("../../models/index.js");

const [[{ tables }]] = await sequelize.query("SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'Affectations'");
const existantes = tables ? await Affectation.count() : 0;
if (existantes > 0) {
    console.log(`Base ${DB_NAME} déjà prête (${existantes} séances) ; --reinitialiser pour la recréer.`);
    await sequelize.close();
    process.exit(0);
}

await seed();

const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
const S1 = await Periode.findOne({ where: { code: "S1" }, order: [["id_periode", "ASC"]] });
const creneaux = await Creneau.findAll({ where: { regime: "initiale", variante: "normale" }, order: [["id_creneau", "ASC"]] });
const salles = await Salle.findAll({ order: [["id_salle", "ASC"]] });
const composantes = new Map((await CoursComposante.findAll()).map((c) => [c.id_composante, c]));
const groupesDe = new Map();
for (const lien of await EnseignementGroupe.findAll({ order: [["id_groupe", "ASC"]] })) {
    groupesDe.set(lien.id_enseignement, [...(groupesDe.get(lien.id_enseignement) ?? []), lien.id_groupe]);
}
const titulaireDe = new Map();
for (const s of await EnseignementEnseignant.findAll({ where: { role: "principal" }, order: [["id_enseignement", "ASC"], ["id_user", "ASC"]] })) {
    // Service accepté de préférence, sinon proposé (la séance reste plausible pour la mesure)
    const actuel = titulaireDe.get(s.id_enseignement);
    if (s.statut_service !== "refuse" && (!actuel || (actuel.statut_service !== "accepte" && s.statut_service === "accepte"))) titulaireDe.set(s.id_enseignement, s);
}
const enseignements = (await Enseignement.findAll({ order: [["id_enseignement", "ASC"]] })).filter(
    (e) => groupesDe.has(e.id_enseignement) && titulaireDe.has(e.id_enseignement) && composantes.has(e.id_composante)
);

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const iso = (date) => date.toISOString().slice(0, 10);
const lundi = new Date(`${S1.date_debut}T00:00:00Z`);
lundi.setUTCDate(lundi.getUTCDate() - ((lundi.getUTCDay() + 6) % 7));
// Séances passées réalisées, à venir planifiées ou confirmées ; un dixième annulées, un dixième reportées
const milieu = new Date(lundi.getTime() + (SEMAINES / 2) * 7 * 86400000);
const statutDe = (i, date) => {
    if (i % 10 === 0) return "annule";
    if (i % 10 === 1) return "reporte";
    if (date < milieu) return "realise";
    return i % 2 ? "confirme" : "planifie";
};

const seances = [];
const parSemaine = Math.ceil(CIBLE / SEMAINES);
let curseur = 0;
let curseurSalle = 0;
for (let semaine = 0; semaine < SEMAINES && seances.length < CIBLE; semaine += 1) {
    const occupes = new Set();
    let posees = 0;
    let echecs = 0;
    while (posees < parSemaine && seances.length < CIBLE && echecs < enseignements.length) {
        const ens = enseignements[curseur % enseignements.length];
        curseur += 1;
        const groupes = groupesDe.get(ens.id_enseignement);
        const enseignant = titulaireDe.get(ens.id_enseignement).id_user;
        let posee = false;
        // Créneaux parcourus à partir d'un décalage propre à l'enseignement : semaines étalées
        for (let k = 0; k < creneaux.length && !posee; k += 1) {
            const creneau = creneaux[(ens.id_enseignement * 7 + k) % creneaux.length];
            const c = creneau.id_creneau;
            if (groupes.some((g) => occupes.has(`g${g}:${c}`)) || occupes.has(`e${enseignant}:${c}`)) continue;
            for (let s = 0; s < salles.length; s += 1) {
                const salle = salles[(curseurSalle + s) % salles.length];
                if (occupes.has(`s${salle.id_salle}:${c}`)) continue;
                curseurSalle = (curseurSalle + s + 1) % salles.length;
                groupes.forEach((g) => occupes.add(`g${g}:${c}`));
                occupes.add(`e${enseignant}:${c}`);
                occupes.add(`s${salle.id_salle}:${c}`);
                const date = new Date(lundi.getTime() + (semaine * 7 + JOURS.indexOf(creneau.jour_semaine)) * 86400000);
                seances.push({
                    date_seance: iso(date),
                    statut: statutDe(seances.length, date),
                    id_cours: composantes.get(ens.id_composante).id_cours,
                    id_groupe: groupes[0],
                    id_user_enseignant: enseignant,
                    id_salle: salle.id_salle,
                    id_enseignement: ens.id_enseignement,
                    id_creneau: c,
                    id_user_admin: admin.id_user,
                });
                posee = true;
                break;
            }
        }
        if (posee) {
            posees += 1;
            echecs = 0;
        } else {
            echecs += 1;
        }
    }
}

await sequelize.transaction(async (transaction) => {
    for (let i = 0; i < seances.length; i += 1000) {
        await Affectation.bulkCreate(seances.slice(i, i + 1000), { transaction, validate: false, hooks: false });
    }
});
await sequelize.query("ANALYZE TABLE Affectations");
console.log(`Base ${DB_NAME} prête : ${seances.length} séances du ${seances[0]?.date_seance} au ${seances.at(-1)?.date_seance}.`);
if (seances.length < CIBLE) console.warn(`Attention : ${CIBLE} séances demandées, ${seances.length} posées (grille saturée).`);
await sequelize.close();
