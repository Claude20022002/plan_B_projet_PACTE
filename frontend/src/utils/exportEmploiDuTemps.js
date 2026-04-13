import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Couleurs par type de cours
const TYPE_COLORS = {
    CM:      [26,  58, 143],  // Bleu HESTIM
    TD:      [0,  119, 189],  // Bleu clair
    TP:      [0,  121,  99],  // Vert
    Projet:  [232, 160,  32], // Jaune HESTIM
    Examen:  [198,  40,  40], // Rouge
    default: [90,  90,  90],  // Gris
};

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const JOURS_LABELS = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi' };

/**
 * Obtient la couleur RGB selon le type de cours
 */
function getTypeColor(typeCours) {
    if (!typeCours) return TYPE_COLORS.default;
    const key = Object.keys(TYPE_COLORS).find((k) =>
        typeCours.toLowerCase().includes(k.toLowerCase())
    );
    return key ? TYPE_COLORS[key] : TYPE_COLORS.default;
}

/**
 * Groupe les affectations par jour de la semaine
 */
function grouperParJour(affectations) {
    const grouped = {};
    JOURS.forEach((j) => { grouped[j] = []; });

    affectations.forEach((aff) => {
        const jour = aff.creneau?.jour_semaine?.toLowerCase();
        if (jour && grouped[jour] !== undefined) {
            grouped[jour].push(aff);
        }
    });

    // Trier chaque jour par heure de début
    Object.keys(grouped).forEach((jour) => {
        grouped[jour].sort((a, b) =>
            (a.creneau?.heure_debut || '').localeCompare(b.creneau?.heure_debut || '')
        );
    });

    return grouped;
}

/**
 * Génère les créneaux uniques triés
 */
function getCreneauxUniques(affectations) {
    const map = new Map();
    affectations.forEach((aff) => {
        if (aff.creneau?.heure_debut && aff.creneau?.heure_fin) {
            const key = `${aff.creneau.heure_debut}-${aff.creneau.heure_fin}`;
            if (!map.has(key)) {
                map.set(key, { debut: aff.creneau.heure_debut, fin: aff.creneau.heure_fin });
            }
        }
    });
    return Array.from(map.values()).sort((a, b) => a.debut.localeCompare(b.debut));
}

/**
 * Dessine un coin arrondi dans le PDF
 */
function drawRoundedRect(doc, x, y, w, h, r, fillColor, strokeColor) {
    if (fillColor) doc.setFillColor(...fillColor);
    if (strokeColor) doc.setDrawColor(...strokeColor);
    doc.roundedRect(x, y, w, h, r, r, fillColor ? (strokeColor ? 'FD' : 'F') : 'S');
}

/**
 * Dessine l'en-tête du document PDF
 */
function drawPDFHeader(doc, title, subtitle, pageWidth) {
    // Bande bleue principale
    doc.setFillColor(26, 58, 143);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HESTIM — École d\'Ingénierie & Management', pageWidth / 2, 10, { align: 'center' });

    // Sous-titre
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(title, pageWidth / 2, 18, { align: 'center' });

    // Bande jaune décorative
    doc.setFillColor(232, 160, 32);
    doc.rect(0, 28, pageWidth, 3, 'F');

    // Infos sous le header
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (subtitle) {
        doc.text(subtitle, 14, 40);
    }
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, 40, { align: 'right' });

    return 48; // Y après l'en-tête
}

/**
 * Dessine le pied de page
 */
