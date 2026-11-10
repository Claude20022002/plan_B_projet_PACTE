<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# OPT · Pilotage du moteur

Comment le moteur construit, compare et évalue un planning. Ces réglages n'entrent pas dans les règles métier.

## Portée de la génération

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `OPT.PORTEE.DATE_DEBUT` | Date de début de génération | Rien n'est modifié avant cette date. | pilotage | date | — | global | non | — | 2 | — | etablissement | generation | solveur (debutDeploiement) | 17.1 |
| `OPT.PORTEE.DATE_FIN` | Date de fin de génération | Rien n'est modifié après cette date. | pilotage | date | — | global | non | — | 2 | — | etablissement | generation | solveur (Periode.date_fin) | 17.2 |
| `OPT.PORTEE.HORIZON` | Période concernée | Jour, semaine, semestre ou année : donne la forme du modèle (voir ecarts-du-solveur.md). | pilotage | enum : jour, semaine, semestre, annee | `semestre` | global | non | — | 1 | — | etablissement | generation | solveur (semaine type déployée, seul mode actuel) | 17.3 |
| `OPT.PORTEE.MODELE_TEMPS` | Forme du temps | Semaine type recopiée, semaines A/B, ou dates réelles. Seule la semaine type existe aujourd'hui. | pilotage | enum : semaine_type, cycle_semaines, dates | `semaine_type` | global | non | — | 1 | — | etablissement | generation | solveur (deploiement.js) | ajout |
| `OPT.PORTEE.PRIORITE_CLASSE` | Priorité par classe | Les classes prioritaires ont le choix des meilleurs créneaux. | pilotage | structure | — | global | non | — | 2 | — | etablissement | generation | absent | 17.9 |
| `OPT.PORTEE.PRIORITE_ENSEIGNANT` | Priorité par enseignant | Les enseignants prioritaires ont le choix des meilleurs créneaux. | pilotage | structure | — | global | non | — | 2 | — | etablissement | generation | absent | 17.10 |
| `OPT.PORTEE.PRIORITE_DEPARTEMENT` | Priorité par département | Ordre des lots dans une grande école. | pilotage | structure | — | global | non | — | 2 | — | etablissement | generation | absent | 17.11 |
| `OPT.PORTEE.DECOUPAGE` | Génération globale ou par niveau | Globale, ou par lots dont les ressources placées contraignent les lots suivants. | pilotage | enum : globale, filiere, niveau, pole | `globale` | global | non | — | 2 | — | etablissement | generation | solveur (id_filieres ; ME-14 pour les lots) | 17.12 |
| `OPT.PORTEE.ETENDUE` | Génération complète ou partielle | Partielle : seule une partie est recalculée, le reste épinglé. | pilotage | enum : complete, partielle | `complete` | global | non | — | 2 | — | etablissement | generation | absent | 17.13 17.29 17.30 |
| `OPT.PORTEE.FIGER` | Cours figés | Ces séances sont épinglées et le moteur les contourne. | pilotage | liste_references | — | global | non | — | 2 | — | etablissement | generation | solveur (Lecon.epinglee) | 17.14 |
| `OPT.PORTEE.PRESERVER` | Préserver un ancien planning | Part de stabilité demandée par rapport à la version de référence. | pilotage | reference | — | global | non | — | 2 | — | etablissement | generation | absent | 17.15 |
| `OPT.PORTEE.NB_PROPOSITIONS` | Nombre de propositions | Plusieurs scénarios à comparer. | pilotage | entier | `1` | global | non | — | 2 | — | etablissement | generation | absent | 17.16 |

