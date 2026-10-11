# Journal du groupe B (interface)

Avancement, demandes au groupe A et questions au chef de projet. Une entrée par session, la plus récente en haut.

## 11 octobre 2026, au soir

### Point de départ

- Dépôt privé (dit par le chef de projet). La soutenance n'est plus un repère : les lots suivent l'ordre du compte rendu, § 5.
- 0-1 (historique) et 0-2 (fusion dans `main`) ne sont toujours pas faits. Comme pour D-1, le travail part de `feature/phase-e-timefold` (`cc0d028`), dans `../planner-b`. Rien n'a été poussé.

### B-1 : code mort du site (branche `b/b1-code-mort`)

**Fait.**
- Supprimés : `hooks/api/`, `services/domains/`, `services/queries/`, `services/apiClient.js`, `services/queryClient.js`, `services/index.js`.
- Les trois fichiers isolés, trouvés en suivant les imports depuis `main.jsx` : `components/emploi-du-temps/OptimizedCalendar.jsx`, `design-system/components/MetricCard.jsx`, `hooks/useMemoized.js`.
- Dépendance `@tanstack/react-query` retirée, avec son chunk et son pré-bundling dans `vite.config.js` et l'exception du lint pour `MIGRATION_EXAMPLE.jsx`.
- `services/api.js` est la seule couche d'accès au serveur.

**Vérifié.** Aucun import restant vers ces fichiers ; lint : 0 erreur, les 7 avertissements connus ; build réussi.

**Pas vérifié** : les tests Playwright (ils demandent un serveur lancé ; B-8).

**Laissé** : `design-system/board/index.js`. Correction : il est bien importé (`pages/dashboard/EnseignantDashboard.jsx`) ; mon outil de recherche l'avait manqué. Il reste.

**Fusion.** Cette branche reprend le commit du journal de `b/d1-masquer-devoirs` : fusionner D-1 d'abord, puis B-1. Les deux lots ne touchent pas les mêmes fichiers de code.

### R-7 : noms des espaces (branche `b/r7-nommage`, dossier `../planner-b-r7`)

Partie de `b/d1-masquer-devoirs`, car D-1 et R-7 modifient les mêmes fichiers de textes. **Ordre de fusion : D-1, B-1, puis R-7.** Le journal n'est tenu que sur `b/b1-code-mort`, pour ne pas créer de conflit.

**Fait** (corrigé après les remarques du chef de projet, commit `629ab91`).
- Sélecteur d'espaces (`shared/espaces.js`, site et application) : **l'entrée « Jeux » est retirée**, on entre dans les Activités par le scan du QR projeté (`remarques-par-profil.md`, § 10). Le sélecteur liste Planner, Bibliothèque et Quiz ; la page Activités reste dans le menu du site.
- Quiz par l'IA : le message « aucun quiz » ne cite plus « PlannerQuiz ».
- Application, réglage Apparence : le thème garde son nom « StudyLib » (décision du chef de projet).
- Messages d'erreur de la page et de l'onglet Activités : « activités » au lieu de « jeux ».
- Les mots « jeu » et « jeux » restent quand ils désignent un contenu (« Tous les jeux », « Jeux de vos modules »), pas l'espace.

**Vérifié.** Plus aucun « StudyLib », « ClassQuiz » ou « PlannerQuiz » dans les textes affichés du site et de l'application (seulement dans des commentaires). Lint du site : 0 erreur, 7 avertissements connus ; build réussi ; `npx expo lint` : 0 erreur, 3 avertissements anciens ; tests de l'application : 32 sur 32.

**Hors du lot** : ni la bibliothèque ni le quiz n'ont de copie du sélecteur d'espaces, contrairement à ce que dit le commentaire de `SelecteurEspaces.jsx`.

### Demandes au groupe A (R-7)

- Des messages renvoyés par le serveur et affichés tels quels citent encore « PlannerQuiz » : `backend/services/quiz/devoirs.js` (l. 47 à 68), `backend/services/ia/quiz.js` (l. 344), `backend/routes/oidcRoutes.js` (l. 34 et 52). Proposition : « le service de quiz » ou « l'espace Quiz ». `client_name` (`services/oidc/provider.js`) peut rester « PlannerQuiz HESTIM » s'il n'est pas affiché.

