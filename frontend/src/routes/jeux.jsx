/** Routes des jeux extraites de App pour que l'ajout de simulations n'alourdisse pas la coque de l'application. */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/common/PrivateRoute';
import PageSkeleton from '../components/common/PageSkeleton';
const Jeux = lazy(() => import('../pages/jeux/AccueilJeux'));
const JeuTerminal = lazy(() => import('../pages/jeux/JeuTerminal'));
const JeuSimulation = lazy(() => import('../pages/jeux/JeuSimulation'));
const DevoirJouer = lazy(() => import('../pages/jeux/DevoirJouer'));
const SessionJeu = lazy(() => import('../pages/jeux/SessionJeu'));
const RejoindreJeu = lazy(() => import('../pages/jeux/RejoindreJeu'));
const JeuEnDirect = lazy(() => import('../pages/jeux/JeuEnDirect'));
const ecran = (page, roles = ['etudiant', 'enseignant']) => (
    <PrivateRoute requiredRole={roles}><Suspense fallback={<PageSkeleton />}>{page}</Suspense></PrivateRoute>
);

/**
 * Renvoie les éléments de route avec les mêmes contrôles de rôle que les jeux d'origine.
 * /jeux/:code reste après les routes fixes (sessions, direct, devoirs) pour ne jamais les masquer.
 */
export const routesJeux = () => [
    <Route key="jeux" path="/jeux" element={ecran(<Jeux />)} />,
    <Route key="terminal" path="/jeux/terminal-linux" element={ecran(<JeuTerminal />)} />,
    <Route key="sessions" path="/jeux/sessions/:id" element={ecran(<SessionJeu />, ['enseignant'])} />,
    <Route key="session" path="/jeux/session/:code" element={ecran(<RejoindreJeu />, ['etudiant'])} />,
    <Route key="direct" path="/jeux/direct/:id" element={ecran(<JeuEnDirect />, ['etudiant'])} />,
    <Route key="devoirs" path="/jeux/devoirs/:id" element={ecran(<DevoirJouer />, ['etudiant'])} />,
    <Route key="simulation" path="/jeux/:code" element={ecran(<JeuSimulation />)} />,
];
