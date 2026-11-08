import { useTranslation } from 'react-i18next';
import { Box, Button, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Save } from '@mui/icons-material';
import StateChip from '../../design-system/components/StateChip';

/**
 * Temps de trajet entre deux campus (une ligne par paire), utilisés par la règle des trajets.
 * Sur téléphone, la colonne « État » disparaît et le tableau défile dans son cadre : il poussait
 * « Enregistrer » hors de l'écran (recette, M-9).
 */
export default function TempsTrajet({ paires, minutes, enregistres, defautMinutes, onMinutes, onEnregistrer }) {
    const { t } = useTranslation();
    const cacheTelephone = { display: { xs: 'none', sm: 'table-cell' } };
    return (
        <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h2" component="h2">
                {t('ref.campus.travelTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 720 }}>
                {t('ref.campus.travelIntro', { minutes: defautMinutes })}
            </Typography>
            {paires.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    {t('ref.campus.needTwo')}
                </Typography>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('ref.campus.cols.route')}</TableCell>
                                <TableCell>{t('ref.campus.cols.minutes')}</TableCell>
                                <TableCell sx={cacheTelephone}>{t('ref.campus.cols.state')}</TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paires.map((paire) => (
                                <TableRow key={paire.cle}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {paire.a.nom} ↔ {paire.b.nom}
                                    </TableCell>
                                    <TableCell sx={{ width: { xs: 120, sm: 180 } }}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            sx={{ minWidth: 108 }}
                                            value={minutes[paire.cle] ?? ''}
                                            placeholder={String(defautMinutes)}
                                            onChange={(e) => onMinutes(paire.cle, e.target.value)}
                                            inputProps={{ min: 0, max: 240, 'aria-label': `${paire.a.nom} ↔ ${paire.b.nom}` }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cacheTelephone}>
                                        {enregistres.has(paire.cle) ? (
                                            <StateChip tone="success">{t('ref.campus.travelSet')}</StateChip>
                                        ) : (
                                            <StateChip tone="neutral">{t('ref.campus.travelDefault', { minutes: defautMinutes })}</StateChip>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {/* Sur téléphone, l'icône seule : le mot poussait la colonne hors de l'écran */}
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => onEnregistrer(paire)}
                                            disabled={minutes[paire.cle] === undefined || minutes[paire.cle] === ''}
                                            aria-label={t('common.save')}
                                            sx={{ minWidth: 40 }}
                                        >
                                            <Save fontSize="small" sx={{ display: { sm: 'none' } }} />
                                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                                {t('common.save')}
                                            </Box>
                                        </Button>
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
