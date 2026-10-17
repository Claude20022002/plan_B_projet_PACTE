# Plan : l'espace de cours de l'enseignant (ses classes comme sur Moodle, en plus simple)

Statut : **en cours**. Rédigé le 15 octobre 2026, révisé le même jour (StudyLib comme réserve unique des fichiers, nombre de pages réduit). Ce plan reprend la partie « classe » de `espace-enseignant.md` (§ 2 et 5 bis) et la remplace pour les supports ; l'appel projeté (P-1) et le quiz en direct (CQ-1 à CQ-3) restent décrits là-bas.

## 1. Objectif et décisions

L'enseignant gère ses classes dans Planner comme il le ferait dans Moodle, sans en avoir la complexité : **déposer un support pour une classe**, **faire l'appel** et en garder l'historique, **écrire à la classe**, **lancer un quiz** pendant la séance.

| Sujet | Décision (15 octobre 2026) |
|---|---|
| Où l'enseignant gère les supports d'une classe | **Dans Planner**, dans l'espace de la classe. |
| Où sont les fichiers | **Dans StudyLib, et nulle part ailleurs** (§ 3). Planner ne stocke aucun fichier : il range, il donne les droits, il ne duplique ni l'envoi, ni le contrôle des fichiers, ni le stockage, ni les téléchargements. |
| Quiz | **Banque libre** de l'enseignant, rattachée à la séance au lancement. **« Mes quiz » est traité par un autre chantier** (branche `q/studio-quiz`) : ce plan n'y touche pas. |
| `Jeux_HESTIM/` | Projet d'un autre groupe : **retiré du dépôt** (lot E-0). |

## 2. Ce qu'on reprend des meilleurs, et ce qu'on laisse

| Source | Ce qu'on reprend | Ce qu'on laisse |
|---|---|---|
| **Google Classroom** | La classe en onglets ; un seul bouton « + Ajouter » par écran. | Devoirs (masqués à HESTIM), notation. |
| **Moodle**, cours | Les **sections** (par semaine ou par thème), les supports **masqués** puis publiés. | Les 20 types d'activités, les blocs, les rôles fins. |
| **Moodle**, module Présence | Des statuts au-delà de présent / absent : ici **présent, en retard, absent** ; taux par étudiant ; export. | « Excusé » (décision du 15 octobre 2026), les sessions créées à la main, la note de présence. |
| **Canvas**, « Modules » | L'ordre des supports, réglé par l'enseignant. | Les prérequis entre modules. |

Moodle (GPL v3) et Canvas (AGPL v3) sont à partage à l'identique : on s'en inspire, **on ne recopie pas de code**.

## 3. Planner et StudyLib : une réserve, deux portes

**Le principe.** Un document n'existe qu'une fois, dans StudyLib (MinIO, contrôle du type réel, 20 Mo, liens signés, compteur de téléchargements, notes, modération : tout cela existe déjà). Chaque application y ouvre une porte différente :

| | **Planner : « Mes classes »** | **StudyLib : « Bibliothèque »** |
|---|---|---|
| Question à laquelle il répond | « Qu'est-ce que *ma classe* doit avoir sous la main cette année ? » | « Qu'est-ce que *l'école* sait sur ce module, toutes années confondues ? » |
| Organisation | Par classe (module + groupe), en sections, dans l'ordre de l'enseignant | Par filière et module, recherche, notes, les plus téléchargés |
| Qui voit | Les étudiants de la classe et de ses sous-groupes | Toute l'école |
| Ce qu'on y range | Un **document de classe** (déposé depuis Planner, invisible dans la Bibliothèque), un **document de la Bibliothèque** épinglé, ou un **lien** | Documents publiés, retours de stage, idées de projet |

**Valeur ajoutée de chaque côté, sans doublon :**

- Planner apporte ce que StudyLib n'a pas : la classe, ses inscrits, l'ordre et les sections, la séance, l'appel.
- StudyLib apporte ce que Planner n'a pas : le stockage, la recherche, la mémoire d'une promotion à l'autre, les notes des étudiants.
- **« Publier dans la Bibliothèque »** fait passer un document de classe à toute l'école **sans copie** (un seul champ change dans StudyLib).
- **« Ajouter depuis la Bibliothèque »** épingle un document existant dans une section **sans copie** (Planner garde son identifiant).

