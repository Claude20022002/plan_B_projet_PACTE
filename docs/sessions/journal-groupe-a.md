# Journal du groupe A (socle)

Avancement, demandes au groupe B et questions au chef de projet. Une entrée par session, la plus récente en haut.

## 11 octobre 2026

### Point de départ

- **Écart aux règles, à savoir avant de fusionner.** Le compte rendu demande d'attendre 0-1 et 0-2. Au démarrage, le dépôt était privé mais l'historique n'était pas réécrit, aucune PR n'était ouverte et `main` avait 47 commits de retard. Sur demande du chef de projet, le travail a quand même commencé, sur une branche partie de `feature/phase-e-timefold` (`cc0d028`) et non de `main`, comme l'a fait le groupe B.
- Le dossier de travail du groupe A est passé de `feature/phase-e-timefold` à `a/a1-modele-import`.
- Rien n'a été poussé.

### A-1 : modèle d'import (branche `a/a1-modele-import`)

**Fait.**
- `docs/modeles/modele-etudiants.xlsx` et `docs/modeles/modele-enseignants.xlsx` : mêmes colonnes que les modèles CSV proposés par le site, deux personnes fictives chacun, adresses en `@exemple.hestim.test`, aucune colonne de mot de passe.
- `docs/modeles/README.md` : où importer chaque fichier, colonnes obligatoires, pièges (groupe inconnu, statut).
- `.gitignore` : `*.xlsx` et `*.xls` écartés, sauf `docs/modeles/*.xlsx`.

**Reste à faire, par le chef de projet.** La suppression de `docs/users.xlsx` a été bloquée par le garde-fou de la session. Le fichier est toujours versionné. Sur la branche `a/a1-modele-import` : `git rm docs/users.xlsx`, puis commit. Sans cela, le résultat attendu du lot (« aucun vrai nom n'est versionné ») n'est pas atteint. L'historique reste à réécrire (lot 0-1).

**Vérifié.** Les deux modèles relus avec les options de lecture du site (`frontend/src/utils/fileImport.js`) : une feuille, deux lignes, colonnes identiques aux modèles CSV, toutes les adresses dans le domaine fictif.

**Pas vérifié** : un import réel des deux fichiers depuis le site, serveur lancé.

**Choix à connaître.** `docs/users.xlsx` avait les colonnes `nom, prenom, email, role, telephone, password`, celles de `POST /api/users/import`. Aucune page du site n'appelle plus cette route : les modèles suivent donc les deux imports que l'administration utilise vraiment (Étudiants, Enseignants).

### A-2 : mots de passe de démonstration (branche `a/a2-mots-de-passe-demo`, à la suite d'A-1)

**Fait.**
- `deploy/vps/verifier-mots-de-passe-demo.mjs` : essaie `password123` (seed) et `Hestim@2026` (tests) sur chaque compte, plus ceux donnés dans `MOTS_DE_PASSE`. Lecture seule. Il liste les comptes concernés et sort avec le code 1 s'il y en a.
- Recette, section 0 : une case pour ce contrôle, avec la date du dernier passage à noter.
- `DEPLOIEMENT.md` : la liste de contrôle ne demande plus de se connecter avec `admin@hestim.ma` / `password123`.

**Vérifié**, sur une base jetable (`hestim_a2_test`, supprimée ensuite) : base saine, « OK » et code 0 ; un compte en `password123`, listé et code 1 ; un mot de passe donné par `MOTS_DE_PASSE`, listé aussi. Une empreinte illisible ne fait pas échouer le script.

**Reste à faire, par le chef de projet** : lancer le script sur le serveur de production et noter le résultat dans la recette. Tant que ce n'est pas fait, le lot n'est pas fini. Si d'anciens mots de passe de démonstration ont circulé (captures, messages), les passer dans `MOTS_DE_PASSE`.

**À savoir pour la fusion** : le script a été commité sur `a/a1-modele-import` (`3fb4d50`) avant la création de la branche d'A-2. La branche d'A-1 contient donc un fichier d'A-2 ; fusionner A-1 puis A-2, dans cet ordre.

**Hors du groupe A** : les identifiants de test lus dans des variables d'environnement vivent dans `frontend/` (groupe B, avec B-8).

### R-11, côté serveur : séances à vérifier avant la paie (branche `a/r11-seances-a-verifier`, à la suite d'A-2)

**Fait.**
- **État d'une séance réalisée** (`backend/services/planning/visaSeances.js`) : `appel_valide` (l'enseignant a fermé l'appel), `a_verifier` (pas d'appel validé, pas de décision), `confirmee` ou `ecartee` (décision de l'administration). La décision l'emporte toujours sur l'appel.
- **Table `VisasSeance`** (migration 0039) : une ligne par séance décidée, avec le motif, l'administrateur et la date.
- **Heures du mois** (`GET /api/suivi/enseignants`) : `heures_realisees` ne compte plus les séances écartées ; trois champs s'ajoutent.
- **Export des vacataires** : les séances écartées n'y sont plus ; une colonne `etat` s'ajoute en dernière position.
- **Deux routes nouvelles**, réservées à l'administration (contrat ci-dessous).

**Vérifié.** Suite d'intégration `suivi` : 9 tests sur 9, dont 4 nouveaux (à vérifier dans les heures, la liste et l'export ; appel lancé puis validé ; écarter, confirmer, annuler ; refus). Tests unitaires : 180 sur 180. Suite d'intégration complète : 345 sur 345 (31 fichiers).

