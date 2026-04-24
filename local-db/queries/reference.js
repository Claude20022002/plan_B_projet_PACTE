/**
 * queries/reference.js — Données de référence (sql.js)
 */

const { all, run, get, transaction } = require('../index');

const TABLE_CONFIGS = {
    cours: {
        pk: 'id_cours',
        fields: ['id_cours','code_cours','nom_cours','type_cours','niveau','id_filiere',
                 'volume_horaire','coefficient','semestre','updated_at'],
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

function upsertReference(table, record) {
    const cfg = TABLE_CONFIGS[table];
    if (!cfg) throw new Error(`Table inconnue : ${table}`);

    const updatedAt = record.updatedAt || record.updated_at || new Date().toISOString();
    const values    = cfg.fields.map(f => f === 'updated_at' ? updatedAt : (record[f] ?? null));
    const setClauses = cfg.fields
        .filter(f => f !== cfg.pk)
        .map(f => `${f}=excluded.${f}`)
        .join(', ');

    run(`
        INSERT INTO ${table} (${cfg.fields.join(',')})
        VALUES (${cfg.fields.map(() => '?').join(',')})
        ON CONFLICT(${cfg.pk}) DO UPDATE SET ${setClauses}`,
        values
    );
}

function upsertManyReference(table, records) {
    transaction(() => {
        for (const r of records) upsertReference(table, r);
    });
}

function getLastUpdated(table) {
    const row = get(`SELECT MAX(updated_at) as ts FROM ${table}`);
    return row?.ts || '1970-01-01T00:00:00.000Z';
}

function getCours()    { return all('SELECT * FROM cours ORDER BY nom_cours'); }
function getGroupes()  { return all('SELECT * FROM groupes ORDER BY nom_groupe'); }
function getSalles()   { return all('SELECT * FROM salles ORDER BY nom_salle'); }
function getCreneaux() { return all('SELECT * FROM creneaux ORDER BY jour_semaine, heure_debut'); }

module.exports = {
    upsertReference, upsertManyReference, getLastUpdated,
    getCours, getGroupes, getSalles, getCreneaux,
};
