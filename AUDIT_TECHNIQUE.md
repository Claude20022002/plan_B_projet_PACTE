# AUDIT TECHNIQUE COMPLET — HESTIM PLANNER
### Staff Software Engineer · Product Architect · Senior UI/UX Designer · SaaS Technical Lead

---

> **Date d'audit :** Mai 2026  
> **Version analysée :** Production Docker `claude20022002/hestim-{backend|frontend}:latest`  
> **Stack :** React 19 · MUI 7 · Node.js · Sequelize 6 · MySQL 8 · Docker · Nginx  

---

## TABLEAU DE BORD EXÉCUTIF

| Domaine | Note | Statut |
|---|---|---|
| Maturité produit | **68 / 100** | MVP avancé, production conditionnelle |
| Frontend Architecture | **72 / 100** | Solide, dettes mineures |
| Backend Architecture | **70 / 100** | Fonctionnel, lacunes scalabilité |
| Base de données | **65 / 100** | Relations correctes, indexes absents |
| UX/UI Design | **62 / 100** | Bon potentiel, polish manquant |
| Design System | **58 / 100** | Tokens partiels, incohérences |
| Performance | **55 / 100** | Bundle critique, lazy loading absent |
| Sécurité | **60 / 100** | Base correcte, vulnérabilités connues |
| Produit & Business | **70 / 100** | Valeur forte, onboarding faible |
| Architecture & DevOps | **75 / 100** | Docker solide, monitoring absent |

**Score global : 66 / 100**  
**Complétion produit estimée : 72 %**

---

## 1. MATURITÉ PRODUIT

### 1.1 Vue d'ensemble

HESTIM Planner est un **MVP avancé** avec une couverture fonctionnelle réelle et un potentiel produit sérieux. Le projet dispose d'une base technique solide — stack moderne, Docker, CI/CD, tests E2E — mais manque de polish production dans plusieurs domaines critiques.

### 1.2 État de complétion par fonctionnalité

| Feature | Implémentée | Qualité | Prête prod |
|---|---|---|---|
| Authentification (login/logout/reset) | ✅ 100% | Bonne | ⚠️ Conditionnelle |
| Gestion utilisateurs (CRUD) | ✅ 100% | Bonne | ✅ |
| Gestion enseignants | ✅ 95% | Bonne | ✅ |
| Gestion étudiants | ✅ 95% | Bonne | ✅ |
| Gestion filières | ✅ 100% | Bonne | ✅ |
| Gestion groupes | ✅ 100% | Bonne | ✅ |
| Gestion salles | ✅ 100% | Bonne | ✅ |
| Gestion cours | ✅ 100% | Bonne | ✅ |
| Gestion créneaux | ✅ 100% | Bonne | ✅ |
| Affectations (CRUD) | ✅ 90% | Bonne | ⚠️ |
| Emploi du temps (FullCalendar) | ✅ 85% | Bonne | ⚠️ |
| Détection conflits | ✅ 75% | Moyenne | ⚠️ |
| Gestion conflits (resolution) | ✅ 80% | Bonne | ✅ |
| Demandes de report | ✅ 85% | Bonne | ✅ |
| Disponibilités enseignants | ✅ 80% | Moyenne | ⚠️ |
| Statistiques & KPIs | ✅ 90% | Bonne | ✅ |
| Dashboard admin (suggestif) | ✅ 85% | Bonne | ✅ |
| Dashboard enseignant | ✅ 80% | Bonne | ✅ |
| Dashboard étudiant | ✅ 75% | Moyenne | ⚠️ |
| Notifications | ✅ 85% | Bonne | ⚠️ |
| Export Excel / PDF | ✅ 90% | Bonne | ✅ |
| Import fichiers | ✅ 85% | Bonne | ✅ |
| Génération automatique planning | ✅ 60% | Faible | ❌ |
| Thème dark/light | ✅ 95% | Bonne | ✅ |
| Mode offline (Electron) | ✅ 40% | Préliminaire | ❌ |
| Multi-institutions | ❌ 0% | Absent | ❌ |
| Onboarding | ❌ 0% | Absent | ❌ |
| Refresh token / session mgmt | ❌ 0% | Absent | ❌ |
| Audit log / historique | ✅ 50% | Partiel | ❌ |
| Tests unitaires backend | ✅ 30% | Embryonnaire | ❌ |

### 1.3 Maturité pour déploiement production

**Ce qui est prêt :**
- CRUD complet sur toutes les entités métier
- Authentification JWT fonctionnelle
- Docker + Nginx + CI/CD
- Tests E2E Playwright (67 tests, 65+ passants)
- Export Excel/PDF professionnel

**Ce qui bloque la production :**
1. Pas de refresh token → sessions de 7 jours non révocables
2. Rate limiter in-memory → inutilisable avec plusieurs instances
3. Génération automatique de planning incomplète
4. Pas d'isolation multi-institutions
5. Token JWT en localStorage (risque XSS)
6. Monitoring/alerting absent

---

## 2. AUDIT FRONTEND

### 2.1 Architecture des routes

```
App.jsx — React Router 7
├── Public
│   ├── /                    Accueil
│   ├── /connexion           Login
│   ├── /forgot-password     Reset request
│   └── /reset-password/:token
├── Protégé (PrivateRoute)
│   ├── /dashboard/admin     AdminDashboard
│   ├── /dashboard/enseignant
│   ├── /dashboard/etudiant
│   ├── /gestion/*           12 pages admin
│   ├── /emploi-du-temps/*   3 vues calendrier
│   ├── /statistiques        (admin only)
│   ├── /notifications
│   ├── /parametres
│   ├── /mes-affectations    (enseignant)
│   ├── /demandes-report     (enseignant)
│   └── /disponibilites      (enseignant)
```

**Évaluation :** Structure claire et cohérente. `PrivateRoute` vérifie correctement `isAuthenticated + loading` avant de rendre. Gestion des rôles présente mais incomplète (vérification `requiredRole` seulement à la couche route, pas au niveau des données).

**Problème identifié :** Pas de route wildcard `*` → URL invalide charge silencieusement la dernière page matchée au lieu d'un 404.

