<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# EXA · Examens et évaluations

Un problème voisin de celui des cours : mêmes ressources, autres variables (dates, salles multiples, surveillants).

## Dates

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EXA.DATES.EXAMENS` | Dates des examens | Fixées, ou plage à placer par le moteur. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.1 |
| `EXA.DATES.CONTROLES` | Dates des contrôles continus | Évaluations pendant les heures de cours. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.2 |
| `EXA.DATES.DEVOIRS` | Dates des devoirs surveillés | Épreuves surveillées de la période. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.3 16C.10 |
| `EXA.DATES.PRATIQUES` | Dates des examens pratiques | Demandent un laboratoire et souvent plusieurs passages. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.4 |
| `EXA.DATES.SOUTENANCES` | Dates des soutenances | Passages par jury. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.5 15.21 16E.19 |
| `EXA.DATES.RATTRAPAGES` | Dates des rattrapages | Session de rattrapage. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | saisie (SessionExamen, examens.js) | 10.6 |
| `EXA.DATES.DELIBERATION` | Périodes de délibération | Les jurys sont occupés. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | datee | absent | 10.21 |
| `EXA.DATES.RESULTATS` | Publication des résultats | Date à respecter ; fixe le temps de correction. | donnee | date | — | global, pédagogique | non | — | 4 | — | etablissement | datee | absent | 10.22 |

## Épreuves et moyens

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EXA.EPREUVE.DUREE` | Durée des épreuves | Durée propre à l'épreuve. | donnee | duree_min | — | pédagogique, individuel (epreuve) | non | — | 2 | — | etablissement | periode | base (SessionExamen.heure_debut, heure_fin) | 10.7 |
| `EXA.EPREUVE.SURVEILLANTS_PAR_SALLE` | Surveillants nécessaires | Nombre minimal par salle. | donnee | entier | `2` | pédagogique, individuel (epreuve) | non | — | 2 | — | etablissement | periode | parametre (surveillants_par_salle) | 10.10 |
| `EXA.EPREUVE.RATIO_CAPACITE` | Part de la capacité en examen | Quand la capacité d'examen de la salle n'est pas renseignée. | donnee | pourcentage | `50` | pédagogique, individuel (epreuve) | non | — | 2 | — | etablissement | periode | parametre (ratio_capacite_examen) | ajout |
| `EXA.EPREUVE.REPARTITION` | Répartition des candidats | Un groupe peut occuper plusieurs salles. | donnee | structure | — | pédagogique, individuel (epreuve) | non | — | 2 | — | etablissement | periode | base (SessionExamenSalle) | 10.13 |
| `EXA.EPREUVE.MATERIEL` | Matériel spécialisé | Matériel exigé par l'épreuve. | donnee | liste_references | — | pédagogique, individuel (epreuve) | non | — | 2 | — | etablissement | periode | absent | 10.19 |
| `EXA.EPREUVE.CORRECTION` | Temps de correction | Temps qui rend un enseignant moins disponible après l'épreuve. | donnee | duree_min | — | pédagogique, individuel (epreuve) | non | — | 4 | — | etablissement | periode | absent | 10.20 |
| `EXA.EPREUVE.ENSEIGNANTS_SURVEILLENT` | Les enseignants surveillent | Sinon, la surveillance revient à l'administration. | donnee | booleen | `false` | global | non | — | 2 | — | etablissement | periode | plan (fichier 06, § 6.1) | ajout |

## Règles des examens

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EXA.REGLE.MAX_EPREUVES_JOUR` | Épreuves par jour | Plafond d'épreuves par jour pour un groupe. | regle | entier | `2` | global, pédagogique | non | souple * | 2 | 30 | etablissement | periode | absent | 10.8 |
| `EXA.REGLE.SURVEILLANTS_DISPONIBLES` | Surveillants disponibles | Assez de surveillants libres à chaque épreuve. | regle | booleen | `true` | global, pédagogique | non | strict * | 2 | — | etablissement | periode | saisie (Surveillance) | 10.11 |
| `EXA.REGLE.CAPACITE` | Capacité des salles d'examen | Les candidats tiennent dans la capacité d'examen. | regle | booleen | `true` | global, pédagogique | oui | strict | 1 | — | non | periode | saisie (services/planning/examens.js) | 10.12 |
| `EXA.REGLE.ESPACEMENT_CLASSE` | Espacement entre examens d'une classe | Temps minimal entre deux épreuves d'un groupe. | regle | duree_min | — | global, pédagogique | non | souple * | 2 | 20 | etablissement | periode | absent | 10.14 |
| `EXA.REGLE.ESPACEMENT_ETUDIANT` | Espacement entre examens d'un étudiant | Le même, compté personne par personne (options comprises). | regle | duree_min | — | global, pédagogique | non | souple * | 2 | 20 | etablissement | periode | absent | 10.15 |
| `EXA.REGLE.JURY_DISPONIBLE` | Jurys disponibles | Tous les membres du jury sont libres. | regle | booleen | `true` | global, pédagogique | non | strict * | 2 | — | etablissement | periode | absent | 10.16 |
| `EXA.REGLE.EXAMINATEURS_DISPONIBLES` | Examinateurs disponibles | L'enseignant examinateur est libre. | regle | booleen | `true` | global, pédagogique | non | strict * | 2 | — | etablissement | periode | absent | 10.17 |
| `EXA.REGLE.LABO_DISPONIBLE` | Laboratoires disponibles | Le laboratoire d'un examen pratique est libre. | regle | booleen | `true` | global, pédagogique | non | strict * | 2 | — | etablissement | periode | absent | 10.18 |
| `EXA.REGLE.PREPARATION_SALLE` | Temps de préparation des salles | Marge avant l'épreuve. | regle | duree_min | — | global, pédagogique | non | strict * | 2 | — | etablissement | periode | absent | 10.9 |
