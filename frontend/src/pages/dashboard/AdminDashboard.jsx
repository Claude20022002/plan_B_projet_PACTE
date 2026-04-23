import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    Avatar,
    Chip,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    LinearProgress,
    Tooltip,
    CircularProgress,
    Tab,
    Tabs,
} from "@mui/material";
import {
    People,
    Room,
    Schedule,
    Warning,
    Notifications,
    Add,
    BarChart as BarChartIcon,
    AccessTime,
    School,
    PersonOutline,
    TrendingUp,
    Timer,
    AccountBalance,
    CheckCircle,
    ErrorOutline,
    Refresh,
} from "@mui/icons-material";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import {
    statistiquesAPI,
    notificationAPI,
    conflitAPI,
} from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Palette cohérente avec le thème HESTIM
const PALETTE = [
    "#1a3a8f",
    "#e8a020",
    "#2e7d32",
    "#c62828",
    "#0277bd",
    "#7b1fa2",
    "#00796b",
    "#5d4037",
];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
}) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight="bold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Carte KPI principale
function KPICard({
    title,
    value,
    unit,
    subtitle,
    icon,
    color,
    trend,
    onClick,
}) {
    return (
        <Card
            sx={{
                height: "100%",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.25s ease",
                border: "1px solid",
                borderColor: "divider",
                position: "relative",
                overflow: "hidden",
                "&:hover": onClick
                    ? {
                          transform: "translateY(-4px)",
                          boxShadow: 6,
                          borderColor: color,
                      }
                    : {},
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: color,
                    borderRadius: "12px 12px 0 0",
                },
            }}
            onClick={onClick}
        >
            <CardContent sx={{ pt: 2.5 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                            gutterBottom
                        >
                            {title}
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 0.5,
                            }}
                        >
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{ color }}
                            >
                                {value}
                            </Typography>
                            {unit && (
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    fontWeight={500}
                                >
                                    {unit}
                                </Typography>
                            )}
                        </Box>
                        {subtitle && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: "block" }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: `${color}18`,
                            color,
                            width: 52,
                            height: 52,
                            ml: 1,
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
                {trend !== undefined && (
                    <Box sx={{ mt: 1.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100, trend)}
                            sx={{
                                bgcolor: `${color}20`,
                                "& .MuiLinearProgress-bar": { bgcolor: color },
                            }}
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// Carte de section avec titre
function SectionCard({ title, subtitle, children, action, minHeight }) {
    return (
        <Paper
            elevation={2}
            sx={{ p: 3, height: "100%", minHeight, borderRadius: 2 }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {children}
        </Paper>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [conflits, setConflits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabChart, setTabChart] = useState(0);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, kpisData, notifsData, conflitsData] =
                await Promise.all([
                    statistiquesAPI.getStatistiquesGlobales(),
                    statistiquesAPI.getKPIs(),
                    notificationAPI.getNonLues(user?.id_user),
                    conflitAPI.getNonResolus(),
                ]);

            setStats(statsData?.resume || statsData || {});
            setKpis(kpisData?.kpis || null);
            setNotifications(notifsData.data || notifsData || []);
            setConflits(conflitsData.data || conflitsData || []);
        } catch (error) {
            setStats({});
            setKpis(null);
        } finally {
            setLoading(false);
        }
    };

    // KPI cards principale (4 indicateurs généraux)
    const mainCards = [
        {
            title: "Utilisateurs actifs",
            value: stats?.total_users || 0,
            icon: <People />,
            color: "#1a3a8f",
            subtitle: `${stats?.total_enseignants || 0} enseignants • ${Math.max(0, (stats?.total_users || 0) - (stats?.total_enseignants || 0) - (stats?.total_admins || 0))} étudiants`,
            onClick: () => navigate("/gestion/utilisateurs"),
        },
        {
            title: "Affectations planifiées",
            value: stats?.total_affectations || 0,
            icon: <Schedule />,
            color: "#0277bd",
            subtitle: `${stats?.total_cours || 0} cours • ${stats?.total_groupes || 0} groupes`,
            onClick: () => navigate("/gestion/affectations"),
        },
        {
            title: "Salles disponibles",
            value: stats?.total_salles || 0,
            icon: <Room />,
            color: "#2e7d32",
            subtitle: `${stats?.salles_utilisees || 0} en cours d'utilisation`,
            trend: stats?.total_salles
                ? (stats.salles_utilisees / stats.total_salles) * 100
                : 0,
            onClick: () => navigate("/gestion/salles"),
        },
        {
            title: "Conflits non résolus",
            value: conflits.length,
            icon: <Warning />,
            color: conflits.length > 0 ? "#c62828" : "#2e7d32",
            subtitle:
                conflits.length > 0
                    ? "⚠ Action requise"
                    : "✓ Aucun conflit actif",
            onClick: () => navigate("/gestion/conflits"),
        },
    ];

    // KPI cards secondaires (7 indicateurs spécifiques)
    const kpiCards = [
        {
            title: "Taux d'occupation des salles",
            value: kpis?.taux_occupation_salles?.valeur ?? "—",
            unit: "%",
            icon: <Room />,
            color: "#0277bd",
            subtitle: `${kpis?.taux_occupation_salles?.detail?.salles_occupees || 0} / ${kpis?.taux_occupation_salles?.detail?.total_salles || 0} salles utilisées`,
            trend: kpis?.taux_occupation_salles?.valeur,
        },
        {
            title: "Moy. heures / enseignant",
            value: kpis?.moyenne_heures_enseignant?.valeur ?? "—",
            unit: "h",
            icon: <School />,
            color: "#7b1fa2",
            subtitle: `${kpis?.moyenne_heures_enseignant?.detail?.enseignants_actifs || 0} enseignants actifs`,
        },
        {
            title: "Moy. heures / étudiant",
            value: kpis?.moyenne_heures_etudiant?.valeur ?? "—",
            unit: "h",
            icon: <PersonOutline />,
            color: "#00796b",
            subtitle: `${kpis?.moyenne_heures_etudiant?.detail?.etudiants_concernes || 0} étudiants concernés`,
        },
        {
            title: "Taux de conflits",
            value: kpis?.taux_conflits?.valeur ?? "—",
            unit: "%",
            icon: <ErrorOutline />,
            color: kpis?.taux_conflits?.valeur > 5 ? "#c62828" : "#2e7d32",
            subtitle: `${kpis?.taux_conflits?.detail?.conflits_non_resolus || 0} conflits / ${kpis?.taux_conflits?.detail?.total_affectations || 0} affectations`,
            trend: kpis?.taux_conflits?.valeur,
        },
        {
            title: "Durée moyenne des cours",
            value: kpis?.duree_moyenne_cours?.valeur ?? "—",
            unit: "min",
            icon: <Timer />,
            color: "#e8a020",
            subtitle: kpis?.duree_moyenne_cours?.valeur_heures
                ? `≈ ${kpis.duree_moyenne_cours.valeur_heures}h par séance`
                : "",
        },
    ];

    // Données pour graphiques
    const filiereData = kpis?.repartition_par_filiere?.data || [];
    const creneauxData = kpis?.creneaux_les_plus_demandes?.top || [];
    const sallesGraphData = kpis?.taux_occupation_salles?.graphique || [];

    return (
        <DashboardLayout>
            <Box sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                gutterBottom
                            >
                                Tableau de bord Administrateur
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Bienvenue, {user?.prenom} {user?.nom} •{" "}
                                {new Date().toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={loadDashboardData}
                                size="small"
                            >
                                Actualiser
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() =>
                                    navigate("/gestion/affectations")
                                }
                                size="small"
                            >
                                Nouvelle affectation
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<BarChartIcon />}
                                onClick={() => navigate("/statistiques")}
                                size="small"
                            >
                                Statistiques détaillées
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {/* Cartes principales */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {mainCards.map((card, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <KPICard {...card} />
                        </Grid>
                    ))}
                </Grid>

                {/* ── MODULE KPIs ── */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        <TrendingUp color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Indicateurs de performance (KPIs)
                        </Typography>
                        {loading && (
                            <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />

                    {!kpis && !loading ? (
                        <Box sx={{ textAlign: "center", py: 3 }}>
                            <Typography color="text.secondary">
                                Aucune donnée disponible. Créez des affectations
                                pour voir les KPIs.
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {kpiCards.map((card, i) => (
                                <Grid
                                    size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}
                                    key={i}
                                >
                                    <KPICard {...card} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>

                {/* ── MODULE GRAPHIQUES ── */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1,
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold">
                            Statistiques visuelles
                        </Typography>
                    </Box>
                    <Tabs
                        value={tabChart}
                        onChange={(_, v) => setTabChart(v)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="Répartition par filière" />
                        <Tab label="Créneaux les plus demandés" />
                        <Tab label="Occupation des salles" />
                    </Tabs>

                    {/* Tab 0: Répartition par filière */}
                    {tabChart === 0 && (
                        <Box>
                            {filiereData.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <AccountBalance
                                        sx={{
                                            fontSize: 48,
                                            color: "text.disabled",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography color="text.secondary">
                                        Aucune donnée filière disponible
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={260}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={filiereData.filter(
                                                        (f) =>
                                                            f.nombre_seances >
                                                            0,
                                                    )}
                                                    dataKey="nombre_seances"
                                                    nameKey="nom"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    labelLine={false}
                                                    label={renderCustomLabel}
                                                >
                                                    {filiereData.map(
                                                        (_, idx) => (
                                                            <Cell
                                                                key={idx}
                                                                fill={
                                                                    PALETTE[
                                                                        idx %
                                                                            PALETTE.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <ReTooltip
                                                    formatter={(v, n) => [
                                                        `${v} séances`,
                                                        n,
                                                    ]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 7 }}>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            gutterBottom
                                        >
                                            Détail par filière
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1.5,
                                            }}
                                        >
                                            {filiereData
                                                .slice(0, 8)
                                                .map((f, idx) => (
                                                    <Box key={f.nom}>
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                mb: 0.5,
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 12,
                                                                        height: 12,
                                                                        borderRadius:
                                                                            "50%",
                                                                        bgcolor:
                                                                            PALETTE[
                                                                                idx %
                                                                                    PALETTE.length
                                                                            ],
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    noWrap
                                                                >
                                                                    {f.nom}
                                                                </Typography>
                                                            </Box>
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    gap: 1,
                                                                    ml: 1,
                                                                }}
                                                            >
                                                                <Chip
                                                                    label={`${f.nombre_seances} séances`}
                                                                    size="small"
                                                                />
                                                                <Chip
                                                                    label={`${f.nombre_heures}h`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: `${PALETTE[idx % PALETTE.length]}20`,
                                                                        color: PALETTE[
                                                                            idx %
                                                                                PALETTE.length
                                                                        ],
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={
                                                                filiereData[0]
                                                                    ?.nombre_seances >
                                                                0
                                                                    ? (f.nombre_seances /
                                                                          filiereData[0]
                                                                              .nombre_seances) *
                                                                      100
                                                                    : 0
                                                            }
                                                            sx={{
                                                                bgcolor: `${PALETTE[idx % PALETTE.length]}20`,
                                                                "& .MuiLinearProgress-bar":
                                                                    {
                                                                        bgcolor:
                                                                            PALETTE[
                                                                                idx %
                                                                                    PALETTE.length
                                                                            ],
                                                                    },
                                                            }}
                                                        />
                                                    </Box>
                                                ))}
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    )}

                    {/* Tab 1: Créneaux les plus demandés */}
                    {tabChart === 1 && (
                        <Box>
                            {creneauxData.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <AccessTime
                                        sx={{
                                            fontSize: 48,
                                            color: "text.disabled",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography color="text.secondary">
                                        Aucune donnée de créneaux disponible
                                    </Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={creneauxData}
                                        margin={{
                                            top: 10,
                                            right: 20,
                                            left: 0,
                                            bottom: 60,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            angle={-35}
                                            textAnchor="end"
                                            tick={{ fontSize: 11 }}
                                            interval={0}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            allowDecimals={false}
                                        />
                                        <ReTooltip
                                            formatter={(v) => [
                                                `${v} affectation(s)`,
                                                "Demandes",
                                            ]}
                                            labelFormatter={(l) =>
                                                `Créneau: ${l}`
                                            }
                                        />
                                        <Bar
                                            dataKey="count"
                                            radius={[6, 6, 0, 0]}
                                            fill="#1a3a8f"
                                        >
                                            {creneauxData.map((_, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={
                                                        PALETTE[
                                                            idx % PALETTE.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    )}

                    {/* Tab 2: Occupation des salles */}
                    {tabChart === 2 && (
                        <Box>
                            {sallesGraphData.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Room
                                        sx={{
                                            fontSize: 48,
                                            color: "text.disabled",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography color="text.secondary">
                                        Aucune donnée d'occupation disponible
                                    </Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={sallesGraphData}
                                        layout="vertical"
                                        margin={{
                                            top: 5,
                                            right: 40,
                                            left: 80,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            domain={[0, 100]}
                                            tickFormatter={(v) => `${v}%`}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis
                                            dataKey="nom"
                                            type="category"
                                            tick={{ fontSize: 11 }}
                                            width={75}
                                        />
                                        <ReTooltip
                                            formatter={(v, n, p) => [
                                                `${v}% (${p.payload.heures}h)`,
                                                "Taux d'occupation",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="taux"
                                            radius={[0, 6, 6, 0]}
                                        >
                                            {sallesGraphData.map(
                                                (entry, idx) => (
                                                    <Cell
                                                        key={idx}
                                                        fill={
                                                            entry.taux >= 70
                                                                ? "#c62828"
                                                                : entry.taux >=
                                                                    40
                                                                  ? "#e8a020"
                                                                  : "#2e7d32"
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 2,
                                    mt: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                {[
                                    {
                                        color: "#2e7d32",
                                        label: "< 40% — Faible",
                                    },
                                    {
                                        color: "#e8a020",
                                        label: "40-70% — Moyen",
                                    },
                                    {
                                        color: "#c62828",
                                        label: "> 70% — Élevé",
                                    },
                                ].map((l) => (
                                    <Box
                                        key={l.label}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 1,
                                                bgcolor: l.color,
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {l.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* ── NOTIFICATIONS & CONFLITS ── */}
                <Grid container spacing={3}>
                    {/* Notifications */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <SectionCard
                            title="Notifications récentes"
                            subtitle={`${notifications.length} non lue(s)`}
                            minHeight={320}
                            action={
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    {notifications.length > 0 && (
                                        <Chip
                                            label={notifications.length}
                                            color="primary"
                                            size="small"
                                        />
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            navigate("/notifications")
                                        }
                                        color="primary"
                                    >
                                        <Notifications />
                                    </IconButton>
                                </Box>
                            }
                        >
                            {notifications.length > 0 ? (
                                <List dense sx={{ p: 0 }}>
                                    {notifications
                                        .slice(0, 5)
                                        .map((notif, idx) => (
                                            <React.Fragment
                                                key={notif.id_notification}
                                            >
                                                <ListItem
                                                    sx={{
                                                        bgcolor: "action.hover",
                                                        borderRadius: 1.5,
                                                        mb: 0.75,
                                                        "&:hover": {
                                                            bgcolor:
                                                                "action.selected",
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                component="span"
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                {notif.titre}
                                                                <Chip
                                                                    label={
                                                                        notif.type_notification
                                                                    }
                                                                    size="small"
                                                                    color={
                                                                        notif.type_notification ===
                                                                        "error"
                                                                            ? "error"
                                                                            : notif.type_notification ===
                                                                                "warning"
                                                                              ? "warning"
                                                                              : "primary"
                                                                    }
                                                                    variant="outlined"
                                                                    sx={{
                                                                        ml: "auto",
                                                                    }}
                                                                />
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    component="span"
                                                                    display="block"
                                                                >
                                                                    {
                                                                        notif.message
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.disabled"
                                                                    component="span"
                                                                >
                                                                    {new Date(
                                                                        notif.date_creation,
                                                                    ).toLocaleString(
                                                                        "fr-FR",
                                                                    )}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <CheckCircle
                                        sx={{
                                            fontSize: 48,
                                            color: "success.main",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Aucune notification non lue
                                    </Typography>
                                </Box>
                            )}
                        </SectionCard>
                    </Grid>

                    {/* Conflits */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <SectionCard
                            title="Conflits non résolus"
                            subtitle={
                                conflits.length > 0
                                    ? "Intervention requise"
                                    : "Tout est en ordre"
                            }
                            minHeight={320}
                            action={
                                <Chip
                                    label={conflits.length}
                                    color={
                                        conflits.length > 0
                                            ? "error"
                                            : "success"
                                    }
                                    size="small"
                                    icon={
                                        conflits.length > 0 ? (
                                            <Warning fontSize="small" />
                                        ) : (
                                            <CheckCircle fontSize="small" />
                                        )
                                    }
                                />
                            }
                        >
                            {conflits.length > 0 ? (
                                <List dense sx={{ p: 0 }}>
                                    {conflits.slice(0, 5).map((conflit) => (
                                        <ListItem
                                            key={conflit.id_conflit}
                                            sx={{
                                                bgcolor: "error.light",
                                                borderRadius: 1.5,
                                                mb: 0.75,
                                                opacity: 0.9,
                                                "&:hover": { opacity: 1 },
                                            }}
                                            secondaryAction={
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() =>
                                                        navigate(
                                                            "/gestion/conflits",
                                                        )
                                                    }
                                                >
                                                    Résoudre
                                                </Button>
                                            }
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="bold"
                                                        component="span"
                                                    >
                                                        {conflit.type_conflit}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="caption"
                                                        component="span"
                                                    >
                                                        {conflit.description}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <CheckCircle
                                        sx={{
                                            fontSize: 48,
                                            color: "success.main",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Aucun conflit à résoudre — emploi du
                                        temps cohérent
                                    </Typography>
                                </Box>
                            )}
                        </SectionCard>
                    </Grid>
                </Grid>
            </Box>
        </DashboardLayout>
    );
}
