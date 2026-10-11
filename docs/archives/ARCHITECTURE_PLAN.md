# PLAN D'ARCHITECTURE — HESTIM PLANNER
### Staff Software Engineer · Product Architect · Senior SaaS Engineer

---

> **Statut :** Pré-implémentation — Plan validé avant tout code  
> **Scope :** Refactoring architecture sans breaking changes  
> **Objectif :** Production-ready · Scalable · Multi-tenant ready  

---

## 1. ANALYSE D'IMPACT — AVANT TOUTE IMPLÉMENTATION

### 1.1 Matrice des risques techniques actuels

| Risque | Probabilité | Impact | Priorité |
|---|---|---|---|
| XSS vol token JWT (localStorage) | Moyenne | Critique | P0 |
| Rate limiter mono-instance | Haute | Critique | P0 |
| Bundle 2.1 MB → LCP 3s+ | Haute | Critique | P0 |
| 8 indexes MySQL manquants → full scan | Haute | Élevé | P1 |
| Absence React Error Boundary → crash silencieux | Moyenne | Élevé | P1 |
| api.js monolithique 800+ lignes → maintenabilité | Haute | Moyen | P1 |
| Chart.js + Recharts → 40 kB doublon | Haute | Moyen | P2 |
| fetch manuel au lieu de React Query → cache absent | Haute | Moyen | P2 |
| Pas de 404 route → UX cassée | Moyenne | Moyen | P2 |
| dead code Buton/Input/Checkbox | Basse | Faible | P3 |

### 1.2 Dépendances entre changements

```
JWT httpOnly cookie
  └─ dépend de: refresh token endpoint (backend)
  └─ dépend de: modification AuthContext (frontend)
  └─ impact: TOUS les appels API (Header Authorization → cookie)

React.lazy() code splitting
  └─ dépend de: React.Suspense wrapping routes
  └─ dépend de: PageSkeleton component
  └─ impact: App.jsx (refactor complet routes)

React Query migration
  └─ dépend de: queryClient setup (déjà installé)
  └─ impact: CHAQUE page (useEffect → useQuery)
  └─ risque: migration progressive obligatoire (page par page)

Redis rate limiter
  └─ dépend de: Redis service dans Docker Compose
  └─ dépend de: rate-limiter-flexible package
  └─ impact: middleware/rateLimiterMiddleware.js (remplacement)
```

### 1.3 Décisions architecturales clés

| Décision | Choix | Raison |
|---|---|---|
| Auth tokens | httpOnly cookie + refresh token | Éliminer risque XSS, sessions révocables |
| State management | React Query (déjà installé) | Cache automatique, retry, invalidation |
| Rate limiting | Redis via `rate-limiter-flexible` | Horizontal scaling compatible |
| Code splitting | `React.lazy()` + `Suspense` | Bundle initial -65% |
| API structure | Modules par domaine (pas monolithique) | Maintenabilité, testabilité |
| Charts | Recharts uniquement (supprimer Chart.js) | Réduction bundle, cohérence |
| Logging | Winston structured logs | Observabilité production |
| Notifications | Toast centralisé via Context | DRY, cohérence UX |
| Mobile | Card view sous 768px pour tables | Expérience mobile |
| Multi-tenant | Préparation colonne `id_institution` | Future-proof sans breaking change |

---

## 2. ARCHITECTURE CIBLE

### 2.1 Vue d'ensemble système

```
┌────────────────────────────────────────────────────────────────┐
│                        INTERNET                                │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS
              ┌──────────▼──────────┐
              │   Nginx (port 80)   │
              │  - SPA serving      │
              │  - /api/* → proxy   │
              │  - gzip, cache      │
              └──────────┬──────────┘
              ┌──────────▼──────────┐
              │  React SPA (Vite)   │
              │  - Code split       │
              │  - React Query      │
              │  - httpOnly auth    │
              └─────────────────────┘
                         │ /api/*
              ┌──────────▼──────────┐
              │   Node.js Express   │
              │  - JWT (cookies)    │
              │  - Redis rate limit │
              │  - Winston logs     │
              │  - API versioned    │
              └──────┬──────┬───────┘
                     │      │
           ┌─────────▼─┐  ┌─▼──────────┐
           │  MySQL 8  │  │  Redis 7   │
           │  indexes  │  │  sessions  │
           │  relations│  │  rate limit│
           └───────────┘  └────────────┘
```

### 2.2 Architecture frontend cible

