import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Paper, Typography, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, CircularProgress, Divider, TextField, Alert,
    Tab, Tabs, Avatar,
} from '@mui/material';
import {
    BarChart as BarChartIcon, Refresh, FilterList, TrendingUp,
    Room, School, People, Timer, Warning, CheckCircle, Download,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { statistiquesAPI } from '../services/api';
import { exportMultiSheet, COLS_CHARGE_ENSEIGNANTS, COLS_OCCUPATION_GROUPES } from '../utils/exportExcel';

// ── Palette couleurs ──────────────────────────────────────────────────────────
const PALETTE = ['#1a3a8f','#e8a020','#2e7d32','#c62828','#0277bd','#7b1fa2','#00796b','#5d4037'];

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
        <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
            fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function KPICard({ title, value, unit, subtitle, icon, color, trend, status }) {
    return (
        <Card sx={{
            height: '100%', border: '1px solid', borderColor: 'divider',
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color },
        }}>
            <CardContent sx={{ pt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                            {title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color }}>{value ?? '—'}</Typography>
                            {unit && <Typography variant="body1" color="text.secondary">{unit}</Typography>}
                        </Box>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {subtitle}
                            </Typography>
                        )}
                        {status && (
                            <Chip label={status.label} size="small" color={status.color}
                                sx={{ mt: 1, fontWeight: 'bold' }} />
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}18`, color, width: 52, height: 52, ml: 1 }}>{icon}</Avatar>
                </Box>
                {trend !== undefined && (
                    <Box sx={{ mt: 1.5 }}>
                        <LinearProgress variant="determinate" value={Math.min(100, trend || 0)}
                            sx={{ bgcolor: `${color}20`, '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

export default function Statistiques() {
    const [kpis,      setKpis]      = useState(null);
    const [charge,    setCharge]    = useState([]);
    const [groupes,   setGroupes]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState('');
    const [tab,       setTab]       = useState(0);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin,   setDateFin]   = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = dateDebut && dateFin ? { date_debut: dateDebut, date_fin: dateFin } : {};
            const [kpisData, chargeData, groupesData] = await Promise.all([
                statistiquesAPI.getKPIs(params),
                statistiquesAPI.getChargeEnseignants(params),
                statistiquesAPI.getOccupationGroupes(params),
            ]);
            setKpis(kpisData?.kpis || null);
            setCharge(chargeData?.charge_enseignants || []);
            setGroupes(groupesData?.occupation_groupes || []);
        } catch {
            setError('Erreur lors du chargement des statistiques');
        } finally {
            setLoading(false);
        }
    }, [dateDebut, dateFin]);

    useEffect(() => { load(); }, [load]);

    const handleExport = () => {
        exportMultiSheet([
            { name: 'Charge enseignants', data: charge,  columns: COLS_CHARGE_ENSEIGNANTS  },
            { name: 'Volume par groupe',  data: groupes, columns: COLS_OCCUPATION_GROUPES  },
        ], 'Statistiques_KPIs');
    };

    // ── Données graphiques dérivées ──────────────────────────────────────────
    const filiereData = kpis?.repartition_par_filiere?.data  || [];
    const creneauData = kpis?.creneaux_les_plus_demandes?.top || [];
    const sallesGraph = kpis?.taux_occupation_salles?.graphique || [];

    const kpiCards = [
        {
            title:    "Taux d'occupation des salles",
            value:    kpis?.taux_occupation_salles?.valeur,
            unit:     '%',
            icon:     <Room />,
            color:    '#0277bd',
            subtitle: `${kpis?.taux_occupation_salles?.detail?.salles_occupees || 0} / ${kpis?.taux_occupation_salles?.detail?.total_salles || 0} salles`,
            trend:    kpis?.taux_occupation_salles?.valeur,
            status:   kpis?.taux_occupation_salles?.valeur >= 70
                ? { label: 'Élevé',  color: 'error'   }
                : kpis?.taux_occupation_salles?.valeur >= 40
                ? { label: 'Moyen',  color: 'warning' }
                : { label: 'Faible', color: 'success' },
        },
        {
            title:    'Moy. heures / enseignant',
            value:    kpis?.moyenne_heures_enseignant?.valeur,
            unit:     'h',
            icon:     <School />,
            color:    '#7b1fa2',
            subtitle: `${kpis?.moyenne_heures_enseignant?.detail?.enseignants_actifs || 0} enseignants actifs`,
        },
        {
            title:    'Moy. heures / étudiant',
            value:    kpis?.moyenne_heures_etudiant?.valeur,
            unit:     'h',
            icon:     <People />,
            color:    '#00796b',
            subtitle: `${kpis?.moyenne_heures_etudiant?.detail?.etudiants_concernes || 0} étudiants concernés`,
        },
        {
            title:    'Taux de conflits',
            value:    kpis?.taux_conflits?.valeur,
            unit:     '%',
            icon:     kpis?.taux_conflits?.valeur > 5 ? <Warning /> : <CheckCircle />,
            color:    kpis?.taux_conflits?.valeur > 5 ? '#c62828' : '#2e7d32',
            subtitle: `${kpis?.taux_conflits?.detail?.conflits_non_resolus || 0} conflits non résolus`,
            trend:    kpis?.taux_conflits?.valeur,
            status:   kpis?.taux_conflits?.valeur > 10
                ? { label: 'Critique', color: 'error'   }
                : kpis?.taux_conflits?.valeur > 5
                ? { label: 'Élevé',    color: 'warning' }
                : { label: 'Normal',   color: 'success' },
        },
        {
            title:    'Durée moyenne des cours',
            value:    kpis?.duree_moyenne_cours?.valeur,
            unit:     'min',
            icon:     <Timer />,
            color:    '#e8a020',
            subtitle: kpis?.duree_moyenne_cours?.valeur_heures
                ? `≈ ${kpis.duree_moyenne_cours.valeur_heures} h par séance` : '',
        },
    ];

    return (
        <DashboardLayout>
            <Box>
                {/* ── Header ─────────────────────────────────────────────────── */}
                <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#1a3a8f18', color: '#1a3a8f' }}>
                                <BarChartIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">Statistiques & KPIs</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Indicateurs de performance du planning HESTIM
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField size="small" type="date" label="Début"
                                value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                                InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                            <TextField size="small" type="date" label="Fin"
                                value={dateFin} onChange={e => setDateFin(e.target.value)}
                                InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                            <Button variant="outlined" startIcon={<FilterList />}
                                onClick={load} disabled={loading} size="small">
                                Filtrer
                            </Button>
                            <Button variant="outlined" startIcon={<Refresh />} size="small"
                                onClick={() => { setDateDebut(''); setDateFin(''); }}>
                                Tout
                            </Button>
                            <Button variant="outlined" startIcon={<Download />} onClick={handleExport} size="small"
                                disabled={!charge.length && !groupes.length}>
                                Exporter Excel
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {loading && <LinearProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {/* ── KPI Cards ──────────────────────────────────────────────── */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {kpiCards.map((card, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={i}>
                            <KPICard {...card} />
                        </Grid>
                    ))}
                </Grid>

                {/* ── Graphiques ─────────────────────────────────────────────── */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="h6" fontWeight="bold">Visualisations</Typography>
                        {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                    </Box>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                        variant="scrollable" scrollButtons="auto">
                        <Tab label="Répartition par filière" />
                        <Tab label="Créneaux demandés" />
                        <Tab label="Occupation des salles" />
                    </Tabs>

                    {/* Tab 0 — Filières */}
                    {tab === 0 && (
                        filiereData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography color="text.secondary">Aucune donnée filière disponible</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3} alignItems="center">
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={filiereData.filter(f => f.nombre_seances > 0)}
                                                dataKey="nombre_seances" nameKey="nom"
                                                cx="50%" cy="50%" outerRadius={110}
                                                labelLine={false} label={renderPieLabel}>
                                                {filiereData.map((_, i) => (
                                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                                ))}
                                            </Pie>
                                            <ReTooltip formatter={(v, n) => [`${v} séances`, n]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Grid>
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        Détail par filière
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {filiereData.map((f, i) => (
                                            <Box key={f.nom}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%',
                                                            bgcolor: PALETTE[i % PALETTE.length] }} />
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                                                            {f.nom}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip label={`${f.nombre_seances} séances`} size="small" variant="outlined" />
                                                        <Chip label={`${f.nombre_heures}h`} size="small"
                                                            sx={{ bgcolor: `${PALETTE[i % PALETTE.length]}18`,
                                                                  color: PALETTE[i % PALETTE.length] }} />
                                                    </Box>
                                                </Box>
                                                <LinearProgress variant="determinate"
                                                    value={filiereData[0]?.nombre_seances > 0
                                                        ? (f.nombre_seances / filiereData[0].nombre_seances) * 100 : 0}
                                                    sx={{ bgcolor: `${PALETTE[i % PALETTE.length]}18`,
                                                          '& .MuiLinearProgress-bar': { bgcolor: PALETTE[i % PALETTE.length] } }} />
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        )
                    )}

                    {/* Tab 1 — Créneaux */}
                    {tab === 1 && (
                        creneauData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography color="text.secondary">Aucune donnée de créneaux disponible</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={creneauData}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 65 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" angle={-35} textAnchor="end"
                                        tick={{ fontSize: 11 }} interval={0} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <ReTooltip formatter={v => [`${v} affectation(s)`, 'Demandes']}
                                        labelFormatter={l => `Créneau : ${l}`} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {creneauData.map((_, i) => (
                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    )}

                    {/* Tab 2 — Salles */}
                    {tab === 2 && (
                        sallesGraph.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography color="text.secondary">Aucune donnée d'occupation disponible</Typography>
                            </Box>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={sallesGraph} layout="vertical"
                                        margin={{ top: 5, right: 50, left: 90, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]}
                                            tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="nom" type="category"
                                            tick={{ fontSize: 11 }} width={85} />
                                        <ReTooltip formatter={(v, n, p) =>
                                            [`${v}% (${p.payload.heures}h)`, "Taux d'occupation"]} />
                                        <Bar dataKey="taux" radius={[0, 6, 6, 0]}>
                                            {sallesGraph.map((e, i) => (
                                                <Cell key={i}
                                                    fill={e.taux >= 70 ? '#c62828' : e.taux >= 40 ? '#e8a020' : '#2e7d32'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                                    {[['#2e7d32','< 40% — Faible'],['#e8a020','40–70% — Moyen'],['#c62828','> 70% — Élevé']].map(([c, l]) => (
                                        <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: c }} />
                                            <Typography variant="caption" color="text.secondary">{l}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )
                    )}
                </Paper>

                {/* ── Tableaux détaillés ─────────────────────────────────────── */}
                <Grid container spacing={3}>

                    {/* Charge enseignants */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <School color="primary" />
                                <Typography variant="h6" fontWeight="bold">Charge par enseignant</Typography>
                                <Chip label={`${charge.length}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {charge.length === 0 ? (
                                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>Aucune donnée</Typography>
                            ) : (
                                <TableContainer sx={{ maxHeight: 380 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Enseignant</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Séances</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Heures</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cours</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {charge.slice(0, 25).map((e, i) => {
                                                const avg = charge.length
                                                    ? charge.reduce((s, x) => s + x.total_heures, 0) / charge.length : 0;
                                                const surcharge = e.total_heures > avg * 1.3;
                                                return (
                                                    <TableRow key={e.id_user} hover>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12,
                                                                    bgcolor: PALETTE[i % PALETTE.length] }}>
                                                                    {e.prenom?.[0]}{e.nom?.[0]}
                                                                </Avatar>
                                                                <Typography variant="body2">
                                                                    {e.prenom} {e.nom}
                                                                </Typography>
                                                                {surcharge && (
                                                                    <Chip label="Surchargé" size="small" color="error"
                                                                        sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">{e.nombre_seances}</TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2" fontWeight="bold"
                                                                color={surcharge ? 'error.main' : 'text.primary'}>
                                                                {e.total_heures}h
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">{e.nombre_cours_differents}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Volume horaire par groupe */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <People color="primary" />
                                <Typography variant="h6" fontWeight="bold">Volume horaire par groupe</Typography>
                                <Chip label={`${groupes.length}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {groupes.length === 0 ? (
                                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>Aucune donnée</Typography>
                            ) : (
                                <TableContainer sx={{ maxHeight: 380 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Groupe</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Niveau</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Séances</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Heures</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {groupes.map((g, i) => {
                                                const maxH = groupes[0]?.total_heures || 1;
                                                const pct  = Math.round((g.total_heures / maxH) * 100);
                                                return (
                                                    <TableRow key={g.id_groupe} hover>
                                                        <TableCell>
                                                            <Chip label={g.nom_groupe} size="small"
                                                                sx={{ bgcolor: `${PALETTE[i % PALETTE.length]}18`,
                                                                      color: PALETTE[i % PALETTE.length],
                                                                      fontWeight: 'bold' }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {g.niveau}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">{g.nombre_seances}</TableCell>
                                                        <TableCell align="right">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                                                <LinearProgress variant="determinate" value={pct}
                                                                    sx={{ width: 50, bgcolor: `${PALETTE[i % PALETTE.length]}20`,
                                                                          '& .MuiLinearProgress-bar': { bgcolor: PALETTE[i % PALETTE.length] } }} />
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {g.total_heures}h
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>

                </Grid>
            </Box>
        </DashboardLayout>
    );
}
