/**
 * index.js — Instance SQLite via sql.js (pur JavaScript, sans compilation)
 *
 * sql.js est un port WebAssembly de SQLite — zéro dépendance native.
 * L'initialisation est async (chargement du WASM), puis toutes les opérations
 * sont synchrones. La base est persistée manuellement dans un fichier binaire.
 */

const path      = require('path');
const fs        = require('fs');
const { app }   = require('electron');
// sql.js installé dans root/node_modules (résolution standard Node.js)
const initSqlJs = require('sql.js');

let _db     = null;  // Instance sql.js
let _dbPath = null;  // Chemin du fichier .db sur disque

// ── Initialisation (appelée une seule fois au démarrage) ──────────────────────

async function initSqlDB() {
    _dbPath = path.join(app.getPath('userData'), 'hestim_local.db');

    // Fichier WASM dans root/node_modules/sql.js/dist/
    const sqlJsDistDir = path.join(__dirname, '../node_modules/sql.js/dist');
    const SQL = await initSqlJs({
        locateFile: (file) => path.join(sqlJsDistDir, file),
    });

    if (fs.existsSync(_dbPath)) {
        // Charger la base existante
        const buf = fs.readFileSync(_dbPath);
        _db = new SQL.Database(buf);
    } else {
        // Créer une nouvelle base
        _db = new SQL.Database();
    }

    // Activer les clés étrangères
    _db.run('PRAGMA foreign_keys = ON;');

    console.log('[SQLite] Base ouverte :', _dbPath);
    return _db;
}

// ── Accès à l'instance ────────────────────────────────────────────────────────

function getDB() {
    if (!_db) throw new Error('[SQLite] Base non initialisée — appeler initSqlDB() d\'abord');
    return _db;
}

/**
 * Persiste la base en mémoire sur disque.
 * À appeler après chaque écriture.
 */
function saveDB() {
    if (!_db || !_dbPath) return;
    try {
        const data = _db.export();
        fs.writeFileSync(_dbPath, Buffer.from(data));
    } catch (err) {
        console.error('[SQLite] Erreur sauvegarde :', err.message);
    }
}

// ── Helpers qui imitent l'API better-sqlite3 ──────────────────────────────────

/**
 * Exécute une requête et retourne tous les résultats.
 * @param {string} sql
 * @param {any[]}  params
 * @returns {object[]}
 */
function all(sql, params = []) {
    const db    = getDB();
    const stmt  = db.prepare(sql);
    const rows  = [];
    stmt.bind(params);
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

/**
 * Exécute une requête et retourne le premier résultat.
 */
function get(sql, params = []) {
    const rows = all(sql, params);
    return rows[0] || null;
}

/**
 * Exécute une requête sans résultat (INSERT / UPDATE / DELETE).
 * Sauvegarde automatiquement sur disque.
 */
function run(sql, params = []) {
    getDB().run(sql, params);
    saveDB();
}

/**
 * Exécute un bloc SQL (plusieurs instructions).
 * Sauvegarde automatiquement sur disque.
 */
function exec(sql) {
    getDB().run(sql);
    saveDB();
}

/**
 * Exécute une fonction dans une transaction.
 * Sauvegarde une seule fois à la fin (plus efficace).
 * @param {function} fn - Fonction contenant les opérations DB
 */
function transaction(fn) {
    const db = getDB();
    db.run('BEGIN');
    try {
        const result = fn();
        db.run('COMMIT');
        saveDB();
        return result;
    } catch (err) {
        db.run('ROLLBACK');
        throw err;
    }
}

module.exports = { initSqlDB, getDB, saveDB, all, get, run, exec, transaction };
