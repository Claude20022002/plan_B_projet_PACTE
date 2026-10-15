# Plan : l'espace de cours de l'enseignant (ses classes comme sur Moodle, en plus simple)

Statut : **à faire**. Rédigé le 15 octobre 2026. Ce plan reprend la partie « classe » de `espace-enseignant.md` (§ 2 et 5 bis) et la remplace pour les supports ; l'appel projeté (P-1) et le quiz en direct (CQ-1 à CQ-3) restent décrits là-bas et sont réutilisés ici.

## 1. Objectif

L'enseignant gère ses classes dans Planner comme il le ferait dans Moodle, sans en avoir la complexité :

- **déposer un support pour une classe** (fichier ou lien), visible des seuls étudiants de cette classe ;
- **faire l'appel** et retrouver l'historique des présences de la classe ;
- **écrire à la classe** (déjà fait : annonces) ;
- **lancer un quiz** pendant la séance, à partir de sa banque de quiz.

**Décisions du chef de projet (15 octobre 2026)**

| Sujet | Décision |
|---|---|
| Où vivent les supports d'une classe | **Dans Planner** : un espace de cours par classe, fichiers dans MinIO. La Bibliothèque (StudyLib) reste celle de toute l'école ; un bouton « Publier aussi dans la Bibliothèque » fait le lien. |
| Quiz et classes | **Banque libre** : un quiz appartient à l'enseignant, il se crée sans classe ni module. Lancé pendant une séance, la partie est rattachée à cette séance (étudiants prévenus, résultats rangés dans la classe). |
| `Jeux_HESTIM/` | Projet d'un autre groupe : **retiré du dépôt** (lot E-0). |

## 2. Ce qu'on reprend des meilleurs, et ce qu'on laisse

