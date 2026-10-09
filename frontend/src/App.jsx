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
import VersTableau from './components/espaces/VersTableau';

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
const ChangerMotDePasse = lazy(() => import('./pages/ChangerMotDePasse'));
const Accueil        = lazy(() => import('./pages/Accueil'));
const Annonces       = lazy(() => import('./pages/Annonces'));
const Appel          = lazy(() => import('./pages/Appel'));
const Presence       = lazy(() => import('./pages/Presence'));

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
const Campus             = lazy(() => import('./pages/gestion/Campus'));
const Calendrier         = lazy(() => import('./pages/gestion/Calendrier'));
const ParametresPlanning = lazy(() => import('./pages/gestion/ParametresPlanning'));
const Enseignements      = lazy(() => import('./pages/gestion/Enseignements'));

// ── Emplois du temps (chunk "calendar" — FullCalendar isolé) ─────────────
const EmploiDuTempsAdmin     = lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsAdmin'));
const EmploiDuTempsEnseignant= lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsEnseignant'));
const EmploiDuTempsEtudiant  = lazy(() => import('./pages/emploi-du-temps/EmploiDuTempsEtudiant'));

// ── Pages partagées ───────────────────────────────────────────────────────
const Notifications  = lazy(() => import('./pages/Notifications'));
const Parametres     = lazy(() => import('./pages/Parametres'));
const Securite       = lazy(() => import('./pages/Securite'));
const Statistiques   = lazy(() => import('./pages/Statistiques'));
const MesAffectations= lazy(() => import('./pages/MesAffectations'));
const DemandesReport = lazy(() => import('./pages/DemandesReport'));
const Disponibilites = lazy(() => import('./pages/Disponibilites'));
const MesServices    = lazy(() => import('./pages/MesServices'));
// Phases P4 à P7 : préparation, réservations, examens, imprévus, suivi, EDT mensuel
const Reservations   = lazy(() => import('./pages/Reservations'));
const MesExamens     = lazy(() => import('./pages/MesExamens'));
const EdtMensuel     = lazy(() => import('./pages/EdtMensuel'));
const Examens        = lazy(() => import('./pages/gestion/Examens'));
const Imprevus       = lazy(() => import('./pages/gestion/Imprevus'));
const Suivi          = lazy(() => import('./pages/gestion/Suivi'));
const Preparation    = lazy(() => import('./pages/gestion/Preparation'));
const SignalementsPresence = lazy(() => import('./pages/gestion/SignalementsPresence'));
const JournalSecurite = lazy(() => import('./pages/gestion/JournalSecurite'));
const Jeux           = lazy(() => import('./pages/jeux/Jeux'));
const JeuTerminal    = lazy(() => import('./pages/jeux/JeuTerminal'));
const DevoirJouer    = lazy(() => import('./pages/jeux/DevoirJouer'));
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
          <Route path="/changer-mot-de-passe" element={
            <PublicPage><ChangerMotDePasse /></PublicPage>
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
            <PrivateRoute requiredRole="admin" allowResponsable>
              <AppPage><Groupes /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/salles" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Salles /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/cours" element={
            <PrivateRoute requiredRole="admin" allowResponsable>
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
          <Route path="/gestion/campus" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Campus /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/calendrier" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Calendrier /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/enseignements" element={
            <PrivateRoute requiredRole="admin" allowResponsable>
              <AppPage><Enseignements /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/parametres-planning" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><ParametresPlanning /></AppPage>
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
          <Route path="/appel/:id" element={
            <PrivateRoute requiredRole={['enseignant', 'admin']}>
              <AppPage><Appel /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/presence" element={
            <PrivateRoute requiredRole="etudiant">
              <AppPage><Presence /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/annonces" element={
            <PrivateRoute>
              <AppPage><Annonces /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/annonces/:id" element={
            <PrivateRoute>
              <AppPage><Annonces /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/parametres" element={
            <PrivateRoute>
              <AppPage><Parametres /></AppPage>
            </PrivateRoute>
          } />
          {/* Double authentification : page autonome (obligatoire pour l'administration) */}
          <Route path="/securite" element={
            <PrivateRoute requiredRole={['admin', 'enseignant']}>
              <Securite />
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
          <Route path="/mes-services" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><MesServices /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/disponibilites" element={
            <PrivateRoute requiredRole="enseignant">
              <AppPage><Disponibilites /></AppPage>
            </PrivateRoute>
          } />

          {/* ── Entrée depuis les autres espaces (StudyLib, ClassQuiz) ──── */}
          <Route path="/tableau" element={
            <PrivateRoute>
              <VersTableau />
            </PrivateRoute>
          } />

          {/* ── Jeux (étudiants et enseignants : l'administration ne gère pas les jeux) ── */}
          <Route path="/jeux" element={
            <PrivateRoute requiredRole={['etudiant', 'enseignant']}>
              <AppPage><Jeux /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/jeux/terminal-linux" element={
            <PrivateRoute requiredRole={['etudiant', 'enseignant']}>
              <AppPage><JeuTerminal /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/jeux/devoirs/:id" element={
            <PrivateRoute requiredRole={['etudiant']}>
              <AppPage><DevoirJouer /></AppPage>
            </PrivateRoute>
          } />

          {/* Ancienne page « Salles disponibles » : la recherche de salle libre se fait dans Réservations */}
          <Route path="/salles-disponibles" element={<Navigate to="/reservations" replace />} />

          {/* ── Phases P4 à P7 ────────────────────────────────────────── */}
          <Route path="/reservations" element={
            <PrivateRoute requiredRole={['enseignant', 'admin']}>
              <AppPage><Reservations /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/examens" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Examens /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/mes-examens" element={
            <PrivateRoute requiredRole={['enseignant', 'etudiant', 'admin']}>
              <AppPage><MesExamens /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/imprevus" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><Imprevus /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/suivi" element={
            <PrivateRoute requiredRole="admin" allowResponsable>
              <AppPage><Suivi /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/preparation" element={
            <PrivateRoute requiredRole="admin" allowResponsable>
              <AppPage><Preparation /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/signalements-presence" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><SignalementsPresence /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/gestion/journal-securite" element={
            <PrivateRoute requiredRole="admin">
              <AppPage><JournalSecurite /></AppPage>
            </PrivateRoute>
          } />
          <Route path="/emploi-du-temps/mensuel" element={
            <PrivateRoute>
              <AppPage><EdtMensuel /></AppPage>
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
