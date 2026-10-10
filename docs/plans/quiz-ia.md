# Plan : quiz générés par l'IA pour les enseignants

Statut : **en cours** (IA-1 à IA-3 faits, ainsi que « Mes classes »). Rédigé le 10 octobre 2026, après la fusion de maj28 dans `main`.

## 1. Objectif

Un enseignant génère un quiz (QCM) à partir du **support de son cours**, le **relit et le corrige**, puis le retrouve dans son compte ClassQuiz : il peut le jouer en direct en classe ou le donner en devoir noté, comme ses autres quiz.

Ce que la fonction ne fait pas : elle ne publie rien sans relecture, ne note pas les étudiants, et n'envoie aucune donnée d'étudiant au fournisseur d'IA.

## 2. Décisions prises

| Sujet | Décision |
|---|---|
| Fournisseur d'IA | **Configurable** : client compatible OpenAI (DeepSeek, Mistral, OpenAI, Groq…) et adaptateur Anthropic. **DeepSeek par défaut**, choisi dans le `.env`. |
| Sources | **Un document StudyLib du module**, ou **un fichier déposé** au moment de générer (PDF, Word, PowerPoint). |
| Destination | **Brouillon relu dans Planner**, puis création dans **ClassQuiz**. |
| Types de questions | QCM à une bonne réponse (`ABCD`) et à plusieurs bonnes réponses (`CHECK`), les deux types déjà notés par les devoirs. |

## 3. Existant sur lequel on s'appuie

- **Les quiz vivent dans ClassQuiz** (fork `../ClassQuiz`). Planner les lit par requêtes signées HMAC (`backend/services/quiz/devoirs.js` → `classquiz/routers/hestim.py`). Le fork n'expose aujourd'hui que **deux routes en lecture** : la liste des quiz d'un enseignant et le contenu d'un quiz.
- **Format d'un quiz ClassQuiz** (`QuizInput`) : titre, description, puis questions `{ question, time, type, answers: [{ answer, right }] }`. Le mélange des réponses par joueur (anti-triche) s'applique tout seul aux nouveaux quiz.
- **Droits** : `peutProposerDansModule(user, cours)` (`services/jeux/jeux.js`) dit si un enseignant intervient dans un module. On le réutilise tel quel.
- **Supports** : StudyLib range les documents par module (`Module.code`, qui correspond au code du module dans Planner) dans MinIO, servis par des liens signés temporaires.
- **Interface** : le panneau « Devoirs » de la page Activités (`frontend/src/components/jeux/PanneauDevoirs.jsx`) liste déjà les quiz ClassQuiz de l'enseignant. C'est le point d'entrée.

## 3 bis. La bonne classe et le bon cours (« Mes classes »)

Un enseignant ne travaille qu'avec **ses** classes. Une classe est un couple (module, groupe) déduit de deux sources :
- **ses services** : les enseignements qui lui sont confiés, hors refus ;
- **son emploi du temps** : les séances dont il est l'enseignant, ce qui couvre aussi un remplacement.

S'y ajoutent les sous-groupes d'une classe : qui enseigne à la promotion a aussi pour classes ses TD et ses TP.

- **Service** `services/planning/mesClasses.js`. Pour chaque classe, il donne :
  - l'effectif, sous-groupes compris ;
  - la provenance (service, emploi du temps) ;
  - **la séance en cours** ou **la prochaine séance** (date, heures, salle, horaires du Ramadan compris).

  La séance en cours vient d'abord, puis l'ordre des prochaines séances.
- **Route** `GET /api/enseignants/mes-classes`.
- **Contrôle côté serveur** (`peutViserClasse`) :
  - un devoir ne peut viser que l'une de ses classes ou un sous-groupe ;
  - « tout le module » n'est permis que si ses classes couvrent tous les groupes du module ;
  - le responsable de la filière garde l'accès à tout le module.

  Avant, il suffisait que le groupe suive le module : un enseignant pouvait écrire aux groupes d'un collègue.