### 2.2 Organisation du code

```
frontend/src/
├── pages/          28 pages JSX (bien organisées)
├── components/
│   ├── common/     17 composants partagés
│   ├── layouts/    DashboardLayout.jsx
│   └── emploi-du-temps/  EnhancedTimetable.jsx
├── contexts/       2 contextes (Auth, Theme)
├── hooks/          2 hooks (useOnlineStatus, useSortableTable)
├── services/       api.js (monolithique — 1 fichier pour 12+ namespaces)
└── utils/          fileImport, exportExcel, exportEmploiDuTemps
```

**Dettes identifiées :**
- `services/api.js` est un fichier monolithique de 800+ lignes. Devrait être découpé par domaine : `auth.api.js`, `users.api.js`, `affectations.api.js`, etc.
- Composants `Buton.jsx`, `Input.jsx`, `Checkbox.jsx` dans `common/` existent mais ne sont **pas utilisés** dans les pages (les pages utilisent directement MUI). Dette morte.
- Absence de barrel exports (`index.js`) dans les dossiers — imports longs et répétitifs partout.
- `utils/exportEmploiDuTemps.js` contient 845 lignes incluant toute la logique HTML du PDF — devrait être divisé.

### 2.3 Qualité des composants

**Points forts :**
- `DashboardLayout` complet : sidebar collapsible, breadcrumbs, notifications badge, recherche globale, dark mode
- `ConfirmDialog`, `SkeletonTable`, `EmptyState` — composants partagés bien conçus (ajoutés récemment)
- `useSortableTable` hook propre et réutilisable
- `PrivateRoute` gère correctement les états loading

**Problèmes :**
- Aucun composant n'utilise `React.memo`, `useCallback` ou `useMemo` — re-renders non optimisés sur les listes larges
- `AdminDashboard.jsx` fait 800+ lignes — devrait être découpé en sous-composants (`KPISection`, `ChartsSection`, `ConflictsSection`)
- `EnhancedTimetable.jsx` seul composant de calendrier = Single Point of Failure
- Pas de `React.lazy()` sur aucune page — tout le bundle chargé au démarrage

### 2.4 Gestion des états

| Pattern | Utilisation | Évaluation |
|---|---|---|
| useState local | Toutes les pages | Correct mais parfois surchargé |
| React Query | Installé mais peu utilisé | Sous-exploité — les fetch sont manuels |
| Context API | Auth + Theme | Correct |
| URL state | Absent | Manquant (filtres dans URL) |
| Zustand/Redux | Absent | Non nécessaire pour ce niveau |

**Problème majeur :** React Query 5 est installé mais les pages font toutes du `useEffect + fetch` manuel avec leurs propres `useState([loading, error, data])`. Cela représente de la dette car React Query offre déjà le caching, retry, invalidation — fonctionnalités réémplémentées manuellement dans chaque composant.

### 2.5 Loading / Empty / Error States

| État | Implémentation | Qualité |
|---|---|---|
| Loading global | `LinearProgress` dans headers | ✅ Correct |
| Loading tableau | `SkeletonTable` | ✅ Récent et bon |
| Empty state | `EmptyState` component | ✅ Récent et bon |
| Error Snackbar | `Snackbar + Alert` MUI | ⚠️ Incohérent (parfois `window.alert`) |
| 404 route | Absent | ❌ Manquant |
| Error Boundary React | Absent | ❌ Manquant |

### 2.6 Accessibilité (WCAG)

| Critère | Statut | Détail |
|---|---|---|
| Labels ARIA | ⚠️ Partiel | IconButtons ont maintenant `aria-label`, mais pas tous |
| Contraste couleurs | ⚠️ Non audité | Dark mode non vérifié WCAG AA |
| Navigation clavier | ✅ Basique | Tab/Enter fonctionnels |
| Focus indicators | ⚠️ MUI default | Pas de custom focus ring premium |
| Screen reader | ⚠️ Partiel | Tableaux sans `scope`, icônes sans texte alternatif |
| ARIA live regions | ❌ Absent | Notifications non annoncées |

### 2.7 Performance React

```
❌ Aucun React.lazy() → bundle monolithique ~2.1 MB gzippé à 637 KB
❌ Aucun React.memo() → re-renders excessifs
❌ Aucun useCallback/useMemo → fonctions recréées à chaque render
❌ Pas de pagination virtuelle → listes de 1000+ items chargeraient tout
✅ Vite build avec ESNext target
✅ Code splitting par routes (Vite fait ça automatiquement avec lazy)
⚠️ FullCalendar (6.1.x) — bundle lourd, 200KB+ non chunked
```

**Warning Vite au build :**
```
dist/assets/index-DlLxtbLf.js  2,109.43 kB │ gzip: 636.81 kB
(!) Some chunks are larger than 500 kB after minification
```

C'est le signal d'alarme le plus critique du frontend. Un bundle de 2.1 MB en production est inacceptable.

---

## 3. AUDIT BACKEND

### 3.1 Architecture générale

```
backend/
├── server.js          — Entry point (Express app)
├── config/db.js       — Sequelize + MySQL config
├── models/            — 19 models Sequelize
│   └── index.js       — Relations et associations
├── controllers/       — 20 controllers
├── routes/            — 19 fichiers de routes
├── middleware/        — 10 middlewares
├── utils/             — 9 utilitaires
└── seed.js            — Données de test (340+ utilisateurs)
```

Architecture MVC classique, bien structurée. Découpage clair par domaine métier. Utilisation cohérente de `asyncHandler` pour éviter les try/catch répétitifs.

### 3.2 Stack Middleware (ordre dans server.js)

```javascript
1. securityHeaders (Helmet CSP + custom headers)
2. cors (allowlist ALLOWED_ORIGINS)
3. express.json({ limit: '10mb' }) — Avatar base64
4. express.urlencoded()
5. morgan (HTTP logging)
6. apiRateLimiter (global 500 req/15min)
7. Routes registration (15 namespaces /api/*)
8. notFoundHandler
9. errorHandler (centralisé)
```

