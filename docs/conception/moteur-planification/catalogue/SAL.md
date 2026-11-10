<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# SAL · Salles et infrastructures

## Identification

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SAL.ID.ID` | Identifiant de la salle | Clé stable. | donnee | texte | — | individuel (salle) | oui | — | 1 | — | non | permanent | solveur (Salle.id_salle) | 6.1 |
| `SAL.ID.NOM` | Nom ou numéro de salle | Nom affiché. | contexte | texte | — | individuel (salle) | oui | — | 4 | — | etablissement | permanent | base (Salle.nom_salle) | 6.2 6.3 |
| `SAL.ID.BATIMENT` | Bâtiment | Sert aux changements de bâtiment. Absent aujourd'hui : l'ancien champ n'est plus qu'un alias du nom du campus. | donnee | reference | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | absent | 6.4 |
| `SAL.ID.ETAGE` | Étage | Sert à l'accessibilité et aux temps de déplacement. | donnee | entier | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | base (Salle.etage) | 6.5 |
| `SAL.ID.CAMPUS` | Campus | Donne le temps de trajet et le site. | donnee | reference | — | individuel (salle) | oui | — | 1 | — | etablissement | permanent | solveur (Salle.id_campus) | 6.6 |
| `SAL.ID.DEPARTEMENT` | Département | Une salle peut être réservée en priorité à un département. | contexte | reference | — | individuel (salle) | non | — | 4 | — | etablissement | permanent | absent | 6.7 |
| `SAL.ID.TYPE` | Type de salle | Cours, amphithéâtre, laboratoire, informatique, langues, sport, atelier, bibliothèque, polyvalente, examen, visioconférence : liste propre à l'école. | donnee | reference | — | individuel (salle) | oui | — | 1 | — | etablissement | permanent | solveur (Salle.type_salle, TYPES_SALLE (ME-2a : TypeSalle)) | 6.8 6.9 6.10 6.11 6.12 6.13 6.14 6.15 6.16 6.17 6.18 6.19 |

## Capacité et équipements

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SAL.CARAC.CAPACITE` | Capacité maximale | Plafond de places : la règle de capacité la lit. | donnee | entier | — | individuel (salle) | oui | — | 1 | — | etablissement | permanent | solveur (Salle.capacite) | 6.20 6.22 |
| `SAL.CARAC.CAPACITE_MIN` | Capacité minimale | Effectif en dessous duquel ouvrir cette salle est du gaspillage. | donnee | entier | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | absent | 6.21 |
| `SAL.CARAC.CAPACITE_REGLEMENTAIRE` | Capacité réglementaire | Plafond de sécurité : ne peut qu'abaisser la capacité. | donnee | entier | — | individuel (salle) | non | — | 1 | — | etablissement | permanent | absent | 9.15 |
| `SAL.CARAC.CAPACITE_EXAMEN` | Capacité en examen | Places utilisables en examen ; à défaut, part de la capacité. | donnee | entier | — | individuel (salle) | non | — | 2 | — | etablissement | permanent | base (Salle.capacite_examen) | 10.12 |
| `SAL.CARAC.TABLES` | Nombre de tables | Inventaire ; peut justifier une capacité. | donnee | entier | — | individuel (salle) | non | — | 5 | — | etablissement | permanent | absent | 6.23 |
| `SAL.CARAC.ORDINATEURS` | Ordinateurs et postes de travail | Nombre de postes : un TP informatique en réclame autant que d'élèves. | donnee | entier | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | absent | 6.24 6.25 |
| `SAL.CARAC.PRISES` | Prises électriques | Inventaire, pour les cours sur ordinateur personnel. | donnee | entier | — | individuel (salle) | non | — | 5 | — | etablissement | permanent | absent | 6.26 |
| `SAL.CARAC.EQUIPEMENTS` | Équipements présents | Internet, vidéoprojecteur, tableau interactif ou classique, audio, mobilier et équipement spécialisés. | donnee | liste_references | — | individuel (salle) | non | — | 1 | — | etablissement | permanent | solveur (Salle.equipements (ME-2a : Equipement, quantité)) | 6.27 6.28 6.29 6.30 6.31 6.36 6.37 6.38 |
| `SAL.CARAC.CONFORT` | Confort de la salle | Climatisation, ventilation, éclairage : utile aux créneaux chauds ou tardifs. | donnee | liste | — | individuel (salle) | non | — | 5 | — | etablissement | permanent | absent | 6.32 6.33 6.34 |
| `SAL.CARAC.ACCESSIBLE` | Accessible aux personnes à mobilité réduite | Nécessaire à un groupe qui a un besoin d'accessibilité. | donnee | booleen | — | individuel (salle) | non | — | 2 | — | etablissement | permanent | absent | 6.35 9.20 |
| `SAL.CARAC.SECURITE` | Équipement de sécurité | Conditions de sécurité d'un local, prérequis de certains TP. | donnee | liste | — | individuel (salle) | non | — | 2 | — | etablissement | permanent | absent | 6.39 9.14 |
| `SAL.CARAC.COMPATIBILITE` | Compatibilité salle et matière | Liste directe, quand le type et les équipements ne suffisent pas. | donnee | liste_references | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | absent | 6.60 |
| `SAL.CARAC.RESERVE_DEPARTEMENT` | Réservable par | Qui peut réserver la salle. | donnee | enum : admin, enseignants | — | individuel (salle) | non | — | 3 | — | etablissement | permanent | base (Salle.reservable_par) | ajout |