### Scan d'un quiz (branche `b/scan-quiz`, partie de `b/r7-nommage`)

Demande du chef de projet : les Activités passent par le scan, comme sur Wooclap.

**Fait.**
- Application : le même viseur sert à l'appel et aux quiz. Un QR de quiz est l'adresse de la partie (`…/play?pin=…`), y compris celui que la salle d'attente du service de quiz projette déjà (`…&ref=Qr`). Tout autre code part à l'appel comme avant.
- La partie ne s'ouvre que si elle est lancée dans une séance de l'étudiant : l'application prend son lien personnel (nom, jeton) et ouvre le joueur natif, avec son anti-triche. Sinon, un message le dit.
- Écran renommé « Scanner », consigne « appel ou quiz ». Logique pure dans `mobile/src/quiz/scan.js`, testée.

**Vérifié.** Tests de l'application : 35 sur 35 ; `npx expo lint` : 0 erreur.

**Pas fait** : l'onglet Activités reste dans la barre du bas (question ci-dessous).

### CQ-2 : lancer et projeter un quiz en direct (branche `b/cq2-projecteur`, partie de `b/scan-quiz`)

Demande du chef de projet : l'enseignant met un quiz en place en quelques clics. Écrit contre la route de CQ-1 du groupe A (`POST /api/quiz/parties`, branche `a/cq1-partie-signee`), **à fusionner après elle**.

**Fait.** Trois gestes jusqu'à la première question : « Lancer un quiz » dans Mes classes (séance en cours), le quiz, « Démarrer ».
- Dialogue de lancement : mes quiz, un clic lance la partie et ouvre l'écran projeté. Lien vers la création par l'IA.
- Écran projeté `/quiz/projection`, sans menu : salle d'attente (QR scanné par l'application, code, joueurs), question avec compte à rebours, nombre de réponses par choix avec la bonne réponse mise en avant, classement final. Un seul bouton à la fois ; à la fin du temps, les réponses s'affichent seules.
- Le jeton d'animation voyage dans l'état de navigation, jamais dans l'adresse.
- Découpage : la page assemble (86 lignes) ; `hooks/useAnimationQuiz.js` parle au WebSocket ; quatre composants dans `components/quiz/projection/` ; calculs purs dans `utils/animationQuiz.js`, testés par `npm run test:unit` (lanceur de Node, sans dépendance).
- Écrans projetés sortis d'`App.jsx` dans `routes/projection.jsx` (`App.jsx` passe de 431 à 427 lignes). Plein écran et anti-veille partagés avec l'appel (`hooks/useEcranProjete.js`).
- Couleurs des réponses dans `shared/quiz/couleurs.js`, reprises par l'application.
- Dépendance ajoutée : `socket.io-client`, chargé seulement par l'écran projeté.

**Vérifié.** Lint du site : 0 erreur, 7 avertissements connus ; build réussi ; tests unitaires du site : 7 sur 7 ; tests de l'application : 35 sur 35.

**Pas vérifié** : une vraie partie, ni en local ni en ligne. Il faut le serveur avec CQ-1, le service de quiz et le relais `/socket.io/`. En local, Vite ne relaie pas `/socket.io/` : l'essai se fait derrière Caddy.

**Limites.** Le décompte par choix couvre les QCM, les cases à cocher et les votes ; pour le texte, l'intervalle et l'ordre, l'écran n'affiche que le nombre de réponses. Le nombre de « réponses reçues » pendant la question n'est qu'un indice (voir la demande ci-dessous).

### Données personnelles (branche `b/donnees-fictives`, partie de `cc0d028`)

Demandes du groupe A, faites : modèles CSV des pages Étudiants et Enseignants avec des personnes fictives (`@exemple.hestim.test`) ; l'import Excel n'écrit plus les lignes lues dans la console. Lint : 0 erreur.

### Demandes au groupe A (scan et CQ-2)

- **D-2 et la liste des quiz** : « Lancer un quiz » lit `GET /api/devoirs/quiz-disponibles`. Si D-2 ferme toutes les routes `/devoirs`, la liste se vide. Garder celle-ci ouverte, ou la déplacer (par exemple `GET /api/quiz/mes-quiz`, même réponse) : le site change alors une ligne de `api.js`.
- **Serveur de jeu** (`classquiz/socket_server/__init__.py`, l. 338 et 343) : `player_answer` et `everyone_answered` sont envoyés **à toutes les parties en cours**, sans salle. L'écran ne s'en sert que comme indice, mais deux classes qui jouent en même temps faussent le compteur de chacune. Proposition : `room=f"admin:{game_pin}"`.

