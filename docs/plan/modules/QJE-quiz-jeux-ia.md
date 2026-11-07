# QJE · Quiz, jeux pédagogiques et IA

**Objet** : ce qui fait jouer et s'entraîner les élèves :
- le **Studio quiz**, moteur natif de Planner (dans les écrans, on dit « Quiz ») ;
- la sortie de ClassQuiz ;
- les jeux pédagogiques ;
- la génération par l'IA.

**Hors module** : le stockage des médias (BIB-03).

**Tables possédées** : les tables du Studio (`models/studio.js`), `quizDirect`, `QuizPartie`, `QuizResultat`, `GenerationQuiz`, `JeuModule`, `JeuProfil`, `JeuProgression`.

## Ce qui existe

- **Studio quiz** :
  - fichiers : `studioQuizRoutes`, `passationRoutes`, `quizDirectRoutes`, `services/studio/*`, `shared/quiz/studio/*` ; écrans `pages/studio/*` ;
  - 10 types de questions et des médias ;
  - passation par QR code ou par code ;
  - quiz en direct (migration 0046) ;
  - import des quiz de ClassQuiz (`deploy/vps/importer-classquiz.mjs`).
- **ClassQuiz** : fork dans un dépôt séparé, derrière l'interrupteur `classquiz_actif` de chaque école (migration 0057). Il est éteint pour une installation neuve et allumé pour HESTIM. Ses conteneurs restent dans le compose.
- **Jeux** :
  - fichiers : `jeuxRoutes`, `sessionJeuRoutes`, `activiteRoutes`, `shared/jeux`, `shared/terminal` (jeu du terminal Linux) ; écrans `pages/jeux/*` ; dans l'application, les écrans `jeux`, `terminal` et `partie` ;
  - la branche `jeux-pedagogique` (neuf simulations) n'est **pas fusionnée**.
- **IA** :
  - fichiers : `services/ia/*` (client générique réglé par `IA_*`, quota), `quizIaRoutes`, `services/studio/iaGeneration.js` ;
  - **le fournisseur n'est pas choisi en production** (loi 09-08). Q-16 et Q-24 visaient Haiku 5.5, sous enveloppe.
- **Application mobile** : le scanner ouvre `/quiz/code`. Le joueur natif est coupé (`QUIZ_DANS_L_APPLICATION = false`).

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| QJE-01 | L'entrée « Quiz » du sélecteur d'espaces ouvre le Studio, plus ClassQuiz (`shared/espaces.js`) | SQ-5 | libre | S | — | à faire |
| QJE-02 | Import des formats GIFT et Moodle XML dans le Studio | SQ-3 | libre | M | — | à faire |
| QJE-03 | Joueur natif dans l'application, sans passer par le site | SQ-1 | libre | M | — | à faire |
| QJE-04 | Fusion de `jeux-pedagogique` et ses quatre corrections ; entrée des jeux par scan ou depuis le module (contrat [jeux-pedagogiques](../../conception/jeux/jeux-pedagogiques.md)) | JC-0 | libre | M | — | à faire |
| QJE-05 | Service des jeux à part, avec des gabarits ; jeux maison ; bibliothèque des jeux plus belle | JC-1, JC-2, JC-5 | libre | L + M + M | QJE-04 | à faire |
| QJE-06 | Sortie complète de ClassQuiz : plus aucun conteneur ClassQuiz pour une école qui ne l'a pas | — | libre | M | QJE-01 | à faire |
| QJE-07 | Fournisseur d'IA en production : choix conforme à la loi 09-08, clé par école ou coûts séparés (canal I-15), quotas | IA-7, I-15 | libre | M | — | à faire |
| QJE-08 | Créateurs de jeux et leur rémunération | JC-3, JC-4, JC-6, RC-1 à RC-4 | — | — | vente | gelé |
| QJE-09 | Défis Linux dans un quiz | J-1 | — | M | QJE-04 | reporté |

## Critères de « terminé »

- **QJE-01** : une école sans ClassQuiz ne voit aucun lien vers lui.
- **QJE-04** : un jeu envoie une réponse, jamais un score : le score est calculé par le serveur. Un test le prouve.
- **QJE-06** : une installation neuve démarre sans les cinq conteneurs de ClassQuiz.
- **QJE-07** : aucune donnée d'élève n'est envoyée au fournisseur ; la sortie de l'IA est relue par l'enseignant avant publication.

## Références

- [Contrat des jeux](../../conception/jeux/jeux-pedagogiques.md)
- Archives : [Studio quiz](../../archives/plans/studio-quiz.md), [sortie de ClassQuiz](../../archives/plans/sortie-classquiz.md), [quiz par l'IA](../../archives/plans/quiz-ia.md), [jeux et créateurs](../../archives/plans/planner-multi-etablissements/07-jeux-createurs.md)
