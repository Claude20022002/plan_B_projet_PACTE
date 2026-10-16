/** Game routes extracted from App so adding simulations does not grow the application shell. */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/common/PrivateRoute';
import PageSkeleton from '../components/common/PageSkeleton';
const Jeux = lazy(() => import('../pages/jeux/Jeux'));
const JeuTerminal = lazy(() => import('../pages/jeux/JeuTerminal'));
const JeuSimulation = lazy(() => import('../pages/jeux/JeuSimulation'));
const DevoirJouer = lazy(() => import('../pages/jeux/DevoirJouer'));
const ecran = (page, roles = ['etudiant', 'enseignant']) => (
    <PrivateRoute requiredRole={roles}><Suspense fallback={<PageSkeleton />}>{page}</Suspense></PrivateRoute>
);

/** Returns route elements with the same role gates as the original games. */
export const routesJeux = () => [
    <Route key="jeux" path="/jeux" element={ecran(<Jeux />)} />,
    <Route key="terminal" path="/jeux/terminal-linux" element={ecran(<JeuTerminal />)} />,
    <Route key="devoirs" path="/jeux/devoirs/:id" element={ecran(<DevoirJouer />, ['etudiant'])} />,
    <Route key="simulation" path="/jeux/:code" element={ecran(<JeuSimulation />)} />,
];
