import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, GlobalStyles } from '@mui/material';
import { ds } from '../../design-system/tokens';

// Couleurs du document officiel (EDT HESTIM) : hors du style « panneau », réservé à l'impression
const DOC = ds.document;
const heure = (h) => h.replace(':', 'h');
const td = { border: `1px solid ${DOC.bord}`, padding: '2px 4px', fontSize: 11, lineHeight: 1.25, textAlign: 'center', verticalAlign: 'middle' };

/**
 * Feuille d'impression des emplois du temps : seule la zone `.edt-impression` s'imprime, en A4
 * portrait, un document par page. Une zone posée directement dans <body> et cachée à l'écran
 * (`.edt-impression-seule`, exploration après la génération) remplace toute la page à l'impression :
 * le reste n'est pas seulement invisible, il ne prend plus de place (pas de pages blanches).
 */
export const StyleImpressionEdt = () => (
    <GlobalStyles
        styles={{
            '@media print': {
                '@page': { size: 'A4 portrait', margin: '8mm' },
                'body *': { visibility: 'hidden' },
                '.edt-impression, .edt-impression *': { visibility: 'visible' },
                '.edt-impression': { position: 'absolute', left: 0, top: 0, width: '100%' },
                'body:has(> .edt-impression-seule) > *:not(.edt-impression-seule)': { display: 'none !important' },
                '.edt-impression.edt-impression-seule': { display: 'block !important', position: 'static' },
                // Le tableau tient dans la largeur d'un A4 : sa largeur minimale d'écran couperait la dernière colonne
                '.edt-impression .edt-document': { padding: '0 !important', overflow: 'visible !important' },
                '.edt-impression table': { minWidth: '0 !important' },
                // Une classe par page, sans page blanche après la dernière
                '.edt-document + .edt-document': { breakBefore: 'page' },
            },
        }}
    />
);

/**
 * Emploi du temps d'une classe pour un mois, au format officiel HESTIM (phase P4) : copie de l'EDT
 * d'octobre 2026 (docs/Planning). Le serveur calcule fusions, (P.S)/(D.S) et blocs
 * (GET /emplois-du-temps/groupe/:id/mensuel) ; ce composant ne fait que dessiner `edt`.
 */
