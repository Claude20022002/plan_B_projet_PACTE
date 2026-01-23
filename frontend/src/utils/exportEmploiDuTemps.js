import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// Importer jspdf-autotable - il étend automatiquement jsPDF avec la méthode autoTable
import 'jspdf-autotable';

/**
 * Exporte l'emploi du temps en format Excel
 * @param {Array} affectations - Les affectations à exporter
 * @param {String} filename - Le nom du fichier
 */
export const exportToExcel = (affectations, filename = 'emploi-du-temps') => {
    // Préparer les données pour Excel
    const data = affectations.map((aff) => ({
        Date: new Date(aff.date_seance).toLocaleDateString('fr-FR'),
        Jour: new Date(aff.date_seance).toLocaleDateString('fr-FR', { weekday: 'long' }),
        'Heure début': aff.creneau?.heure_debut || '',
        'Heure fin': aff.creneau?.heure_fin || '',
        Cours: aff.cours?.nom_cours || '',
        Groupe: aff.groupe?.nom_groupe || '',
        Enseignant: aff.enseignant ? `${aff.enseignant.prenom} ${aff.enseignant.nom}` : '',
        Salle: aff.salle?.nom_salle || '',
        Statut: aff.statut || '',
    }));

    // Créer un workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajuster la largeur des colonnes
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 12 }, // Jour
        { wch: 12 }, // Heure début
        { wch: 12 }, // Heure fin
        { wch: 25 }, // Cours
        { wch: 15 }, // Groupe
        { wch: 20 }, // Enseignant
        { wch: 15 }, // Salle
        { wch: 12 }, // Statut
    ];
    ws['!cols'] = colWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Emploi du temps');

    // Télécharger le fichier
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Exporte l'emploi du temps en format PDF
 * @param {Array} affectations - Les affectations à exporter
 * @param {String} filename - Le nom du fichier
 * @param {String} title - Le titre du document
 */
export const exportToPDF = (affectations, filename = 'emploi-du-temps', title = 'Emploi du Temps') => {
    try {
        const doc = new jsPDF();
        
        // Vérifier si autoTable est disponible (jspdf-autotable devrait l'ajouter automatiquement)
        if (typeof doc.autoTable !== 'function') {
            console.error('jspdf-autotable n\'est pas correctement chargé. Vérifiez que le module est installé.');
            alert('Erreur: La bibliothèque PDF n\'est pas correctement chargée. Veuillez réessayer ou utiliser Excel/CSV.');
            return;
        }

        // Titre
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        
        // Date de génération
        doc.setFontSize(10);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
        
        // Vérifier si on a des données
        if (!affectations || affectations.length === 0) {
            doc.setFontSize(12);
            doc.text('Aucune affectation à exporter', 14, 50);
            doc.save(`${filename}.pdf`);
            return;
        }
        
        // Préparer les données pour le tableau
        const tableData = affectations.map((aff) => [
            new Date(aff.date_seance).toLocaleDateString('fr-FR'),
            new Date(aff.date_seance).toLocaleDateString('fr-FR', { weekday: 'short' }),
            aff.creneau?.heure_debut || '',
            aff.creneau?.heure_fin || '',
            aff.cours?.nom_cours || '',
            aff.groupe?.nom_groupe || '',
            aff.enseignant ? `${aff.enseignant.prenom} ${aff.enseignant.nom}` : '',
            aff.salle?.nom_salle || '',
            aff.statut || '',
        ]);

        // En-têtes du tableau
        const headers = [
            'Date',
            'Jour',
            'H. début',
            'H. fin',
            'Cours',
            'Groupe',
            'Enseignant',
            'Salle',
            'Statut',
        ];

        // Créer le tableau
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [124, 77, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 35 },
        });

        // Télécharger le PDF
        doc.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
};

/**
 * Exporte l'emploi du temps en format CSV
 * @param {Array} affectations - Les affectations à exporter
 * @param {String} filename - Le nom du fichier
 */
export const exportToCSV = (affectations, filename = 'emploi-du-temps') => {
    // En-têtes
    const headers = [
        'Date',
        'Jour',
        'Heure début',
        'Heure fin',
        'Cours',
        'Groupe',
        'Enseignant',
        'Salle',
        'Statut',
    ];

    // Données
    const rows = affectations.map((aff) => [
        new Date(aff.date_seance).toLocaleDateString('fr-FR'),
        new Date(aff.date_seance).toLocaleDateString('fr-FR', { weekday: 'long' }),
        aff.creneau?.heure_debut || '',
        aff.creneau?.heure_fin || '',
        aff.cours?.nom_cours || '',
        aff.groupe?.nom_groupe || '',
        aff.enseignant ? `"${aff.enseignant.prenom} ${aff.enseignant.nom}"` : '',
        aff.salle?.nom_salle || '',
        aff.statut || '',
    ]);

    // Créer le contenu CSV
    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

