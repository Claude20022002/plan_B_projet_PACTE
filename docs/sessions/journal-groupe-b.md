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

**Laissé** : `design-system/board/index.js`, un fichier d'index que personne n'importe (les écrans importent les composants un par un). Hors de la liste du plan ; à retirer si le chef de projet le souhaite.

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
- **Ordre de fusion des branches du groupe B** : D-1, B-1, R-7, scan, puis CQ-2 (après CQ-1 du groupe A). `b/donnees-fictives` est indépendante.

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
