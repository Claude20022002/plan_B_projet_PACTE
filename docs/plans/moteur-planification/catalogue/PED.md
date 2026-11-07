<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# PED · Pédagogie

## Organisation cognitive

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PED.COGN.CONCENTRATION` | Matières exigeantes aux bons moments | Les matières à forte charge visent les créneaux favorables. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 15 | etablissement | periode | absent | 8.1 18B.1 |
| `PED.COGN.CRENEAUX_FAVORABLES` | Créneaux favorables | Quels rangs conviennent le mieux à la concentration, selon l'âge. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 8.5 |
| `PED.COGN.DIFFICILES_SUIVIES` | Éviter les matières difficiles à la suite | Deux matières à forte charge ne se suivent pas. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 12 | etablissement | periode | absent | 8.2 16B.6 |
| `PED.COGN.ALTERNANCE_THEO_PRAT` | Alterner théorie et pratique | Sur la journée d'un groupe, varier les natures. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 5 | etablissement | periode | absent | 8.3 16A.4 |
| `PED.COGN.ALTERNANCE_DOMAINES` | Alterner sciences et lettres | Sur la journée d'un groupe, varier les domaines. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 4 | etablissement | periode | absent | 8.4 16B.2 |
| `PED.COGN.CHARGE_QUOTIDIENNE` | Plafond de charge cognitive par jour | Somme des charges des matières d'une journée. | regle | entier | — | global, pédagogique | non | souple * | 3 | 10 | etablissement | periode | absent | 8.6 16B.12 16A.2 |
| `PED.COGN.PAUSES_AGE` | Pauses adaptées à l'âge | Durée continue maximale selon l'attention de l'âge. | regle | duree_min | — | global, pédagogique | non | souple * | 2 | 25 | etablissement | periode | absent | 8.7 16A.3 |
| `PED.COGN.TRAVAIL_AUTONOME` | Plages de travail autonome | Réserve d'heures libres dans la semaine du groupe. | regle | duree_min | — | global, pédagogique | non | souple * | 4 | 3 | etablissement | periode | absent | 8.8 |
| `PED.COGN.DIFFICILES_REPARTIES` | Matières difficiles réparties | Elles ne se concentrent pas sur un seul jour. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 10 | etablissement | periode | absent | 7.38 14.11 |
| `PED.COGN.SIESTE` | Temps de repos ou de sieste | Plage de repos à garder libre selon l'âge et l'organisation. | regle | plage_horaire | — | global, pédagogique | non | strict * | 2 | — | etablissement | periode | absent | 16A.6 3D.1 |
| `PED.COGN.FONDAMENTAUX_MATIN` | Fondamentaux répartis | Lecture, écriture, calcul présents chaque jour. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 15 | etablissement | periode | absent | 16A.12 16A.14 16B.6 16B.10 |
| `PED.COGN.EVEIL` | Activités d'éveil | Activités d'éveil et de repos dans la journée. | regle | booleen | `false` | global, pédagogique | non | souple * | 4 | 4 | etablissement | periode | absent | 16A.7 |

## Progression pédagogique

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PED.PROG.CHAPITRES` | Ordre des chapitres | Les séances se suivent dans l'ordre du programme, sur les dates. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 5 | etablissement | periode | absent | 8.11 8.19 8.20 9.8 |
| `PED.PROG.CM_AVANT_TD` | Cours avant TD et TP | Dans la semaine, le CM précède les TD et TP du même module. | regle | booleen | `true` | global, pédagogique | non | souple * | 3 | 5 | etablissement | periode | solveur (cmAvantTd) | 8.13 |
| `PED.PROG.TD_AVANT_TP` | TD avant TP | Le TD précède le TP correspondant quand c'est nécessaire. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 4 | etablissement | periode | absent | 8.14 |
| `PED.PROG.COURS_AVANT_EVALUATION` | Cours avant les évaluations | Le volume prévu avant une évaluation est atteint à sa date. | regle | booleen | `false` | global, pédagogique | non | souple * | 3 | 10 | etablissement | periode | absent | 8.15 |
| `PED.PROG.REVISIONS` | Séances de révision | Réserve des séances avant les épreuves. | regle | entier | — | global, pédagogique | non | souple * | 4 | 4 | etablissement | periode | absent | 8.16 16C.10 14.16 |
| `PED.PROG.CONSOLIDATION` | Séances de consolidation | Réserve des séances de reprise. | regle | entier | — | global, pédagogique | non | souple * | 4 | 3 | etablissement | periode | absent | 8.17 |
| `PED.PROG.RATTRAPAGE` | Séances de rattrapage | Réserve de créneaux pour rattraper. | regle | entier | — | global, pédagogique | non | souple * | 4 | 3 | etablissement | periode | absent | 8.18 |