```
frontend/src/
├── App.jsx                    ← React.lazy() + Suspense
├── main.jsx                   ← QueryClient setup, ThemeProvider
│
├── pages/                     ← Pages (code-split automatique)
│   ├── auth/
│   │   ├── ConnexionPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── dashboard/
│   │   ├── AdminDashboard/
│   │   │   ├── index.jsx          ← Composition root
│   │   │   ├── KPISection.jsx     ← Composant isolé
│   │   │   ├── ChartsSection.jsx  ← Composant isolé
│   │   │   ├── SuggestionsPanel.jsx
│   │   │   └── ConflictsSection.jsx
│   │   ├── EnseignantDashboard.jsx
│   │   └── EtudiantDashboard.jsx
│   ├── gestion/               ← 12 pages admin
│   ├── emploi-du-temps/
│   └── shared/
│       ├── NotificationsPage.jsx
│       ├── ParametresPage.jsx
│       └── NotFoundPage.jsx   ← NOUVEAU
│
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.jsx  ✅ Existant
│   │   ├── SkeletonTable.jsx  ✅ Existant
│   │   ├── EmptyState.jsx     ✅ Existant
│   │   ├── ErrorBoundary.jsx  ← NOUVEAU
│   │   ├── PageSkeleton.jsx   ← NOUVEAU (Suspense fallback)
│   │   └── ToastProvider.jsx  ← NOUVEAU (centralisé)
│   │   [Buton.jsx, Input.jsx, Checkbox.jsx → SUPPRIMER]
│   ├── layouts/
│   │   ├── DashboardLayout.jsx ✅ Existant
│   │   └── PublicLayout.jsx    ← NOUVEAU
│   └── emploi-du-temps/
│       └── EnhancedTimetable.jsx ✅ Existant
│
├── hooks/
│   ├── useSortableTable.js    ✅ Existant
│   ├── useOnlineStatus.js     ✅ Existant
│   ├── useToast.js            ← NOUVEAU
│   └── useMediaQuery.js       ← NOUVEAU (mobile detection)
│
├── services/                  ← Découpage par domaine
│   ├── api.client.js          ← NOUVEAU (fetch wrapper uniquement)
│   ├── auth.api.js            ← NOUVEAU (extrait de api.js)
│   ├── users.api.js           ← NOUVEAU
│   ├── affectations.api.js    ← NOUVEAU
│   ├── conflits.api.js        ← NOUVEAU
│   ├── statistiques.api.js    ← NOUVEAU
│   └── [autres domaines...]   ← NOUVEAU
│
├── queries/                   ← NOUVEAU — React Query hooks
│   ├── useAffectations.js
│   ├── useConflits.js
│   ├── useStatistiques.js
│   └── useNotifications.js
│
├── contexts/
│   ├── AuthContext.jsx        ← Modifier (httpOnly cookie)
│   ├── ThemeContext.jsx       ✅ Existant
│   └── ToastContext.jsx       ← NOUVEAU
│
└── utils/
    ├── exportExcel.js         ✅ Existant
    └── exportEmploiDuTemps.js ✅ Existant (imports dynamiques)
```

### 2.3 Architecture backend cible

```
backend/
├── server.js                  ← Modifier (cookie-parser, Redis)
├── config/
│   ├── db.js                  ✅ Existant
│   └── redis.js               ← NOUVEAU
│
├── controllers/               ✅ Existant (20 controllers)
│   └── authController.js      ← Modifier (refresh token + cookies)
│
├── middleware/
│   ├── authMiddleware.js       ← Modifier (lire cookie + header)
│   ├── rateLimiterMiddleware.js← Remplacer (Redis)
│   ├── errorHandler.js        ✅ Existant
│   ├── asyncHandler.js        ✅ Existant
│   ├── securityMiddleware.js  ← Modifier (HSTS, Referrer-Policy)
│   ├── validationMiddleware.js✅ Existant
│   ├── loggerMiddleware.js    ← Remplacer (Winston)
│   └── tenantMiddleware.js    ← NOUVEAU (multi-tenant futur)
│
├── models/
│   ├── [19 modèles existants] ✅
│   └── index.js               ← Modifier (ajouter indexes)
│
├── routes/
│   ├── [19 fichiers routes]   ✅ Existant
│   └── authRoutes.js          ← Modifier (refresh endpoint)
│
└── utils/
    ├── detectConflicts.js     ← Modifier (ajouter groupes)
    ├── generateAffectations.js← Modifier (optimiser algorithme)
    ├── logger.js              ← NOUVEAU (Winston instance)
    └── [autres utils]         ✅ Existant
```

---

## 3. PLAN D'IMPLÉMENTATION DÉTAILLÉ

---

### PHASE 1 — SÉCURITÉ & PERFORMANCE CRITIQUE
**Durée :** 5-7 jours · **Risque :** Moyen (modifications auth globales)

---

#### ÉTAPE 1.1 — Code Splitting React.lazy() ⚡

**Impact :** Bundle 2.1 MB → ~700 KB (réduction 65%)  
**Risque :** Faible — React.Suspense est stable depuis React 18

**Fichier :** `frontend/src/App.jsx`

```javascript
// AVANT (chargement synchrone de tout le bundle)
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Connexion from './pages/Connexion';
// ... 28 imports synchrones

// APRÈS (code splitting par route)
import { lazy, Suspense } from 'react';
import PageSkeleton from './components/common/PageSkeleton';

// Public pages
const Connexion       = lazy(() => import('./pages/auth/ConnexionPage'));
const ForgotPassword  = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPassword   = lazy(() => import('./pages/auth/ResetPasswordPage'));
const NotFound        = lazy(() => import('./pages/shared/NotFoundPage'));

// Dashboards
const AdminDashboard      = lazy(() => import('./pages/dashboard/AdminDashboard'));
const EnseignantDashboard = lazy(() => import('./pages/dashboard/EnseignantDashboard'));
const EtudiantDashboard   = lazy(() => import('./pages/dashboard/EtudiantDashboard'));

// Gestion (chargement uniquement si admin)
const Utilisateurs = lazy(() => import('./pages/gestion/Utilisateurs'));
const Enseignants  = lazy(() => import('./pages/gestion/Enseignants'));
// ... autres pages

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/connexion" element={<Connexion />} />
            {/* ... routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

**Fichier à créer :** `frontend/src/components/common/PageSkeleton.jsx`

```javascript
// Skeleton affiché pendant le lazy loading d'une page
export default function PageSkeleton() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Skeleton variant="rectangular" width={260} height="100vh" />
      <Box sx={{ flex: 1, p: 3 }}>
        <Skeleton variant="rectangular" height={64} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[1,2,3,4].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
