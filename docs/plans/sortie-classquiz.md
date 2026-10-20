# Plan : se passer de ClassQuiz

Statut : **proposé** (20 octobre 2026), à valider par le chef de projet avant le premier lot. Décision du 20 octobre : Planner ne doit plus dépendre de ClassQuiz, puis le supprimer ; les quiz déjà créés dans ClassQuiz sont importés dans le Studio quiz.

Ce plan complète `studio-quiz.md` (le Studio, ses 10 types de questions, ses diffusions) et `quiz-ia.md` (génération, parties en direct CQ-1 et CQ-2). Les quiz sont aujourd'hui **des jeux en classe** ; ils deviendront plus tard de petites épreuves : le Studio sait déjà faire les deux.

## 1. Ce que ClassQuiz fait encore pour Planner

| Fonction | Où dans Planner | Remplaçant |
|---|---|---|
| **Quiz en direct** : question par question au signal de l'enseignant, chrono, points selon la justesse et la rapidité, classement, podium, défi par groupes de TP, nuage de mots | `services/quiz/lancement.js`, `parties.js` (434 lignes), webhook signé ; site : `QuizProjection`, `useAnimationQuiz` ; application : `app/quiz.jsx`, `src/quiz/` | **Mode « en direct » du Studio** (lot SC-1), à construire |
| Liste et modification des quiz de l'enseignant | `services/quiz/mesQuiz.js`, `clientClassQuiz.js` ; panneau « Dans le service de quiz » d'Activités | Le Studio (« Mes quiz ») le fait déjà |
| « Créer un quiz » par l'IA, puis création dans ClassQuiz | `services/ia/quiz.js` (`creerDansClassQuiz`), `RelireQuiz.jsx` | Génération du Studio (`services/studio/iaGeneration.js`), déjà en place |
| Devoirs notés (masqués depuis le 11 octobre, lot D-2) | `services/quiz/devoirs.js`, `PanneauDevoirs.jsx` | Une diffusion du Studio avec date de fermeture |
| Connexion unique vers le site du quiz | `services/oidc/provider.js` : son seul client est `classquiz` | Plus nécessaire |
| Résultats des parties passées | Tables `QuizParties`, `QuizResultats` (migrations 0016, 0020, 0032, 0033) | À garder en lecture (SC-4) |
| Hébergement | `docker-compose.yml` : `quiz-api`, `quiz-db` (Postgres), Redis, Meilisearch, worker, site ; domaine `quiz.finadmintech.fr` ; `appliquer-quiz.sh` | Retiré (SC-5) |

## 2. Lots

Dans l'ordre. Chaque lot est une PR, fusionnable seule, avec ses tests et ses parcours. **Rien n'est retiré tant que le remplaçant n'est pas en ligne et essayé en classe.**

### SC-1 · Quiz en direct dans le Studio (groupes A puis B)

Une **diffusion en direct** à côté de la diffusion « chacun à son rythme » :

