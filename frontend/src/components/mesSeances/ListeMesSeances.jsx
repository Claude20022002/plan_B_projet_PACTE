import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EventRepeat, QrCode2 } from '@mui/icons-material';
import { dateCourte, heureCourte } from '../reports/format';

/**
 * Séances d'un enseignant : un tableau sur ordinateur, des cartes empilées sur téléphone, où le
 * tableau cachait le créneau, le statut et les actions hors de l'écran (recette, M-8).
 * peutFaireAppel / peutReporter disent quelles actions une séance propose.
 */

const STATUT_CONFIG = {
    // Une séance planifiée est tenue pour confirmée : rien à confirmer, sauf à demander un report
    planifie: { label: 'confirme', color: 'success' },
    confirme: { label: 'confirme', color: 'success' },
    annule: { label: 'annule', color: 'error' },
    reporte: { label: 'reporte', color: 'warning' },
    // Report accepté sans date (R-1) : la séance attend sa nouvelle date
    a_reprogrammer: { label: 'a_reprogrammer', color: 'warning' },
    realise: { label: 'realise', color: 'default' },
};

function Statut({ statut }) {
    const { t } = useTranslation();
    const { label, color } = STATUT_CONFIG[statut] ?? { label: statut, color: 'default' };
    return <Chip label={t(`mesSeances.statuts.${label}`, { defaultValue: label })} size="small" color={color} />;
}

/** Rend la liste ; onAppel(séance) et onReport(séance) lancent les actions. */
export default function ListeMesSeances({ affectations, peutFaireAppel, peutReporter, onAppel, onReport }) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const telephone = useMediaQuery(theme.breakpoints.down('sm'));
    const horaire = (aff) => `${heureCourte(aff.creneau?.heure_debut)}–${heureCourte(aff.creneau?.heure_fin)}`;

    if (telephone) {
        return (
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, mt: 2, p: 0 }}>
                {affectations.map((aff) => {
                    const appel = peutFaireAppel(aff);
                    const report = peutReporter(aff);
                    return (
                        <Paper component="li" key={aff.id_affectation} variant="outlined" sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {aff.cours?.nom_cours || '-'}
                                </Typography>
                                <Statut statut={aff.statut} />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                                {dateCourte(aff.date_seance, i18n.language)} · {horaire(aff)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {[aff.salle?.nom_salle, aff.groupe?.nom_groupe].filter(Boolean).join(' · ') || '-'}
                            </Typography>
                            {(appel || report) && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                    {appel && (
                                        <Button size="small" variant="contained" startIcon={<QrCode2 />} onClick={() => onAppel(aff)}>
                                            {t('mesSeances.appel')}
                                        </Button>
                                    )}
                                    {report && (
                                        <Button size="small" variant="outlined" startIcon={<EventRepeat />} onClick={() => onReport(aff)}>
                                            {t('mesSeances.demanderReport')}
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    );
                })}
            </Stack>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                        <TableCell>{t('mesSeances.colonnes.cours')}</TableCell>
                        <TableCell>{t('mesSeances.colonnes.groupe')}</TableCell>
                        <TableCell>{t('mesSeances.colonnes.salle')}</TableCell>
                        <TableCell>{t('mesSeances.colonnes.date')}</TableCell>
                        <TableCell>{t('mesSeances.colonnes.creneau')}</TableCell>
                        <TableCell>{t('mesSeances.colonnes.statut')}</TableCell>
                        <TableCell align="center">{t('mesSeances.colonnes.actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {affectations.map((aff) => (
                        <TableRow key={aff.id_affectation} hover>
                            <TableCell>{aff.cours?.nom_cours || '-'}</TableCell>
                            <TableCell>{aff.groupe?.nom_groupe || '-'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{aff.salle?.nom_salle || '-'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateCourte(aff.date_seance, i18n.language)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{horaire(aff)}</TableCell>
                            <TableCell>
                                <Statut statut={aff.statut} />
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                    {peutFaireAppel(aff) && (
                                        <Tooltip title={t('mesSeances.appel')}>
                                            <IconButton size="small" color="primary" onClick={() => onAppel(aff)} aria-label={t('mesSeances.appel')}>
                                                <QrCode2 fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {peutReporter(aff) && (
                                        <Tooltip title={t('mesSeances.demanderReport')}>
                                            <IconButton size="small" color="warning" onClick={() => onReport(aff)} aria-label={t('mesSeances.demanderReport')}>
                                                <EventRepeat fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
