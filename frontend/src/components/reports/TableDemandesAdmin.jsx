import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { Check, Close, Visibility } from '@mui/icons-material';
import StatutDemande from './StatutDemande';
import { dateCourte, dateEtHeure, demandeeDe, origineDe } from './format';

/**
 * Demandes de report vues par l'administration : une ligne par demande, avec la date d'origine
 * de la séance (et non sa date actuelle, réécrite par un report approuvé) et le créneau demandé.
 * Les actions d'une demande en attente : voir, approuver, refuser. `enCours` : la demande en
 * cours de traitement, dont les boutons attendent.
 */
export default function TableDemandesAdmin({ demandes, creneaux, enCours, onVoir, onApprouver, onRefuser }) {
    const { t, i18n } = useTranslation();

    return (
        // Zone défilante sur petit écran : atteignable au clavier, avec un nom (WCAG 2.1.1)
        <TableContainer component={Paper} tabIndex={0} aria-label={t('reports.titre')}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t('reportsAdmin.colonnes.enseignant')}</TableCell>
                        <TableCell>{t('reports.colonnes.seance')}</TableCell>
                        <TableCell>{t('reports.colonnes.origine')}</TableCell>
                        <TableCell>{t('reports.colonnes.nouvelleDate')}</TableCell>
                        <TableCell>{t('reports.colonnes.motif')}</TableCell>
                        <TableCell>{t('reports.colonnes.statut')}</TableCell>
                        <TableCell>{t('reports.colonnes.dateDemande')}</TableCell>
                        <TableCell align="center">{t('reportsAdmin.colonnes.actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {demandes.map((d) => {
                        const attente = enCours === d.id_demande;
                        return (
                            <TableRow key={d.id_demande}>
                                <TableCell>{[d.enseignant?.prenom, d.enseignant?.nom].filter(Boolean).join(' ') || '—'}</TableCell>
                                <TableCell>{[d.affectation?.cours?.nom_cours, d.affectation?.groupe?.nom_groupe].filter(Boolean).join(' · ') || '—'}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(origineDe(d, creneaux), i18n.language)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateEtHeure(demandeeDe(d, creneaux), i18n.language)}</TableCell>
                                <TableCell>
                                    <Tooltip title={d.motif}>
                                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {d.motif}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <StatutDemande statut={d.statut_demande} />
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateCourte(d.date_demande, i18n.language)}</TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Tooltip title={t('reportsAdmin.voir')}>
                                            <IconButton size="small" onClick={() => onVoir(d)} aria-label={t('reportsAdmin.voir')}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        {d.statut_demande === 'en_attente' && (
                                            <>
                                                <Tooltip title={t('reportsAdmin.approuver')}>
                                                    <span>
                                                        <IconButton size="small" color="success" onClick={() => onApprouver(d)} disabled={attente} aria-label={t('reportsAdmin.approuver')}>
                                                            {attente ? <CircularProgress size={20} /> : <Check />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={t('reportsAdmin.refuser')}>
                                                    <span>
                                                        <IconButton size="small" color="error" onClick={() => onRefuser(d)} disabled={attente} aria-label={t('reportsAdmin.refuser')}>
                                                            {attente ? <CircularProgress size={20} /> : <Close />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
