import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Pages publiques
import Accueil from './pages/Accueil';
import Connexion from './pages/Connexion';

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import EnseignantDashboard from './pages/dashboard/EnseignantDashboard';
import EtudiantDashboard from './pages/dashboard/EtudiantDashboard';

// Pages de gestion
import Salles from './pages/gestion/Salles';
import Affectations from './pages/gestion/Affectations';
import Conflits from './pages/gestion/Conflits';

// Pages d'emploi du temps
import EmploiDuTempsEnseignant from './pages/emploi-du-temps/EmploiDuTempsEnseignant';
import EmploiDuTempsEtudiant from './pages/emploi-du-temps/EmploiDuTempsEtudiant';

const queryClient = new QueryClient();

const theme = createTheme({
    palette: {
        primary: {
            main: '#7c4dff',
        },
        secondary: {
            main: '#001962',
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Routes publiques */}
                            <Route path="/" element={<Accueil />} />
                            <Route path="/connexion" element={<Connexion />} />

                            {/* Dashboards */}
                            <Route
                                path="/dashboard/admin"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <AdminDashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/dashboard/enseignant"
                                element={
                                    <PrivateRoute requiredRole="enseignant">
                                        <EnseignantDashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/dashboard/etudiant"
                                element={
                                    <PrivateRoute requiredRole="etudiant">
                                        <EtudiantDashboard />
                                    </PrivateRoute>
                                }
                            />

                            {/* Gestion - Admin seulement */}
                            <Route
                                path="/gestion/salles"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Salles />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/affectations"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Affectations />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/conflits"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Conflits />
                                    </PrivateRoute>
                                }
                            />

                            {/* Emplois du temps */}
                            <Route
                                path="/emploi-du-temps/enseignant"
                                element={
                                    <PrivateRoute requiredRole="enseignant">
                                        <EmploiDuTempsEnseignant />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/emploi-du-temps/etudiant"
                                element={
                                    <PrivateRoute requiredRole="etudiant">
                                        <EmploiDuTempsEtudiant />
                                    </PrivateRoute>
                                }
                            />

                            {/* Route par défaut */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
