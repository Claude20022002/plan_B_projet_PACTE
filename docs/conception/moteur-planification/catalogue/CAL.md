<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# CAL · Année scolaire et calendrier

## Découpage de l'année

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CAL.ANNEE.DEBUT` | Début de l'année | Première date enseignable. | donnee | date | — | global, pédagogique | oui | — | 1 | — | etablissement | annee | base (AnneeUniversitaire) | ajout |
| `CAL.ANNEE.FIN` | Fin de l'année | Dernière date enseignable. | donnee | date | — | global, pédagogique | oui | — | 1 | — | etablissement | annee | base (AnneeUniversitaire) | ajout |
| `CAL.ANNEE.DECOUPAGE` | Découpage en périodes | Semestres, trimestres, année entière ou modules intensifs. | donnee | enum : annee, semestre, trimestre, module | `semestre` | global, pédagogique | oui | — | 1 | — | etablissement | annee | base (CODES_PERIODE (S1, S2 en dur)) | 16E.4 |
| `CAL.ANNEE.PERIODES` | Périodes de l'année | Dates de chaque période ; une génération travaille sur une période. | donnee | structure | — | global, pédagogique | oui | — | 1 | — | etablissement | annee | solveur (Periode) | 3.11 |
| `CAL.ANNEE.NB_SEMAINES` | Nombre de semaines d'enseignement | Semaines utiles d'une période ; doit couvrir les volumes horaires. | donnee | entier | — | global, pédagogique | oui | — | 1 | — | etablissement | annee | base (Periode.nb_semaines) | 9.11 |
| `CAL.ANNEE.JOURS_ENSEIGNEMENT` | Nombre de jours d'enseignement | Jours réellement enseignables après fériés et vacances (calculé). | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | annee | absent | 9.12 |
| `CAL.ANNEE.CALENDRIER_OFFICIEL` | Calendrier officiel | Fournisseur de dates du pays (scolaire ou universitaire), modifiable par l'école. | donnee | reference | — | global, pédagogique | non | — | 2 | — | etablissement | annee | plan (fichier 06, § 6.2) | 9.9 9.10 7.48 |
| `CAL.ANNEE.SEMAINES_ALTERNEES` | Semaines alternées A/B | Cycle de n semaines : une séance peut n'avoir lieu qu'une semaine sur deux. Absent du modèle actuel. | donnee | entier | `1` | global, pédagogique | non | — | 2 | — | etablissement | annee | absent | ajout |
| `CAL.ANNEE.VARIANTES_GRILLE` | Variantes datées de la grille | Horaires réduits sur une période (ramadan, été) : mêmes rangs, autres heures. | donnee | structure | — | global, pédagogique | non | — | 2 | — | etablissement | annee | saisie (Creneau.variante, ramadan.js ; ME-2a PeriodeVariante) | ajout |

## Dates bloquantes ou réservées

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CAL.DATES.VACANCES` | Vacances | Aucune séance : le déploiement saute ces dates. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.31 |
| `CAL.DATES.FERIES` | Jours fériés | Aucune séance ; les fêtes lunaires restent à confirmer par l'école. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.32 |
| `CAL.DATES.JOURNEES_PEDAGO` | Journées pédagogiques | Pas de cours pour les apprenants, enseignants occupés. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.33 |
| `CAL.DATES.FORMATION_PERSONNEL` | Journées de formation du personnel | Les enseignants concernés sont indisponibles. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.34 |
| `CAL.DATES.EVENEMENTS` | Journées réservées aux événements | Portes ouvertes, cérémonies : bloquent tout ou partie de l'école. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.35 |
| `CAL.DATES.FERMETURES` | Fermetures exceptionnelles | Fermeture imprévue : déclenche un recalcul partiel. | donnee | structure | — | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (Evenement (type, bloque_affectations, portée)) | 2.36 |
| `CAL.DATES.PORTEE` | Portée d'une date bloquante | Qui elle bloque : établissement, campus, filière, niveau ou groupe. | donnee | enum : etablissement, site, campus, filiere, niveau, groupe | `etablissement` | global, pédagogique | non | — | 1 | — | etablissement | datee | saisie (PORTEES_EVENEMENT) | ajout |
| `CAL.DATES.A_CONFIRMER` | Date à confirmer | Une date lunaire reste provisoire tant que l'école ne l'a pas confirmée. | donnee | booleen | `false` | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.date_confirmee) | ajout |

## Règles de calendrier

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CAL.REGLE.FERMETURE` | Pas de séance pendant une fermeture | Une séance posée sur une date bloquante est sautée et reportée à la suite. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | saisie (affectationRules.js, deploiement.js) | 17B.15 18A.8 |
