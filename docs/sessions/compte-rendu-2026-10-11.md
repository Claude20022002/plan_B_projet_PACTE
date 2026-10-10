# Compte rendu des sessions du 10 et 11 octobre 2026

À lire en début de prochaine session, avant tout travail. Il remplace `compte-rendu-2026-10-10.md` pour l'état du projet.

**Deux processus vont travailler en parallèle.** Le chef de projet dit à chacun son groupe en début de session : **groupe A (socle)** ou **groupe B (interface)**. Chaque groupe ne lit que sa colonne du § 5 et respecte les règles du § 4. Le processus qui a écrit ce compte rendu était dans le groupe B.

## 1. Où en est-on

| Élément | État |
|---|---|
| Production | **maj27**, à la connaissance de ce compte rendu. Aucun déploiement n'a été confirmé pendant ces deux jours : **à vérifier auprès du chef de projet**. |
| Branche de Planner | `feature/phase-e-timefold`, alignée sur `origin`, **41 commits d'avance sur `main`**, dernier commit `1629355`. |
| Fichiers non commités dans Planner | `docs/plans/assainissement.md` et `docs/plans/remarques-par-profil.md` (nouveaux), et ce compte rendu. |
| Dépôt du quiz (`../ClassQuiz`) | Dernier commit `5916cba5`. 1 fichier non commité : `frontend/static/site.webmanifest` (nom « PlannerQuiz »). |
| Dépôt StudyLib (`../StudyLib`) | Dernier commit `090ccce`. **11 fichiers non commités** : espace de l'enseignant (pas d'événements, projets en mode « proposer », types Exercice et Article) et un test. Les 156 tests passaient avec ces fichiers. |
| Paquet maj29 | `deploy/vps/paquets/maj29.tar.gz` et `hestim-backend-maj29.tar.gz`, construits sur `d0dfe0f`. **Périmés** : ils datent d'avant les retraits de fonctions. À refaire (lot 0-3). |
| Dépôt GitHub de Planner | **Public**, avec `docs/users.xlsx` (noms et adresses) versionné. C'est l'urgence n° 1 (lot 0-1). |

## 2. Les quatre plans, et lequel fait foi

| Plan | Rôle |
|---|---|
| `docs/plans/assainissement.md` | **Fait foi pour le travail à venir.** Constats, fonctions abandonnées ou reportées, lots 0 (chef de projet), A et B. |
| `docs/plans/remarques-par-profil.md` | Réponses aux critiques de dix profils, lots R, trajectoire vers « Planner », revenu, vidéo. |
| `docs/plans/quiz-ia.md` | Quiz par l'IA et quiz dans Planner (lots IA et CQ). Plusieurs de ses lots sont abandonnés par `assainissement.md`, § 3.2. |
| `docs/plans/espace-enseignant.md` | Espace de l'enseignant (lots P, W, M, G, S, T). Même remarque. |

En cas de contradiction, `assainissement.md` l'emporte.

## 3. Ce qui a été fait le 10 et le 11 octobre

**Construit et commité dans Planner :**
- « Mes classes » (`/mes-classes`) et rappel de l'appel 5 minutes avant la fin de la séance, à l'écran sur toutes les pages.
- Appel projeté (`/appel/:id/projection`) : le QR sans le menu, les présents qui apparaissent, validation, liste complète avec les absents. Un appel validé n'est plus rouvert par un simple retour sur la page.
- Quiz par l'IA de bout en bout : création du quiz relu dans le moteur (IA-4, sauf la mise à jour d'un quiz) et interface de génération et de relecture (IA-5, sauf « Mes quiz » à la main).
- Séance confirmée par défaut : plus de confirmation par l'enseignant ; une séance planifiée et passée devient réalisée d'office.
- Lancement du quiz sans reconnexion, dans le même onglet, avec un lien « ← Planner » côté quiz.
- Nom visible **PlannerQuiz** (les noms techniques « ClassQuiz » ne changent pas).
- Réservations de salle réservées à l'administration, côté site et côté serveur.
- Bouton d'aide du site : 14 fiches pour l'administration, 12 pour l'enseignant (13 pour un responsable de filière), 4 pour l'étudiant.

**Retiré par le chef de projet le 10 octobre** (voir `espace-enseignant.md`, § 6 quater) : surveillances côté enseignant, devoirs « fichier », retours anonymes, confirmation et marquage « réalisée », offre de stage et boutons « bientôt » de « Mes classes », création de notifications à la main.

**Essayé dans un vrai navigateur** (scripts Playwright temporaires, hors du dépôt) : appel projeté avec des scans simulés, quiz par l'IA avec une fausse IA, bouton d'aide. **Pas essayé** : un vrai téléphone qui scanne l'écran, le vrai fournisseur d'IA, le lancement du quiz entre les deux sites en ligne.

