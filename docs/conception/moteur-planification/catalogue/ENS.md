<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# ENS · Enseignants et intervenants

## Informations professionnelles

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ENS.PRO.ID` | Identifiant de l'enseignant | Clé stable, celle du compte. | donnee | texte | — | individuel (enseignant) | oui | — | 1 | — | non | annee | solveur (Enseignant.id_user) | 5.1 |
| `ENS.PRO.NOM` | Nom et prénom | Nom affiché ; n'entre jamais dans le calcul. | contexte | texte | — | individuel (enseignant) | oui | — | 4 | — | etablissement | annee | base (Users) | 5.2 |
| `ENS.PRO.DEPARTEMENT` | Département de rattachement | Sert au découpage par lots et aux répartitions. | contexte | reference | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | base (Enseignant.departement) | 5.3 |
| `ENS.PRO.SPECIALITE` | Spécialité | Spécialité affichée. | contexte | texte | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | base (Enseignant.specialite) | 5.4 |
| `ENS.PRO.COMPETENCES` | Disciplines enseignées | Matières qu'il peut enseigner. Nécessaire dès que le moteur choisit l'enseignant. | donnee | liste_references | — | individuel (enseignant) | oui | — | 1 | — | etablissement | annee | base (CompetenceEnseignant) | 5.5 5.6 16B.1 |
| `ENS.PRO.DIPLOMES` | Diplômes | Justifient une qualification ; relèvent du dossier, pas du calcul. | contexte | liste | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.7 |
| `ENS.PRO.STATUT` | Statut professionnel | Vacataire : seulement ses créneaux déclarés. Permanent : partout sauf indisponibilité. | donnee | enum : permanent, vacataire, externe | `permanent` | individuel (enseignant) | oui | — | 1 | — | etablissement | annee | solveur (Enseignant.statut) | 5.8 5.16 5.17 16D.8 11.13 |
| `ENS.PRO.CONTRAT` | Type de contrat | Détermine les obligations de service. | contexte | texte | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.9 |
| `ENS.PRO.QUOTITE` | Temps plein ou partiel | Quotité de service. | donnee | pourcentage | `100` | individuel (enseignant) | non | — | 3 | — | etablissement | annee | absent | 5.10 |
| `ENS.PRO.SERVICE_CONTRAT` | Volume contractuel | Heures dues sur l'année. | donnee | decimal | — | individuel (enseignant) | non | — | 2 | — | etablissement | annee | base (Enseignant.service_annuel_heures) | 5.11 |
| `ENS.PRO.ANCIENNETE` | Ancienneté | Peut départager les vœux si l'école le décide. | contexte | entier | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.14 |
| `ENS.PRO.COORDINATEUR` | Responsable pédagogique ou coordinateur | Ses heures de coordination réduisent le temps disponible. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | base (ResponsableFiliere) | 5.15 |
| `ENS.PRO.MULTI_CAMPUS` | Intervient sur plusieurs campus | Soumis aux temps de trajet. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | solveur (trajetEntreCampus) | 5.18 |
| `ENS.PRO.MULTI_DEPARTEMENTS` | Partagé entre départements | Il faut éviter que deux lots se le disputent. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.56 |
| `ENS.PRO.MULTI_ETABLISSEMENTS` | Intervient dans plusieurs établissements | Ses plages occupées ailleurs arrivent comme indisponibilités. | donnee | booleen | `false` | individuel (enseignant) | non | — | 2 | — | etablissement | annee | plan (D-10, OccupationExterne) | 5.57 5.43 |
| `ENS.PRO.PROFESSEUR_PRINCIPAL` | Enseignant responsable de classe | Stabilité de l'enseignant principal, surtout en primaire. | donnee | reference | — | individuel (enseignant) | non | — | 2 | — | etablissement | annee | absent | 5.58 16A.1 |
| `ENS.PRO.ENCADRE_PROJETS` | Encadre des projets | Heures de projet à réserver dans sa semaine. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.59 11.17 |
| `ENS.PRO.CHARGE_TP` | Chargé de travaux pratiques | Qualifié pour encadrer les TP. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.60 |
| `ENS.PRO.CHARGE_EXAMENS` | Chargé des examens | Mobilisable pour surveiller ou examiner. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | plan (services/planning/examens.js) | 5.61 |
| `ENS.PRO.ADMINISTRATIF` | Responsabilités administratives | Plages bloquées pour ces tâches. | contexte | structure | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.62 |
| `ENS.PRO.PERMANENCES` | Heures de permanence | Plages récurrentes bloquées. | contexte | structure | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.63 |
| `ENS.PRO.BESOIN_ASSISTANT` | Nécessite un assistant | Sa séance réserve aussi un assistant. | contexte | booleen | `false` | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.64 |
| `ENS.PRO.BESOIN_MATERIEL` | Nécessite du matériel | Ajoute ses besoins à ceux de la matière. | contexte | liste_references | — | individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 5.65 |

## Disponibilités

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ENS.DISPO.CRENEAUX` | Disponibilité par créneau | Déclaration de l'enseignant, créneau par créneau et par dates. | donnee | structure | — | individuel (enseignant) | oui | — | 1 | — | personne | periode | solveur (Disponibilite) | 5.19 5.20 5.23 5.24 |
| `ENS.DISPO.HEURE_DEBUT` | Heure de début de disponibilité | Raccourci de saisie : pas de séance avant. | donnee | heure | — | individuel (enseignant) | non | — | 1 | — | personne | periode | absent | 5.21 |
| `ENS.DISPO.HEURE_FIN` | Heure de fin de disponibilité | Raccourci de saisie : pas de séance après. | donnee | heure | — | individuel (enseignant) | non | — | 1 | — | personne | periode | absent | 5.22 |
| `ENS.DISPO.CONGES` | Congés et absences prévus | Plages datées : le déploiement saute ces dates. | donnee | structure | — | individuel (enseignant) | non | — | 1 | — | personne | datee | saisie (Disponibilite (dates), deploiement.js) | 5.25 5.26 |
| `ENS.DISPO.SOIR` | Disponible en soirée | Sans lui, les créneaux du soir lui sont fermés. | donnee | booleen | `false` | individuel (enseignant) | non | — | 3 | — | personne | periode | absent | 5.27 |
| `ENS.DISPO.WEEKEND` | Disponible le week-end | Sans lui, les créneaux du week-end lui sont fermés. | donnee | booleen | `false` | individuel (enseignant) | non | — | 3 | — | personne | periode | absent | 5.28 |
| `ENS.DISPO.VACANCES` | Disponible pendant les vacances | Pour les stages intensifs et les rattrapages. | donnee | booleen | `false` | individuel (enseignant) | non | — | 4 | — | personne | periode | absent | 5.29 |
| `ENS.DISPO.CAMPUS` | Campus autorisés | Certains enseignants ne viennent que sur certains campus. | donnee | liste_references | — | individuel (enseignant) | non | — | 2 | — | personne | periode | absent (Enseignant.id_campus_prefere (préférence seule)) | 5.30 |
| `ENS.DISPO.OCCUPE_AILLEURS` | Plages occupées ailleurs | Reçues d'une autre école : début, fin et ville, rien d'autre. | donnee | structure | — | individuel (enseignant) | non | — | 1 | — | non | datee | plan (D-10) | ajout |

