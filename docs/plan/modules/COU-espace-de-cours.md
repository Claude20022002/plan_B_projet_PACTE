# COU · Espace de cours

**Objet** : la vie pédagogique d'une classe :
- supports en sections ;
- annonces ;
- dates d'ouverture ;
- lien de visio ;
- sondages ;
- devoirs ;
- échanges ;
- offres de stage.

C'est l'équivalent de Moodle et de Classroom, à l'intérieur de Planner.

**Hors module** :
- les fichiers eux-mêmes, gardés par StudyLib : BIB ;
- les quiz et les jeux : QJE ;
- les notes officielles : VSC-04.

**Tables possédées** : `SectionCours`, `SupportCours`, `Sondage`, `SondageChoix`, `SondageParticipation`, `Devoir`, `DevoirRendu`, `FichierDevoir`, `RetourSeance*`, `Annonce*`.

## Ce qui existe

- **Fichiers** : `espaceCoursRoutes`, `services/cours/*` ; écrans `EspaceClasse`, `MesCours` et `MesClasses` sur le site ; `cours/[classe]` et `document/[id]` dans l'application.
- **Livré par l'espace de cours (E-0 à E-10)** :
  - migrations 0042 et 0043 ;
  - dates d'ouverture (EC-1, migration 0056) ;
  - annonces des enseignants (EC-5, **éteintes** par `ANNONCES_ENSEIGNANTS_ACTIVES`) ;
  - lien de visio (EC-11, migration 0058).
- **Sondage de l'enseignant à sa classe** (EC-9, migration 0059, fusionné le 7 novembre) : anonyme, derrière l'interrupteur de l'école.
- **Devoirs** : le code existe (`devoirRoutes`) mais est **éteint** (`DEVOIRS_ACTIFS=false`). Le retour des devoirs avec rendu de fichier est décidé depuis le 25 octobre.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| COU-01 | Sondage de l'enseignant à sa classe | EC-9 | libre | S | — | fait (#148) |
| COU-02 | Devoirs avec rendu de fichier, après une revue de sécurité (taille, type, antivirus, stockage par StudyLib) | EC-2 | 4 | L | BIB-01 | à faire |
| COU-03 | Commentaires sur un support ou un devoir | EC-6 | 4 | M | COU-02 | à faire |
| COU-04 | Questions partagées de la classe | EC-7 | 4 | M | — | à faire |
| COU-05 | « Vu » : l'enseignant sait qui a ouvert un support ou une annonce | EC-8 | 4 | M | — | à faire |
| COU-06 | Export des notes d'un devoir | R-13 | libre | S | COU-02 | à faire |
| COU-07 | Offres de stage (espace Carrière) : reprendre ou fermer `b/offres-stage` | S-1 | libre | M | — | à décider |
| COU-08 | Messagerie, si les règles de modération sont tranchées (Q-17) | EC-10 | 5 | L | Q-17 | conditionnel |
| COU-09 | LTI : ouvrir un outil extérieur dans l'espace de cours | EC-12 | — | L | — | reporté |

## Critères de « terminé »

- **COU-02** :
  - un fichier interdit est refusé ;
  - un étudiant ne voit que son rendu ;
  - le rendu tardif est marqué ;
  - un parcours complet le prouve.
- **COU-05** : le « vu » ne s'affiche qu'à l'enseignant de la classe, jamais aux autres élèves.

## Exigences produit

EP-6, EP-7.

## Conception et références

- [Conception d'EC-9](../../conception/espace-de-cours/conception-ec9-sondage.md)
- Archives : [espace de cours](../../archives/plans/espace-de-cours.md), [parité avec Moodle et Classroom](../../archives/plans/planner-multi-etablissements/14-parite-moodle-classroom.md), [espace enseignant](../../archives/plans/espace-enseignant.md)
