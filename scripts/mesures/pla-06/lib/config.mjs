/**
 * Réglages du banc PLA-06 : noms des écoles et de leurs bases, machines (.local/machines.json) et
 * secrets (.local/secrets.json). Le dossier .local est ignoré par Git : aucune adresse, aucun mot
 * de passe n'entre dans le dépôt, qui est public. Aucune dépendance : lisible sous Windows comme
 * dans le conteneur du banc.
 */
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Dossier du banc (scripts/mesures/pla-06). */
export const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
/** Dossier local, ignoré par Git : machines, secrets. */
export const LOCAL = join(RACINE, ".local");
/** Résultats bruts, ignorés par Git ; seuls leurs résumés vont dans le rapport. */
export const RESULTATS = join(RACINE, "resultats");

export const NB_ECOLES = 200;
export const BASE_MODELE = "pla06_modele";
export const BASE_VIERGE = "pla06_vierge";
export const PORT_BANC = 5099;

const trois = (n) => {
    if (!Number.isInteger(n) || n < 1 || n > 999) throw new RangeError(`Numéro d'école invalide : ${n}`);
    return String(n).padStart(3, "0");
};

/** Nom de la base et de l'utilisateur MySQL de l'école n (1 → pla06_ecole_001). */
export const nomEcole = (n) => `pla06_ecole_${trois(n)}`;

/** Nom d'hôte de l'école n : le générateur de charge le met dans l'en-tête Host. */
export const hoteEcole = (n) => `ecole-${trois(n)}.banc`;

/** Numéro d'école lu dans un nom d'hôte (« ecole-007.banc:5099 » → 7), ou null. */
export const numeroDeHote = (hote) => {
    const m = /^ecole-(\d{3})\.banc$/.exec(String(hote ?? "").split(":")[0]);
    return m ? Number(m[1]) : null;
};

/**
 * Mot de passe MySQL de l'école n, dérivé du secret maître (HMAC) : rien à stocker par école, et
 * la préparation comme le serveur de banc retrouvent le même.
 */
export const motDePasseEcole = (maitre, n) => createHmac("sha256", maitre).update(nomEcole(n)).digest("base64url").slice(0, 32);

const MEMOIRE = /^\d+(m|g)$/;
const ADRESSE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Vérifie le contenu de machines.json ; rend la liste des erreurs, vide si tout va bien. */
export function verifierMachines(m) {
    const erreurs = [];
    if (!m || typeof m !== "object") return ["machines.json doit contenir un objet"];
    const banc = m.banc ?? {};
    const adresse = ADRESSE.exec(String(banc.adresse ?? ""));
    if (!adresse || adresse.slice(1).some((o) => Number(o) > 255)) erreurs.push("banc.adresse : adresse IPv4 du PC du banc sur le réseau local");
    if (!Number.isInteger(banc.port) || banc.port < 1024 || banc.port > 65535) erreurs.push("banc.port : entier entre 1024 et 65535");
    if (banc.ssh !== undefined && !/^[\w.-]+@[\w.-]+$/.test(String(banc.ssh))) erreurs.push("banc.ssh : « utilisateur@machine », ou absent pour lancer à la main");
    if (typeof banc.depot !== "string" || !banc.depot) erreurs.push("banc.depot : dossier du dépôt Planner sur le PC du banc");
    const l = m.limites ?? {};
    for (const cle of ["mysqlMemoire", "bancMemoire"]) if (!MEMOIRE.test(String(l[cle] ?? ""))) erreurs.push(`limites.${cle} : « 1536m » ou « 2g »`);
    if (!MEMOIRE.test(String(l.innodbPool ?? "").toLowerCase())) erreurs.push("limites.innodbPool : « 512m » ou « 1g »");
    for (const cle of ["mysqlCpus", "bancCpus"]) if (!(typeof l[cle] === "number" && l[cle] > 0 && l[cle] <= 64)) erreurs.push(`limites.${cle} : nombre de processeurs, entre 0 et 64`);
    const f = l.fichiersOuverts;
    if (!Array.isArray(f) || f.length !== 2 || !f.every(Number.isInteger) || f[0] > f[1]) erreurs.push("limites.fichiersOuverts : [souple, maximum], ceux du serveur");
    return erreurs;
}

/** Lit un fichier JSON du dossier local, ou lève une erreur qui dit quoi faire. */
const lireLocal = (nom, conseil) => {
    const chemin = join(LOCAL, nom);
    if (!existsSync(chemin)) throw new Error(`${chemin} manquant : ${conseil}`);
    return JSON.parse(readFileSync(chemin, "utf8"));
};

/** Les machines du banc, vérifiées (README, « Machines »). */
export const lireMachines = () => {
    const m = lireLocal("machines.json", "copier machines.exemple.json et le remplir (README)");
    const erreurs = verifierMachines(m);
    if (erreurs.length) throw new Error(`machines.json invalide :\n- ${erreurs.join("\n- ")}`);
    return m;
};

/** Les secrets du banc (mot de passe root, secret maître, secrets de jetons). */
export const lireSecrets = () => lireLocal("secrets.json", "lancer d'abord « node preparer.mjs initialiser »");

/** Crée les secrets s'ils n'existent pas ; rend les secrets en place. Ne remplace jamais un fichier existant. */
export const initialiserSecrets = () => {
    const chemin = join(LOCAL, "secrets.json");
    if (existsSync(chemin)) return lireSecrets();
    const aleatoire = () => randomBytes(24).toString("base64url");
    const secrets = { root: aleatoire(), maitre: aleatoire(), jwt: aleatoire(), csrf: aleatoire() };
    mkdirSync(LOCAL, { recursive: true });
    writeFileSync(chemin, JSON.stringify(secrets, null, 2), { mode: 0o600 });
    // Fichier d'environnement de docker compose : le mot de passe root de MySQL seulement
    writeFileSync(join(LOCAL, "mesure.env"), `MESURE_MYSQL_ROOT=${secrets.root}\n`, { mode: 0o600 });
    return secrets;
};

/** Écrit un résultat brut (JSON) dans resultats/, hors de Git ; rend son chemin. */
export const ecrireResultat = (nom, donnees) => {
    mkdirSync(RESULTATS, { recursive: true });
    const chemin = join(RESULTATS, nom);
    writeFileSync(chemin, JSON.stringify(donnees, null, 2));
    return chemin;
};
