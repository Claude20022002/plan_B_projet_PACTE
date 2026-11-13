/**
 * Pilote d'une série PLA-06 (plan, § 4.2), sur le PC qui envoie la charge. Il commande le PC du banc
 * par SSH (P-22) ; sans `banc.ssh` dans .local/machines.json, il affiche chaque commande à lancer à la
 * main sur le PC du banc et attend Entrée. Déroulé : MySQL et serveur de banc relancés avec le
 * réglage et les limites de la série ; attente de la santé (M4) ; relevés en route ; charge
 * (charge.mjs) ; repos pour voir les écoles se libérer ; arrêt des relevés ; résultats rapatriés.
 * Usage : node serie.mjs --nom <série> --reglage defaut|production|ajuste --mysql-memoire 2g
 *         [--innodb 1g] [--mode a|b] [--taches oui|non] [--repos 900] [--migrations]
 *         [--ecoles-banc 200] + les options de charge.mjs (--ecoles, --utilisateurs, --duree, --rampe…)
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { RESULTATS, RACINE, lireMachines } from "./lib/config.mjs";
import { attendre, requete } from "./lib/http.mjs";

const args = process.argv.slice(2);
const option = (nom, defaut) => (args.includes(`--${nom}`) ? args[args.indexOf(`--${nom}`) + 1] : defaut);
const machines = lireMachines();
const NOM = option("nom", null);
const REGLAGE = option("reglage", "production");
if (!NOM || !/^[\w-]+$/.test(NOM)) throw new Error("--nom <série> obligatoire (lettres, chiffres, tirets)");
if (!["defaut", "production", "ajuste"].includes(REGLAGE)) throw new Error("--reglage : defaut, production ou ajuste");
const memoire = option("mysql-memoire", machines.limites.mysqlMemoire);
const variables = {
    MESURE_REGLAGE: REGLAGE,
    MESURE_MYSQL_MEMOIRE: memoire,
    MESURE_INNODB_POOL: option("innodb", machines.limites.innodbPool).toUpperCase(),
    MESURE_MYSQL_CPUS: String(machines.limites.mysqlCpus),
    MESURE_BANC_MEMOIRE: machines.limites.bancMemoire,
    MESURE_BANC_CPUS: String(machines.limites.bancCpus),
    MESURE_FICHIERS_SOUPLE: String(machines.limites.fichiersOuverts[0]),
    MESURE_FICHIERS_MAX: String(machines.limites.fichiersOuverts[1]),
    MESURE_MODE: option("mode", "a"),
    MESURE_TACHES: option("taches", "oui"),
    MESURE_ECOLES: option("ecoles-banc", "200"),
    MESURE_BANC_ECOUTE: machines.banc.adresse,
};
const BANC = `http://${machines.banc.adresse}:${machines.banc.port}`;
const DOSSIER_DISTANT = `${machines.banc.depot}/scripts/mesures/pla-06`;
const COMPOSE = "docker compose -f docker-compose.mesure.yml --env-file .local/mesure.env";
const env = Object.entries(variables).map(([k, v]) => `${k}=${v}`).join(" ");
const journal = (m) => console.log(`[série ${NOM} ${new Date().toISOString().slice(11, 19)}] ${m}`);

/** Lance un programme et attend sa fin ; rend son code de sortie. */
const executer = (programme, liste) =>
    new Promise((resoudre) => {
        const p = spawn(programme, liste, { stdio: "inherit" });
        p.on("exit", (code) => resoudre(code ?? 1));
        p.on("error", () => resoudre(1));
    });

/** Commande sur le PC du banc : par SSH, ou affichée pour être lancée à la main. */
const distant = async (commande) => {
    const complete = `cd ${DOSSIER_DISTANT} && ${commande}`;
    if (machines.banc.ssh) {
        journal(`banc$ ${commande.slice(0, 120)}`);
        return executer("ssh", ["-o", "BatchMode=yes", machines.banc.ssh, complete]);
    }
    console.log(`\n>>> À lancer sur le PC du banc :\n${complete}\n`);
    const lecteur = createInterface({ input: process.stdin, output: process.stdout });
    await lecteur.question("Entrée quand c'est fait… ");
    lecteur.close();
    return 0;
};

/** Attend que le serveur de banc réponde (le mode a charge toutes les écoles avant d'écouter). */
const attendreSante = async (maxMs) => {
    const debut = Date.now();
    while (Date.now() - debut < maxMs) {
        const r = await requete(BANC, { chemin: "/banc/sante", lireCorps: true });
        if (r.statut === 200) return { attente_ms: Date.now() - debut, ...r.corps };
        await attendre(2000);
    }
    throw new Error(`le serveur de banc ne répond pas après ${maxMs / 1000} s (journal : ${COMPOSE} logs banc)`);
};