| Source | Ce qu'on reprend | Ce qu'on laisse |
|---|---|---|
| **Google Classroom** | La classe en quatre onglets (fil, travaux, personnes, notes) : c'est l'organisation la plus simple connue des enseignants. Un seul bouton « + Ajouter » par écran. | Les devoirs (masqués à HESTIM), la notation. |
| **Moodle**, cours | Les **sections** (par semaine ou par thème), les supports **masqués** puis publiés, la publication **à une date**. | Les 20 types d'activités, les blocs, les rôles fins, l'éditeur de page. |
| **Moodle**, module Présence (`mod_attendance`) | Quatre statuts : **présent, en retard, excusé, absent** ; taux de présence par étudiant ; export. | Les sessions créées à la main (chez nous la séance vient de l'emploi du temps), le barème de note de présence. |
| **Canvas**, « Modules » | Un ordre clair des supports, la glisser-déposer pour réordonner. | Les prérequis entre modules. |

Projets à code ouvert à lire pour le détail (lecture d'idées seulement, aucun code copié sans vérifier la licence) : Moodle (`mod/resource`, `mod/url`, `mod/attendance`, GPL v3) ; Canvas LMS (AGPL v3). **Les deux licences sont à partage à l'identique** : on s'en inspire, on ne recopie pas de code.

## 3. La classe : une notion déjà présente

Une classe est le couple **(module, groupe)** que rend déjà `mesClasses` (`backend/services/planning/mesClasses.js`), à partir des services de l'enseignant et de son emploi du temps. On ne crée pas de table « classe ».

- **Plusieurs enseignants** peuvent avoir la même classe (CM et TD d'un même module) : l'espace est **partagé**. Chacun ajoute des supports ; seul l'auteur (ou l'administration) modifie ou supprime le sien.
- **Étudiants de la classe** : ceux du groupe et de ses sous-groupes (TP), avec la règle déjà écrite pour les quiz (`groupesANotifier`, `descendants`). Un étudiant de TP voit les supports du CM de son groupe parent.
- **Fin d'année** : l'espace reste consultable en lecture seule par l'enseignant, il disparaît pour les étudiants quand ils ne sont plus dans le groupe.

## 4. Les écrans

Règle de style pour tout ce plan : on applique les constats de l'état des lieux du 15 octobre. **Pas de capitales étroites pour le contenu** (noms de cours, titres de supports) : le style « volet » reste au tableau des départs et aux horaires. Couleurs lues dans les jetons du thème uniquement, aucune couleur en dur. Composants MUI standard (Tabs, List, Card, Dialog), mêmes rayons et mêmes espacements dans les deux thèmes.

### 4.1 « Mes classes » (`/mes-classes`), refondu

- En haut, **la séance en cours** (s'il y en a une), avec **une seule action principale** : « Faire l'appel ». Les autres (Écrire à la classe, Lancer un quiz) sont des boutons secondaires.
- Dessous, **une carte par classe** : nom du module, groupe, effectif, prochaine séance, nombre de supports, taux de présence du mois. Toute la carte ouvre l'espace de la classe.
- Recherche et filtre par période quand l'enseignant a plus de six classes.

### 4.2 L'espace d'une classe (`/mes-classes/:idCours/:idGroupe`)

En-tête : module, groupe, effectif, prochaine séance, bouton principal « + Ajouter un support ». Quatre onglets, l'adresse garde l'onglet (`?onglet=supports`) :

| Onglet | Contenu | Actions |
|---|---|---|
| **Supports** (par défaut) | Sections dans l'ordre choisi ; dans chaque section, les supports avec icône du type, titre, taille, date, auteur, « vu par 18 sur 28 ». Section « Dans la Bibliothèque » repliée en bas : documents StudyLib du module, en lecture | Ajouter un fichier (glisser-déposer, plusieurs à la fois) ou un lien ; créer, renommer, réordonner une section ; masquer ou publier ; publier à une date ; remplacer le fichier ; supprimer (annulable 10 secondes, corbeille 30 jours) ; « Publier aussi dans la Bibliothèque » |
| **Appel** | Séances de la classe, les plus récentes d'abord : date, état de l'appel, présents / retards / excusés / absents | Ouvrir l'appel du jour (écran existant `/appel/:id`), corriger un statut après coup, exporter en CSV |
| **Élèves** | Liste de la classe : nom, taux de présence, absences non excusées, dernière présence ; tri par taux | Ouvrir la fiche de présence d'un étudiant ; écrire à la classe |
| **Quiz** | Parties jouées dans cette classe : date, quiz, joueurs, moyenne | Ouvrir les résultats (écran existant) ; lancer un quiz si une séance est en cours |

État vide de chaque onglet : une phrase et le bouton qui le remplit (« Aucun support. + Ajouter un support »). Sur téléphone, les onglets deviennent défilants, la liste reste lisible à 360 px.

### 4.3 « Mes quiz » (`/mes-quiz`), la banque de l'enseignant

- Liste de ses quiz (ClassQuiz) : titre, nombre de questions, dernière partie. Recherche.
- **Créer un quiz** : sujet ou document, puis « Générer » ou « Le faire moi-même » (écran existant), **sans choisir de classe ni de module**. Le module devient une étiquette facultative pour retrouver ses quiz.
- **Lancer** : si une séance est en cours, la partie s'y rattache d'elle-même ; sinon, l'enseignant choisit une séance du jour ou lance « hors séance » (partie rejointe par code, personne n'est prévenu).
- Remplace l'entrée « Activités » du menu de l'enseignant.

### 4.4 Côté étudiant

- **Site** : entrée « Mes cours » ; une carte par module suivi ; dans chaque module, les sections et supports publiés. Téléchargement ou ouverture du lien. Rien à modifier.
- **Application mobile** : dans l'onglet Bibliothèque, un premier bloc « Mes cours » au-dessus de StudyLib, même contenu. Notification « Nouveau support en *module* » (regroupée : une par classe et par heure au plus).
- L'étudiant voit **son** taux de présence par module (déjà en partie dans `/presence`).

### 4.5 Menu de l'enseignant après le plan

Tableau · Emploi du temps · **Mes classes** · **Mes quiz** · Annonces · Disponibilités · Demandes de report · (Services et Suivi pour un responsable de filière). « Mes séances » et « Activités » disparaissent, leur contenu est dans « Mes classes » et « Mes quiz ».

## 5. Données

Une migration par lot, numérotées après la dernière en place (0041 au 12 octobre).

| Table | Colonnes principales | Notes |
|---|---|---|
| `SectionsCours` | `id_section`, `id_cours`, `id_groupe`, `titre`, `ordre`, `visible`, `id_user_auteur`, dates | Index (`id_cours`, `id_groupe`, `ordre`). Une section « Général » est créée à la première ouverture. |
| `Supports` | `id_support`, `id_section`, `type` (`fichier`, `lien`), `titre`, `description`, `cle_objet`, `nom_fichier`, `type_mime`, `taille`, `empreinte_sha256`, `url`, `visible`, `publie_le`, `id_user_auteur`, `supprime_le`, dates | `cle_objet` : UUID, jamais le nom d'origine. Suppression douce (`supprime_le`), purge après 30 jours par une tâche périodique (verrou A-7). |
| `SupportsConsultations` | `id_support`, `id_user`, `premiere_le` | Clé primaire double. Sert au « vu par ». |
| `Presences` (modifiée) | + `statut` (`present`, `retard`, `excuse`), + `motif` (texte court), + `modifie_par`, `modifie_le` | Absent = pas de ligne, comme aujourd'hui : aucune donnée existante à reprendre. Le scan donne `present`. |
| `QuizParties` | inchangée | `id_affectation` reste facultatif : c'est déjà le lien « partie ↔ séance ». |

## 6. API

Toutes sous `/api`, protégées par la session, le CSRF et le format d'erreur commun (A-5).

| Méthode et route | Qui | Rôle |
|---|---|---|
| `GET /classes/:idCours/:idGroupe` | enseignant de la classe, admin | En-tête de l'espace : module, groupe, effectif, prochaine séance |
| `GET /classes/:idCours/:idGroupe/supports` | enseignant de la classe ; étudiant de la classe (publiés seulement) | Sections et supports |
| `POST /classes/:idCours/:idGroupe/sections` · `PUT /sections/:id` · `DELETE /sections/:id` · `PUT /classes/:idCours/:idGroupe/sections/ordre` | enseignant de la classe | Gestion des sections |
| `POST /sections/:id/supports` (multipart, un fichier) · `POST /sections/:id/liens` | enseignant de la classe | Ajout |
| `PUT /supports/:id` · `PUT /supports/:id/fichier` · `DELETE /supports/:id` · `POST /supports/:id/restaurer` | auteur, admin | Modification, remplacement, corbeille |
| `GET /supports/:id/telecharger` | ayants droit | Répond **302** vers un lien MinIO signé de 5 minutes ; enregistre la consultation |
| `POST /supports/:id/bibliotheque` | auteur | Copie le document dans StudyLib (route de dépôt existante) |
| `GET /classes/:idCours/:idGroupe/appels` · `GET .../appels.csv` | enseignant de la classe, admin | Historique de l'appel |
| `PUT /presences/seances/:id/etudiants/:idUser` (existante, étendue) | enseignant de la séance | Statut `present`, `retard`, `excuse` ou absent, avec motif |
| `GET /classes/:idCours/:idGroupe/eleves` | enseignant de la classe, admin | Liste et taux de présence |
| `GET /etudiant/cours` | étudiant | Ses modules et leurs supports publiés |
| `GET /quiz/mes-quiz` · `POST /quiz/parties` (existante, `id_affectation` facultatif) | enseignant | Banque et lancement |

## 7. Sécurité

| Risque | Mesure |
|---|---|
| **Accès à la classe d'un autre** (IDOR) | Deux fonctions seules, testées à part : `peutGererClasse(user, idCours, idGroupe)` (réutilise `peutViserClasse`) et `peutVoirClasse(user, …)` (étudiant inscrit au groupe ou à un sous-groupe). Chaque route part de l'objet demandé et remonte à sa classe ; jamais d'identifiant de classe pris dans le corps sans contrôle. Tests d'intégration : un enseignant B et un étudiant d'un autre groupe reçoivent 404 sur chaque route. |
| **Fichier piégé** | Liste blanche d'extensions **et** contrôle de la signature réelle du fichier (`file-type`) : PDF, Office, OpenDocument, images (PNG, JPEG, WebP), ZIP, TXT, MP4. **Refusés** : HTML, SVG, scripts, exécutables. 20 Mo au plus (nginx accepte 25). Le serveur fixe `Content-Type` et `Content-Disposition: attachment` sur l'objet ; le nom d'origine est nettoyé et n'est jamais une clé de stockage. |
| **Lecture directe du stockage** | Compartiment `planner-supports` **privé**, distinct de `studylib`. Seul le serveur a une clé ; le navigateur ne reçoit que des liens signés de 5 minutes, en lecture (le domaine `fichiers.` n'accepte déjà que GET et HEAD). |
| **Lien dangereux** | Lien accepté en `https://` (et `http://`) seulement ; affiché avec son domaine ; ouvert avec `rel="noopener noreferrer"`. Pas d'aperçu intégré (la CSP l'interdit, et c'est voulu). |
| **Abus d'envoi** | Limite de débit dédiée aux envois (30 par heure et par enseignant) ; quota par classe (500 Mo), affiché à l'enseignant. |
| **Corps trop gros** | Le fichier passe en flux (`busboy`) vers MinIO, jamais en base64 dans du JSON ni en BLOB dans MySQL. |
| **Données personnelles** | La présence est une donnée personnelle : visible de l'étudiant lui-même, des enseignants de la classe et de l'administration seulement ; l'export CSV est inscrit au journal de sécurité. Durée de conservation à fixer avec l'école (§ 11). |
| **Traçabilité** | Suppression, restauration, changement de statut de présence après fermeture de l'appel : inscrits au journal de sécurité (qui, quand, avant, après). |

**Dépendances nouvelles** : `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` (ou le client `minio`), `busboy`, `file-type`. Elles changent `package.json` du serveur : **l'image du serveur est à reconstruire** au déploiement (`DEPLOIEMENT.md`, « Quand les dépendances changent »). Ajouter au `.env.docker` : point d'accès, clés et nom du compartiment, et sa création à `minio-init`. La sauvegarde (A-3) doit inclure ce compartiment.

## 8. Expérience utilisateur : règles de ce plan

1. **Une action principale par écran**, en bouton plein ; les autres en boutons simples.
2. **Les mots de l'enseignant** : « classe », « support », « section », « appel » ; jamais « affectation », « composante » ni « enseignement » à l'écran.
3. **Rien de bloquant sans retour** : chaque envoi montre sa progression, chaque erreur dit quoi faire (« Ce type de fichier n'est pas accepté : PDF, Word, PowerPoint, images… »).
4. **Annuler plutôt que confirmer** pour les suppressions simples (bandeau « Support supprimé · Annuler ») ; la fenêtre de confirmation commune (B-5) reste pour ce qui ne s'annule pas.
5. **Téléphone d'abord pour l'appel**, bureau d'abord pour le dépôt ; chaque écran testé à 360 px et à 1440 px.
6. **Accessibilité AA** : contraste vérifié dans les deux thèmes et les deux modes, navigation au clavier dans les onglets et la zone de dépôt, libellés sur chaque bouton à icône.
7. **Textes en français et en anglais**, mêmes clés dans les deux fichiers (test B-3).

## 9. Lots

Groupe A : serveur, stockage, déploiement. Groupe B : site et application. Un lot = une branche = une PR, fichiers sous 300 lignes, un parcours Playwright par écran nouveau.

| Lot | Contenu | Groupe | Dépend de | Vérification |
|---|---|---|---|---|
| **E-0** | Retirer `Jeux_HESTIM/` du dépôt (le projet garde son propre dépôt) | A | — | `git ls-files Jeux_HESTIM` vide, CI verte |
| **E-1** | Stockage : compartiment `planner-supports`, client S3 du serveur, liens signés, envoi en flux avec contrôle de type | A | — | Tests unitaires (types acceptés et refusés, taille) ; MinIO local dans `docker-compose.yml` |
| **E-2** | Sections et supports : migration, modèles, `peutGererClasse` / `peutVoirClasse`, routes du § 6 (supports), corbeille, journal | A | E-1 | Tests d'intégration, dont les refus croisés (autre enseignant, autre groupe, sous-groupe) |
| **E-3** | Espace de classe, onglet **Supports** (enseignant) : sections, dépôt glissé-déposé, lien, masquer, réordonner, corbeille | B | E-2 | Parcours « déposer un support » |
| **E-4** | « Mes classes » refondu en cartes, séance en cours en tête, menu de l'enseignant du § 4.5 | B | E-3 | Parcours existants de « Mes classes » mis à jour |
| **E-5** | Côté étudiant : « Mes cours » sur le site, bloc « Mes cours » dans l'application, notification groupée | B (A pour la notification) | E-2 | Parcours étudiant ; tests de l'application |
| **E-6** | Appel : statuts retard et excusé, motif, correction après coup, historique par classe, taux, export CSV | A | — | Tests d'intégration, export ouvert dans un tableur |
| **E-7** | Onglets **Appel** et **Élèves**, choix du statut dans l'écran d'appel | B | E-6 | Parcours « appel avec un retard et un excusé » |
| **E-8** | Quiz détachés : création sans module ni classe (module en étiquette), lancement hors séance, page « Mes quiz », onglet **Quiz** de la classe | A et B | CQ-2 fait | Parcours « créer puis lancer un quiz » |
| **E-9** | « Publier aussi dans la Bibliothèque » et section « Dans la Bibliothèque » | A et B | E-3 | Essai sur StudyLib local |
| **E-10** | Recette complète, scénarios ajoutés à `docs/recette/scenarios-de-test.md`, fiches d'aide « Déposer un support » et « Corriger un appel » | A et B | tous | Recette déroulée sur la base de test |

Ordre conseillé : E-0, puis E-1 → E-2 → E-3 → E-4 (le cœur demandé), E-6 → E-7 en parallèle côté A dès E-2 fini, puis E-5, E-8, E-9, E-10. **Premier paquet déployable** après E-4 : l'enseignant dépose déjà ses supports ; les étudiants les voient avec E-5, qu'il vaut mieux livrer dans le même paquet.

## 10. Hors du champ de ce plan

Devoirs et dépôt de copies (masqués, décision du 11 octobre) ; carnet de notes (R-13, attend le retour des devoirs) ; forum et messagerie privée ; éditeur de pages riches ; aperçu des documents dans la page ; antivirus des fichiers (ClamAV demande environ 1 Go de mémoire, que le serveur partagé n'a pas : à revoir si l'école le demande).

## 11. Questions pour le chef de projet

| Question | Recommandation |
|---|---|
| Un co-enseignant peut-il modifier les supports de l'autre ? | Non : chacun les siens, l'administration tous. |
| Un étudiant de TP voit-il les supports déposés pour le CM de son groupe parent ? | Oui (règle déjà appliquée aux quiz). |
| Combien de temps garder les présences et les supports ? | Présences : l'année en cours et la suivante ; supports : tant que le module existe. À faire valider par la scolarité. |
| Le statut « excusé » est-il posé par l'enseignant seul, ou aussi par la scolarité sur justificatif ? | Les deux, la scolarité depuis « Signalements de présence ». |
| L'absence compte-t-elle dans la paie (séance sans appel) comme aujourd'hui ? | Inchangé : seul l'état de l'appel (fait ou non) compte. |
