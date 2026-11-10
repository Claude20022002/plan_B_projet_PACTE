/**
 * Générateur de charge PLA-06 (M6, M4c), sur le PC qui envoie la charge, sans dépendance.
 * Déroulé : latence du réseau à vide ; contrôle d'isolation (chaque école voit sa base) ;
 * connexions étalées sur 2 min (application mobile : X-Client: mobile, une adresse par utilisateur) ;
 * contrôle « /moi non vide » (C-4) ; régime de P-17 (E écoles × U utilisateurs, une consultation
 * toutes les I s, chauffe non comptée) ; écoles froides (M4c) ; montée en charge jusqu'à p95 > 1 s.
 * Une réponse 429 ou un générateur saturé (> 90 % d'un cœur) invalide la série.
 * Usage : node charge.mjs --banc http://<adresse>:5099 --serie <nom> [--ecoles 20] [--utilisateurs 50]
 *         [--intervalle 30] [--duree 600] [--chauffe 120] [--froides 10] [--rampe]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RESULTATS, hoteEcole, nomEcole } from "./lib/config.mjs";
import { lundiDe } from "./lib/seances.mjs";
import { estErreur, resumer } from "./lib/stats.mjs";
import { attendre, ipVirtuelle, requete } from "./lib/http.mjs";

const args = process.argv.slice(2);
const option = (nom, defaut) => (args.includes(`--${nom}`) ? args[args.indexOf(`--${nom}`) + 1] : defaut);
const BANC = option("banc", null);
const SERIE = option("serie", `serie-${Date.now()}`);
const E = Number(option("ecoles", 20));
const U = Number(option("utilisateurs", 50));
const I = Number(option("intervalle", 30)) * 1000;
const DUREE = Number(option("duree", 600)) * 1000;
const CHAUFFE = Number(option("chauffe", 120)) * 1000;
const FROIDES = Number(option("froides", 10));
const MOT_DE_PASSE = "password123"; // celui de seed.js, données de démonstration locales
if (!BANC) throw new Error("--banc http://<adresse du PC du banc>:5099 est obligatoire");

const journal = (m) => console.log(`[charge ${new Date().toISOString().slice(11, 19)}] ${m}`);
const resultat = { serie: SERIE, banc: BANC, ecoles: E, utilisateurs: U, intervalle_s: I / 1000, debut: new Date().toISOString(), invalide: [] };
const echec = (raison) => {
    resultat.invalide.push(raison);
    journal(`SÉRIE INVALIDE : ${raison}`);
};

/** La semaine en cours (du lundi au dimanche), que l'étudiant consulte. */
const lundi = lundiDe(new Date());
const dimanche = new Date(`${lundi}T00:00:00Z`);
dimanche.setUTCDate(dimanche.getUTCDate() + 6);
const CHEMIN_MOI = `/api/emplois-du-temps/moi?du=${lundi}&au=${dimanche.toISOString().slice(0, 10)}`;

/** Bilan d'une liste de réponses : résumé des durées, erreurs (S4), statuts. */
const bilan = (reponses) => {
    const statuts = {};
    for (const r of reponses) statuts[r.statut ?? (r.delaiDepasse ? "delai" : "refus")] = (statuts[r.statut ?? (r.delaiDepasse ? "delai" : "refus")] ?? 0) + 1;
    const erreurs = reponses.filter(estErreur).length;
    return { ...resumer(reponses.map((r) => r.ms)), erreurs, taux_erreur: reponses.length ? erreurs / reponses.length : 0, statuts };
};

const verifier429 = (reponses, phase) => {
    if (reponses.some((r) => r.statut === 429)) echec(`réponse 429 pendant ${phase} : une limite de requêtes a joué (C-3)`);
    // Un 401 répond vite et ferait croire à un serveur rapide : jeton expiré ou session perdue
    if (phase !== "les connexions" && reponses.some((r) => r.statut === 401)) echec(`réponse 401 pendant ${phase} : jeton expiré ou session perdue`);
};

// 1. Latence du réseau à vide (route de santé du banc, sans base)
const sante = [];
for (let i = 0; i < 50; i++) sante.push(await requete(BANC, { chemin: "/banc/sante", lireCorps: i === 0 }));
resultat.reseau_a_vide = bilan(sante);
resultat.banc = sante[0].corps;
journal(`banc : mode ${resultat.banc?.mode}, ${resultat.banc?.ecoles} écoles ; réseau à vide p50 ${resultat.reseau_a_vide.p50} ms`);

// 2. Isolation : chaque école active voit sa propre base à travers les résolveurs
for (let k = 1; k <= E; k++) {
    const r = await requete(BANC, { chemin: "/banc/base", hote: hoteEcole(k), lireCorps: true });
    if (r.corps?.base !== nomEcole(k)) echec(`école ${k} : base vue « ${r.corps?.base} », attendue « ${nomEcole(k)} »`);
}

// 3. Comptes des étudiants (les mêmes dans chaque base, copiées de la base modèle)
const { corps: lesEtudiants } = await requete(BANC, { chemin: `/banc/etudiants?n=${U}`, hote: hoteEcole(1), lireCorps: true });
const emails = lesEtudiants?.emails ?? [];
if (emails.length < U) echec(`${emails.length} étudiants seulement dans la base, ${U} demandés`);