**Évaluation :** Ordre correct. `securityHeaders` avant tout. `errorHandler` en dernière position. `apiRateLimiter` global avant les routes — correct.

**⚠️ Problème :** `express.json({ limit: '10mb' })` est nécessaire pour les avatars base64 mais ouvre la porte aux attaques DoS par payload. Recommandation : limite à 1MB par défaut, 10MB uniquement sur les routes upload dédiées.

### 3.3 Controllers — Analyse qualité

**Points forts :**
- `affectationController.js` — Complet : CRUD + détection conflits + notifications
- `statistiquesController.js` — 9 endpoints analytiques robustes, KPIs consolidés
- `userController.js` — Import bulk avec tracking erreurs individuelles
- `authController.js` — Reset password avec token, email notification

**Lacunes identifiées :**

| Controller | Problème |
|---|---|
| `generationAutomatiqueController.js` | Algorithme incomplet — génère des affectations sans optimisation contraintes |
| `disponibiliteController.js` | Pas de validation chevauchement de disponibilités |
| `historiqueAffectationController.js` | Registré dans routes mais non exposé au frontend |
| `appartenirController.js` | Gestion appartenance groupe peu documentée |

### 3.4 Logique de détection de conflits

```javascript
// utils/detectConflicts.js
// Détecte :
// 1. Chevauchement salle (même salle, même créneau, même date)
// 2. Chevauchement enseignant (même prof, même créneau, même date)
// 3. Chevauchement groupe — NON IMPLÉMENTÉ
```

**Problème critique :** La détection de conflits de groupe (même groupe assigné à 2 cours simultanément) est dans le modèle `Conflit` (type ENUM inclut `groupe`) mais **pas détectée automatiquement** dans `detectConflicts.js`. Les groupes peuvent avoir des conflits non signalés.

**Autre problème :** La détection se fait **après création** de l'affectation, pas en prévention. Il n'existe pas d'endpoint `POST /affectations/check-conflicts` pour valider avant de sauvegarder.

### 3.5 Génération automatique de planning

```javascript
// utils/generateAffectations.js
// Algorithme actuel : greedy simple
// - Itère sur cours × groupes
// - Cherche première salle disponible
// - Cherche premier enseignant disponible  
// - Ne respecte pas les contraintes de volume horaire
// - Ne gère pas les préférences enseignants
// - Pas de backtracking
```

**Évaluation :** L'algorithme est un stub fonctionnel mais non optimal. Il peut créer des plannings valides pour de petits datasets mais ne scale pas et ignore les contraintes métier complexes (charge maximale, préférences horaires, respect volume horaire).

### 3.6 API — Structure et conventions

**Points forts :**
- Tous les endpoints suivent `/api/{ressource}` REST standard
- Pagination cohérente via `paginationHelper`
- Réponses uniformes `{ data, pagination, message }`
- Codes HTTP corrects (200, 201, 400, 401, 403, 404, 409, 500)

**Lacunes :**
- Pas de versioning API (`/api/v1/`) — breaking changes impossibles sans régression
- Pas de documentation OpenAPI/Swagger
- Filtres query string non standardisés (chaque controller invente ses params)
- Pas de `ETags` ou `Last-Modified` pour caching HTTP

### 3.7 Gestion des erreurs

```javascript
// middleware/errorHandler.js — Centralisé et correct
SequelizeValidationError   → 400 + messages de validation
SequelizeUniqueConstraint  → 409 + champ en conflit
ForeignKeyConstraint       → 400
SequelizeDatabaseError     → 500 (sanitisé en prod)
TokenExpiredError          → 401
JsonWebTokenError          → 401
default                    → 500
```

**Bon design.** Stack traces uniquement en `NODE_ENV=development`. Erreurs sanitisées en production.

**⚠️ Problème :** Certains controllers `catch(error) { console.error(error); }` sans `next(error)` — les erreurs ne sont pas remontées au handler centralisé.

### 3.8 Logging et observabilité

```
✅ Morgan HTTP access logs
✅ console.error pour exceptions serveur
❌ Pas de structured logging (Winston, Pino)
❌ Pas de tracing distribué (OpenTelemetry)
❌ Pas d'alerting (email/Slack sur error 500)
❌ Pas de health metrics exposés (/metrics Prometheus)
❌ Pas de correlation ID sur les requêtes
```

En production réelle, cette absence de monitoring est critique. Un `console.log` en production n't est pas suffisant.

---

## 4. AUDIT BASE DE DONNÉES

### 4.1 Schéma — Vue d'ensemble

```
19 tables principales :
Users ─── Enseignant (1:1)
      └── Etudiant (1:1)
      └── Notification (1:n)
      └── Affectation × 2 FK (admin + enseignant)

Filiere ─── Groupe (1:n)
        └── Cours (1:n)

Groupe ─── Affectation (1:n)
Salle  ─── Affectation (1:n)
Cours  ─── Affectation (1:n)
Creneau ── Affectation (1:n)

Affectation ←──── ConflitAffectation ────→ Conflit (n:n)
Groupe      ←──── Appartenir ─────────────→ Etudiant (n:n)
```

### 4.2 Analyse des modèles critiques

#### Users
```sql
-- Bon : email UNIQUE, rôle enum strict
-- Problème : avatar_url TEXT (base64 en DB = anti-pattern)
-- Recommandation : stocker URL vers fichier S3/Cloudflare R2
```

#### Affectation — Table centrale
```sql
id_affectation INT PK AUTO_INCREMENT
date_seance DATE NOT NULL         -- ✅ Correct
statut ENUM(planifie, confirme, annule, reporte)  -- ✅ Complet
id_cours INT FK
id_groupe INT FK
id_user_enseignant INT FK → Users
id_salle INT FK
id_creneau INT FK
id_user_admin INT FK → Users      -- ✅ Traçabilité création
```

**Problème :** `date_seance` est `DATE` (pas `DATETIME`). Combiné à `id_creneau` pour obtenir l'heure. Requiert une jointure supplémentaire pour toute requête temporelle — inefficace.

#### Conflit
```sql
type_conflit ENUM(salle, enseignant, groupe)
-- Problème : 'groupe' dans l'enum mais non détecté côté applicatif
```