```

**Fichier à créer :** `frontend/src/components/common/ErrorBoundary.jsx`

```javascript
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En prod: Sentry.captureException(error, { extra: info });
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Une erreur inattendue s'est produite
            </Typography>
            <Typography color="text.secondary" mb={3}>
              {this.state.error?.message || 'Veuillez recharger la page.'}
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

**Fichier à créer :** `frontend/src/pages/shared/NotFoundPage.jsx`

```javascript
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Box textAlign="center">
        <Typography variant="h1" fontWeight={900} color="primary" sx={{ fontSize: '8rem', lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h5" color="text.secondary" mb={3}>
          Cette page n'existe pas
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>
    </Box>
  );
}
```

---

#### ÉTAPE 1.2 — Imports dynamiques jsPDF + XLSX ⚡

**Impact :** -110 kB gzip du bundle initial  
**Fichiers :** Tous les fichiers qui importent jsPDF/XLSX

```javascript
// AVANT (dans chaque page de gestion)
import { exportToExcel, COLS_SALLES } from '../../utils/exportExcel';

// APRÈS (import dynamique au moment du clic)
const handleExport = async () => {
  const { exportToExcel, COLS_SALLES } = await import('../../utils/exportExcel');
  exportToExcel(salles, COLS_SALLES, 'Salles', 'Salles');
};

// Pour le PDF emploi du temps
const handleExportPDF = async () => {
  const { exportToPDF } = await import('../../utils/exportEmploiDuTemps');
  await exportToPDF(affectationsData, filename, title, role);
};
```

---

#### ÉTAPE 1.3 — Supprimer Chart.js ⚡

**Impact :** -40 kB gzip · 0 breaking changes (Recharts déjà utilisé partout)

```bash
# Dans frontend/
npm uninstall chart.js
```

Vérifier que `package.json` ne référence plus Chart.js. Rechercher dans le code :
```bash
grep -r "chart.js\|Chart.js\|from 'chart'" frontend/src/
```

---

#### ÉTAPE 1.4 — JWT httpOnly Cookie + Refresh Token 🔐

**Impact :** Sécurité critique — XSS ne peut plus voler le token  
**Risque :** Élevé — impact sur toute la couche auth  
**Migration :** Compatible descendante (lire cookie ET header pendant la transition)

**Backend — Nouveaux endpoints :**

```javascript
// backend/routes/authRoutes.js — NOUVEAUX ENDPOINTS
router.post('/login', authController.login);        // Existant — modifier
router.post('/refresh', authController.refreshToken); // NOUVEAU
router.post('/logout', authController.logout);       // Existant — modifier
router.get('/me', authenticate, authController.getMe);
```

**Backend — authController.js :**

```javascript
// login() — Modifier pour envoyer httpOnly cookie
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);

  // Access token court (15 min)
  const accessToken = jwt.sign(
    { id_user: user.id_user, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh token long (7 jours)
  const refreshToken = jwt.sign(
    { id_user: user.id_user },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Access token en httpOnly cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  // Refresh token en httpOnly cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/api/auth/refresh', // Cookie envoyé UNIQUEMENT à ce path
  });

  res.json({ success: true, user: sanitizeUser(user) });
});

// refreshToken() — NOUVEAU
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await Users.findOne({ where: { id_user: decoded.id_user, actif: true } });
  if (!user) return res.status(401).json({ message: 'Utilisateur invalide' });

  const newAccessToken = jwt.sign(
    { id_user: user.id_user, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.cookie('access_token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.json({ success: true });
});

// logout() — Modifier
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ success: true, message: 'Déconnecté' });
});
```

**Backend — authMiddleware.js :**

```javascript
// Lire depuis cookie (production) OU Authorization header (dev/compatibilité)
export const authenticate = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.access_token;

  // Fallback header pour compatibilité Playwright tests + mobile
  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
  }

  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findOne({ where: { id_user: decoded.id_user, actif: true } });
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Signaler au frontend de renouveler
      return res.status(401).json({ message: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
});
```

**Backend — server.js :**

```javascript
// Ajouter cookie-parser
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Variables d'environnement à ajouter
// JWT_REFRESH_SECRET=SECRET_DIFFERENT_DU_JWT_SECRET
```

**Frontend — AuthContext.jsx :**

```javascript
// api.client.js — Modifier pour refresh automatique
const request = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // CRITIQUE : envoie les cookies httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Auto-refresh si 401 TOKEN_EXPIRED
  if (res.status === 401) {
    const data = await res.json();
    if (data.code === 'TOKEN_EXPIRED') {
      const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshed.ok) {
        // Retry la requête originale
        return request(endpoint, options);
      }
    }
    throw new Error(data.message || 'Non authentifié');
  }

  return res.json();
};
```

**Variables d'environnement à ajouter :**