### Questions au chef de projet

- **Onglet Activités de l'application** : `remarques-par-profil.md`, § 10, dit qu'il sort de la barre du bas. Le retirer maintenant, ou avec l'onglet « Menu » ? Il donne aujourd'hui accès aux jeux des modules (terminal Linux), que le scan ne remplace pas.
- **Ordre de fusion des branches du groupe B** : D-1, B-1, R-7, scan, puis CQ-2 (après CQ-1 du groupe A). `b/donnees-fictives` et `b/b8-parcours` sont indépendantes.

### B-8 : parcours de démonstration (branche `b/b8-parcours`, partie de `cc0d028`)

**Fait** (deux tranches sur trois).
- `npm run test:parcours` (`frontend/playwright.parcours.config.cjs`) : chaque passage repart d'une base jetable (`hestim_b_parcours_test`), préparée par `tests/parcours/serveur.mjs` avec les outils des tests d'intégration du serveur, **avant** son démarrage (Playwright lance les serveurs avant sa préparation globale). Les comptes sont créés à ce moment et écrits dans `tests/parcours/.donnees.json`, non versionné : **aucun identifiant n'est écrit dans les tests**.
- Ports du groupe B par défaut (5001, 5174), modifiables par `PARCOURS_PORT_API` et `PARCOURS_PORT_SITE`.
- **Connexion** : les trois rôles arrivent sur leur tableau de bord ; mauvais mot de passe refusé ; page protégée renvoyée à la connexion.
- **Appel par QR** : Mes classes → Faire l'appel → Projeter le QR code (fenêtre à part) ; trois scans simulés comme l'application ; les noms apparaissent, pas les absents ; validation et bilan.
- **Demande de report puis décision** : l'enseignante demande, l'administration approuve, l'enseignante voit « Approuvée ».

**Vérifié.** 7 tests sur 7, sur trois passages de suite.

**Pas fait.**
- Le parcours de la génération (il demande le solveur, ou un faux : `backend/tests/integration/generation.test.js` en lance déjà un, sur `SOLVER_URL`), et celui qui remplace « quiz donné en devoir » : décisions ci-dessous.
- L'entrée dans la CI : après A-4, qui modifie `.github/workflows/ci-cd.yml` en premier.
- L'ancienne suite `tests/app.spec.cjs` (928 lignes, mots de passe de démonstration écrits en dur, connexion par `localStorage` qui n'existe plus) est laissée telle quelle. Proposition : la retirer une fois B-8 dans la CI.
- Les fichiers `.cjs` et `.mjs` des tests ne sont pas couverts par le lint du site, qui ne lit que `.js` et `.jsx`.

### Réponses du chef de projet (B-8)

- **Parcours qui remplace « quiz donné en devoir »** : il s'appelle **« Créer un quiz »**, et l'écran doit être simplifié d'abord (ci-dessous). Le parcours s'écrira sur l'écran simplifié, avec une fausse IA.
- **Solveur** : il ne sert qu'à la planification (emploi du temps), pas aux quiz. Le parcours « génération puis publication » reste à trancher : vrai solveur dans la CI, ou faux solveur comme `backend/tests/integration/generation.test.js`.

### Créer un quiz en un geste (branche `b/creer-quiz`, partie de `b/cq2-projecteur`)

Demande du chef de projet : pas de long formulaire, le moins d'actions possible.

**Fait.**
- Un seul écran « Créer un quiz » : la classe (déjà choisie depuis Mes classes), un champ « Sujet du quiz » avec un trombone pour joindre un document, puis « Générer » ou « Le faire moi-même ». Plus de réglages : 10 questions à une bonne réponse, 30 secondes, dans la langue de l'écran ; tout se corrige à la relecture, avant la création.
- « Le faire moi-même » ouvre l'éditeur du service de quiz, déjà connecté (`adresseEditeurQuiz`, `shared/espaces.js`). Planner n'a pas encore d'éditeur à lui (reste d'IA-5).
- Le sujet saisi devient le titre proposé à la relecture.
- Le mot « IA » quitte les titres : panneau « Mes quiz » (Activités), bouton « Créer un quiz » (Activités, Mes classes, Lancer un quiz), fiche d'aide réécrite.
- Découpage : `QuizIa.jsx` passe de 511 à 120 lignes ; relecture, éditeur d'une question et règles du brouillon dans `components/quiz/creation/` et `utils/brouillonQuiz.js`, sans changement de comportement. Clés de texte du long formulaire retirées.

