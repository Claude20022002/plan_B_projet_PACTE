/**
 * PDF officiel de l'emploi du temps (format HESTIM, A4 portrait), ouvert dans une fenêtre d'impression.
 * Seul format d'export de ce module (lot B-6) : l'Excel passe par exportExcel.js, l'agenda par
 * l'abonnement personnel (page Paramètres) ; CSV, iCal (fichier) et YAML sont retirés.
 * Chargé à la demande par lazyExports.js.
 */

// ── Créneaux officiels HESTIM (planning.html) ─────────────────────────────────
const HESTIM_SLOTS = [
    { label: '09h00 - 10h45', debut: '09:00' },
    { label: '10h45 - 12h30', debut: '10:45' },
    { label: '13h30 - 15h15', debut: '13:30' },
    { label: '15h15 - 17h00', debut: '15:15' },
];

const HTML_JOURS      = ['lundi', 'mardi', 'mercredi', 'jeudi', 'samedi'];
const HTML_JOUR_LABEL = { lundi:'Lundi', mardi:'Mardi', mercredi:'Mercredi', jeudi:'Jeudi', samedi:'Samedi' };

/** Mappe heure_debut → index créneau HESTIM (0-3), -1 si hors plage */
function htmlSlotIdx(heureDebut) {
    const h = (heureDebut || '').substring(0, 5);
    if (h >= '09:00' && h < '10:45') return 0;
    if (h >= '10:45' && h < '13:30') return 1;
    if (h >= '13:30' && h < '15:15') return 2;
    if (h >= '15:15')                return 3;
    return -1;
}

/** Calcule l'année universitaire courante (ex: 2025/2026) */
function academicYear() {
    const n = new Date();
    const y = n.getFullYear();
    return n.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** Formate une date ISO en jj/mm/aaaa */
function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

/** Donne la date d'un jour de la semaine à partir du lundi de la semaine */
function fmtJourDate(mondayStr, jourName) {
    if (!mondayStr) return '';
    const off = { lundi:0, mardi:1, mercredi:2, jeudi:3, vendredi:4, samedi:5 };
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + (off[jourName] ?? 0));
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' });
}

/** Échappe le HTML */
function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/**
 * Groupe les affectations par semaines → jours → slots [0..3].
 * Si aucune date_seance, retourne une seule "semaine type" (récurrente).
 */
function buildHtmlWeeks(affectations) {
    const hasDate = affectations.some(a => a.date_seance);
    const JOUR_MAP = { 1:'lundi', 2:'mardi', 3:'mercredi', 4:'jeudi', 5:'vendredi', 6:'samedi' };

    if (!hasDate) {
        // Emploi du temps récurrent (pas de date_seance)
        const days = {};
        HTML_JOURS.forEach(j => { days[j] = [null, null, null, null]; });
        affectations.forEach(aff => {
            const jour = (aff.creneau?.jour_semaine || '').toLowerCase();
            if (!days[jour]) return;
            const idx = htmlSlotIdx(aff.creneau?.heure_debut);
            if (idx >= 0 && !days[jour][idx]) days[jour][idx] = aff;
        });
        return [{ debut: null, fin: null, days }];
    }

    // Emploi du temps daté : grouper par semaine (lundi → samedi)
    const weekMap = {};
    affectations.forEach(aff => {
        if (!aff.date_seance) return;
        const d   = new Date(aff.date_seance);
        const day = d.getDay();
        const mon = new Date(d);
        mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        const key = mon.toISOString().split('T')[0];

        if (!weekMap[key]) {
            const sat = new Date(mon);
            sat.setDate(mon.getDate() + 5);
            weekMap[key] = {
                debut: key,
                fin:   sat.toISOString().split('T')[0],
                days:  {},
            };
            HTML_JOURS.forEach(j => { weekMap[key].days[j] = [null, null, null, null]; });
        }

        const jour = JOUR_MAP[d.getDay()];
        if (!jour || !weekMap[key].days[jour]) return;
        const idx = htmlSlotIdx(aff.creneau?.heure_debut);
        if (idx >= 0 && !weekMap[key].days[jour][idx]) weekMap[key].days[jour][idx] = aff;
    });

    return Object.values(weekMap).sort((a, b) => a.debut.localeCompare(b.debut));
}