```bash
# .env.docker.example
JWT_SECRET=ACCESS_TOKEN_SECRET_64_CHARS_MIN
JWT_REFRESH_SECRET=REFRESH_TOKEN_SECRET_DIFFERENT_64_CHARS_MIN
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

#### ÉTAPE 1.5 — Redis Rate Limiter 🔒

**Impact :** Rate limiting distribué, compatible multi-instances  
**Dépendance :** Redis service dans Docker Compose

**Docker Compose — Ajouter Redis :**

```yaml
# docker-compose.yml — Ajouter service Redis
redis:
  image: redis:7-alpine
  container_name: hestim_redis
  restart: unless-stopped
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  ports:
    - "${REDIS_PORT:-6379}:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - hestim_net

# backend — Ajouter dépendance Redis
backend:
  environment:
    REDIS_HOST: redis
    REDIS_PORT: 6379
  depends_on:
    mysql:
      condition: service_healthy
    redis:
      condition: service_healthy
```

**Backend — config/redis.js :**

```javascript
import { createClient } from 'redis';

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis connecté'));

await client.connect();

export default client;
```

**Backend — middleware/rateLimiterMiddleware.js :**

```javascript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from '../config/redis.js';

// Rate limiter global
const globalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_global',
  points: 500,       // Requêtes
  duration: 900,     // Par 15 min
});

// Rate limiter auth (plus strict)
const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_auth',
  points: 10,        // 10 tentatives
  duration: 900,     // Par 15 min
  blockDuration: 900, // Bloqué 15 min après dépassement
});

export const apiRateLimiter = async (req, res, next) => {
  try {
    await globalLimiter.consume(req.ip);
    next();
  } catch (err) {
    const retryAfter = Math.ceil(err.msBeforeNext / 1000);
    res.set('Retry-After', retryAfter);
    res.set('X-RateLimit-Limit', 500);
    res.set('X-RateLimit-Remaining', 0);
    res.status(429).json({
      message: 'Trop de requêtes. Réessayez dans quelques minutes.',
      retryAfter,
    });
  }
};

export const authRateLimiter = async (req, res, next) => {
  try {
    await authLimiter.consume(req.ip);
    next();
  } catch (err) {
    res.status(429).json({
      message: 'Trop de tentatives de connexion. Compte temporairement bloqué.',
      retryAfter: Math.ceil(err.msBeforeNext / 1000),
    });
  }
};
```

**Package à installer :**

```bash
cd backend && npm install rate-limiter-flexible redis
```

---

#### ÉTAPE 1.6 — MySQL Indexes 🗃️

**Impact :** Performance × 10 sur les requêtes fréquentes à partir de 10k affectations  
**Risque :** Très faible — les indexes ne modifient pas le schéma de données

**Backend — models/index.js — Ajouter indexes :**

```javascript
// Après les associations, dans la fonction de sync
// Ou dans un fichier de migration dédié

// Affectation — indexes critiques
await sequelize.query(`
  CREATE INDEX IF NOT EXISTS idx_aff_enseignant
    ON Affectations (id_user_enseignant);
  CREATE INDEX IF NOT EXISTS idx_aff_groupe
    ON Affectations (id_groupe);
  CREATE INDEX IF NOT EXISTS idx_aff_date
    ON Affectations (date_seance);
  CREATE INDEX IF NOT EXISTS idx_aff_statut
    ON Affectations (statut);
  CREATE INDEX IF NOT EXISTS idx_aff_date_ens
    ON Affectations (date_seance, id_user_enseignant);
`);

// Notification — index pour getNonLues
await sequelize.query(`
  CREATE INDEX IF NOT EXISTS idx_notif_user_lu
    ON Notifications (id_user, lu);
`);

// Conflit — index pour getNonResolus
await sequelize.query(`
  CREATE INDEX IF NOT EXISTS idx_conflit_resolu
    ON Conflits (resolu);
`);

// Disponibilite
await sequelize.query(`
  CREATE INDEX IF NOT EXISTS idx_dispo_enseignant
    ON Disponibilites (id_user_enseignant);
`);
```

---

### PHASE 2 — DÉCOUPAGE API & REACT QUERY
**Durée :** 4-6 jours · **Risque :** Faible (migration progressive)

---

#### ÉTAPE 2.1 — Découpage services/api.js

**Règle :** Créer d'abord `api.client.js` (wrapper fetch), puis migrer domaine par domaine

**`frontend/src/services/api.client.js`** :

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur serveur' }));

    // Auto-refresh si token expiré
    if (res.status === 401 && err.code === 'TOKEN_EXPIRED') {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST', credentials: 'include',
      });
      if (refreshRes.ok) return request(endpoint, options);
    }

    const error = new Error(err.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.isConnectionError = res.status === 0;
    throw error;
  }

  return res.json();
}

export const get    = (url, params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  return request(`${url}${qs}`);
};
export const post   = (url, data)   => request(url, { method: 'POST', body: data });
export const put    = (url, data)   => request(url, { method: 'PUT', body: data });
export const patch  = (url, data)   => request(url, { method: 'PATCH', body: data });
export const del    = (url)         => request(url, { method: 'DELETE' });
```

**`frontend/src/services/affectations.api.js`** (exemple de module) :

```javascript
import { get, post, put, del, patch } from './api.client.js';

export const affectationsAPI = {
  getAll:          (params) => get('/affectations', params),
  getById:         (id)     => get(`/affectations/${id}`),
  getByEnseignant: (id, p)  => get(`/affectations/enseignant/${id}`, p),
  getByGroupe:     (id, p)  => get(`/affectations/groupe/${id}`, p),
  create:          (data)   => post('/affectations', data),
  update:          (id, d)  => put(`/affectations/${id}`, d),
  delete:          (id)     => del(`/affectations/${id}`),
  confirmer:       (id)     => patch(`/affectations/${id}/confirmer`),
};
```

