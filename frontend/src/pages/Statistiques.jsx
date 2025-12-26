import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Avatar,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    People,
    School,
    Room,
    Book,
    Schedule,
    TrendingUp,
    AdminPanelSettings,
} from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { statistiquesAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Statistiques() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistiques();
    }, []);

    const loadStatistiques = async () => {
        try {
            setLoading(true);
            const data = await statistiquesAPI.getStatistiquesGlobales();
            console.log('Données brutes reçues:', data);
            
            // Extraire les statistiques de la réponse
            const statsResume = data?.resume || data || {};
            console.log('Statistiques extraites:', statsResume);
            console.log('Valeurs individuelles:', {
                total_users: statsResume.total_users,
                total_enseignants: statsResume.total_enseignants,
                total_admins: statsResume.total_admins,
                total_salles: statsResume.total_salles,
                total_cours: statsResume.total_cours,
                total_affectations: statsResume.total_affectations,
                total_groupes: statsResume.total_groupes,
            });
            
            setStats(statsResume);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            console.error('Détails de l\'erreur:', error.message, error.stack);
            // Initialiser avec des valeurs par défaut en cas d'erreur
            setStats({
                total_users: 0,
                total_admins: 0,
                total_affectations: 0,
                total_salles: 0,
                salles_utilisees: 0,
                total_enseignants: 0,
                enseignants_actifs: 0,
                total_groupes: 0,
                total_cours: 0,
                total_heures: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    // Définir les cartes de statistiques avec les valeurs actuelles
    const statCards = React.useMemo(() => [
        {
            title: 'Utilisateurs',
            value: Number(stats?.total_users) || 0,
            icon: <People />,
            color: '#1976d2',
        },
        {
            title: 'Enseignants',
            value: Number(stats?.total_enseignants) || 0,
            icon: <School />,
            color: '#388e3c',
        },
        {
            title: 'Administrateurs',
            value: Number(stats?.total_admins) || 0,
            icon: <AdminPanelSettings />,
            color: '#7b1fa2',
        },
        {
            title: 'Salles',
            value: Number(stats?.total_salles) || 0,
            icon: <Room />,
            color: '#f57c00',
        },
        {
            title: 'Cours',
            value: Number(stats?.total_cours) || 0,
            icon: <Book />,
            color: '#9c27b0',
        },
        {
            title: 'Affectations',
            value: Number(stats?.total_affectations) || 0,
            icon: <Schedule />,
            color: '#0288d1',
        },
        {
            title: 'Groupes',
            value: Number(stats?.total_groupes) || 0,
            icon: <People />,
            color: '#009688',
        },
        {
            title: 'Heures totales',
            value: stats?.total_heures ? `${Math.round(Number(stats.total_heures))}h` : '0h',
            icon: <TrendingUp />,
            color: '#d32f2f',
        },
    ], [stats]);

    return (
        <DashboardLayout>
            <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
                {/* En-tête */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 3,
                        mb: 3,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Statistiques Globales
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Vue d'ensemble complète de toutes les métriques de la plateforme
                    </Typography>
                </Paper>

                {loading && <LinearProgress sx={{ mb: 3 }} />}

                {/* Message d'erreur si pas de données */}
                {!loading && !stats && (
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
                        <Typography variant="body1" color="error">
                            Aucune donnée disponible. Vérifiez la connexion au serveur.
                        </Typography>
                    </Paper>
                )}

                {/* Cartes de statistiques */}
                {!loading && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {statCards.map((card, index) => {
                            console.log(`Carte ${index} (${card.title}):`, card.value);
                            return (
                                <Grid item xs={12} sm={6} md={3} key={index}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: 6,
                                                borderColor: card.color,
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="h3" fontWeight="bold" sx={{ color: card.color, mb: 1 }}>
                                                        {card.value}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary" fontWeight="medium">
                                                        {card.title}
                                                    </Typography>
                                                </Box>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: `${card.color}15`,
                                                        color: card.color,
                                                        width: 64,
                                                        height: 64,
                                                    }}
                                                >
                                                    {card.icon}
                                                </Avatar>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
                {loading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            Chargement des statistiques...
                        </Typography>
                    </Box>
                )}

                {/* Section 1: Répartition des utilisateurs */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Répartition des Utilisateurs
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Distribution par rôle
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : stats ? (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={[
                                        { name: 'Enseignants', value: Number(stats.total_enseignants) || 0 },
                                        { name: 'Étudiants', value: Math.max(0, (Number(stats.total_users) || 0) - (Number(stats.total_enseignants) || 0) - (Number(stats.total_admins) || 0)) },
                                        { name: 'Administrateurs', value: Number(stats.total_admins) || 0 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value) => [value, 'Nombre']}
                                            labelFormatter={(label) => `Rôle: ${label}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="value" fill="#7c4dff" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* Afficher les valeurs numériques */}
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Chip 
                                        label={`Enseignants: ${stats.total_enseignants || 0}`} 
                                        color="success" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Étudiants: ${Math.max(0, (stats.total_users || 0) - (stats.total_enseignants || 0) - (stats.total_admins || 0))}`} 
                                        color="info" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Administrateurs: ${stats.total_admins || 0}`} 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucune donnée disponible
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>

                {/* Section 2: Vue d'ensemble */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Vue d'Ensemble
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Répartition des ressources
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : stats ? (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Affectations', value: Number(stats.total_affectations) || 0 },
                                                { name: 'Cours', value: Number(stats.total_cours) || 0 },
                                                { name: 'Salles', value: Number(stats.total_salles) || 0 },
                                                { name: 'Groupes', value: Number(stats.total_groupes) || 0 },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent, value }) => 
                                                value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Affectations', value: Number(stats.total_affectations) || 0 },
                                                { name: 'Cours', value: Number(stats.total_cours) || 0 },
                                                { name: 'Salles', value: Number(stats.total_salles) || 0 },
                                                { name: 'Groupes', value: Number(stats.total_groupes) || 0 },
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#7c4dff', '#1976d2', '#f57c00', '#388e3c'][index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => [value, 'Valeur']}
                                            labelFormatter={(label) => `Ressource: ${label}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Afficher les valeurs numériques */}
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Chip 
                                        label={`Affectations: ${stats.total_affectations || 0}`} 
                                        sx={{ bgcolor: '#7c4dff15', color: '#7c4dff' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Cours: ${stats.total_cours || 0}`} 
                                        sx={{ bgcolor: '#1976d215', color: '#1976d2' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Salles: ${stats.total_salles || 0}`} 
                                        sx={{ bgcolor: '#f57c0015', color: '#f57c00' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Groupes: ${stats.total_groupes || 0}`} 
                                        sx={{ bgcolor: '#388e3c15', color: '#388e3c' }}
                                        variant="outlined"
                                    />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucune donnée disponible
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>

                {/* Section 3: Statistiques globales */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Statistiques Globales
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Comparaison des principales métriques
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : stats ? (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={[
                                            { name: 'Utilisateurs', value: Number(stats.total_users) || 0 },
                                            { name: 'Enseignants', value: Number(stats.total_enseignants) || 0 },
                                            { name: 'Salles', value: Number(stats.total_salles) || 0 },
                                            { name: 'Cours', value: Number(stats.total_cours) || 0 },
                                            { name: 'Affectations', value: Number(stats.total_affectations) || 0 },
                                            { name: 'Groupes', value: Number(stats.total_groupes) || 0 },
                                            { name: 'Admins', value: Number(stats.total_admins) || 0 },
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value) => [value, 'Valeur']}
                                            labelFormatter={(label) => `Métrique: ${label}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="value" fill="#7c4dff" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* Afficher les valeurs numériques sous le graphique */}
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Chip 
                                        label={`Utilisateurs: ${stats.total_users || 0}`} 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Enseignants: ${stats.total_enseignants || 0}`} 
                                        color="success" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Salles: ${stats.total_salles || 0}`} 
                                        color="warning" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Cours: ${stats.total_cours || 0}`} 
                                        color="secondary" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Affectations: ${stats.total_affectations || 0}`} 
                                        color="info" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Groupes: ${stats.total_groupes || 0}`} 
                                        color="success" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Admins: ${stats.total_admins || 0}`} 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucune donnée disponible
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Box>
        </DashboardLayout>
    );
}
