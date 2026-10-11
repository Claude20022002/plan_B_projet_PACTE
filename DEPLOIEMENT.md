# Guide de déploiement — HESTIM Planner

Deux parties. La première décrit le **serveur de production** (le VPS de `planner.finadmintech.fr`) : mise à jour, changement de dépendances, retour arrière. La seconde, à partir de « Comparatif des plateformes », décrit l'hébergement gratuit d'origine (Railway et Vercel).

## Serveur de production : mise à jour et retour arrière

Toutes les commandes du serveur se lancent en `root`. Le chef de projet les lance lui-même. Les scripts sont dans `deploy/vps/` ; chacun explique son rôle dans son en-tête.

### Mettre à jour par paquet

Un paquet `majNN` ne contient que le code. Il se superpose aux images déjà en ligne.

1. **Sur le PC, construire le site depuis PowerShell** (Git Bash réécrirait `/api` en chemin Windows) :
   `cd frontend; $env:VITE_API_URL="/api"; npm run build`
2. **Préparer le paquet**, dans Git Bash, depuis la racine du dépôt : `bash deploy/vps/preparer-maj.sh majNN`. Ajouter `--classquiz` ou `--studylib` si le quiz ou la bibliothèque ont changé (leurs constructions préalables sont dans l'en-tête du script).
3. **Vérifier le fichier `VERSION` du paquet** : le commit attendu, et aucune ligne de fichier non commité, pour aucun des dépôts.
4. **Copier `deploy/vps/paquets/majNN.tar.gz` dans `/root`** du serveur, puis :
   `cd /root && tar -xzf majNN.tar.gz && bash majNN/deploy-vps/appliquer-maj.sh /root/majNN`
5. **Lire les contrôles** affichés à la fin, puis dérouler la recette (`docs/recette/scenarios-de-test.md`), en commençant par la section 0.

`appliquer-maj.sh` fait dans l'ordre : contrôle des dépendances, sauvegarde de la base dans `/root/sauvegardes`, étiquette `avant-<date>` sur les images en service, superposition, redémarrage du backend (qui applique ses migrations), puis du site, rechargement de l'aiguillage Caddy s'il a changé. Il affiche à la fin les commandes de retour arrière **avec la date du jour déjà remplie** : les copier avant de fermer le terminal.

### Corriger le moteur de quiz seul

Pour un correctif du moteur (le code Python de `../ClassQuiz`) qui ne doit pas attendre la prochaine mise à jour de Planner. Le paquet ne contient ni Planner, ni le site du quiz, ni migration : la base n'est pas touchée.

1. **Sur le PC**, dans Git Bash, depuis la racine du dépôt, le correctif étant commité dans `../ClassQuiz` :
   `bash deploy/vps/preparer-maj.sh quiz-correctifN --quiz-seul`
2. **Vérifier le fichier `VERSION`** affiché : le commit du quiz attendu, aucune ligne de fichier non commité.
3. **Copier `deploy/vps/paquets/quiz-correctifN.tar.gz` dans `/root`** du serveur, puis, hors des heures de cours (les parties en cours sont coupées) :
   `cd /root && tar -xzf quiz-correctifN.tar.gz && bash quiz-correctifN/deploy-vps/appliquer-quiz.sh /root/quiz-correctifN`
4. **Lire les contrôles**, copier la commande de retour arrière affichée, puis jouer une partie d'essai.

Si les dépendances Python du quiz (`Pipfile`) ont changé, ce paquet ne suffit pas : il faut une nouvelle image de l'API.

### Quand les dépendances changent

La superposition ne met pas à jour les modules npm du backend. Si `backend/package-lock.json` demande un module absent de l'image, `preparer-maj.sh` puis `appliquer-maj.sh` **s'arrêtent avec la liste des modules en cause**, avant d'avoir rien modifié. Il faut alors une nouvelle image.

1. **Sur le PC, reconstruire l'image**, depuis la racine du dépôt :
   `docker build -t claude20022002/hestim-backend:latest --build-context shared=./shared ./backend`
2. **L'enregistrer** : `docker save claude20022002/hestim-backend:latest | gzip > deploy/vps/paquets/hestim-backend-majNN.tar.gz`, puis la copier dans `/root` du serveur.
3. **Sur le serveur, garder l'ancienne image sous une étiquette à part, avant de charger la nouvelle** :
   `docker tag claude20022002/hestim-backend:latest claude20022002/hestim-backend:avant-image-majNN`
   Sans cela, l'étiquette `avant-<date>` posée ensuite par `appliquer-maj.sh` désignerait déjà la nouvelle image, et le retour arrière ne serait plus possible.
4. **Charger la nouvelle** : `gunzip -c /root/hestim-backend-majNN.tar.gz | docker load`
5. **Appliquer le paquet** comme d'habitude. Le contrôle des dépendances doit maintenant répondre « identiques à celles de l'image ».

### Revenir en arrière

Dans `/opt/hestim`, avec `COMPOSE` pour `docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml`, et `<date>` pour la date affichée par `appliquer-maj.sh`.

**Cas 1, le code seul** (aucune migration appliquée par la mise à jour) :

```bash
docker tag claude20022002/hestim-backend:avant-<date> claude20022002/hestim-backend:latest
docker tag claude20022002/hestim-frontend:avant-<date> claude20022002/hestim-frontend:latest
$COMPOSE up -d --no-deps backend frontend
```

Si une nouvelle image avait été chargée (« Quand les dépendances changent »), l'étiquette du backend à reprendre est `avant-image-majNN`, pas `avant-<date>`.

**Cas 2, la mise à jour a appliqué une migration.** L'ancien code ne connaît pas le nouveau schéma, et tout ce qui a été saisi depuis la mise à jour sera perdu : décider vite. Savoir si une migration a été appliquée : le journal du backend le dit à son démarrage (`docker logs hestim_backend | grep -i migration`).

```bash
# 1. Arrêter le backend : plus aucune écriture pendant la restauration
$COMPOSE stop backend
# 2. Mettre de côté l'état actuel, au cas où
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' | gzip > /root/sauvegardes/hestim-avant-retour.sql.gz
# 3. Repartir d'une base vide : les tables créées par la migration disparaissent avec elle
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "DROP DATABASE \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\`"'
# 4. Restaurer la sauvegarde faite par appliquer-maj.sh
gunzip -c /root/sauvegardes/hestim-<date>.sql.gz | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"'
# 5. Remettre les anciennes images (cas 1), ce qui redémarre le backend
```

Restaurer sans vider la base (sans l'étape 3) laisserait en place les tables de la migration : le paquet suivant échouerait en voulant les recréer.

**Le reste, seulement si le paquet le contenait :**

| Élément | Retour |
|---|---|
| Site du quiz | étiquette `avant-<date>` de `hestim-classquiz-frontend`, puis `$COMPOSE up -d --no-deps quiz-frontend` |
| Moteur du quiz | étiquette `avant-<date>` de `hestim-classquiz-api`, puis `$COMPOSE up -d --no-deps quiz-api quiz-worker` |
| Bibliothèque | étiquette `avant-<date>` de `hestim-studylib`, puis `$COMPOSE up -d --no-deps studylib studylib-queue studylib-scheduler` ; sa base : `/root/sauvegardes/studylib-<date>.sql.gz`, à restaurer comme au cas 2 |
| Aiguillage Caddy | `cp deploy/vps/Caddyfile.vps.avant-<date> deploy/vps/Caddyfile.vps` (toujours `cp`, jamais `mv`), puis `docker exec hestim_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile` |

**Après un retour arrière** : relancer les contrôles de la recette (section 0), et noter dans le journal du groupe A la date, le paquet et la raison.

### Sauvegarde quotidienne

`appliquer-maj.sh` ne sauvegarde la base qu'au moment d'une mise à jour, et sur le serveur lui-même. `deploy/vps/sauvegarder.sh` le fait chaque nuit et **sort les sauvegardes du serveur** : il exporte les bases MySQL (Planner et la bibliothèque) et la base du quiz, les chiffre, les envoie avec `rclone`, et garde 14 jours des deux côtés. Il ne sauvegarde pas les fichiers (documents de la bibliothèque, images des quiz).

**Mise en place, une fois, en `root` :**

1. Installer les deux outils : `apt install rclone gnupg`.
2. Déclarer la destination hors du serveur : `rclone config` (un autre serveur en SFTP, un stockage objet ou un Drive ; `rclone` connaît les trois). Noter le nom donné, par exemple `hors-site`.
3. Créer la phrase de chiffrement, lisible par `root` seul :
   `openssl rand -base64 48 > /root/hestim-sauvegarde.cle && chmod 600 /root/hestim-sauvegarde.cle`
   **La copier aussi ailleurs que sur le serveur** (coffre de mots de passe du chef de projet). Sans elle, aucune sauvegarde ne se relit ; si elle n'existe que sur le serveur, elle disparaît avec lui.
4. Écrire `/root/hestim-sauvegarde.conf` (`chmod 600`) :

   ```bash
   PHRASE=/root/hestim-sauvegarde.cle
   DESTINATION=hors-site:hestim-sauvegardes
   ```

5. Lancer une première fois à la main et lire la sortie : `bash /opt/hestim/deploy/vps/sauvegarder.sh ; echo "code $?"`. Attendu : deux lignes « ok », « envoyé vers … », code 0.
6. Programmer la tâche (`crontab -e`) :
   `15 2 * * * bash /opt/hestim/deploy/vps/sauvegarder.sh >> /var/log/hestim-sauvegarde.log 2>&1`

**Lire le résultat.** Code 0 : tout est fait. Code 1 : un export a échoué (le journal dit lequel). Code 3 : les sauvegardes sont faites mais **ne sont pas sorties du serveur**. Regarder `/var/log/hestim-sauvegarde.log` chaque semaine : une sauvegarde que personne ne regarde finit par ne plus se faire.

**Restaurer.** Récupérer le fichier voulu (`rclone copy hors-site:hestim-sauvegardes/mysql-<date>.sql.gz.gpg /root/`), puis :

```bash
# Bases MySQL (Planner et bibliothèque). L'export recrée chaque base si elle manque.
gpg --batch --pinentry-mode loopback --passphrase-file /root/hestim-sauvegarde.cle -d /root/mysql-<date>.sql.gz.gpg \
  | gunzip | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'

# Base du quiz, dans une base vide
gpg --batch --pinentry-mode loopback --passphrase-file /root/hestim-sauvegarde.cle -d /root/quiz-<date>.sql.gz.gpg \
  | gunzip | docker exec -i hestim_quiz_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q'
```

Sur un serveur neuf, ces commandes suffisent. **Sur un serveur qui a déjà ses bases, arrêter d'abord le backend, la bibliothèque et le quiz, puis vider chaque base à restaurer** (étapes 1 à 3 du cas 2 ci-dessus) : restaurer par-dessus laisserait en place les tables créées depuis la sauvegarde. L'export ne contient ni les comptes ni les réglages de MySQL : les mots de passe du serveur qui reçoit la restauration ne changent pas.

### Faire de la place

Chaque mise à jour laisse une archive, un dossier extrait et des images `avant-<date>`. `nettoyer-paquets.sh` garde les 3 derniers. Sans option, il montre ce qu'il supprimerait ; il ne supprime qu'avec `--supprimer` :

```bash
bash /opt/hestim/deploy/vps/nettoyer-paquets.sh /root
bash /opt/hestim/deploy/vps/nettoyer-paquets.sh /root --supprimer
```

Il ne touche ni aux sauvegardes de la base (`/root/sauvegardes`), ni aux images `avant-image-majNN`, ni aux archives d'images. À ne lancer qu'une fois la mise à jour en cours validée par la recette : les paquets et images supprimés sont ceux qui permettraient un retour plus ancien.

---

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
- [ ] Mots de passe de démonstration remplacés (`deploy/vps/mots-de-passe-demo.mjs`), puis contrôle : `deploy/vps/verifier-mots-de-passe-demo.mjs` se termine par « OK »
- [ ] Test de connexion admin avec le mot de passe écrit par ce script (plus jamais `password123`)

---

*Guide rédigé pour HESTIM Planner — Mai 2026*