/** Génère le contenu HTML d'une cellule (matière / enseignant / salle) */
function renderCell(aff, role) {
    if (!aff) return '';
    const mat  = esc(aff.cours?.nom_cours || '');
    const type = esc(aff.cours?.type_cours || '');
    const ens  = aff.enseignant
        ? esc(`${aff.enseignant.prenom?.[0] || ''}. ${aff.enseignant.nom || ''}`)
        : '';
    const sal  = esc(aff.salle?.nom_salle || '');
    const grp  = role === 'admin' ? esc(aff.groupe?.nom_groupe || '') : '';

    let html = '';
    if (mat)  html += `<span class="c-mat">${mat}${type ? ` <em>[${type}]</em>` : ''}</span>`;
    if (ens)  html += `<hr><span class="c-ens">${ens}</span>`;
    if (sal)  html += `<hr><span class="c-sal">${sal}</span>`;
    if (grp)  html += `<hr><span class="c-grp">${grp}</span>`;
    return html;
}

/**
 * Construit le document HTML complet du template planning.html
 * avec les données réelles et les couleurs HESTIM.
 */
function buildTimetableHTML(affectations, title, role, logoBase64) {
    const weeks   = buildHtmlWeeks(affectations);
    const nWeeks  = weeks.length || 1;

    // Infos tirées des affectations
    const groupes = [...new Set(affectations.map(a => a.groupe?.nom_groupe).filter(Boolean))];
    const filiere = affectations.find(a => a.cours?.filiere?.nom_filiere)?.cours?.filiere?.nom_filiere || '';

    // Facteur d'échelle pour tout tenir sur une page A4 paysage
    const zoom = Math.min(1, Math.max(0.45, 4 / nWeeks));
    // Police −23 % (−20 % hauteur cellule × −3 % global)
    const fs   = nWeeks <= 1 ? 8.2 : nWeeks <= 2 ? 7.8 : nWeeks <= 4 ? 7.3 : nWeeks <= 6 ? 6.3 : 5.3;
    // Largeur slot : 45mm × 0,97 ≈ 44mm
    const slotW  = 44;
    // Largeur exacte du tableau = somme des colonnes déclarées
    const tableW = 12.6 + 12.6 + 6.8 + 4 * slotW; // ≈ 208mm

    /* ── Lignes du tableau ─────────────────────────────────────────── */
    let tbody = '';
    weeks.forEach((week, wi) => {
        HTML_JOURS.forEach((jour, ji) => {
            const slots     = week.days[jour] || [null, null, null, null];
            const jourDate  = fmtJourDate(week.debut, jour);
            const isFirst   = ji === 0;

            const weekCell = isFirst
                ? `<th rowspan="5" class="td-sem">${
                    week.debut
                        ? `Du ${fmtDate(week.debut)}<br>Au ${fmtDate(week.fin)}`
                        : 'Semaine<br>type'
                  }</th>`
                : '';

            tbody += `
            <tr>
                ${weekCell}
                <th class="td-jour">${HTML_JOUR_LABEL[jour]}${jourDate ? `<br><small>${jourDate}</small>` : ''}</th>
                <th class="td-mms">Matière<hr>Enseignant<hr>Salle</th>
                ${slots.map(aff => `<th class="td-slot${aff ? ' has-cours' : ''}">${renderCell(aff, role)}</th>`).join('')}
            </tr>`;
        });
        // Séparateur entre semaines
        if (wi < weeks.length - 1) {
            tbody += '<tr class="sep"><td colspan="7"></td></tr>';
        }
    });

    const logoTag = logoBase64
        ? `<img src="${logoBase64}" alt="HESTIM" class="logo-img">`
        : `<span class="logo-txt">HESTIM</span>`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
/* ── Reset & Page ─────────────────────────────────────────────── */
@page { size: A4 landscape; margin: 4mm; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${fs}pt;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
/* ── Zoom pour tenir sur une page ────────────────────────────── */
.wrap  { zoom: ${zoom}; width: calc(289mm / ${zoom}); }
/* Conteneur centré calé exactement sur la largeur du tableau */
.inner { width: ${tableW}mm; margin: 0 auto; }
/* ── Header 3 colonnes : logo | filière | classe+année ────────── */
.hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2mm;
    margin-bottom: 0.97mm;
    padding-bottom: 0.97mm;
    border-bottom: 1.5px solid #001962;
    width: 100%;
}
.hdr-left  { flex: 0 0 auto; display: flex; align-items: center; }
.hdr-mid   { flex: 1; text-align: center; }
.hdr-right { flex: 0 0 auto; text-align: right; }
.logo-img  { height: 8.7mm; width: auto; object-fit: contain; display: block; }
.logo-txt  { font-size: 12pt; font-weight: 900; color: #001962; }
.hdr-title {
    font-size: ${fs + 2}pt;
    font-weight: 700;
    color: #1E90FF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.2mm;
}
.hdr-filiere {
    font-size: ${fs + 1}pt;
    font-weight: 700;
    color: #FF4500;
}
.hdr-classe {
    display: block;
    font-size: ${fs}pt;
    font-weight: 700;
    color: #001962;
    margin-bottom: 0.2mm;
}
.hdr-annee {
    display: block;
    font-size: ${fs - 0.5}pt;
    color: #555;
}
.gold-bar { height: 1.5px; background: linear-gradient(90deg,#001962,#E8A020); margin-bottom: 0.97mm; }
/* ── Table ────────────────────────────────────────────────────── */
table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #001962;
    table-layout: fixed;
    margin: 0;
}
th, td { border: 1px solid #001962; padding: 0.24mm 0.49mm; vertical-align: middle; text-align: center; font-size: ${fs}pt; line-height: 1.07; }
tbody th, tbody td { line-height: 1.08; }
/* En-têtes colonnes */
thead th {
    background: #001962;
    color: #fff;
    font-weight: 700;
    text-align: center;
    vertical-align: middle;
    padding: 0.48mm 0.49mm;
    line-height: 1.07;
}
thead .th-mat  { background: #003087; }
thead .th-apm  { background: #1a3a8f; }
thead .th-slot { font-size: ${fs - 0.5}pt; background: #1a3a8f; }
/* Colonnes fixes */
.td-sem  { width: 12.6mm; font-size: ${fs - 0.5}pt; font-weight: 700; color: #001962; background: #EEF3FF; text-align: center; vertical-align: middle; }
.td-jour { width: 12.6mm; font-weight: 700; color: #001962; background: #F5F7FF; text-align: center; vertical-align: middle; }
.td-jour small { font-weight: 400; color: #666; display: block; }
.td-mms  { width: 6.8mm; font-size: ${fs - 1}pt; color: #555; background: #F5F7FF; text-align: center; vertical-align: middle; line-height: 1.08; }
.td-mms hr { border: none; border-top: 0.5px solid #bbb; margin: 0.1mm 0; }
/* Cellules de cours */
.td-slot {
    width: ${slotW}mm;
    text-align: center;
    vertical-align: middle;
    background: #FAFAFE;
    word-break: break-word;
}
.td-slot.has-cours { background: #EEF3FF; }
.td-slot hr { border: none; border-top: 0.5px dotted #aac; margin: 0.1mm 0; }
.c-mat { display: block; font-weight: 700; color: #001962; text-align: center; }
.c-mat em { font-style: normal; font-weight: 400; color: #E8A020; font-size: ${fs - 1}pt; }
.c-ens { display: block; color: #333; font-size: ${fs - 0.5}pt; text-align: center; }
.c-sal { display: block; color: #444; font-size: ${fs - 0.5}pt; text-align: center; }
.c-grp { display: block; color: #E8A020; font-size: ${fs - 1}pt; font-weight: 700; text-align: center; }
/* Séparateur entre semaines */
.sep td { height: 0.97mm; background: #E8A020; border: none; padding: 0; }
/* Pied de page */
.ftr {
    margin-top: 0.97mm;
    display: flex;
    justify-content: space-between;
    font-size: ${fs - 1}pt;
    color: #888;
    border-top: 1px solid #ddd;
    padding-top: 0.97mm;
}
.no-data { text-align:center; padding: 4mm; color:#aaa; font-style:italic; }
</style>
</head>
<body>
<div class="wrap">
<div class="inner">

  <!-- ── Header 3 colonnes ─────────────────────────── -->
  <div class="hdr">
    <div class="hdr-left">${logoTag}</div>
    <div class="hdr-mid">
      <div class="hdr-title">Emploi du Temps</div>
      <div class="hdr-filiere">${filiere ? esc(filiere) : "École d'Ingénierie &amp; Management"}</div>
    </div>
    <div class="hdr-right">
      ${groupes.length ? `<span class="hdr-classe">${groupes.map(esc).join(' &nbsp;·&nbsp; ')}</span>` : ''}
      <span class="hdr-annee">Année Universitaire ${academicYear()}</span>
    </div>
  </div>
  <div class="gold-bar"></div>

  <!-- ── Tableau ───────────────────────────────────── -->
  <table>
    <thead>
      <tr>
        <th rowspan="2">Semaine</th>
        <th rowspan="2">Jour</th>
        <th rowspan="2">M/E/S</th>
        <th colspan="2" class="th-mat">Matin</th>
        <th colspan="2" class="th-apm">Après-midi</th>
      </tr>
      <tr>
        ${HESTIM_SLOTS.map(s => `<th class="th-slot">${s.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tbody || '<tr><td colspan="7" class="no-data">Aucun cours planifié</td></tr>'}
    </tbody>
  </table>

  <!-- ── Pied de page ──────────────────────────────── -->
  <div class="ftr">
    <span>HESTIM &mdash; École d&apos;Ingénierie &amp; Management</span>
    <span>Généré le ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</span>
    <span>hestim.ma</span>
  </div>

</div><!-- /.inner -->
</div><!-- /.wrap -->
</body>
</html>`;
}

/**
 * Génère le PDF de l'emploi du temps en suivant la structure de planning.html.
 * Ouvre une fenêtre avec le rendu HTML et lance le dialogue d'impression.
 * L'utilisateur choisit "Enregistrer en PDF" dans la boîte de dialogue du navigateur.
 *
 * @param {Array}  affectations - liste des affectations complètes
 * @param {String} filename     - nom suggéré (non utilisé avec l'API print)
 * @param {String} title        - titre affiché dans le document
 * @param {String} role         - 'enseignant' | 'etudiant' | 'admin'
 */
export const exportToPDF = async (affectations, _filename = 'emploi-du-temps', title = 'Emploi du Temps', role = 'enseignant') => {
    // Chargement du logo HESTIM en base64 (évite les problèmes CORS dans la fenêtre print)
    let logoBase64 = '';
    try {
        const res = await fetch('/HESTIM.png');
        if (res.ok) {
            const blob = await res.blob();
            logoBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload  = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    } catch { /* logo facultatif */ }

    const html = buildTimetableHTML(affectations || [], title, role, logoBase64);

    const win = window.open('', '_blank');
    if (!win) {
        alert('Autorisez les popups pour ce site, puis relancez l\'export PDF.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    // Déclenche l'impression après le rendu complet (logo inclus)
    win.onload = () => setTimeout(() => { try { win.print(); } catch { /* silencieux */ } }, 600);
};
