import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
} from '@mui/material';
import {
    People,
    School,
    Room,
    Book,
    Schedule,
    TrendingUp,
} from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { statistiquesAPI } from '../services/api';

export default function Statistiques() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistiques();
    }, []);

    const loadStatistiques = async () => {
        try {
            const data = await statistiquesAPI.getStatistiquesGlobales();
            setStats(data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Utilisateurs',
            value: stats?.total_users || 0,
            icon: <People />,
            color: '#1976d2',
        },
        {
            title: 'Enseignants',
            value: stats?.total_enseignants || 0,
            icon: <School />,
            color: '#388e3c',
        },
        {
            title: 'Salles',
            value: stats?.total_salles || 0,
            icon: <Room />,
            color: '#f57c00',
        },
        {
            title: 'Cours',
            value: stats?.total_cours || 0,
            icon: <Book />,
            color: '#7b1fa2',
        },
        {
            title: 'Affectations',
            value: stats?.total_affectations || 0,
            icon: <Schedule />,
            color: '#0288d1',
        },
        {
            title: 'Taux d\'occupation',
            value: stats?.taux_occupation ? `${stats.taux_occupation}%` : '0%',
            icon: <TrendingUp />,
            color: '#d32f2f',
        },
    ];

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Statistiques Globales
                </Typography>

                {loading ? (
                    <Typography>Chargement...</Typography>
                ) : (
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {statCards.map((card, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="h4" fontWeight="bold" sx={{ color: card.color }}>
                                                    {card.value}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {card.title}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ color: card.color, fontSize: 48 }}>{card.icon}</Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </DashboardLayout>
    );
}

