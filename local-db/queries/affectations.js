/**
 * queries/affectations.js — CRUD local pour les affectations (sql.js)
 */

const { all, get, run, transaction } = require('../index');

// ── Lecture ───────────────────────────────────────────────────────────────────

function getAffectations(filters = {}) {
    let sql    = `SELECT * FROM affectations WHERE _action != 'delete'`;
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
    return all(sql, params);
}

// ── Écriture ──────────────────────────────────────────────────────────────────

function saveAffectation(data) {
    const now   = new Date().toISOString();
    const isNew = !data.id_affectation;

    return transaction(() => {
        let id_affectation;

        if (isNew) {
            const tmpId = -(Date.now());
            run(`
                INSERT INTO affectations
                    (id_affectation, date_seance, statut, commentaire,
                     id_cours, id_groupe, id_user_enseignant, id_salle, id_creneau, id_user_admin,
                     updated_at, synced, _action)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,0,'create')`,
                [tmpId, data.date_seance, data.statut || 'planifie', data.commentaire || null,
                 data.id_cours, data.id_groupe, data.id_user_enseignant,
                 data.id_salle, data.id_creneau, data.id_user_admin, now]
            );
            id_affectation = tmpId;
        } else {
            run(`
                UPDATE affectations SET
                    date_seance=?, statut=?, commentaire=?,
                    id_cours=?, id_groupe=?, id_user_enseignant=?,
                    id_salle=?, id_creneau=?, updated_at=?, synced=0, _action='update'
                WHERE id_affectation=?`,
                [data.date_seance, data.statut, data.commentaire,
                 data.id_cours, data.id_groupe, data.id_user_enseignant,
                 data.id_salle, data.id_creneau, now, data.id_affectation]
            );
            id_affectation = data.id_affectation;
        }

        run(`INSERT INTO sync_log (entity_type, entity_id, action, payload, synced, created_at)
             VALUES ('affectations', ?, ?, ?, 0, ?)`,
            [id_affectation, isNew ? 'create' : 'update',
             JSON.stringify({ ...data, id_affectation, updated_at: now }), now]
        );

        return id_affectation;
    });
}

function deleteAffectation(id_affectation) {
    const now = new Date().toISOString();
    transaction(() => {
        run(`UPDATE affectations SET synced=0, _action='delete', updated_at=? WHERE id_affectation=?`,
            [now, id_affectation]);
        run(`INSERT INTO sync_log (entity_type, entity_id, action, payload, synced, created_at)
             VALUES ('affectations', ?, 'delete', ?, 0, ?)`,
            [id_affectation, JSON.stringify({ id_affectation }), now]);
    });
}

/**
 * Upsert depuis le serveur — Last-write-wins.
 */
function upsertFromServer(serverRecord) {
    const local = get('SELECT * FROM affectations WHERE id_affectation=?',
                       [serverRecord.id_affectation]);

    if (local && local.synced === 0) {
        const localTime  = new Date(local.updated_at).getTime();
        const serverTime = new Date(serverRecord.updatedAt || serverRecord.updated_at || 0).getTime();
        if (localTime > serverTime) return 'local_wins';
    }

    run(`
        INSERT INTO affectations
            (id_affectation, date_seance, statut, commentaire,
             id_cours, id_groupe, id_user_enseignant, id_salle, id_creneau, id_user_admin,
             updated_at, synced, _action)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'none')
        ON CONFLICT(id_affectation) DO UPDATE SET
            date_seance=excluded.date_seance, statut=excluded.statut,
            commentaire=excluded.commentaire, id_cours=excluded.id_cours,
            id_groupe=excluded.id_groupe, id_user_enseignant=excluded.id_user_enseignant,
            id_salle=excluded.id_salle, id_creneau=excluded.id_creneau,
            id_user_admin=excluded.id_user_admin, updated_at=excluded.updated_at,
            synced=1, _action='none'`,
        [serverRecord.id_affectation, serverRecord.date_seance, serverRecord.statut,
         serverRecord.commentaire || null, serverRecord.id_cours, serverRecord.id_groupe,
         serverRecord.id_user_enseignant, serverRecord.id_salle, serverRecord.id_creneau,
         serverRecord.id_user_admin,
         serverRecord.updatedAt || serverRecord.updated_at || new Date().toISOString()]
    );

    return 'server_wins';
}

// ── Helpers sync ──────────────────────────────────────────────────────────────

function getPendingSyncLogs() {
    return all(`SELECT * FROM sync_log WHERE synced=0 AND retry_count<5 ORDER BY created_at ASC`);
}

function markSyncLogDone(id) {
    run(`UPDATE sync_log SET synced=1, synced_at=datetime('now') WHERE id=?`, [id]);
}

function incrementRetry(id, error) {
    run(`UPDATE sync_log SET retry_count=retry_count+1, error_msg=? WHERE id=?`, [error, id]);
}

function markAffectationSynced(tmpId, serverId) {
    if (tmpId !== serverId) {
        run(`UPDATE affectations SET id_affectation=?, synced=1, _action='none' WHERE id_affectation=?`,
            [serverId, tmpId]);
    } else {
        run(`UPDATE affectations SET synced=1, _action='none' WHERE id_affectation=?`, [serverId]);
    }
}

module.exports = {
    getAffectations, saveAffectation, deleteAffectation, upsertFromServer,
    getPendingSyncLogs, markSyncLogDone, incrementRetry, markAffectationSynced,
};