**Décisions du chef de projet (11 octobre) :**
- L'application mobile pour les enseignants est **une idée pour un plan futur**, pas un lot à faire.
- `finadmintech.fr` n'est qu'un nom de domaine.
- Aujourd'hui « HESTIM Planner » pour l'école ; demain « Planner » pour tout établissement.
- Revenu envisagé : un montant par utilisateur, facturé à l'école.
- Une vidéo courte en motion design, une fois les problèmes actuels réglés.

## 4. Règles pour que les deux groupes ne se gênent pas

Le 10 octobre, deux processus ont modifié le même dossier : un commit de 37 fichiers a mélangé le travail en cours de l'un avec les retraits de l'autre. Ces règles l'empêchent.

1. **Un dossier de travail par groupe.** Le groupe A garde le dossier actuel. Le groupe B travaille dans une copie : `git worktree add ../planner-b -b b/<lot> main` (après la fusion du lot 0-2). Aucun groupe n'écrit dans le dossier de l'autre.
2. **Une branche par lot**, préfixée par le groupe (`a/…`, `b/…`), créée depuis `main`.
3. **Chaque groupe ne commite que ses fichiers**, nommés un par un. Jamais `git add .` ni `git add -A`. Le chef de projet fusionne.
4. **Chacun ses dossiers** (tableau ci-dessous). Un besoin dans le dossier de l'autre groupe s'écrit dans son journal (règle 6), il ne se code pas.
5. **Chacun ses ports et sa base de test**, pour pouvoir lancer serveur et tests en même temps sur la même machine.
6. **Les plans ne sont modifiés que par le chef de projet.** Chaque groupe note son avancement et ses demandes dans son journal : `docs/sessions/journal-groupe-a.md` ou `journal-groupe-b.md`.
7. **Aucun groupe ne déploie ni ne touche au serveur de production.** Le chef de projet lance lui-même les commandes.

| | Groupe A (socle) | Groupe B (interface) |
|---|---|---|
| Dossiers de Planner | `backend/`, `solver/`, `deploy/`, `.github/`, `docs/` sauf `docs/plans/` | `frontend/`, `mobile/`, `shared/` |
| Dépôt du quiz | `classquiz/` (Python) | `frontend/` (Svelte) |
| Dépôt StudyLib | aucun lot avant la soutenance | aucun lot avant la soutenance |
| Fichiers réservés | `backend/routes/`, `backend/services/`, `backend/migrations/` | `frontend/src/i18n/fr.js` et `en.js`, `frontend/src/services/api.js`, `frontend/src/components/aide/` |
| Serveur local | port 5000 | port 5001 (`PORT=5001`) |
| Site local | port 5173 | port 5174 (`npx vite --port 5174`, avec `VITE_PROXY_TARGET=http://localhost:5001`) |
| Base de test | `hestim_test` | `hestim_b_test` (`DB_NAME=hestim_b_test`, à créer dans le conteneur `hestim_mysql_test` ; le nom doit finir par `_test`, sinon les tests refusent de vider la base) |
| Journal | `docs/sessions/journal-groupe-a.md` | `docs/sessions/journal-groupe-b.md` |

**Le seul fichier que les deux groupes modifient** est `.github/workflows/ci-cd.yml` : le groupe A d'abord (lot A-4), le groupe B ensuite (lot B-8), après la fusion de A.

**Lots à cheval sur les deux groupes** (une route et un écran) : le groupe A écrit et fusionne la route, puis le groupe B écrit l'écran. Jamais en même temps. C'est le cas de R-11.

## 5. Les tâches, par groupe

### D'abord : le lot 0, par le chef de projet seul

Rien ne commence dans les groupes avant 0-1 et 0-2.

| Lot | Action |
|---|---|
| **0-1** | Rendre le dépôt privé tout de suite, puis réécrire l'historique pour retirer `docs/users.xlsx` et les fichiers audio. |
| **0-5** | Commiter ou écarter le travail en cours de `../StudyLib` (11 fichiers) et de `../ClassQuiz` (1 fichier). |
| **0-2** | Commiter les deux plans et ce compte rendu, puis fusionner `feature/phase-e-timefold` dans `main` (PR n°4), CI verte. |
| **0-4** | Valider le gel du périmètre (`assainissement.md`, § 3.2 et 3.3). |
| **0-3** | Refaire le paquet maj29 depuis `main`, avec une nouvelle image du backend, le déployer, dérouler la recette. |

### Groupe A (socle)

Dans cet ordre. Le détail de chaque lot est dans `assainissement.md`, § 5.