function drawPDFFooter(doc, pageNum, totalPages, pageWidth, pageHeight) {
    doc.setFillColor(245, 247, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setDrawColor(26, 58, 143);
    doc.setLineWidth(0.3);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('HESTIM Planner — Document confidentiel', 14, pageHeight - 4);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
    doc.text('hestim.ma', pageWidth - 14, pageHeight - 4, { align: 'right' });
}

/**
 * Génère l'emploi du temps en format grille hebdomadaire PDF (paysage)
 * @param {Array} affectations
 * @param {String} filename
 * @param {String} title - Titre affiché (ex: "Prof. Dupont Jean")
 * @param {String} role - 'enseignant' | 'etudiant' | 'admin'
 */
export const exportToPDF = async (affectations, filename = 'emploi-du-temps', title = 'Emploi du Temps', role = 'enseignant') => {
    try {
        let autoTable;
        try {
            const mod = await import('jspdf-autotable');
            autoTable = mod.default;
        } catch {
            alert("Impossible de charger la bibliothèque PDF. Essayez Excel/CSV.");
            return;
        }
        if (typeof autoTable !== 'function') {
            alert("Bibliothèque PDF non disponible. Essayez Excel/CSV.");
            return;
        }

        if (!affectations || affectations.length === 0) {
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();
            drawPDFHeader(doc, title, '', pw);
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(14);
            doc.text('Aucun cours planifié', pw / 2, ph / 2, { align: 'center' });
            drawPDFFooter(doc, 1, 1, pw, ph);
            doc.save(`${filename}.pdf`);
            return;
        }

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();

        // ── PAGE 1 : Grille hebdomadaire ──────────────────────────────
        const parJour = grouperParJour(affectations);
        const creneaux = getCreneauxUniques(affectations);
        const joursActifs = JOURS.filter((j) => parJour[j].length > 0);

        const subtitle = role === 'enseignant'
            ? `Enseignant : ${title.replace('Emploi du Temps - ', '')} | Période : Semestre en cours`
            : role === 'etudiant'
            ? `Étudiant : ${title.replace('Emploi du Temps - ', '')} | Période : Semestre en cours`
            : `Vue consolidée — Tous les groupes`;

        let startY = drawPDFHeader(doc, title, subtitle, pw);

        // Légende des types
        const types = [...new Set(affectations.map((a) => a.cours?.type_cours).filter(Boolean))];
        if (types.length > 0) {
            let lx = 14;
            doc.setFontSize(7);
            types.forEach((t) => {
                const [r, g, b] = getTypeColor(t);
                doc.setFillColor(r, g, b);
                doc.roundedRect(lx, startY - 1, 7, 4, 1, 1, 'F');
                doc.setTextColor(80, 80, 80);
                doc.text(t, lx + 9, startY + 2);
                lx += doc.getTextWidth(t) + 16;
            });
            startY += 8;
        }

        // Construction de la grille
        if (creneaux.length > 0 && joursActifs.length > 0) {
            const colTimeWidth = 24;
            const colWidth = Math.floor((pw - 14 - 14 - colTimeWidth) / joursActifs.length);
            const rowHeight = Math.min(18, Math.floor((ph - startY - 16) / Math.max(creneaux.length, 1)));

            // En-têtes colonnes
            const headerH = 8;
            doc.setFillColor(26, 58, 143);
            doc.rect(14, startY, colTimeWidth, headerH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.text('Horaire', 14 + colTimeWidth / 2, startY + 5.5, { align: 'center' });

            joursActifs.forEach((jour, idx) => {
                const x = 14 + colTimeWidth + idx * colWidth;
                doc.setFillColor(26, 58, 143);
                doc.rect(x, startY, colWidth, headerH, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(JOURS_LABELS[jour], x + colWidth / 2, startY + 5.5, { align: 'center' });
            });

            startY += headerH;

            // Lignes de créneaux
            creneaux.forEach((creneau, ri) => {
                const rowY = startY + ri * rowHeight;
                const isAlternate = ri % 2 === 1;

                // Colonne horaire
                doc.setFillColor(isAlternate ? 240 : 248, isAlternate ? 244 : 250, isAlternate ? 255 : 255);
                doc.rect(14, rowY, colTimeWidth, rowHeight, 'F');
                doc.setDrawColor(200, 210, 230);
                doc.setLineWidth(0.2);
                doc.rect(14, rowY, colTimeWidth, rowHeight, 'S');
                doc.setTextColor(40, 40, 100);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text(creneau.debut, 14 + colTimeWidth / 2, rowY + rowHeight / 2 - 1, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text(creneau.fin, 14 + colTimeWidth / 2, rowY + rowHeight / 2 + 3, { align: 'center' });

                // Colonnes de jours
                joursActifs.forEach((jour, ci) => {
                    const cellX = 14 + colTimeWidth + ci * colWidth;
                    const affJour = parJour[jour].filter(
                        (a) => a.creneau?.heure_debut === creneau.debut && a.creneau?.heure_fin === creneau.fin
                    );

                    // Fond de cellule
                    doc.setFillColor(isAlternate ? 245 : 252, isAlternate ? 247 : 253, isAlternate ? 255 : 255);
                    doc.rect(cellX, rowY, colWidth, rowHeight, 'F');
                    doc.setDrawColor(200, 210, 230);
                    doc.setLineWidth(0.2);
                    doc.rect(cellX, rowY, colWidth, rowHeight, 'S');

                    if (affJour.length > 0) {
                        const aff = affJour[0];
                        const [r, g, b] = getTypeColor(aff.cours?.type_cours);
                        const padding = 1.5;

                        // Fond coloré de la carte cours
                        doc.setFillColor(r, g, b, 0.12);
                        doc.setFillColor(Math.min(255, r + 200), Math.min(255, g + 200), Math.min(255, b + 200));
                        doc.roundedRect(cellX + padding, rowY + padding, colWidth - 2 * padding, rowHeight - 2 * padding, 2, 2, 'F');

                        // Barre colorée gauche
                        doc.setFillColor(r, g, b);
                        doc.rect(cellX + padding, rowY + padding, 2.5, rowHeight - 2 * padding, 'F');

                        // Texte dans la cellule
                        const textX = cellX + padding + 4;
                        const textMaxW = colWidth - padding * 2 - 5;
                        doc.setTextColor(r > 200 ? 60 : r, g > 200 ? 60 : g, b > 200 ? 60 : b);

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(Math.max(5.5, Math.min(7, rowHeight / 3)));
                        const nomCours = aff.cours?.nom_cours || 'Cours';
                        const nomTronque = nomCours.length > 20 ? nomCours.substring(0, 18) + '…' : nomCours;
                        doc.text(nomTronque, textX, rowY + padding + 4);

                        if (rowHeight > 10) {
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(Math.max(5, Math.min(6.5, rowHeight / 3.5)));
                            doc.setTextColor(80, 80, 80);
                            const salle = aff.salle?.nom_salle ? `📍 ${aff.salle.nom_salle}` : '';
                            const enseignant = aff.enseignant ? `👤 ${aff.enseignant.prenom?.[0] || ''}. ${aff.enseignant.nom || ''}` : '';
                            const groupe = aff.groupe?.nom_groupe ? `👥 ${aff.groupe.nom_groupe}` : '';

                            let lineY = rowY + padding + 8;
                            if (salle && lineY < rowY + rowHeight - 2) {
                                doc.text(salle, textX, lineY);
                                lineY += 3.5;
                            }
                            if (role !== 'enseignant' && enseignant && lineY < rowY + rowHeight - 2) {
                                doc.text(enseignant, textX, lineY);
                                lineY += 3.5;
                            }
                            if (role !== 'etudiant' && groupe && lineY < rowY + rowHeight - 2) {
                                doc.text(groupe, textX, lineY);
                            }
                        }

                        // Badge type de cours
                        if (aff.cours?.type_cours && rowHeight > 8) {
                            doc.setFillColor(r, g, b);
                            const badgeW = 10;
                            doc.roundedRect(cellX + colWidth - padding - badgeW, rowY + padding, badgeW, 4, 1, 1, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(4.5);
                            doc.setFont('helvetica', 'bold');
                            doc.text(aff.cours.type_cours.substring(0, 4).toUpperCase(), cellX + colWidth - padding - badgeW / 2, rowY + padding + 2.8, { align: 'center' });
                        }

                        // Plusieurs affectations au même créneau
                        if (affJour.length > 1) {
                            doc.setFillColor(198, 40, 40);
                            doc.circle(cellX + colWidth - padding - 2, rowY + rowHeight - padding - 2, 2.5, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(5);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`+${affJour.length - 1}`, cellX + colWidth - padding - 2, rowY + rowHeight - padding - 0.8, { align: 'center' });
                        }
                    }
                });
            });

            startY += creneaux.length * rowHeight + 4;
        }

        drawPDFFooter(doc, 1, doc.internal.getNumberOfPages(), pw, ph);

        // ── PAGE 2 : Liste détaillée ─────────────────────────────────
        doc.addPage('landscape');
        startY = drawPDFHeader(doc, `${title} — Liste détaillée`, subtitle, pw);

        const tableData = affectations
            .sort((a, b) => {
                const jA = JOURS.indexOf(a.creneau?.jour_semaine?.toLowerCase());
                const jB = JOURS.indexOf(b.creneau?.jour_semaine?.toLowerCase());
                if (jA !== jB) return jA - jB;
                return (a.creneau?.heure_debut || '').localeCompare(b.creneau?.heure_debut || '');
            })
            .map((aff) => [
                aff.creneau?.jour_semaine ? JOURS_LABELS[aff.creneau.jour_semaine.toLowerCase()] || aff.creneau.jour_semaine : '—',
                aff.creneau?.heure_debut || '—',
                aff.creneau?.heure_fin || '—',
                aff.cours?.code_cours || '—',
                aff.cours?.nom_cours || '—',
                aff.cours?.type_cours || '—',
                aff.groupe?.nom_groupe || '—',
                aff.enseignant ? `${aff.enseignant.prenom} ${aff.enseignant.nom}` : '—',
                aff.salle?.nom_salle || '—',
                aff.statut || '—',
            ]);

        autoTable(doc, {
            head: [['Jour', 'Début', 'Fin', 'Code', 'Cours', 'Type', 'Groupe', 'Enseignant', 'Salle', 'Statut']],
            body: tableData,
            startY,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: {
                fillColor: [26, 58, 143],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
            },
            alternateRowStyles: { fillColor: [245, 247, 252] },
            columnStyles: {
                0: { cellWidth: 22, fontStyle: 'bold' },
                1: { cellWidth: 16, halign: 'center' },
                2: { cellWidth: 16, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 18, halign: 'center' },
                6: { cellWidth: 22, halign: 'center' },
                7: { cellWidth: 36 },
                8: { cellWidth: 22, halign: 'center' },
                9: { cellWidth: 20, halign: 'center' },
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 5) {
                    const type = data.cell.raw;
                    const [r, g, b] = getTypeColor(type);
                    data.doc.setFillColor(r, g, b);
                    data.doc.roundedRect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 2, 2, 'F');
                    data.doc.setTextColor(255, 255, 255);
                    data.doc.setFontSize(7.5);
                    data.doc.text(type, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { align: 'center' });
                }
            },
            margin: { left: 14, right: 14 },
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            drawPDFFooter(doc, p, totalPages, pw, ph);
        }

        doc.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Erreur génération PDF:', error);
        alert('Erreur lors de la génération du PDF. Utilisez Excel ou CSV à la place.');
    }
};

/**
 * Exporte l'emploi du temps en Excel (format détaillé + onglet hebdomadaire)
 */
export const exportToExcel = (affectations, filename = 'emploi-du-temps') => {
    const wb = XLSX.utils.book_new();

    // Onglet 1 : Liste détaillée
    const data = affectations
        .sort((a, b) => {
            const jA = JOURS.indexOf(a.creneau?.jour_semaine?.toLowerCase());
            const jB = JOURS.indexOf(b.creneau?.jour_semaine?.toLowerCase());
            if (jA !== jB) return jA - jB;
            return (a.creneau?.heure_debut || '').localeCompare(b.creneau?.heure_debut || '');
        })
        .map((aff) => ({
            Jour: aff.creneau?.jour_semaine ? JOURS_LABELS[aff.creneau.jour_semaine.toLowerCase()] || aff.creneau.jour_semaine : '',
            'Heure début': aff.creneau?.heure_debut || '',
            'Heure fin': aff.creneau?.heure_fin || '',
            'Code cours': aff.cours?.code_cours || '',
            Cours: aff.cours?.nom_cours || '',
            Type: aff.cours?.type_cours || '',
            Groupe: aff.groupe?.nom_groupe || '',
            Enseignant: aff.enseignant ? `${aff.enseignant.prenom} ${aff.enseignant.nom}` : '',
            Salle: aff.salle?.nom_salle || '',
            Bâtiment: aff.salle?.batiment || '',
            Statut: aff.statut || '',
        }));

    const ws1 = XLSX.utils.json_to_sheet(data);
    ws1['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 30 },
        { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Emploi du temps');

    // Onglet 2 : Grille hebdomadaire
    const creneaux = getCreneauxUniques(affectations);
    const parJour = grouperParJour(affectations);
    const joursActifs = JOURS.filter((j) => parJour[j].length > 0);

    if (creneaux.length > 0) {
        const header = ['Horaire', ...joursActifs.map((j) => JOURS_LABELS[j])];
        const rows = creneaux.map((creneau) => {
            const row = [`${creneau.debut} - ${creneau.fin}`];
            joursActifs.forEach((jour) => {
                const affs = parJour[jour].filter(
                    (a) => a.creneau?.heure_debut === creneau.debut && a.creneau?.heure_fin === creneau.fin
                );
                if (affs.length > 0) {
                    const a = affs[0];
                    row.push(
                        [
                            a.cours?.nom_cours || '',
                            a.cours?.type_cours ? `[${a.cours.type_cours}]` : '',
                            a.groupe?.nom_groupe ? `Gr: ${a.groupe.nom_groupe}` : '',
                            a.salle?.nom_salle ? `Salle: ${a.salle.nom_salle}` : '',
                            a.enseignant ? `Prof: ${a.enseignant.prenom} ${a.enseignant.nom}` : '',
                        ]
                            .filter(Boolean)
                            .join(' | ')
                    );
                } else {
                    row.push('');
                }
            });
            return row;
        });

        const ws2 = XLSX.utils.aoa_to_sheet([header, ...rows]);
        ws2['!cols'] = [{ wch: 18 }, ...joursActifs.map(() => ({ wch: 40 }))];
        XLSX.utils.book_append_sheet(wb, ws2, 'Grille hebdomadaire');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Exporte en CSV
 */
export const exportToCSV = (affectations, filename = 'emploi-du-temps') => {
    const headers = ['Jour', 'Heure début', 'Heure fin', 'Code cours', 'Cours', 'Type', 'Groupe', 'Enseignant', 'Salle', 'Statut'];

    const rows = affectations
        .sort((a, b) => {
            const jA = JOURS.indexOf(a.creneau?.jour_semaine?.toLowerCase());
            const jB = JOURS.indexOf(b.creneau?.jour_semaine?.toLowerCase());
            if (jA !== jB) return jA - jB;
            return (a.creneau?.heure_debut || '').localeCompare(b.creneau?.heure_debut || '');
        })
        .map((aff) => [
            aff.creneau?.jour_semaine ? JOURS_LABELS[aff.creneau.jour_semaine.toLowerCase()] || aff.creneau.jour_semaine : '',
            aff.creneau?.heure_debut || '',
            aff.creneau?.heure_fin || '',
            aff.cours?.code_cours || '',
            `"${aff.cours?.nom_cours || ''}"`,
            aff.cours?.type_cours || '',
            aff.groupe?.nom_groupe || '',
            aff.enseignant ? `"${aff.enseignant.prenom} ${aff.enseignant.nom}"` : '',
            aff.salle?.nom_salle || '',
            aff.statut || '',
        ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Exporte en iCal
 */
export const exportToiCal = (affectations, filename = 'emploi-du-temps', title = 'Emploi du Temps') => {
    try {
        const pad = (n) => String(n).padStart(2, '0');

        const toICalDate = (dateStr, timeStr) => {
            const d = new Date(dateStr);
            const [h, m] = (timeStr || '08:00').split(':').map(Number);
            d.setHours(h, m, 0, 0);
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        };

        const addMinutes = (dateStr, timeStr, minutes) => {
            const d = new Date(dateStr);
            const [h, m] = (timeStr || '08:00').split(':').map(Number);
            d.setHours(h, m + minutes, 0, 0);
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        };

        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//HESTIM Planner//Emploi du Temps//FR',
            `X-WR-CALNAME:${title}`,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
        ];

        affectations.forEach((aff, idx) => {
            const dateS = aff.date_seance;
            const debut = aff.creneau?.heure_debut || '08:00';
            const duree = aff.creneau?.duree_minutes || 90;

            lines.push(
                'BEGIN:VEVENT',
                `UID:hestim-${aff.id_affectation || idx}-${Date.now()}@hestim.ma`,
                `DTSTART:${toICalDate(dateS, debut)}`,
                `DTEND:${addMinutes(dateS, debut, duree)}`,
                `SUMMARY:${aff.cours?.nom_cours || 'Cours'}${aff.cours?.type_cours ? ` [${aff.cours.type_cours}]` : ''}`,
                `LOCATION:${aff.salle?.nom_salle || 'Non spécifié'}`,
                `DESCRIPTION:Groupe: ${aff.groupe?.nom_groupe || 'N/A'}\\nEnseignant: ${aff.enseignant ? `${aff.enseignant.prenom} ${aff.enseignant.nom}` : 'N/A'}\\nSalle: ${aff.salle?.nom_salle || 'N/A'}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        });

        lines.push('END:VCALENDAR');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.ics`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erreur iCal:', error);
        alert('Erreur lors de la génération du fichier iCal.');
    }
};