- **Interface** : le composant `SelecteurClasse` remplace le choix du module dans « Donner un devoir ». Il présélectionne la séance en cours ou la prochaine. Il servira aussi au dialogue de génération (IA-5) : la classe y est facultative, elle prépare le devoir qui suivra.

## 3 ter. Une seule adresse pour l'enseignant (exigence du 10 octobre 2026)

L'enseignant **ne quitte jamais `planner.finadmintech.fr`** : il ne doit avoir ni autre adresse à saisir, ni premier passage obligatoire sur `quiz.finadmintech.fr`. Les étudiants restent déjà dans l'application, puisque le quiz en direct y est natif.

**Planner devient l'interface unique, et ClassQuiz un moteur invisible.** Il garde les quiz, les parties et le temps réel, et Planner l'appelle par des routes signées, comme pour la lecture des quiz aujourd'hui.

**Écarté :** servir ClassQuiz sous `planner.finadmintech.fr/quiz/`, comme StudyLib l'est sous `/biblio/`. Son frontend utilise partout des adresses absolues (`/api/v1/…`, `/dashboard`, `/play`, `/edit`), et certaines entrent en conflit avec celles de Planner. Il faudrait réécrire une grande partie du fork.

| Besoin de l'enseignant | Aujourd'hui | Cible |
|---|---|---|
| Compte ClassQuiz | Créé à sa première visite sur quiz.finadmintech.fr | **Créé automatiquement** par Planner (route signée), au premier besoin |
| Créer ou modifier un quiz | Éditeur de ClassQuiz | **Éditeur dans Planner** (« Mes quiz »), à la main ou avec l'IA. Planner écrit dans ClassQuiz par une route signée |
| Lancer une partie en direct | Tableau de bord de ClassQuiz | **Bouton « Lancer en direct » sur la séance**, dans Planner. Planner démarre la partie (route signée) et affiche **lui-même l'écran du projecteur** (code, questions, temps, classement) par WebSocket |
| Résultats | Déjà dans Planner | Inchangé |
| Sélecteur d'espaces | « Quiz » mène à quiz.finadmintech.fr | « Quiz » mène à « Mes quiz » dans Planner. ClassQuiz reste joignable en secours pour l'administration |

**Points techniques :**
- **Compte, création et mise à jour d'un quiz, démarrage d'une partie :** routes signées dans `classquiz/routers/hestim.py`. La signature HMAC couvre le corps de la requête. L'enseignant est désigné par son email.
- **Écran du projecteur :** client socket.io dans Planner (événements `register_as_admin`, `start_game`, `set_question_number`, `get_question_results`…, déjà utilisés par le client natif du mobile, `mobile/src/quiz/partie.js`). nginx relaie `/socket.io/` vers `quiz-api`, ce qui garde **la même origine** : la CSP (`connect-src 'self'`) n'est pas assouplie et les cookies ne passent pas d'un domaine à l'autre. Planner n'utilise pas lui-même `/socket.io`.
- **Le jeton d'administration de la partie** est obtenu par Planner, côté serveur, au démarrage, puis remis à l'enseignant de la séance seulement.

## 4. Parcours de l'enseignant

1. Activités → Devoirs → **« Générer un quiz avec l'IA »**.
2. Choix de la **classe**, parmi les siennes (§ 3 bis) : la séance en cours ou la prochaine est proposée d'abord. Le quiz porte sur le module de cette classe.
3. Choix de la **source** :
   - un document StudyLib du module ;
   - ou un fichier déposé (PDF, DOCX ou PPTX, 20 Mo au plus).
   - Plage de pages ou de diapositives facultative.
4. **Réglages** :
   - nombre de questions (5 à 20) ;
   - QCM simple ou à choix multiples ;
   - difficulté (découverte, application, approfondissement) ;
   - langue (français ou anglais) ;
   - temps par question.
5. **Génération** (20 à 60 s, avec suivi de la progression).
6. **Brouillon** : chaque question montre :
   - les réponses, la ou les bonnes cochées ;
   - une explication ;
   - **le passage du support dont elle vient** (page ou diapositive).

   L'enseignant modifie, supprime, ajoute une question ou **en régénère une seule**.
