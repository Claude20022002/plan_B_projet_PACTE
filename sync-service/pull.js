/**
 * pull.js — Récupération des données du serveur vers la base locale
 *
 * Flux :
 *  1. Pour chaque entité, lire le timestamp de la dernière sync
 *  2. GET /api/{entity}?updated_after=timestamp
 *  3. Upsert chaque enregistrement en local (last-write-wins)
 *  4. Mettre à jour le timestamp de dernière sync
 */

// fetch est natif dans Node 18+ — pas d'import nécessaire
const log = require('./logger');
const { upsertFromServer }       = require('../local-db/queries/affectations');
const { upsertManyReference, getLastUpdated } = require('../local-db/queries/reference');

const ENTITIES = [
    { name: 'cours',       endpoint: 'cours',       upsert: (r) => upsertManyReference('cours',    r) },
    { name: 'groupes',     endpoint: 'groupes',     upsert: (r) => upsertManyReference('groupes',  r) },
    { name: 'salles',      endpoint: 'salles',       upsert: (r) => upsertManyReference('salles',   r) },
    { name: 'creneaux',    endpoint: 'creneaux',     upsert: (r) => upsertManyReference('creneaux', r) },
    {
        name: 'affectations',
        endpoint: 'affectations',
        upsert: (records) => {
            let wins = { local: 0, server: 0 };
            for (const r of records) {
                const result = upsertFromServer(r);
                if (result === 'local_wins') wins.local++;
                else wins.server++;
            }
            return wins;
        },
    },
];

/**
 * Tire toutes les entités du serveur.
 * @param {string} apiBase     - URL de base
 * @param {string} token       - JWT
 * @param {string} lastSyncAt  - ISO timestamp de la dernière sync globale
 * @returns {{ total: number, entities: object }}
 */
async function pullFromServer(apiBase, token, lastSyncAt) {
    log.sync(`PULL depuis ${lastSyncAt || 'beginning'}`);

    const stats = {};
    let total   = 0;

    for (const entity of ENTITIES) {
        try {
            // Utiliser updated_after incrémental (plus efficace)
            const localTs    = getLastUpdatedForEntity(entity.name, lastSyncAt);
            const url        = `${apiBase}/${entity.endpoint}?updated_after=${encodeURIComponent(localTs)}&limit=5000`;
            const response   = await apiFetch(url, token);

            if (!response.ok) {
                log.warn(`PULL skip ${entity.name} : HTTP ${response.status}`);
                continue;
            }

            const json    = await response.json();
            const records = json.data || json || [];

            if (!records.length) {
                stats[entity.name] = 0;
                continue;
            }

            const result = entity.upsert(records);
            const count  = Array.isArray(records) ? records.length : 0;
            stats[entity.name] = count;
            total += count;

            log.sync(`PULL ${entity.name} : ${count} enregistrement(s)`, result);

        } catch (err) {
            log.error(`PULL FAIL ${entity.name}`, { error: err.message });
            stats[entity.name] = -1;
        }
    }

    log.sync(`PULL terminé : ${total} enregistrement(s) au total`, stats);
    return { total, entities: stats };
}

function getLastUpdatedForEntity(entityName, fallback) {
    try {
        if (['cours','groupes','salles','creneaux'].includes(entityName)) {
            return getLastUpdated(entityName) || fallback || '1970-01-01T00:00:00.000Z';
        }
    } catch { /* ignore */ }
    return fallback || '1970-01-01T00:00:00.000Z';
}

async function apiFetch(url, token) {
    return fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
    });
}

module.exports = { pullFromServer };