#### Creneau
```sql
jour_semaine ENUM(lundi, mardi, ...)
heure_debut TIME
heure_fin TIME
duree_minutes INT
-- Problème : duree_minutes calculable depuis heure_debut/fin — données dupliquées
```

### 4.3 Indexes — Analyse critique

```sql
-- Indexes existants (via Sequelize) :
Users.email           UNIQUE INDEX  ✅
Cours.code_cours      UNIQUE INDEX  ✅

-- Indexes MANQUANTS CRITIQUES :
Affectation.date_seance                      ❌ (filtres fréquents par date)
Affectation.id_user_enseignant               ❌ (getByEnseignant sans index)
Affectation.id_groupe                        ❌ (getByGroupe sans index)
Affectation.statut                           ❌ (filtres par statut fréquents)
Notification.id_user + lu                    ❌ (getNonLues sans index)
Conflit.resolu                               ❌ (getNonResolus sans index)
ConflitAffectation.id_affectation            ❌ (jointure sans index)
Disponibilite.id_user_enseignant             ❌
```

**Impact à 10k+ affectations :** Sans ces indexes, chaque requête fait un full table scan. Un planning de 50 enseignants × 30 semaines × 20 séances = **30 000 affectations**. Sans index sur `date_seance + id_user_enseignant`, un `getByEnseignant` scan 30 000 lignes.

### 4.4 Scalabilité

| Volume | Impact |
|---|---|
| 1 000 affectations | Aucun problème |
| 10 000 affectations | Lent sans indexes |
| 100 000 affectations | Dégradation critique |
| 1M affectations | Requiert partitionnement |

**Recommandations pour 100k+ :**
1. Ajouter les 8 indexes manquants (quick win, 2h de travail)
2. Partitionner `Affectation` par `date_seance` (par année académique)
3. Archivage des affectations passées > 2 ans
4. Activer le query cache MySQL
5. Ajouter Redis pour les statistiques (recalculées souvent, changent peu)

### 4.5 Multi-institutions

**Actuellement : aucune isolation multi-institutions.**

Le schéma n'a pas de colonne `id_institution` sur les tables. Toutes les institutions partageraient la même database sans séparation logique. Pour un SaaS multi-tenant :

**Option A (recommandée) — Row-level isolation :**
```sql
ALTER TABLE Users ADD COLUMN id_institution INT NOT NULL;
ALTER TABLE Filiere ADD COLUMN id_institution INT NOT NULL;
-- + toutes les tables racines
-- + middleware qui filtre automatiquement par institution
```

**Option B — Schema-per-tenant :**
```
CREATE DATABASE hestim_inst1;
CREATE DATABASE hestim_inst2;
-- Complexe à maintenir
```

---

## 5. AUDIT UX/UI

### 5.1 Comparaison avec les références

| Critère | Linear | Stripe | HESTIM Planner | Gap |
|---|---|---|---|---|
| Premier écran (vitesse) | Instantané | Instantané | ~3s (bundle 2.1MB) | 🔴 Critique |
| Cohérence visuelle | Parfaite | Parfaite | Bonne (85%) | 🟡 Améliorer |
| Micro-interactions | Fluides | Fluides | Basiques | 🟡 Améliorer |
| Empty states | Illustrés | Illustrés | Texte simple | 🟡 |
| Loading states | Skeleton | Skeleton | Skeleton ✅ | ✅ |
| Mobile | Optimal | Optimal | Basique | 🔴 |
| Typographie | Précise | Précise | Correcte | 🟡 |
| Densité information | Parfaite | Parfaite | Trop dense | 🟡 |
| Animations | 60fps | 60fps | Framer partiellement | 🟡 |

### 5.2 Forces de l'interface

- **Header et navigation** : DashboardLayout propre, menus collapsibles, breadcrumbs, notifications badge. Niveau professionnel.
- **Dashboard admin** : KPI cards avec gradients, graphiques recharts, suggestions intelligentes. Impressionnant.
- **Statistiques** : Vue analytique avec 3 onglets, export Excel/PDF. Valeur ajoutée réelle.
- **Page Conflits** : Donut chart + tableau filtrable. Visuellement cohérent.
- **Thème dark/light** : Bien implémenté, MUI custom complet.

### 5.3 Faiblesses UX identifiées

**1. Mobile — expérience cassée**
```
Les 12 pages de gestion ont des tableaux horizontaux sans responsive.
Sur smartphone : scroll horizontal infernal, boutons trop petits.
Solution : Card view sous 768px (pattern Tailwind Admin).
```

**2. Connexion — page Accueil inutile**
```
La route / mène à Accueil.jsx, page marketing vide.
L'utilisateur doit manuellement aller sur /connexion.
Solution : Redirect immédiat vers /connexion si non authentifié, dashboard si authentifié.
```

**3. Formulaires — validation trop tardive**
```
La plupart des formulaires ne valident qu'à la soumission.
Formik est là mais onBlur={formik.handleBlur} manque sur beaucoup de champs.
L'erreur apparaît après un clic, frustrant.
Solution : validateOnChange + validateOnBlur activés partout.
```

**4. Confirmations window.confirm()**
```
Certaines suppressions utilisent encore window.confirm() natif.
(Suppression des entités dans quelques pages non migrées)
Solution : ConfirmDialog (déjà créé) à étendre partout.
```

**5. Feedback actions**
```
Les créations/modifications montrent un Snackbar qui disparaît en 6s.
Pas de feedback permanent (ex: "Affectation créée le 08/05 à 14h30" dans une sidebar activity).
```

**6. Gestion des états de chargement**
```
Lors du premier chargement du dashboard, les KPIs arrivent avec un délai.
Pas de Suspense/skeleton sur les charts → "flash" de données vides.
```

**7. Navigation enseignant — limitée**
```
Le dashboard enseignant a peu d'actions directes.
Un enseignant ne peut pas créer directement une demande de report depuis l'emploi du temps.
Le lien entre affectation → demande de report est peu visible.
```

### 5.4 Expérience par rôle

