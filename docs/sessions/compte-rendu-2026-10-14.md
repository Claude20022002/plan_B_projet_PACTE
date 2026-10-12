# Compte rendu pour la prochaine session (rédigé le 12 octobre 2026)

À lire en début de session, avant tout travail. Il remplace `compte-rendu-2026-10-13.md`. Les règles de travail entre les deux groupes et les règles de code (§ 4 de `compte-rendu-2026-10-11.md`) restent valables.

**Deux groupes travaillent en parallèle** : groupe A (socle : `backend/`, `solver/`, `deploy/`, `docs/`) et groupe B (interface : `frontend/`, `mobile/`, `shared/`). Le chef de projet dit son groupe à chaque session ; s'il ne le dit pas, le demander. Les deux dernières sessions ont été menées pour les deux groupes à la demande du chef de projet, chacun dans son dossier et ses branches.

L'index de toute la documentation est dans [docs/README.md](../README.md). Le détail de chaque lot est dans [journal-groupe-a.md](journal-groupe-a.md) et [journal-groupe-b.md](journal-groupe-b.md).

## 1. L'essentiel

1. **`main` n'a pas bougé depuis le 11 octobre** (`33c25f8`). Tout le travail depuis attend sur **10 PR ouvertes, toutes vertes** (13 à 22), plus **4 branches du groupe B à pousser** et **2 PR du dépôt du quiz**. Les 14 branches de Planner se fusionnent sans conflit, et l'ensemble réuni passe tous les tests (§ 3).
2. **Les décisions du chef de projet du 11 octobre au soir sont appliquées** (§ 5) : compte actif, format d'erreur commun, séances retenues hors de la paie, quiz sur une classe de l'emploi du temps, promesse, notifications de devoirs masquées, règles du dépôt du quiz.
3. **La production est toujours en maj27**, à la connaissance de ce compte rendu. **La faille du quiz y reste ouverte** tant que `quiz-correctif3` n'est pas déployé (§ 4). Une tentative du 11 octobre au soir a échoué sans rien toucher (commandes lancées depuis le mauvais dossier, sans `ssh`).
4. **`maj30` sera périmé dès la fusion** des PR : il faudra préparer `maj31` depuis le nouveau `main` (§ 4.2).
5. **Groupe A** : plus de lot faisable sans décision, sauf A-6 (plus tard). **Groupe B** : le découpage de B-7 peut commencer, sous les parcours écrits pour lui.
6. **Trois questions restent ouvertes** pour le chef de projet (§ 6).

## 2. État vérifié le 12 octobre

