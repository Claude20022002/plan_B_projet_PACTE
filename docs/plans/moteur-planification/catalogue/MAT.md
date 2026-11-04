<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# MAT · Matières et enseignements

## Identification

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `MAT.ID.CODE` | Code de la matière | Clé naturelle à l'import. | contexte | texte | — | individuel (matiere) | oui | — | 4 | — | etablissement | annee | base (Cours.code_cours) | 4.1 |
| `MAT.ID.NOM` | Nom de la matière | Nom affiché. | contexte | texte | — | individuel (matiere) | oui | — | 4 | — | etablissement | annee | base (Cours.nom_cours) | 4.2 |
| `MAT.ID.DISCIPLINE` | Discipline | Sert à l'alternance et à la compétence des enseignants. | donnee | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | absent | 4.3 |
| `MAT.ID.DOMAINE` | Domaine pédagogique | Scientifique, littéraire, artistique... : sert à l'alternance. | donnee | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | absent | 4.4 |
| `MAT.ID.NIVEAU` | Niveau concerné | Niveau qui suit la matière. | contexte | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | base (Cours.niveau) | 4.5 |
| `MAT.ID.FILIERE` | Filière concernée | Filière qui porte la matière. | contexte | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | base (Cours.id_filiere) | 4.6 |
| `MAT.ID.CARACTERE` | Obligatoire ou facultative | Une matière facultative peut céder la place si tout ne tient pas. | donnee | enum : obligatoire, facultative | `obligatoire` | individuel (matiere) | non | — | 2 | — | etablissement | annee | absent | 4.7 4.12 3.31 3.32 16C.3 16E.6 |
| `MAT.ID.RANG` | Principale ou secondaire | Une matière principale est placée d'abord et sur les meilleurs créneaux. | donnee | enum : principale, secondaire | `principale` | individuel (matiere) | non | — | 3 | — | etablissement | annee | absent | 4.8 |
| `MAT.ID.NATURE` | Théorique ou pratique | Sert à l'alternance théorie-pratique. | donnee | enum : theorique, pratique, mixte | — | individuel (matiere) | non | — | 3 | — | etablissement | annee | absent | 4.9 |
| `MAT.ID.TRANSVERSALE` | Matière transversale | Suivie par plusieurs filières. | contexte | booleen | `false` | individuel (matiere) | non | — | 4 | — | etablissement | annee | absent | 4.10 |
| `MAT.ID.MUTUALISEE` | Matière mutualisée | Peut être suivie ensemble par plusieurs groupes. | donnee | booleen | `false` | individuel (matiere) | non | — | 2 | — | etablissement | annee | solveur (EnseignementGroupe) | 4.11 4.52 16E.13 |
| `MAT.ID.UE` | Unité d'enseignement | Regroupe des éléments constitutifs ; relève du suivi plus que du calcul. | contexte | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | absent | 16E.1 3D.5 |
| `MAT.ID.ECUE` | Élément constitutif | Partie d'une unité d'enseignement. | contexte | reference | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | absent | 16E.2 |
| `MAT.ID.CREDITS` | Crédits académiques | ECTS ou équivalent ; relève du suivi. | contexte | decimal | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | base (Cours.ects) | 16E.3 |
| `MAT.ID.COEFFICIENT` | Coefficient | Peut servir de poids à une matière importante. | contexte | decimal | — | individuel (matiere) | non | — | 4 | — | etablissement | annee | base (Cours.coefficient) | ajout |
| `MAT.ID.DIFFICULTE` | Charge cognitive de la matière | De 1 à 5 : base des règles d'organisation cognitive. Aucune de ces règles ne tient sans elle. | donnee | entier | `3` | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | annee | absent | ajout |

