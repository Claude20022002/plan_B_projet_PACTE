import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { generationAutomatiqueAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Versions du planning (une par génération) : la liste, et la réactivation d'une version après
 * confirmation. `dateHeure` : Intl.DateTimeFormat de la date de création.
 */
export default function VersionsGeneration({ dateHeure }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [versions, setVersions] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [aReactiver, setAReactiver] = useState(null);

    const charger = useCallback(async () => {
        setChargement(true);
        try {
            setVersions((await generationAutomatiqueAPI.snapshots()).snapshots);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setChargement(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const reactiver = async () => {
        try {
            await generationAutomatiqueAPI.rollbackSnapshot(aReactiver.id_snapshot);
            toast.success(t('gen.versions.done'));
            setAReactiver(null);
            charger();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (chargement) return <TableSkeleton rows={6} />;

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('gen.versions.intro')}
            </Typography>
            {versions.length === 0 ? (
                <EmptyState title={t('gen.versions.emptyTitle')} description={t('gen.versions.emptyBody')} />
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('gen.versions.cols.label')}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('gen.versions.cols.date')}</TableCell>
                                <TableCell align="right">{t('gen.versions.cols.sessions')}</TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {versions.map((v) => (
                                <TableRow key={v.id_snapshot} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {v.label}
                                            </Typography>
                                            {v.is_active && <StateChip tone="success">{t('gen.versions.active')}</StateChip>}
                                        </Stack>
                                        {v.admin_createur && (
                                            <Typography variant="caption" color="text.secondary">
                                                {v.admin_createur.prenom} {v.admin_createur.nom}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>{dateHeure.format(new Date(v.createdAt))}</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{v.nb_affectations ?? 0}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" onClick={() => setAReactiver(v)}>
                                            {t('gen.versions.restore')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={Boolean(aReactiver)} onClose={() => setAReactiver(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('gen.versions.confirmTitle')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">{t('gen.versions.confirmBody', { label: aReactiver?.label ?? '' })}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAReactiver(null)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={reactiver}>
                        {t('gen.versions.restore')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
