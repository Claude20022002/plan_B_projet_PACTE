# Compte rendu pour la prochaine session (rédigé le 11 octobre 2026, au soir)

À lire en début de session, avant tout travail. Il remplace `compte-rendu-2026-10-12.md` pour l'état du projet. Les règles de travail entre les deux groupes et les règles de code (§ 4 de `compte-rendu-2026-10-11.md`) restent valables ; une seule change, la première (§ 9).

**Deux groupes travaillent en parallèle** : groupe A (socle) et groupe B (interface). Le chef de projet dit son groupe à chaque session ; s'il ne le dit pas, le demander.

Rédigé par le groupe A. L'index de toute la documentation est dans [docs/README.md](../README.md).

## 1. L'essentiel

1. **Tout est dans `main`**, et sa CI est verte (`6a7242f`). La fusion des deux groupes (PR 5) et les lots du groupe A (PR 6 à 11) sont passés. Aucune PR ouverte, aucune branche en attente.
2. **La production est toujours en maj27**, à la connaissance de ce compte rendu. Deux paquets attendent le chef de projet : `quiz-correctif3` (faille du quiz) puis `maj30` (Planner). Voir § 3.
3. **La faille du quiz reste ouverte en production** tant que `quiz-correctif3` n'est pas déployé.
4. **Le groupe A n'a plus de lot faisable sans décision** : R-12, le relevé mensuel, A-5 et A-3 attendent le chef de projet (§ 5). A-6 est pour plus tard.
5. **Le groupe B a des routes prêtes à brancher** : R-10, IA-5, journal de sécurité (§ 6).
6. **Un piège de fuseau horaire** a cassé la CI : le Maroc est à UTC+0 depuis le 20 septembre 2026, et Node 22.23.2 (sur le poste) ne le sait pas. Voir § 9.

## 2. État vérifié le 11 octobre au soir

| Élément | État |
|---|---|
| `main` (GitHub) | `6a7242f`, CI verte. PR 1 à 11 fusionnées ou fermées |
| Dépôt du quiz, branche `hestim` | `ce0906a0` (PR 1 du fork : salles du serveur de jeu, `FORK.md`, mise à jour d'un quiz) |
| Dossier `plan_B_projet_PACTE` (groupe A) | `main`, propre. **`frontend/node_modules` à moitié vidé** : refaire `npm ci` une fois arrêté le serveur Vite du port 5181 |
| `../planner-integration` | Copie de contrôle, sur `main` détaché, avec une installation propre. Sert à construire le site ; à supprimer quand `frontend/node_modules` est réparé |
| `../planner-a-scan`, `../planner-b`, `../planner-b-r7` | Propres, sur des branches déjà fusionnées. Repartir de `main` pour tout nouveau lot |
| `../StudyLib` | **11 fichiers non commités** depuis le 10 octobre |
| Tests | Serveur : 184 unitaires, 361 intégration. Solveur : 34. Application : 38. Site : 15 unitaires, 9 parcours. Banc SQL : 48 routes dans leur budget |

## 3. Déployer : deux paquets, dans cet ordre

Dans `deploy/vps/paquets/` (non versionné). Le chef de projet les lance ; le serveur est `root@89.167.44.85`.

**Les commandes `scp` se lancent depuis `plan_B_projet_PACTE` sur le PC ; les autres, sur le serveur, après `ssh root@89.167.44.85`.** Le 11 octobre au soir, une tentative depuis `ClassQuiz`, sans `ssh`, a échoué sans rien toucher.

### 3.1 Le moteur de quiz : `quiz-correctif3`

Correctif de la prise de main, compteur de réponses par partie, route de mise à jour d'un quiz (IA-4). Python seul : ni migration, ni Planner. Remplace `quiz-correctif1` et `2`. Hors des heures de cours (les parties en cours sont coupées).

```bash
scp deploy/vps/paquets/quiz-correctif3.tar.gz root@89.167.44.85:/root/
# sur le serveur
cd /root && tar -xzf quiz-correctif3.tar.gz && bash quiz-correctif3/deploy-vps/appliquer-quiz.sh /root/quiz-correctif3
```

Puis jouer une partie d'essai avec la télécommande : le compteur avance, la question se ferme quand tous ont répondu, les téléphones suivent. Si possible, deux parties en même temps : le compteur de l'une ne bouge pas quand on répond dans l'autre.

### 3.2 Planner : `maj30` et l'image du solveur

`maj30` est construit depuis `6a7242f` (`VERSION` vérifié, aucun fichier non commité). Il apporte toute la fusion du 11 octobre. Depuis maj27, le serveur appliquera sept migrations au démarrage : 0035 à 0038 (index, journal de sécurité, compteurs des limiteurs, générations de quiz, déjà dans maj28 et maj29), puis 0039 (visas des séances, R-11), 0040 (campus par promotion) et 0041 (demandes de changement de téléphone). Une fois une migration appliquée, le retour arrière passe par la sauvegarde (`DEPLOIEMENT.md`, cas 2). **`maj29.tar.gz` est périmé : ne pas l'appliquer.**

- **Dépendances du serveur** : identiques à celles de l'image `hestim-backend` du PC (construite le 10 octobre, enregistrée dans `hestim-backend-maj29.tar.gz`). Si `appliquer-maj.sh` refuse sur le serveur (l'image en ligne est plus ancienne), charger d'abord cette image, comme le dit `DEPLOIEMENT.md`, « Quand les dépendances changent », étapes 3 et 4.
- **Solveur** : la règle des salles (salle à la taille du groupe, même salle pour deux cours qui se suivent) n'est dans aucune image en ligne. Nouvelle image : `hestim-solver-maj30.tar.gz`.