**Pas vérifié** : la migration 0039 sur une copie de la base de production.

**Limites à connaître.**
- Une séance à vérifier **part quand même dans l'export**, marquée « à vérifier ». C'est la lettre du lot. La règle « sans visa, rien ne part » (`remarques-par-profil.md`, § 8, étape 3) n'est pas appliquée : question au chef de projet ci-dessous.
- Écarter une séance ne change pas l'avancement des modules : la séance y reste « réalisée ».
- La décision n'est pas inscrite au journal de sécurité ; la table garde qui a décidé et quand.
- `backend/models/index.js`, déjà trop long, a grossi de deux lignes (enregistrement du modèle).

### CQ-1 : partie en direct lancée depuis Planner (branche `a/cq1-partie-signee`, à la suite de R-11)

Le lot touche **deux dépôts**. Dans Planner, tout est sur la branche. Dans `../ClassQuiz`, quatre fichiers sont modifiés sur `main` **sans commit** (le dossier est partagé avec le groupe B, je n'y ai pas changé de branche) : `classquiz/routers/hestim.py`, `classquiz/helpers/hestim.py`, `classquiz/socket_server/__init__.py`, `classquiz/tests/test_hestim.py`.

**Fait.**
- **Moteur, route signée** `POST /api/v1/hestim/parties` : crée la partie d'un quiz de l'enseignant (pas d'un quiz public d'un autre compte), sans captcha, et rend son code et son identifiant. Elle n'envoie pas le webhook « partie démarrée » : Planner enregistre lui-même la partie.
- **Planner** `POST /api/quiz/parties` `{ id_quiz, id_affectation? }` (`backend/services/quiz/lancement.js`) : demande la partie au moteur, la rattache à la séance désignée (ou à la séance en cours), prévient les étudiants, rend de quoi animer la partie.
- **Relais** `/socket.io/` sur l'adresse de Planner, dans `deploy/Caddyfile` et `deploy/vps/Caddyfile.vps`. Les cookies de Planner n'y sont pas transmis au moteur.
- **Paquet de mise à jour** : `preparer-maj.sh` emporte `Caddyfile.vps` ; `appliquer-maj.sh` le valide, le met en place et recharge Caddy seulement s'il a changé, puis contrôle le relais.
- **Client du moteur sorti de `devoirs.js`** (441 lignes, 381 après) vers `backend/services/quiz/clientClassQuiz.js`.

**Faille corrigée dans le moteur.** Le moteur donnait la main sur une partie à **quiconque connaissait son code à six chiffres**, que tous les étudiants reçoivent : l'identifiant envoyé n'était pas comparé. Essai sur un moteur jetable, avant correction : faux identifiant, main prise ; code inconnu, main prise. Même défaut sur la télécommande (`register_as_remote`), qui renvoie en plus les questions avec leurs réponses. Les deux vérifient maintenant l'identifiant de la partie. **Cette faille existe en production tant que le moteur n'est pas redéployé.**

**Vérifié.**
- Planner : 4 tests nouveaux (`quizLancement.test.js`). Tests unitaires : 180 sur 180. Suite d'intégration complète : 349 sur 349 (32 fichiers).
- Moteur : 13 tests Python sur 13 (`test_hestim.py`, 2 nouveaux), lancés dans l'image de l'API.
- De bout en bout, moteur, base et Redis jetables, appelés par le client signé de Planner : partie créée ; quiz d'un collègue, compte inconnu et demande mal formée refusés (422) ; corps modifié, mauvais secret et signature absente refusés (401) ; le code et l'identifiant rendus donnent la main par le WebSocket ; faux identifiant et code inconnu refusés après correction.
- Relais, sur des conteneurs Caddy jetables : les deux fichiers sont valides ; `/socket.io/` part vers le moteur sans cookie, le reste du site garde ses cookies, l'adresse du quiz est inchangée.

**Pas vérifié.**
- `appliquer-maj.sh` sur le serveur : le rechargement de Caddy n'a été essayé que sur Docker Desktop.
- L'écran d'animation et la télécommande du site ClassQuiz dans un navigateur, après la correction (ils envoient bien l'identifiant, d'après leur code). Une case de recette le demande.
- Les tests Python qui demandent PostgreSQL, Redis et Meilisearch (`test_server.py`…).

**Limites à connaître.**
- Une partie créée mais jamais animée reste proposée aux étudiants pendant deux heures, comme aujourd'hui.
- Le moteur refuse une seconde prise de main : si l'enseignant recharge l'écran du projecteur, la partie est perdue. À traiter avec CQ-2.
- `backend/services/quiz/parties.js` (déjà trop long) a grossi d'une ligne.
- La liste des quiz de l'enseignant est servie par `GET /api/devoirs/quiz-disponibles` : D-2 ne devra pas la fermer avec les devoirs.
- Le texte d'un refus du moteur passe de « a refusé le quiz » à « a refusé la demande ».

### A-9 et R-3 : retour arrière et contrôle des dépendances (branche `a/a9-retour-arriere`, à la suite de CQ-1)

**Fait.**
- **R-3** : `deploy/vps/verifier-dependances.mjs` compare `backend/package-lock.json` aux modules réellement installés dans l'image du backend. `preparer-maj.sh` le lance contre l'image du PC et s'arrête si un module manque ou change de version. `appliquer-maj.sh` le relance contre l'image en ligne, avant toute sauvegarde ou construction : c'est ce second contrôle qui fait foi, car l'image du PC peut être plus récente que celle du serveur.
- **A-9, procédure** : `DEPLOIEMENT.md` s'ouvre sur le serveur de production : mise à jour par paquet, changement de dépendances (reconstruire, garder l'ancienne image sous `avant-image-majNN`, charger), retour arrière (code seul ; avec migration ; quiz, bibliothèque, aiguillage).
- **A-9, nettoyage** : `deploy/vps/nettoyer-paquets.sh` garde les 3 derniers paquets et les 3 dernières images `avant-<date>`. Sans `--supprimer`, il ne fait que montrer.
- **Lot 0-5, la part du groupe A** : avec `--classquiz`, le fichier `VERSION` du paquet porte le commit du quiz et ses fichiers non commités.
- Le paquet emporte `nettoyer-paquets.sh`, et `appliquer-maj.sh` l'installe sur le serveur.

