import { useTranslation } from 'react-i18next';
import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import StateChip from '../../design-system/components/StateChip';
import { ds } from '../../design-system/tokens';
import { dateCourte } from '../reports/format';

/**
 * Détail des enseignements d'une génération : heures placées sur heures prévues, séances, et les
 * dates sautées avec leur raison. `nombre` : Intl.NumberFormat des heures.
 */
export default function DetailEnseignements({ enseignements, nombre }) {
    const { t, i18n } = useTranslation();

    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{t('ref.teaching.cols.module')}</TableCell>
                        <TableCell align="right">{t('gen.report.hours')}</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('gen.report.sessions')}</TableCell>
                        <TableCell>{t('gen.report.skipped')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {enseignements.map((e) => (
                        <TableRow key={e.id_enseignement} hover>
                            <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {e.module}
                                    </Typography>
                                    <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                        {e.type}
                                    </Typography>
                                    {e.lecons_non_placees > 0 ? (
                                        <StateChip tone="danger" title={t('gen.report.unplacedTitle')}>{t('gen.report.unplacedChip')}</StateChip>
                                    ) : (
                                        !e.complet && <StateChip tone="warning">{t('gen.report.incompleteChip')}</StateChip>
                                    )}
                                </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                {nombre.format(e.heures_planifiees)} / {nombre.format(e.heures_prevues)} h
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>{e.seances}</TableCell>
                            <TableCell>
                                {e.sautees.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                ) : (
                                    e.sautees.map((s) => (
                                        <Typography key={s.date} variant="caption" component="div" color="text.secondary">
                                            <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{dateCourte(s.date, i18n.language)}</Box> · {s.message}
                                        </Typography>
                                    ))
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