## Volume et découpage en séances

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `MAT.VOL.H_SEMAINE` | Volume hebdomadaire | Heures par semaine (secondaire surtout). | donnee | decimal | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.13 |
| `MAT.VOL.H_MOIS` | Volume mensuel | Heures par mois (formation). | donnee | decimal | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.14 |
| `MAT.VOL.H_ANNEE` | Volume annuel | Heures par an. | donnee | decimal | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.15 |
| `MAT.VOL.H_PERIODE` | Volume semestriel | Heures de la période ; c'est ce volume que le déploiement ne dépasse jamais. | donnee | decimal | — | pédagogique, individuel (matiere) | oui | — | 1 | — | etablissement | periode | solveur (CoursComposante.volume_heures, Enseignement.heures_prevues) | 4.16 |
| `MAT.VOL.NB_SEANCES` | Nombre total de séances | Déduit du volume et de la durée, ou saisi. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | saisie (volume.js) | 4.17 |
| `MAT.VOL.DUREE_MIN` | Durée minimale d'une séance | En dessous, la séance n'est pas valable. | donnee | duree_min | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.18 |
| `MAT.VOL.DUREE_MAX` | Durée maximale d'une séance | Au-dessus, la séance doit être coupée. | donnee | duree_min | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.19 |
| `MAT.VOL.DUREE_REC` | Durée recommandée d'une séance | Durée visée. Le solveur actuel ne connaît que 1 ou 2 créneaux. | donnee | duree_min | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | parametre (duree_seance_defaut_minutes) | 4.20 7.6 |
| `MAT.VOL.CRENEAUX_PAR_SEANCE` | Créneaux par séance | Nombre de créneaux consécutifs occupés (borné à 2 aujourd'hui dans probleme.js). | donnee | entier | `2` | pédagogique, individuel (matiere) | oui | — | 1 | — | etablissement | periode | solveur (CoursComposante.creneaux_par_seance) | ajout |
| `MAT.VOL.SEANCES_SEMAINE` | Séances par semaine | Nombre de leçons de la semaine type (borné à 6 aujourd'hui). | donnee | entier | `1` | pédagogique, individuel (matiere) | oui | — | 1 | — | etablissement | periode | solveur (CoursComposante.seances_par_semaine) | 4.21 |
| `MAT.VOL.SEANCES_SEMAINE_MIN` | Minimum de séances par semaine | Fréquence minimale d'une matière. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.22 4.43 |
| `MAT.VOL.SEANCES_SEMAINE_MAX` | Maximum de séances par semaine | Fréquence maximale d'une matière. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 7.36 |
| `MAT.VOL.REPART_THEO_PRAT` | Répartition théorie/pratique | Part de chaque nature dans le volume. | donnee | structure | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | 4.25 |
| `MAT.VOL.REPART_CM_TD_TP` | Répartition CM/TD/TP | Composantes de la matière et leur volume. | donnee | structure | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | solveur (CoursComposante.type, TYPES_COMPOSANTE) | 4.26 16E.8 16E.9 16E.10 |
| `MAT.VOL.SEMAINE_DEBUT` | Semaine de début | Première semaine de la composante dans la période. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | saisie (CoursComposante.semaine_debut) | ajout |
| `MAT.VOL.SEMAINE_FIN` | Semaine de fin | Dernière semaine de la composante dans la période. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | saisie (CoursComposante.semaine_fin) | ajout |
| `MAT.VOL.MODALITE` | Modalité | Présentiel, à distance ou hybride ; à distance, aucune salle n'est prise. | donnee | enum : presentiel, distanciel, hybride | `presentiel` | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | solveur (CoursComposante.modalite) | 16D.11 16D.12 16D.13 16E.20 |
| `MAT.VOL.SEMAINE_ALTERNEE` | Semaine de l'alternance | Toutes les semaines, ou seulement A ou B. | donnee | enum : toutes, A, B | `toutes` | pédagogique, individuel (matiere) | non | — | 2 | — | etablissement | periode | absent | ajout |

## Besoins de la matière

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `MAT.BESOIN.TYPE_SALLE` | Salle spécialisée requise | Type de salle exigé : laboratoire, gymnase, extérieur, atelier... | donnee | reference | — | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | solveur (CoursComposante.type_salle_requis) | 4.27 4.28 4.31 4.32 |
| `MAT.BESOIN.EQUIPEMENTS` | Équipements requis | Ordinateurs, matériel particulier : la salle doit les avoir tous. | donnee | liste_references | — | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | solveur (CoursComposante.equipements_requis) | 4.29 4.30 |
| `MAT.BESOIN.EFFECTIF_REDUIT` | Effectif réduit | Plafond d'effectif propre à la matière, qui impose un dédoublement. | donnee | entier | — | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | absent | 4.33 |
| `MAT.BESOIN.NB_ENSEIGNANTS` | Plusieurs enseignants | Co-intervention : tous doivent être libres en même temps. | donnee | entier | `1` | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | solveur (EnseignementEnseignant.role) | 4.34 |
| `MAT.BESOIN.ASSISTANT` | Assistant pédagogique requis | Rôle complémentaire à placer en même temps que la séance. | donnee | reference | — | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | absent | 4.35 |
| `MAT.BESOIN.NIVEAU_GROUPE` | Granularité du groupe | Promotion, TD ou TP : qui suit la composante. | donnee | enum : promotion, td, tp | — | pédagogique, individuel (matiere) | non | — | 1 | — | etablissement | periode | base (CoursComposante.niveau_groupe) | ajout |

## Relations entre matières (données)

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `MAT.REL.PREREQUIS` | Prérequis | Matière à avoir commencée ou terminée avant. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.36 4.53 |
| `MAT.REL.PRECEDENCE` | Ordre entre matières | Matières à programmer dans un ordre précis. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.37 4.46 |
| `MAT.REL.INCOMPATIBLES` | Matières incompatibles | Jamais en même temps pour un même groupe. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.45 |
| `MAT.REL.ESPACEES` | Matières à espacer | Ne pas les rapprocher dans la semaine. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.47 |
| `MAT.REL.REGROUPEES` | Matières à regrouper | Le même jour ou à la suite. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.48 |
| `MAT.REL.MEME_ENSEIGNANT` | Matières partageant un enseignant | Découle des services : à placer sans chevauchement. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | solveur (EnseignementEnseignant) | 4.49 |
| `MAT.REL.MEME_LABO` | Matières partageant un laboratoire | Mises en concurrence sur une même salle rare. | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | solveur (type de salle commun) | 4.50 |
| `MAT.REL.HORAIRES_COMMUNS` | Matières à horaires communs | Alignement : plusieurs groupes à la même heure (barrette de langues ou d'options). | donnee | liste_references | — | pédagogique | non | — | 3 | — | etablissement | periode | absent | 4.51 16B.3 |

## Règles de répartition d'une matière

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `MAT.REGLE.VOLUME` | Volume horaire respecté | Le volume prévu est atteint sans être dépassé. Aujourd'hui, un manque est signalé, pas cherché par le calcul. | regle | booleen | `true` | global | oui | strict | 1 | — | non | periode | saisie (volume.js, rapport.js) | 17B.11 18A.6 7.37 9.6 |
| `MAT.REGLE.DUREE` | Durée de séance correcte | La séance tient entre la durée minimale et la durée maximale. | regle | booleen | `true` | global | oui | strict | 1 | — | non | periode | solveur (longueurSeance) | 17B.10 4.39 8.21 8.22 |
| `MAT.REGLE.JOURS_DIFFERENTS` | Séances sur des jours différents | Deux séances d'un enseignement évitent le même jour. | regle | booleen | `true` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 20 | etablissement | periode | solveur | 4.38 8.9 |
| `MAT.REGLE.MAX_PAR_JOUR` | Séances d'une matière par jour | Plafond quotidien, quand une même matière peut revenir dans la journée. | regle | entier | `1` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 20 | etablissement | periode | absent | 4.23 7.35 |
| `MAT.REGLE.CONSECUTIVES_MAX` | Séances consécutives d'une matière | Longueur maximale d'un bloc d'une même matière. | regle | entier | `2` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 15 | etablissement | periode | absent | 4.24 |
| `MAT.REGLE.ALTERNANCE_THEO_PRAT` | Alternance théorie et pratique | Éviter deux blocs de même nature à la suite. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 5 | etablissement | periode | absent | 4.40 |
| `MAT.REGLE.MATIN` | Matière à placer le matin | Cette matière vise la matinée. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 8 | etablissement | periode | absent | 4.41 |
| `MAT.REGLE.PAS_FIN_JOURNEE` | Matière déconseillée en fin de journée | Cette matière évite le dernier créneau. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 8 | etablissement | periode | absent | 4.42 |
| `MAT.REGLE.PROGRESSION` | Progression séquentielle | Les séances suivent un ordre : les chapitres se suivent sur les dates. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 5 | etablissement | periode | absent | 4.44 |
| `MAT.REGLE.PRECEDENCE_MATIERES` | Ordre entre matières respecté | La matière prérequise commence avant, en date. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 2 | 15 | etablissement | periode | absent | 8.12 |
| `MAT.REGLE.INCOMPATIBLES` | Matières incompatibles séparées | Les matières déclarées incompatibles ne se chevauchent pas pour un groupe. | regle | booleen | `true` | global, pédagogique, individuel (matiere) | non | strict * | 1 | — | etablissement | periode | absent | ajout |
| `MAT.REGLE.ESPACEMENT` | Matières espacées | Respecte l'écart demandé entre matières à espacer. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 5 | etablissement | periode | absent | ajout |
| `MAT.REGLE.REGROUPEMENT` | Matières regroupées | Rapproche les matières à regrouper. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | souple * | 3 | 5 | etablissement | periode | absent | ajout |
| `MAT.REGLE.ALIGNEMENT` | Horaires communs alignés | Les groupes alignés (barrette) ont cours à la même heure. | regle | booleen | `false` | global, pédagogique, individuel (matiere) | non | strict * | 2 | — | etablissement | periode | absent | ajout |
| `MAT.REGLE.CO_INTERVENTION` | Co-enseignants présents ensemble | Tous les enseignants d'une séance sont pris en même temps. | regle | booleen | `true` | global | oui | strict | 1 | — | non | periode | solveur (Lecon.getOccupationsEnseignants) | ajout |
| `MAT.REGLE.ECART_MIN` | Écart minimal entre deux séances | Heures minimales entre deux séances d'une même matière (temps d'assimilation). | regle | duree_min | — | global, pédagogique, individuel (matiere) | non | souple * | 3 | 10 | etablissement | periode | absent | 7.34 8.10 |
