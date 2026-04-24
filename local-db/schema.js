/**
 * schema.js — Création et migration des tables SQLite
 *
 * Tables créées :
 *  - affectations   → planning des séances (modifiable offline)
 *  - cours          → référence (lecture seule, pull depuis serveur)
 *  - groupes        → référence
 *  - salles         → référence
 *  - creneaux       → référence
 *  - notifications  → lues localement
 *  - sync_log       → file d'attente des opérations à envoyer
 */

const { getDB } = require('./index');

function initDB() {
    const db = getDB();

    db.exec(`
        -- ── Affectations (modifiable offline) ─────────────────────────────────
        CREATE TABLE IF NOT EXISTS affectations (
            id_affectation      INTEGER PRIMARY KEY,
            date_seance         TEXT    NOT NULL,
            statut              TEXT    DEFAULT 'planifie',
            commentaire         TEXT,
            id_cours            INTEGER,
            id_groupe           INTEGER,
            id_user_enseignant  INTEGER,
            id_salle            INTEGER,
            id_creneau          INTEGER,
            id_user_admin       INTEGER,
            -- Métadonnées de synchronisation
            updated_at          TEXT    DEFAULT (datetime('now')),
            synced              INTEGER DEFAULT 1,   -- 1 = synchronisé, 0 = en attente
            _action             TEXT    DEFAULT 'none' -- create | update | delete | none
        );

        -- ── Cours (référence, pull depuis serveur) ──────────────────────────────
        CREATE TABLE IF NOT EXISTS cours (
            id_cours        INTEGER PRIMARY KEY,
            code_cours      TEXT,
            nom_cours       TEXT,
            type_cours      TEXT,
            niveau          TEXT,
            id_filiere      INTEGER,
            volume_horaire  INTEGER,
            coefficient     INTEGER,
            semestre        TEXT,
            updated_at      TEXT
        );

        -- ── Groupes ─────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS groupes (
            id_groupe       INTEGER PRIMARY KEY,
            nom_groupe      TEXT,
            niveau          TEXT,
            effectif        INTEGER,
            annee_scolaire  TEXT,
            id_filiere      INTEGER,
            updated_at      TEXT
        );

        -- ── Salles ──────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS salles (
            id_salle    INTEGER PRIMARY KEY,
            nom_salle   TEXT,
            type_salle  TEXT,
            capacite    INTEGER,
            batiment    TEXT,
            etage       INTEGER,
            disponible  INTEGER DEFAULT 1,
            updated_at  TEXT
        );

        -- ── Créneaux ────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS creneaux (
            id_creneau      INTEGER PRIMARY KEY,
            jour_semaine    TEXT,
            heure_debut     TEXT,
            heure_fin       TEXT,
            duree_minutes   INTEGER,
            updated_at      TEXT
        );

        -- ── Notifications (locales) ─────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS notifications (
            id_notification     INTEGER PRIMARY KEY,
            titre               TEXT,
            message             TEXT,
            type_notification   TEXT DEFAULT 'info',
            lue                 INTEGER DEFAULT 0,
            lien                TEXT,
            date_envoi          TEXT,
            updated_at          TEXT,
            synced              INTEGER DEFAULT 1
        );

        -- ── Journal de synchronisation ──────────────────────────────────────────
        -- Stocke chaque opération locale en attente d'être envoyée au serveur
        CREATE TABLE IF NOT EXISTS sync_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,  -- affectations | notifications
            entity_id   INTEGER,        -- NULL pour les créations avant réponse serveur
            action      TEXT NOT NULL,  -- create | update | delete
            payload     TEXT NOT NULL,  -- JSON complet de l'enregistrement
            synced      INTEGER DEFAULT 0,
            retry_count INTEGER DEFAULT 0,
            error_msg   TEXT,
            created_at  TEXT DEFAULT (datetime('now')),
            synced_at   TEXT
        );

        -- ── Index pour les performances ─────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_affectations_date    ON affectations(date_seance);
        CREATE INDEX IF NOT EXISTS idx_affectations_synced  ON affectations(synced);
        CREATE INDEX IF NOT EXISTS idx_sync_log_pending     ON sync_log(synced, retry_count);
    `);

    console.log('[SQLite] Schéma initialisé');
}

/**
 * Vide toutes les tables de référence (avant un pull complet)
 */
function clearReferenceData() {
    const db = getDB();
    db.exec(`DELETE FROM cours; DELETE FROM groupes; DELETE FROM salles; DELETE FROM creneaux;`);
}

module.exports = { initDB, clearReferenceData };
