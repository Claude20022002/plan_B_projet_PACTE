/**
 * queries/affectations.js — CRUD local pour les affectations
 * Toutes les opérations de mutation créent une entrée dans sync_log
 * pour être envoyées au serveur dès que la connexion revient.
 */

const { getDB } = require('../index');

// ── Lecture ───────────────────────────────────────────────────────────────────

/**
 * Récupère les affectations depuis SQLite avec filtres optionnels.
 * @param {object} filters - { id_groupe?, id_user_enseignant?, date_from?, date_to? }
 */
function getAffectations(filters = {}) {
    const db = getDB();
    let sql = `SELECT * FROM affectations WHERE _action != 'delete'`;
    const params = [];

    if (filters.id_groupe) {
        sql += ' AND id_groupe = ?';
        params.push(filters.id_groupe);
    }
    if (filters.id_user_enseignant) {
        sql += ' AND id_user_enseignant = ?';
        params.push(filters.id_user_enseignant);
    }
    if (filters.date_from) {
        sql += ' AND date_seance >= ?';
        params.push(filters.date_from);
    }
    if (filters.date_to) {
        sql += ' AND date_seance <= ?';
        params.push(filters.date_to);
    }

    sql += ' ORDER BY date_seance ASC';
    return db.prepare(sql).all(...params);
}

// ── Écriture ──────────────────────────────────────────────────────────────────

/**
 * Crée ou met à jour une affectation localement.
 * Marque synced=0 et enregistre dans sync_log.
 */
function saveAffectation(data) {
    const db    = getDB();
    const now   = new Date().toISOString();
    const isNew = !data.id_affectation;

    const upsert = db.transaction(() => {
        let id_affectation;

        if (isNew) {
            // ID temporaire négatif pour éviter les conflits avec le serveur
            const tmpId = -(Date.now());
            db.prepare(`
                INSERT INTO affectations
                    (id_affectation, date_seance, statut, commentaire,
                     id_cours, id_groupe, id_user_enseignant, id_salle, id_creneau, id_user_admin,
                     updated_at, synced, _action)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')
            `).run(
                tmpId, data.date_seance, data.statut || 'planifie', data.commentaire || null,
                data.id_cours, data.id_groupe, data.id_user_enseignant,
                data.id_salle, data.id_creneau, data.id_user_admin,
                now
            );
            id_affectation = tmpId;
        } else {
            db.prepare(`
                UPDATE affectations SET
                    date_seance = ?, statut = ?, commentaire = ?,
                    id_cours = ?, id_groupe = ?, id_user_enseignant = ?,
                    id_salle = ?, id_creneau = ?,
                    updated_at = ?, synced = 0, _action = 'update'
                WHERE id_affectation = ?
            `).run(
                data.date_seance, data.statut, data.commentaire,
                data.id_cours, data.id_groupe, data.id_user_enseignant,
                data.id_salle, data.id_creneau,
                now, data.id_affectation
            );
            id_affectation = data.id_affectation;
        }

        // Enregistrer dans sync_log
        db.prepare(`
            INSERT INTO sync_log (entity_type, entity_id, action, payload, synced, created_at)
            VALUES ('affectations', ?, ?, ?, 0, ?)
        `).run(
            id_affectation,
            isNew ? 'create' : 'update',
            JSON.stringify({ ...data, id_affectation, updated_at: now }),
            now
        );

        return id_affectation;
    });

    return { id_affectation: upsert() };
}

/**
 * Marque une affectation comme supprimée localement (soft delete).
 */
function deleteAffectation(id_affectation) {
    const db  = getDB();
    const now = new Date().toISOString();

    db.transaction(() => {
        db.prepare(`
            UPDATE affectations
            SET synced=0, _action='delete', updated_at=?
            WHERE id_affectation=?
        `).run(now, id_affectation);

        db.prepare(`
            INSERT INTO sync_log (entity_type, entity_id, action, payload, synced, created_at)
            VALUES ('affectations', ?, 'delete', ?, 0, ?)
        `).run(id_affectation, JSON.stringify({ id_affectation }), now);
    })();
}

/**
 * Upsert depuis le serveur (pull) — remplace les données locales
 * uniquement si le serveur est plus récent (last-write-wins).
 */
function upsertFromServer(serverRecord) {
    const db = getDB();
    const local = db.prepare('SELECT * FROM affectations WHERE id_affectation=?')
                    .get(serverRecord.id_affectation);

    // Last-write-wins : on prend le serveur sauf si modif locale plus récente non synchronisée
    if (local && local.synced === 0) {
        const localTime  = new Date(local.updated_at).getTime();
        const serverTime = new Date(serverRecord.updatedAt || serverRecord.updated_at || 0).getTime();
        if (localTime > serverTime) return 'local_wins'; // garder la version locale
    }

    db.prepare(`
        INSERT INTO affectations
            (id_affectation, date_seance, statut, commentaire,
             id_cours, id_groupe, id_user_enseignant, id_salle, id_creneau, id_user_admin,
             updated_at, synced, _action)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'none')
        ON CONFLICT(id_affectation) DO UPDATE SET
            date_seance        = excluded.date_seance,
            statut             = excluded.statut,
            commentaire        = excluded.commentaire,
            id_cours           = excluded.id_cours,
            id_groupe          = excluded.id_groupe,
            id_user_enseignant = excluded.id_user_enseignant,
            id_salle           = excluded.id_salle,
            id_creneau         = excluded.id_creneau,
            id_user_admin      = excluded.id_user_admin,
            updated_at         = excluded.updated_at,
            synced             = 1,
            _action            = 'none'
    `).run(
        serverRecord.id_affectation,
        serverRecord.date_seance,
        serverRecord.statut,
        serverRecord.commentaire || null,
        serverRecord.id_cours,
        serverRecord.id_groupe,
        serverRecord.id_user_enseignant,
        serverRecord.id_salle,
        serverRecord.id_creneau,
        serverRecord.id_user_admin,
        serverRecord.updatedAt || serverRecord.updated_at || new Date().toISOString()
    );

    return 'server_wins';
}

// ── Helpers sync ──────────────────────────────────────────────────────────────

/** Retourne tous les enregistrements sync_log non synchronisés */
function getPendingSyncLogs() {
    const db = getDB();
    return db.prepare(`
        SELECT * FROM sync_log
        WHERE synced = 0 AND retry_count < 5
        ORDER BY created_at ASC
    `).all();
}

/** Marque un log comme synchronisé */
function markSyncLogDone(id) {
    getDB().prepare(`
        UPDATE sync_log SET synced=1, synced_at=datetime('now') WHERE id=?
    `).run(id);
}

/** Incrémente le compteur d'erreurs d'un log */
function incrementRetry(id, error) {
    getDB().prepare(`
        UPDATE sync_log SET retry_count=retry_count+1, error_msg=? WHERE id=?
    `).run(error, id);
}

/** Marque l'affectation comme synchronisée (après push réussi) */
function markAffectationSynced(tmpId, serverId) {
    const db = getDB();
    if (tmpId !== serverId) {
        // Mettre à jour l'ID temporaire avec l'ID réel du serveur
        db.prepare(`UPDATE affectations SET id_affectation=?, synced=1, _action='none' WHERE id_affectation=?`)
          .run(serverId, tmpId);
    } else {
        db.prepare(`UPDATE affectations SET synced=1, _action='none' WHERE id_affectation=?`)
          .run(serverId);
    }
}

module.exports = {
    getAffectations,
    saveAffectation,
    deleteAffectation,
    upsertFromServer,
    getPendingSyncLogs,
    markSyncLogDone,
    incrementRetry,
    markAffectationSynced,
};
