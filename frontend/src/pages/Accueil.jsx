import { Box, Typography, Button, Container, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Schedule,
    School,
    People,
    TrendingUp,
    Notifications,
    Analytics,
} from '@mui/icons-material';
import Header from '../components/common/Header';
import businessImg from '../assets/img/business.webp';

export default function Accueil() {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Schedule sx={{ fontSize: 40 }} />,
            title: 'Gestion des Emplois du Temps',
            description:
                'Planification intelligente et automatique des cours avec détection des conflits en temps réel',
            color: '#7c4dff',
        },
        {
            icon: <School sx={{ fontSize: 40 }} />,
            title: 'Gestion des Ressources',
            description:
                'Administration complète des salles, cours, enseignants et étudiants en un seul endroit',
            color: '#001962',
        },
        {
            icon: <People sx={{ fontSize: 40 }} />,
            title: 'Multi-utilisateurs',
            description:
                'Interface adaptée pour les administrateurs, enseignants et étudiants avec des droits d\'accès personnalisés',
            color: '#1976d2',
        },
        {
            icon: <Notifications sx={{ fontSize: 40 }} />,
            title: 'Notifications en Temps Réel',
            description:
                'Recevez des alertes instantanées sur les modifications de votre planning et les conflits détectés',
            color: '#f57c00',
        },
        {
            icon: <Analytics sx={{ fontSize: 40 }} />,
            title: 'Statistiques Avancées',
            description:
                'Analysez l\'occupation des salles, la charge des enseignants et optimisez vos ressources',
            color: '#388e3c',
        },
        {
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            title: 'Optimisation Automatique',
            description:
                'Algorithme intelligent pour optimiser la répartition des cours et minimiser les conflits',
            color: '#c2185b',
        },
    ];

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <Header />

            {/* Image de fond avec overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '86px',
                    left: '-7px',
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            'linear-gradient(135deg, rgba(0, 25, 98, 0.85) 0%, rgba(124, 77, 255, 0.75) 100%)',
                        zIndex: 1,
                    },
                }}
            >
                <Box
                    component="img"
                    src={businessImg}
                    alt="Background"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.2,
                    }}
                />
            </Box>

            {/* Contenu principal */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    
                }}
            >
                <Container maxWidth="lg">
                    {/* Hero Section */}
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 8,
                            color: 'white',
                            left: '-7px',
                            top: '86px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Typography
                                variant="h2"
                                fontWeight={800}
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '2rem', md: '3.5rem' },
                                    mb: 2,
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                }}
                            >
                                HESTIM Planner
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 4,
                                    fontSize: { xs: '1.1rem', md: '1.5rem' },
                                    fontWeight: 300,
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    maxWidth: '800px',
                                    mx: 'auto',
                                }}
                            >
                                La plateforme intelligente de gestion et planification des cours pour
                                l'École Supérieure de Technologie et d'Ingénierie de Management
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => navigate('/connexion')}
                                        sx={{
                                            bgcolor: 'white',
                                            color: '#001962',
                                            textTransform: 'none',
                                            px: 5,
                                            py: 1.8,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            borderRadius: 3,
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        Accéder à la plateforme
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => navigate('/connexion')}
                                        sx={{
                                            borderColor: 'white',
                                            borderWidth: 2,
                                            color: 'white',
                                            textTransform: 'none',
                                            px: 5,
                                            py: 1.8,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            borderRadius: 3,
                                            '&:hover': {
                                                borderColor: 'white',
                                                borderWidth: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                        }}
                                    >
                                        Consulter mon emploi du temps
                                    </Button>
                                </motion.div>
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Section Fonctionnalités */}
                    <Box
                        sx={{
                            mt: 10,
                            left: '-7px',
                            top: '86px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                align="center"
                                sx={{ mb: 6, color: 'white', fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                            >
                                Fonctionnalités Principales
                            </Typography>
                        </motion.div>

                        <Grid container spacing={4}>
                            {features.map((feature, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                                        whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                    >
                                        <Card
                                            sx={{
                                                height: '100%',
                                                bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: 3,
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
                                                    transform: 'translateY(-5px)',
                                                },
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        borderRadius: 2,
                                                        bgcolor: `${feature.color}15`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mb: 2,
                                                        color: feature.color,
                                                    }}
                                                >
                                                    {feature.icon}
                                                </Box>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={600}
                                                    gutterBottom
                                                    sx={{ mb: 1.5 }}
                                                >
                                                    {feature.title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ lineHeight: 1.7 }}
                                                >
                                                    {feature.description}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
