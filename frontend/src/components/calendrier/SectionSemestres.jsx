import {
    Box,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/** Les semestres d'une année universitaire. */
export default function SectionSemestres({ annee, plage, onAjouter, onModifier, onSupprimer }) {
    const { t } = useTranslation();
    return (
        <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h2" component="h2">
                    {t('ref.calendar.semesters')}
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={() => onAjouter()}>
                    {t('ref.calendar.addSemester')}
                </Button>
            </Box>
            {annee?.periodes?.length ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 90 }}>{t('ref.calendar.cols.code')}</TableCell>
                            <TableCell>{t('ref.calendar.cols.dates')}</TableCell>
                            <TableCell align="right">{t('ref.calendar.cols.weeks')}</TableCell>
                            <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {annee.periodes.map((periode) => (
                            <TableRow key={periode.id_periode}>
                                <TableCell sx={{ fontWeight: 600 }}>{periode.code}</TableCell>
                                <TableCell>
                                    {plage(periode.date_debut, periode.date_fin)}
                                    {periode.libelle && (
                                        <Typography component="span" variant="body2" color="text.secondary">
                                            {' '}· {periode.libelle}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">{periode.nb_semaines}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onModifier(periode)}
                                        aria-label={t('ref.common.editItem', { name: periode.code })}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => onSupprimer(periode)} aria-label={t('ref.common.deleteItem', { name: periode.code })}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    {t('ref.calendar.noSemester')}
                </Typography>
            )}
        </Box>
    );
}