## Charge de travail

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ENS.CHARGE.MAX_H_JOUR` | Maximum d'heures par jour | Plafond quotidien d'un enseignant, en minutes. | regle | duree_min | `480` | global, pédagogique, individuel (enseignant) | non | strict * | 2 | — | etablissement | periode | solveur (max_heures_jour_enseignant) | 5.33 9.2 |
| `ENS.CHARGE.MAX_H_SEMAINE` | Maximum d'heures par semaine | Plafond hebdomadaire. Aujourd'hui averti avant le calcul, mais le solveur ne le connaît pas. | regle | duree_min | — | global, pédagogique, individuel (enseignant) | non | strict * | 2 | — | etablissement | periode | saisie (Enseignant.max_heures_semaine, avertissements.js) | 5.34 5.12 9.3 |
| `ENS.CHARGE.MIN_H_SEMAINE` | Volume minimum souhaité | En dessous, l'enseignant est sous-employé (utile au choix de l'enseignant). | regle | duree_min | — | global, pédagogique, individuel (enseignant) | non | souple * | 4 | 3 | etablissement | periode | absent | 5.13 |
| `ENS.CHARGE.MIN_H_JOUR` | Minimum d'heures par jour | Ne pas faire venir un enseignant pour moins que cela. | regle | duree_min | — | global, pédagogique, individuel (enseignant) | non | souple * | 4 | 3 | etablissement | periode | absent | 5.35 |
| `ENS.CHARGE.MAX_CONSECUTIVES` | Maximum de séances consécutives | Au-delà, une pause est nécessaire. | regle | entier | — | global, pédagogique, individuel (enseignant) | non | souple * | 2 | 15 | etablissement | periode | absent | 5.36 |
| `ENS.CHARGE.MIN_PAUSES` | Nombre minimum de pauses | Pauses à garantir dans une journée complète. | regle | entier | — | global, pédagogique, individuel (enseignant) | non | souple * | 3 | 8 | etablissement | periode | absent | 5.37 |
| `ENS.CHARGE.REPOS_ENTRE_JOURNEES` | Repos entre deux journées | Temps minimal entre la dernière séance et la première du lendemain. | regle | duree_min | — | global, pédagogique, individuel (enseignant) | non | strict * | 2 | — | etablissement | periode | absent | 5.38 9.4 |
| `ENS.CHARGE.MAX_CLASSES_JOUR` | Maximum de classes différentes par jour | Limite la dispersion d'un enseignant. | regle | entier | — | global, pédagogique, individuel (enseignant) | non | souple * | 4 | 3 | etablissement | periode | absent | 5.39 |
| `ENS.CHARGE.MAX_GROUPES_JOUR` | Maximum de groupes par jour | Limite le nombre de groupes vus dans la journée. | regle | entier | — | global, pédagogique, individuel (enseignant) | non | souple * | 4 | 3 | etablissement | periode | absent | 5.40 |
| `ENS.CHARGE.MAX_TP_SEMAINE` | Maximum de TP par semaine | Limite les encadrements pratiques. | regle | entier | — | global, pédagogique, individuel (enseignant) | non | souple * | 4 | 3 | etablissement | periode | absent | 5.41 |
| `ENS.CHARGE.REPART_NIVEAUX` | Répartition entre niveaux | Part visée de son service par niveau. | regle | structure | — | global, pédagogique, individuel (enseignant) | non | souple * | 5 | 2 | etablissement | periode | absent | 5.42 |
| `ENS.CHARGE.REPART_THEO_PRAT` | Répartition théorie et pratique | Part visée de cours et de TP dans son service. | regle | structure | — | global, pédagogique, individuel (enseignant) | non | souple * | 5 | 2 | etablissement | periode | absent | 5.44 |
| `ENS.CHARGE.TEMPS_ENTRE_INTERVENTIONS` | Temps entre deux interventions | Battement minimal entre deux séances d'un même enseignant. | regle | duree_min | `0` | global, pédagogique, individuel (enseignant) | non | strict * | 2 | — | etablissement | periode | absent | 5.32 7.17 |

## Règles fondamentales

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ENS.REGLE.CONFLIT` | Un enseignant n'a qu'un cours à la fois | Aucune séance simultanée, co-enseignement compris. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (conflitEnseignant) | 17B.1 18A.1 |
| `ENS.REGLE.INDISPONIBLE` | Enseignant disponible | Aucune séance sur un créneau indisponible, ni hors des créneaux d'un vacataire. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (enseignantIndisponible) | 17B.6 |
| `ENS.REGLE.QUALIFIE` | Enseignant qualifié | Une matière va à un enseignant compétent. Aujourd'hui, les services sont choisis à la main : le solveur ne le vérifie pas. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | base (CompetenceEnseignant) | 17B.5 18A.5 |
| `ENS.REGLE.CAMPUS_AUTORISE` | Campus autorisés respectés | Aucune séance sur un campus où il ne vient pas. | regle | booleen | `true` | global | non | strict * | 2 | — | etablissement | permanent | absent | ajout |
