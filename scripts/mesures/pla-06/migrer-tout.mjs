/**
 * M5b (seuil S3) : la migration d'étude appliquée aux N bases du banc, une à une puis 4 à la fois,
 * chaque fois défaite ensuite, pour mesurer ce que coûtera une mise à jour de 200 écoles.
 * Dans le conteneur du banc : node /banc/migrer-tout.mjs --serie <nom> [--ecoles 200]
 * Chaque base est migrée par son propre utilisateur (D-01). Le suivi est dans une table à part
 * (SequelizeMetaEtudePla06) : les vraies migrations de Planner ne sont jamais touchées.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NB_ECOLES, ecrireResultat, lireSecrets, motDePasseEcole, nomEcole } from "./lib/config.mjs";
import { resumer } from "./lib/stats.mjs";

const requireApp = createRequire("/app/package.json");
const { Sequelize } = requireApp("sequelize");
const { Umzug, SequelizeStorage } = requireApp("umzug");

const args = process.argv.slice(2);
const option = (nom, defaut) => (args.includes(`--${nom}`) ? args[args.indexOf(`--${nom}`) + 1] : defaut);
const N = Number(option("ecoles", NB_ECOLES));
const SERIE = option("serie", `migrations-${Date.now()}`);
const { maitre } = lireSecrets();
const DOSSIER = join(dirname(fileURLToPath(import.meta.url)), "migrations-etude");
const journal = (m) => console.log(`[migrations ${new Date().toISOString().slice(11, 19)}] ${m}`);

/** Le migrateur d'étude d'une école, sur sa propre connexion. */
const migrateur = (connexion) =>
    new Umzug({
        migrations: {
            glob: ["9[0-9][0-9][0-9]-*.mjs", { cwd: DOSSIER }],
            resolve: ({ name, path: chemin, context }) => ({
                name,
                up: async () => (await import(pathToFileURL(chemin).href)).up({ context }),
                down: async () => (await import(pathToFileURL(chemin).href)).down({ context }),
            }),
        },
        context: { queryInterface: connexion.getQueryInterface(), Sequelize },
        storage: new SequelizeStorage({ sequelize: connexion, tableName: "SequelizeMetaEtudePla06" }),
        logger: undefined,
    });

const connexion = (k) => new Sequelize(nomEcole(k), nomEcole(k), motDePasseEcole(maitre, k), { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), dialect: "mysql", logging: false, pool: { max: 1 } });

/** Applique (sens « up ») ou défait (« down ») la migration sur toutes les bases, `parallele` à la fois. */
const passer = async (sens, parallele) => {
    const durees = new Array(N);
    let suivante = 1;
    const debut = Date.now();
    const ouvrier = async () => {
        while (suivante <= N) {
            const k = suivante++;
            const c = connexion(k);
            const t = Date.now();
            try {
                if (sens === "up") await migrateur(c).up();
                else await migrateur(c).down({ to: 0 });
                durees[k - 1] = Date.now() - t;
            } finally {
                await c.close();
            }
        }
    };
    await Promise.all(Array.from({ length: parallele }, ouvrier));
    return { sens, parallele, total_ms: Date.now() - debut, par_base: resumer(durees) };
};

const resultat = { serie: SERIE, ecoles: N, debut: new Date().toISOString(), passages: [] };
// Chauffe, non comptée : le premier passage charge les modules (constaté le 10 novembre : 9 s de plus)
{
    const c = connexion(1);
    await migrateur(c).up();
    await migrateur(c).down({ to: 0 });
    await c.close();
}
for (const parallele of [1, 4]) {
    journal(`application à ${N} bases, ${parallele} à la fois`);
    resultat.passages.push(await passer("up", parallele));
    journal(`retour arrière (non compté dans S3)`);
    resultat.passages.push(await passer("down", 4));
}
const montee = resultat.passages.filter((p) => p.sens === "up");
resultat.s3_ms = Math.min(...montee.map((p) => p.total_ms));
resultat.s3_tenu = resultat.s3_ms < 30 * 60 * 1000;
resultat.fin = new Date().toISOString();
journal(`S3 : ${Math.round(resultat.s3_ms / 1000)} s au mieux (${resultat.s3_tenu ? "tenu" : "NON TENU"}) ; ${ecrireResultat(`${SERIE}-migrations.json`, resultat)}`);