## Disponibilité

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SAL.DISPO.HORS_SERVICE` | Hors service | Salle retirée de la génération. | donnee | booleen | `false` | individuel (salle) | non | — | 1 | — | etablissement | datee | solveur (Salle.disponible) | ajout |
| `SAL.DISPO.CRENEAUX` | Créneaux disponibles | Plages où la salle peut servir. | donnee | structure | — | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.40 |
| `SAL.DISPO.RESERVES` | Créneaux réservés | Réservations ponctuelles ou répétées : le déploiement les saute. | donnee | structure | — | individuel (salle) | non | — | 2 | — | etablissement | datee | saisie (Reservation) | 6.41 6.49 |
| `SAL.DISPO.HEURES` | Horaires d'ouverture de la salle | Plage quotidienne propre à la salle. | donnee | plage_horaire | — | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.42 6.43 |
| `SAL.DISPO.TEMPS_PREPARATION` | Temps de préparation | Marge avant la séance (labo, sport). | donnee | duree_min | `0` | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.44 7.18 10.9 |
| `SAL.DISPO.TEMPS_NETTOYAGE` | Temps de nettoyage | Marge après la séance. | donnee | duree_min | `0` | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.45 |
| `SAL.DISPO.MAINTENANCE` | Temps de maintenance | Plages récurrentes bloquées. | donnee | structure | — | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.46 |
| `SAL.DISPO.INDISPONIBLE` | Périodes d'indisponibilité | Travaux, panne longue. | donnee | plage_dates | — | individuel (salle) | non | — | 1 | — | etablissement | datee | absent | 6.47 |
| `SAL.DISPO.PRIORITE` | Réservation prioritaire | Un usage a la priorité sur cette salle. | donnee | reference | — | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.48 |
| `SAL.DISPO.EXCEPTION` | Disponibilité exceptionnelle | Salle ouverte à titre exceptionnel. | donnee | plage_dates | — | individuel (salle) | non | — | 2 | — | etablissement | datee | absent | 6.50 |

## Salles modulables

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SAL.CONFIG.DIVISIBLE` | Salle divisible | Une salle devient deux : les deux parties et le tout s'excluent. | donnee | liste_references | — | individuel (salle) | non | — | 4 | — | etablissement | permanent | absent | 6.57 |
| `SAL.CONFIG.FUSIONNABLE` | Salles fusionnables | Deux salles forment une grande salle. | donnee | liste_references | — | individuel (salle) | non | — | 4 | — | etablissement | permanent | absent | 6.58 |
| `SAL.CONFIG.RECONFIGURABLE` | Changement de configuration | Une disposition en classe ou en examen change la capacité. | donnee | structure | — | individuel (salle) | non | — | 4 | — | etablissement | permanent | absent | 6.59 |
| `SAL.CONFIG.EQUIPEMENT_PARTAGE` | Équipement partagé | Un matériel commun à plusieurs salles ne sert qu'à une à la fois. | donnee | liste_references | — | individuel (salle) | non | — | 4 | — | etablissement | permanent | absent | 6.56 |

## Règles des salles

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SAL.REGLE.CONFLIT` | Une salle n'accueille qu'un cours à la fois | Aucune occupation simultanée. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (conflitSalle) | 17B.3 18A.3 |
| `SAL.REGLE.CAPACITE` | Capacité suffisante | L'effectif ne dépasse pas la capacité. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (capaciteSalle) | 17B.4 18A.4 |
| `SAL.REGLE.TYPE` | Type de salle respecté | Une composante qui exige un type n'a lieu que dans ce type. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (typeSalle) | 17B.14 18A.7 16B.11 |
| `SAL.REGLE.EQUIPEMENTS` | Équipements présents | La salle a tous les équipements demandés. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (equipementsSalle) | ajout |
| `SAL.REGLE.REQUISE` | Salle requise en présentiel | Une séance en présentiel a une salle. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (salleRequise) | ajout |
| `SAL.REGLE.INDISPONIBLE` | Salle disponible | Aucune séance sur une plage d'indisponibilité. Aujourd'hui : seul « hors service » compte au calcul, le reste au déploiement. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | saisie (affectationRules.js) | 17B.7 |
| `SAL.REGLE.MODULABLE` | Salle et parties s'excluent | Une salle divisée ou fusionnée occupe aussi ses parties. | regle | booleen | `true` | global | non | strict | 3 | — | non | permanent | absent | ajout |
| `SAL.REGLE.EFFECTIF_ORDINATEURS` | Assez de postes | Un TP sur poste ne dépasse pas le nombre de postes de la salle. | regle | booleen | `true` | global | non | strict * | 2 | — | etablissement | permanent | absent | ajout |
| `SAL.REGLE.DISTANCIEL_SANS_SALLE` | Pas de salle à distance | Une séance à distance ne bloque pas de salle. | regle | booleen | `true` | global | non | souple | 4 | 5 | non | permanent | solveur (salleInutileEnDistanciel) | ajout |
| `SAL.REGLE.TAILLE_ADAPTEE` | Salle à la taille du groupe | Évite les grandes salles pour de petits groupes (marge de 10 places en dur). | regle | booleen | `true` | global | non | souple * | 4 | 1 | etablissement | permanent | solveur (UsageDesSalles.MARGE_PLACES) | ajout |