const bilan = { nom: NOM, variables: { ...variables, MESURE_BANC_ECOUTE: "(adresse locale)" }, debut: new Date().toISOString() };
mkdirSync(join(RESULTATS, NOM), { recursive: true });

journal(`réglage ${REGLAGE}, MySQL ${memoire}, mode ${variables.MESURE_MODE}, tâches ${variables.MESURE_TACHES}`);
await distant(`${COMPOSE} stop banc mysql && ${env} ${COMPOSE} up -d mysql banc`);
bilan.sante = await attendreSante(30 * 60 * 1000);
journal(`banc prêt : démarrage ${bilan.sante.demarrage_ms} ms`);

// Le réglage demandé est-il celui que MySQL applique ? (un fichier ignoré ne lève aucune erreur)
const ATTENDU = { defaut: { max_connections: 151, table_open_cache: 4000 }, production: { max_connections: 60, table_open_cache: 400 }, ajuste: { max_connections: 300, table_open_cache: 4000 } };
const octets = (t) => Number.parseInt(t, 10) * (/g$/i.test(t) ? 1024 ** 3 : 1024 ** 2);
const ecarts = Object.entries({ ...ATTENDU[REGLAGE], innodb_buffer_pool_size: octets(variables.MESURE_INNODB_POOL) }).filter(([k, v]) => bilan.sante.mysql?.[k] !== v);
if (ecarts.length) throw new Error(`MySQL n'applique pas le réglage « ${REGLAGE} » : ${ecarts.map(([k, v]) => `${k} = ${bilan.sante.mysql?.[k]} au lieu de ${v}`).join(", ")}`);

if (args.includes("--migrations")) {
    bilan.migrations_code = await distant(`${env} ${COMPOSE} run --rm --no-deps banc node /banc/migrer-tout.mjs --serie ${NOM} --ecoles ${variables.MESURE_ECOLES}`);
}

await distant(`nohup node releves.mjs --serie ${NOM} --banc ${BANC} > resultats/${NOM}-releves.log 2>&1 < /dev/null & echo $! > .local/releves.pid`);
// Les options propres à la série restent ici ; toutes les autres vont à charge.mjs
const PROPRES = new Set(["--nom", "--reglage", "--mysql-memoire", "--innodb", "--mode", "--taches", "--repos", "--ecoles-banc"]);
const optionsCharge = args.filter((a, i) => a !== "--migrations" && !PROPRES.has(a) && !PROPRES.has(args[i - 1]));
bilan.charge_code = await executer(process.execPath, [join(RACINE, "charge.mjs"), "--banc", BANC, "--serie", NOM, ...optionsCharge]);

const repos = Number(option("repos", 900)) * 1000;
journal(`repos de ${repos / 60000} min : les écoles inactives se libèrent-elles ? (P-8, C-2)`);
await attendre(repos);

await distant(`kill -TERM $(cat .local/releves.pid) ; sleep 2 ; ${COMPOSE} logs --no-color banc > resultats/${NOM}/banc.log 2>&1`);
if (machines.banc.ssh) {
    bilan.rapatriement_code = await executer("scp", ["-r", "-B", `${machines.banc.ssh}:${DOSSIER_DISTANT}/resultats/${NOM}/.`, join(RESULTATS, NOM)]);
} else {
    console.log(`\n>>> Copier ${DOSSIER_DISTANT}/resultats/${NOM}/ du PC du banc vers ${join(RESULTATS, NOM)} sur ce PC.`);
}

const lire = (f) => (existsSync(join(RESULTATS, NOM, f)) ? JSON.parse(readFileSync(join(RESULTATS, NOM, f), "utf8")) : null);
const charge = lire("charge.json");
const releves = lire("releves-resume.json");
bilan.fin = new Date().toISOString();
bilan.valide = Boolean(charge?.valide && releves?.valide);
bilan.raisons = [...(charge?.invalide ?? []), ...(releves && !releves.valide ? ["mémoire d'échange utilisée sur le PC du banc (C-26)"] : [])];
writeFileSync(join(RESULTATS, NOM, "serie.json"), JSON.stringify(bilan, null, 2));
journal(`${bilan.valide ? "SÉRIE VALIDE" : "SÉRIE INVALIDE"} ${bilan.raisons.join(" ; ")}`);
