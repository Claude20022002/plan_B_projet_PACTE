/**
 * queries/reference.js — Données de référence (cours, groupes, salles, créneaux)
 * Ces tables sont en lecture seule côté client — elles viennent du serveur via pull.
 */

const { getDB } = require('../index');

// ── Upsert générique ──────────────────────────────────────────────────────────

/**
 * Upsert un enregistrement dans une table de référence.
 * @param {'cours'|'groupes'|'salles'|'creneaux'} table
 * @param {object} record - Enregistrement venant du serveur
 */
function upsertReference(table, record) {
    const db = getDB();
    const updatedAt = record.updatedAt || record.updated_at || new Date().toISOString();

    const columns = {
        cours: {
            pk: 'id_cours',
            fields: ['id_cours','code_cours','nom_cours','type_cours','niveau','id_filiere','volume_horaire','coefficient','semestre','updated_at'],
        },
        groupes: {
            pk: 'id_groupe',
            fields: ['id_groupe','nom_groupe','niveau','effectif','annee_scolaire','id_filiere','updated_at'],
        },
        salles: {
            pk: 'id_salle',
            fields: ['id_salle','nom_salle','type_salle','capacite','batiment','etage','disponible','updated_at'],
        },
        creneaux: {
            pk: 'id_creneau',
            fields: ['id_creneau','jour_semaine','heure_debut','heure_fin','duree_minutes','updated_at'],
        },
    };

    const { pk, fields } = columns[table];
    if (!fields) throw new Error(`Table inconnue : ${table}`);

    const values = fields.map(f => f === 'updated_at' ? updatedAt : (record[f] ?? null));
    const setClauses = fields.filter(f => f !== pk).map(f => `${f}=excluded.${f}`).join(', ');

    db.prepare(`
        INSERT INTO ${table} (${fields.join(',')})
        VALUES (${fields.map(() => '?').join(',')})
        ON CONFLICT(${pk}) DO UPDATE SET ${setClauses}
    `).run(...values);
}

/** Upsert en masse pour un tableau de records */
function upsertManyReference(table, records) {
    const db = getDB();
    const upsertOne = db.transaction((recs) => {
        for (const r of recs) upsertReference(table, r);
    });
    upsertOne(records);
}

// ── Lecture ───────────────────────────────────────────────────────────────────

function getCours()    { return getDB().prepare('SELECT * FROM cours ORDER BY nom_cours').all(); }
function getGroupes()  { return getDB().prepare('SELECT * FROM groupes ORDER BY nom_groupe').all(); }
function getSalles()   { return getDB().prepare('SELECT * FROM salles ORDER BY nom_salle').all(); }
function getCreneaux() { return getDB().prepare('SELECT * FROM creneaux ORDER BY jour_semaine, heure_debut').all(); }

// ── Timestamps pour le pull incrémental ──────────────────────────────────────

/**
 * Retourne le max(updated_at) pour une table de référence.
 * Utilisé pour le pull incrémental (updated_after).
 */
function getLastUpdated(table) {
    const row = getDB().prepare(`SELECT MAX(updated_at) as ts FROM ${table}`).get();
    return row?.ts || '1970-01-01T00:00:00.000Z';
}

module.exports = {
    upsertReference,
    upsertManyReference,
    getLastUpdated,
    getCours,
    getGroupes,
    getSalles,
    getCreneaux,
};
