/**
 * Relevés du banc PLA-06 (M1, M2, M3, M7, M8), sur le PC du banc, hors conteneur, sans dépendance.
 * Toutes les 5 s : mémoire réelle des conteneurs (memory.current moins le cache de fichiers
 * inactif, C-20), compteurs de MySQL, état du serveur de banc, mémoire d'échange et processeur
 * de l'hôte. Une activité de la mémoire d'échange invalide la série (C-26).
 * Usage : node releves.mjs --serie <nom> [--banc http://<adresse>:5099] ; arrêt par Ctrl+C ou SIGTERM,
 * qui écrit le résumé.
 */
import { execFile } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { RESULTATS, lireSecrets } from "./lib/config.mjs";

const executer = promisify(execFile);
const args = process.argv.slice(2);
const option = (nom, defaut) => (args.includes(`--${nom}`) ? args[args.indexOf(`--${nom}`) + 1] : defaut);
const serie = option("serie", `serie-${Date.now()}`);
const banc = option("banc", "http://127.0.0.1:5099");
const PROJET = "planner-mesure-pla06";
const CONTENEURS = { mysql: `${PROJET}-mysql-1`, banc: `${PROJET}-banc-1` };
const dossier = join(RESULTATS, serie);
mkdirSync(dossier, { recursive: true });
const fichier = join(dossier, "releves.jsonl");
const { root } = lireSecrets();

/** Mémoire réelle d'un conteneur (cgroup v2) : memory.current moins inactive_file, en Mo. */
const memoireConteneur = async (nom) => {
    const { stdout } = await executer("docker", ["exec", nom, "sh", "-c", "cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.stat"]);
    const [courant, ...stat] = stdout.trim().split("\n");
    const champs = Object.fromEntries(stat.map((l) => l.split(" ")).map(([k, v]) => [k, Number(v)]));
    const mo = (o) => Math.round((o / 1048576) * 10) / 10;
    return { reelle_mo: mo(Number(courant) - (champs.inactive_file ?? 0)), anon_mo: mo(champs.anon ?? 0), fichiers_mo: mo(champs.file ?? 0) };
};

const VARIABLES = ["Threads_connected", "Max_used_connections", "Open_tables", "Opened_tables", "Table_open_cache_misses", "Open_files", "Connection_errors_max_connections", "Aborted_connects"];

/** Compteurs de MySQL (M3, M7). Le mot de passe passe par l'environnement, jamais par la ligne de commande. */
const compteursMysql = async () => {
    const requete = `SHOW GLOBAL STATUS WHERE Variable_name IN (${VARIABLES.map((v) => `'${v}'`).join(",")})`;
    const { stdout } = await executer("docker", ["exec", "-e", `MYSQL_PWD=${root}`, CONTENEURS.mysql, "mysql", "-uroot", "-N", "-B", "-e", requete]);
    return Object.fromEntries(stdout.trim().split("\n").map((l) => l.split("\t")).map(([k, v]) => [k, Number(v)]));
};

const lireBanc = async (chemin) => {
    const reponse = await fetch(`${banc}${chemin}`, { signal: AbortSignal.timeout(4000) });
    return reponse.json();
};

/** Hôte : mémoire disponible, mémoire d'échange utilisée, pages échangées depuis le démarrage, processeur. */
const hote = () => {
    const meminfo = Object.fromEntries(readFileSync("/proc/meminfo", "utf8").trim().split("\n").map((l) => l.split(/:\s+/)).map(([k, v]) => [k, parseInt(v, 10)]));
    const vmstat = Object.fromEntries(readFileSync("/proc/vmstat", "utf8").trim().split("\n").map((l) => l.split(" ")).map(([k, v]) => [k, Number(v)]));
    const [, ...cpu] = readFileSync("/proc/stat", "utf8").split("\n")[0].trim().split(/\s+/).map(Number);
    return {
        disponible_mo: Math.round(meminfo.MemAvailable / 1024),
        echange_utilise_mo: Math.round((meminfo.SwapTotal - meminfo.SwapFree) / 1024),
        pages_echangees: (vmstat.pswpin ?? 0) + (vmstat.pswpout ?? 0),
        cpu_total: cpu.reduce((s, v) => s + v, 0),
        cpu_repos: cpu[3] + (cpu[4] ?? 0),
    };
};

const depart = hote();
let precedent = depart;
const resume = { serie, debut: new Date().toISOString(), max: {}, echange_actif: false, cpu_hote_max: 0, erreurs: 0, releves: 0 };
const garderMax = (cle, valeur) => {
    if (Number.isFinite(valeur)) resume.max[cle] = Math.max(resume.max[cle] ?? -Infinity, valeur);
};

const relever = async () => {
    const h = hote();
    const cpu = h.cpu_total > precedent.cpu_total ? 100 * (1 - (h.cpu_repos - precedent.cpu_repos) / (h.cpu_total - precedent.cpu_total)) : 0;
    precedent = h;
    const ligne = { t: new Date().toISOString(), hote: { disponible_mo: h.disponible_mo, echange_utilise_mo: h.echange_utilise_mo, cpu: Math.round(cpu) } };
    try {
        [ligne.mysql, ligne.banc_conteneur, ligne.compteurs, ligne.banc, ligne.taches] = await Promise.all([
            memoireConteneur(CONTENEURS.mysql),
            memoireConteneur(CONTENEURS.banc),
            compteursMysql(),
            lireBanc("/banc/memoire"),
            lireBanc("/banc/taches").then(({ tours_sautes, erreurs, tour_en_cours, tours }) => ({ tours_sautes, erreurs, tour_en_cours, dernier: tours.at(-1) ?? null })),
        ]);
    } catch (erreur) {
        ligne.erreur = erreur.message;
        resume.erreurs += 1;
    }
    if (h.pages_echangees > depart.pages_echangees) resume.echange_actif = true;
    resume.cpu_hote_max = Math.max(resume.cpu_hote_max, ligne.hote.cpu);
    garderMax("mysql_mo", ligne.mysql?.reelle_mo);
    garderMax("banc_mo", ligne.banc_conteneur?.reelle_mo);
    garderMax("node_rss_mo", ligne.banc?.memoire && ligne.banc.memoire.rss / 1048576);
    garderMax("threads_connectes", ligne.compteurs?.Threads_connected);
    garderMax("ecoles_chargees", ligne.banc?.ecoles?.chargees);
    garderMax("connexions_pools", ligne.banc?.ecoles?.connexions);
    resume.releves += 1;
    resume.dernier = ligne;
    appendFileSync(fichier, `${JSON.stringify(ligne)}\n`);
};

const minuterie = setInterval(() => relever().catch(() => {}), 5000);
relever().catch(() => {});
console.log(`Relevés de la série « ${serie} » dans ${fichier} (Ctrl+C pour arrêter).`);

const finir = () => {
    clearInterval(minuterie);
    resume.fin = new Date().toISOString();
    // Une série où l'hôte a échangé de la mémoire avec le disque ne mesure que le disque (C-26).
    // Le processeur du banc saturé n'invalide rien : c'est ce que la montée en charge cherche ;
    // c'est le générateur de charge qui vérifie qu'il ne sature pas lui-même (charge.mjs).
    resume.valide = !resume.echange_actif;
    writeFileSync(join(dossier, "releves-resume.json"), JSON.stringify(resume, null, 2));
    console.log(`Résumé : ${JSON.stringify({ valide: resume.valide, max: resume.max, echange_actif: resume.echange_actif })}`);
    process.exit(0);
};
process.on("SIGINT", finir);
process.on("SIGTERM", finir);