7. **« Créer dans ClassQuiz »** : le quiz apparaît dans sa liste. Un lien ouvre l'éditeur ClassQuiz. Il est aussitôt disponible pour une partie en direct ou un devoir.

## 4 bis. Objectifs de l'IA au-delà du texte (demande du 10 octobre 2026)

L'IA doit, à terme, produire quatre choses pour un quiz. Seule la première existe aujourd'hui.

| Objectif | Exemple | État | Ce que ça demande |
|---|---|---|---|
| **1. Questions et réponses en texte** | QCM tirés du support du cours | fait (lots IA-1 à IA-5) | — |
| **2. Images pour illustrer une question** | schéma d'une architecture, photo d'un composant | à faire | un fournisseur de génération d'images ; l'image se range dans le champ `image` que les questions de ClassQuiz ont déjà ; relecture par l'enseignant (une image fausse est pire qu'aucune image) |
| **3. Audio pour une question** | en anglais : un court dialogue lu, puis « de quoi parle Jane ? » | à faire | une synthèse vocale (texte écrit par l'IA, puis lu) ; **le format de ClassQuiz n'a pas de champ audio** : il faut l'ajouter au fork, au joueur du site et à celui de l'application |
| **4. Extrait de vidéo avec des questions** | un extrait de 30 secondes, puis des questions de compréhension | à faire | **partir d'une vidéo fournie par l'enseignant** (fichier ou lien) plutôt que d'en générer une : l'IA transcrit l'extrait, puis écrit les questions à partir de la transcription ; champ vidéo à ajouter comme pour l'audio |

**Principes communs :**
- **Relecture obligatoire**, comme pour le texte : l'enseignant voit, écoute ou regarde chaque média avant la création du quiz, et peut le retirer ou le faire régénérer.
- **Fournisseur configurable** par type de média (texte, image, voix, transcription), comme le client d'IA actuel. DeepSeek ne produit que du texte : les médias demandent d'autres fournisseurs.
- **Quotas et coût séparés** : une image ou une minute d'audio coûte bien plus cher qu'une question en texte (§ 7). Un quota par enseignant et par type de média.
- **Stockage** : les médias sont des fichiers à conserver (ClassQuiz a déjà un stockage pour les images des quiz) ; taille et durée plafonnées.
- **Modules concernés** : l'audio et la vidéo servent surtout les langues. Le dialogue de génération ne les propose que si l'enseignant les demande.
- **Accessibilité** : une question audio ou vidéo garde une transcription consultable après la réponse.
- **Devoirs notés** : Planner copie les questions pour les corriger ; il doit aussi servir les médias à l'étudiant, sur le site et dans l'application.

## 5. Architecture

```
Planner (frontend)  ── brouillon, relecture ──►  Planner (backend)
                                                   │ 1. texte du support
                         StudyLib (route de service) ◄┤   (ou fichier déposé)
                                                   │ 2. génération
                    Fournisseur d'IA (configurable) ◄┤   (texte du support seulement)
                                                   │ 3. création du quiz relu
                     ClassQuiz (route signée, écriture) ◄┘
```

### 5.1 Client d'IA configurable (`backend/services/ia/`)

- Variables d'environnement :
  - `IA_FOURNISSEUR` : `openai-compatible` ou `anthropic` ;
  - `IA_URL` : par défaut `https://api.deepseek.com/v1` ;
  - `IA_CLE` ;
  - `IA_MODELE` ;
  - `IA_DELAI_MS` ;
  - `IA_GENERATIONS_PAR_JOUR`.
- Une seule fonction, `genererJson({ systeme, utilisateur, schema })`, et deux adaptateurs :
  - **compatible OpenAI** : `chat/completions` avec `response_format: json_object` ;
  - **Anthropic** : `messages`.
- Fonction **désactivée proprement** si `IA_CLE` est absente : le bouton n'apparaît pas et la route répond 503.
- **Client remplaçable dans les tests**, comme `definirClientClassQuiz` : aucun appel réseau en CI.
- **La clé reste sur le serveur** : jamais envoyée au navigateur, jamais journalisée.

### 5.2 Extraction du texte (`backend/services/ia/extraction.js`)

- **PDF** avec `pdfjs-dist`, **DOCX** avec `mammoth`, **PPTX** en lisant le XML des diapositives (`jszip`). Le texte est découpé par page ou par diapositive, ce qui permet de citer la source.
- **Contrôles du fichier :**
  - signature réelle du fichier, avec `utils/fichiers.js` ;
  - 20 Mo au plus ;
  - le texte n'est gardé qu'en mémoire, le fichier n'est pas conservé.
- **PDF scanné** (sans texte) : message clair (« ce document ne contient pas de texte lisible »). La reconnaissance de caractères (OCR) est hors périmètre.
- **Support trop long :** au-delà d'environ 30 000 mots, on demande une plage de pages plutôt que de couper sans le dire.

### 5.3 Génération (`backend/services/ia/quiz.js`)

- **Consigne système fixe**, qui demande :
  - un JSON strict `{ questions: [{ question, type, reponses: [{ texte, juste }], explication, source }] }` ;
  - des énoncés fondés **uniquement** sur le support ;
  - des distracteurs plausibles ;
  - pas de « toutes les réponses ci-dessus » ;
  - la langue demandée.
- **Le texte du support est traité comme une donnée**, jamais comme une consigne. Il est placé entre balises, et la consigne précise d'ignorer toute instruction qu'il contient. C'est la protection contre l'injection de consignes depuis un document piégé.
- **La réponse est validée strictement**, et toute question invalide est écartée :
  - nombre de questions ;
  - 2 à 6 réponses par question ;
  - au moins une juste, une seule pour `ABCD` ;
  - longueurs maximales ;
  - pas de HTML.
- **Si la réponse n'est pas un JSON valide**, un seul nouvel essai est fait, sinon une erreur claire.
- **Traitement asynchrone :** une génération dure plus longtemps qu'une requête HTTP ordinaire. On crée une tâche, puis le navigateur interroge son état. Une table `GenerationsQuiz` garde :
  - l'enseignant, le module et la source ;
  - le statut, les jetons consommés et la durée ;
  - le brouillon.

  Ce brouillon est purgé au bout de 30 jours.

### 5.4 Route d'écriture dans ClassQuiz (fork)

- **Nouvelle route `POST /api/v1/hestim/quiz`**, signée comme les routes existantes. La signature couvre aussi l'**empreinte SHA-256 du corps** : un corps modifié en chemin est refusé.
- **Le quiz est créé pour l'utilisateur ClassQuiz qui porte l'email de l'enseignant**, et il est privé.
- **Si l'enseignant n'a jamais ouvert ClassQuiz**, son compte est **créé par la route**, avec l'identité que Planner donne à la connexion OpenID (`sub` de `services/oidc/provider.js`, nom d'utilisateur tiré de l'adresse). Une connexion ultérieure à ClassQuiz retrouve donc ce même compte. Un nom d'utilisateur déjà pris reçoit un suffixe.
- **Contrôles du fork** : 1 à 50 questions, types `ABCD` et `CHECK` seulement, 2 à 6 réponses non vides, bonnes réponses cohérentes avec le type, balises interdites retirées. Un quiz incohérent est refusé (422) et la raison remonte à l'enseignant.
- **Côté Planner** : `creerQuizClassQuiz` (`services/quiz/devoirs.js`), `creerDansClassQuiz` (`services/ia/quiz.js`) et `POST /api/quiz-ia/generations/:id/creer`. Une génération ne crée qu'un quiz ; en cas d'échec, le brouillon redevient prêt.
- **Essai du 10 octobre 2026** : le client signé de Planner a créé un quiz dans le fork lancé en local (PostgreSQL, Redis et Meilisearch jetables), puis l'a relu par les routes existantes. Signature absente, d'un autre corps ou trop ancienne : refus (401).

### 5.5 Route de service dans StudyLib

- **`GET /api/service/modules/{code}/documents`** :
  - liste des documents **publiés** du module ;
  - protégée par le jeton de service déjà partagé (`INTEGRATION_TOKEN`).
- **`GET /api/service/documents/{id}/fichier`** : le contenu du document, que Planner lit côté serveur. Le navigateur ne voit jamais le lien MinIO.
- **Contrôle dans Planner** : avant d'appeler StudyLib, Planner vérifie que l'enseignant intervient dans le module (`peutProposerDansModule`).

## 6. Sécurité et données

- **Rien sur les étudiants n'est envoyé :** seulement le texte du support et les réglages.
- **DeepSeek héberge ses serveurs en Chine.** Les supports de cours sont la propriété de l'école, et leur envoi hors du Maroc peut relever de la **loi 09-08 et d'un avis de la CNDP**.
  - **À faire valider par l'école avant la mise en production.**
  - Le fournisseur étant configurable, on peut basculer vers un fournisseur hébergé dans l'UE sans changer le code.
- **Quotas et suivi :**
  - `IA_GENERATIONS_PAR_JOUR` par enseignant (20 par défaut) ;
  - limiteur de débit persistant sur la route ;
  - jetons consommés enregistrés, pour suivre le coût ;
  - chaque génération est inscrite au **journal de sécurité** (`quiz_ia_genere`).
- **Affichage :** le contenu généré est traité comme du texte, jamais comme du HTML.
- **Responsabilité pédagogique :** un quiz généré n'est jamais joué ni donné en devoir sans être passé par la relecture.

## 7. Coût

Ordre de grandeur pour un quiz de 10 questions tiré d'un support de 20 pages : environ **15 000 jetons en entrée et 3 000 en sortie**. Le coût réel dépend du tarif du fournisseur retenu, à vérifier sur sa grille au moment du choix. Le tableau de suivi des jetons (§ 6) permettra de le mesurer.

## 8. Découpage en lots

| Lot | Contenu | Livrable | Dépend de | État |
|---|---|---|---|---|
| **IA-1** | Client d'IA configurable, variables d'environnement, quotas, client remplaçable dans les tests | Génération testable sans réseau | — | **fait** |
| **IA-2** | Extraction PDF, DOCX et PPTX par page, contrôles du fichier | Texte et repères de pages | — | **fait** |
| **IA-3** | Consigne, validation du JSON, tâche asynchrone, table `GenerationsQuiz` (migration) | API « générer » et « état » | IA-1, IA-2 | **fait** |
| **IA-4** | Routes signées dans le fork ClassQuiz : **compte créé automatiquement**, création et mise à jour d'un quiz ; création depuis Planner | Quiz relu → ClassQuiz, sans passage par quiz.finadmintech.fr | IA-3 | **fait** le 10 octobre 2026 pour le compte et la création (non déployé ; le fork est à redéployer). **Reste : la mise à jour d'un quiz existant**, à faire avec l'éditeur de IA-5 |
| **IA-5** | Interface : « Mes quiz » dans Planner (liste, éditeur à la main), dialogue de génération par l'IA, brouillon modifiable, régénération d'une question, enregistrement dans ClassQuiz (FR et EN) | Parcours complet avec **fichier déposé** (premier livrable utilisable) | IA-3, IA-4 | **fait** le 10 octobre 2026 pour le parcours par l'IA (`frontend/src/components/jeux/QuizIa.jsx`, panneau « Quiz par l'IA » de la page Activités, bouton dans « Mes classes »), essayé dans un navigateur avec une fausse IA. **Reste : « Mes quiz » avec l'éditeur à la main**, et la mise à jour d'un quiz existant (IA-4) |
| **CQ-1** | Lancer une partie en direct depuis la séance dans Planner (route signée de démarrage), relais nginx de `/socket.io/` | Partie démarrée sans quitter Planner | IA-4 | à faire |
| **CQ-2** | Écran du projecteur dans Planner : code de la partie, joueurs, questions, temps, classement (FR et EN) | Partie animée sans quitter Planner | CQ-1 | à faire |
| **CQ-3** | Sélecteur d'espaces : « Quiz » mène à « Mes quiz » dans Planner ; scénarios de recette « une seule adresse » | Plus aucun lien vers quiz.finadmintech.fr pour l'enseignant | IA-5, CQ-2 | à faire |
| **IA-6** | Routes de service StudyLib, choix d'un document du module | Source « document StudyLib » | IA-5 | à faire |
| **IA-7** | Recette, documentation d'exploitation, déploiement | Mise en production | IA-1 à IA-6 | à faire |
| **IA-8** | Images générées pour illustrer une question (§ 4 bis) : fournisseur d'images, relecture, rangement dans le champ `image` de ClassQuiz, quota | Questions illustrées | IA-7 | à faire |
| **IA-9** | Questions audio (§ 4 bis) : texte écrit par l'IA puis lu par une synthèse vocale ; champ audio dans le fork, joueurs du site et de l'application, devoirs | Compréhension orale (anglais…) | IA-8 | à faire |
| **IA-10** | Extrait de vidéo ou d'audio fourni par l'enseignant : transcription, questions de compréhension ; champ vidéo dans le fork et les joueurs | « De quoi parle Jane dans la vidéo ? » | IA-9 | à faire |

