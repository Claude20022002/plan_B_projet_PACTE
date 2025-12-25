import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import Utilisateurs from './pages/gestion/Utilisateurs';
import Enseignants from './pages/gestion/Enseignants';
import Etudiants from './pages/gestion/Etudiants';
import Filieres from './pages/gestion/Filieres';
import Groupes from './pages/gestion/Groupes';
import Cours from './pages/gestion/Cours';
import Creneaux from './pages/gestion/Creneaux';

// Pages d'emploi du temps
import EmploiDuTempsAdmin from './pages/emploi-du-temps/EmploiDuTempsAdmin';
import EmploiDuTempsEnseignant from './pages/emploi-du-temps/EmploiDuTempsEnseignant';
import EmploiDuTempsEtudiant from './pages/emploi-du-temps/EmploiDuTempsEtudiant';

// Pages fonctionnelles
import Notifications from './pages/Notifications';
import Parametres from './pages/Parametres';
import Statistiques from './pages/Statistiques';
import MesAffectations from './pages/MesAffectations';
import DemandesReport from './pages/DemandesReport';
import Disponibilites from './pages/Disponibilites';
import SallesDisponibles from './pages/SallesDisponibles';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
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
                                path="/gestion/utilisateurs"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Utilisateurs />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/enseignants"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Enseignants />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/etudiants"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Etudiants />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/filieres"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Filieres />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/groupes"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Groupes />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/salles"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Salles />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/cours"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Cours />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gestion/creneaux"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Creneaux />
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
                                path="/gestion/emplois-du-temps"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <EmploiDuTempsAdmin />
                                    </PrivateRoute>
                                }
                            />
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

                            {/* Pages fonctionnelles - Tous les rôles */}
                            <Route
                                path="/notifications"
                                element={
                                    <PrivateRoute>
                                        <Notifications />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/parametres"
                                element={
                                    <PrivateRoute>
                                        <Parametres />
                                    </PrivateRoute>
                                }
                            />

                            {/* Pages fonctionnelles - Admin */}
                            <Route
                                path="/statistiques"
                                element={
                                    <PrivateRoute requiredRole="admin">
                                        <Statistiques />
                                    </PrivateRoute>
                                }
                            />

                            {/* Pages fonctionnelles - Enseignant */}
                            <Route
                                path="/mes-affectations"
                                element={
                                    <PrivateRoute requiredRole="enseignant">
                                        <MesAffectations />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/demandes-report"
                                element={
                                    <PrivateRoute requiredRole="enseignant">
                                        <DemandesReport />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/disponibilites"
                                element={
                                    <PrivateRoute requiredRole="enseignant">
                                        <Disponibilites />
                                    </PrivateRoute>
                                }
                            />

                            {/* Pages fonctionnelles - Étudiant */}
                            <Route
                                path="/salles/disponibles"
                                element={
                                    <PrivateRoute requiredRole="etudiant">
                                        <SallesDisponibles />
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