- **Enseignant** (écran projeté) : lancer depuis Mes classes ou « Diffuser ce quiz » → QR code et code → les étudiants arrivent → « Commencer » → pour chaque question : énoncé et chrono à l'écran, nombre de réponses reçues, « Voir les réponses » (répartition, bonne réponse), « Question suivante » → classement après chaque question, podium à la fin.
- **Étudiant** (téléphone ou ordinateur) : scanne, attend, répond pendant le chrono, voit s'il a juste et ses points, puis son rang.
- **Points** calculés par le serveur : justesse, puis rapidité mesurée **à l'heure du serveur** (ouverture de la question, réception de la réponse). Le client n'envoie jamais de score.
- **Types de questions** en direct : ceux qui se répondent en quelques secondes (choix unique, choix multiple, vrai ou faux, nombre, réponse courte, remise en ordre). Les autres (réponse rédigée, zone sur image, association, texte à trous) restent pour la diffusion « chacun à son rythme » ; l'éditeur le signale.
- **Repris de ClassQuiz** : défi par groupes de TP (classement par moyenne), nuage de mots pour les réponses courtes, résultats rattachés à la séance et au module, notification aux étudiants du groupe.
- **Technique** : même principe que les sessions de jeu (relecture de l'état par les téléphones, une version qui change à chaque étape pour ne renvoyer que ce qui a changé). Relire toutes les secondes pendant 15 minutes fait 900 requêtes : ces routes ont **leur propre limite par compte**, hors limite globale, comme `/api/sessions-jeu`. Pas de WebSocket : pas de nouveau service, ni de configuration de nginx.

Découpage : SC-1a serveur (modèle, routes, rejeu des points, tests) ; SC-1b écran projeté et joueur web ; SC-1c joueur de l'application (scanner, écran natif) ; SC-1d parcours Playwright « en direct, au tableau et sur deux téléphones ».

### SC-2 · Importer les quiz de ClassQuiz dans le Studio (groupe A)

- **Lecture** : par les routes signées du fork, déjà en place (`/api/v1/hestim/quizzes`, lecture d'un quiz).
- **Correspondance des types** :

| ClassQuiz | Studio | Remarque |
|---|---|---|
| `ABCD` | choix unique (une bonne réponse) ou choix multiple (plusieurs) | |
| `CHECK` | choix multiple | |
| `TEXT` | réponse courte | réponses acceptées reprises comme variantes |
| `ORDER` | remise en ordre | |
| `RANGE` | nombre | bornes → valeur centrale et tolérance |
| `VOTING` (sondage) | aucun | question ignorée, signalée dans le compte rendu d'import |
| `SLIDE` (diapositive) | aucun | ignorée, signalée |

- **Images** : copiées dans les médias du Studio.
- **Pas de doublon** : l'identifiant ClassQuiz est gardé ; relancer l'import ne recrée rien.
- **Forme** : une commande d'administration qui importe les quiz de tous les enseignants et rend un bilan (quiz importés, questions ignorées et pourquoi), plus un bouton « Importer mes quiz » dans « Mes quiz » pour l'enseignant qui en crée encore pendant la transition.
- Un quiz importé arrive **en brouillon** : l'enseignant le relit avant de le diffuser.

### SC-3 · Rebrancher les écrans sur le Studio (groupe B)

- Mes classes, tableau du jour, Activités : « Lancer un quiz » ne propose plus que le Studio (en direct ou chacun à son rythme) ; le panneau « Dans le service de quiz » disparaît.
- « Créer un quiz » (IA) crée directement dans le Studio ; `RelireQuiz` et `creerDansClassQuiz` sont retirés.
- Application : le scanner reconnaît le QR d'une diffusion en direct ; l'ancien joueur `app/quiz.jsx` et `src/quiz/` sont retirés.
- Sélecteur d'espaces (`shared/espaces.js`) : plus de lien vers `quiz.finadmintech.fr`.

### SC-4 · Historique et devoirs (groupe A)

- Les résultats des parties passées (`QuizParties`, `QuizResultats`) restent **lisibles** dans Planner (résultats d'une séance passée), sans plus rien écrire ; un export CSV par module avant tout nettoyage.
- Devoirs ClassQuiz (déjà masqués, D-2) : retirés. Un « devoir » devient une diffusion du Studio avec date de fermeture, réservée à une classe.

### SC-5 · Retirer ClassQuiz (groupe A, avec le chef de projet pour le serveur)

1. **Sauvegarde** de la base Postgres du quiz (`pg_dump`), gardée hors du serveur.
2. Code : `clientClassQuiz.js`, `mesQuiz.js`, `lancement.js`, `parties.js` (sauf la lecture de l'historique), webhook, `devoirs.js`, OIDC (`services/oidc/`, `routes/oidcRoutes.js`), variables `QUIZ_*` et `CLASSQUIZ_*`, tests correspondants ; une migration qui retire les tables devenues inutiles (`Devoirs`, sessions OIDC), après l'export de SC-4.
3. Serveur : conteneurs du quiz retirés de `docker-compose.yml` et de `docker-compose.vps.yml`, `appliquer-quiz.sh`, domaine `quiz.finadmintech.fr` (Caddy, nginx, DNS).
4. Dépôt `ClassQuiz` (fork) : archivé sur GitHub, pas supprimé.

## 3. Ce qui ne change pas

- Le Studio garde ses diffusions « chacun à son rythme » (code, QR code, dates, tentatives, résultats, analyse).
- Les sessions de jeu (Terminal Linux) ne sont pas touchées.
- Le nom affiché reste « Quiz » partout.

## 4. Risques

| Risque | Parade |
|---|---|
| Le direct du Studio arrive moins abouti que ClassQuiz | SC-5 n'est lancé qu'après une vraie séance en classe avec SC-1 |
| Charge : 30 téléphones qui relisent toutes les secondes | Réponse courte grâce à la version ; limite propre par compte ; mesurer avec `tests/banc` avant la séance d'essai |
| Questions perdues à l'import (sondages, diapositives) | Bilan d'import par enseignant ; le fork reste lisible jusqu'à SC-5 |
| Résultats passés perdus | Export avant toute suppression ; base Postgres sauvegardée |

## 5. Questions au chef de projet

1. **Points en direct** : comme Kahoot (justesse et rapidité) ou justesse seule ?
2. **Import** : tous les quiz, ou seulement ceux des enseignants encore actifs ?
3. **Historique** : garder les résultats des anciennes parties dans Planner, ou un export suffit-il ?
4. **Calendrier** : SC-5 (retrait du serveur) après combien de séances réussies avec le direct du Studio ?