export default function DocumentEdtMois({ edt }) {
    const { t } = useTranslation();
    const nbMatin = edt.grille.matin.length;
    const nbApres = edt.grille.apres_midi.length;

    /** Cellules d'une demi-journée pour la ligne `ligne` (0 matière, 1 enseignant, 2 salle). */
    const cellules = (items, total, ligne) => {
        const sortie = [];
        let couverts = 0;
        items.forEach((c, i) => {
            const span = c.rangs.length;
            couverts += span;
            if (c.type !== 'seance') {
                if (ligne === 0) {
                    sortie.push(
                        <td key={i} colSpan={span} rowSpan={3} style={{ ...td, background: c.type === 'evenement' ? DOC.evenement : DOC.vide, fontWeight: c.type === 'evenement' ? 700 : 400 }}>
                            {c.type === 'evenement' ? c.titre : ''}
                        </td>
                    );
                }
                return;
            }
            if (ligne === 0) {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, fontWeight: 700 }}>
                        {c.matiere}
                        {c.premiere_seance && <span style={{ color: DOC.rouge }}> (P.S)</span>}
                        {c.derniere_seance && <span style={{ color: DOC.rouge }}> (D.S)</span>}
                        {c.horaire_rappel && <div style={{ fontWeight: 400 }}>{c.horaire_rappel}</div>}
                        {/* Report accepté sans nouvelle date (R-1) : la séance reste à sa place, marquée */}
                        {c.statut === 'a_reprogrammer' && <div style={{ color: DOC.rouge }}>{t('monthly.postponed')}</div>}
                    </td>
                );
            } else if (ligne === 1) {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, color: DOC.rouge, fontWeight: 600 }}>
                        {c.distanciel && c.mention ? c.mention : c.enseignants}
                    </td>
                );
            } else {
                sortie.push(
                    <td key={i} colSpan={span} style={{ ...td, ...(c.distanciel ? { background: DOC.orange, color: DOC.orangeTexte, fontWeight: 700 } : {}) }}>
                        {c.distanciel ? (
                            t('monthly.remote')
                        ) : (
                            <>
                                <div style={{ fontWeight: 600 }}>{c.salle.campus} :</div>
                                <div>{c.salle.detail}</div>
                            </>
                        )}
                    </td>
                );
            }
        });
        // Demi-journée sans cours dans la grille ce jour-là (samedi après-midi) : case grisée
        if (ligne === 0 && couverts < total) sortie.push(<td key="vide" colSpan={total - couverts} rowSpan={3} style={{ ...td, background: DOC.vide }} />);
        return sortie;
    };

    return (
        <Box className="edt-document" sx={{ bgcolor: DOC.fond, color: DOC.encre, p: { xs: 1, md: 2 }, overflowX: 'auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <img src="/HESTIM.png" alt="HESTIM" style={{ height: 42 }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {t('monthly.year')} : {edt.entete.annee_universitaire ?? '-'}
                </span>
            </Box>
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700 }}>{t('monthly.title')}</div>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: DOC.rouge }}>{edt.entete.intitule_classe}</div>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: DOC.marine, marginBottom: 8 }}>{edt.entete.code_classe}</div>

            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', minWidth: 760 }}>
                <colgroup>
                    <col style={{ width: 70 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 62 }} />
                </colgroup>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ ...td, background: DOC.vide }}>{t('monthly.week')}</th>
                        <th rowSpan={2} style={{ ...td, background: DOC.vide }}>{t('monthly.days')}</th>
                        <th rowSpan={2} style={{ ...td, background: DOC.vide }}>M/E/S</th>
                        <th colSpan={nbMatin} style={{ ...td, background: DOC.vide }}>{t('monthly.morning')}</th>
                        <th colSpan={nbApres} style={{ ...td, background: DOC.vide }}>{t('monthly.afternoon')}</th>
                    </tr>
                    <tr>
                        {[...edt.grille.matin, ...edt.grille.apres_midi].map((r) => (
                            <th key={r.rang} style={{ ...td, background: DOC.vide }}>
                                {heure(r.heure_debut)}-{heure(r.heure_fin)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {edt.semaines.map((semaine) =>
                        semaine.jours.map((jour, j) => (
                            <Fragment key={jour.date}>
                                <tr>
                                    {j === 0 && (
                                        <td rowSpan={semaine.jours.length * 3} style={{ ...td, fontWeight: 700, background: DOC.vide }}>
                                            {semaine.libelle}
                                        </td>
                                    )}
                                    <td rowSpan={3} style={{ ...td, fontWeight: 600 }}>
                                        {jour.libelle}
                                    </td>
                                    <td style={td}>{t('monthly.subject')}</td>
                                    {cellules(jour.matin, nbMatin, 0)}
                                    {cellules(jour.apres_midi, nbApres, 0)}
                                </tr>
                                <tr>
                                    <td style={td}>{t('monthly.teacher')}</td>
                                    {cellules(jour.matin, nbMatin, 1)}
                                    {cellules(jour.apres_midi, nbApres, 1)}
                                </tr>
                                <tr>
                                    <td style={td}>{t('monthly.room')}</td>
                                    {cellules(jour.matin, nbMatin, 2)}
                                    {cellules(jour.apres_midi, nbApres, 2)}
                                </tr>
                            </Fragment>
                        ))
                    )}
                </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 11, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {edt.pied.vendredi && <strong>{edt.pied.vendredi}</strong>}
                {edt.pied.legende.map((l) => (
                    <span key={l}>{l}</span>
                ))}
            </div>
        </Box>
    );
}