**Le chemin d'un fichier.**

1. L'enseignant dépose dans Planner. Le serveur de Planner vérifie qu'il gère la classe, puis **transmet le flux tel quel** à l'API de StudyLib avec **le jeton de l'enseignant** (celui de sa session, déjà accepté par StudyLib). StudyLib contrôle et range le fichier comme pour tout dépôt, avec la portée « classe ». Planner ne lit ni ne garde le fichier.
2. Planner enregistre la référence (identifiant StudyLib, section, ordre, visibilité).
3. Un étudiant ouvre le support dans Planner. Planner vérifie qu'il est de la classe, puis demande à StudyLib un lien de 5 minutes avec un **jeton de service** signé par Planner, valable 60 secondes et pour **ce seul document**. StudyLib répond par le lien signé de MinIO.

Conséquence : **aucune dépendance nouvelle** dans le serveur de Planner (pas de client S3, pas d'analyseur de formulaire), donc pas d'image à reconstruire pour ce chantier.

**Moins de pages.** Chaque fonction a une seule page :

| Fonction | Reste dans | Disparaît de |
|---|---|---|
| Accueil, tableau de bord | Planner (Tableau) | StudyLib : son tableau de bord renvoie à la Bibliothèque pour l'enseignant |
| Supports d'une classe | Planner (Mes classes › Supports) | « Supports de cours » qui ouvrait StudyLib depuis chaque classe |
| Séances, appel, élèves | Planner (Mes classes) | « Mes séances » (déjà retirée) |
| Profil, langue, thème | Planner (Paramètres) | StudyLib : le lien « Profil » renvoie aux Paramètres de Planner |
| Notifications | Planner (cloche) | StudyLib : la cloche de l'enseignant renvoie à Planner (lot E-9) |
| Événements | Planner (Annonces) | StudyLib, pour l'enseignant (déjà fait le 10 octobre) |
| Disponibilités, demandes de report, services | Planner, **une page « Mon service » à trois onglets** | Trois entrées de menu séparées |

Menu de l'enseignant après le plan : **Tableau · Emploi du temps · Mes classes · Mon service · Bibliothèque · Activités** (six entrées au lieu de huit ; l'enseignant n'a plus d'Annonces). « Mes quiz » est l'entrée du chantier des quiz.

## 4. La classe : une notion déjà présente

Une classe est le couple **(module, groupe)** que rend `mesClasses` (`backend/services/planning/mesClasses.js`). Pas de table « classe ».

