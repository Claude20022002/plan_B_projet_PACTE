import { useTranslation } from 'react-i18next';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { dateCourte, heureCourte } from '../reports/format';

/**
 * Les séances d'une classe en tableau (exploration après la génération, R-4) : date, horaire,
 * module, enseignant et salle, dans l'ordre du calendrier. `seances` : affectations déjà triées.
 */
export default function TableauSeancesClasse({ seances, titre }) {
    const { t, i18n } = useTranslation();

    return (
        // Zone défilante sur petit écran : atteignable au clavier, avec un nom (WCAG 2.1.1)
        <TableContainer component={Paper} variant="outlined" tabIndex={0} aria-label={titre}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{t('gen.explore.cols.date')}</TableCell>
                        <TableCell>{t('gen.explore.cols.time')}</TableCell>
                        <TableCell>{t('gen.explore.cols.module')}</TableCell>
                        <TableCell>{t('gen.explore.cols.teacher')}</TableCell>
                        <TableCell>{t('gen.explore.cols.room')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {seances.map((s) => (
                        <TableRow key={s.id_affectation}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateCourte(s.date_seance, i18n.language)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                {heureCourte(s.creneau?.heure_debut)}–{heureCourte(s.creneau?.heure_fin)}
                            </TableCell>
                            <TableCell>{[s.cours?.nom_cours, s.cours?.type_cours].filter(Boolean).join(' · ')}</TableCell>
                            <TableCell>{[s.enseignant?.prenom, s.enseignant?.nom].filter(Boolean).join(' ') || '—'}</TableCell>
                            <TableCell>{s.salle?.nom_salle ?? t('monthly.remote')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
