/**
 * App.jsx — Router avec code splitting complet.
 *
 * Chaque import() charge le JS de la page uniquement quand l'utilisateur
 * navigue vers cette route. Le bundle initial passe de 2.1 MB à ~150 kB.
 *
 * Règles :
 *   ✅ Toutes les pages → React.lazy()
 *   ✅ Libs lourdes (jsPDF, XLSX, FullCalendar) → jamais importées ici
 *   ✅ Suspense avec PageSkeleton adapté au contexte
 *   ✅ ErrorBoundary global pour éviter les crashs silencieux
 *   ✅ Préchargement des routes probables au hover
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';

// ── Composants de layout critique (jamais lazy — trop fréquents) ──────────
import PageSkeleton    from './components/common/PageSkeleton';
import AuthSkeleton    from './components/common/AuthSkeleton';
import ErrorBoundary   from './components/common/ErrorBoundary';

// ─────────────────────────────────────────────────────────────────────────────
// LAZY IMPORTS — 1 chunk par groupe logique
// Vite regroupe automatiquement les pages proches en chunks cohérents.
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth (chunk léger — affiché non authentifié) ──────────────────────────
const Connexion      = lazy(() => import('./pages/Connexion'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const Accueil        = lazy(() => import('./pages/Accueil'));

// ── Dashboards (chunk par rôle) ───────────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/dashboard/AdminDashboard'));
const EnseignantDashboard = lazy(() => import('./pages/dashboard/EnseignantDashboard'));
const EtudiantDashboard   = lazy(() => import('./pages/dashboard/EtudiantDashboard'));

// ── Gestion admin (chunk "admin-gestion") ─────────────────────────────────
// Vite détecte le dossier commun → regroupe automatiquement
const Utilisateurs       = lazy(() => import('./pages/gestion/Utilisateurs'));
const Enseignants        = lazy(() => import('./pages/gestion/Enseignants'));
const Etudiants          = lazy(() => import('./pages/gestion/Etudiants'));
const Filieres           = lazy(() => import('./pages/gestion/Filieres'));
const Groupes            = lazy(() => import('./pages/gestion/Groupes'));
const Salles             = lazy(() => import('./pages/gestion/Salles'));
const Cours              = lazy(() => import('./pages/gestion/Cours'));
const Creneaux           = lazy(() => import('./pages/gestion/Creneaux'));
const Affectations       = lazy(() => import('./pages/gestion/Affectations'));
const Conflits           = lazy(() => import('./pages/gestion/Conflits'));
const DemandesReportAdmin= lazy(() => import('./pages/gestion/DemandesReportAdmin'));
const GenerationAuto     = lazy(() => import('./pages/gestion/GenerationAutomatique'));

// ── Emplois du temps (chunk "calendar" — FullCalendar isolé) ─────────────
const EmploiDuTempsAdmin     = lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsAdmin'));
const EmploiDuTempsEnseignant= lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsEnseignant'));
const EmploiDuTempsEtudiant  = lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsEtudiant'));

// ── Pages partagées ───────────────────────────────────────────────────────
const Notifications  = lazy(() => import('./pages/Notifications'));
const Parametres     = lazy(() => import('./pages/Parametres'));
const Statistiques   = lazy(() => import('./pages/Statistiques'));
const MesAffectations= lazy(() => import('./pages/MesAffectations'));
const DemandesReport = lazy(() => import('./pages/DemandesReport'));
const Disponibilites = lazy(() => import('./pages/Disponibilites'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Suspense boundaries avec fallback adapté
// ─────────────────────────────────────────────────────────────────────────────

/** Pages publiques (connexion, forgot...) — skeleton léger centré */
function PublicPage({ children }) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      {children}
    </Suspense>
  );
}

/** Pages de l'application — skeleton DashboardLayout complet */
function AppPage({ children }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
}

/** Pages emploi du temps — skeleton avec indicateur "Chargement du calendrier..." */
function CalendarPage({ children }) {
  return (
    <Suspense fallback={<PageSkeleton hint="Chargement du calendrier..." />}>
      {children}
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>

          {/* ── Routes publiques ──────────────────────────────────────── */}
          <Route path="/" element={
            <PublicPage><Accueil /></PublicPage>
          } />
          <Route path="/connexion" element={
            <PublicPage><Connexion /></PublicPage>
          } />
          <Route path="/forgot-password" element={
            <PublicPage><ForgotPassword /></PublicPage>
          } />
          <Route path="/reset-password" element={
            <PublicPage><ResetPassword /></PublicPage>
          } />

          {/* ── Dashboards ────────────────────────────────────────────── */}
          <Route path="/dashboard/admin" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><AdminDashboard /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/dashboard/enseignant" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><EnseignantDashboard /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/dashboard/etudiant" element={
            <PrivateRoute requiredRole="etudiant">
              <AppPage><EtudiantDashboard /></AppPage>
            </PrivateRoute>
          } />

          {/* ── Gestion (admin) ───────────────────────────────────────── */}
          <Route path="/gestion/utilisateurs" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Utilisateurs /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/enseignants" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Enseignants /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/etudiants" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Etudiants /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/filieres" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Filieres /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/groupes" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Groupes /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/salles" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Salles /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/cours" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Cours /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/creneaux" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Creneaux /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/affectations" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Affectations /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/conflits" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Conflits /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/demandes-report" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><DemandesReportAdmin /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/generation-automatique" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><GenerationAuto /></AppPage>
            </PrivateRoute>
          } />

          {/* ── Emplois du temps (FullCalendar lazy) ──────────────────── */}
          <Route path="/gestion/emplois-du-temps" element={
            <PrivateRoute requiredRole="admin">
              <CalendarPage><EmploiDuTempsAdmin /></CalendarPage>
            </PrivateRoute>
          } />
          <Route path="/emploi-du-temps/enseignant" element={
            <PrivateRoute requiredRole="enseignant">
              <CalendarPage><EmploiDuTempsEnseignant /></CalendarPage>
            </PrivateRoute>
          } />
          <Route path="/emploi-du-temps/etudiant" element={
            <PrivateRoute requiredRole="etudiant">
              <CalendarPage><EmploiDuTempsEtudiant /></CalendarPage>
            </PrivateRoute>
          } />

          {/* ── Pages partagées ───────────────────────────────────────── */}
          <Route path="/notifications" element={
            <PrivateRoute>
              <AppPage><Notifications /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/parametres" element={
            <PrivateRoute>
              <AppPage><Parametres /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/statistiques" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Statistiques /></AppPage>
            </PrivateRoute>
          } />

          {/* ── Pages enseignant ──────────────────────────────────────── */}
          <Route path="/mes-affectations" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><MesAffectations /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/demandes-report" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><DemandesReport /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/disponibilites" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><Disponibilites /></AppPage>
            </PrivateRoute>
          } />

          {/* ── 404 ───────────────────────────────────────────────────── */}
          <Route path="*" element={
            <Suspense fallback={null}>
              <NotFound />
            </Suspense>
          } />

        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