**Vérifié.** Lint : 0 erreur ; build réussi ; tests unitaires du site : 7 sur 7. Essai dans un vrai navigateur, sur la base des parcours, génération déclarée disponible et service de quiz configuré : classe pré-choisie, « Générer » désactivé avec un sujet seul et activé avec un document, « Le faire moi-même » vers l'éditeur.

**Pas vérifié** : une vraie génération (fausse IA à écrire avec le parcours B-8).

### Demande au groupe A (Créer un quiz)

- **Générer à partir d'un sujet seul**, sans document. Contrat proposé :
  - `GET /api/quiz-ia/disponibilite` rend en plus `sujet: true` quand c'est possible ; le site n'active le chemin qu'à cette condition.
  - `POST /api/quiz-ia/generations?…&sujet=<texte>` **sans corps** : les mêmes paramètres qu'aujourd'hui (`id_cours`, `id_groupe`, `nombre`, `type`, `difficulte`, `langue`, `temps`), le sujet (200 caractères au plus) et le nom du module guident l'IA. `nom_source` vaut le sujet. Le reste ne change pas (suivi, relecture, création).
  - Avec un document et un sujet, le document reste la source ; le sujet peut préciser la consigne.

### Décisions du chef de projet (suite)

- **Jeu ouvert par un scan** : dans une **vue navigateur**, comme Wooclap, tant que les quiz ne comptent pas dans la note. Le lecteur natif est gardé pour de futurs devoirs notés (QCM), car il bloque les captures. Fait sur `b/creer-quiz` : interrupteur `QUIZ_DANS_L_APPLICATION` (éteint) dans `shared/fonctions.js`, lu par le scanner et l'onglet Activités (`mobile/src/quiz/ouvrir.js`). Lint de l'application : 0 erreur ; 35 tests sur 35.
- **Génération dans les parcours** : avec le **vrai** solveur. Fait (ci-dessous).

### B-8, tranche 3 : génération puis publication (branche `b/b8-parcours`)

**Fait.** L'administration génère le S2 de la filière GEN depuis l'écran (calcul de 30 s) ; le rapport ne montre aucune règle dure enfreinte et signale le module sans enseignant ; la version générée devient active. Puis, sur les séances publiées : TP du vacataire sur ses seuls créneaux déclarés, en labo ; CM le lundi, hors du créneau pris par une séance posée à la main, dans une salle d'au moins 40 places ; férié sauté ; séance manuelle conservée ; aucun chevauchement pour la promotion et son TD.
- Le solveur est le conteneur construit depuis `solver/` (`docker build -t hestim-solver:parcours solver`), lancé par `tests/parcours/solveur.mjs` et retiré à la fin ; ou un solveur fourni par `PARCOURS_SOLVEUR_URL` (prévu pour la CI).

**Vérifié.** Suite complète : 8 sur 8.

**Reste pour B-8** : l'entrée dans la CI (après A-4 ; la CI devra construire l'image du solveur), et le parcours « Créer un quiz », avec une fausse IA.

### Vérification du solveur (demande du chef de projet)

**Conclusion : le solveur reçoit tous les paramètres nécessaires à la planification des cours, et les applique.**
- **Ce qu'il reçoit** (`backend/services/generation/timefold/probleme.js`) : la grille par régime (séances d'un ou deux créneaux consécutifs) ; les salles disponibles (type, capacité, équipements, campus) ; pour chaque enseignement, l'enseignant principal et les co-enseignants acceptés, les groupes et toute leur hiérarchie (un CM de promotion occupe ses TD et TP), l'effectif, le type de salle et les équipements requis, le distanciel, le campus de la filière ; les indisponibilités, vœux « éviter » et « préférer », et la règle des vacataires (disponibles seulement sur les créneaux déclarés) ; les heures maximales par jour (groupe, enseignant) ; le samedi après-midi ; les temps de trajet entre campus ; les séances déjà en place (posées à la main, autres filières), épinglées.
- **Ce qui est traité après lui, au déploiement sur les dates**, par les règles de planification : jours fériés, indisponibilités ponctuelles, examens, réservations (la date est sautée), variante Ramadan de la grille, semaines de début et de fin, volume prévu.
- **Ce qui le prouve** : les 14 tests Java du solveur passent (lancés dans le conteneur Maven, sur une copie de `solver/`) ; le parcours ci-dessus vérifie de bout en bout ce que le vrai solveur rend.

