<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# ETA · Établissement

## Identification

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ETA.ID.NOM` | Nom de l'établissement | Nom affiché dans les emplois du temps et les exports. | contexte | texte | — | global | oui | — | 5 | — | etablissement | permanent | base (ConfigurationEtablissement.nom) | 2.1 |
| `ETA.ID.TYPE` | Type d'établissement | Nature de l'école ; propose le profil pédagogique de départ. | donnee | enum : primaire, college, lycee, formation, ecole_superieure, universite | — | global | oui | — | 1 | — | etablissement | permanent | absent | 2.2 |
| `ETA.ID.NIVEAUX` | Niveaux d'enseignement proposés | Une école peut en couvrir plusieurs : chacun suit alors son propre profil. | donnee | liste | — | global | non | — | 2 | — | etablissement | permanent | absent | 2.3 |
| `ETA.ID.STATUT` | Statut public ou privé | Choisit les règles administratives applicables. | contexte | enum : public, prive | — | global | non | — | 5 | — | etablissement | permanent | absent | 2.4 9.24 |
| `ETA.ID.PAYS` | Pays | Choisit le calendrier et les règles du pays ; aucune règle de pays n'est écrite dans le moteur. | donnee | texte | — | global | oui | — | 1 | — | etablissement | permanent | plan (fichier 06, § 6.2) | 2.5 9.25 |
| `ETA.ID.VILLE` | Région et ville | Sert au calendrier local et aux fériés régionaux. | contexte | texte | — | global | non | — | 5 | — | etablissement | permanent | absent | 2.6 |
| `ETA.ID.LANGUE` | Langue d'enseignement | Langue principale ; une matière peut en préciser une autre. | contexte | texte | — | global | non | — | 5 | — | etablissement | permanent | absent | 2.7 |
| `ETA.ID.FUSEAU` | Fuseau horaire | Heure de l'école : les règles de « date passée » et de « jour » s'y réfèrent. | donnee | texte | — | global | oui | — | 2 | — | etablissement | permanent | base (APP_TIMEZONE) | ajout |
| `ETA.ID.PROFIL` | Profil pédagogique | Jeu de valeurs de départ du moteur : primaire, collège, lycée, formation ou université. | donnee | enum : primaire, college, lycee, formation, universite | — | global, pédagogique | oui | — | 1 | — | etablissement | permanent | absent | ajout |

## Taille (comptée, jamais saisie)

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ETA.TAILLE.CAMPUS` | Nombre de campus | Compté depuis les campus actifs ; au-delà de 1, les trajets entrent en jeu. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Campus) | 2.8 12.1 |
| `ETA.TAILLE.BATIMENTS` | Nombre de bâtiments | Compté depuis les salles, quand elles auront un bâtiment : Planner ne le connaît pas aujourd'hui. | indicateur | entier | — | global | non | — | 4 | — | non | generation | absent | 2.9 |
| `ETA.TAILLE.SITES` | Nombre de sites géographiques | Compté depuis les sites ; à plusieurs sites, un groupe reste chez lui. | indicateur | entier | — | global | non | — | 4 | — | non | generation | plan (D-20) | 2.10 |
| `ETA.TAILLE.DEPARTEMENTS` | Nombre de départements | Compté depuis les rattachements. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Enseignant.departement) | 2.11 |
| `ETA.TAILLE.FACULTES` | Nombre de facultés | Compté depuis les pôles. | indicateur | entier | — | global | non | — | 4 | — | non | generation | plan (ME-2a, Pole) | 2.12 |
| `ETA.TAILLE.FILIERES` | Nombre de filières | Compté depuis l'offre de formation. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Filiere) | 2.13 |
| `ETA.TAILLE.CYCLES` | Nombre de cycles de formation | Compté depuis l'offre de formation. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Filiere.cycle) | 2.14 |
| `ETA.TAILLE.NIVEAUX` | Nombre de niveaux scolaires | Compté depuis les groupes. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Groupe.niveau) | 2.15 |
| `ETA.TAILLE.CLASSES` | Nombre de classes | Taille du problème : classes à planifier dans cette génération. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Groupe) | 2.16 17.4 |
| `ETA.TAILLE.APPRENANTS` | Nombre d'apprenants | Taille du problème : au-delà d'un seuil, la génération se fait par lots. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Etudiant) | 2.17 |
| `ETA.TAILLE.ENSEIGNANTS` | Nombre d'enseignants | Taille du problème : enseignants concernés par la génération. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Enseignant) | 2.18 17.5 |
| `ETA.TAILLE.PERSONNELS` | Nombre de personnels administratifs | Compté ; utile pour les surveillances assurées par l'administration. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base | 2.19 |
| `ETA.TAILLE.SALLES` | Nombre de salles disponibles | Taille du problème : salles proposées à la génération. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Salle) | 17.6 |
| `ETA.TAILLE.MATIERES` | Nombre de matières | Taille du problème : matières à planifier. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Cours) | 17.7 |
| `ETA.TAILLE.CRENEAUX` | Nombre de créneaux | Taille du problème : créneaux proposés à la génération. | indicateur | entier | — | global | non | — | 4 | — | non | generation | base (Creneau) | 17.8 7.9 |

