import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import StatutDemande from './StatutDemande';
import ConfirmationReport from './ConfirmationReport';
import { dateCourte, dateEtHeure, demandeeDe, origineDe } from './format';

/**
 * Demandes de report d'un enseignant : un tableau sur ordinateur, des cartes empilées sur
 * téléphone, où un tableau coupait le statut et cachait la date d'origine (recette, M-8).
 * `creneaux` : Map id_creneau → créneau (useCreneauxParId), pour les heures.
 * Une demande refusée montre sous son statut la raison donnée par l'administration, s'il y en a une.
 * Une demande à confirmer montre la place proposée et la réponse attendue (ConfirmationReport) :
 * `onAccepter`, `onProposer`, `enCours` (id de la demande dont la réponse part).
 * `enEvidence` : id de la demande ouverte depuis la notification, mise en avant.
 */
export default function ListeDemandesEnseignant({ demandes, creneaux, enCours = null, enEvidence = null, onAccepter, onProposer }) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const telephone = useMediaQuery(theme.breakpoints.down('sm'));
    const seanceDe = (d) => [d.affectation?.cours?.nom_cours, d.affectation?.groupe?.nom_groupe].filter(Boolean).join(' · ') || '—';
    const raisonDe = (d) =>
        d.statut_demande === 'refuse' && d.motif_decision ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('reports.colonnes.raisonRefus')} : {d.motif_decision}
            </Typography>
        ) : null;
    const reponseDe = (d) =>
        d.statut_demande === 'a_confirmer' ? (
            <ConfirmationReport demande={d} enCours={enCours === d.id_demande} onAccepter={onAccepter} onProposer={onProposer} />
        ) : null;
    // L'id sert à faire défiler la page jusqu'à la demande de la notification
    const ancre = (d) => `demande-${d.id_demande}`;

    if (telephone) {
        return (
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {demandes.map((d) => (
                    <Paper
                        component="li"
                        key={d.id_demande}
                        id={ancre(d)}
                        variant="outlined"
                        sx={{ p: 1.5, ...(enEvidence === d.id_demande && { borderColor: 'primary.main', borderWidth: 2 }) }}
                    >
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
                        {raisonDe(d)}
                        {d.statut_demande === 'a_confirmer' && <Box sx={{ mt: 1.5 }}>{reponseDe(d)}</Box>}
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
                    {demandes.map((d) => {
                        const aConfirmer = d.statut_demande === 'a_confirmer';
                        // Une demande à confirmer garde sa réponse dans une seconde ligne : pas de bordure entre les deux
                        const sansBordure = aConfirmer ? { '& > td': { borderBottom: 'none' } } : {};
                        return (
                            <Fragment key={d.id_demande}>
                                <TableRow id={ancre(d)} selected={enEvidence === d.id_demande} sx={sansBordure}>
                                    <TableCell>{seanceDe(d)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(origineDe(d, creneaux), i18n.language)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(demandeeDe(d, creneaux), i18n.language)}</TableCell>
                                    <TableCell>{d.motif}</TableCell>
                                    <TableCell>
                                        <StatutDemande statut={d.statut_demande} />
                                        {raisonDe(d)}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateCourte(d.date_demande, i18n.language)}</TableCell>
                                </TableRow>
                                {aConfirmer && (
                                    <TableRow selected={enEvidence === d.id_demande}>
                                        <TableCell colSpan={6} sx={{ pt: 0 }}>
                                            {reponseDe(d)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
