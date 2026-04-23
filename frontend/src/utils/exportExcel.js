import * as XLSX from 'xlsx';

/**
 * Exporte un tableau de données vers un fichier Excel (.xlsx).
 *
 * @param {Object[]} data     - Tableau d'objets à exporter
 * @param {Object[]} columns  - Définition des colonnes :
 *   { header: string, accessor: (row) => value | key: string, width?: number }
 * @param {string}   filename - Nom du fichier (sans extension ni date)
 * @param {string}   [sheetName='Export'] - Nom de l'onglet Excel
 */
export function exportToExcel(data, columns, filename, sheetName = 'Export') {
    if (!data?.length) return;

    const headers = columns.map(c => c.header);

    const rows = data.map(item =>
        columns.map(c => {
            const val = typeof c.accessor === 'function'
                ? c.accessor(item)
                : item[c.key];
            return val ?? '';
        })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Largeurs de colonnes
    ws['!cols'] = columns.map(c => ({ wch: c.width || 22 }));

    // Style en-tête : gras (fonctionne avec XLSX Pro — ignoré en version CE)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9E1F2' } } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // max 31 chars

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `HESTIM_${filename}_${date}.xlsx`);
}

/**
 * Exporte plusieurs feuilles dans un seul fichier Excel.
 *
 * @param {Array<{name, data, columns}>} sheets
 * @param {string} filename
 */
export function exportMultiSheet(sheets, filename) {
    const wb = XLSX.utils.book_new();

    for (const { name, data, columns } of sheets) {
        if (!data?.length) continue;
        const headers = columns.map(c => c.header);
        const rows = data.map(item =>
            columns.map(c => {
                const val = typeof c.accessor === 'function' ? c.accessor(item) : item[c.key];
                return val ?? '';
            })
        );
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws['!cols'] = columns.map(c => ({ wch: c.width || 22 }));
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `HESTIM_${filename}_${date}.xlsx`);
}

// ── Colonnes prédéfinies pour chaque entité ────────────────────────────────────

export const COLS_ENSEIGNANTS = [
    { header: 'Nom',          accessor: r => r.user?.nom || r.nom || '',          width: 20 },
    { header: 'Prénom',       accessor: r => r.user?.prenom || r.prenom || '',    width: 20 },
    { header: 'Email',        accessor: r => r.user?.email || r.email || '',      width: 30 },
    { header: 'Téléphone',    accessor: r => r.user?.telephone || '',             width: 18 },
    { header: 'Spécialité',   accessor: r => r.specialite || '',                  width: 28 },
    { header: 'Département',  accessor: r => r.departement || '',                 width: 22 },
    { header: 'Grade',        accessor: r => r.grade || '',                       width: 22 },
    { header: 'Bureau',       accessor: r => r.bureau || '',                      width: 14 },
];

export const COLS_ETUDIANTS = [
    { header: 'Nom',              accessor: r => r.user?.nom || '',              width: 20 },
    { header: 'Prénom',           accessor: r => r.user?.prenom || '',           width: 20 },
    { header: 'Email',            accessor: r => r.user?.email || '',            width: 30 },
    { header: 'Téléphone',        accessor: r => r.user?.telephone || '',        width: 18 },
    { header: 'Numéro étudiant',  accessor: r => r.numero_etudiant || '',        width: 18 },
    { header: 'Niveau',           accessor: r => r.niveau || '',                 width: 18 },
    { header: 'Groupe',           accessor: r => r.groupe?.nom_groupe || '',     width: 14 },
    { header: 'Filière',          accessor: r => r.groupe?.filiere?.nom_filiere || '', width: 30 },
];

export const COLS_AFFECTATIONS = [
    { header: 'Cours',       accessor: r => r.cours?.nom_cours || '',                              width: 35 },
    { header: 'Groupe',      accessor: r => r.groupe?.nom_groupe || '',                            width: 14 },
    { header: 'Enseignant',  accessor: r => `${r.enseignant?.prenom || ''} ${r.enseignant?.nom || ''}`.trim(), width: 24 },
    { header: 'Salle',       accessor: r => r.salle?.nom_salle || '',                              width: 14 },
    { header: 'Date',        accessor: r => r.date_seance ? new Date(r.date_seance).toLocaleDateString('fr-FR') : '', width: 14 },
    { header: 'Jour',        accessor: r => r.creneau?.jour_semaine || '',                         width: 12 },
    { header: 'Heure début', accessor: r => r.creneau?.heure_debut || '',                          width: 13 },
    { header: 'Heure fin',   accessor: r => r.creneau?.heure_fin || '',                            width: 13 },
    { header: 'Durée (min)', accessor: r => r.creneau?.duree_minutes || '',                        width: 13 },
    { header: 'Statut',      accessor: r => r.statut || '',                                        width: 12 },
    { header: 'Commentaire', accessor: r => r.commentaire || '',                                   width: 30 },
];