## Organisation

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ETA.ORGA.JOURS_OUVERTS` | Jours d'ouverture | Jours où une séance peut avoir lieu. | donnee | liste_jours | `["lundi","mardi","mercredi","jeudi","vendredi","samedi"]` | global, pédagogique | oui | — | 1 | — | etablissement | annee | base (Creneau.jour_semaine) | 2.21 2.22 |
| `ETA.ORGA.HEURE_OUVERTURE` | Heure d'ouverture | Aucune séance ni préparation avant cette heure. | donnee | heure | — | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | 2.23 7.1 |
| `ETA.ORGA.HEURE_FERMETURE` | Heure de fermeture | Aucune séance ni rangement après cette heure. | donnee | heure | — | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | 2.24 7.2 |
| `ETA.ORGA.VACATIONS` | Nombre de vacations quotidiennes | Double vacation : deux équipes de classes se partagent les salles dans la journée. | donnee | entier | `1` | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | 2.25 |
| `ETA.ORGA.DEMI_JOURNEES` | Organisation en matinée et après-midi | La journée se coupe en deux demi-journées séparées par le repas. | donnee | booleen | `true` | global, pédagogique | non | — | 2 | — | etablissement | annee | solveur (probleme.js, APRES_MIDI (en dur à 12 h 30)) | 2.26 |
| `ETA.ORGA.JOURNEE_CONTINUE` | Journée continue | Pas de longue coupure : la pause du midi est courte ou absente. | donnee | booleen | `false` | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | 2.27 |
| `ETA.ORGA.HORAIRES_DECALES` | Horaires décalés | Plusieurs groupes commencent à des heures différentes. | donnee | booleen | `false` | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | 2.28 |
| `ETA.ORGA.COURS_SOIR` | Cours du soir | Une grille du soir existe pour certains parcours. | donnee | booleen | `false` | global, pédagogique | non | — | 2 | — | etablissement | annee | base (Filiere.regime) | 2.29 16D.5 |
| `ETA.ORGA.COURS_WEEKEND` | Cours du week-end | Une grille du week-end existe pour certains parcours. | donnee | booleen | `false` | global, pédagogique | non | — | 2 | — | etablissement | annee | base (Filiere.regime) | 2.30 16D.6 |
| `ETA.ORGA.EQUIPES` | Équipes pédagogiques | Enseignants regroupés par équipe ; une plage commune peut leur être réservée. | donnee | structure | — | global, pédagogique | non | — | 4 | — | etablissement | annee | absent | 2.20 |
| `ETA.ORGA.REGIME` | Rythme de formation | Initiale, continue, alternance... : chaque rythme a sa grille horaire. | donnee | reference | — | pédagogique | oui | — | 1 | — | etablissement | annee | solveur (Filiere.regime, ME-2a Rythme) | 16D.1 16D.2 16D.3 16D.4 16D.7 |
