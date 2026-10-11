# Compte rendu de lancement des deux équipes (11 octobre 2026, au soir)

À lire en début de session, avant tout travail. Il remplace la version du matin de ce même fichier et `compte-rendu-2026-10-10.md` pour l'état du projet.

**Deux équipes travaillent en parallèle.** Le chef de projet dit à chacune son groupe en début de session : **groupe A (socle)** ou **groupe B (interface)**. Si le groupe n'est pas donné, le demander. Chaque groupe lit les § 1 à 4, puis seulement sa partie du § 5.

**La soutenance n'est plus un repère** (décision du chef de projet, le 11 octobre au soir). Aucun lot ne s'ordonne par rapport à elle : chaque groupe traite ses lots dans l'ordre du § 5. Les plans disent encore « avant » ou « après la soutenance » : lire « d'abord » et « plus tard ».

## 1. Où en est-on

État vérifié le 11 octobre au soir.

| Élément | État |
|---|---|
| Production | **maj27**, à la connaissance de ce compte rendu. Aucun déploiement n'a été confirmé depuis : à vérifier auprès du chef de projet. |
| Branche de Planner | `feature/phase-e-timefold`, **48 commits d'avance sur `main`**, dernier commit `4276d0d`. |
| Fichiers non commités dans Planner | Ce compte rendu et `docs/plans/assainissement.md` (retrait du repère « soutenance »). |
| Fusion dans `main` | **Aucune PR n'est ouverte.** Les PR n° 1 à 3 sont fusionnées ; la PR n° 4 citée par les plans reste à créer. |
| Dépôt GitHub de Planner | **Privé** depuis le 11 octobre au soir (dit par le chef de projet). `docs/users.xlsx` (noms et adresses) reste versionné et dans l'historique : la seconde moitié du lot 0-1 reste à faire. |
| Code mort du site (B-1) | **Commencé** : le fournisseur React Query est retiré de `AppProviders.jsx` (commit `4276d0d`), le lint et le build passent. Restent à supprimer les fichiers que plus rien n'importe et la dépendance `@tanstack/react-query`. |
| Dépôt du quiz (`../ClassQuiz`) | Dernier commit `5916cba5`. 1 fichier non commité : `frontend/static/site.webmanifest`. |
| Dépôt de la bibliothèque (`../StudyLib`) | Dernier commit `090ccce`. **11 fichiers non commités** (espace de l'enseignant, types Exercice et Article, un test). |
| Paquet maj29 | **Périmé** (construit sur `d0dfe0f`, avant les retraits de fonctions). À refaire (lot 0-3). |

## 2. Les plans, et lequel fait foi

| Plan | Rôle |
|---|---|
| `docs/plans/assainissement.md` | **Fait foi.** Constats, fonctions abandonnées ou reportées, lots 0, A, B, D et Q, règles de travail et règles de code (§ 6). |
| `docs/plans/remarques-par-profil.md` | Décisions du 11 octobre (§ 1), lots R, revenu (§ 5), vidéo (§ 6), idées pour plus tard (§ 9 et 10). |
| `docs/plans/quiz-ia.md` | Quiz par l'IA et quiz dans Planner (lots IA et CQ). Plusieurs lots sont abandonnés par `assainissement.md`, § 3.2. |
| `docs/plans/espace-enseignant.md` | Espace de l'enseignant. Même remarque. |

En cas de contradiction, `assainissement.md` l'emporte. **Les plans ne sont modifiés que sur demande du chef de projet.**

## 3. Décisions du chef de projet, le 11 octobre

### Ce qui change le travail des équipes dès maintenant

- **Devoirs : masqués, pas supprimés.** L'école ne fait pour le moment que des jeux pédagogiques. Les écrans et les routes des devoirs se ferment par un interrupteur ; le code et les tables restent, car les devoirs pourront revenir (lots D-1 et D-2).
- **Code : plus de longs fichiers, un travail par composants, un code maintenable et commenté.** Les règles sont au § 4.2 ; elles s'appliquent à toute PR à partir d'aujourd'hui (lots Q-1 et Q-2).
- **« Bibliothèque »** est le nom de l'espace dans tous les écrans. « StudyLib » reste un nom technique. Le lot R-7 n'attend plus de décision.
- **Paie des vacataires : l'appel validé ne suffit pas comme preuve.** Il devient un indice. Solution retenue : un relevé mensuel (Planner le prépare, l'enseignant confirme ses heures une fois par mois, l'administration vise avant l'export). **Le visa de l'administration se fait d'abord** : c'est le lot R-11 tel qu'il est écrit. La confirmation mensuelle par l'enseignant vient ensuite. Le bouton « confirmé » par séance ne revient pas.
- **Vidéo** : un montage pour une présentation en salle et un second pour les réseaux. Elle demande des écrans stables (lot V-1, chef de projet).

