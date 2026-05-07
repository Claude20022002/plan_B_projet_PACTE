import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Button, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Alert, Card, CardContent, Grid,
} from '@mui/material';
import { CheckCircle, Visibility, ArrowBack, Warning, CheckCircleOutline } from '@mui/icons-material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { conflitAPI, affectationAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// ── Couleurs du donut ─────────────────────────────────────────────────────────
const DONUT_COLORS = {
    'Sans conflit':         '#2e7d32',
    'Conflits de salle':    '#c62828',
    "Conflits d'enseignant": '#e8a020',
};

// ── Label personnalisé au centre du donut ─────────────────────────────────────
function CentralLabel({ viewBox, total }) {
    const { cx, cy } = viewBox;
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#1a1a1a"
                style={{ fontSize: 28, fontWeight: 700 }}>
                {total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#666"
                style={{ fontSize: 11 }}>
                conflits
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" fill="#666"
                style={{ fontSize: 11 }}>
                détectés
            </text>
        </g>
    );
}

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, value, payload: p } = payload[0];
    return (
        <Paper sx={{ px: 1.5, py: 1, fontSize: 13 }}>
            <strong>{name}</strong><br />
            {value} ({p.pct}%)
        </Paper>
    );
}

export default function Conflits() {
    const navigate = useNavigate();

    // ── State tableau ─────────────────────────────────────────────────────────
    const [conflits, setConflits]           = useState([]);
    const [page, setPage]                   = useState(0);
    const [rowsPerPage, setRowsPerPage]     = useState(10);
    const [total, setTotal]                 = useState(0);
    const [open, setOpen]                   = useState(false);
    const [selectedConflit, setSelectedConflit] = useState(null);
    const [filter, setFilter]               = useState('all');

    // ── State donut ───────────────────────────────────────────────────────────
    const [donutData, setDonutData]         = useState([]);
    const [totalAff, setTotalAff]           = useState(0);
    const [totalConflits, setTotalConflits] = useState(0);

    useEffect(() => { loadConflits(); }, [page, rowsPerPage, filter]);
    useEffect(() => { loadDonutData(); }, []);

    // ── Chargement tableau ────────────────────────────────────────────────────
    const loadConflits = async () => {
        try {
            const data = filter === 'non-resolus'
                ? await conflitAPI.getNonResolus({ page: page + 1, limit: rowsPerPage })
                : await conflitAPI.getAll({
                    page: page + 1, limit: rowsPerPage,
                    resolu: filter === 'resolus' ? 'true' : undefined,
                });
            setConflits(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (err) { console.error(err); }
    };

    // ── Chargement données donut ──────────────────────────────────────────────
    const loadDonutData = async () => {
        try {
            const [allConflitsRes, allAffRes] = await Promise.all([
                conflitAPI.getAll({ limit: 1000 }),
                affectationAPI.getAll({ limit: 1 }),
            ]);

            const all  = allConflitsRes.data || [];
            const nAff = allAffRes.pagination?.total || 0;
            const nConf = all.length;

            const nSalle = all.filter(c =>
                (c.type_conflit || '').toLowerCase().includes('salle')).length;
            const nEns = all.filter(c =>
                (c.type_conflit || '').toLowerCase().includes('enseignant')).length;
            const nSans = Math.max(0, nAff - nConf);

            setTotalAff(nAff);
            setTotalConflits(nConf);

            const base = nAff || 1;
            setDonutData([
                { name: 'Sans conflit',          value: nSans,   pct: ((nSans  / base) * 100).toFixed(1) },
                { name: 'Conflits de salle',     value: nSalle,  pct: ((nSalle / base) * 100).toFixed(1) },
                { name: "Conflits d'enseignant", value: nEns,    pct: ((nEns   / base) * 100).toFixed(1) },
            ].filter(d => d.value > 0));
        } catch (err) { console.error(err); }
    };

    const handleResoudre = async (id) => {
        try {
            await conflitAPI.update(id, { resolu: true, date_resolution: new Date().toISOString() });
            loadConflits();
            loadDonutData();
        } catch (err) { console.error(err); }
    };

    const handleView = (conflit) => { setSelectedConflit(conflit); setOpen(true); };

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <Box>
                {/* ── Header ─────────────────────────────────────────── */}
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
                            <Button key={key}
                                variant={filter === key ? 'contained' : 'outlined'}
                                color={color}
                                onClick={() => setFilter(key)}>
                                {label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* ── Donut chart ─────────────────────────────────────── */}
                {donutData.length > 0 && (
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Répartition des conflits
                            </Typography>
                            <Grid container spacing={2} alignItems="center">

                                {/* Donut */}
                                <Grid item xs={12} md={5}>
                                    <Box sx={{ position: 'relative', height: 240 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={donutData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={70} outerRadius={100}
                                                    dataKey="value"
                                                    startAngle={90} endAngle={-270}
                                                    labelLine={false}
                                                >
                                                    {donutData.map((entry) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={DONUT_COLORS[entry.name] || '#999'}
                                                        />
                                                    ))}
                                                    {/* Compteur central */}
                                                    <text />
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Compteur central (superposé) */}
                                        <Box sx={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center', pointerEvents: 'none',
                                        }}>
                                            <Typography variant="h4" fontWeight="bold" lineHeight={1}>
                                                {totalConflits}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                conflits<br />détectés
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Légende détaillée */}
                                <Grid item xs={12} md={7}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {donutData.map((entry) => (
                                            <Box key={entry.name}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 12, height: 12, borderRadius: '50%',
                                                            bgcolor: DONUT_COLORS[entry.name],
                                                        }} />
                                                        <Typography variant="body2">{entry.name}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <Chip label={`${entry.value}`} size="small" variant="outlined" />
                                                        <Typography variant="body2" fontWeight="bold"
                                                            color={DONUT_COLORS[entry.name]}>
                                                            {entry.pct} %
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{
                                                    height: 6, borderRadius: 3,
                                                    bgcolor: `${DONUT_COLORS[entry.name]}22`,
                                                    overflow: 'hidden',
                                                }}>
                                                    <Box sx={{
                                                        height: '100%',
                                                        width: `${entry.pct}%`,
                                                        bgcolor: DONUT_COLORS[entry.name],
                                                        borderRadius: 3,
                                                    }} />
                                                </Box>
                                            </Box>
                                        ))}

                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Sur <strong>{totalAff}</strong> affectation(s) planifiée(s),{' '}
                                                <strong style={{ color: '#c62828' }}>{totalConflits}</strong> conflit(s) détecté(s)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* ── Alerte ─────────────────────────────────────────── */}
                {filter === 'non-resolus' && conflits.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {conflits.length} conflit(s) non résolu(s) nécessitent votre attention
                    </Alert>
                )}

                {/* ── Tableau ─────────────────────────────────────────── */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Date de détection</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conflits.map((conflit) => (
                                <TableRow key={conflit.id_conflit} hover>
                                    <TableCell>
                                        <Chip
                                            label={conflit.type_conflit}
                                            color={
                                                (conflit.type_conflit || '').includes('salle')
                                                    ? 'error'
                                                    : (conflit.type_conflit || '').includes('enseignant')
                                                      ? 'warning'
                                                      : 'info'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{conflit.description}</TableCell>
                                    <TableCell>
                                        {new Date(conflit.date_detection).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={conflit.resolu ? 'Résolu' : 'Non résolu'}
                                            color={conflit.resolu ? 'success' : 'error'}
                                            size="small"
                                            icon={conflit.resolu ? <CheckCircleOutline /> : <Warning />}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small"
                                            onClick={() => handleView(conflit)}
                                            aria-label="Voir les détails">
                                            <Visibility />
                                        </IconButton>
                                        {!conflit.resolu && (
                                            <IconButton size="small" color="success"
                                                onClick={() => handleResoudre(conflit.id_conflit)}
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

                {/* ── Dialog détail ──────────────────────────────────── */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Détails du conflit</DialogTitle>
                    <DialogContent>
                        {selectedConflit && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <Typography><strong>Type :</strong> {selectedConflit.type_conflit}</Typography>
                                <Typography><strong>Description :</strong> {selectedConflit.description}</Typography>
                                <Typography>
                                    <strong>Date de détection :</strong>{' '}
                                    {new Date(selectedConflit.date_detection).toLocaleString('fr-FR')}
                                </Typography>
                                <Typography>
                                    <strong>Statut :</strong>{' '}
                                    {selectedConflit.resolu ? 'Résolu' : 'Non résolu'}
                                </Typography>
                                {selectedConflit.resolu && selectedConflit.date_resolution && (
                                    <Typography>
                                        <strong>Date de résolution :</strong>{' '}
                                        {new Date(selectedConflit.date_resolution).toLocaleString('fr-FR')}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Fermer</Button>
                        {selectedConflit && !selectedConflit.resolu && (
                            <Button variant="contained" color="success"
                                onClick={() => { handleResoudre(selectedConflit.id_conflit); setOpen(false); }}>
                                Marquer comme résolu
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