## Calcul

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `OPT.CALCUL.CHOIX_ENSEIGNANT` | Le moteur choisit l'enseignant | Faux aujourd'hui : l'enseignant est fixé avant le calcul. Vrai dans une école où seul le besoin est connu. | pilotage | booleen | `false` | global | non | — | 1 | — | etablissement | generation | absent (Lecon : créneau et salle seuls) | ajout |
| `OPT.CALCUL.CHOIX_GROUPE` | Le moteur compose les groupes | Sectionnement : répartir les inscrits d'une option entre plusieurs groupes. | pilotage | booleen | `false` | global | non | — | 2 | — | etablissement | generation | absent | ajout |
| `OPT.CALCUL.DUREE_MAX` | Durée du calcul | Selon la taille du problème, de 30 à 240 s aujourd'hui. | pilotage | entier | — | global | non | — | 3 | — | plateforme | generation | solveur (rapport.js, DUREE_CALCUL) | ajout |
| `OPT.CALCUL.CALCULS_SIMULTANES` | Calculs simultanés | Borne la mémoire et le processeur (2 aujourd'hui). | pilotage | entier | `2` | global | non | — | 3 | — | plateforme | generation | solveur (solver.calculs-simultanes-max) | ajout |
| `OPT.CALCUL.GRAINE` | Graine du calcul | Rejoue un calcul à l'identique, pour comparer et déboguer. | pilotage | entier | — | global | non | — | 3 | — | plateforme | generation | absent | ajout |
| `OPT.CALCUL.PRESET` | Préréglage des poids | Souple, standard ou strict ; l'école ajuste en peu, normal, beaucoup, indispensable. | pilotage | enum : souple, standard, strict | `standard` | global | non | — | 3 | — | etablissement | generation | plan (fichier 06, § 6.3) | ajout |
| `OPT.CALCUL.STABILITE` | Poids de la stabilité | Prix d'un changement par rapport au planning publié. | pilotage | entier | `10` | global | non | — | 3 | — | etablissement | generation | absent | 14.20 |

## Détection

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `OPT.CONFLITS.DETECTION` | Détection des conflits entre ressources | Après le calcul et à chaque modification, tout conflit est listé avec sa raison et l'écran qui le corrige. | regle | booleen | `true` | global | oui | strict | 2 | — | non | generation | saisie (rapport.js, Conflit) | 14.19 |

## Indicateurs de qualité

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `OPT.IND.SALLES` | Taux d'utilisation des salles | Heures occupées rapportées aux heures ouvertes. | indicateur | pourcentage | — | global, pédagogique | non | — | 3 | — | non | generation | base (statistiques) | 17D.1 |
| `OPT.IND.ENSEIGNANTS` | Taux d'utilisation des enseignants | Heures placées rapportées au service. | indicateur | pourcentage | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.2 |
| `OPT.IND.CONFLITS` | Nombre de conflits | Toujours zéro sur ce qui est créé ; le reste est listé comme non placé. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | saisie (rapport.js, resume) | 17D.3 |
| `OPT.IND.TROUS` | Nombre de trous | Rangs vides dans les journées des groupes. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.4 |
| `OPT.IND.DEPLACEMENTS` | Déplacements inutiles | Trajets évitables. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.5 |
| `OPT.IND.EQUILIBRE_JOURS` | Équilibre des heures par jour | Écart entre le jour le plus chargé et le moins chargé. | indicateur | decimal | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.6 |
| `OPT.IND.PREFERENCES` | Respect des préférences | Part des vœux tenus. | indicateur | pourcentage | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.7 |
| `OPT.IND.VOLUMES` | Respect des volumes horaires | Part du volume prévu réellement placée. | indicateur | pourcentage | — | global, pédagogique | non | — | 3 | — | non | generation | saisie (rapport.js) | 17D.8 |
| `OPT.IND.TARDIFS` | Nombre de cours tardifs | Séances après l'heure limite. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.9 |
| `OPT.IND.CONSECUTIFS` | Nombre de cours consécutifs | Blocs au-delà de la longueur demandée. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.10 |
| `OPT.IND.CHARGE` | Équilibre de charge entre enseignants | Écart entre services comparables. | indicateur | decimal | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.11 |
| `OPT.IND.CHANGEMENTS_SALLE` | Nombre de changements de salle | Changements évitables dans les journées. | indicateur | entier | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.12 |
| `OPT.IND.COUT` | Coût global du planning | Somme des coûts renseignés. | indicateur | montant | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.13 |
| `OPT.IND.SATISFACTION` | Satisfaction des utilisateurs | Mesurée après coup par un questionnaire : le calcul ne peut pas la prédire. | indicateur | pourcentage | — | global, pédagogique | non | — | 3 | — | non | generation | absent | 17D.14 |
