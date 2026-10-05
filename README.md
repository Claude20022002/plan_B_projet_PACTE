# HESTIM Planner

Plateforme de planification des cours et de réservation des salles de l'école HESTIM
(Casablanca, campus Gandhi et Stendhal), avec génération automatique des emplois du temps,
application mobile pour les étudiants et bibliothèque de ressources partagée.

Projet PACTE — cycle ingénieur 3IIIA.

L'interface reprend le langage d'un **panneau des départs de gare** : chaque séance est une ligne
(heure, cours, salle, statut), et un changement (report, annulation, changement de salle) se voit
au premier coup d'œil. Voir [DESIGN.md](DESIGN.md).

---

## Ce que fait la plateforme

| Rôle | Ce qu'il peut faire |
| --- | --- |
| **Étudiant** | Voir sa prochaine séance, sa semaine et l'emploi du temps du mois (format officiel HESTIM, imprimable) ; être prévenu des reports et annulations (web et notifications push) ; laisser un retour anonyme après une séance ; accéder aux supports de ses cours dans la bibliothèque. |
| **Enseignant** | Confirmer ses séances, demander un report, déclarer ses disponibilités et ses vœux, accepter les services proposés, réserver une salle, suivre ses surveillances d'examen et les retours de ses séances. |
| **Responsable de filière** | Préparer le semestre de sa filière : maquette (modules CM / TD / TP), groupes, services des enseignants, revue des conflits. |
| **Administration** | Calendrier (fériés marocains, Ramadan, examens), campus et salles, grilles horaires, génération automatique de l'emploi du temps, imprévus (absences, salles en panne, journées annulées), examens et surveillances, suivi du réalisé et export des heures des vacataires. |

Points clés du métier :

- **Règles de planification** vérifiées à chaque enregistrement : salle, enseignant et groupe jamais
  en double (hiérarchie promotion › TD › TP comprise), capacité et type de salle, disponibilités
  (vacataires : seulement les créneaux déclarés ; permanents : partout sauf indisponibilité),
  trajet entre campus, événements bloquants, heures maximales par jour. Une règle enfreinte renvoie
  la liste des violations ; l'administration peut forcer avec une justification tracée.
