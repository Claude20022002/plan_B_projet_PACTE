<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# GRP · Classes, groupes et apprenants

## Identification et rattachement

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GRP.ID.ID` | Identifiant de classe | Clé stable de la classe ou du groupe. | donnee | texte | — | individuel (groupe) | oui | — | 1 | — | non | annee | solveur (Groupe.id_groupe) | 3.1 |
| `GRP.ID.NOM` | Nom de classe | Nom affiché ; unique dans une année. | donnee | texte | — | individuel (groupe) | oui | — | 3 | — | etablissement | annee | base (Groupe.nom_groupe) | 3.2 |
| `GRP.ID.NIVEAU` | Niveau scolaire | CP, 3e, L2... : le profil applicable peut en dépendre. | donnee | reference | — | individuel (groupe) | oui | — | 2 | — | etablissement | annee | base (Groupe.niveau) | 3.3 |
| `GRP.ID.CYCLE` | Cycle d'enseignement | Prépa, licence, ingénieur... | donnee | reference | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | base (Filiere.cycle) | 3.4 |
| `GRP.ID.FILIERE` | Filière | Rattachement à l'offre de formation ; donne le rythme, donc la grille. | donnee | reference | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | base (Groupe.id_filiere) | 3.5 16C.1 16E.5 |
| `GRP.ID.OPTION` | Option | Option suivie par ce groupe. | donnee | reference | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | absent | 3.6 16C.2 16E.7 |
| `GRP.ID.SPECIALITE` | Spécialité | Spécialité ou spécialisation du groupe. | donnee | reference | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | absent | 3.7 16C.1 16E.7 |
| `GRP.ID.SECTION` | Section | Subdivision d'un niveau. | donnee | texte | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | absent | 3.8 |
| `GRP.ID.PROMOTION` | Promotion | Groupe racine : un CM de promotion occupe tous ses TD et TP. | donnee | reference | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | solveur (Groupe.type_groupe) | 3.9 |
| `GRP.ID.ANNEE_ETUDE` | Année d'étude | Rang dans le cursus. | donnee | entier | — | individuel (groupe) | non | — | 3 | — | etablissement | annee | base (Groupe.annee) | 3.10 |
| `GRP.ID.ANNEE_SCOLAIRE` | Année scolaire du groupe | Sépare les groupes de deux années. | donnee | reference | — | individuel (groupe) | oui | — | 1 | — | etablissement | annee | base (Groupe.id_annee (ME-18)) | ajout |

## Hiérarchie des groupes

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GRP.HIER.PRINCIPAL` | Groupe principal | Groupe parent ; le conflit se propage de la promotion aux TD et TP. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | solveur (Groupe.id_groupe_parent, groupes.js) | 3.12 |
| `GRP.HIER.SOUS_GROUPE` | Sous-groupe | Groupe le plus fin : c'est sa journée qui est évaluée (heures, trous, campus). | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | solveur (Groupe.id_groupe_parent, groupes.js) | 3.13 |
| `GRP.HIER.TP` | Groupe de travaux pratiques | Demi-groupe de TP. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | solveur (Groupe.id_groupe_parent, groupes.js) | 3.14 16E.12 |
| `GRP.HIER.TD` | Groupe de travaux dirigés | Groupe de TD. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | solveur (Groupe.id_groupe_parent, groupes.js) | 3.15 16E.11 |
| `GRP.HIER.LANGUES` | Groupe de langues | Regroupement transversal : ses membres viennent de plusieurs classes. Hors de la hiérarchie actuelle. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | absent | 3.16 16B.3 |
| `GRP.HIER.SPECIALISATION` | Groupe de spécialisation | Regroupement transversal par spécialité. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | absent | 3.17 16C.4 16B.4 |
| `GRP.HIER.OPTIONS` | Groupe d'options | Regroupement transversal par option : les groupes qui partagent un élève ne peuvent pas être simultanés. | donnee | reference | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | absent | 3.18 |
| `GRP.HIER.INSCRIPTIONS` | Inscriptions individuelles aux groupes | Quels élèves suivent quels groupes : seule source fiable des conflits entre options. | donnee | structure | — | individuel (groupe) | non | — | 1 | — | etablissement | annee | base (Appartenir) | 3.26 |