**Admin (7/10) :** Dashboard complet, accès à tout, suggestions KPI. Frictions : tableaux non triables sur certaines pages, import fichier peu guidé.

**Enseignant (6/10) :** Dashboard basique, emploi du temps FullCalendar, affectations, disponibilités. Manque : workflow demande de report depuis le calendrier, notifications push.

**Étudiant (5/10) :** Vue emploi du temps seulement. Pas de :  notes, absences, progression, communication avec enseignants.

---

## 6. AUDIT DESIGN SYSTEM

### 6.1 Tokens de design (ThemeContext.jsx)

```javascript
// Palette définie — COHÉRENTE
primary:   #1a3a8f  (bleu HESTIM foncé)
secondary: #e8a020  (or HESTIM)
success:   #2e7d32
warning:   #ed6c02
error:     #c62828
info:      #0277bd

// Typography
fontFamily: 'Inter, Roboto, sans-serif'
h1-h3: fontWeight 700
button: fontWeight 600

// Shape
borderRadius: 10px (components)
borderRadius: 12px (cards)
```

### 6.2 Incohérences identifiées

| Problème | Impact |
|---|---|
| `#001962` dans Connexion.jsx vs `#1a3a8f` dans ThemeContext | Deux teintes de bleu différentes |
| `#E8A020` (PDF template) vs `#e8a020` (theme) | OK, même couleur |
| Certains composants hardcodent des couleurs (`bgcolor: '#001962'`) | Ignore le token theme |
| Spacing non tokenisé — `p: 2`, `p: 3`, `p: 2.5` mélangés sans logique | Incohérence visuelle subtile |
| Ombres MUI par défaut, non customisées | Pas premium |

### 6.3 Composants système

| Composant | Existence | Utilisation |
|---|---|---|
| Button | MUI + custom Buton.jsx | Buton.jsx non utilisé |
| Input | MUI TextField direct | Input.jsx non utilisé |
| Checkbox | MUI + Checkbox.jsx | Checkbox.jsx non utilisé |
| Dialog | ✅ ConfirmDialog partagé | Bien utilisé |
| Table | ✅ SkeletonTable | Bien utilisé |
| EmptyState | ✅ Créé | Bien utilisé |
| Toast/Snackbar | MUI direct dans chaque page | Non centralisé |
| Breadcrumbs | Dans DashboardLayout | OK |
| Badge | MUI Badge | OK |
| Chart | Recharts + Chart.js | 2 librairies pour graphiques |

**Problème majeur :** Le projet utilise **deux librairies de graphiques** (Chart.js + Recharts). Recharts est utilisé dans les pages importantes. Chart.js est importé dans `package.json` mais peu utilisé. Dette à nettoyer.

### 6.4 Tokens manquants pour atteindre le niveau premium

```javascript
// À ajouter dans ThemeContext
shadows: {
  card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  elevated: '0 4px 16px rgba(0,0,0,0.12)',
},
transitions: {
  fast: '120ms ease',
  normal: '200ms ease',
  slow: '320ms ease',
},
spacing: {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 40, '2xl': 64,
}
```

---

## 7. AUDIT PERFORMANCE

### 7.1 Bundle Analysis

```
Production build output :
dist/assets/index-DlLxtbLf.js    2,109 kB  │  gzip: 637 kB
dist/assets/index-tn0RQdqM.css      0.0 kB

Premier chargement à 50 Mbps : ~100ms
Premier chargement à 10 Mbps : ~510ms  ← utilisateurs mobiles
Premier chargement à 4G moyen: ~350ms
```

**Comparaison industrielle :**
- Linear : ~180 kB gzip
- Stripe Dashboard : ~300 kB gzip
- HESTIM : 637 kB gzip — **2 à 3× trop lourd**

### 7.2 Causes du bundle surdimensionné

| Librairie | Poids estimé gzip |
|---|---|
| MUI Material + Icons | ~120 kB |
| FullCalendar 6.x | ~90 kB |
| Recharts | ~60 kB |
| Chart.js | ~40 kB (non tree-shaked) |
| jsPDF | ~80 kB |
| jspdf-autotable | ~30 kB |
| React 19 | ~45 kB |
| Framer Motion | ~30 kB |
| XLSX | ~50 kB |
| Autres | ~92 kB |

### 7.3 Optimisations critiques

**1. Code splitting par route (priorité 1)**
```javascript
// App.jsx — actuellement
import AdminDashboard from './pages/dashboard/AdminDashboard';

// Après optimisation
const AdminDashboard = React.lazy(() =>
  import('./pages/dashboard/AdminDashboard')
);
// + <Suspense fallback={<PageSkeleton />}> autour de Routes
```

**Gain estimé :** Réduction du bundle initial de 60-70%. Chaque page charge seulement ce dont elle a besoin.

**2. Chart.js → suppression**
```javascript
// Supprimer Chart.js, utiliser uniquement Recharts
// Gain : ~40 kB gzip
```

**3. jsPDF — import conditionnel**
```javascript
// Charger jsPDF uniquement quand l'export est demandé
const { exportToPDF } = await import('./utils/exportEmploiDuTemps');
// Gain : ~110 kB hors du bundle initial
```

**4. XLSX — import conditionnel**
```javascript
// Même pattern, import dynamique sur click "Export Excel"
// Gain : ~50 kB
```

**5. MUI Icons — tree-shaking**
```javascript
// ✅ Déjà bon : import { Edit } from '@mui/icons-material' (tree-shakeable)
// Vérifier que tous les imports sont named, pas default
```

**Gain total estimé avec lazy loading + optimisations :**
```
Avant : 637 kB gzip
Après : ~180-220 kB gzip (réduction 65%)
Temps chargement 4G : 350ms → 120ms
```

### 7.4 Core Web Vitals estimés (état actuel)

| Métrique | Score estimé | Cible |
|---|---|---|
| LCP (Largest Contentful Paint) | ~3.2s | < 2.5s |
| FID / INP | ~150ms | < 200ms |
| CLS | ~0.05 | < 0.1 |
| FCP | ~2.8s | < 1.8s |
| **Lighthouse Performance** | **~45-55** | **> 80** |

---

## 8. AUDIT SÉCURITÉ