```bash
scp deploy/vps/paquets/maj30.tar.gz deploy/vps/paquets/hestim-solver-maj30.tar.gz root@89.167.44.85:/root/
# sur le serveur
docker tag claude20022002/hestim-solver:latest claude20022002/hestim-solver:avant-maj30
gunzip -c /root/hestim-solver-maj30.tar.gz | docker load
cd /root && tar -xzf maj30.tar.gz && bash maj30/deploy-vps/appliquer-maj.sh /root/maj30
cd /opt/hestim && docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml up -d --no-deps solver
```

Copier les commandes de retour arrière affichées par `appliquer-maj.sh`, puis dérouler la recette (`docs/recette/scenarios-de-test.md`, section 0 d'abord). Retour arrière du solveur : `docker tag claude20022002/hestim-solver:avant-maj30 claude20022002/hestim-solver:latest`, puis la même commande `up -d --no-deps solver`.

**Jamais essayé sur le serveur** : ce déroulé de `maj30` ; le rechargement de Caddy (CQ-1) ; le script de contrôle des mots de passe de démonstration (A-2) ; la procédure de retour arrière à blanc (A-9).

## 4. Ce que le groupe A a fait le 11 octobre (après-midi et soir)

Le détail est dans `journal-groupe-a.md`.

| Lot | Résultat |
|---|---|
| Fusion (0-2) | Branche d'intégration, trois conflits résolus, tout vérifié ensemble ; PR 5 |
| Serveur de jeu | `player_answer` vers l'écran de l'enseignant, `everyone_answered` vers la salle de la partie (les joueurs l'écoutent aussi : la proposition « tout vers l'enseignant » les aurait cassés) |
| R-2 | `FORK.md` dans le dépôt du quiz |
| R-14, serveur | Liens `/jeux?partie=<id>` et `/jeux?resultats=<id>` dans les notifications de quiz |
| A-7 | Verrou MySQL autour des cinq tâches périodiques : deux instances ne font qu'un envoi |
| A-8 | Une classe de test par règle du solveur (34 tests au lieu de 20) |
| IA-4 (reste) | Relire et modifier depuis Planner un quiz du service de quiz (`GET`/`PUT /api/quiz/mes-quiz/:id`) |
| R-10, serveur | Demande de changement de téléphone par l'étudiant, décision de l'administration ; le téléphone déclaré, et lui seul, est lié |
| A-10 | Documentation rangée : index `docs/README.md`, anciens rapports dans `docs/archives/`, documents de l'école dans `docs/ecole/` |
| CI | Fuseau du Maroc dans les tests (§ 9) ; `/api/suivi/enseignants` ramené à son budget de 4 requêtes (R-11 en ajoutait deux) |

## 5. Décisions attendues du chef de projet

| Décision | Ce qu'elle débloque |
|---|---|
| **Compte « actif »** : au moins une connexion dans le mois ? | R-12 (compteurs), puis la facturation |
| **Sauvegardes** : où les envoyer hors du serveur, qui en a l'accès, où garder la phrase de chiffrement ; faut-il aussi les documents de la bibliothèque et les images des quiz ? | A-3 (prêt, pas en service) |
| **A-5** : feu vert pour le format d'erreur commun, qui change l'API (le groupe B doit suivre) | A-5, puis la réécriture de `docs/api/` |
| **Relevé mensuel** : le faire valider par la scolarité de HESTIM | Le lot du relevé |
| **Fournisseur d'IA** (décision de l'école) | IA-7 |
| **R-11** : une séance « à vérifier » part-elle dans l'export avec sa mention, ou est-elle retenue ? Une séance écartée sort-elle des heures réalisées du module ? | La fin de R-11 |
| **B-7** : découper la mise en page seule, ou écrire d'abord un parcours pour `Cours.jsx`, `Calendrier.jsx` et `Affectations.jsx` ? | B-7 |
| **R-8** : la phrase de la promesse | La page d'accueil, la vidéo |
| **0-1** : quand réécrire l'historique (`docs/users.xlsx`, fichiers audio) | La fin de l'exposition des données ; tout le monde reclone |
| Petits points : notifications « devoir » déjà envoyées ; `POST /api/users/import` ; branches et dossiers par groupe dans le dépôt du quiz ; durée et scène « Bientôt » de la vidéo | Ménage |

La liste des « fichiers inutiles » est réglée en partie : B-1 a retiré la couche React Query ; A-10 a archivé les documents. Restent les fichiers isolés du site et du serveur (§ 6 de `compte-rendu-2026-10-11.md`) et, dans le dossier du groupe B, `frontend/STRUCTURE_CREEE.md` et `frontend/GUIDE_DEMARRAGE.md`.