### Ce qui est décidé mais n'a pas encore de lot

Aucun de ces points n'est un lot. Ils sont décrits dans `remarques-par-profil.md`, § 5, 9 et 10.

- **Revenu** : 4,99 MAD par compte actif et par mois, tous rôles confondus, facturé à l'école. Rien n'est jamais facturé à un étudiant. L'IA est incluse, avec un plafond.
- **Espace Carrière** dans l'application : stages, offres et projets pour les étudiants de HESTIM. Une offre peut être partagée par un enseignant, l'administration ou un étudiant, sans validation, et peut être signalée. Ni candidature ni CV dans l'application.
- **Bibliothèque** : le site web reste pour l'ordinateur ; à terme les enseignants y déposent leurs supports à la place de Moodle, et l'étudiant les retrouve dans l'application.
- **Application** : un onglet « Menu » qui range les options ; l'onglet Jeux quitte la barre du bas ; un scan ouvre le jeu, comme Wooclap.
- **Gardés dans la bibliothèque** : les suggestions de projets, et les vidéos YouTube recommandées par l'IA avec la mention « en cours de développement ». Les événements ne vivent que dans le calendrier de l'application.
- **Application mobile pour les enseignants** : une idée pour un plan futur.
- **Outils Google** (Gmail, Agenda, Drive) : non connectés.

## 4. Règles communes aux deux équipes

### 4.1 Pour ne pas se gêner

Le 10 octobre, deux processus ont modifié le même dossier : un commit de 37 fichiers a mélangé le travail de l'un avec les retraits de l'autre. Ces règles l'empêchent.

1. **Un dossier de travail par groupe.** Le groupe A garde le dossier actuel. Le groupe B travaille dans une copie : `git worktree add ../planner-b -b b/<lot> main` (après la fusion du lot 0-2). Aucun groupe n'écrit dans le dossier de l'autre.
2. **Une branche et une PR par lot**, préfixées par le groupe (`a/…`, `b/…`), créées depuis `main`.
3. **Chaque groupe ne commite que ses fichiers**, nommés un par un. Jamais `git add .` ni `git add -A`. Le chef de projet fusionne.
4. **Chacun ses dossiers** (tableau ci-dessous). Un besoin dans le dossier de l'autre groupe s'écrit dans son journal (règle 6), il ne se code pas.
5. **Chacun ses ports et sa base de test**, pour lancer serveur et tests en même temps sur la même machine.
6. **Chaque groupe tient son journal** : avancement, demandes à l'autre groupe, questions au chef de projet.
7. **Aucun groupe ne déploie ni ne touche au serveur de production.** Le chef de projet lance lui-même les commandes.
8. **Rien de neuf hors des plans.** Une idée s'écrit dans le journal, sans code.

