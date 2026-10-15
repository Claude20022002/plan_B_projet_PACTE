# Plan : le Studio quiz, moteur de quiz natif de Planner

Statut : **premier livrable fait** (branche `q/studio-quiz`, 15 octobre 2026). Ce plan complète `espace-de-cours.md` (§ 4.3 « Mes quiz », lot E-8) et `quiz-ia.md` (§ 4 bis, médias) ; il ne remplace pas le quiz en direct de ClassQuiz, qui reste en place.

## 1. Objectif

Un enseignant crée des quiz **de tous les types**, à la main ou **avec l'IA** (à partir d'un sujet, d'un support, d'un audio ou d'une vidéo), avec images, sons et extraits vidéo ; il ouvre une **passation** que ses étudiants rejoignent **sur téléphone comme sur ordinateur**, par **QR code** ou par **code**. L'épreuve se passe comme un examen Cisco : une question par écran, marques « à revoir », vue d'ensemble, temps total, correction automatique.

Décision du 15 octobre 2026 appliquée : **un quiz appartient à l'enseignant, sans classe ni module** (les étiquettes servent à les retrouver). Rattacher une passation à une classe ou à une séance est facultatif (`id_groupe`, `id_affectation`) : c'est le point d'accroche du lot E-8.

## 2. Pourquoi un moteur natif plutôt que ClassQuiz

| ClassQuiz (fork) | Studio quiz |
|---|---|
| QCM à une ou plusieurs réponses seulement | 10 types (§ 3) |
| Ni audio ni vidéo dans le format | Image, audio, vidéo, extrait minuté par question |
| Service Python séparé, routes signées, compte à créer | Dans Planner : mêmes comptes, mêmes droits, mêmes tests |
| Pensé pour le jeu en direct | Pensé pour l'évaluation (temps, tentatives, notation partielle, analyse) |

## 3. Types de questions (`shared/quiz/studio/types.js`)

Choix unique · choix multiple (« Choisissez deux réponses ») · vrai ou faux · réponse courte (variantes acceptées, casse, accents, une faute de frappe tolérée) · nombre (tolérance, unité) · texte à trous (saisie ou liste déroulante) · association · remise en ordre · zone sur image · réponse rédigée (notée à la main).

Validation et correction sont **les mêmes fonctions** côté serveur et côté éditeur (`shared/`). Le navigateur de l'étudiant ne reçoit jamais les bonnes réponses avant d'avoir rendu (`vueEtudiant.js`, vérifié par un test unitaire).

## 4. Parcours

- **Enseignant** : Mes quiz → Créer (de zéro, IA, import JSON) → éditeur (liste + édition, Ctrl+S, validation instantanée) → Aperçu (passe son quiz sans que cela compte) → Ouvrir une passation (réglages ajustables, classe et dates facultatives) → **code + QR code**, « Afficher en grand » pour le projecteur → Résultats (indicateurs, copies, notation à la main, analyse des questions : facilité, discrimination, réponses choisies, export CSV).
- **Étudiant** : scanne le QR (`/quiz/code/<code>`, retour au quiz après la connexion) ou saisit le code dans « Quiz » → consignes → épreuve → résultat selon le mode de correction (immédiate, fin, score seul, jamais ; bonnes réponses montrées après la dernière tentative).

## 5. IA

| Fonction | Fournisseur | Variables |
|---|---|---|
| Questions de tous les types (sauf zone sur image) | client texte existant | `IA_*` |
| Transcription minutée d'un audio ou d'une vidéo → une question par extrait | compatible OpenAI `/audio/transcriptions` | `IA_TRANSCRIPTION_URL`, `_CLE`, `_MODELE` |
| Écoute en langues : script écrit par l'IA, lu par une voix de synthèse | `/audio/speech` | `IA_VOIX_URL`, `_CLE`, `_MODELE`, `_VOIX` |
| Illustration d'une question (image sans texte) | `/images/generations` | `IA_IMAGE_URL`, `_CLE`, `_MODELE`, `_TAILLE` |

Chaque fonction absente de la configuration disparaît de l'écran (route en 503). Quotas sur 24 heures par nature (`STUDIO_IA_QUIZ_PAR_JOUR`, `..._QUESTIONS_`, `..._IMAGES_`, `..._VOIX_`, `..._TRANSCRIPTIONS_`). Toute question ou image produite par l'IA arrive **« à relire »** : la passation est refusée tant qu'il en reste. Le contenu fourni est traité comme une donnée (balises neutralisées, test du support piégé).

**Écarté :** aspirer des vidéos ou des sons sur le web (YouTube…) : droits des auteurs et conditions d'utilisation. L'enseignant dépose ses propres fichiers, et choisit l'extrait.

## 6. Données et API

Migration `0044-studio-quiz.js` : `Questionnaires`, `QuestionsQuestionnaire`, `MediasQuiz`, `SessionsQuiz` (copie figée des questions), `TentativesQuiz`, `UsagesIaQuiz`. Routes : `/api/studio-quiz/*` (enseignant, tout réservé à l'auteur, 404 sinon) et `/api/passations/*` (étudiant). Détail en tête de `routes/studioQuizRoutes.js` et `routes/passationRoutes.js`.

## 7. Sécurité

- Médias : liste blanche, **signature réelle vérifiée**, jamais de SVG ni de HTML, diffusion `nosniff` + CSP `sandbox`, requêtes partielles (Range), quota par enseignant (`STUDIO_QUOTA_MO`, 300 Mo).
- Temps tenu par le serveur (écart d'horloge corrigé côté client), marge de 30 s, copie rendue d'office avec les réponses déjà enregistrées.
- Enregistrement de chaque réponse sous verrou de ligne (pas de réponse perdue entre deux enregistrements simultanés).
- Codes à 6 caractères sans 0/O/1/I/L ; limite de 20 codes essayés par quart d'heure.
- Export CSV protégé contre l'injection de formules (`champCsv`).

## 8. Tests

- `backend/tests/utils/studioQuiz.test.js` : 12 tests (validation des 10 types, correction, absence de fuite, conversion IA, consigne).
- `backend/tests/integration/studioQuiz.test.js` : 9 tests (droits, médias, passation complète, temps écoulé, linéaire et entraînement, fermeture, IA avec faux fournisseurs).
- `frontend/tests/parcours/studioQuiz.spec.cjs` : création, passation par QR code sur téléphone et par code sur ordinateur, résultats.

## 9. Reste à faire

| Lot | Contenu |
|---|---|
| SQ-1 | Application mobile : lire `/quiz/code/<code>` dans le scanner de l'onglet (aujourd'hui le QR s'ouvre dans le navigateur du téléphone, qui suffit) et joueur natif |
| SQ-2 | Médias dans le stockage objet de l'espace de cours (lot E-1) au lieu de la base |
| SQ-3 | Import GIFT / Moodle XML et export Moodle |
| SQ-4 | Lancer une passation depuis la séance en cours et ranger les résultats dans l'onglet Quiz de la classe (E-8) |
| SQ-5 | Entrée « Quiz » dans le sélecteur d'espaces (`shared/espaces.js`) et fiches d'aide |

**Déploiement** : aucune dépendance nouvelle ; une migration (0042) ; variables d'IA facultatives (§ 5).