| Élément | État |
|---|---|
| `main` (GitHub) | `33c25f8`, CI verte |
| Dépôt du quiz, branche `hestim` | `ce0906a0` (salles du serveur de jeu, `FORK.md`, mise à jour d'un quiz depuis Planner) |
| PR ouvertes de Planner | 13 à 22, **les dix vertes** (5 contrôles sur 5 chacune) |
| PR ouvertes du quiz | 2 (`b/joueur-sans-game-id`), 3 (`a/fork-regles-equipes`). Le dépôt n'a pas de CI |
| Branches du groupe B à pousser | `b/b7-parcours`, `b/r11-r12-ecrans`, `b/a5-messages`, `b/r8-promesse` (locales, dans `../planner-b`) |
| Dossier `plan_B_projet_PACTE` (groupe A) | Propre. **`frontend/node_modules` à moitié vidé** : refaire `npm ci` une fois arrêté le serveur Vite du port 5181 (il tourne encore) |
| `../planner-b` (groupe B) | Propre, sur `b/b7-parcours` |
| `../planner-integration` | Copie de contrôle (commit détaché, installation propre). Sert à construire le site et à lancer les parcours du groupe A ; à supprimer quand `frontend/node_modules` est réparé |
| `../planner-a-scan`, `../planner-b-r7` | Propres, sur des branches fusionnées depuis longtemps : à supprimer (`git worktree remove`) |
| `../ClassQuiz` | Propre, sur `a/fork-regles-equipes` |
| `../StudyLib` | **11 fichiers non commités** depuis le 10 octobre |
| Paquets (`deploy/vps/paquets/`) | `quiz-correctif3` prêt ; `maj30` et `hestim-solver-maj30` prêts mais construits avant ces PR ; `hestim-backend-maj29` (image du serveur, si les dépendances en ligne sont plus anciennes) |
| **Tests sur les 14 branches réunies** | Serveur : 188 unitaires, 377 intégration (tzdata 2026c). Site : lint 0 erreur, 19 unitaires, build. Application : 40 tests. **15 parcours sur 15**. Le banc SQL n'a pas tourné sur l'ensemble : la CI le fera |

## 3. Fusionner : l'ordre

**Planner.** Fusionner dans cet ordre (chaque PR après la précédente) :

| Ordre | PR / branche | Lot |
|---|---|---|
| 1 | 13 `b/petites-demandes` | Plafond hebdomadaire, campus d'un groupe, listes de séances complètes, bouton de scan en double |
| 2 | 14 `b/r10-telephone` | R-10 et R-9 (écrans) |
| 3 | 15 `b/b8-creer-quiz` | IA-5 (éditeur « Mes quiz »), fin de B-8 (« Créer un quiz »), faux services des parcours |
| 4 | 16 `b/listes-completes` | Plus aucune liste tronquée à 100 |
| 5 | 17 `a/r11-export-retenu` | R-11 : séance à vérifier retenue hors de la paie |
| 6 | 18 `a/quiz-classe-du-prof` | Quiz sur une classe de l'emploi du temps |
| 7 | 19 `a/notifs-devoirs-masquees` | Notifications de devoirs masquées |
| 8 | 20 `a/r12-compteurs` | R-12 : compteurs d'usage |
| 9 | 21 `a/a5-format-erreur` | A-5 : format d'erreur commun |
| 10 | 22 `a/journal-decisions` | Journal du groupe A, promesse dans le README |
| 11 | `b/b7-parcours` (à pousser) | Parcours de B-7, formulaire des séances complet |
| 12 | `b/r11-r12-ecrans` (à pousser) | Écrans de R-11 et R-12 |
| 13 | `b/a5-messages` (à pousser) | Le site lit le format d'erreur commun |
| 14 | `b/r8-promesse` (à pousser) | La promesse sur l'accueil |

Pousser les quatre dernières, depuis `../planner-b` :

```powershell
git push -u origin b/b7-parcours b/r11-r12-ecrans b/a5-messages b/r8-promesse
foreach ($b in "b/b7-parcours","b/r11-r12-ecrans","b/a5-messages","b/r8-promesse") { gh pr create --base main --head $b --fill }
```

Puis fusionner, depuis `plan_B_projet_PACTE`, en attendant la CI verte de chacune :

```powershell
foreach ($n in 13,14,15,16,17,18,19,20,21,22) { gh pr merge $n --merge }
gh pr list --state open          # les quatre PR du groupe B ouvertes ci-dessus : les fusionner dans l'ordre du tableau
```

Une PR qui passe derrière une autre peut demander `gh pr update-branch <n>` avant d'être fusionnée.

**Dépôt du quiz** : fusionner les PR 2 et 3 (`gh pr merge 2 --repo Claude20022002/ClassQuiz --merge`, puis 3). Elles ne touchent que le site du joueur et `FORK.md` : `quiz-correctif3` reste valable.

## 4. Déployer

Le chef de projet lance les commandes. Le serveur est `root@89.167.44.85`. **Les `scp` se lancent depuis `plan_B_projet_PACTE` sur le PC ; les autres commandes sur le serveur, après `ssh root@89.167.44.85`.**

### 4.1 Le moteur de quiz : `quiz-correctif3` (d'abord, hors des heures de cours)

Correctif de la prise de main d'une partie, compteur de réponses par partie, route de mise à jour d'un quiz. Python seul : ni migration, ni Planner.

```bash
scp deploy/vps/paquets/quiz-correctif3.tar.gz root@89.167.44.85:/root/
# sur le serveur
cd /root && tar -xzf quiz-correctif3.tar.gz && bash quiz-correctif3/deploy-vps/appliquer-quiz.sh /root/quiz-correctif3
```

Puis une partie d'essai avec la télécommande : le compteur avance, la question se ferme quand tous ont répondu, les téléphones suivent ; si possible deux parties à la fois, dont les compteurs restent séparés.

### 4.2 Planner : un nouveau paquet, `maj31`, après la fusion

`maj30` a été construit le 11 octobre, avant les PR 13 à 22 : **ne pas l'appliquer après la fusion**. Une fois tout fusionné, préparer `maj31` depuis `main` :

1. Construire le site depuis PowerShell : `cd frontend; $env:VITE_API_URL="/api"; npm run build` (dans `../planner-integration` tant que `frontend/node_modules` n'est pas réparé ici, après `git checkout --detach origin/main` et `npm ci`).
2. Dans Git Bash, depuis la racine du même dossier : `bash deploy/vps/preparer-maj.sh maj31`. Le script arrête tout si les dépendances du serveur ont changé.
3. Vérifier le fichier `VERSION` du paquet : le commit de `main`, aucune ligne de fichier non commité.

Depuis maj27, le serveur appliquera **sept migrations** au démarrage (0035 à 0041) ; aucune nouvelle depuis. Après une migration, le retour arrière passe par la sauvegarde (`DEPLOIEMENT.md`, cas 2).

**Le solveur** : l'image `hestim-solver-maj30.tar.gz` reste à jour (le solveur n'a pas changé depuis, seulement ses tests). Aucune image en ligne n'a encore la règle des salles.

```bash
scp deploy/vps/paquets/maj31.tar.gz deploy/vps/paquets/hestim-solver-maj30.tar.gz root@89.167.44.85:/root/
# sur le serveur
docker tag claude20022002/hestim-solver:latest claude20022002/hestim-solver:avant-maj31
gunzip -c /root/hestim-solver-maj30.tar.gz | docker load
cd /root && tar -xzf maj31.tar.gz && bash maj31/deploy-vps/appliquer-maj.sh /root/maj31
cd /opt/hestim && docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml up -d --no-deps solver
```

Si `appliquer-maj.sh` refuse les dépendances (image en ligne plus ancienne), charger d'abord `hestim-backend-maj29.tar.gz` (`DEPLOIEMENT.md`, « Quand les dépendances changent »). Copier les commandes de retour arrière affichées, puis dérouler la recette (`docs/recette/scenarios-de-test.md`, section 0 d'abord).

