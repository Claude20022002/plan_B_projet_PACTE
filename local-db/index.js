/**
 * index.js — Instance SQLite partagée (singleton)
 * Utilise better-sqlite3 : synchrone, performant, pas de callback hell.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const { app }  = require('electron');

let db = null;

/**
 * Retourne l'instance DB (crée si nécessaire).
 * Le fichier est stocké dans le dossier userData d'Electron
 * (~/.config/hestim-planner/ sous Linux, %APPDATA% sous Windows)
 */
function getDB() {
    if (db) return db;

    const dbPath = path.join(app.getPath('userData'), 'hestim_local.db');
    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });

    // Activer WAL pour de meilleures performances en lecture/écriture
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    console.log('[SQLite] Base ouverte :', dbPath);
    return db;
}

module.exports = { getDB };