**À l'attention du groupe A** (`solver/` et `backend/` sont à lui) :
- Quatre contraintes n'ont pas de test unitaire dans `ContraintesTest.java` : équipements de la salle, campus de la filière, vœu « préférer », pas de salle en distanciel.
- Le plafond d'heures par semaine d'un enseignant (`max_heures_semaine`) n'entre pas dans le problème : le solveur ne peut pas le changer (les séances de la semaine sont fixées par les services), et les règles du déploiement ne font qu'avertir. Proposition : le signaler dès la préparation, comme les disponibilités insuffisantes (`avertissements` de `probleme.js`).
- Le samedi après-midi ne vaut que pour le régime initial (paramètre `samedi_apres_midi_initiale`) : c'est voulu d'après son nom, à confirmer pour l'alternance.
- Précision du chef de projet : **il n'y a pas de co-enseignant** à HESTIM. Le code les accepte, mais aucun scénario n'en utilise.

### B-8 : scénario IIIA, deux promotions (branche `b/b8-parcours`)

Demande du chef de projet : la 3A IIIA de l'emploi du temps de l'an dernier traitée comme une classe de cette année, à côté de la 4A IIIA d'octobre 2026, générées ensemble par le vrai solveur, pour regarder le résultat depuis deux profils.

**Fait.**
- `tests/parcours/donneesIiia.mjs` : modules, rythme hebdomadaire, salles et campus repris des deux PDF de `docs/` ; enseignants aux noms fictifs, partage gardé (une enseignante a cours avec les deux promotions) ; Business English par groupe de TD ; deux modules en distanciel ; un étudiant 3A (groupe 1) et un 4A.
- `tests/parcours/grille.mjs` : la grille de l'école, commune à tous les scénarios (quatre créneaux du lundi au vendredi, vendredi après-midi décalé, samedi matin). Le scénario GEN l'utilise aussi.
- `iiia.spec.cjs` : génération depuis l'écran, puis vérifications sur la première semaine et sur l'emploi du temps du mois de chaque étudiant (captures jointes au rapport Playwright).

**Résultat.** 406 séances, 17 enseignements placés, 0 incomplet, 0 règle dure enfreinte ; aucune classe ni aucun enseignant à deux endroits ; labos et capacités respectés ; chaque étudiant ne voit que sa promotion. Suite complète : 9 sur 9, trois passages de suite.

**Corrigé au passage.** Le parcours de génération lisait le rapport de la génération précédente encore affiché : il attend maintenant la fin du calcul. Un nom réel, resté des essais du 10 octobre dans les données des parcours, est remplacé par un nom fictif.

**Constat, pour le groupe A.** Le campus préféré se règle par **filière** (`Filieres.id_campus_prefere`), pas par promotion. Or la 3A IIIA est à Stendhal et la 4A IIIA à Gandhi : le solveur ne peut pas le savoir, et la 3A reçoit des séances à Gandhi certains jours (un seul campus par jour est bien respecté). Proposition : un campus préféré par groupe (promotion), qui l'emporte sur celui de la filière.

### Barre du bas de l'application

Le groupe A la fait dans `../planner-a-scan` (branche `a/onglet-scanner`, partie de `b/creer-quiz`, pas encore commitée) : Tableau, Semaine, Scanner, Bibliothèque, Compte ; l'onglet Activités sort de la barre, la page reste joignable. Le groupe B n'y touche pas pour ne pas doubler le travail ; il relira la PR (`mobile/` est son dossier).

### Lots enchaînés (une branche par lot, en chaîne à partir de `b/creer-quiz` dans `../planner-b-r7`)