**Premier livrable utilisable : IA-1 à IA-5**, avec la source « fichier déposé ». La source StudyLib (IA-6) suit sans rien changer au reste.

## 9. Tests

- **Unitaires :**
  - validation du JSON (questions valides, invalides, une réponse juste en trop, HTML) ;
  - extraction de chaque format, avec de petits fichiers d'exemple ;
  - adaptateurs d'IA, sur des réponses enregistrées.
- **Intégration :**
  - droits : un enseignant hors du module est refusé, un étudiant aussi ;
  - quotas ;
  - document piégé (« ignore les consignes précédentes… ») : la sortie reste conforme ;
  - route ClassQuiz signée : une signature fausse ou un corps modifié sont refusés.
- **Banc des requêtes** : budget de requêtes pour les nouvelles routes.
- **Recette sur écran** : nouveaux scénarios dans `docs/recette/scenarios-de-test.md`, dont une relecture humaine de la justesse des questions sur trois supports réels.

## 10. Déploiement

- **Nouvelles dépendances npm** (`pdfjs-dist`, `mammoth`, `jszip`) : l'image du backend doit être **reconstruite**, la mise à jour par superposition (`preparer-maj.sh`) ne suffit pas.
- **Fork ClassQuiz** (nouvelle route) et **StudyLib** (routes de service) : les paquets sont à préparer avec `--classquiz` et `--studylib`.
- **Variables à ajouter au `.env` de production :**
  - `IA_FOURNISSEUR`, `IA_URL`, `IA_CLE`, `IA_MODELE` ;
  - `IA_GENERATIONS_PAR_JOUR`.
  - Sans `IA_CLE`, la fonction reste masquée.

## 11. Points ouverts

1. **Validation par l'école** de l'envoi des supports à un fournisseur hors du Maroc (§ 6), et choix final du fournisseur.
2. **Clé d'API** : qui la détient et la paie (compte de l'école), et quel plafond de dépense mensuel fixer chez le fournisseur.
3. **Autres types de questions** (réponse courte, vrai ou faux) : à envisager après le premier livrable.
4. **Médias générés (§ 4 bis)** : quels fournisseurs pour l'image, la voix et la transcription, avec quel budget mensuel ; où sont hébergés leurs serveurs (même question que pour DeepSeek, loi 09-08 et avis de la CNDP).
5. **Droits sur les vidéos et les audios** fournis par un enseignant : un extrait d'une œuvre protégée peut-il être montré en classe et gardé sur le serveur de l'école ?
6. **Voix de synthèse** : quels accents et quelles langues faut-il couvrir (anglais britannique ou américain, autres langues enseignées) ?