### 8.1 Authentification JWT

```javascript
// authMiddleware.js
const token = header.split(' ')[1]; // Bearer token
const decoded = jwt.verify(token, JWT_SECRET);
const user = await Users.findOne({ where: { id_user, actif: true } });
```

**Points forts :**
- Vérification `actif` à chaque requête (révocation possible)
- Expiration 7 jours (configurable)
- JWT_SECRET obligatoire en production (crash au démarrage si absent)

**Vulnérabilités :**

| Vulnérabilité | Sévérité | Description |
|---|---|---|
| Token en localStorage | 🔴 HIGH | Vulnérable aux attaques XSS. Un script malveillant peut voler le token. |
| Pas de refresh token | 🔴 HIGH | Session de 7 jours non révocable post-logout |
| Secret statique | 🟡 MEDIUM | Rotation du secret impossible sans invalider toutes les sessions |
| Dual field (userId/id_user) | 🟡 LOW | Complexité inutile dans le payload decode |

**Fix recommandé pour le token storage :**
```javascript
// Option A : httpOnly cookie (préféré)
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Option B : token split (token en cookie, signature en localStorage)
// Mitigation partielle du risque XSS
```

### 8.2 Rate Limiting

```javascript
// middleware/rateLimiterMiddleware.js
// Map en mémoire — par process Node.js
const requestMap = new Map(); // { ip: { count, resetTime } }
```

**Problème critique en production :**

```
Scénario : 3 instances Node.js derrière un load balancer
- Instance 1 : 450/500 req de l'attaquant
- Instance 2 : 450/500 req du même attaquant
- Instance 3 : 450/500 req du même attaquant
= 1350 requêtes passées, seulement 150 bloquées par instance
```

**Fix :**
```javascript
// Remplacer la Map par Redis
const redis = require('ioredis');
// rate-limiter-flexible avec Redis store
const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100,
  duration: 900, // 15 min
});
```

### 8.3 Gestion des inputs

| Vecteur | Protection | Statut |
|---|---|---|
| XSS via input | Sanitisation HTML entities | ✅ |
| SQL Injection | Sequelize ORM paramétré | ✅ |
| CSRF | Non implémenté | ❌ (SPA + JWT = risque faible) |
| Path Traversal | Non applicable (pas de file serve) | N/A |
| File Upload | Import CSV/XLSX, pas de fichiers bruts | ✅ |
| Mass Assignment | Whitelist dans controllers | ⚠️ Partiel |

### 8.4 Mots de passe

```javascript
// userController.js — import bulk
password: row.password?.trim() || 'password123'
```

**🔴 CRITIQUE :** Le mot de passe par défaut `'password123'` pour l'import bulk est une vulnérabilité grave. En production, tous les utilisateurs importés auront ce mot de passe faible, facilement devinable.

**Fix immédiat :**
```javascript
// Générer un password aléatoire fort + envoyer par email
const tempPassword = crypto.randomBytes(8).toString('hex');
// + sendWelcomeEmail(user.email, tempPassword)
// + actif: false jusqu'à premier login
```

### 8.5 Headers de sécurité

```javascript
// securityMiddleware.js — Helmet configuré
CSP: default-src 'self'; img-src 'self' data: https:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block

// MANQUANTS :
Strict-Transport-Security   ❌ (HSTS — force HTTPS)
Permissions-Policy          ❌ (désactiver camera, mic, etc.)
Referrer-Policy             ❌
```

### 8.6 Reset password token

```javascript
// PasswordResetToken model
// Champ 'expires_at' présent dans le modèle
// Vérification côté authController ?
```

**À vérifier :** Le modèle `PasswordResetToken` a un champ `expires_at` mais il faut confirmer que la vérification d'expiration est faite côté controller avant de permettre le reset.

---

## 9. AUDIT PRODUIT & BUSINESS

### 9.1 Proposition de valeur par rôle

**Administrateur — Forte valeur**
- Dashboard analytique complet (KPIs, graphiques, suggestions)
- CRUD sur toutes les entités
- Gestion des conflits avec visualisation donut
- Export Excel/PDF professionnel
- Suggestions automatiques basées sur KPIs

**Enseignant — Valeur moyenne**
- Emploi du temps calendrier (FullCalendar)
- Demandes de report avec workflow
- Gestion des disponibilités
- Consultation des affectations
- Manque : notation, suivi présences, messagerie, documents cours

**Étudiant — Valeur faible**
- Emploi du temps uniquement
- Aucune interactivité réelle
- Pas de : notes, absences, messagerie, ressources pédagogiques

### 9.2 Différenciation vs concurrents

| Solution | HESTIM Planner | Avantage |
|---|---|---|
| ADE Campus | Prix très élevé, UI daté | HESTIM : moderne, abordable |
| Celcat | Enterprise, complexe | HESTIM : simple à déployer |
| Google Sheets | Manuel, sans conflits | HESTIM : automatisation |
| Odoo Education | Suite complète, lourd | HESTIM : focused et léger |

**Avantage compétitif :** HESTIM Planner est l'option la plus moderne, déployable en 30 minutes via Docker, avec une UX qui s'approche des standards SaaS actuels.

### 9.3 Onboarding — Absent

**État actuel :** Zéro onboarding. L'administrateur arrive sur le dashboard avec des KPIs vides et doit deviner quoi créer en premier.

**Ce qu'il faudrait :**
```
Étape 1 : Créer votre établissement (nom, logo)
Étape 2 : Ajouter vos filières
Étape 3 : Créer vos groupes
Étape 4 : Importer vos enseignants (CSV)
Étape 5 : Importer vos étudiants (CSV)
Étape 6 : Configurer les créneaux
Étape 7 : Créer vos cours
→ Générer le planning automatiquement
```

Un wizard d'onboarding représente 3-5 jours de développement mais multiplie par 3 le taux d'adoption.

### 9.4 Logique de planification

```
Manuelle : ✅ Admin crée affectations une par une ou en import
Semi-auto : ✅ Génération automatique (partielle)
Optimisée : ❌ Pas d'algorithme de satisfaction de contraintes
Préventive : ❌ Pas de vérification avant création
```