- **Plusieurs enseignants** peuvent avoir la même classe (CM et TD) : l'espace est **partagé**. Chacun ajoute ; seul l'auteur (ou l'administration) modifie ou retire le sien.
- **Étudiants de la classe** : ceux du groupe et de ses sous-groupes, comme pour les quiz (`descendants`). Un étudiant de TP voit les supports du CM de son groupe parent.
- **Correspondance avec StudyLib** : le module StudyLib est retrouvé par le code de la filière et le code du module (synchronisés par `planner:sync`).

## 5. Les écrans

Règle de style : **pas de capitales étroites pour le contenu** (noms de cours, titres de supports) ; le style « volet » reste au tableau des départs et aux horaires. Couleurs lues dans le thème, aucune en dur. Composants MUI standard (Tabs, List, Card, Dialog).

### 5.1 « Mes classes » (`/mes-classes`)

- En haut, **la séance en cours** avec **une action principale** : « Faire l'appel ». Écrire à la classe et lancer un quiz en boutons secondaires.
- Dessous, **une carte par classe** : module, groupe, effectif, prochaine séance. Toute la carte ouvre l'espace de la classe.

### 5.2 L'espace d'une classe (`/mes-classes/:idCours/:idGroupe`)

En-tête : module, groupe, effectif, prochaine séance, bouton principal « + Ajouter ». L'adresse garde l'onglet (`?onglet=supports`).

| Onglet | Contenu | Actions |
|---|---|---|
| **Supports** (par défaut) | Sections dans l'ordre choisi ; supports avec icône du type, titre, auteur, date ; mention « Aussi dans la Bibliothèque » | Ajouter un fichier, un lien ou un document de la Bibliothèque ; créer, renommer, réordonner une section ; masquer ou publier ; retirer ; publier dans la Bibliothèque |
| **Appel** | Séances de la classe : date, état, présents / retards / absents | Ouvrir l'appel du jour, corriger un statut, exporter en CSV |
| **Élèves** | Nom, taux de présence, présences, retards, absences ; les plus absents d'abord | Export CSV |

État vide de chaque onglet : une phrase et le bouton qui le remplit. Sur téléphone, onglets défilants, lisibles à 360 px.

### 5.3 Côté étudiant

- **Site** : « Mes cours », une carte par module suivi, puis ses sections et supports publiés.
- **Application** : bloc « Mes cours » en tête de l'onglet Bibliothèque.

## 6. Données

**Planner** (migration après la dernière en place) :

| Table | Colonnes principales | Notes |
|---|---|---|
| `SectionsCours` | `id_section`, `id_cours`, `id_groupe`, `titre`, `ordre`, `visible`, `id_user_auteur`, dates | Une section « Général » est créée au premier ajout. |
| `SupportsCours` | `id_support`, `id_section`, `type` (`document`, `lien`), `id_document` (UUID StudyLib), `titre`, `url`, `ordre`, `visible`, `id_user_auteur`, dates | Référence seulement. Retirer un support de classe supprime aussi son document dans StudyLib s'il est de portée « classe » ; un document de la Bibliothèque épinglé n'est jamais supprimé. |
| `Presences` (lot E-6) | + `statut` (`present`, `retard`), + `motif`, `modifie_par`, `modifie_le` (migration 0043) | Absent = pas de ligne, comme aujourd'hui. Pas d'« excusé ». |

**StudyLib** : `documents.visibility` (`school` par défaut, `class`). Une **portée globale** du modèle écarte les documents « classe » de **toutes** les listes, recherches, compteurs, recommandations et routes de l'application ; seules les routes de l'API de classe la lèvent, explicitement. Un document « classe » n'est pas indexé dans la recherche.

## 7. API

**Planner**, sous `/api`, session, CSRF et format d'erreur commun (A-5) :

| Route | Qui | Rôle |
|---|---|---|
| `GET /classes/:idCours/:idGroupe/supports` | enseignant de la classe (tout) ; étudiant de la classe (visible seulement) | En-tête de la classe, sections et supports, `gere` |
| `POST /classes/:idCours/:idGroupe/sections` · `PUT …/sections/ordre` · `PUT /sections-cours/:id` · `DELETE /sections-cours/:id` | enseignant de la classe | Sections (suppression d'une section vide seulement) |
| `POST /sections-cours/:id/fichiers` (multipart transmis à StudyLib) · `…/liens` · `…/bibliotheque` ; mêmes routes sous `/classes/:idCours/:idGroupe/` pour « Général » | enseignant de la classe | Ajouts |
| `PUT /supports-cours/:id` · `DELETE /supports-cours/:id` · `POST /supports-cours/:id/publier` | auteur, admin | Titre, section, ordre, visibilité ; retrait ; publication dans la Bibliothèque |
| `GET /supports-cours/:id/ouvrir` | ayants droit | `{ url }` : le lien signé de 5 minutes (document) ou l'adresse (lien) ; pas de cache |
| `GET /etudiant/cours` | étudiant | Ses classes qui ont au moins un support publié |

**StudyLib**, sous `/api` :

| Route | Jeton | Rôle |
|---|---|---|
| `POST /classe/documents?filiere=…&module=…` | enseignant (Bearer Planner) | Dépôt d'un document de portée « classe » ; le module vient de l'adresse (posée par Planner), titre et fichier du formulaire ; type réel contrôlé |
| `GET /classe/documents/{id}` · `PATCH .../{id}/publier` · `DELETE .../{id}` | enseignant auteur, admin | Lecture, passage à « école », suppression |
| `GET /interne/documents/{id}/lien` | **service** Planner (audience `studylib-interne`, revendication `doc` = cet identifiant, 60 s) | Lien signé de 5 minutes |

## 8. Sécurité

| Risque | Mesure |
|---|---|
| **Accès à la classe d'un autre** | Deux fonctions seules, testées à part : `peutGererClasse` et `peutVoirClasse`. Chaque route remonte de l'objet demandé à sa classe ; réponse 404 (et non 403) hors de ses classes, pour ne rien révéler. |
| **Épingler le document de classe d'un autre** | Planner demande le document à StudyLib **avec le jeton de l'enseignant** : StudyLib ne le rend que s'il est publié ou à lui. |
| **Fichier piégé** | Contrôlé par StudyLib comme tout dépôt (type réel, extensions permises, 20 Mo). Planner limite en plus la taille annoncée (`Content-Length`) avant de transmettre. |
| **Document de classe visible de toute l'école** | Portée globale dans StudyLib (refus par défaut) ; tests sur chaque liste et sur la recherche. |
| **Jeton de service détourné** | Audience distincte (`studylib-interne`), refusée par la garde des utilisateurs ; un seul document ; 60 secondes ; signé par la clé de Planner déjà publiée en JWKS. Il ne passe jamais par le navigateur. |
| **Lien dangereux** | `https://` ou `http://` seulement ; affiché avec son domaine ; ouvert avec `rel="noopener noreferrer"`. |
| **Abus d'envoi** | Limite de débit sur les dépôts dans Planner (30 par heure et par enseignant), en plus de celle de StudyLib. |
| **Traçabilité** | Retrait d'un support et publication dans la Bibliothèque inscrits au journal de sécurité de Planner. |

## 9. Lots

Un lot = une branche = une PR, fichiers sous 300 lignes, un parcours Playwright par écran nouveau. Les lots E-1 à E-4 se font dans les dossiers `../planner-cours` (branche `e/espace-de-cours`) et `../StudyLib-cours` (branche `e/documents-de-classe`), pour ne pas gêner le chantier des quiz.

| Lot | Contenu | Dépôt | Dépend de | Vérification |
|---|---|---|---|---|
| **E-0** | Retirer `Jeux_HESTIM/` | Planner | — | CI verte |
| **E-1** | Portée « classe » des documents, API de classe, lien interne par jeton de service | StudyLib | — | Tests Pest : portée globale sur chaque liste, refus croisés, jeton de service |
| **E-2** | Sections et supports : migration, modèles, droits, routes du § 7, transmission du fichier, jeton de service | Planner | E-1 | Tests d'intégration, dont refus croisés (autre enseignant, autre groupe, sous-groupe) |
| **E-3** | Espace de classe, onglet **Supports** | Planner (site) | E-2 | Parcours « déposer un support » |
| **E-4** | « Mes classes » en cartes, séance en cours en tête | Planner (site) | E-3 | Parcours de « Mes classes » mis à jour |
| **E-5** | « Mes cours » de l'étudiant : site et application | Planner | E-2 | Parcours étudiant ; tests de l'application |
| **E-6** | Appel : statut « en retard », motif, correction, historique par classe, export CSV | Planner (serveur) | — | Tests d'intégration |
| **E-7** | Onglets **Appel** et **Élèves** | Planner (site) | E-6 | Parcours « appel avec un retard » |
| **E-8** | « Mon service » : disponibilités, demandes de report et services en trois onglets ; menu de l'enseignant à sept entrées | Planner (site) | — | Parcours existants mis à jour |
| **E-9** | StudyLib pour l'enseignant : tableau de bord, profil et cloche renvoient à Planner | StudyLib | E-1 | Tests Pest |
| **E-10** | Recette, scénarios dans `docs/recette/scenarios-de-test.md`, fiches d'aide | les deux | tous | Recette sur la base de test |

**Premier paquet déployable** : E-1 à E-5 (l'enseignant dépose, l'étudiant voit). StudyLib et Planner se déploient ensemble : StudyLib d'abord (sa migration ajoute une colonne avec une valeur par défaut, sans effet sur l'existant).

### Avancement (15 octobre 2026)

| Lot | État | Vérifié |
|---|---|---|
| E-0 | Fait : `Jeux_HESTIM/` retiré | — |
| E-1 | Fait (`../StudyLib-cours`, `e/documents-de-classe`) : colonne `visibility` et portée globale, API de classe, lien interne, limite `interne` | 6 tests nouveaux ; suite complète 177 sur 177 |
| E-2 | Fait (`../planner-cours`, `e/espace-de-cours`) : migration 0042, `services/cours/` (droits, sections, supports, client StudyLib), `routes/espaceCoursRoutes.js`, jeton de service (`utils/jetons.js`) | 13 tests d'intégration ; serveur : 190 unitaires, 392 d'intégration, lint sans erreur |
| E-3 | Fait : page `/mes-classes/:idCours/:idGroupe` (sections, dépôt glissé-déposé avec progression, liens, masquer, déplacer, publier, retirer) ; « Supports de cours » de Mes classes y mène | Parcours `espaceCours.spec.cjs` avec une fausse Bibliothèque (`fausseBibliotheque.mjs`) |
| E-5 (site) | Fait : « Mes cours » de l'étudiant (`/mes-cours`, entrée de menu) | Même parcours |
| Menus | La Bibliothèque s'ouvre sur ses documents (`/biblio/documents`) et non plus sur son tableau de bord ; le titre de la barre suit la rubrique parente | Parcours existants |
| E-6 | Fait : trois statuts (présent, en retard, absent), motif, correction après l'appel journalisée (`presence_corrigee`), historique et taux de la classe, export CSV protégé contre les formules (`presences_exportees`) ; `services/presences/statuts.js` et `historique.js` | 7 tests d'intégration (appelClasse.test.js) ; anciens tests de l'appel inchangés |
| E-7 | Fait : onglets Supports, Appel et Élèves dans l'espace de la classe ; trois boutons par étudiant dans l'écran d'appel (`components/appel/LigneAppel.jsx`) | Parcours appelClasse.spec.cjs |
| E-8 | Fait : « Mon service » (Mes services, Disponibilités, Demandes de report) en onglets, une seule entrée de menu ; les trois adresses restent | Même parcours |
| E-5 (application) | Fait : « Mes cours » en tête de l'onglet Bibliothèque (étagère au-dessus de « Mes modules »), écran d'une classe (`app/cours/[classe].jsx`), un document s'ouvre dans la fiche habituelle (lien demandé à Planner), un lien dans le navigateur | Lint, 40 tests de l'application ; **pas encore essayé sur un téléphone** |
| Paquet de déploiement | `preparer-maj.sh --studylib` copie aussi `config/`, `bootstrap/app.php` et `providers.php` (le lot E-1 y touche) | Syntaxe du script |
| E-4 | Fait (16 octobre) : en tête, la séance en cours et son action principale (l'appel), quiz et supports en boutons secondaires ; dessous, une carte par classe (`components/mesClasses/`) qui ouvre l'espace de la classe, ou son onglet Appel si l'appel du jour est resté ouvert | Lint, build ; parcours appel, appelClasse, entreRoles et espaceCours (l'appel passe à la deuxième reprise : la connexion du premier test est lente, sur `main` aussi) |
| E-9, E-10 | À faire ; l'épinglage d'un document de la Bibliothèque existe côté serveur, pas encore à l'écran (E-9) | — |

Déploiement : `STUDYLIB_API_URL` (par défaut `http://studylib:8080/api`) est ajouté au service `backend` de `docker-compose.yml` ; **aucune dépendance nouvelle**, pas d'image à reconstruire pour Planner. StudyLib : une migration, à déployer avant Planner.

## 10. Hors du champ de ce plan

« Mes quiz » (autre chantier) ; devoirs (masqués) ; carnet de notes (R-13) ; forum ; aperçu des documents dans la page ; antivirus (ClamAV demande environ 1 Go de mémoire, que le serveur partagé n'a pas).

## 11. Questions pour le chef de projet

| Question | Recommandation |
|---|---|
| Un co-enseignant peut-il retirer les supports de l'autre ? | Non : chacun les siens, l'administration tous. |
| Un étudiant de TP voit-il les supports du CM de son groupe parent ? | Oui (règle des quiz). |
| Combien de temps garder les présences et les supports de classe ? | Présences : l'année en cours et la suivante ; supports : tant que le module existe. À valider par la scolarité. |
| ~~Qui pose le statut « excusé » ?~~ | Sans objet : pas de statut « excusé » (15 octobre 2026). |
