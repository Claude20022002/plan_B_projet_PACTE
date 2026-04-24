/**
 * push.js — Envoi des données locales non synchronisées vers le serveur
 *
 * Flux :
 *  1. Lire sync_log WHERE synced=0 AND retry_count<5
 *  2. Pour chaque entrée, appeler l'API appropriée (POST/PUT/DELETE)
 *  3. En cas de succès : marquer synced=1 + mettre à jour l'ID si nécessaire
 *  4. En cas d'échec  : incrémenter retry_count
 */

// fetch est natif dans Node 18+ — pas d'import nécessaire
const log = require('./logger');
const {
    getPendingSyncLogs,
    markSyncLogDone,
    incrementRetry,
    markAffectationSynced,
} = require('../local-db/queries/affectations');

/**
 * Envoie toutes les opérations en attente vers le serveur.
 * @param {string} apiBase - URL de base ex: 'http://localhost:5000/api'
 * @param {string} token   - JWT d'authentification
 * @returns {{ pushed: number, failed: number }}
 */
async function pushToServer(apiBase, token) {
    const pending = getPendingSyncLogs();
    if (!pending.length) return { pushed: 0, failed: 0 };

    log.sync(`PUSH : ${pending.length} opération(s) en attente`);

    let pushed = 0;
    let failed = 0;

    for (const logEntry of pending) {
        try {
            const payload  = JSON.parse(logEntry.payload);
            const endpoint = `${apiBase}/${logEntry.entity_type}`;
            const isTemp   = logEntry.entity_id < 0; // ID temporaire négatif

            let response, result;

            if (logEntry.action === 'create') {
                // POST — créer sur le serveur
                const body = { ...payload };
                delete body.id_affectation; // Laisser le serveur générer l'ID
                delete body.synced;
                delete body._action;

                response = await apiFetch('POST', endpoint, body, token);
                result   = await response.json();

                // Mettre à jour l'ID local avec l'ID réel du serveur
                if (response.ok && result.affectation?.id_affectation) {
                    markAffectationSynced(logEntry.entity_id, result.affectation.id_affectation);
                }

            } else if (logEntry.action === 'update') {
                response = await apiFetch('PUT', `${endpoint}/${logEntry.entity_id}`, payload, token);
                if (response.ok) markAffectationSynced(logEntry.entity_id, logEntry.entity_id);

            } else if (logEntry.action === 'delete') {
                response = await apiFetch('DELETE', `${endpoint}/${logEntry.entity_id}`, null, token);
            }

            if (response.ok) {
                markSyncLogDone(logEntry.id);
                pushed++;
                log.sync(`PUSH OK [${logEntry.action}] ${logEntry.entity_type}/${logEntry.entity_id}`);
            } else {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status} : ${errText}`);
            }

        } catch (err) {
            failed++;
            incrementRetry(logEntry.id, err.message);
            log.error(`PUSH FAIL [${logEntry.action}] ${logEntry.entity_type}/${logEntry.entity_id}`, { error: err.message });
        }
    }

    log.sync(`PUSH terminé : ${pushed} ok, ${failed} echec(s)`);
    return { pushed, failed };
}

async function apiFetch(method, url, body, token) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts);
}

module.exports = { pushToServer };