Ordre de fusion de la chaîne : `b/cq3-une-adresse` → `b/q2-longueur` → `b/b5-confirmations` → `b/b6-exports` → `b/b9-fiches-aide` → `b/b2-aujourdhui` → `b/r14-alertes` → `b/r6-activites` → `b/b3-traductions` → `b/r11-visa` → `b/b4-couleurs`.

- **CQ-3** : plus aucun lien de l'enseignant vers le site du quiz pour lancer une partie (sélecteur « Quiz » → « Mes quiz », tableau de bord et page Activités ouvrent le lancement dans Planner). Panneau « Quiz en direct » sorti de `Jeux.jsx`. Exception assumée : « Le faire moi-même » ouvre l'éditeur du service de quiz.
- **Q-2** : `max-lines` 300 en avertissement (site, application) ; 25 fichiers signalés dans le site, aucun dans l'application.
- **B-5** : `useConfirmation()` (contexte, sur le modèle de `useToast`) remplace les trois `window.confirm`. Vérifié dans un navigateur.
- **B-6** : menu d'export à trois entrées (PDF officiel, Excel, abonnement agenda) ; CSV, iCal, YAML retirés ; `exportEmploiDuTemps.js` 858 → 392 lignes. Vérifié dans un navigateur.
- **B-9** : test des 30 fiches d'aide (textes fr/en, thème, pages existantes, aucun texte orphelin) dans `npm run test:unit` ; un lien cassé exprès le fait échouer.
- **B-2** : `aujourdhui()` et `dansJours(n)` dans `shared/dates.js` (UTC + un décalage écrit à un seul endroit, jamais le fuseau du navigateur) ; les 11 copies retirées.
- **R-14** : une alerte de quiz ouvre la partie (`/jeux?partie=<id>`) ou ses résultats (`/jeux?resultats=<id>`) ; liste des alertes cliquable ; module de liens testé.
- **R-6** : page Activités de l'enseignant en deux zones (quiz, puis jeux), historique en bas. Vérifié dans un navigateur.
- **B-3** : les 10 pages traduites (sections notFound, forgot, reset, notifs, reports, mesSeances, conflits, stats, etudiants, utilisateurs) ; messages de validation en clés ; 10 clés mortes et un doublon retirés ; fr et en ont les mêmes clés. Vérifié dans un navigateur, site en anglais : plus de texte d'interface en français sur ces pages.
- **R-11, écran** : colonne « À vérifier » dans les heures du mois, liste des séances à confirmer ou écarter (motif facultatif, décision annulable). Écrit contre la route du groupe A, **à fusionner après `a/r11-seances-a-verifier`**. Vérifié dans un navigateur avec le serveur de sa branche.
- **B-4** : plus de couleur hexadécimale dans `pages/` ni `components/layouts/` (jetons `ds.nav`, `ds.white`, `ds.document`) ; seuls restent le noir et le blanc des QR codes.

Vérifié à chaque lot : lint (0 erreur), build, tests unitaires du site (15 sur 15), tests de l'application (38 sur 38).

### B-8 terminé (branche `b/b8-parcours`)