| | Groupe A (socle) | Groupe B (interface) |
|---|---|---|
| Dossiers de Planner | `backend/`, `solver/`, `deploy/`, `.github/`, `docs/` sauf `docs/plans/` | `frontend/`, `mobile/`, `shared/` |
| Dépôt du quiz | `classquiz/` (Python) | `frontend/` (Svelte) |
| Dépôt de la bibliothèque | aucun lot pour l'instant | aucun lot pour l'instant |
| Fichiers réservés | `backend/routes/`, `backend/services/`, `backend/migrations/` | `frontend/src/i18n/fr.js` et `en.js`, `frontend/src/services/api.js`, `frontend/src/components/aide/` |
| Serveur local | port 5000 | port 5001 (`PORT=5001`) |
| Site local | port 5173 | port 5174 (`npx vite --port 5174`, avec `VITE_PROXY_TARGET=http://localhost:5001`) |
| Base de test | `hestim_test` | `hestim_b_test` (`DB_NAME=hestim_b_test`, à créer dans le conteneur `hestim_mysql_test` ; le nom doit finir par `_test`, sinon les tests refusent de vider la base) |
| Journal | `docs/sessions/journal-groupe-a.md` | `docs/sessions/journal-groupe-b.md` |

**Le seul fichier que les deux groupes modifient** est `.github/workflows/ci-cd.yml` : le groupe A d'abord (lot A-4), le groupe B ensuite (lot B-8), après la fusion de A.

**Lots à cheval sur les deux groupes** (une route et un écran) : l'ordre est écrit dans chaque lot du § 5. Jamais les deux en même temps.

### 4.2 Pour écrire le code

Demande du chef de projet le 11 octobre. Le détail est dans `assainissement.md`, § 6, « Règles de code ». Mesure du jour : 19 fichiers de plus de 400 lignes dans `frontend/src`, 11 dans `backend/`, aucun dans `mobile/src` ni dans `solver/`.

1. **Un fichier, une responsabilité.**
   - Site et application : la page assemble ; le chargement des données va dans un hook (`useXxx`) ; chaque dialogue, tableau ou carte a son composant.
   - Serveur : la route déclare, le contrôleur lit la requête et répond, la règle métier vit dans `services/`.
