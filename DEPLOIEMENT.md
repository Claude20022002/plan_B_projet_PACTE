# Guide de déploiement gratuit — HESTIM Planner

## Comparatif des plateformes

| Critère | Railway | Render | Fly.io |
|---|---|---|---|
| MySQL natif | ✅ plugin | ❌ (PostgreSQL only free) | ⚠️ via machine |
| Déploiement auto GitHub | ✅ sans config | ✅ | ❌ CLI requis |
| Free tier | $5/mois credit | Limité (sleep 15min) | 3 VMs partagées |
| Simplicité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| CB requise | Non (hobby) | Non | Oui |

**→ Recommandation : Railway (backend + DB) + Vercel (frontend)**

- **Railway** : héberge l'API Express et la base MySQL — auto-deploy sur push, panel visuel, logs intégrés.
- **Vercel** : héberge l'app React — CDN mondial, HTTPS automatique, zéro config.
- **Coût total** : 0 € dans les limites du free tier.

---

## Architecture cible

```
┌─────────────────────┐      HTTPS       ┌─────────────────────────┐
│   Vercel (frontend) │ ──────────────── │  Railway (backend API)  │
│   React + Vite SPA  │  /api/* → proxy  │  Node.js / Express      │
│   CDN mondial       │                  │  Port 5000              │
└─────────────────────┘                  └──────────┬──────────────┘
                                                    │ TCP 3306
                                         ┌──────────▼──────────────┐
                                         │  Railway MySQL Plugin   │
                                         │  MySQL 8.0              │
                                         └─────────────────────────┘
```

---

## Étape 1 — Préparer le backend pour Railway

### 1.1 Créer un compte Railway

1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Sélectionner **Hobby Plan** (gratuit, $5 de crédit/mois)

### 1.2 Créer le projet Railway

1. Cliquer **New Project**
2. Sélectionner **Deploy from GitHub repo**
3. Autoriser Railway à accéder au dépôt `plan_B_projet_PACTE`
4. Choisir le repo → Railway détecte automatiquement Node.js

### 1.3 Configurer le service backend

Dans les paramètres du service :

- **Root Directory** : `backend`
- **Build Command** : `npm install`
- **Start Command** : `node server.js`
- **Watch Paths** : `backend/**`

### 1.4 Ajouter le plugin MySQL

1. Dans le projet Railway, cliquer **+ New**
2. Sélectionner **Database → Add MySQL**
3. Railway crée automatiquement `MYSQL_URL`, `MYSQL_HOST`, `MYSQL_PORT`, etc.

### 1.5 Variables d'environnement du backend

Dans **Variables** du service backend, ajouter :

```env
NODE_ENV=production
PORT=5000

# Base de données — utiliser les valeurs auto-injectées par Railway MySQL
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DIALECT=mysql

# JWT — générer avec :
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=VOTRE_SECRET_FORT_ICI
JWT_EXPIRES_IN=7d

# CORS — sera l'URL Vercel (ajouter après le deploy frontend)
ALLOWED_ORIGINS=https://votre-app.vercel.app

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=VOTRE_APP_PASSWORD_GMAIL
EMAIL_FROM="HESTIM Planner <votre-email@gmail.com>"
```

### 1.6 Premier déploiement et seed

Railway déploie automatiquement sur push. Attendez le deploy vert, puis :

```bash
# Installer Railway CLI localement
npm install -g @railway/cli

# Se connecter
railway login

# Lancer le seed depuis votre machine locale
railway run --service backend node seed.js
```

**URL du backend Railway** : copiez l'URL publique (ex: `https://hestim-backend.up.railway.app`)

---

## Étape 2 — Déployer le frontend sur Vercel

### 2.1 Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer **Add New Project**

### 2.2 Importer le dépôt

1. Sélectionner le repo `plan_B_projet_PACTE`
2. Configurer :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### 2.3 Variable d'environnement Vercel

Dans **Environment Variables** du projet Vercel :

```env
VITE_API_URL=https://hestim-backend.up.railway.app/api
```

> Remplacer par l'URL réelle de votre service Railway.

### 2.4 Déployer

Cliquer **Deploy**. Vercel construit et publie en ~2 minutes.

**URL frontend** (ex: `https://hestim-planner.vercel.app`)

### 2.5 Mettre à jour CORS sur Railway

Retournez dans Railway → Variables du backend, mettez à jour :

```env
ALLOWED_ORIGINS=https://hestim-planner.vercel.app
```

Railway redéploie automatiquement.

---

## Étape 3 — Automatisation CI/CD avec GitHub Actions

Le fichier `.github/workflows/ci-cd.yml` est déjà créé. Il faut configurer les secrets GitHub.

### 3.1 Secrets GitHub requis

Dans votre repo GitHub → **Settings → Secrets → Actions → New repository secret** :

| Secret | Comment l'obtenir |
|---|---|
| `RAILWAY_TOKEN` | Railway Dashboard → Account → Tokens → Create Token |
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General → Project ID |

### 3.2 Fonctionnement du pipeline

```
Push sur main
    │
    ├── Job 1 : Build frontend (npm run build)
    │         └── Upload artifact du dist
    │
    ├── Job 2 : Tests backend (Jest + MySQL de test)
    │
    └── Si les deux passent :
        ├── Job 3 : Deploy backend → Railway (railway up)
        └── Job 4 : Deploy frontend → Vercel (vercel --prod)
```

### 3.3 Visualiser les déploiements

- **GitHub** : onglet **Actions** du repo
- **Railway** : onglet **Deployments** du service
- **Vercel** : onglet **Deployments** du projet

---

## Étape 4 — Domaine personnalisé (optionnel)

### Vercel (frontend)
1. Vercel Project → Settings → Domains
2. Ajouter `planner.hestim.ma`
3. Configurer le CNAME chez votre registrar :
   ```
   planner  CNAME  cname.vercel-dns.com
   ```

### Railway (backend)
1. Railway Service → Settings → Networking → Custom Domain
2. Ajouter `api.hestim.ma`
3. CNAME :
   ```
   api  CNAME  <votre-service>.up.railway.app
   ```

---

## Limites du free tier

| Service | Limite | Dépassement |
|---|---|---|
| Railway | $5/mois de compute | ~500h backend, suffisant pour démo |
| Railway MySQL | 1 Go de données | Suffisant pour des centaines d'utilisateurs |
| Vercel | 100 GB bandwidth/mois | Très largement suffisant |
| Vercel | Builds illimités | — |

> Pour un usage production intensif, Railway Starter = $20/mois.

---

## Commandes utiles

```bash
# Déploiement manuel du backend
cd backend && railway up

# Logs en temps réel
railway logs --service backend

# Ouvrir le dashboard Railway
railway open

# Seed de la base Railway
railway run node seed.js

# Variables d'environnement Railway
railway variables

# Déploiement manuel Vercel
cd frontend && vercel --prod
```

---

## Checklist avant le premier déploiement

- [ ] `JWT_SECRET` généré (64+ caractères aléatoires)
- [ ] `SMTP_PASSWORD` configuré (Google App Password)
- [ ] Plugin MySQL ajouté sur Railway
- [ ] `ALLOWED_ORIGINS` contient l'URL Vercel exacte
- [ ] `VITE_API_URL` contient l'URL Railway exacte
- [ ] Seed lancé après le premier déploiement
- [ ] Secrets GitHub Actions configurés (si CI/CD activé)
- [ ] Test de connexion admin : `admin@hestim.ma` / `password123`

---

*Guide rédigé pour HESTIM Planner — Mai 2026*