**Gap critique :** La génération automatique est la killer feature d'un outil de planification. L'implémentation actuelle est un prototype. Un algorithme complet (type constraint satisfaction / genetic algorithm) représente 2-3 semaines de développement.

### 9.5 Multi-institutions — Absent

Le SaaS multi-tenant est l'évolution naturelle. Actuellement, chaque déploiement Docker sert une institution. Pour la commercialisation :

```
Tier Gratuit   : 1 institution, 50 utilisateurs
Tier Starter   : 1 institution, 500 utilisateurs
Tier Pro       : Multi-campus, 5 000 utilisateurs
Tier Enterprise: Multi-institutions, illimité
```

**Estimation développement isolation multi-tenant :** 3-4 semaines (colonne `id_institution` + middleware tenant + UI sélection institution).

---

## 10. AUDIT ARCHITECTURE & SCALABILITÉ

### 10.1 Déploiement Docker

```yaml
# 3 services en production :
mysql:8.0      ← Base de données persistante (volume mysql_data)
hestim-backend ← API Node.js (node:22-alpine, non-root user)
hestim-frontend← Nginx servant les assets React

# Points forts :
✅ Multi-stage builds (taille images optimisée)
✅ Non-root user (backend)
✅ Healthchecks configurés
✅ Réseau bridge isolé (hestim_net)
✅ Volumes persistants (mysql_data)
✅ .env.docker séparé des secrets code
✅ node:22-alpine (LTS), nginx:1.27-alpine (stable)

# Limitations :
❌ 1 seule instance backend (pas de horizontal scaling)
❌ Pas de Redis (rate limiting, cache sessions)
❌ Pas de reverse proxy Nginx devant les services
❌ Pas de SSL/TLS termination dans Docker Compose
❌ Logs non persistés (disparaissent au restart)
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
Étapes :
1. Build frontend (Vite)       ✅
2. Test backend (Jest + MySQL)  ✅ (mais tests rares)
3. Deploy backend → Railway    ✅ (conditional main branch)
4. Deploy frontend → Vercel    ✅ (conditional main branch)

Manquant :
❌ Playwright E2E en CI (tests présents mais non lancés en CI)
❌ Security scanning (Snyk, Trivy)
❌ Docker image scanning
❌ Performance regression check
❌ Staging environment
❌ Rollback automatique
```

### 10.3 Scalabilité architecture

**État actuel :**
```
[Internet] → [Nginx port 80] → [React SPA]
                             → [/api/*] → [Node.js :5000] → [MySQL :3306]
```

**Architecture cible pour 10k utilisateurs simultanés :**
```
[CloudFlare CDN] → [Load Balancer]
                 → [Nginx × 2]        (SPA + proxy)
                 → [Node.js × 3-5]    (API, horizontal)
                 → [Redis Cluster]     (sessions, cache, rate limit)
                 → [MySQL Primary]     (writes)
                 → [MySQL Replica × 2] (reads)
                 → [S3/R2]            (fichiers, avatars)
```

**Étapes vers cette architecture :**
1. Externaliser sessions vers Redis (1 semaine)
2. Activer le read replica MySQL (1 jour)
3. Déplacer avatars vers S3 (2 jours)
4. Activer horizontal scaling Node.js (1 jour)
5. Ajouter CDN devant le frontend (1 heure)

### 10.4 Monitoring — Absent

```
❌ Pas de APM (Datadog, New Relic, Sentry)
❌ Pas de alerting (PagerDuty, OpsGenie)
❌ Pas de log aggregation (ELK, Loki)
❌ Pas de metrics (Prometheus + Grafana)
❌ Pas de uptime monitoring (Pingdom, BetterStack)

✅ /health endpoint présent (utilisé par Docker healthcheck)
✅ Morgan HTTP logs (console uniquement)
```

**Quick win :** Sentry se configure en 30 minutes et capture toutes les erreurs frontend (React) et backend (Node.js) automatiquement. Gratuit pour projets éducatifs.

---

## ROADMAP D'EXÉCUTION PRIORISÉE

### PRIORITÉ 1 — CRITIQUE (avant toute mise en production réelle)

**Charge estimée : 2-3 semaines**

| # | Tâche | Impact | Effort |
|---|---|---|---|
| P1.1 | Migrer JWT storage vers httpOnly cookie | 🔴 Sécurité | 2j |
| P1.2 | Implémenter refresh token + rotation | 🔴 Sécurité | 3j |
| P1.3 | Remplacer rate limiter par Redis | 🔴 Scalabilité | 2j |
| P1.4 | Supprimer mot de passe par défaut 'password123' | 🔴 Sécurité | 0.5j |
| P1.5 | Ajouter 8 indexes MySQL manquants | 🔴 Performance | 1j |
| P1.6 | Code splitting / React.lazy toutes les routes | 🔴 Performance | 2j |
| P1.7 | Ajouter route 404 + React Error Boundary | 🔴 UX | 1j |
| P1.8 | Compléter détection conflits de groupe | 🔴 Métier | 2j |
| P1.9 | Fix validation password reset token (expiry) | 🔴 Sécurité | 0.5j |

---

### PRIORITÉ 2 — STABILISATION (dette technique)

**Charge estimée : 3-4 semaines**

| # | Tâche | Impact | Effort |
|---|---|---|---|
| P2.1 | Migrer fetch manuel → React Query dans les pages | 🟡 Architecture | 5j |
| P2.2 | Découper api.js en modules par domaine | 🟡 Maintenabilité | 2j |
| P2.3 | Supprimer Chart.js (garder Recharts uniquement) | 🟡 Bundle | 0.5j |
| P2.4 | Activer onBlur validation formik sur tous les champs | 🟡 UX | 1j |
| P2.5 | Supprimer composants dead code (Buton, Input, Checkbox) | 🟡 Code quality | 0.5j |
| P2.6 | Ajouter versioning API (/api/v1/) | 🟡 Évolutivité | 1j |
| P2.7 | Structured logging avec Winston/Pino | 🟡 Observabilité | 1j |
| P2.8 | Tests unitaires backend (coverage > 70%) | 🟡 Qualité | 5j |
| P2.9 | Migrer avatars de base64 MySQL vers stockage fichier | 🟡 Performance | 2j |
| P2.10 | Import dynamique jsPDF + XLSX (hors bundle) | 🟡 Performance | 1j |
| P2.11 | Unifier token design (supprimer hardcode `#001962`) | 🟡 Design | 1j |