**Stratégie de migration :** Garder `api.js` existant intact pendant la migration. Créer les nouveaux modules en parallèle. Migrer page par page. Supprimer `api.js` quand tout est migré.

---

#### ÉTAPE 2.2 — React Query hooks

**`frontend/src/queries/useAffectations.js`** :

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { affectationsAPI } from '../services/affectations.api.js';

// Clés de cache standardisées
export const AFFECTATIONS_KEYS = {
  all:           ['affectations'],
  list:          (params) => ['affectations', 'list', params],
  byEnseignant:  (id, p)  => ['affectations', 'enseignant', id, p],
  byGroupe:      (id, p)  => ['affectations', 'groupe', id, p],
  detail:        (id)     => ['affectations', id],
};

// Hook liste paginée
export function useAffectations(params) {
  return useQuery({
    queryKey: AFFECTATIONS_KEYS.list(params),
    queryFn:  () => affectationsAPI.getAll(params),
    staleTime: 30_000, // 30s avant refetch automatique
    select: (data) => ({ items: data.data, pagination: data.pagination }),
  });
}

// Hook création
export function useCreateAffectation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: affectationsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.all });
    },
  });
}

// Hook suppression
export function useDeleteAffectation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: affectationsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.all });
    },
  });
}
```

**Migration d'une page (avant/après) :**

```javascript
// AVANT — Salles.jsx
const [salles, setSalles] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const data = await salleAPI.getAll({ page: page + 1, limit: rowsPerPage });
      setSalles(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };
  load();
}, [page, rowsPerPage]);

