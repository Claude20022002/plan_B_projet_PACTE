/**
 * Opérations MySQL du banc PLA-06, dans le conteneur du banc : connexion root, copie d'une base
 * dans MySQL même (SHOW CREATE TABLE puis INSERT … SELECT, index et clés étrangères gardés, aucun
 * fichier d'export), un utilisateur par base (D-01), contrôles et vérification d'isolation.
 * mysql2 est pris dans les dépendances du serveur (/app/node_modules).
 */
import { createRequire } from "node:module";

const requireApp = createRequire("/app/package.json");
const mysql = requireApp("mysql2/promise");

const NOM_SUR = /^pla06_[a-z0-9_]+$/;
/** Nom de base ou d'utilisateur entre accents graves, après contrôle (seuls nos noms passent). */
const id = (nom) => {
    if (!NOM_SUR.test(nom)) throw new Error(`Nom refusé : ${nom}`);
    return `\`${nom}\``;
};

/** Paramètres de connexion à MySQL depuis le conteneur du banc. */
const cible = () => ({ host: process.env.DB_HOST || "mysql", port: Number(process.env.DB_PORT || 3306) });

/** Groupe de connexions root (concurrence des copies). */
export const poolRoot = (root, connexions = 4) =>
    mysql.createPool({ ...cible(), user: "root", password: root, connectionLimit: connexions, multipleStatements: false, dateStrings: true });

/** Connexion d'un utilisateur d'école (vérification d'isolation). */
export const connexionEcole = (nom, motDePasse) => mysql.createConnection({ ...cible(), user: nom, password: motDePasse, database: nom });

/** Recrée une base vide (la supprime si elle existe). */
export const recreerBase = async (pool, nom) => {
    await pool.query(`DROP DATABASE IF EXISTS ${id(nom)}`);
    await pool.query(`CREATE DATABASE ${id(nom)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
};

/** Tables de la base modèle et leur définition (SHOW CREATE TABLE), lues une fois pour toutes les copies. */
export const definitionsDesTables = async (pool, modele) => {
    const [lignes] = await pool.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME", [modele]);
    const definitions = [];
    for (const { t } of lignes) {
        const [[ligne]] = await pool.query(`SHOW CREATE TABLE ${id(modele)}.\`${t.replace(/`/g, "")}\``);
        definitions.push({ table: t, ddl: ligne["Create Table"] });
    }
    return definitions;
};

/**
 * Copie la base modèle dans `nom` : mêmes tables (index et clés étrangères compris), mêmes lignes.
 * Rend la durée en millisecondes.
 */
export const copierBase = async (pool, modele, nom, definitions) => {
    const debut = Date.now();
    const cnx = await pool.getConnection();
    try {
        await cnx.query("SET FOREIGN_KEY_CHECKS = 0");
        await cnx.query(`DROP DATABASE IF EXISTS ${id(nom)}`);
        await cnx.query(`CREATE DATABASE ${id(nom)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await cnx.query(`USE ${id(nom)}`);
        for (const { ddl } of definitions) await cnx.query(ddl);
        for (const { table } of definitions) {
            const t = `\`${table.replace(/`/g, "")}\``;
            await cnx.query(`INSERT INTO ${id(nom)}.${t} SELECT * FROM ${id(modele)}.${t}`);
        }
    } finally {
        await cnx.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
        cnx.release();
    }
    return Date.now() - debut;
};

/** Crée (ou remet) l'utilisateur MySQL de l'école, qui n'a de droits que sur sa base (D-01). */
export const creerUtilisateur = async (pool, nom, motDePasse) => {
    await pool.query("CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?", [nom, motDePasse]);
    await pool.query("ALTER USER ?@'%' IDENTIFIED BY ?", [nom, motDePasse]);
    await pool.query(`GRANT ALL PRIVILEGES ON ${id(nom)}.* TO ?@'%'`, [nom]);
};

/** Supprime les bases et utilisateurs du banc (nettoyage). */
export const toutSupprimer = async (pool) => {
    const [bases] = await pool.query("SELECT SCHEMA_NAME AS b FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'pla06\\_%'");
    for (const { b } of bases) await pool.query(`DROP DATABASE ${id(b)}`);
    const [utilisateurs] = await pool.query("SELECT User AS u FROM mysql.user WHERE User LIKE 'pla06\\_%'");
    for (const { u } of utilisateurs) await pool.query("DROP USER ?@'%'", [u]);
    return { bases: bases.length, utilisateurs: utilisateurs.length };
};

/** Nombre de tables, d'étudiants et de séances d'une base (contrôle de la préparation). */
export const compter = async (pool, nom) => {
    const [[{ tables }]] = await pool.query("SELECT COUNT(*) AS tables FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'", [nom]);
    const [[{ etudiants }]] = await pool.query(`SELECT COUNT(*) AS etudiants FROM ${id(nom)}.Users WHERE role = 'etudiant'`);
    const [[{ seances }]] = await pool.query(`SELECT COUNT(*) AS seances FROM ${id(nom)}.Affectations`);
    const [[{ envois }]] = await pool.query(`SELECT COUNT(*) AS envois FROM ${id(nom)}.EnvoisEdt`).catch(() => [[{ envois: null }]]);
    return { tables: Number(tables), etudiants: Number(etudiants), seances: Number(seances), envois: envois === null ? null : Number(envois) };
};

/**
 * Isolation (D-01) : l'utilisateur de l'école `a` lit sa base et se voit refuser celle de `b`.
 * Rend { lit: boolean, refuse: boolean, code }.
 */
export const verifierIsolement = async (nomA, motDePasseA, nomB) => {
    const cnx = await connexionEcole(nomA, motDePasseA);
    try {
        await cnx.query("SELECT COUNT(*) FROM Users");
        try {
            await cnx.query(`SELECT COUNT(*) FROM ${id(nomB)}.Users`);
            return { lit: true, refuse: false, code: null };
        } catch (erreur) {
            return { lit: true, refuse: ["ER_TABLEACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"].includes(erreur.code), code: erreur.code };
        }
    } finally {
        await cnx.end();
    }
};

/** Disque et tables (M7) : taille des bases du banc, nombre de tables, réglages de fichiers. */
export const mesurerDisque = async (pool) => {
    const [[taille]] = await pool.query(
        "SELECT COUNT(DISTINCT TABLE_SCHEMA) AS bases, COUNT(*) AS tables, ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1048576, 1) AS mo FROM information_schema.TABLES WHERE TABLE_SCHEMA LIKE 'pla06\\_ecole\\_%'"
    );
    const [variables] = await pool.query("SHOW GLOBAL VARIABLES WHERE Variable_name IN ('open_files_limit', 'table_open_cache', 'table_definition_cache', 'innodb_open_files', 'max_connections', 'innodb_buffer_pool_size')");
    return { ...taille, variables: Object.fromEntries(variables.map((v) => [v.Variable_name, v.Value])) };
};