// 4. Connexions, étalées sur 2 minutes
const utilisateurs = [];
const connexions = [];
const pas = 120_000 / Math.max(1, E * U);
await Promise.all(
    Array.from({ length: E * U }, async (_, i) => {
        const k = 1 + Math.floor(i / U);
        const u = i % U;
        await attendre(i * pas);
        const r = await requete(BANC, { methode: "POST", chemin: "/api/auth/login", hote: hoteEcole(k), ip: ipVirtuelle(k, u), corps: { email: emails[u], password: MOT_DE_PASSE }, lireCorps: true });
        connexions.push(r);
        if (r.corps?.access_token) utilisateurs.push({ k, u, jeton: r.corps.access_token, ip: ipVirtuelle(k, u) });
    })
);
resultat.connexions = bilan(connexions);
verifier429(connexions, "les connexions");
if (utilisateurs.length < E * U) echec(`${E * U - utilisateurs.length} connexion(s) refusée(s)`);
journal(`${utilisateurs.length} utilisateurs connectés ; connexion p95 ${resultat.connexions.p95} ms`);

// 5. Contrôle C-4 : l'emploi du temps de la semaine n'est pas vide
for (let k = 1; k <= E; k++) {
    const temoin = utilisateurs.find((x) => x.k === k);
    const r = temoin && (await requete(BANC, { chemin: CHEMIN_MOI, hote: hoteEcole(k), ip: temoin.ip, jeton: temoin.jeton, lireCorps: true }));
    if (!r?.corps?.seances?.length) echec(`école ${k} : /moi ne renvoie aucune séance (mois publiés ? C-4)`);
}

// 6. Régime (P-17) : chaque utilisateur consulte /moi toutes les I secondes, départs décalés
const cpuDebut = process.cpuUsage();
const t0 = Date.now();
const regime = [];
await Promise.all(
    utilisateurs.map(async (x) => {
        await attendre(Math.random() * I);
        while (Date.now() - t0 < CHAUFFE + DUREE) {
            const avant = Date.now();
            const r = await requete(BANC, { chemin: CHEMIN_MOI, hote: hoteEcole(x.k), ip: x.ip, jeton: x.jeton });
            if (avant - t0 >= CHAUFFE) regime.push(r);
            await attendre(Math.max(0, I - (Date.now() - avant)));
        }
    })
);
const cpu = process.cpuUsage(cpuDebut);
resultat.generateur_cpu = Math.round((100 * (cpu.user + cpu.system)) / 1000 / (Date.now() - t0));
if (resultat.generateur_cpu > 90) echec(`le générateur a pris ${resultat.generateur_cpu} % d'un cœur : c'est lui qui limite`);
resultat.regime = { ...bilan(regime), debit_par_s: Math.round((regime.length / (DUREE / 1000)) * 10) / 10 };
verifier429(regime, "le régime");
journal(`régime : ${regime.length} consultations, p95 ${resultat.regime.p95} ms, ${resultat.regime.erreurs} erreur(s)`);

// 7. M4c : première requête d'écoles inactives (chargement indiqué par X-Banc-Chargement-Ms)
resultat.froides = [];
for (let k = E + 1; k <= Math.min(E + FROIDES, resultat.banc?.ecoles ?? E); k++) {
    const r = await requete(BANC, { methode: "POST", chemin: "/api/auth/login", hote: hoteEcole(k), ip: ipVirtuelle(k, 0), corps: { email: emails[0], password: MOT_DE_PASSE } });
    resultat.froides.push({ ecole: k, ms: Math.round(r.ms), chargement_ms: Number(r.entetes["x-banc-chargement-ms"] ?? 0), statut: r.statut });
}

// 8. Montée en charge (--rampe) : débit fixé, palier d'une minute, jusqu'à p95 > 1 s ou 1 % d'erreurs
if (args.includes("--rampe")) {
    resultat.rampe = [];
    const base = Math.max(1, Math.round(utilisateurs.length / (I / 1000)));
    for (const facteur of [1, 2, 3, 4, 6, 8, 12, 16, 24]) {
        const debit = base * facteur;
        const reponses = [];
        const fin = Date.now() + 60_000;
        let i = 0;
        const enVol = [];
        while (Date.now() < fin) {
            const x = utilisateurs[i++ % utilisateurs.length];
            enVol.push(requete(BANC, { chemin: CHEMIN_MOI, hote: hoteEcole(x.k), ip: x.ip, jeton: x.jeton }).then((r) => reponses.push(r)));
            await attendre(1000 / debit);
        }
        await Promise.all(enVol);
        const b = { debit_vise: debit, debit_obtenu: Math.round(reponses.length / 60), ...bilan(reponses) };
        resultat.rampe.push(b);
        journal(`rampe ${debit}/s : p95 ${b.p95} ms, ${b.erreurs} erreur(s)`);
        verifier429(reponses, `la rampe à ${debit}/s`);
        if (b.p95 > 1000 || b.taux_erreur > 0.01) break;
    }
    const tenus = resultat.rampe.filter((b) => b.p95 <= 1000 && b.taux_erreur <= 0.01);
    resultat.capacite_par_s = tenus.length ? tenus.at(-1).debit_obtenu : 0;
}

resultat.fin = new Date().toISOString();
resultat.valide = resultat.invalide.length === 0;
const dossier = join(RESULTATS, SERIE);
mkdirSync(dossier, { recursive: true });
writeFileSync(join(dossier, "charge.json"), JSON.stringify(resultat, null, 2));
journal(`${resultat.valide ? "série valide" : "SÉRIE INVALIDE"} ; résultat : ${join(dossier, "charge.json")}`);
process.exit(resultat.valide ? 0 : 1);