- **Génération automatique** par [Timefold Solver](https://timefold.ai/) : la semaine type est
  calculée (créneau et salle de chaque séance), puis déployée sur le semestre en sautant les dates
  bloquées. Chaque génération crée une version que l'on peut réactiver.
- **Connexion unique** : Planner est le fournisseur d'identité. StudyLib (la bibliothèque) et
  l'application mobile vérifient ses jetons avec sa clé publique.

---

## Architecture

```
                 Caddy (HTTPS, seul service exposé)
                              │
          nginx ── /            → frontend React (fichiers statiques)
                ├─ /api/        → backend Planner (Express)
                └─ /biblio/     → StudyLib (Laravel)          fichiers.<domaine> → MinIO (liens signés)

   backend Planner ──(réseau interne, jeton partagé)──► solver (Timefold, Java 21)
         │
       MySQL 8 : une base par service (planner, studylib)      StudyLib : + Redis, MinIO, Meilisearch

   Application mobile (Expo) ──Bearer──► /api (Planner) et /biblio/api (StudyLib)
```

| Composant | Dossier | Technologies |
| --- | --- | --- |
| API Planner | [`backend/`](backend) | Node.js 22, Express 4, Sequelize 6, MySQL 8, migrations Umzug, Jest |
| Site web | [`frontend/`](frontend) | React 19, MUI 7, Vite, i18next (FR / EN), Playwright |
| Service de génération | [`solver/`](solver) | Java 21, Spring Boot 3.3, Timefold Solver 1.15 |
| Application mobile | [`mobile/`](mobile) | Expo SDK 54, expo-router 6, React Native 0.81 |
| Code partagé web / mobile | [`shared/`](shared) | logique des séances, jetons de design, traductions communes |
| Passerelle et déploiement | [`deploy/`](deploy), [`docker-compose.yml`](docker-compose.yml) | Caddy, nginx, Docker Compose |
| Bibliothèque | dépôt voisin `../StudyLib` | Laravel 13, Livewire 4 |

StudyLib vit dans son propre dépôt, à côté de celui-ci (`../StudyLib`) ; `docker-compose.yml` le
construit depuis ce chemin.

---

## Démarrage en local (développement)

### Prérequis

- Node.js 22 et npm
- MySQL 8 (local, ou `docker run -d --name hestim_mysql -e MYSQL_ROOT_PASSWORD=… -p 3306:3306 mysql:8.0`)
- Facultatif : Java 21 et Maven pour le service de génération

### Installation

```bash
npm run install:all                       # dépendances du backend et du frontend
cp backend/.env.example backend/.env      # puis renseigner DB_* (base hestim_planner)
npm run migrate                           # crée le schéma (aussi fait au démarrage du serveur)
npm run seed                              # données de démonstration HESTIM (filières, salles, enseignants, étudiants)
npm run dev                               # backend (nodemon, port 5000) + frontend (Vite, port 5173)
```

Ouvrir <http://localhost:5173>. Sous Windows, `start.bat` fait la même chose.

En développement, sans `JWT_PRIVATE_KEY`, le backend génère une clé éphémère : les sessions
tombent à chaque redémarrage, c'est normal.

### Comptes de démonstration

Créés par `npm run seed`, mot de passe `password123` — **jamais en production** (le seed est
refusé quand `NODE_ENV=production`).

| Rôle | Compte |
| --- | --- |
| Administration | `admin@hestim.ma` |
| Enseignant, étudiant, responsable de filière | affichés à la fin du seed |

### Génération automatique en local

```bash
cd solver
mvn package
SOLVER_TOKEN=<32 caractères au moins> java -jar target/hestim-solver.jar --server.port=8090
```

Puis, dans `backend/.env` : `SOLVER_URL=http://localhost:8090` et le même `SOLVER_TOKEN`.
Sans jeton, le service refuse tout calcul.

### Application mobile

Voir [`mobile/README.md`](mobile/README.md) (Expo, `EXPO_PUBLIC_API_URL`, builds EAS).

---

## Déploiement (Docker)

```bash
cp .env.docker.example .env.docker        # remplir toutes les valeurs (aucune n'a de défaut)
docker compose --env-file .env.docker up -d --build
```

`--env-file` est indispensable : les mots de passe et jetons du fichier compose sont lus à
l'interpolation, et `docker compose` refuse de démarrer s'il en manque un.

Valeurs à préparer (commandes de génération dans [`.env.docker.example`](.env.docker.example)) :

- `SITE_ADDRESS`, `FICHIERS_ADDRESS` : domaines publics (Caddy obtient les certificats) ;
- `JWT_PRIVATE_KEY` : clé RSA des jetons d'accès (3072 bits, sur une ligne) ; `CSRF_SECRET` ;
- `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `STUDYLIB_DB_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_*`, `MEILI_MASTER_KEY` ;
- `SOLVER_TOKEN`, `INTEGRATION_TOKEN` (synchronisation StudyLib), `STUDYLIB_APP_KEY` ;
- `EXPO_ACCESS_TOKEN` (notifications push de l'application mobile).

Premier démarrage : la base StudyLib est créée par [`deploy/mysql-init`](deploy/mysql-init), les
migrations de Planner et de StudyLib s'appliquent au lancement. Les données de démonstration ne
sont jamais chargées en production.

Seuls les ports 80 et 443 (Caddy) sont exposés ; MySQL et l'API ne répondent qu'en local sur
l'hôte, le solveur et StudyLib seulement sur le réseau interne.

---

## Tests

| Composant | Commande | Contenu |
| --- | --- | --- |
| API — intégration | `cd backend && npm run test:integration` | 186 tests sur une vraie base MySQL de test (`*_test`, reconstruite par les migrations) |
| API — unitaires | `cd backend && npm test` | 74 tests |
| Solveur | `cd solver && mvn test` | 14 tests (une vérification par contrainte, résolution complète, sécurité) |
| Mobile | `cd mobile && npm test` | 12 tests jest-expo (logique partagée, client HTTP, normalisation) |
| Site web | `cd frontend && npm test` | parcours Playwright |
| StudyLib | `cd ../StudyLib && php artisan test` | 124 tests |

Les tests d'intégration attendent un MySQL de test, par exemple :
`docker run -d --name hestim_mysql_test -e MYSQL_ROOT_PASSWORD=test_root -e MYSQL_DATABASE=hestim_test -p 3307:3306 mysql:8.0`
(valeurs par défaut de [`backend/tests/integration/setupEnv.js`](backend/tests/integration/setupEnv.js)).

---

## Sécurité

- **Sessions** : jeton d'accès RS256 de 15 minutes en cookie `HttpOnly` / `SameSite=Strict`
  (préfixe `__Host-` en production), jeton de renouvellement à rotation ; un jeton rejoué révoque
  toute la famille de sessions. Clés publiques sur `/api/.well-known/jwks.json`.
- **CSRF** : double soumission signée et liée à la session ; ne concerne pas les clients
  authentifiés par l'en-tête `Authorization` sans cookie (application mobile).
- **Comptes** : pas d'inscription publique ; comptes créés par l'administration avec un lien
  d'invitation, changement de mot de passe obligatoire à la première connexion.
- **Droits** : contrôle par rôle et par filière (un responsable n'agit que sur ses filières).
- **Services internes** : solveur et synchronisation protégés par des jetons dédiés comparés en
  temps constant ; requêtes bornées.
- **Mobile** : jetons dans le trousseau sécurisé du téléphone, HTTPS obligatoire hors développement.
- **Secrets** : jamais versionnés (`.env*`, clés). Seuls les modèles `*.example` le sont.

---

## Documentation

| Document | Contenu |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Système visuel « panneau à volets » (couleurs, typographie, composants) |
| [PRODUCT.md](PRODUCT.md) | Utilisateurs, usages et principes du produit |
| [DEPLOIEMENT.md](DEPLOIEMENT.md) | Comparatif d'hébergements gratuits |
| [docs/api/](docs/api) | Exemples d'appels, collection Postman, guide de test des routes |
| [docs/Planning/](docs/Planning) | Emploi du temps officiel HESTIM de référence (rendu à reproduire) |
| [docs/](docs) | Architecture, base de données, UML, maquettes, rapports |
| [mobile/README.md](mobile/README.md) | Application mobile : développement, builds, sécurité |

---

## Feuille de route

| Phase | Contenu | État |
| --- | --- | --- |
| A | Fondations : migrations versionnées, retrait du multi-tenant et d'Electron | ✅ |
| P | Modèle HESTIM : campus, calendrier marocain, grilles, maquette CM/TD/TP, groupes emboîtés, enseignants et services | ✅ |
| B | Règles de planification, refus motivé et forçage tracé, reports, invitations | ✅ |
| P4–P7 | Préparation du semestre, réservations, examens, imprévus, suivi du réalisé, retours de séance | ✅ |
| E | Génération automatique (Timefold) | ✅ |
| C | Connexion unique et intégration de StudyLib, passerelle HTTPS | ✅ |
| D | Application mobile étudiant, notifications push | ✅ (essais sur téléphone à faire) |
| F | Import des cours depuis Google Drive, avis de stage avec consentement | à faire |
| Q | Jeux pédagogiques en classe (ClassQuiz) | à faire |
| I | Appel par QR code, révisions espacées, exercices de code auto-corrigés | à faire |
| G | Nettoyage du frontend, intégration continue, documentation de déploiement | à faire |

---

## Organisation du dépôt

- Une branche par phase (`feature/phase-…`), fusionnée dans `main` par pull request.
- Chaque correction du backend s'accompagne d'un test d'intégration.
- Composants open source utilisés : Timefold Solver (Apache 2.0), Expo, React, Laravel ;
  éléments graphiques Kenney (CC0) prévus pour les jeux.

Licence : à définir par l'équipe projet.
