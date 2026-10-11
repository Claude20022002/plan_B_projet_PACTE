import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/common/PrivateRoute';
import PageSkeleton from '../components/common/PageSkeleton';

/**
 * Écrans à projeter en classe, sans le menu de Planner : l'appel par QR et le quiz en direct.
 * Sortis d'App.jsx (déjà trop long) ; App.jsx les insère dans ses routes par routesProjection().
 */

const AppelProjection = lazy(() => import('../pages/AppelProjection'));
const QuizProjection = lazy(() => import('../pages/QuizProjection'));

const ecran = (page, roles) => (
  <PrivateRoute requiredRole={roles}>
    <Suspense fallback={<PageSkeleton />}>{page}</Suspense>
  </PrivateRoute>
);

/** Routes des écrans projetés, à placer telles quelles dans <Routes>. */
export const routesProjection = () => [
  <Route key="appel" path="/appel/:id/projection" element={ecran(<AppelProjection />, ['enseignant', 'admin'])} />,
  // La partie est remise par le lancement (état de navigation) : elle n'a pas d'adresse propre
  <Route key="quiz" path="/quiz/projection" element={ecran(<QuizProjection />, 'enseignant')} />,
];