**Jamais essayé sur le serveur** : ce déroulé ; le rechargement de Caddy (CQ-1) ; le script de contrôle des mots de passe de démonstration (A-2) ; la procédure de retour arrière à blanc (A-9).

## 5. Décisions du chef de projet (11 et 12 octobre) et leur suite

| N° | Décision | Suite |
|---|---|---|
| 1 | Compte actif : au moins une connexion dans le mois | R-12 fait : `GET /api/statistiques/usage?mois=` et `.csv` ; onglet « Usage du mois » dans Suivi |
| 2 | Format d'erreur commun | A-5 fait : `{ message, code, violations? }`, `docs/api/ERREURS.md` ; le site le lit |
| 3 | B-7 : les parcours d'abord | Faits : maquette, calendrier, séances |
| 4 | Séance à vérifier retenue hors de la paie jusqu'au visa | Fait (serveur et avertissement à l'écran) |
| 5 | Quiz possible si l'enseignant a ce module avec cette classe | Fait : une classe de son emploi du temps suffit |
| 6 | Sauvegardes | Expliqué en séance (§ 6) ; destination à choisir |
| 7 | Promesse : « Votre emploi du temps accessible en un geste » | Sur l'accueil (fr et en) et en tête du README |
| 8, 9 | Relevé mensuel, fournisseur d'IA | Plus tard |
| 10 | Réécriture de l'historique | Expliqué en séance (§ 6) |
| 11 | Notifications de devoirs déjà envoyées : masquées | Fait ; rien n'est supprimé |
| 12 | `POST /api/users/import` gardée | Rien à faire |
| 13 | Dépôt du quiz : une branche par lot, un dossier par groupe | Écrit dans `FORK.md` (PR 3 du quiz) |
| 14 | Vidéo pour la salle : 1 min 15 | À appliquer au montage (V-1) ; il fait 1 min 35 |