---

### PRIORITÉ 3 — POLISH & PREMIUM

**Charge estimée : 2-3 semaines**

| # | Tâche | Impact | Effort |
|---|---|---|---|
| P3.1 | Responsive mobile pour les tables de gestion | 🟢 UX mobile | 3j |
| P3.2 | Redirect immédiat `/` vers dashboard/connexion | 🟢 UX | 0.5j |
| P3.3 | Wizard onboarding (7 étapes) | 🟢 Adoption | 5j |
| P3.4 | Animations Framer Motion sur transitions de pages | 🟢 Premium | 2j |
| P3.5 | Sentry intégration (frontend + backend) | 🟢 Monitoring | 0.5j |
| P3.6 | ARIA live regions pour notifications | 🟢 Accessibilité | 1j |
| P3.7 | Toast centralisé (supprimer Snackbar dupliqué dans pages) | 🟢 DX | 1j |
| P3.8 | Focus indicators custom (ring premium) | 🟢 A11y + premium | 1j |
| P3.9 | Headers HSTS + Referrer-Policy | 🟢 Sécurité | 0.5j |

---

### PRIORITÉ 4 — FONCTIONNALITÉS PRODUIT

**Charge estimée : 4-6 semaines**

| # | Tâche | Impact | Effort |
|---|---|---|---|
| P4.1 | Algorithme de génération automatique complet (CSP/greedy optimisé) | 🔵 Core feature | 10j |
| P4.2 | Endpoint `/affectations/check-conflicts` (prévention) | 🔵 Métier | 2j |
| P4.3 | Expérience étudiant enrichie (notes, absences, docs) | 🔵 Valeur produit | 8j |
| P4.4 | Bulk operations tables (sélection multiple + actions) | 🔵 UX admin | 3j |
| P4.5 | Vue calendrier mensuelle/semestrielle admin | 🔵 Planification | 3j |
| P4.6 | Tableau de bord enseignant amélioré (charge, stats) | 🔵 Valeur | 3j |
| P4.7 | Notifications push (SSE ou WebSocket) | 🔵 Temps réel | 4j |
| P4.8 | Workflow demande de report depuis calendrier | 🔵 UX | 2j |
| P4.9 | Audit log complet (qui a fait quoi, quand) | 🔵 Compliance | 3j |

---

### PRIORITÉ 5 — SCALE & FUTURE

**Charge estimée : 6-10 semaines**

| # | Tâche | Impact | Effort |
|---|---|---|---|
| P5.1 | Isolation multi-tenant (`id_institution` + middleware) | ⚫ SaaS | 15j |
| P5.2 | Redis pour cache API (statistiques, KPIs) | ⚫ Scale | 5j |
| P5.3 | MySQL Read Replica + query routing | ⚫ Scale | 3j |
| P5.4 | Partitionnement `Affectation` par année académique | ⚫ Scale | 3j |
| P5.5 | Queue jobs async (génération planning, emails) | ⚫ Architecture | 5j |
| P5.6 | Métriques Prometheus + Grafana dashboard | ⚫ Monitoring | 3j |
| P5.7 | OpenAPI 3.0 (Swagger documentation) | ⚫ DX | 4j |
| P5.8 | AI/ML suggéré (optimisation planning, prédiction conflits) | ⚫ Innovation | 20j |
| P5.9 | Staging environment + smoke tests CI | ⚫ DevOps | 3j |

---

## RÉSUMÉ EXÉCUTIF

### Où en est le projet

```
Complétion globale estimée : 72 %
```

| Dimension | Complétion |
|---|---|
| Fonctionnalités métier core | 85% |
| Qualité du code | 68% |
| Sécurité production | 55% |
| Performance | 50% |
| DevOps/Déploiement | 75% |
| UX/Design polish | 62% |
| Tests | 65% |
| Documentation | 40% |

### Ce qui manque critiquement

1. **Sécurité JWT** — localStorage → httpOnly cookie (bloquant production réelle)
2. **Refresh tokens** — sessions révocables (bloquant)
3. **Rate limiter Redis** — single instance actuel (bloquant multi-instance)
4. **Code splitting** — bundle 2.1 MB inacceptable (critique performance)
5. **Indexes MySQL** — 8 indexes manquants (critique à 10k+ affectations)
6. **Monitoring** — aucun alerting (critique production)

### Ce qu'il faut refactoriser en priorité

1. `services/api.js` → modules par domaine
2. Fetch manuels → React Query
3. AdminDashboard.jsx → sous-composants
4. Détection conflits → compléter groupe + prévention
5. Import bulk → mot de passe fort généré

### Timeline réaliste

| Phase | Contenu | Durée |
|---|---|---|
| **P1 — Critique** | Sécurité + performance bloquants | 2-3 semaines |
| **P2 — Stabilisation** | Dette technique + tests | 3-4 semaines |
| **P3 — Polish** | Onboarding + mobile + monitoring | 2-3 semaines |
| **P4 — Fonctionnalités** | Algo planning + expérience étudiants | 4-6 semaines |
| **P5 — Scale** | Multi-tenant + Redis + AI | 6-10 semaines |
| **Total** | MVP production solide → SaaS complet | **4-6 mois** |

### Conclusion

HESTIM Planner est un projet **sérieux et avancé** pour son niveau. La stack technique est moderne (React 19, MUI 7, Node.js, Docker, CI/CD), l'architecture est correctement pensée, et la couverture fonctionnelle est réelle. Le projet peut aller en production dans un contexte contrôlé (institution unique, audience limitée) en 2-3 semaines de travail sur les points critiques. Pour un SaaS multi-institutions commercial, comptez 4-6 mois supplémentaires.

---

*Audit réalisé par analyse statique complète du codebase — Mai 2026*
