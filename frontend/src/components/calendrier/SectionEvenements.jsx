import {
    Box,
    Button,
    FormControlLabel,
    IconButton,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StateChip from '../../design-system/components/StateChip';
import { hhmm } from './constantes';

// Le type est une catégorie, pas un état : pastille neutre (le rouge et l'orange restent aux états).
// Seul le Ramadan se distingue, en marine voilé, car il change la grille horaire.
const toneType = (type) => (type === 'ramadan' ? 'info' : 'neutral');

/** Les événements du calendrier de l'année : liste, filtre « à confirmer » et actions. */
export default function SectionEvenements({ evenements, nbAConfirmer, aConfirmerSeulement, plage, libelleCible, onFiltrer, onAjouter, onModifier, onSupprimer, onConfirmer }) {
    const { t } = useTranslation();
    return (
    <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h2" component="h2">
                    {t('ref.calendar.events')}
                </Typography>
                {nbAConfirmer > 0 && <StateChip tone="warning">{t('ref.calendar.toConfirmCount', { count: nbAConfirmer })}</StateChip>}
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <FormControlLabel
                    control={<Switch size="small" checked={aConfirmerSeulement} onChange={(e) => onFiltrer(e.target.checked)} />}
                    label={t('ref.calendar.onlyToConfirm')}
                />
                <Button variant="contained" startIcon={<Add />} onClick={onAjouter}>
                    {t('ref.calendar.addEvent')}
                </Button>
            </Stack>
        </Box>
        {evenements.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                {t('ref.calendar.noEvents')}
            </Typography>
        ) : (
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('ref.calendar.eventCols.dates')}</TableCell>
                            <TableCell>{t('ref.calendar.eventCols.title')}</TableCell>
                            <TableCell>{t('ref.calendar.eventCols.type')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.calendar.eventCols.scope')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.calendar.eventCols.blocking')}</TableCell>
                            <TableCell>{t('ref.calendar.eventCols.state')}</TableCell>
                            <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {evenements.map((evenement) => (
                            <TableRow key={evenement.id_evenement} hover>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {plage(evenement.date_debut, evenement.date_fin)}
                                    {evenement.heure_debut && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            {hhmm(evenement.heure_debut)} – {hhmm(evenement.heure_fin)}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{evenement.titre}</TableCell>
                                <TableCell>
                                    <StateChip tone={toneType(evenement.type_evenement)}>{t(`ref.eventTypes.${evenement.type_evenement}`)}</StateChip>
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>{libelleCible(evenement)}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                    {evenement.bloque_affectations ? t('ref.calendar.blocking') : t('ref.calendar.notBlocking')}
                                </TableCell>
                                <TableCell>
                                    {/* Seule la date à confirmer appelle une action : elle seule est signalée */}
                                    {evenement.date_confirmee ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {t('ref.calendar.confirmed')}
                                        </Typography>
                                    ) : (
                                        <StateChip tone="warning">{t('ref.calendar.toConfirm')}</StateChip>
                                    )}
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {!evenement.date_confirmee && (
                                        <Button
                                            size="small"
                                            onClick={() => onConfirmer(evenement)}
                                        >
                                            {t('ref.calendar.confirm')}
                                        </Button>
                                    )}
                                    <IconButton size="small" onClick={() => onModifier(evenement)} aria-label={t('ref.common.editItem', { name: evenement.titre })}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => onSupprimer(evenement)} aria-label={t('ref.common.deleteItem', { name: evenement.titre })}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )}
    </Paper>
    );
}