| Ordre | Lot | En bref |
|---|---|---|
| 1 | **A-1** | Remplacer `docs/users.xlsx` par un modèle avec des personnes fictives. |
| 2 | **A-2** | Vérifier qu'aucun compte de production n'a de mot de passe de démonstration, et le noter dans la recette. **La partie « identifiants de test » du lot vit dans `frontend/playwright.global-setup.cjs` : elle revient au groupe B**, qui la traite avec B-8. |
| 3 | **A-9** et **R-3** | Procédure de retour arrière ; `preparer-maj.sh` s'arrête si les dépendances du backend ont changé. |
| 4 | **A-3** | Sauvegarde quotidienne hors du serveur, restauration testée. Demande une décision (§ 6). |
| 5 | **A-4** | ESLint pour le backend, bloquant dans la CI. |
| 6 | **R-11, côté serveur** | Séances sans appel validé marquées « à vérifier » dans les heures du mois et l'export des vacataires. Priorité 1. |
| 7 | **CQ-1** | Route signée de démarrage d'une partie, relais `/socket.io/` dans nginx. |
| 8 | **R-2** | `FORK.md` dans le dépôt du quiz. |
| Ensuite | A-5, A-7, A-8, A-10 | Priorité 2. |
| Après la soutenance | A-6, R-12, routes de R-10 et R-13 | |

### Groupe B (interface)

Dans cet ordre. Le détail est dans `assainissement.md`, § 5, et `remarques-par-profil.md`, § 7.

| Ordre | Lot | En bref |
|---|---|---|
| 1 | **B-1** | Supprimer la couche React Query morte (aucune page ne l'utilise ; seul `providers/AppProviders.jsx` la branche). |
| 2 | **B-8** | Tests Playwright des cinq parcours de démonstration dans la CI, avec les identifiants de test lus dans des variables d'environnement (partie « site » de A-2). Le plus long. Les scripts d'essai de ces deux jours étaient temporaires : les réécrire dans `frontend/tests/`. |
| 3 | **B-5**, **B-6** | Trois `window.confirm` à remplacer par `ConfirmDialog` ; menu d'export réduit à trois entrées. |
| 4 | **B-9** | Test des fiches d'aide ; mettre à jour les fiches après B-6. |
| 5 | **R-7**, **R-8** | Règle de nommage dans les écrans ; la promesse sur la page d'accueil. Attendent la validation du chef de projet (§ 6). |
| 6 | **R-11, côté écran** | Après la fusion de la route du groupe A. |
| 7 | **CQ-2**, **CQ-3** | Écran du projecteur dans Planner, lien « Quiz ». Après CQ-1 du groupe A. |
| Ensuite | B-2, B-3, R-6, R-14 | Priorité 2. Pour B-2, **ne pas demander le fuseau au navigateur** (`assainissement.md`, B-2). |
| Après la soutenance | B-4, B-7, écrans de R-9, R-10 et R-13 | |

## 6. Décisions attendues du chef de projet

- **Date de la soutenance** : elle fixe ce qui tient avant.
- **Organisation** : les règles du § 4 conviennent-elles, en particulier « chaque groupe commite ses fichiers » ?
- **Sauvegardes** (A-3) : où les envoyer hors du serveur, et qui en a l'accès ?
- **Paie des vacataires** (R-11) : l'appel validé est-il bien la preuve qu'un cours a eu lieu ?
- **Fournisseur d'IA** : la décision de l'école bloque IA-7.
- **Nommage et promesse** (R-7, R-8) : « Bibliothèque » ou « StudyLib » dans les écrans ; la phrase de promesse.
- **Défis du terminal dans un quiz** (J-1) : reporté, à confirmer.

## 7. Repères pratiques

- **Tests du backend** : `npm test` et `npm run test:integration` dans `backend/`, avec le conteneur `hestim_mysql_test` (port 3307). Les suites d'intégration se lancent **une à la fois** : elles partagent leur base.
- **Site** : `npm run lint` (0 erreur attendue, 7 avertissements connus) et, depuis PowerShell, `$env:VITE_API_URL="/api"; npm run build`.
- **Tests de StudyLib** : `php vendor/bin/phpunit --no-coverage` dans `../StudyLib` (SQLite en mémoire).
- **Tests Python du quiz** : ils demandent PostgreSQL, Redis et Meilisearch. Le 10 octobre, trois conteneurs jetables et un environnement Python isolé ont suffi ; rien n'en reste.
- **Essai dans un navigateur sans toucher aux données** : créer une base à part dans `hestim_mysql_test` (son nom doit finir par `_test`), lancer le serveur dessus, piloter avec Playwright (`frontend/node_modules`).
- **Paquet de mise à jour** : les dépendances du backend ont changé (`pdfjs-dist`, `mammoth`, `jszip`). La superposition seule ne suffit plus : construire l'image (`docker build -t claude20022002/hestim-backend:latest --build-context shared=./shared ./backend`), l'enregistrer, la charger sur le serveur **avant** `appliquer-maj.sh`, et garder l'ancienne sous une étiquette à part.
- **Image locale** : `claude20022002/hestim-backend:latest` a été reconstruite le 10 octobre ; l'ancienne est sous `avant-ia-local`.
- **Fuseau** : le Maroc est à UTC+0 toute l'année depuis le 20 septembre 2026 (`backend/tzdata/LISEZMOI.md`).
- **Façon de travailler** : le chef de projet commite et pousse souvent lui-même, y compris pendant qu'un processus travaille. Vérifier `git status` et `git log` avant d'annoncer ce qui reste à commiter.