**Vérifié.**
- Contrôle des dépendances : image récente du PC, « identiques » ; image d'avant le lot IA, arrêt avec 23 modules absents (`pdfjs-dist`, `mammoth`, `jszip` et leurs dépendances). Même résultat lancé dans l'image, comme le fait `appliquer-maj.sh`.
- `preparer-maj.sh` complet : un paquet d'essai préparé puis supprimé ; il contient le contrôle, l'aiguillage et le `package-lock.json`.
- Nettoyage : dossier factice et étiquettes d'images factices, à blanc puis avec `--supprimer`. Sur le vrai dossier `deploy/vps/paquets` (17 paquets), **à blanc seulement** : rien n'y a été supprimé.
- Restauration avec migration (cas 2 du guide), déroulée telle qu'écrite sur une base jetable : la table ajoutée par la « migration » disparaît, la base retrouve ses 67 tables et ses 39 migrations.

**Pas vérifié : la procédure n'a pas été suivie à blanc sur le serveur.** C'est le résultat attendu du lot A-9 ; il reste au chef de projet. Le retour arrière des images et le rechargement de Caddy n'ont été essayés que sur ce PC.

**À savoir.**
- Le site a été reconstruit (`frontend/dist`, non versionné) : l'ancien build venait de Git Bash et bloquait `preparer-maj.sh`.
- Le contrôle des dépendances ignore les modules que le paquet apporte lui-même (`MODULES_SUPERPOSES`, aujourd'hui `proxy-addr`).
- Le guide dit de vider la base avant de la restaurer : une restauration par-dessus laisserait les tables de la migration, et le paquet suivant échouerait.

### A-4 et Q-1 : ESLint pour le backend (branche `a/a4-eslint-backend`, à la suite d'A-9)

**Fait.**
- `backend/eslint.config.js` : règles recommandées, comme le site ; une variable ou un import inutilisé est une erreur. `npm run lint` dans `backend/`.
- **CI** : étape « Lint » ajoutée au travail « Test Backend », bloquante, avant les tests.
- **Q-1** : `max-lines` en avertissement, 300 lignes par fichier et 200 pour un contrôleur, hors lignes vides et commentaires.
- **19 erreurs levées**, dont 16 dans le code : 9 imports ou variables jamais utilisés, 2 `catch` dont l'erreur n'était pas lue, 1 paramètre d'Express renommé `_next`, 2 expressions régulières de nettoyage annotées (elles visent exprès les caractères de contrôle), 1 espace insécable écrite en clair remplacée par son code, 1 calcul corrigé (ci-dessous). Les 3 autres, dans un test, étaient des champs écartés exprès (`const { a, ...reste }`) : la règle les accepte désormais.
- **Un défaut corrigé au passage** (`services/planning/edtMensuel.js`) : l'année d'un groupe sans chiffre dans son niveau valait « NaN » au lieu de rester vide. Le `?? null` qui devait l'éviter ne servait à rien.

**Vérifié.** `npm run lint` : 0 erreur, 18 avertissements de longueur. Un fichier d'essai avec une variable inutilisée fait sortir le lint en erreur (code 1). Les dépendances livrées n'ont pas changé (ESLint est un outil de développement) : le contrôle R-3 répond « identiques », l'audit passe. Tests unitaires : 180 sur 180. Suite d'intégration complète : 349 sur 349 au second passage.

**Un passage instable, à surveiller.** Au premier passage complet, `presences.test.js` a échoué en entier (17 tests) après 32 secondes, soit le délai de 30 secondes accordé à la préparation de la base. Relancée seule, la suite passe ; relancé en entier, tout passe. Même symptôme au premier passage de R-11 sur `suivi.test.js`. La cause n'est pas établie : la machine faisait tourner Docker et le lint en même temps. Si la CI montre le même échec, le délai de préparation est à relever.

**Les 18 fichiers signalés** (lignes comptées par le lint) :
- contrôleurs, repère 200 : `authController` 562, `emploiDuTempsController` 427, `demandeReportController` 416, `statistiquesController` 386, `etudiantController` 351, `enseignantController` 277, `affectationController` 266, `userController` 222 ;
- autres, repère 300 : `seed.js` 821, `validationMiddleware.js` 544, `models/index.js` 517, `services/annonces/annonces.js` 344, `services/quiz/parties.js` 334, `services/planning/affectationRules.js` 310, `services/ia/quiz.js` 308, `services/quiz/devoirs.js` 306, et deux fichiers de tests (310 et 305).

C'est la liste de départ d'A-6, qui attend B-8.

**Pas vérifié** : la CI elle-même, qui ne tourne qu'à l'ouverture d'une PR.

### Fusion des six premiers lots

Sur demande du chef de projet, les branches `a/a1-modele-import`, `a/a2-mots-de-passe-demo`, `a/r11-seances-a-verifier`, `a/cq1-partie-signee`, `a/a9-retour-arriere` et `a/a4-eslint-backend` sont fusionnées dans `feature/phase-e-timefold`, **en local**, avec un commit de fusion par lot (20 commits d'avance sur `origin`). Elles ne sont pas fusionnées dans `main` : cela reste le lot 0-2 (PR vers `main`, CI verte). Rien n'a été poussé par le groupe A.

### A-3 : sauvegarde quotidienne hors du serveur (branche `a/a3-sauvegarde-quotidienne`)

**Fait.**
- `deploy/vps/sauvegarder.sh` : exporte les bases MySQL de la plateforme (Planner et la bibliothèque, sans les bases système) et la base PostgreSQL du quiz, chiffre chaque export (GPG, AES-256), l'envoie hors du serveur avec `rclone`, garde 14 jours sur le serveur et à distance.
- `DEPLOIEMENT.md`, « Sauvegarde quotidienne » : mise en place en six étapes, lecture du résultat, restauration.
- Le paquet de mise à jour emporte le script ; une case de recette demande de lire le journal de la nuit.

**Choix faits sans attendre la décision sur la destination.**
- **`rclone` pour l'envoi** : il sait écrire vers un autre serveur, un stockage objet ou un Drive, les trois pistes du plan. La destination n'est qu'un réglage.
- **Chiffrement obligatoire** : une sauvegarde contient les comptes, les présences et les notes, et elle quitte le serveur. Sans phrase de chiffrement, le script refuse de tourner.
- **Sans destination, le script sort en code 3** après avoir fait les sauvegardes sur le serveur : le lot n'est pas rempli tant que rien ne sort.

**Vérifié**, sur ce PC, avec la base de test, une base de quiz jetable et `rclone` vers un dossier « distant » :
- passage complet : deux fichiers chiffrés, envoyés, code 0 ; aucun fichier en clair sur le disque ;
- rétention : un fichier de 20 jours est supprimé des deux côtés ; un fichier étranger à la destination n'est pas touché ;
- sans phrase : refus, code 1 ; sans destination : code 3 ; envoi en échec : code 3, les fichiers restent sur le serveur ;
- export MySQL en échec : aucun faux fichier laissé, le quiz part quand même, code 1 ;
- **restauration sur un serveur MySQL vide** : les 6 bases retrouvent leur nombre de tables et de comptes, le mot de passe du serveur qui reçoit ne change pas ; restauration du quiz dans une base vide ; une mauvaise phrase est refusée.

**Un défaut trouvé à l'essai et corrigé** : un export en échec laissait un fichier chiffré de 1 Ko, annoncé « ok ». Il aurait été envoyé comme une sauvegarde.

**Pas vérifié** : rien sur le serveur (installation de `rclone` et `gnupg`, cron, vraie destination). Le résultat attendu du lot, « une restauration réussie est documentée », est rempli sur ce PC, pas en production.

**Limites.** Les fichiers ne sont pas sauvegardés (documents de la bibliothèque dans MinIO, images des quiz). Personne n'est prévenu d'un échec : il faut lire le journal.

### D-2 : devoirs fermés côté serveur (branche `a/d2-devoirs-fermes`, à la suite d'A-3)

**Fait.**
- `backend/services/quiz/devoirsActifs.js` : l'interrupteur `DEVOIRS_ACTIFS`, éteint par défaut (seule la valeur `true` ouvre les devoirs), et la garde des routes.
- **Routes `/api/devoirs`** : fermées, elles répondent 503 avec `{ message, code: "DEVOIRS_FERMES" }`. **`GET /api/devoirs/quiz-disponibles` reste ouverte** : elle sert aussi à lancer une partie en direct (CQ-1).
- **Activités** (`GET /api/activites`) et **historique de l'enseignant** (`GET /api/jeux/historique`) : plus aucun devoir. Le champ `devoirs` de chaque module reste dans la réponse, vide, pour ne pas changer son format.
- Variable documentée dans `backend/.env.example` et `.env.docker.example`. Les tests tournent avec la variable allumée (`setupEnv.js`).
- Aucun fichier, aucune table, aucune migration retirés.

**Vérifié.** Un test nouveau dans `devoirs.test.js` : variable éteinte, les six routes répondent 503, la liste des quiz 200, une requête sans jeton 401 ; les activités de l'étudiant et de l'enseignant et l'historique ne citent plus le devoir, qui reste en base ; variable rallumée, tout revient. Les cinq suites touchées (devoirs, jeux, « Mes classes », lancement du quiz, quiz par l'IA) : 59 tests sur 59. Suite d'intégration complète : 350 sur 350 (32 fichiers). Tests unitaires : 180 sur 180. Lint : 0 erreur, 18 avertissements, comme avant.

**Pour rallumer les devoirs** : `DEVOIRS_ACTIFS=true` dans `.env.docker` du serveur, puis redémarrer le backend ; et `DEVOIRS_ACTIFS = true` dans `shared/fonctions.js` (groupe B), puis reconstruire le site et l'application.

**Limites.**
- Les notifications « Nouveau devoir » déjà envoyées restent dans la liste de l'étudiant ; leur lien ramène aux activités (D-1). Pas de réponse du chef de projet : laissées.
- En production, la variable est absente de `.env.docker` : les devoirs seront donc fermés dès le déploiement, sans rien ajouter.

### Moteur de quiz : la correction de la prise de main était incomplète (`../ClassQuiz`, non commité)

La correction écrite avec CQ-1 compare l'identifiant de la partie. Relue le 11 octobre : **l'identifiant restait donné à tout joueur**, par deux chemins. Un étudiant qui avait le code pouvait donc toujours prendre la main, ou lire les réponses par la télécommande.

**Fait**, dans trois fichiers de plus :
- `classquiz/db/models.py`, `to_player_data` : l'identifiant ne part plus dans `joined_game` ni `rejoined_game`, envoyés à chaque joueur.
- `classquiz/routers/quiz.py`, `GET /api/v1/quiz/join/{game_pin}` : cette route ouverte à tous rendait l'identifiant à qui donnait le code. Elle répond maintenant `{ "exists": true }`. Ni le site du quiz, ni l'application, ni Planner ne l'appellent.
- `classquiz/socket_server/__init__.py`, `set_control_visibility` : réservé à qui anime la partie (un joueur pouvait masquer les commandes de l'enseignant).

**Vérifié.** `test_hestim.py` : 14 tests sur 14 dans l'image de l'API (1 nouveau : ce qu'un joueur reçoit ne contient pas l'identifiant). Les clients ne lisent pas l'identifiant côté joueur : l'application ne lit que `started` et `game_mode` ; le site du quiz ne s'en sert que pour une statistique.

**Pas vérifié.**
- Une partie complète dans un navigateur après ces trois changements (animation, télécommande, joueur).
- `test_server.py`, adapté à la nouvelle réponse de la route, demande PostgreSQL, Redis et Meilisearch : il n'a pas tourné.

**Reste à faire, par le chef de projet** : commiter les sept fichiers Python de `../ClassQuiz` (pas `frontend/static/site.webmanifest`, qui n'est pas de ce lot), puis déployer le moteur avec `--classquiz`. **La faille reste ouverte en production jusque-là.**

### Demandes au groupe B

- **Site du quiz, page du joueur** : `frontend/src/routes/play/+page.svelte` envoie `gameData.game_id` à la statistique « Joined Game ». Le moteur ne le fournit plus : retirer cette propriété.
- **CI** : `.github/workflows/ci-cd.yml` est modifié par A-4 (une étape « Lint » dans « Test Backend »). B-8 se met à jour sur cette branche fusionnée avant d'y toucher.
- **CQ-2, écran du projecteur** : à écrire après la fusion de `a/cq1-partie-signee` et le redéploiement du moteur. Contrat :
  - `POST /api/quiz/parties`, corps `{ id_quiz, id_affectation? }`, enseignant seulement. `id_quiz` vient de `GET /api/devoirs/quiz-disponibles`. Rend 201 et `{ id_quiz_partie, id_affectation, titre, nb_questions, notifies, animation: { game_pin, game_id, socket } }`.
  - Refus : 400 (quiz mal formé), 403 (pas enseignant), 404 (séance inconnue ou d'un collègue), 409 (séance d'un autre jour, annulée ou reportée), 422 (quiz inconnu du moteur pour cet enseignant), 502 ou 503 (moteur injoignable, pas à jour ou non configuré).
  - L'écran ouvre un client socket.io sur la même origine, chemin `animation.socket` (`/socket.io/`), puis émet `register_as_admin` avec `{ game_pin, game_id }`. Le moteur répond `registered_as_admin` (la partie, avec ses questions) ou `error`.
  - **`animation.game_id` donne la main sur la partie.** Il n'est rendu que par cette route : ne pas le mettre dans une adresse, un journal ou le stockage du navigateur.
  - En développement, le serveur Vite doit relayer `/socket.io/` vers le moteur (fichier du groupe B).
- **Site ClassQuiz** (`../ClassQuiz/frontend`, groupe B) : aucun changement demandé ; l'écran d'animation et la télécommande sont à réessayer après la correction du moteur.
- **R-11, côté écran** : la route est prête, sur la branche `a/r11-seances-a-verifier`. À écrire après sa fusion. Contrat :
  - `GET /api/suivi/enseignants?mois=AAAA-MM` : chaque ligne garde `heures_realisees` et gagne `heures_a_verifier` (part de `heures_realisees` sans appel validé ni décision), `heures_ecartees` et `seances_a_verifier` (un nombre).
  - `GET /api/suivi/seances-a-verifier?mois=AAAA-MM` rend `{ mois, note, a_verifier, seances }`. `note` est la phrase à afficher (« un appel validé est un indice, pas une preuve »). Chaque séance : `id_affectation`, `date`, `debut`, `fin`, `heures`, `module`, `groupe`, `salle`, `enseignants` (`id_user`, `nom`, `prenom`, `statut`), `etat` (`a_verifier`, `confirmee` ou `ecartee`), `libelle`, `appel_ouvert` (un appel a été lancé sans être validé), `motif`, `decide_le`. Les séances dont l'appel est validé n'y figurent pas.
  - `PUT /api/suivi/seances/:id/visa`, corps `{ decision, motif? }` : `decision` vaut `"confirmee"`, `"ecartee"` ou `null` (annuler la décision). Rend le nouvel état de la séance. 400 si la décision est inconnue, 404 si la séance n'existe pas, 409 si elle n'est pas réalisée.
  - L'export CSV ne change pas d'adresse.

- **Modèles CSV du site** : `MODELE_CSV` dans `frontend/src/pages/gestion/Etudiants.jsx` et `Enseignants.jsx` cite des noms plausibles avec des adresses `@hestim.ma`. Les remplacer par les personnes fictives de `docs/modeles/` (`@exemple.hestim.test`).
- **Journal de la console** : `frontend/src/utils/fileImport.js` écrit dans la console du navigateur toutes les lignes lues d'un fichier Excel (`console.log("Données parsées depuis Excel:", …)`), donc des noms et des adresses. À retirer.
- **D-2** et notifications « devoir » : demandes lues dans votre journal. D-2 est le lot 8 du groupe A ; la question des notifications est posée au chef de projet ci-dessous.

### Questions au chef de projet

- **A-3, la destination** : où envoyer les sauvegardes (autre serveur, stockage objet, Drive de l'école), et qui en détient l'accès ? Et où garder la phrase de chiffrement hors du serveur ? Le script est prêt ; il ne manque que ces réponses pour le mettre en service.
- **A-3, les fichiers** : faut-il sauvegarder aussi les documents de la bibliothèque et les images des quiz ?

- **Moteur de quiz, faille de prise de main** : la correction, complétée le 11 octobre, attend dans `../ClassQuiz` (7 fichiers Python, non commités). À commiter et à déployer avec `--classquiz` sans attendre le reste : aujourd'hui, un étudiant qui connaît le code d'une partie peut en prendre la main.
- **Dépôt du quiz** : faut-il une branche par lot dans `../ClassQuiz` aussi, et un dossier de travail par groupe comme pour Planner ?

- **R-11, l'export** : une séance « à vérifier » doit-elle partir dans l'export avec sa mention (fait aujourd'hui), ou en être retenue tant que l'administration ne l'a pas confirmée (« sans visa, rien ne part ») ? Le changement tient en une ligne.
- **R-11, l'avancement** : une séance écartée doit-elle aussi sortir des heures réalisées du module ?

- **`POST /api/users/import`** n'est plus appelée par le site. La garder (elle est testée), ou l'inscrire parmi les routes à retirer ?
- **Notifications « devoir » déjà envoyées** (question du groupe B) : les masquer côté serveur avec D-2, ou les laisser ?
- **A-2** : vérifier qu'aucun compte de production n'a de mot de passe de démonstration demande une commande sur le serveur. Le groupe A prépare la commande et la note dans la recette ; le chef de projet la lance.