export const COLS_GROUPES = [
    { header: 'Nom groupe',     accessor: r => r.nom_groupe || '',                 width: 16 },
    { header: 'Filière',        accessor: r => r.filiere?.nom_filiere || '',       width: 35 },
    { header: 'Niveau',         accessor: r => r.niveau || '',                     width: 18 },
    { header: 'Effectif',       accessor: r => r.effectif || '',                   width: 12 },
    { header: 'Année scolaire', accessor: r => r.annee_scolaire || '',             width: 16 },
];

export const COLS_SALLES = [
    { header: 'Nom salle',    accessor: r => r.nom_salle || '',    width: 16 },
    { header: 'Type',         accessor: r => r.type_salle || '',   width: 24 },
    { header: 'Capacité',     accessor: r => r.capacite || '',     width: 12 },
    { header: 'Bâtiment',     accessor: r => r.batiment || '',     width: 14 },
    { header: 'Étage',        accessor: r => r.etage ?? '',        width: 10 },
    { header: 'Disponible',   accessor: r => r.disponible ? 'Oui' : 'Non', width: 12 },
];

export const COLS_COURS = [
    { header: 'Code',          accessor: r => r.code_cours || '',              width: 16 },
    { header: 'Nom du cours',  accessor: r => r.nom_cours || '',               width: 38 },
    { header: 'Filière',       accessor: r => r.filiere?.nom_filiere || '',    width: 35 },
    { header: 'Niveau',        accessor: r => r.niveau || '',                  width: 18 },
    { header: 'Type',          accessor: r => r.type_cours || '',              width: 12 },
    { header: 'Volume horaire',accessor: r => r.volume_horaire || '',          width: 16 },
    { header: 'Coefficient',   accessor: r => r.coefficient || '',             width: 14 },
    { header: 'Semestre',      accessor: r => r.semestre || '',                width: 12 },
];

export const COLS_DEMANDES_REPORT = [
    { header: 'Enseignant',       accessor: r => `${r.enseignant?.prenom || ''} ${r.enseignant?.nom || ''}`.trim(), width: 24 },
    { header: 'Email enseignant', accessor: r => r.enseignant?.email || '',                     width: 30 },
    { header: 'Cours',            accessor: r => r.affectation?.cours?.nom_cours || '',         width: 35 },
    { header: 'Groupe',           accessor: r => r.affectation?.groupe?.nom_groupe || '',       width: 14 },
    { header: 'Date originale',   accessor: r => r.affectation?.date_seance ? new Date(r.affectation.date_seance).toLocaleDateString('fr-FR') : '', width: 16 },
    { header: 'Nouvelle date',    accessor: r => r.nouvelle_date ? new Date(r.nouvelle_date).toLocaleDateString('fr-FR') : '', width: 16 },
    { header: 'Motif',            accessor: r => r.motif || '',                                 width: 40 },
    { header: 'Statut',           accessor: r => r.statut_demande || '',                        width: 14 },
    { header: 'Date demande',     accessor: r => r.date_demande ? new Date(r.date_demande).toLocaleDateString('fr-FR') : '', width: 16 },
];

export const COLS_CHARGE_ENSEIGNANTS = [
    { header: 'Prénom',    accessor: r => r.prenom || '',                 width: 18 },
    { header: 'Nom',       accessor: r => r.nom || '',                    width: 18 },
    { header: 'Séances',   accessor: r => r.nombre_seances || 0,          width: 12 },
    { header: 'Heures',    accessor: r => r.total_heures || 0,            width: 12 },
    { header: 'Cours diff.',accessor: r => r.nombre_cours_differents || 0, width: 14 },
];

export const COLS_OCCUPATION_GROUPES = [
    { header: 'Groupe',   accessor: r => r.nom_groupe || '',    width: 16 },
    { header: 'Niveau',   accessor: r => r.niveau || '',        width: 18 },
    { header: 'Séances',  accessor: r => r.nombre_seances || 0, width: 12 },
    { header: 'Heures',   accessor: r => r.total_heures || 0,   width: 12 },
];