// APRÈS — Salles.jsx avec React Query
const { data, isLoading, isError } = useSalles({ page: page + 1, limit: rowsPerPage });
const salles = data?.items || [];
const total  = data?.pagination?.total || 0;
// loading = isLoading, error = isError — automatique
// Cache automatique, retry automatique, invalidation après mutation
```

---

#### ÉTAPE 2.3 — Toast centralisé

**Problème actuel :** Chaque page a son propre `Snackbar` + `useState([error, success])` = 100+ lignes dupliquées

**`frontend/src/contexts/ToastContext.jsx`** :

```javascript
import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, severity = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, severity, duration }]);
  }, []);

  const hide = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), warning: (m) => show(m, 'warning'), info: (m) => show(m, 'info') }}>
      {children}
      {toasts.map(toast => (
        <Snackbar key={toast.id} open autoHideDuration={toast.duration}
          onClose={() => hide(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={toast.severity} onClose={() => hide(toast.id)} variant="filled">
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

**Usage dans les pages (après migration) :**

```javascript
// AVANT (100+ lignes error/success state dans chaque page)
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
// ... Snackbar JSX dans chaque page

// APRÈS (2 lignes)
const toast = useToast();
// ...
toast.success('Salle créée avec succès');
toast.error('Erreur lors de la suppression');
```

---

### PHASE 3 — LOGGING & OBSERVABILITÉ
**Durée :** 1-2 jours · **Risque :** Très faible

#### ÉTAPE 3.1 — Winston Structured Logging

**Package :** `npm install winston` (backend)

**`backend/utils/logger.js`** :

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export default logger;
```

**Remplacer `console.error` / `console.log` dans server.js et controllers :**

```javascript
// AVANT
console.error('Erreur lors de la synchronisation:', error);

// APRÈS
logger.error('DB sync error', { error: error.message, stack: error.stack });
```

---

### PHASE 4 — QUALITÉ CODE
**Durée :** 1-2 jours · **Risque :** Très faible

#### ÉTAPE 4.1 — Supprimer dead code

```bash
# Supprimer les fichiers non utilisés
rm frontend/src/components/common/Buton.jsx
rm frontend/src/components/common/Input.jsx
rm frontend/src/components/common/Checkbox.jsx
```

Vérifier qu'aucune page ne les importe :
```bash
grep -r "from.*Buton\|from.*Input\|from.*Checkbox" frontend/src/pages/
```

#### ÉTAPE 4.2 — Sécurité headers manquants

**`backend/middleware/securityMiddleware.js`** — Ajouter :

```javascript
// Ajouter aux headers de sécurité
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

#### ÉTAPE 4.3 — Mot de passe default import bulk

**`backend/controllers/userController.js`** :

```javascript
// AVANT
password: row.password?.trim() || 'password123'

// APRÈS
const tempPassword = crypto.randomBytes(8).toString('hex');
// sendWelcomeEmail(row.email, tempPassword)  — à activer avec Nodemailer
password: row.password?.trim() || tempPassword
```

#### ÉTAPE 4.4 — Unifier couleur bleue HESTIM

```javascript
// ThemeContext.jsx — couleur PRIMARY déjà : #1a3a8f
// Remplacer dans Connexion.jsx, DashboardLayout.jsx :
// bgcolor: '#001962' → bgcolor: 'primary.main'
// color: '#001962'   → color: 'primary.main'
```

---

### PHASE 5 — MOBILE RESPONSIVENESS
**Durée :** 3 jours · **Risque :** Faible

#### ÉTAPE 5.1 — Pattern Card/Table adaptatif

Pour chaque page de gestion (`Salles`, `Cours`, `Utilisateurs`, etc.) :

```javascript
import { useMediaQuery, useTheme } from '@mui/material';

export default function Salles() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {isMobile ? <SallesMobileCards salles={salles} /> : <SallesTable salles={salles} />}
    </>
  );
}

// Vue mobile — Cards empilées
function SallesMobileCards({ salles }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {salles.map(salle => (
        <Card key={salle.id_salle}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{salle.nom_salle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {salle.type_salle} · Bat. {salle.batiment} · {salle.capacite} places
                </Typography>
              </Box>
              <Chip label={salle.disponible ? 'Disponible' : 'Indisponible'}
                color={salle.disponible ? 'success' : 'default'} size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button size="small" variant="outlined" startIcon={<Edit />}
                onClick={() => handleEdit(salle)} fullWidth>
                Modifier
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<Delete />}
                onClick={() => handleDeleteClick(salle.id_salle)} fullWidth>
                Supprimer
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
```

---

### PHASE 6 — PRÉPARATION MULTI-TENANT (NON BLOQUANT)
**Durée :** 1 jour · **Risque :** Aucun — préparation uniquement, aucune migration de données

#### ÉTAPE 6.1 — Middleware tenant (préparation)

**`backend/middleware/tenantMiddleware.js`** :

```javascript
// Middleware préparé mais NON ACTIVÉ en production actuelle
// Activé quand les colonnes id_institution sont ajoutées
export const tenantMiddleware = (req, res, next) => {
  // Futur : récupérer l'institution depuis le JWT ou subdomain
  // req.tenantId = req.user?.id_institution || 1; // 1 = institution par défaut
  req.tenantId = 1; // Single tenant pour l'instant
  next();
};

// Dans les controllers, quand multi-tenant activé :
// where: { id_institution: req.tenantId, ...autresConditions }
```

#### ÉTAPE 6.2 — Schéma multi-tenant (migration future)

```sql
-- Script à exécuter lors de l'activation multi-tenant
-- À NE PAS EXÉCUTER MAINTENANT — préparation uniquement

CREATE TABLE Institutions (
  id_institution INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  actif BOOLEAN DEFAULT TRUE,
  plan ENUM('gratuit', 'starter', 'pro', 'enterprise') DEFAULT 'gratuit',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ajouter colonne sur les tables racines (future migration Sequelize)
ALTER TABLE Users   ADD COLUMN id_institution INT DEFAULT 1;
ALTER TABLE Filiere ADD COLUMN id_institution INT DEFAULT 1;
ALTER TABLE Salle   ADD COLUMN id_institution INT DEFAULT 1;
ALTER TABLE Creneau ADD COLUMN id_institution INT DEFAULT 1;

-- Index composites pour isolation parfaite
CREATE INDEX idx_users_institution   ON Users(id_institution, email);
CREATE INDEX idx_filiere_institution ON Filiere(id_institution);
CREATE INDEX idx_salle_institution   ON Salles(id_institution);
```

---

## 4. FLUX FRONTEND → BACKEND

### 4.1 Flux authentification (nouvelle architecture)

```
Utilisateur        Frontend (React)          Backend (Express)
    │                     │                        │
    │── /connexion ───────►│                        │
    │                     │── POST /api/auth/login ─►│
    │                     │                        │── valider credentials
    │                     │                        │── générer access_token (15m)
    │                     │                        │── générer refresh_token (7j)
    │                     │◄── Set-Cookie: access_token (httpOnly) ──│
    │                     │◄── Set-Cookie: refresh_token (httpOnly) ─│
    │                     │◄── { user: {...} } ─────│
    │◄─ Dashboard ────────│                        │
    │                     │                        │
    │── Action API ───────►│                        │
    │                     │── GET /api/affectations ──────────────────►│
    │                     │   (Cookie: access_token envoyé automatiquement)
    │                     │                        │── vérifier cookie
    │                     │◄── { data, pagination }│
    │◄─ Données ──────────│                        │
    │                     │                        │
    │── [Token expiré] ───►│                        │
    │                     │── GET /api/salles ────────────────────────►│
    │                     │◄── 401 TOKEN_EXPIRED ──│
    │                     │── POST /api/auth/refresh ──────────────────►│
    │                     │◄── Set-Cookie: access_token (nouveau) ─────│
    │                     │── GET /api/salles (retry) ─────────────────►│
    │                     │◄── { data } ───────────│
```

### 4.2 Flux React Query

```
Page (Salles.jsx)
    │
    │── useSalles({ page: 1, limit: 10 })
    │       │
    │       ▼
    │   React Query Cache
    │   ├── Cache hit? → retourne données en <1ms
    │   └── Cache miss ou stale (> 30s)?
    │           │
    │           ▼
    │       sallesAPI.getAll({ page: 1, limit: 10 })
    │           │
    │           ▼
    │       GET /api/salles?page=1&limit=10
    │           │
    │           ▼
    │       { data: [...], pagination: {...} }
    │           │
    │       Cache mis à jour
    │           │
    │   ← données retournées
    │
    │── useCreateSalle().mutate(data)
    │       │
    │       ▼
    │   POST /api/salles
    │       │
    │   onSuccess: invalidateQueries(['salles'])
    │       │
    │   React Query refetch automatique
    │   → table mise à jour sans reload page
```

---

## 5. OPTIMISATIONS

### 5.1 Bundle analysis après optimisations

```
AVANT:
index.js   2,109 kB (637 kB gzip)
LCP: ~3.2s | FCP: ~2.8s | Lighthouse: ~50

APRÈS code splitting + imports dynamiques:
chunk-core.js         ~180 kB (55 kB)   — React + Router + MUI core
chunk-dashboard.js    ~140 kB (45 kB)   — Recharts + dashboard
chunk-gestion.js      ~90 kB  (28 kB)   — Tables + forms (chargé si admin)
chunk-calendar.js     ~120 kB (40 kB)   — FullCalendar (chargé si emploi-du-temps)
chunk-export.js       ~200 kB (65 kB)   — jsPDF + XLSX (chargé on-demand)
Initial bundle:       ~180 kB (55 kB gzip)

LCP: ~1.1s | FCP: ~0.9s | Lighthouse: ~85
Amélioration: -65% bundle initial, -66% LCP
```

### 5.2 Queries React Query — Optimisations

```javascript
// main.jsx — Configuration QueryClient optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30s avant refetch automatique
      gcTime: 5 * 60 * 1000,       // 5min avant garbage collect
      retry: (failureCount, error) => {
        // Ne pas retenter les erreurs 401, 403, 404
        if ([401, 403, 404].includes(error.status)) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,  // Éviter refetch inutile au focus
    },
    mutations: {
      onError: (error) => {
        // Gestion globale des erreurs de mutation
        console.error('[Mutation error]', error.message);
      },
    },
  },
});
```

### 5.3 Backend — Query optimization

```javascript
// affectationController.js — Optimiser les includes
// Charger uniquement les champs nécessaires dans les listes
const affectations = await Affectation.findAll({
  attributes: ['id_affectation', 'date_seance', 'statut'],  // Seulement les champs utiles
  include: [
    { model: Cours, attributes: ['nom_cours', 'type_cours'] },
    { model: Groupe, attributes: ['nom_groupe'] },
    { model: Salle, attributes: ['nom_salle'] },
    { model: Creneau, attributes: ['jour_semaine', 'heure_debut', 'heure_fin'] },
    { model: Users, as: 'enseignant', attributes: ['nom', 'prenom'] },
  ],
  where: whereConditions,
  order: [['date_seance', 'DESC']],
  limit,
  offset,
});
```

---

## 6. RISQUES & MITIGATIONS

### 6.1 Risques d'implémentation

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Cookie httpOnly bloque Playwright tests | Élevé | Haute | Garder fallback Bearer header en dev, activer cookie seulement en prod (`NODE_ENV=production`) |
| React.lazy() breaking SSR | Faible | Faible | Projet SPA uniquement, pas de SSR — risque inexistant |
| Redis indisponible → rate limiter cassé | Critique | Faible | `try/catch` autour du rate limiter, fallback gracieux (passer sans bloquer) |
| Migration React Query → regression | Élevé | Moyenne | Migrer page par page, tests Playwright avant/après chaque migration |
| Indexes MySQL → ralentissement pendant création | Faible | Faible | Créer indexes avec `IF NOT EXISTS` au démarrage, ou migration offline |
| Winston logs → disk full | Faible | Faible | `maxsize` + `maxFiles` configurés dans le transport file |
| Multi-tenant préparation → modèles incomplets | Aucun | N/A | Préparation uniquement, aucune DB change dans cette phase |

### 6.2 Plan de rollback

```
Phase 1 (code splitting) :
  Rollback : supprimer lazy() → imports synchrones — 30 min

Phase 1 (JWT cookies) :
  Rollback DIFFICILE — impacte auth globale
  Stratégie : feature flag NODE_ENV, garder bearer header comme fallback
  Ne déployer qu'après validation complète en staging

Phase 1 (Redis) :
  Rollback : désactiver Redis, revenir à in-memory — 1h
  Docker Compose : commenter le service redis

Phase 2 (React Query) :
  Rollback : revenir à useEffect manuels (garder ancien code en commentaire)
  Migration progressive → rollback page par page si nécessaire
```

---

## 7. CHECKLIST FINALE

### Avant de commencer

- [ ] Créer une branche `refactor/architecture-2026` depuis `main`
- [ ] S'assurer que tous les tests Playwright passent sur `main`
- [ ] Prendre un snapshot Docker de la version actuelle
- [ ] Documenter l'état actuel des bundles (`npm run build` → noter la taille)

### Phase 1 — Critique

- [ ] **1.1** `React.lazy()` + `Suspense` sur toutes les routes (`App.jsx`)
- [ ] **1.1** `PageSkeleton.jsx` créé
- [ ] **1.1** `ErrorBoundary.jsx` créé et wrappé autour de `<BrowserRouter>`
- [ ] **1.1** `NotFoundPage.jsx` créé, route `*` ajoutée
- [ ] **1.2** Import dynamique `exportToExcel` sur click uniquement
- [ ] **1.2** Import dynamique `exportToPDF` sur click uniquement
- [ ] **1.3** `chart.js` supprimé de `package.json`
- [ ] **1.3** Aucun import Chart.js restant (vérification grep)
- [ ] **1.4** `cookie-parser` installé backend
- [ ] **1.4** `JWT_REFRESH_SECRET` dans `.env.docker.example`
- [ ] **1.4** Endpoint `POST /api/auth/refresh` créé et testé
- [ ] **1.4** Login envoie httpOnly cookies
- [ ] **1.4** Logout clear les deux cookies
- [ ] **1.4** `authMiddleware.js` lit cookie ET header (fallback)
- [ ] **1.4** `credentials: 'include'` dans `api.client.js`
- [ ] **1.4** Auto-refresh sur `TOKEN_EXPIRED` dans `api.client.js`
- [ ] **1.4** `AuthContext.jsx` ne stocke plus le token en `localStorage`
- [ ] **1.5** Redis dans `docker-compose.yml`
- [ ] **1.5** `rate-limiter-flexible` + `redis` installés backend
- [ ] **1.5** `config/redis.js` créé
- [ ] **1.5** `rateLimiterMiddleware.js` utilise Redis
- [ ] **1.5** Fallback gracieux si Redis indisponible
- [ ] **1.6** 8 indexes MySQL ajoutés (via `CREATE INDEX IF NOT EXISTS`)
- [ ] **1.6** Indexes vérifiés (`SHOW INDEX FROM Affectations`)

### Phase 2 — Services & React Query

- [ ] **2.1** `api.client.js` créé (fetch wrapper)
- [ ] **2.1** `affectations.api.js` créé et testé
- [ ] **2.1** `conflits.api.js` créé
- [ ] **2.1** `statistiques.api.js` créé
- [ ] **2.1** `auth.api.js` créé
- [ ] **2.1** `users.api.js` créé
- [ ] **2.1** [Autres domaines migrés...]
- [ ] **2.1** `api.js` original supprimé (quand toutes pages migrées)
- [ ] **2.2** `useAffectations.js` query hook créé
- [ ] **2.2** `useConflits.js` query hook créé
- [ ] **2.2** `useStatistiques.js` query hook créé
- [ ] **2.2** `useNotifications.js` query hook créé
- [ ] **2.2** [Pages migrées page par page...]
- [ ] **2.3** `ToastContext.jsx` créé
- [ ] **2.3** `ToastProvider` dans `main.jsx`
- [ ] **2.3** `useToast()` remplace `useState([error, success])` dans pages
- [ ] **2.3** Snackbar JSX supprimé des pages individuelles

### Phase 3 — Observabilité

- [ ] **3.1** `winston` installé backend
- [ ] **3.1** `utils/logger.js` créé
- [ ] **3.1** `console.error` remplacé par `logger.error` dans server.js
- [ ] **3.1** `console.log` remplacé dans controllers critiques
- [ ] **3.1** `logs/` ajouté à `.dockerignore`
- [ ] **3.1** Volume `logs_data` dans `docker-compose.yml` (optionnel)

### Phase 4 — Code quality

- [ ] **4.1** `Buton.jsx`, `Input.jsx`, `Checkbox.jsx` supprimés
- [ ] **4.1** Aucun import de ces fichiers restant
- [ ] **4.2** `Strict-Transport-Security` header ajouté
- [ ] **4.2** `Referrer-Policy` header ajouté
- [ ] **4.2** `Permissions-Policy` header ajouté
- [ ] **4.3** Mot de passe `'password123'` remplacé par génération aléatoire
- [ ] **4.4** `bgcolor: '#001962'` remplacé par `bgcolor: 'primary.main'`

### Phase 5 — Mobile

- [ ] **5.1** `useMediaQuery` hook utilisé dans les pages de gestion
- [ ] **5.1** Vue Card mobile pour Salles
- [ ] **5.1** Vue Card mobile pour Cours
- [ ] **5.1** Vue Card mobile pour Utilisateurs
- [ ] **5.1** Vue Card mobile pour Enseignants
- [ ] **5.1** [Autres pages...]

### Phase 6 — Multi-tenant

- [ ] **6.1** `tenantMiddleware.js` créé (non activé)
- [ ] **6.2** Migration SQL documentée (non exécutée)
- [ ] **6.2** `Institutions` table schema documenté

### Validation finale

- [ ] `npm run build` → bundle initial < 200 kB gzip
- [ ] Playwright : 65+ tests passants
- [ ] Lighthouse Performance > 80
- [ ] `docker compose --env-file .env.docker up -d` → 3 containers healthy
- [ ] Login fonctionne (vérifier cookie dans DevTools → Application → Cookies)
- [ ] Refresh token fonctionne (expirer manuellement l'access_token)
- [ ] Rate limiter Redis actif (vérifier `redis-cli monitor`)
- [ ] `SHOW INDEX FROM Affectations` → 5+ indexes présents
- [ ] Mobile : tester sur viewport 375px
- [ ] Dark mode : vérifier contraste sur les nouvelles pages

---

## CONCLUSION

Cette architecture respecte l'existant tout en le faisant évoluer vers un niveau production réel. Les changements sont **progressifs, réversibles et non-breaking**. La migration peut se faire par phases indépendantes sans bloquer les déploiements courants.

**Ordre d'implémentation recommandé :**
1. `React.lazy()` + suppression Chart.js → gains immédiats sans risque
2. Indexes MySQL → gains immédiats sans risque
3. Redis rate limiter → infrastructure, pas de breaking change
4. JWT httpOnly → le plus risqué, à faire en dernier de la phase critique après staging
5. React Query migration → progressive, page par page

---

*Plan d'architecture — HESTIM Planner — Mai 2026*