## 6. Décisions attendues du chef de projet

- **R-11, la seconde question** : une séance écartée doit-elle sortir aussi des heures réalisées du **module** ? Elle sort déjà des heures de l'enseignant et de l'export.
- **Sauvegardes (A-3)** : où envoyer chaque nuit, hors du serveur, la copie chiffrée (Google Drive de l'école, second serveur, stockage S3…), qui y a accès, qui garde la phrase de chiffrement. À sauvegarder : la base de Planner (déjà faite chaque nuit, mais sur le serveur lui-même), les documents de la bibliothèque, la base et les images du quiz. Le script est prêt.
- **Réécriture de l'historique (0-1)** : `docs/users.xlsx` (noms, adresses `@hestim.ma`, mots de passe de démonstration) reste lisible dans l'historique, que d'autres ont pu cloner quand le dépôt était public. Personnes fictives : rien d'urgent. Personnes réelles : réécrire l'historique (tout le monde reclone) et prévenir l'école.
- **Plus tard** : validation du relevé mensuel par la scolarité ; fournisseur d'IA (IA-7) ; durée exacte et scène « Bientôt » de la vidéo.

## 7. Ce qui reste

### Groupe A

| Lot | Attend |
|---|---|
| A-3, sauvegardes en service | La destination (§ 6) |
| Relevé mensuel | La validation de la scolarité |
| A-6, alléger les anciens contrôleurs | Plus tard ; il finira aussi A-5 (les contrôleurs qui répondent encore `{ message, error }`) |
| IA-7 | Le fournisseur d'IA |
| R-13, export des notes | Le retour des devoirs |

### Groupe B

| Lot | État |
|---|---|
| **B-7, découper** `Cours.jsx` (662 lignes), `Calendrier.jsx` (660), `Affectations.jsx` (611) | **Faisable maintenant** : leurs parcours existent (`cours`, `calendrier`, `affectations`). Un fichier à la fois, les 15 parcours verts à chaque étape |
| Écrans plus tard | R-13, onglet « Menu », espace Carrière |

**L'écran Bibliothèque de l'application n'a été modifié sur aucune branche.**

### Chef de projet

- Fusionner (§ 3), puis déployer `quiz-correctif3` et `maj31` (§ 4).
- Réparer `frontend/node_modules` dans `plan_B_projet_PACTE`, puis supprimer les dossiers devenus inutiles (`../planner-integration`, `../planner-a-scan`, `../planner-b-r7`).
- Commiter ou écarter les 11 fichiers de `../StudyLib`.
- Vidéo (V-1) : 1 min 15, le vrai quiz au lieu des maquettes, la Bibliothèque, `admin-04` à refaire, sous-titres anglais.
- Avant de vendre : le nom « Planner » au lieu de « HESTIM Planner », la déclaration à la CNDP, les sauvegardes en service, un pilote mesuré à HESTIM. Aucun client ni chiffre d'usage n'existe : n'en inventer aucun.

## 8. Défauts trouvés et corrigés depuis le 11 octobre

À connaître, car ils changent ce qu'on croyait acquis :

- **Formulaire « Planifier une séance »** : il ne proposait que les 10 premiers cours, groupes, salles, créneaux et enseignants (listes chargées sans limite, le serveur en rend 10 par défaut). Corrigé ; trouvé par le parcours des séances.
- **Listes tronquées à 100** : une dizaine de pages demandaient plus de 100 éléments (jusqu'à 10 000) et n'en recevaient que 100. Corrigé (`getTous()` sur les API paginées).
- **Erreurs métier non interceptées** : elles sortaient en 500 ; elles gardent maintenant leur statut (A-5).
- **« Mes classes » contre « Créer un quiz »** : une classe proposée était refusée à la génération. Corrigé (décision 5).
- **CI rouge du 11 octobre** : le fuseau du Maroc dans les tests, et une route au-dessus de son budget de requêtes. Corrigés (PR 11).

## 9. Repères pratiques

Ceux des comptes rendus précédents restent valables. S'y ajoutent :

- **Base de test du groupe B** : `hestim_b_test` **n'existe pas** dans le conteneur `hestim_mysql_test`. La créer (`CREATE DATABASE hestim_b_test`) ou lancer les tests du serveur sur `hestim_a_test`. Les parcours, eux, utilisent `hestim_b_parcours_test` (groupe B) ou `hestim_a_parcours_test` (groupe A), qu'ils créent seuls.
- **Parcours de démonstration** (`frontend/tests/parcours/`, 15 aujourd'hui) : `npx playwright test --config=playwright.parcours.config.cjs`, avec `DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=root DB_PASSWORD=test_root` et `PARCOURS_SOLVEUR_IMAGE=claude20022002/hestim-solver:latest`. Ports du groupe B par défaut (5001, 5174, solveur 8090) ; le groupe A ajoute `PARCOURS_PORT_API=5000 PARCOURS_PORT_SITE=5173 PARCOURS_PORT_SOLVEUR=8091 PARCOURS_DB=hestim_a_parcours_test`.
  - **Faux services** démarrés par `serveur.mjs` : service de quiz (`fauxServiceQuiz.mjs`, port 5199, vérifie la signature) et IA « compatible OpenAI » (`fausseIa.mjs`, port 5198).
  - **Tous les parcours partagent une base**, dans l'ordre alphabétique des fichiers : un parcours ne doit rien laisser qui gêne les suivants. Exemple : le calendrier ajoute les fériés de **2025-2026**, car ceux de 2026-2027 (11 janvier 2027) bloquaient la date du parcours des reports.
  - Le premier parcours dépasse parfois son délai au démarrage à froid de Vite ; la CI le relance une fois.
  - Un lancement qui échoue au démarrage laisse le conteneur `hestim-solveur-parcours` sur le port 8090 : `docker stop hestim-solveur-parcours`.
- **Format d'erreur de l'API** : `docs/api/ERREURS.md`. Côté serveur, `utils/erreurs.js` (`repondreErreur`, `corpsErreur`) et `ErreurMetier(message, statut, code?)`. Côté site, `messageDe()` dans `services/api.js`.
- **Listes complètes** : sur le site, `xAPI.getTous()` charge toutes les pages d'une liste paginée ; ne plus écrire `getAll({ limit: 1000 })`.
- **Fuseau du Maroc** : jamais d'heure en « +01:00 » dans un test (`aLHeureDeLEcole(jour, heure)`). Pour tester comme la CI : `ICU_TIMEZONE_FILES_DIR=<dépôt>/backend/tzdata`.
- **Règle 4 (fichiers trop longs)** : `models/index.js`, `services/api.js` et les fichiers de traductions grossissent par nature ; partout ailleurs, sortir la partie à modifier avant d'y toucher.
- **Façon de travailler** : le chef de projet pousse, ouvre les PR et fusionne souvent lui-même pendant la session. Vérifier `git status`, `git log` et `gh pr list` avant d'annoncer ce qui reste.
