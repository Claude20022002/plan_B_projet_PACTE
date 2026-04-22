import {
    Box,
    Typography,
    Button,
    Container,
    Card,
    CardContent,
    IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    Schedule,
    School,
    People,
    TrendingUp,
    Notifications,
    Analytics,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import Header from "../components/common/Header";
import businessImg from "../assets/img/business.webp";

export default function Accueil() {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    const featuresPerView = 3;

    const features = [
        {
            icon: <Schedule sx={{ fontSize: 40 }} />,
            title: "Gestion des Emplois du Temps",
            description:
                "Planification intelligente et automatique des cours avec détection des conflits en temps réel",
            color: "#7c4dff",
        },
        {
            icon: <School sx={{ fontSize: 40 }} />,
            title: "Gestion des Ressources",
            description:
                "Administration complète des salles, cours, enseignants et étudiants en un seul endroit",
            color: "#001962",
        },
        {
            icon: <People sx={{ fontSize: 40 }} />,
            title: "Multi-utilisateurs",
            description:
                "Interface adaptée pour les administrateurs, enseignants et étudiants avec des droits d'accès personnalisés",
            color: "#1976d2",
        },
        {
            icon: <Notifications sx={{ fontSize: 40 }} />,
            title: "Notifications en Temps Réel",
            description:
                "Recevez des alertes instantanées sur les modifications de votre planning et les conflits détectés",
            color: "#f57c00",
        },
        {
            icon: <Analytics sx={{ fontSize: 40 }} />,
            title: "Statistiques Avancées",
            description:
                "Analysez l'occupation des salles, la charge des enseignants et optimisez vos ressources",
            color: "#388e3c",
        },
        {
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            title: "Optimisation Automatique",
            description:
                "Algorithme intelligent pour optimiser la répartition des cours et minimiser les conflits",
            color: "#c2185b",
        },
    ];

    return (
        <Box
            sx={{
                position: "relative",
                minHeight: "100vh",
                overflow: "hidden",
            }}
        >
            <Header />

            {/* Image de fond avec overlay */}
            <Box
                sx={{
                    position: "absolute",
                    top: "86px",
                    left: "-7px",
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            "linear-gradient(135deg, rgba(81, 91, 122, 0.85) 0%, rgba(124, 77, 255, 0.75) 70%)",
                        zIndex: 1,
                    },
                }}
            >
                <Box
                    component="img"
                    src={businessImg}
                    alt="Background"
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.2,
                    }}
                />
            </Box>

            {/* Contenu principal */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 2,
                }}
            >
                <Container maxWidth="lg">
                    {/* Hero Section */}
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 8,
                            color: "white",
                            left: "-7px",
                            top: "86px",
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
                                    fontSize: { xs: "2rem", md: "3.5rem" },
                                    mb: 2,
                                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                                }}
                            >
                                HESTIM Planner
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 4,
                                    fontSize: { xs: "1.1rem", md: "1.5rem" },
                                    fontWeight: 300,
                                    color: "rgba(255, 255, 255, 0.95)",
                                    maxWidth: "800px",
                                    mx: "auto",
                                }}
                            >
                                La plateforme intelligente de gestion et
                                planification des cours pour l'École Supérieure
                                de Technologie et d'Ingénierie de Management
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 2,
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                    mt: 4,
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => navigate("/connexion")}
                                        sx={{
                                            bgcolor: "#001962",
                                            color: "#ffffff",
                                            textTransform: "none",
                                            px: 5,
                                            py: 1.8,
                                            fontSize: "1.1rem",
                                            fontWeight: 600,
                                            borderRadius: 3,
                                            boxShadow:
                                                "0 8px 24px rgba(0, 0, 0, 0.3)",
                                            "&:hover": {
                                                bgcolor:
                                                    "rgba(255, 255, 255, 0.95)",
                                                boxShadow:
                                                    "0 12px 32px rgba(0, 0, 0, 0.4)",
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        Accéder à la plateforme
                                    </Button>
                                </motion.div>
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Features Carousel Section */}
                    <Box
                        sx={{
                            py: 4,
                            color: "white",
                        }}
                    >
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                textAlign: "center",
                                mb: 4,
                                fontSize: { xs: "1.5rem", md: "2rem" },
                                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                            }}
                        >
                            Nos Fonctionnalités
                        </Typography>

                        {/* Carousel Container */}
                        <Box
                            sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Left Button */}
                            <IconButton
                                onClick={() =>
                                    setCurrentIndex((prev) =>
                                        prev === 0
                                            ? features.length - featuresPerView
                                            : prev - 1,
                                    )
                                }
                                sx={{
                                    position: "absolute",
                                    left: -50,
                                    color: "white",
                                    "&:hover": {
                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                    },
                                    zIndex: 10,
                                }}
                            >
                                <ChevronLeft sx={{ fontSize: 32 }} />
                            </IconButton>

                            {/* Carousel Viewport */}
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    overflow: "hidden",
                                    px: { xs: 0, md: 8 },
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <Box
                                        component={motion.div}
                                        key={currentIndex}
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.5 }}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                sm: "repeat(2, 1fr)",
                                                md: "repeat(3, 1fr)",
                                            },
                                            gap: 2,
                                        }}
                                    >
                                        {features
                                            .slice(
                                                currentIndex,
                                                currentIndex + featuresPerView,
                                            )
                                            .map((feature, index) => (
                                                <motion.div
                                                    key={feature.title}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{
                                                        delay: index * 0.1,
                                                    }}
                                                    whileHover={{ y: -4 }}
                                                >
                                                    <Card
                                                        sx={{
                                                            height: "280px",
                                                            background:
                                                                "rgba(255, 255, 255, 0.08)",
                                                            backdropFilter:
                                                                "blur(10px)",
                                                            border: `2px solid ${feature.color}`,
                                                            borderRadius: 2,
                                                            transition:
                                                                "all 0.3s ease",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            "&:hover": {
                                                                background:
                                                                    "rgba(255, 255, 255, 0.12)",
                                                                boxShadow: `0 8px 32px ${feature.color}33`,
                                                            },
                                                        }}
                                                    >
                                                        <CardContent
                                                            sx={{
                                                                textAlign:
                                                                    "center",
                                                                p: 2,
                                                                flex: 1,
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    color: feature.color,
                                                                    mb: 1,
                                                                }}
                                                            >
                                                                {feature.icon}
                                                            </Box>
                                                            <Typography
                                                                variant="subtitle1"
                                                                fontWeight={700}
                                                                sx={{
                                                                    mb: 1,
                                                                    color: feature.color,
                                                                    fontSize:
                                                                        "0.95rem",
                                                                }}
                                                            >
                                                                {feature.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "rgba(255, 255, 255, 0.8)",
                                                                    lineHeight: 1.4,
                                                                    fontSize:
                                                                        "0.8rem",
                                                                }}
                                                            >
                                                                {
                                                                    feature.description
                                                                }
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                    </Box>
                                </AnimatePresence>
                            </Box>

                            {/* Right Button */}
                            <IconButton
                                onClick={() =>
                                    setCurrentIndex((prev) =>
                                        prev ===
                                        features.length - featuresPerView
                                            ? 0
                                            : prev + 1,
                                    )
                                }
                                sx={{
                                    position: "absolute",
                                    right: -50,
                                    color: "white",
                                    "&:hover": {
                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                    },
                                    zIndex: 10,
                                }}
                            >
                                <ChevronRight sx={{ fontSize: 32 }} />
                            </IconButton>
                        </Box>

                        {/* Indicators */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 1,
                                mt: 3,
                            }}
                        >
                            {Array.from({
                                length: Math.ceil(
                                    features.length / featuresPerView,
                                ),
                            }).map((_, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.2 }}
                                >
                                    <Box
                                        onClick={() =>
                                            setCurrentIndex(
                                                index * featuresPerView,
                                            )
                                        }
                                        sx={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            bgcolor:
                                                currentIndex ===
                                                index * featuresPerView
                                                    ? "white"
                                                    : "rgba(255, 255, 255, 0.4)",
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </Box>
                    </Box>

                    {/* Footer */}
                    <Box
                        sx={{
                            textAlign: "center",
                            mt: 4,
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                        }}
                    >
                        <Typography variant="body1" color="white">
                            &copy; {new Date().getFullYear()} HESTIM Planner.
                            Tous droits réservés.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
