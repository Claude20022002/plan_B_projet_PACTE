/**
 * conflict.js — Résolution de conflits : Last-Write-Wins
 *
 * Stratégie choisie : LAST-WRITE-WINS basé sur updated_at
 *
 * Pourquoi :
 *  - Simple à implémenter et à comprendre
 *  - Adapté au planning scolaire : l'admin a toujours le dernier mot
 *  - Évite les conflits complexes à résoudre manuellement
 *
 * Règle :
 *  - Si updated_at_local > updated_at_server  → version locale gagne (push)
 *  - Si updated_at_server >= updated_at_local → version serveur gagne (pull)
 *  - Si synced_local = 1                       → jamais de conflit, serveur gagne toujours
 */

const log = require('./logger');

/**
 * Détermine quelle version doit gagner.
 * @param {object} local  - Enregistrement local { updated_at, synced }
 * @param {object} server - Enregistrement serveur { updatedAt }
 * @returns {'local'|'server'}
 */
function resolveConflict(local, server) {
    // Si l'enregistrement local est synchronisé, pas de conflit
    if (local.synced === 1) return 'server';

    const localTime  = local.updated_at  ? new Date(local.updated_at).getTime()  : 0;
    const serverTime = server.updatedAt  ? new Date(server.updatedAt).getTime()  :
                       server.updated_at ? new Date(server.updated_at).getTime() : 0;

    if (localTime > serverTime) {
        log.warn('Conflit LWW : version locale gagne', {
            local_ts:  local.updated_at,
            server_ts: server.updatedAt || server.updated_at,
        });
        return 'local';
    }

    return 'server';
}

module.exports = { resolveConflict };
