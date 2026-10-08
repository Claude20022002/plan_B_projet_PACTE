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
import { ds, lineColor } from '../design-system/tokens';
import { statistiquesAPI } from '../services/api';
import { exportMultiSheet, COLS_CHARGE_ENSEIGNANTS, COLS_OCCUPATION_GROUPES } from '../utils/exportExcel';


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

const numberFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Indicateurs en lignes réglées libellé | valeur | détail — même vocabulaire que le panneau */
function KpiStrip({ items }) {
    return (
        <Box sx={{ mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.lg}px`, overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                    Indicateurs de la période
                </caption>
                <tbody>
                    {items.map((item) => (
                        <Box component="tr" key={item.title} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
                            <Box component="th" scope="row" sx={{ textAlign: 'left', px: 2, py: 1.25, fontWeight: 500, fontSize: '0.9375rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                {item.title}
                            </Box>
                            <Box component="td" sx={{ px: 2, py: 1.25, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: ds.font.board, fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.04em', color: item.tone || 'text.primary' }}>
                                {item.value === undefined || item.value === null ? '-' : numberFr.format(item.value)}
                                {item.unit && <Box component="span" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>{item.unit}</Box>}
                            </Box>
                            <Box component="td" sx={{ px: 2, py: 1.25, color: 'text.secondary', fontSize: '0.875rem', display: { xs: 'none', sm: 'table-cell' } }}>
                                {item.subtitle}
                            </Box>
                        </Box>
                    ))}
                </tbody>
            </Box>
        </Box>
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

    const kpiItems = [
        {
            title:    'Occupation des salles',
            value:    kpis?.taux_occupation_salles?.valeur,
            unit:     '%',
            subtitle: `${kpis?.taux_occupation_salles?.detail?.salles_occupees || 0} / ${kpis?.taux_occupation_salles?.detail?.total_salles || 0} salles utilisées`,
        },
        {
            title:    'Heures / enseignant',
            value:    kpis?.moyenne_heures_enseignant?.valeur,
            unit:     'h',
            subtitle: `${kpis?.moyenne_heures_enseignant?.detail?.enseignants_actifs || 0} enseignants actifs`,
        },
        {
            title:    'Heures / étudiant',
            value:    kpis?.moyenne_heures_etudiant?.valeur,
            unit:     'h',
            subtitle: `${kpis?.moyenne_heures_etudiant?.detail?.etudiants_concernes || 0} étudiants concernés`,
        },
        {
            title:    'Taux de conflits',
            value:    kpis?.taux_conflits?.valeur,
            unit:     '%',
            tone:     kpis?.taux_conflits?.valeur > 5 ? ds.colors.danger.text : undefined,
            subtitle: `${kpis?.taux_conflits?.detail?.conflits_non_resolus || 0} conflits non résolus`,
        },
        {
            title:    'Durée moyenne',
            value:    kpis?.duree_moyenne_cours?.valeur,
            unit:     'min',
            subtitle: kpis?.duree_moyenne_cours?.valeur_heures
                ? `≈ ${numberFr.format(kpis.duree_moyenne_cours.valeur_heures)} h par séance` : '',
        },
    ];

    return (
        <DashboardLayout>
            <Box>
                {/* ── Header ─────────────────────────────────────────────────── */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
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
                </Box>

                {loading && <LinearProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {/* ── KPI Cards ──────────────────────────────────────────────── */}
                <KpiStrip items={kpiItems} />

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
                                                {filiereData.filter(f => f.nombre_seances > 0).map((f) => (
                                                    <Cell key={f.nom} fill={lineColor(f.id_filiere)} />
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
                                        {filiereData.map((f) => (
                                            <Box key={f.nom}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '2px',
                                                            bgcolor: lineColor(f.id_filiere) }} />
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                                                            {f.nom}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip label={`${f.nombre_seances} séances`} size="small" variant="outlined" />
                                                        <Chip label={`${numberFr.format(f.nombre_heures)} h`} size="small" variant="outlined" />
                                                    </Box>
                                                </Box>
                                                <LinearProgress variant="determinate"
                                                    value={filiereData[0]?.nombre_seances > 0
                                                        ? (f.nombre_seances / filiereData[0].nombre_seances) * 100 : 0}
                                                    sx={{ bgcolor: ds.colors.bg.subtle,
                                                          '& .MuiLinearProgress-bar': { bgcolor: lineColor(f.id_filiere) } }} />
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
                                    {/* Une seule couleur : les couleurs de ligne sont réservées aux filières */}
                                    <Bar dataKey="count" radius={[3, 3, 0, 0]} fill={ds.brand.navy} />
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
                                                    fill={e.taux >= 70 ? ds.colors.danger.text : e.taux >= 40 ? ds.colors.warning.text : ds.colors.success.text} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                                    {[[ds.colors.success.text,'Faible (< 40 %)'],[ds.colors.warning.text,'Moyen (40–70 %)'],[ds.colors.danger.text,'Élevé (> 70 %)']].map(([c, l]) => (
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
                                            {charge.slice(0, 25).map((e) => {
                                                const avg = charge.length
                                                    ? charge.reduce((s, x) => s + x.total_heures, 0) / charge.length : 0;
                                                const surcharge = e.total_heures > avg * 1.3;
                                                return (
                                                    <TableRow key={e.id_user} hover>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12,
                                                                    bgcolor: ds.brand.navySoft, color: ds.brand.navy, fontWeight: 600 }}>
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
                                            {groupes.map((g) => {
                                                const maxH = groupes[0]?.total_heures || 1;
                                                const pct  = Math.round((g.total_heures / maxH) * 100);
                                                return (
                                                    <TableRow key={g.id_groupe} hover>
                                                        <TableCell>
                                                            <Chip label={g.nom_groupe} size="small" variant="outlined" />
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
                                                                    sx={{ width: 50, bgcolor: ds.colors.bg.subtle,
                                                                          '& .MuiLinearProgress-bar': { bgcolor: ds.brand.navy } }} />
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
