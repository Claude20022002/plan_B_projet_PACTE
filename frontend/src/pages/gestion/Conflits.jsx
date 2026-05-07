import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Button, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Alert, Card, CardContent, Grid,
} from '@mui/material';
import { CheckCircle, Visibility, ArrowBack, Warning, CheckCircleOutline } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { conflitAPI, affectationAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// ── Palette ───────────────────────────────────────────────────────────────────
const COLORS = {
    'Sans conflit':          '#2e7d32',
    'Conflits de salle':     '#c62828',
    "Conflits d'enseignant": '#e8a020',
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

export default function Conflits() {
    const navigate = useNavigate();

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
                conflitAPI.getAll({ limit: 1000 }),
                affectationAPI.getAll({ limit: 1 }),
            ]);

            const all  = cRes.data || [];
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
            if (nSans  > 0) segments.push({ name: 'Sans conflit',          value: nSans  });
            if (nSalle > 0) segments.push({ name: 'Conflits de salle',     value: nSalle });
            if (nEns   > 0) segments.push({ name: "Conflits d'enseignant", value: nEns   });
            if (nAutre > 0) segments.push({ name: 'Autres conflits',       value: nAutre });

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

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <Box>

                {/* ── En-tête ──────────────────────────────────────────── */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button startIcon={<ArrowBack />}
                            onClick={() => navigate('/dashboard/admin')}
                            variant="outlined" size="small">
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Gestion des Conflits
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                            { key: 'all',         label: 'Tous',        color: 'primary' },
                            { key: 'non-resolus', label: 'Non résolus', color: 'error'   },
                            { key: 'resolus',     label: 'Résolus',     color: 'success' },
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
                {donutData.length > 0 && (
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent sx={{ pb: '16px !important' }}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>
                                Répartition des conflits
                            </Typography>

                            {/* MUI v7 Grid — prop `size` obligatoire */}
                            <Grid container spacing={3} alignItems="center">

                                {/* Donut */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Box sx={{ position: 'relative', height: 230 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={donutData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={65} outerRadius={95}
                                                    dataKey="value"
                                                    startAngle={90} endAngle={-270}
                                                    strokeWidth={2}
                                                >
                                                    {donutData.map((entry) => (
                                                        <Cell key={entry.name}
                                                            fill={COLORS[entry.name] || '#888'} />
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
                                                {totalConflits <= 1 ? 'conflit détecté' : 'conflits détectés'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Légende */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {donutData.map((entry) => (
                                            <Box key={entry.name}>
                                                <Box sx={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    alignItems: 'center', mb: 0.5,
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 12, height: 12, borderRadius: '50%',
                                                            bgcolor: COLORS[entry.name] || '#888',
                                                            flexShrink: 0,
                                                        }} />
                                                        <Typography variant="body2">{entry.name}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={entry.value} size="small" variant="outlined" />
                                                        <Typography variant="body2" fontWeight={700}
                                                            sx={{ color: COLORS[entry.name] || '#888', minWidth: 48, textAlign: 'right' }}>
                                                            {entry.pct} %
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {/* Barre de progression */}
                                                <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover' }}>
                                                    <Box sx={{
                                                        height: '100%',
                                                        width: `${Math.min(100, entry.pct)}%`,
                                                        bgcolor: COLORS[entry.name] || '#888',
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
                                                    Sur <strong>{totalAff}</strong> affectation(s) planifiée(s),{' '}
                                                    <strong style={{ color: '#c62828' }}>{totalConflits}</strong> conflit(s) détecté(s)
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
                        {conflits.length} conflit(s) non résolu(s) nécessitent votre attention
                    </Alert>
                )}

                {/* ── Tableau ───────────────────────────────────────────── */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date de détection</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conflits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                        Aucun conflit dans cette catégorie
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
                                        {new Date(c.date_detection).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={c.resolu ? 'Résolu' : 'Non résolu'}
                                            color={c.resolu ? 'success' : 'error'}
                                            size="small"
                                            icon={c.resolu ? <CheckCircleOutline /> : <Warning />}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small"
                                            onClick={() => { setSelected(c); setDialogOpen(true); }}
                                            aria-label="Voir les détails">
                                            <Visibility />
                                        </IconButton>
                                        {!c.resolu && (
                                            <IconButton size="small" color="success"
                                                onClick={() => handleResoudre(c.id_conflit)}
                                                aria-label="Marquer comme résolu">
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
                    <DialogTitle>Détails du conflit</DialogTitle>
                    <DialogContent dividers>
                        {selected && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Typography><strong>Type :</strong> {selected.type_conflit}</Typography>
                                <Typography><strong>Description :</strong> {selected.description}</Typography>
                                <Typography>
                                    <strong>Date de détection :</strong>{' '}
                                    {new Date(selected.date_detection).toLocaleString('fr-FR')}
                                </Typography>
                                <Typography>
                                    <strong>Statut :</strong>{' '}
                                    <Chip size="small"
                                        label={selected.resolu ? 'Résolu' : 'Non résolu'}
                                        color={selected.resolu ? 'success' : 'error'} />
                                </Typography>
                                {selected.resolu && selected.date_resolution && (
                                    <Typography>
                                        <strong>Résolu le :</strong>{' '}
                                        {new Date(selected.date_resolution).toLocaleString('fr-FR')}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
                        {selected && !selected.resolu && (
                            <Button variant="contained" color="success"
                                onClick={() => { handleResoudre(selected.id_conflit); setDialogOpen(false); }}>
                                Marquer comme résolu
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

            </Box>
        </DashboardLayout>
    );
}