## Organisation spécifique

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PED.ORG.ENSEIGNANT_REFERENT` | Stabilité de l'enseignant principal | La classe garde le même enseignant pour la plupart de ses séances. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 2 | 40 | etablissement | periode | absent | 3D.1 |
| `PED.ORG.SALLE_FIXE` | Stabilité de la salle | La classe garde sa salle, sauf matière spécialisée. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 2 | 30 | etablissement | periode | absent | 16A.10 |
| `PED.ORG.ROTATION_ENSEIGNANTS` | Rotation des enseignants | Limite le nombre d'enseignants différents vus dans une journée. | regle | entier | — | global, pédagogique, individuel (groupe) | non | souple * | 4 | 3 | etablissement | periode | absent | 16B.2 3D.2 |
| `PED.ORG.SPORT_INFRA` | Sport selon les installations | Le sport suit la disponibilité des installations et s'éloigne du repas. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 6 | etablissement | periode | absent | 8.23 16A.8 16B.7 |
| `PED.ORG.LABO` | Activités de laboratoire groupées | Les séances de laboratoire d'un module sont regroupées. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 4 | etablissement | periode | absent | 8.24 8.21 3D.2 16B.5 16C.6 |
| `PED.ORG.INTERDISCIPLINAIRE` | Activités interdisciplinaires | Deux matières alignées pour une activité commune. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 5 | 2 | etablissement | periode | absent | 8.28 |
| `PED.ORG.INTERVENTIONS` | Interventions extérieures | Plages fixes dictées par un intervenant extérieur. | regle | structure | — | global, pédagogique, individuel (groupe) | non | strict * | 2 | — | etablissement | periode | absent | 8.29 11.14 11.15 16E.18 |
| `PED.ORG.HEURE_VIE_CLASSE` | Heures de vie de classe | Plage commune du professeur principal et de sa classe. | regle | duree_min | — | global, pédagogique, individuel (groupe) | non | souple * | 4 | 3 | etablissement | periode | absent | 16B.9 |
| `PED.ORG.ACCOMPAGNEMENT` | Accompagnement personnalisé | Réserve d'heures d'accompagnement ou de préparation aux concours. | regle | duree_min | — | global, pédagogique, individuel (groupe) | non | souple * | 4 | 3 | etablissement | periode | absent | 16B.8 16C.8 16C.9 |
| `PED.ORG.MATIERES_PAR_JOUR` | Nombre de matières par jour | Plafond de matières différentes dans une journée. | regle | entier | — | global, pédagogique, individuel (groupe) | non | souple * | 3 | 6 | etablissement | periode | absent | 16A.2 |
| `PED.ORG.EXAMENS_NATIONAUX` | Préparation aux examens nationaux | Le volume des matières d'examen est tenu avant les dates officielles. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 8 | etablissement | periode | absent | 16C.5 3D.3 |

## Périodes hors cours

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PED.PERIODE.STAGES` | Périodes de stage et d'observation | Le groupe n'a pas cours : le déploiement saute ces dates. | donnee | plage_dates | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | datee | saisie (Evenement.type_evenement = stage) | 8.30 15.19 16C.12 16D.15 16E.16 3D.4 |
| `PED.PERIODE.ALTERNANCE` | Calendrier d'alternance | Semaines en entreprise et semaines à l'école. | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | datee | absent | 16D.7 16D.14 |
| `PED.PERIODE.INTENSIF` | Formations intensives | Toute la matière sur quelques semaines : module à part, sans semaine type commune. | donnee | booleen | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | datee | absent | 16D.4 3D.4 |
| `PED.PERIODE.CARTE` | Cours à la carte | Chaque apprenant compose son parcours : conflits par personne, non par classe. | donnee | booleen | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | datee | absent | 16D.9 3D.4 |
| `PED.PERIODE.MOBILITE` | Mobilité académique | Élèves absents ou accueillis pendant une période. | donnee | structure | — | pédagogique, individuel (groupe) | non | — | 2 | — | etablissement | datee | absent | 16E.17 |