2. **Repère de longueur : 300 lignes par fichier, 200 pour un contrôleur.** C'est un signal, pas le critère : un fichier court qui fait deux choses est aussi à découper.
3. **Tout fichier nouveau respecte le repère.**
4. **Un lot ne fait jamais grossir un fichier déjà trop long.** Il extrait d'abord la partie à modifier dans un composant ou un service, puis la modifie là.
5. **Pas de grand découpage sans filet.** Les découpages complets (A-6, B-7) attendent que les tests des parcours (B-8) soient en place : ils touchent beaucoup de code sans rien changer de visible.
6. **Commentaires.**
   - Chaque fichier commence par un commentaire qui dit son rôle, comme le font déjà les écrans de l'application.
   - Chaque fonction exportée a une ligne qui dit ce qu'elle rend.
   - Un commentaire explique pourquoi (une règle de l'école, un piège, une limite), pas ce que la ligne fait déjà.
   - En français. Pas de code laissé en commentaire.
7. **Revue croisée** : chaque PR est relue par l'autre groupe, qui refuse un fichier nouveau trop long, une fonction exportée sans commentaire ou une règle métier écrite dans une page ou un contrôleur.

## 5. Les tâches

Effort : **S** = une demi-journée au plus ; **M** = 1 à 3 jours ; **L** = plus de 3 jours. Le détail de chaque lot est dans `assainissement.md`, § 5, et `remarques-par-profil.md`, § 7.

### D'abord : le lot 0, par le chef de projet seul

**Aucun groupe ne commence avant 0-1 et 0-2.**

| Ordre | Lot | Action |
|---|---|---|
| 1 | **0-1** | Le dépôt est privé. Reste à réécrire l'historique pour retirer `docs/users.xlsx` et les fichiers audio. |
| 2 | **0-5** | Commiter ou écarter le travail en cours de `../StudyLib` (11 fichiers) et de `../ClassQuiz` (1 fichier). |
| 3 | **0-2** | Commiter les deux plans et ce compte rendu, ouvrir la PR vers `main` (elle n'existe pas encore), la fusionner une fois la CI verte. |
| 4 | **0-4** | Valider le gel du périmètre (`assainissement.md`, § 3.2 et 3.3). |
| 5 | **0-3** | Refaire le paquet maj29 depuis `main`, avec une nouvelle image du backend, le déployer, dérouler la recette. |
| En parallèle | **V-1** | La vidéo, une fois D-1 et R-7 fusionnés : les écrans ne doivent plus bouger. |

### Groupe A (socle)

| Ordre | Lot | En bref | Effort |
|---|---|---|---|
| 1 | **A-1** | Remplacer `docs/users.xlsx` par un modèle d'import avec des personnes fictives. | S |
| 2 | **A-2** | Vérifier qu'aucun compte de production n'a de mot de passe de démonstration, et le noter dans la recette. La partie « identifiants de test » vit dans `frontend/` : elle revient au groupe B, avec B-8. | S |
| 3 | **R-11, côté serveur** | Séances sans appel validé marquées « à vérifier » dans les heures du mois et l'export des vacataires ; l'administration les confirme ou les écarte. L'appel est un indice, pas une preuve : le dire dans les libellés renvoyés. **À fusionner avant que le groupe B écrive l'écran.** | M |
| 4 | **CQ-1** | Route signée de démarrage d'une partie, relais `/socket.io/` dans nginx. **À fusionner avant CQ-2 du groupe B.** | M |
| 5 | **A-9** et **R-3** | Procédure de retour arrière ; `preparer-maj.sh` s'arrête si les dépendances du backend ont changé. | S |
| 6 | **A-4** et **Q-1** | ESLint pour le backend, bloquant dans la CI ; `max-lines` à 300 en avertissement. | M |
| 7 | **A-3** | Sauvegarde quotidienne hors du serveur, restauration testée. Demande une décision (§ 6). | M |
| 8 | **D-2** | Devoirs fermés côté serveur par `DEVOIRS_ACTIFS`, éteinte par défaut ; le code et les tests restent. Après D-1 du groupe B. | S |
| 9 | **R-2** | `FORK.md` dans le dépôt du quiz. | S |
| Ensuite | A-5, A-7, A-8, A-10 | Priorité 2. | |
| Plus tard | A-6 (après B-8), R-12, routes de R-10 et R-13, relevé mensuel de l'enseignant | | |

### Groupe B (interface)

| Ordre | Lot | En bref | Effort |
|---|---|---|---|
| 1 | **B-1** | Finir la suppression du code mort du site : fichiers que plus rien n'importe (`hooks/api/`, `services/domains/`, `services/queries/`, `apiClient.js`, `queryClient.js`, `services/index.js`, et trois fichiers isolés) et dépendance `@tanstack/react-query`. Le fournisseur est déjà retiré. | S |
| 2 | **D-1** | Masquer les devoirs sur le site et dans l'application par un seul interrupteur dans `shared/` : page Activités, « Mes classes », quiz par l'IA « en devoir », onglet Jeux de l'application, écran de devoir, fiches d'aide. Aucun fichier supprimé. | M |
| 3 | **R-7** | « Bibliothèque », « Quiz », « Activités » et « Planner » dans tous les écrans du site et de l'application. | S |
| 4 | **B-8** | Tests Playwright des parcours de démonstration dans la CI, avec les identifiants lus dans des variables d'environnement. **Le parcours « quiz donné en devoir » sort de la liste** ; son remplacement est à valider (§ 6). Le plus long : commencer par connexion et appel par QR. | L |
| 5 | **R-11, côté écran** | Après la fusion de la route du groupe A. | S |
| 6 | **CQ-2**, **CQ-3** | Écran du projecteur dans Planner, lien « Quiz ». Après CQ-1 du groupe A. | M |
| 7 | **Q-2** | `max-lines` à 300 en avertissement dans `frontend/` et `mobile/`. | S |
| 8 | **B-5**, **B-6** | Trois `window.confirm` à remplacer par `ConfirmDialog` ; menu d'export réduit à trois entrées. | S |
| 9 | **B-9** | Test des fiches d'aide ; fiches mises à jour après D-1 et B-6. | S |
| 10 | **R-8** | La promesse sur la page d'accueil. Attend la phrase du chef de projet (§ 6). | S |
| Ensuite | B-2, B-3, R-6, R-14 | Priorité 2. Pour B-2, **ne pas demander le fuseau au navigateur**. | |
| Plus tard | B-4, B-7 (après B-8), écrans de R-9, R-10 et R-13, onglet Menu, espace Carrière, scan d'un jeu | | |

## 6. Décisions attendues du chef de projet

- **B-8** : quel parcours remplace « quiz donné en devoir » ? Proposition : « quiz généré par l'IA, relu puis créé », avec une fausse IA.
- **Fichiers inutiles** : la suppression demandée le 11 octobre au soir a été bloquée par le garde-fou de la session. La liste est prête ; le chef de projet la lance ou l'autorise.
- **Sauvegardes** (A-3) : où les envoyer hors du serveur, et qui en a l'accès ?
- **Paie** : faire valider le relevé mensuel par la scolarité de HESTIM (quel document déclenche aujourd'hui le paiement d'un vacataire, et qui le signe ?).
- **Fournisseur d'IA** : la décision de l'école bloque IA-7.
- **La promesse** (R-8) : la phrase proposée est un point de départ.
- **Défis du terminal dans un quiz** (J-1) : reporté, à confirmer.
- **Compte « actif »** : au moins une connexion dans le mois ?

## 7. Ce qui a été construit le 10 et le 11 octobre

Tout est commité dans Planner.

- « Mes classes » (`/mes-classes`) et rappel de l'appel 5 minutes avant la fin de la séance.
- Appel projeté (`/appel/:id/projection`) : le QR sans le menu, les présents qui apparaissent, validation, liste complète avec les absents.
- Quiz par l'IA de bout en bout, sauf la mise à jour d'un quiz et l'éditeur « Mes quiz ».
- Séance confirmée par défaut : une séance planifiée et passée devient réalisée d'office.
- Lancement du quiz sans reconnexion, dans le même onglet, avec un lien de retour.
- Nom visible **PlannerQuiz** pour le service de quiz (les noms techniques « ClassQuiz » ne changent pas).
- Réservations de salle réservées à l'administration.
- Bouton d'aide : 14 fiches pour l'administration, 12 pour l'enseignant, 4 pour l'étudiant.

**Retiré le 10 octobre** : surveillances côté enseignant, devoirs « fichier », retours anonymes, confirmation et marquage « réalisée », offre de stage et boutons « bientôt » de « Mes classes », création de notifications à la main.

**Pas encore essayé** : un vrai téléphone qui scanne l'écran, le vrai fournisseur d'IA, le lancement du quiz entre les deux sites en ligne.

## 8. Repères pratiques

- **Tests du backend** : `npm test` et `npm run test:integration` dans `backend/`, avec le conteneur `hestim_mysql_test` (port 3307). Les suites d'intégration se lancent **une à la fois** : elles partagent leur base.
- **Site** : `npm run lint` (0 erreur attendue, 7 avertissements connus avant Q-2) et, depuis PowerShell, `$env:VITE_API_URL="/api"; npm run build`.
- **Application** : lire `mobile/AGENTS.md` avant de toucher à une API d'Expo ; `npx expo lint` avant de déclarer un lot fini.
- **Tests de la bibliothèque** : `php vendor/bin/phpunit --no-coverage` dans `../StudyLib` (SQLite en mémoire).
- **Tests Python du quiz** : ils demandent PostgreSQL, Redis et Meilisearch (trois conteneurs jetables suffisent).
- **Essai dans un navigateur sans toucher aux données** : créer une base à part dans `hestim_mysql_test` (son nom doit finir par `_test`), lancer le serveur dessus, piloter avec Playwright (`frontend/node_modules`).
- **Paquet de mise à jour** : les dépendances du backend ont changé (`pdfjs-dist`, `mammoth`, `jszip`). Construire l'image (`docker build -t claude20022002/hestim-backend:latest --build-context shared=./shared ./backend`), la charger sur le serveur **avant** `appliquer-maj.sh`, et garder l'ancienne sous une étiquette à part.
- **Fuseau** : le Maroc est à UTC+0 toute l'année depuis le 20 septembre 2026 (`backend/tzdata/LISEZMOI.md`).
- **Façon de travailler** : le chef de projet commite et pousse souvent lui-même. Vérifier `git status` et `git log` avant d'annoncer ce qui reste à commiter.
