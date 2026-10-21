import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Button, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Alert, Card, CardContent, Grid,
} from '@mui/material';
import { CheckCircle, Visibility, Warning, CheckCircleOutline } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { conflitAPI, affectationAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { ds } from '../../design-system/tokens';

// ── Palette, par code de segment (libellés : conflits.segments.<code>) ─────────
const COLORS = {
    sans:       ds.colors.success.text,
    salle:      ds.colors.danger.text,
    enseignant: ds.colors.warning.text,
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <Paper sx={{ px: 1.5, py: 1, fontSize: 13, boxShadow: 3 }}>
            <strong>{d.name}</strong><br />
            {d.value} ({d.payload.pct} %)
        </Paper>
    );
}

/** Conflits de planification (administration) : répartition, liste, détail et résolution. */
export default function Conflits() {
    const { t, i18n } = useTranslation();

    // ── Tableau ───────────────────────────────────────────────────────────────
    const [conflits,       setConflits]       = useState([]);
    const [page,           setPage]           = useState(0);
    const [rowsPerPage,    setRowsPerPage]    = useState(10);
    const [total,          setTotal]          = useState(0);
    const [filter,         setFilter]         = useState('all');
    const [dialogOpen,     setDialogOpen]     = useState(false);
    const [selected,       setSelected]       = useState(null);

    // ── Donut ─────────────────────────────────────────────────────────────────
    const [donutData,      setDonutData]      = useState([]);
    const [totalConflits,  setTotalConflits]  = useState(0);
    const [totalAff,       setTotalAff]       = useState(0);

    useEffect(() => { loadConflits(); }, [page, rowsPerPage, filter]);
    useEffect(() => { loadDonutData(); }, []);

    // ── API ───────────────────────────────────────────────────────────────────
    const loadConflits = async () => {
        try {
            const data = filter === 'non-resolus'
                ? await conflitAPI.getNonResolus({ page: page + 1, limit: rowsPerPage })
                : await conflitAPI.getAll({
                    page: page + 1, limit: rowsPerPage,
                    ...(filter === 'resolus' ? { resolu: 'true' } : {}),
                });
            setConflits(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (err) { console.error(err); }
    };

    const loadDonutData = async () => {
        try {
            // Charger TOUS les conflits + total affectations en parallèle
            const [cRes, aRes] = await Promise.all([
                conflitAPI.getTous(),
                affectationAPI.getAll({ limit: 1 }),
            ]);

            const all  = cRes || [];
            const nAff = aRes.pagination?.total ?? 0;
            const nTotal = all.length;

            const nSalle = all.filter(c => (c.type_conflit || '').toLowerCase().includes('salle')).length;
            const nEns   = all.filter(c => (c.type_conflit || '').toLowerCase().includes('enseignant')).length;
            const nAutre = nTotal - nSalle - nEns;
            const nSans  = Math.max(0, nAff - nTotal);

            setTotalConflits(nTotal);
            setTotalAff(nAff);

            // Construire les segments — toujours inclure "Sans conflit" si nAff > 0
            const segments = [];
            if (nSans  > 0) segments.push({ code: 'sans',       value: nSans  });
            if (nSalle > 0) segments.push({ code: 'salle',      value: nSalle });
            if (nEns   > 0) segments.push({ code: 'enseignant', value: nEns   });
            if (nAutre > 0) segments.push({ code: 'autre',      value: nAutre });

            // Fallback si pas d'affectations : afficher uniquement les conflits par type
            const base = segments.reduce((s, d) => s + d.value, 0) || 1;
            setDonutData(segments.map(d => ({
                ...d,
                pct: ((d.value / base) * 100).toFixed(1),
            })));
        } catch (err) { console.error(err); }
    };

    const handleResoudre = async (id) => {
        try {
            await conflitAPI.update(id, { resolu: true, date_resolution: new Date().toISOString() });
            loadConflits();
            loadDonutData();
        } catch (err) { console.error(err); }
    };

    // Libellés des segments dans la langue de l'écran
    const donut = donutData.map((d) => ({ ...d, name: t(`conflits.segments.${d.code}`) }));

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <Box>

                {/* ── En-tête ──────────────────────────────────────────── */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
                    {/* Le titre est celui de la mise en page, et le menu y ramène : plus de « Retour » ni de « Gestion des… » (recette, m-1 et m-2) */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                            { key: 'all',         label: t('conflits.filtres.tous'),       color: 'primary' },
                            { key: 'non-resolus', label: t('conflits.filtres.nonResolus'), color: 'error'   },
                            { key: 'resolus',     label: t('conflits.filtres.resolus'),    color: 'success' },
                        ].map(({ key, label, color }) => (
                            <Button key={key} size="small"
                                variant={filter === key ? 'contained' : 'outlined'}
                                color={color}
                                onClick={() => { setFilter(key); setPage(0); }}>
                                {label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* ── Donut chart ──────────────────────────────────────── */}
                {donut.length > 0 && (
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent sx={{ pb: '16px !important' }}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>
                                {t('conflits.repartition')}
                            </Typography>

                            {/* MUI v7 Grid — prop `size` obligatoire */}
                            <Grid container spacing={3} alignItems="center">

                                {/* Donut */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Box sx={{ position: 'relative', height: 230 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={donut}
                                                    cx="50%" cy="50%"
                                                    innerRadius={65} outerRadius={95}
                                                    dataKey="value"
                                                    startAngle={90} endAngle={-270}
                                                    strokeWidth={2}
                                                >
                                                    {donut.map((entry) => (
                                                        <Cell key={entry.name}
                                                            fill={COLORS[entry.code] || ds.lineUnknown} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Compteur central HTML — plus fiable que labelContent SVG */}
                                        <Box sx={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            pointerEvents: 'none',
                                        }}>
                                            <Typography variant="h3" fontWeight={700} lineHeight={1}>
                                                {totalConflits}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                {t('conflits.detectes', { count: totalConflits })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Légende */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {donut.map((entry) => (
                                            <Box key={entry.name}>
                                                <Box sx={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    alignItems: 'center', mb: 0.5,
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 12, height: 12, borderRadius: '50%',
                                                            bgcolor: COLORS[entry.code] || ds.lineUnknown,
                                                            flexShrink: 0,
                                                        }} />
                                                        <Typography variant="body2">{entry.name}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={entry.value} size="small" variant="outlined" />
                                                        <Typography variant="body2" fontWeight={700}
                                                            sx={{ color: COLORS[entry.code] || ds.lineUnknown, minWidth: 48, textAlign: 'right' }}>
                                                            {entry.pct} %
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {/* Barre de progression */}
                                                <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover' }}>
                                                    <Box sx={{
                                                        height: '100%',
                                                        width: `${Math.min(100, entry.pct)}%`,
                                                        bgcolor: COLORS[entry.code] || ds.lineUnknown,
                                                        borderRadius: 3,
                                                        transition: 'width .4s ease',
                                                    }} />
                                                </Box>
                                            </Box>
                                        ))}

                                        {/* Résumé */}
                                        {totalAff > 0 && (
                                            <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('conflits.resume', { seances: totalAff, count: totalConflits })}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* ── Alerte filtre ─────────────────────────────────────── */}
                {filter === 'non-resolus' && conflits.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {t('conflits.attention', { count: conflits.length })}
                    </Alert>
                )}

                {/* ── Tableau ───────────────────────────────────────────── */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>{t('conflits.colonnes.type')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('conflits.colonnes.description')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('conflits.colonnes.detection')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('conflits.colonnes.statut')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">{t('conflits.colonnes.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conflits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                        {t('conflits.aucun')}
                                    </TableCell>
                                </TableRow>
                            ) : conflits.map((c) => (
                                <TableRow key={c.id_conflit} hover>
                                    <TableCell>
                                        <Chip
                                            label={c.type_conflit}
                                            size="small"
                                            color={
                                                (c.type_conflit || '').includes('salle')       ? 'error'
                                              : (c.type_conflit || '').includes('enseignant')  ? 'warning'
                                              : 'info'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>{c.description}</TableCell>
                                    <TableCell>
                                        {new Date(c.date_detection).toLocaleDateString(i18n.language)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={t(c.resolu ? 'conflits.resolu' : 'conflits.nonResolu')}
                                            color={c.resolu ? 'success' : 'error'}
                                            size="small"
                                            icon={c.resolu ? <CheckCircleOutline /> : <Warning />}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small"
                                            onClick={() => { setSelected(c); setDialogOpen(true); }}
                                            aria-label={t('conflits.details')}>
                                            <Visibility />
                                        </IconButton>
                                        {!c.resolu && (
                                            <IconButton size="small" color="success"
                                                onClick={() => handleResoudre(c.id_conflit)}
                                                aria-label={t('conflits.marquerResolu')}>
                                                <CheckCircle />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>

                {/* ── Dialog détail ─────────────────────────────────────── */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('conflits.titreDetails')}</DialogTitle>
                    <DialogContent dividers>
                        {selected && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Typography><strong>{t('conflits.colonnes.type')} :</strong> {selected.type_conflit}</Typography>
                                <Typography><strong>{t('conflits.colonnes.description')} :</strong> {selected.description}</Typography>
                                <Typography>
                                    <strong>{t('conflits.colonnes.detection')} :</strong>{' '}
                                    {new Date(selected.date_detection).toLocaleString(i18n.language)}
                                </Typography>
                                <Typography>
                                    <strong>{t('conflits.colonnes.statut')} :</strong>{' '}
                                    <Chip size="small"
                                        label={t(selected.resolu ? 'conflits.resolu' : 'conflits.nonResolu')}
                                        color={selected.resolu ? 'success' : 'error'} />
                                </Typography>
                                {selected.resolu && selected.date_resolution && (
                                    <Typography>
                                        <strong>{t('conflits.resoluLe')} :</strong>{' '}
                                        {new Date(selected.date_resolution).toLocaleString(i18n.language)}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>{t('common.close')}</Button>
                        {selected && !selected.resolu && (
                            <Button variant="contained" color="success"
                                onClick={() => { handleResoudre(selected.id_conflit); setDialogOpen(false); }}>
                                {t('conflits.marquerResolu')}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

            </Box>
        </DashboardLayout>
    );
}