## Effectifs

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GRP.EFF.TOTAL` | Nombre total d'apprenants | Effectif utilisé par la capacité des salles. | donnee | entier | — | pédagogique, individuel (groupe) | oui | — | 1 | — | etablissement | periode | solveur (Groupe.effectif) | 3.19 |
| `GRP.EFF.MIN` | Effectif minimum | En dessous, le groupe n'ouvre pas ou fusionne. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.20 16D.10 |
| `GRP.EFF.MAX` | Effectif maximum | Au-dessus, le groupe doit être dédoublé. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.21 16D.10 |
| `GRP.EFF.CAPACITE_PEDAGO` | Capacité pédagogique de la classe | Plafond pédagogique, distinct de la capacité de la salle. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.22 |
| `GRP.EFF.PRESENTS` | Présents habituels | Effectif réel constaté ; permet une salle plus petite si l'école l'accepte. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.23 |
| `GRP.EFF.PAR_SOUS_GROUPE` | Élèves par sous-groupe | Taille visée lors du découpage en TD ou TP. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.24 |
| `GRP.EFF.ACCOMPAGNEMENT` | Élèves à accompagnement particulier | Peut imposer un encadrant ou une salle accessible. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.25 |
| `GRP.EFF.REPARTITION_MIXTE` | Répartition filles/garçons | Sert seulement si l'organisation l'exige (vestiaires, sport). | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 5 | — | etablissement | periode | absent | 3.27 |
| `GRP.EFF.INSCRITS_OPTION` | Inscrits par option | Effectif d'une option (compté) ; dimensionne sa salle. | donnee | entier | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.28 |

## Disponibilités et suivi

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GRP.DISPO.CLASSE` | Disponibilité de la classe | Créneaux où la classe peut avoir cours. | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.29 |
| `GRP.DISPO.GROUPE` | Disponibilité par groupe | Créneaux propres à un groupe (alternants, stagiaires). | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.30 16D.14 |
| `GRP.DISPO.MUTUALISES` | Cours communs ou mutualisés | Un enseignement suivi par plusieurs classes ou filières à la même heure. | donnee | liste_references | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | periode | solveur (EnseignementGroupe) | 3.33 3.34 16C.7 16E.13 8.26 |
| `GRP.DISPO.EXTRASCOLAIRE` | Activités extrascolaires | Créneaux réguliers occupés hors des cours. | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.35 |
| `GRP.DISPO.DISPENSES` | Dispenses | Élèves dispensés d'une activité : le conflit ne compte plus pour eux. | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 3 | — | etablissement | periode | absent | 3.39 |

## Règles des groupes

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GRP.REGLE.CONFLIT` | Une classe n'a qu'un cours à la fois | Aucune séance simultanée pour un groupe, hiérarchie comprise. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (ContraintesEmploiDuTemps.conflitGroupe) | 17B.2 18A.2 |
| `GRP.REGLE.CONFLIT_ELEVES` | Groupes partageant des élèves | Deux groupes hors hiérarchie (langues, options) ne se chevauchent pas s'ils partagent un élève. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | absent | 17B.8 3.40 17B.13 14.15 |
| `GRP.REGLE.OPTIONS_INCOMPATIBLES` | Conflits entre options, tolérance | Part d'élèves laissés sans leur choix d'option si tout ne peut pas tenir. | regle | pourcentage | `0` | global, pédagogique | non | souple * | 2 | 60 | etablissement | permanent | absent | 16C.2 |
| `GRP.REGLE.EFFECTIFS_BORNES` | Effectifs dans les bornes | Un groupe sous son minimum ou au-dessus de son maximum est signalé avant le calcul. | regle | booleen | `true` | global | non | souple * | 3 | 5 | etablissement | permanent | absent | 16D.10 |
| `GRP.REGLE.SITE` | Un groupe reste sur son site | Une séance d'un groupe n'a lieu que dans une salle d'un campus de son site. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | plan (D-20, ME-25) | ajout |