## 6. Ce qui reste au groupe B

**Écrans dont la route est prête** (contrats dans `journal-groupe-a.md`, 11 octobre au soir) :

- **R-10** : « J'ai changé de téléphone » dans l'application (`POST /api/presences/telephone/demande`, mêmes en-têtes que le scan) ; les demandes à traiter pour l'administration, dans « À traiter » avec **R-9**.
- **IA-5** : l'éditeur « Mes quiz » (`GET` et `PUT /api/quiz/mes-quiz/:id`).
- **Journal de sécurité** : traduire `telephone_demande`, `telephone_change_accepte`, `telephone_change_refuse`.

**Petites demandes** : avertissement `plafond_hebdomadaire` dans l'écran de génération ; `id_campus_prefere` dans le formulaire d'un groupe ; `EmploiDuTempsAdmin.jsx` et `Affectations.jsx` qui demandent plus de 100 séances ; `game_id` à retirer de la page du joueur (site du quiz) ; bouton de scan en double sur le Tableau.

**Lots** : B-7 (décision attendue) ; le parcours « Créer un quiz » de B-8 ; R-8 (attend la phrase) ; plus tard R-13 (export des notes), l'onglet « Menu », l'espace Carrière.

## 7. Lots restants

| Lot | Groupe | Attend |
|---|---|---|
| R-12, compteurs d'usage | A | Définition du compte actif |
| Relevé mensuel | A | Validation de la scolarité |
| A-5, format d'erreur | A puis B | Feu vert |
| A-3, sauvegardes en service | A | Destination |
| A-6, anciens contrôleurs | A | Plus tard (priorité 3) |
| R-10, R-9, IA-5, B-7 | B | Rien pour les trois premiers ; décision pour B-7 |
| R-13, export des notes | A et B | Le retour des devoirs |

**L'écran Bibliothèque de l'application n'a été modifié sur aucune branche.**

## 8. Vidéo et vente

- **Vidéo** : le quiz est encore sur maquettes ; manquent les résultats d'un quiz, la Bibliothèque, `admin-04` (vide) à refaire, les sous-titres anglais. Personne ne l'a regardée en entier. `M10Admin.tsx` n'est plus utilisé.
- **Vente** : avant de démarcher une autre école, il faut le compteur et le relevé (R-12), le nom « Planner » au lieu de « HESTIM Planner », les sauvegardes en service, la déclaration à la CNDP, et un pilote mesuré à HESTIM. Aucun client, témoignage ni chiffre d'usage n'existe : n'en inventer aucun.
- **Idée du chef de projet, sans lot** : s'inspirer de Kahoot (§ 7 de `compte-rendu-2026-10-12.md`). Premier pas : une note d'une page, sans code.

## 9. Repères pratiques

Ceux des comptes rendus précédents restent valables. S'y ajoutent :

- **Dossiers de travail** : la fusion (lot 0-2) est faite. Un nouveau lot part de `main` : `git worktree add ../planner-b -b b/<lot> main` pour le groupe B, comme prévu par la règle 1. Une branche et une PR par lot, toujours.
- **Fuseau du Maroc** : UTC+0 toute l'année depuis le 20 septembre 2026 (tzdata 2026c, `backend/tzdata/LISEZMOI.md`). Node 22.23.2 a la tzdata 2026a, où il reste à UTC+1. Dans un test, jamais d'heure en « +01:00 » : `aLHeureDeLEcole(jour, heure)` (`backend/tests/integration/helpers/heureLocale.js`). Pour tester comme la CI : `ICU_TIMEZONE_FILES_DIR=<dépôt>/backend/tzdata` avant `npm run test:integration`, ou Node 22.23.3 au moins.
- **Banc des requêtes SQL** : il tourne dans la CI après les tests d'intégration ; un échec de ceux-ci le masque. En local : `DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=root DB_PASSWORD=test_root DB_NAME=hestim_bench_test npm run banc:preparer`, puis `npm run banc:requetes -- --verifier`.
- **Tests Python du quiz**, dans l'image de l'API (depuis `../ClassQuiz`, dans Git Bash) :
  `MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src" -w /src -e MAIL_ADDRESS=a@b.c -e MAIL_PASSWORD=x -e MAIL_USERNAME=x -e MAIL_SERVER=localhost -e MAIL_PORT=25 -e SECRET_KEY=essai -e STORAGE_BACKEND=local -e STORAGE_PATH=/tmp --entrypoint sh claude20022002/hestim-classquiz-api:latest -c 'pip install -q pytest pytest-asyncio httpx; python -m pytest -q classquiz/tests/test_hestim.py classquiz/tests/test_salles.py classquiz/tests/test_modification.py'`
- **Le dépôt du quiz n'a pas de CI** : ses tests ne tournent que sur le poste.
- **Façon de travailler** : le chef de projet commite, pousse et fusionne souvent lui-même pendant la session. Vérifier `git status`, `git log` et `gh pr list` avant d'annoncer ce qui reste à faire.