- Job `test-parcours` ajouté en fin de `.github/workflows/ci-cd.yml` (MySQL, Chromium, image du vrai solveur, `npm run test:parcours`, rapport joint en cas d'échec). Il ne touche pas aux lignes d'A-4 : **à fusionner après A-4**, fusion simulée sans conflit. Pas encore exécuté : il tournera à l'ouverture de la PR.
- Ancienne suite retirée (`app.spec.cjs`, sa préparation aux mots de passe `password123` écrits en dur, `test-watcher.cjs`) : c'est la part « identifiants de test » d'A-2. `npm test` lance les parcours (9 sur 9).
- Reste le parcours « Créer un quiz » : à écrire une fois `b/b8-parcours` et `b/creer-quiz` fusionnées (l'outillage et l'écran sont sur deux branches).

### Demandes au groupe A (nouvelles)

- **R-14** : ajouter au lien des notifications de quiz `?partie=<id_quiz_partie>` (« Quiz en cours ») et `?resultats=<id_quiz_partie>` (« Résultats du quiz ») dans `backend/services/quiz/parties.js` (l. 117 et 291) ; le site ignore ce paramètre, l'application ouvre directement la partie.
- **R-11** : le serveur renvoie des libellés français (`libelle`, `note`) ; l'écran ne les affiche pas (il traduit à partir du code `etat`). Ils peuvent rester pour d'autres usages.

### Reste au groupe B

- **R-8** : attend la phrase de la promesse.
- **B-7** (découpage de `Cours.jsx`, `Calendrier.jsx`, `Affectations.jsx`, `DashboardLayout.jsx`) : B-3 et B-4 sont faits, mais seuls les parcours couvrent la mise en page ; les trois autres pages n'ont aucun test. Décision demandée au chef de projet avant de commencer.
- Plus tard : écrans de R-9, R-10, R-13, onglet « Menu », espace Carrière.

## 11 octobre 2026

### Point de départ

- **Écart aux règles, à savoir avant de fusionner.** Le compte rendu demande d'attendre 0-1 (dépôt privé) et 0-2 (fusion dans `main`). Au démarrage, le dépôt était encore public, aucune PR n'était ouverte et `main` avait 46 commits de retard. Sur demande du chef de projet, le travail a quand même commencé, dans le dossier `../planner-b`, sur une branche partie de `feature/phase-e-timefold` (`cb7047a`) et non de `main` : partir de `main` aurait perdu « Mes classes » et le quiz par l'IA. Une fois 0-2 fusionné, la branche se fusionne dans `main` sans reprise.
- Rien n'a été poussé.

### D-1 : devoirs masqués (branche `b/d1-masquer-devoirs`)

**Fait.**
- **Interrupteur** : `shared/fonctions.js`, `DEVOIRS_ACTIFS = false`, lu par le site et par l'application.
- **Textes** : ceux qui citent les devoirs ont une variante `_sansDevoirs`, choisie par le contexte i18next (`CONTEXTE_DEVOIRS`). Interrupteur rallumé, les textes d'origine reviennent.
- **Site** :
  - page Activités : plus de panneau « Devoirs » ; le panneau « Quiz par l'IA » reste pour l'enseignant (`ZoneQuizEtDevoirs.jsx`) ;
  - sous-titres et historique : les devoirs déjà donnés n'apparaissent plus ;
  - « Mes classes » : plus de bouton « Donner un quiz en devoir » ;
  - quiz par l'IA : plus de « Le donner en devoir » ;
  - `/jeux/devoirs/:id` renvoie vers `/jeux` (anciens liens de notification) ;
  - fiches d'aide : `profDevoir` est masquée ; `etuDevoirs` devient « Rejoindre un quiz » ; `profQuizIa` ne parle plus de devoir.
- **Application** : l'onglet Activités ne liste plus les devoirs ; l'écran `/devoir/[id]` renvoie vers l'onglet Activités. L'onglet lui-même reste en place : son retrait de la barre du bas est une idée pour après la soutenance (`remarques-par-profil.md`, § 10).
- **Aucun fichier supprimé** ; `App.jsx` et `Jeux.jsx`, déjà trop longs, n'ont pas grossi.

**Vérifié.**
- Lint du site : 0 erreur, les 7 avertissements connus.
- Build du site : réussi.
- `npx expo lint` : 0 erreur, 3 avertissements anciens dans `mobile/src/i18n.js`.
- Tests de l'application : 32 sur 32.
- Résolution des variantes `_sansDevoirs` par i18next, y compris le repli sur le texte d'origine quand une clé n'a pas de variante.

**Pas vérifié** : un vrai navigateur ou un téléphone avec un serveur lancé. Ce sera couvert par B-8.

### Demandes au groupe A

- **D-2** : le serveur renvoie encore les devoirs (`/api/devoirs`, activités de l'étudiant, historique de l'enseignant). Le site et l'application les filtrent déjà ; D-2 peut se faire quand vous voulez.
- **Notifications** : les notifications « devoir » déjà envoyées restent dans la liste de l'étudiant. Leur lien ramène aux activités. Faut-il les masquer côté serveur avec D-2 ?

### Questions au chef de projet

- Valider la lecture de D-1 sur un point : « onglet Jeux de l'application » est compris comme les devoirs **dans** l'onglet, pas le retrait de l'onglet.
- Les questions du compte rendu (§ 6) restent ouvertes, en particulier le parcours qui remplace « quiz donné en devoir » dans B-8.
