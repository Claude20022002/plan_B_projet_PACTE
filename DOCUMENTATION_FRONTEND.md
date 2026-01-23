# Documentation Frontend - HESTIM Planner

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Structure du Projet](#structure-du-projet)
4. [Technologies Utilisées](#technologies-utilisées)
5. [Composants Principaux](#composants-principaux)
6. [Pages et Routes](#pages-et-routes)
7. [Gestion d'État](#gestion-détat)
8. [Services API](#services-api)
9. [Fonctionnalités Principales](#fonctionnalités-principales)
10. [Interface Utilisateur](#interface-utilisateur)
11. [Sécurité et Authentification](#sécurité-et-authentification)
12. [Export de Données](#export-de-données)
13. [Gestion des Notifications](#gestion-des-notifications)
14. [Thème et Personnalisation](#thème-et-personnalisation)

---

## Vue d'ensemble

Le frontend de **HESTIM Planner** est une application web moderne développée avec **React 19** et **Material-UI v7**. Il s'agit d'une Single Page Application (SPA) qui offre une interface utilisateur intuitive et responsive pour la gestion des emplois du temps d'une école d'ingénieurs.

### Objectifs

- Fournir une interface utilisateur moderne et intuitive
- Assurer une expérience utilisateur optimale sur tous les appareils (responsive design)
- Implémenter une gestion des rôles avec des interfaces adaptées (Admin, Enseignant, Étudiant)
- Offrir des fonctionnalités avancées de visualisation et d'export des données

---

## Architecture Technique

### Stack Technologique

- **Framework** : React 19.1.1
- **Build Tool** : Vite 7.1.7
- **UI Framework** : Material-UI (MUI) v7.3.4
- **Routing** : React Router DOM v7.11.0
- **State Management** : React Context API + React Query (TanStack Query v5.90.5)
- **Form Management** : Formik v2.4.6 + Yup v1.7.1
- **Charts** : Recharts v3.3.0
- **Calendar** : FullCalendar v6.1.20
- **Export** : jsPDF v3.0.4, jspdf-autotable v5.0.2, XLSX v0.18.5
- **Animations** : Motion (Framer Motion) v12.23.26

### Architecture de l'Application

```
┌─────────────────────────────────────────┐
│           App.jsx (Root)                │
│  ┌───────────────────────────────────┐ │
│  │   QueryClientProvider              │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │   ThemeProvider              │  │ │
│  │  │  ┌───────────────────────┐  │  │ │
│  │  │  │   AuthProvider         │  │  │ │
│  │  │  │  ┌─────────────────┐  │  │  │ │
│  │  │  │  │  BrowserRouter   │  │  │  │ │
│  │  │  │  │  ┌───────────┐  │  │  │  │ │
│  │  │  │  │  │  Routes   │  │  │  │  │ │
│  │  │  │  │  └───────────┘  │  │  │  │ │
│  │  │  │  └─────────────────┘  │  │  │ │
│  │  │  └───────────────────────┘  │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Structure du Projet

```
frontend/
├── public/                    # Assets statiques
│   ├── HESTIM.png           # Logo HESTIM
│   └── ...
├── src/
│   ├── assets/              # Images et ressources
│   │   ├── img/            # Images
│   │   └── illustration/   # Illustrations
│   ├── components/         # Composants réutilisables
│   │   ├── common/         # Composants communs
│   │   │   ├── PrivateRoute.jsx    # Protection des routes
│   │   │   ├── Header.jsx          # En-tête public
│   │   │   ├── Footer.jsx          # Pied de page
│   │   │   └── Navbar.jsx          # Barre de navigation
│   │   └── layouts/        # Layouts
│   │       └── DashboardLayout.jsx # Layout principal avec sidebar
│   ├── contexts/           # Contextes React
│   │   ├── AuthContext.jsx # Gestion de l'authentification
│   │   └── ThemeContext.jsx # Gestion du thème (dark/light)
│   ├── pages/              # Pages de l'application
│   │   ├── Accueil.jsx     # Page d'accueil publique
│   │   ├── Connexion.jsx   # Page de connexion
│   │   ├── dashboard/      # Dashboards par rôle
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── EnseignantDashboard.jsx
│   │   │   └── EtudiantDashboard.jsx
│   │   ├── gestion/        # Pages de gestion (Admin)
│   │   │   ├── Utilisateurs.jsx
│   │   │   ├── Enseignants.jsx
│   │   │   ├── Etudiants.jsx
│   │   │   ├── Filieres.jsx
│   │   │   ├── Groupes.jsx
│   │   │   ├── Salles.jsx
│   │   │   ├── Cours.jsx
│   │   │   ├── Creneaux.jsx
│   │   │   ├── Affectations.jsx
│   │   │   └── Conflits.jsx
│   │   ├── emploi-du-temps/ # Pages d'emploi du temps
│   │   │   ├── EmploiDuTempsAdmin.jsx
│   │   │   ├── EmploiDuTempsEnseignant.jsx
│   │   │   └── EmploiDuTempsEtudiant.jsx
│   │   ├── Notifications.jsx      # Gestion des notifications
│   │   ├── Parametres.jsx         # Paramètres utilisateur
│   │   ├── Statistiques.jsx       # Statistiques (Admin)
│   │   ├── MesAffectations.jsx    # Affectations (Enseignant)
│   │   ├── DemandesReport.jsx     # Demandes de report (Enseignant)
│   │   └── Disponibilites.jsx     # Disponibilités (Enseignant)
│   ├── services/           # Services API
│   │   └── api.js          # Service API centralisé
│   ├── utils/              # Utilitaires
│   │   ├── exportEmploiDuTemps.js # Export PDF/Excel/CSV
│   │   └── fileImport.js   # Import de fichiers
│   ├── App.jsx             # Composant racine
│   ├── main.jsx            # Point d'entrée
│   ├── index.css           # Styles globaux
│   └── App.css             # Styles de l'application
├── package.json            # Dépendances
├── vite.config.js         # Configuration Vite
└── eslint.config.js       # Configuration ESLint
```

---

## Technologies Utilisées

### Bibliothèques Principales

#### React et Écosystème
- **React 19.1.1** : Framework JavaScript pour l'interface utilisateur
- **React DOM 19.1.1** : Rendu DOM de React
- **React Router DOM 7.11.0** : Routage côté client

#### UI et Styling
- **Material-UI (MUI) v7.3.4** : Bibliothèque de composants UI
- **@emotion/react & @emotion/styled** : Système de styling CSS-in-JS
- **@mui/icons-material** : Bibliothèque d'icônes Material Design

#### Gestion d'État et Données
- **@tanstack/react-query v5.90.5** : Gestion du cache et synchronisation serveur
- **React Context API** : Gestion d'état globale (Auth, Theme)

#### Formulaires et Validation
- **Formik v2.4.6** : Gestion de formulaires
- **Yup v1.7.1** : Validation de schémas

#### Visualisation de Données
- **Recharts v3.3.0** : Graphiques et visualisations
- **FullCalendar v6.1.20** : Calendrier interactif
  - `@fullcalendar/react` : Intégration React
  - `@fullcalendar/daygrid` : Vue par jour/semaine
  - `@fullcalendar/timegrid` : Vue horaire
  - `@fullcalendar/interaction` : Interactions (drag & drop)

#### Export de Données
- **jsPDF v3.0.4** : Génération de PDF
- **jspdf-autotable v5.0.2** : Tableaux dans PDF
- **XLSX v0.18.5** : Génération de fichiers Excel
- **papaparse v5.5.3** : Parsing CSV

#### Animations
- **Motion v12.23.26** : Animations fluides (Framer Motion)

#### Build et Développement
- **Vite v7.1.7** : Build tool rapide
- **ESLint v9.36.0** : Linter JavaScript
- **Prettier v3.6.2** : Formateur de code

---

## Composants Principaux

### 1. DashboardLayout

**Fichier** : `src/components/layouts/DashboardLayout.jsx`

**Description** : Layout principal de l'application avec sidebar et header.

**Fonctionnalités** :
- Sidebar responsive avec menu de navigation
- Menu collapsible par groupes pour l'admin (7 items maximum)
- Header avec logo, notifications (badge), thème, profil
- Gestion automatique de l'ouverture des menus selon la page active
- Support mobile avec drawer temporaire

**Structure du Menu Admin** :
1. Tableau de bord
2. **Gestion des utilisateurs** (groupe)
   - Utilisateurs
   - Enseignants
   - Étudiants
3. **Gestion académique** (groupe)
   - Filières
   - Groupes
   - Cours
   - Créneaux
4. **Gestion des ressources** (groupe)
   - Salles
5. **Planning** (groupe)
   - Affectations
   - Emplois du temps
6. Conflits
7. Statistiques

### 2. PrivateRoute

**Fichier** : `src/components/common/PrivateRoute.jsx`

**Description** : Composant de protection des routes.

**Fonctionnalités** :
- Vérification de l'authentification
- Vérification des rôles (admin, enseignant, étudiant)
- Redirection automatique si non autorisé
- Affichage d'un loader pendant la vérification

### 3. Composants Communs

- **Header.jsx** : En-tête pour les pages publiques
- **Footer.jsx** : Pied de page
- **Navbar.jsx** : Barre de navigation publique

---

## Pages et Routes

### Routes Publiques

#### `/` - Accueil
- **Fichier** : `src/pages/Accueil.jsx`
- **Description** : Page d'accueil avec présentation des fonctionnalités
- **Fonctionnalités** :
  - Présentation visuelle avec animations
  - Liste des fonctionnalités principales
  - Call-to-action vers la connexion

#### `/connexion` - Connexion
- **Fichier** : `src/pages/Connexion.jsx`
- **Description** : Page d'authentification
- **Fonctionnalités** :
  - Formulaire de connexion (email, mot de passe)
  - Affichage/masquage du mot de passe
  - Gestion des erreurs
  - Redirection automatique selon le rôle

### Dashboards par Rôle

#### `/dashboard/admin` - Dashboard Administrateur
- **Fichier** : `src/pages/dashboard/AdminDashboard.jsx`
- **Description** : Tableau de bord principal pour les administrateurs
- **Fonctionnalités** :
  - **4 cartes de statistiques** :
    - Utilisateurs (avec sous-titre : enseignants/étudiants)
    - Affectations (avec sous-titre : cours/groupes)
    - Salles (avec sous-titre : salles utilisées)
    - Conflits (avec sous-titre : action requise)
  - **Section Notifications** : Liste des notifications récentes (5 max)
  - **Section Conflits** : Liste des conflits non résolus (5 max)
  - **Graphique Vue d'ensemble** : Graphique en barres des principales métriques
  - **Actions rapides** : Créer une affectation, Voir statistiques
  - Rafraîchissement automatique des données

#### `/dashboard/enseignant` - Dashboard Enseignant
- **Fichier** : `src/pages/dashboard/EnseignantDashboard.jsx`
- **Description** : Tableau de bord pour les enseignants
- **Fonctionnalités** :
  - Statistiques : Prochains cours, Notifications, Demandes en attente
  - Liste des prochaines affectations
  - Notifications récentes
  - Actions rapides : Mes affectations, Demandes de report, Disponibilités

#### `/dashboard/etudiant` - Dashboard Étudiant
- **Fichier** : `src/pages/dashboard/EtudiantDashboard.jsx`
- **Description** : Tableau de bord pour les étudiants
- **Fonctionnalités** :
  - Statistiques : Total cours, Cours aujourd'hui, Notifications
  - Liste des prochains cours avec détails (enseignant, salle, horaire)
  - Notifications récentes
  - Accès rapide à l'emploi du temps

### Pages de Gestion (Admin uniquement)

Toutes les pages de gestion suivent une structure similaire avec :
- Liste avec pagination
- Recherche et filtrage
- Création via dialog modal
- Modification via dialog modal
- Suppression avec confirmation
- Gestion des erreurs et messages de succès
- Validation des formulaires avec Yup

#### `/gestion/utilisateurs`
- **Fichier** : `src/pages/gestion/Utilisateurs.jsx`
- **Fonctionnalités** : CRUD complet des utilisateurs

#### `/gestion/enseignants`
- **Fichier** : `src/pages/gestion/Enseignants.jsx`
- **Fonctionnalités** : CRUD des enseignants avec spécialité et département

#### `/gestion/etudiants`
- **Fichier** : `src/pages/gestion/Etudiants.jsx`
- **Fonctionnalités** : CRUD des étudiants avec numéro étudiant et groupe

#### `/gestion/filieres`
- **Fichier** : `src/pages/gestion/Filieres.jsx`
- **Fonctionnalités** : CRUD des filières

#### `/gestion/groupes`
- **Fichier** : `src/pages/gestion/Groupes.jsx`
- **Fonctionnalités** : CRUD des groupes avec filière et niveau

#### `/gestion/salles`
- **Fichier** : `src/pages/gestion/Salles.jsx`
- **Fonctionnalités** : CRUD des salles avec type, capacité, bâtiment, étage

#### `/gestion/cours`
- **Fichier** : `src/pages/gestion/Cours.jsx`
- **Fonctionnalités** : CRUD des cours avec filière, niveau, volume horaire

#### `/gestion/creneaux`
- **Fichier** : `src/pages/gestion/Creneaux.jsx`
- **Fonctionnalités** : CRUD des créneaux horaires (jour, heure début/fin)

#### `/gestion/affectations`
- **Fichier** : `src/pages/gestion/Affectations.jsx`
- **Fonctionnalités** : CRUD des affectations avec détection automatique de conflits

#### `/gestion/conflits`
- **Fichier** : `src/pages/gestion/Conflits.jsx`
- **Fonctionnalités** : Visualisation et résolution des conflits d'horaires

### Pages d'Emploi du Temps

#### `/gestion/emplois-du-temps` - Admin
- **Fichier** : `src/pages/emploi-du-temps/EmploiDuTempsAdmin.jsx`
- **Fonctionnalités** :
  - Visualisation par enseignant, groupe ou salle
  - Calendrier interactif FullCalendar
  - Export PDF/Excel/CSV
  - Filtres avancés

#### `/emploi-du-temps/enseignant` - Enseignant
- **Fichier** : `src/pages/emploi-du-temps/EmploiDuTempsEnseignant.jsx`
- **Fonctionnalités** :
  - Affichage de l'emploi du temps personnel
  - Vue semaine et jour
  - Export PDF/Excel/CSV

#### `/emploi-du-temps/etudiant` - Étudiant
- **Fichier** : `src/pages/emploi-du-temps/EmploiDuTempsEtudiant.jsx`
- **Fonctionnalités** :
  - Affichage de l'emploi du temps du groupe
  - Vue semaine et jour
  - Export PDF/Excel/CSV

### Pages Fonctionnelles

#### `/notifications` - Tous les rôles
- **Fichier** : `src/pages/Notifications.jsx`
- **Fonctionnalités** :
  - Liste de toutes les notifications
  - Marquer comme lue
  - Filtrage par type (info, warning, error, success)
  - Badge avec nombre de non lues dans le header

#### `/parametres` - Tous les rôles
- **Fichier** : `src/pages/Parametres.jsx`
- **Fonctionnalités** :
  - Modification du profil
  - Changement de mot de passe
  - Préférences utilisateur

#### `/statistiques` - Admin uniquement
- **Fichier** : `src/pages/Statistiques.jsx`
- **Fonctionnalités** :
  - Statistiques globales
  - Graphiques d'occupation des salles
  - Charge des enseignants
  - Visualisations avec Recharts

#### `/mes-affectations` - Enseignant
- **Fichier** : `src/pages/MesAffectations.jsx`
- **Fonctionnalités** :
  - Liste des affectations de l'enseignant
  - Filtrage par date et statut
  - Détails complets de chaque affectation

#### `/demandes-report` - Enseignant
- **Fichier** : `src/pages/DemandesReport.jsx`
- **Fonctionnalités** :
  - Création de demandes de report
  - Suivi du statut (en attente, approuvé, refusé)
  - Historique des demandes

#### `/disponibilites` - Enseignant
- **Fichier** : `src/pages/Disponibilites.jsx`
- **Fonctionnalités** :
  - Gestion des disponibilités
  - Déclaration d'indisponibilités
  - Calendrier des disponibilités

---

## Gestion d'État

### Contextes React

#### AuthContext
**Fichier** : `src/contexts/AuthContext.jsx`

**État géré** :
- `user` : Informations de l'utilisateur connecté
- `isAuthenticated` : Statut d'authentification
- `loading` : État de chargement

**Méthodes** :
- `login(email, password)` : Connexion
- `register(userData)` : Inscription
- `logout()` : Déconnexion
- `checkAuth()` : Vérification de l'authentification

**Persistance** :
- Token stocké dans `localStorage`
- Vérification automatique au chargement
- Rafraîchissement automatique

#### ThemeContext
**Fichier** : `src/contexts/ThemeContext.jsx`

**État géré** :
- `mode` : Mode du thème ('light' ou 'dark')
- `theme` : Objet de thème Material-UI

**Méthodes** :
- `toggleTheme()` : Bascule entre light et dark

**Persistance** :
- Préférence sauvegardée dans `localStorage`

### React Query

**Utilisation** : Gestion du cache et synchronisation avec le serveur
- Cache automatique des requêtes
- Refetch automatique
- Gestion optimiste des mises à jour

---

## Services API

### Service Centralisé

**Fichier** : `src/services/api.js`

**Fonctionnalités** :
- Configuration centralisée de l'URL de base
- Gestion automatique du token d'authentification
- Gestion des erreurs HTTP
- Support des requêtes GET, POST, PUT, PATCH, DELETE

**Structure** :
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    // Gestion des headers, token, body, erreurs
}
```

### APIs Disponibles

#### Authentification
- `authAPI.login(data)`
- `authAPI.register(data)`
- `authAPI.logout()`
- `authAPI.getMe()`
- `authAPI.refreshToken()`

#### Utilisateurs
- `userAPI.getAll(params)`
- `userAPI.getById(id)`
- `userAPI.create(data)`
- `userAPI.update(id, data)`
- `userAPI.delete(id)`
- `userAPI.importBulk(data)`

#### Enseignants
- `enseignantAPI.getAll(params)`
- `enseignantAPI.getById(id)`
- `enseignantAPI.create(data)`
- `enseignantAPI.update(id, data)`
- `enseignantAPI.delete(id)`
- `enseignantAPI.importEnseignants(data)`

#### Étudiants
- `etudiantAPI.getAll(params)`
- `etudiantAPI.getById(id)`
- `etudiantAPI.create(data)`
- `etudiantAPI.update(id, data)`
- `etudiantAPI.delete(id)`
- `etudiantAPI.importEtudiants(data)`

#### Filières, Groupes, Salles, Cours, Créneaux
- CRUD complet pour chaque entité
- Pagination et filtrage supportés

#### Affectations
- `affectationAPI.getAll(params)`
- `affectationAPI.getByEnseignant(id, params)`
- `affectationAPI.getByGroupe(id, params)`
- CRUD complet

#### Conflits
- `conflitAPI.getAll(params)`
- `conflitAPI.getNonResolus(params)`
- `conflitAPI.associerAffectation(idConflit, idAffectation)`
- `conflitAPI.dissocierAffectation(idConflit, idAffectation)`

#### Emplois du Temps
- `emploiDuTempsAPI.getByEnseignant(id)`
- `emploiDuTempsAPI.getByGroupe(id)`
- `emploiDuTempsAPI.getBySalle(id)`

#### Notifications
- `notificationAPI.getAll(params)`
- `notificationAPI.getByUser(userId)`
- `notificationAPI.getNonLues(userId)`
- `notificationAPI.marquerCommeLue(id)`

#### Demandes de Report
- `demandeReportAPI.getAll(params)`
- `demandeReportAPI.getByEnseignant(id)`
- `demandeReportAPI.getByStatut(statut)`
- CRUD complet

#### Disponibilités
- `disponibiliteAPI.getAll(params)`
- `disponibiliteAPI.getByEnseignant(id)`
- `disponibiliteAPI.getIndisponibilites(id)`
- CRUD complet

#### Statistiques
- `statistiquesAPI.getStatistiquesGlobales()`
- `statistiquesAPI.getOccupationSalles()`
- `statistiquesAPI.getChargeEnseignants()`

---

## Fonctionnalités Principales

### 1. Authentification et Autorisation

- **Connexion sécurisée** : Email et mot de passe
- **Gestion des rôles** : Admin, Enseignant, Étudiant
- **Protection des routes** : PrivateRoute avec vérification de rôle
- **Persistance de session** : Token stocké dans localStorage
- **Déconnexion automatique** : En cas d'erreur 401

### 2. Gestion des Données

#### CRUD Complet
Toutes les entités supportent :
- **Create** : Création via dialog modal avec validation
- **Read** : Liste avec pagination (10 items par page)
- **Update** : Modification via dialog modal
- **Delete** : Suppression avec confirmation

#### Recherche et Filtrage
- Recherche textuelle en temps réel
- Filtres par statut, date, etc.
- Tri par colonnes

#### Import/Export
- **Import en masse** : CSV/Excel pour utilisateurs, enseignants, étudiants, filières, groupes, salles, cours, créneaux
- **Validation** : Validation complète des données avant import
- **Export** : Export des emplois du temps en PDF, Excel, CSV

### 3. Visualisation des Emplois du Temps

#### Calendrier Interactif
- **Vue Semaine** : Affichage horaire par jour
- **Vue Jour** : Détails d'une journée
- **Vue Mois** : Vue d'ensemble mensuelle
- **Interactions** : Clic pour voir les détails

#### Filtres
- Par enseignant
- Par groupe
- Par salle
- Par date

### 4. Gestion des Conflits

- **Détection automatique** : Lors de la création/modification d'affectations
- **Types de conflits** :
  - Conflit de salle
  - Conflit d'enseignant
  - Conflit de groupe
- **Visualisation** : Liste avec détails
- **Résolution** : Marquer comme résolu

### 5. Notifications

- **Types** : info, warning, error, success
- **Badge** : Affichage du nombre de non lues dans le header
- **Rafraîchissement** : Automatique toutes les 30 secondes
- **Marquage** : Marquer comme lue individuellement
- **Notifications automatiques** :
  - Nouvelle affectation → Enseignant
  - Conflit détecté → Admin et Enseignants concernés
  - Demande de report → Admin

### 6. Statistiques et Rapports

#### Dashboard Admin
- Statistiques globales (utilisateurs, affectations, salles, conflits)
- Graphiques de répartition
- Vue d'ensemble des métriques

#### Page Statistiques
- Occupation des salles
- Charge des enseignants
- Graphiques interactifs (Recharts)

### 7. Export de Données

#### Formats Supportés

**PDF** (`exportToPDF`)
- Génération avec jsPDF
- Tableaux formatés avec jspdf-autotable
- En-têtes et date de génération
- Gestion d'erreurs robuste

**Excel** (`exportToExcel`)
- Génération avec XLSX
- Colonnes ajustées automatiquement
- Formatage professionnel

**CSV** (`exportToCSV`)
- Export simple et lisible
- Compatible avec Excel et autres outils

---

## Interface Utilisateur

### Design System

#### Couleurs Principales
- **Primary** : `#7c4dff` (Violet)
- **Secondary** : `#001962` (Bleu HESTIM)
- **Success** : `#388e3c` (Vert)
- **Warning** : `#f57c00` (Orange)
- **Error** : `#d32f2f` (Rouge)

#### Thème
- **Mode clair** : Par défaut
- **Mode sombre** : Toggle dans le header
- **Persistance** : Préférence sauvegardée

### Composants Material-UI Utilisés

- **Layout** : Box, Grid, Container, Paper
- **Navigation** : Drawer, AppBar, Toolbar, List, ListItem
- **Formulaires** : TextField, Select, Button, Checkbox, Radio
- **Feedback** : Alert, Snackbar, Dialog, CircularProgress, LinearProgress
- **Data Display** : Table, Card, Chip, Avatar, Typography
- **Icons** : @mui/icons-material (bibliothèque complète)

### Responsive Design

- **Mobile First** : Design adaptatif
- **Breakpoints Material-UI** :
  - `xs` : < 600px (mobile)
  - `sm` : ≥ 600px (tablette)
  - `md` : ≥ 900px (desktop)
  - `lg` : ≥ 1200px (large desktop)
- **Sidebar** : Drawer temporaire sur mobile, permanent sur desktop

### Animations

- **Motion (Framer Motion)** : Animations fluides
- **Transitions** : Hover effects sur les cartes
- **Loading States** : Indicateurs de chargement

---

## Sécurité et Authentification

### Mécanismes de Sécurité

1. **Token JWT** :
   - Stocké dans `localStorage`
   - Inclus automatiquement dans les headers
   - Vérification à chaque requête

2. **Protection des Routes** :
   - `PrivateRoute` vérifie l'authentification
   - Vérification des rôles pour les routes restreintes
   - Redirection automatique si non autorisé

3. **Gestion des Erreurs** :
   - Erreur 401 → Déconnexion automatique
   - Erreur 403 → Redirection (accès interdit)
   - Messages d'erreur utilisateur-friendly

4. **Validation Côté Client** :
   - Validation avec Yup avant envoi
   - Messages d'erreur clairs
   - Prévention des soumissions invalides

---

## Import de Données

### Fonctionnalités d'Import

**Fichier** : `src/utils/fileImport.js`

#### Formats Supportés
- **CSV** : Fichiers CSV avec en-têtes
- **Excel** : Fichiers .xlsx et .xls

#### Fonctionnalités

**Parsing de Fichiers** (`parseFile`)
- Détection automatique du format (CSV ou Excel)
- Parsing avec PapaParse pour CSV
- Parsing avec XLSX pour Excel
- Gestion des erreurs de parsing

**Validation des Données**
- Validation spécifique pour chaque type d'entité :
  - `validateUserData` : Utilisateurs
  - `validateEnseignantData` : Enseignants
  - `validateEtudiantData` : Étudiants
  - `validateFiliereData` : Filières
  - `validateGroupeData` : Groupes
  - `validateSalleData` : Salles
  - `validateCoursData` : Cours
  - `validateCreneauData` : Créneaux

**Caractéristiques de Validation**
- Vérification des champs requis
- Validation des formats (email, nombres, etc.)
- Messages d'erreur détaillés avec numéro de ligne
- Validation des valeurs énumérées (rôles, types de salles, etc.)

**Entités Supportant l'Import**
- Utilisateurs
- Enseignants
- Étudiants
- Filières
- Groupes
- Salles
- Cours
- Créneaux

---

## Export de Données

### Fonctionnalités d'Export

**Fichier** : `src/utils/exportEmploiDuTemps.js`

#### Export PDF
- Génération avec jsPDF
- Tableaux formatés avec jspdf-autotable
- En-têtes personnalisés
- Date de génération
- Gestion d'erreurs complète

#### Export Excel
- Génération avec XLSX
- Colonnes ajustées automatiquement
- Formatage professionnel
- Compatible avec Microsoft Excel et LibreOffice

#### Export CSV
- Format simple et universel
- Compatible avec tous les tableurs
- Encodage UTF-8

### Données Exportées

Pour chaque affectation :
- Date de séance
- Jour de la semaine
- Heure début / Heure fin
- Cours
- Groupe
- Enseignant
- Salle
- Statut

---

## Gestion des Notifications

### Système de Notifications

#### Types de Notifications
- **info** : Informations générales
- **warning** : Avertissements (conflits)
- **error** : Erreurs
- **success** : Confirmations

#### Affichage
- **Badge dans le header** : Nombre de notifications non lues
- **Page dédiée** : `/notifications`
- **Rafraîchissement** : Automatique toutes les 30 secondes
- **Marquage** : Marquer comme lue individuellement

#### Notifications Automatiques

**Lors de la création d'une affectation** :
- Notification envoyée à l'enseignant concerné
- Email envoyé si configuré

**Lors de la détection d'un conflit** :
- Notification à tous les administrateurs
- Notification aux enseignants concernés
- Email envoyé si configuré

**Lors de la création d'une demande de report** :
- Notification à tous les administrateurs actifs
- Email envoyé si configuré

---

## Thème et Personnalisation

### Thème Material-UI

**Configuration** : `src/contexts/ThemeContext.jsx`

#### Couleurs Personnalisées
- **Primary** : `#7c4dff` (Violet)
- **Secondary** : `#001962` (Bleu HESTIM)

#### Modes
- **Light** : Mode clair par défaut
- **Dark** : Mode sombre disponible
- **Toggle** : Basculement via bouton dans le header

#### Persistance
- Préférence sauvegardée dans `localStorage`
- Restauration automatique au chargement

---

## Fonctionnalités Avancées

### 1. Pagination

Toutes les listes utilisent une pagination :
- **10 items par page** par défaut
- Navigation précédent/suivant
- Affichage du nombre total d'items

### 2. Recherche en Temps Réel

- Recherche textuelle instantanée
- Filtrage sur plusieurs colonnes
- Debounce pour optimiser les performances

### 3. Validation des Formulaires

- **Yup** : Schémas de validation
- **Formik** : Gestion des formulaires
- Messages d'erreur contextuels
- Validation en temps réel

### 4. Gestion des Erreurs

- **Snackbars** : Messages d'erreur/succès
- **Alerts** : Alertes importantes
- **Gestion réseau** : Détection des erreurs de connexion
- **Messages utilisateur** : Messages clairs et compréhensibles

### 5. Loading States

- **CircularProgress** : Chargement global
- **LinearProgress** : Progression des opérations
- **Skeleton** : Placeholders pendant le chargement

---

## Performance et Optimisations

### Optimisations Implémentées

1. **Code Splitting** : Vite gère automatiquement le code splitting
2. **Lazy Loading** : Chargement à la demande des composants
3. **React Query** : Cache intelligent des requêtes
4. **Debounce** : Recherche avec debounce
5. **Memoization** : Utilisation de `useMemo` et `useCallback` où nécessaire

### Build et Production

- **Vite Build** : Build optimisé pour la production
- **Minification** : Code minifié automatiquement
- **Tree Shaking** : Suppression du code inutilisé
- **Asset Optimization** : Images et assets optimisés

---

## Accessibilité

### Bonnes Pratiques

- **ARIA Labels** : Labels accessibles pour les icônes
- **Navigation clavier** : Support de la navigation au clavier
- **Contraste** : Respect des ratios de contraste WCAG
- **Focus visible** : Indicateurs de focus clairs

---

## Tests et Qualité

### Outils de Qualité

- **ESLint** : Linting du code
- **Prettier** : Formatage automatique
- **React StrictMode** : Détection des problèmes

---

## Déploiement

### Configuration

- **Variables d'environnement** : `VITE_API_URL` pour l'URL du backend
- **Build** : `npm run build` génère le dossier `dist/`
- **Preview** : `npm run preview` pour tester le build

### Structure de Build

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

---

## Points Forts de l'Implémentation

1. **Architecture Moderne** : React 19, Vite, Material-UI v7
2. **Code Maintenable** : Structure claire et organisée
3. **Expérience Utilisateur** : Interface intuitive et responsive
4. **Performance** : Optimisations et cache intelligent
5. **Sécurité** : Protection des routes et gestion des tokens
6. **Accessibilité** : Respect des standards
7. **Extensibilité** : Architecture modulaire et réutilisable
8. **Documentation** : Code commenté et structure claire

---

## Statistiques du Projet

- **Pages** : 25+ pages
- **Composants** : 15+ composants réutilisables
- **Routes** : 30+ routes configurées
- **Services API** : 15+ services API
- **Utilitaires** : 2 utilitaires (export, import)
- **Lignes de code** : ~15 000+ lignes
- **Bibliothèques** : 20+ dépendances principales

---

## Conclusion

Le frontend de HESTIM Planner est une application moderne, performante et maintenable qui offre une expérience utilisateur optimale pour la gestion des emplois du temps. L'architecture modulaire, l'utilisation de technologies à jour et les bonnes pratiques de développement garantissent une base solide pour l'évolution future du projet.
