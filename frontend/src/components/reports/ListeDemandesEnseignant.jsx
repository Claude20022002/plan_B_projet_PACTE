import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import StatutDemande from './StatutDemande';
import { dateCourte, dateEtHeure, demandeeDe, origineDe } from './format';

/**
 * Demandes de report d'un enseignant : un tableau sur ordinateur, des cartes empilées sur
 * téléphone, où un tableau coupait le statut et cachait la date d'origine (recette, M-8).
 * `creneaux` : Map id_creneau → créneau (useCreneauxParId), pour les heures.
 */
export default function ListeDemandesEnseignant({ demandes, creneaux }) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const telephone = useMediaQuery(theme.breakpoints.down('sm'));
    const seanceDe = (d) => [d.affectation?.cours?.nom_cours, d.affectation?.groupe?.nom_groupe].filter(Boolean).join(' · ') || '—';

    if (telephone) {
        return (
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {demandes.map((d) => (
                    <Paper component="li" key={d.id_demande} variant="outlined" sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {seanceDe(d)}
                            </Typography>
                            <StatutDemande statut={d.statut_demande} />
                        </Box>
                        <Typography variant="body2">
                            {t('reports.colonnes.origine')} : {dateEtHeure(origineDe(d, creneaux), i18n.language)}
                        </Typography>
                        <Typography variant="body2">
                            {t('reports.colonnes.nouvelleDate')} : {dateEtHeure(demandeeDe(d, creneaux), i18n.language)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {d.motif}
                        </Typography>
                    </Paper>
                ))}
            </Stack>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t('reports.colonnes.seance')}</TableCell>
                        <TableCell>{t('reports.colonnes.origine')}</TableCell>
                        <TableCell>{t('reports.colonnes.nouvelleDate')}</TableCell>
                        <TableCell>{t('reports.colonnes.motif')}</TableCell>
                        <TableCell>{t('reports.colonnes.statut')}</TableCell>
                        <TableCell>{t('reports.colonnes.dateDemande')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {demandes.map((d) => (
                        <TableRow key={d.id_demande}>
                            <TableCell>{seanceDe(d)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(origineDe(d, creneaux), i18n.language)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(demandeeDe(d, creneaux), i18n.language)}</TableCell>
                            <TableCell>{d.motif}</TableCell>
                            <TableCell>
                                <StatutDemande statut={d.statut_demande} />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateCourte(d.date_demande, i18n.language)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
