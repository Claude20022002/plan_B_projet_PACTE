<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# IMP · Imprévus et gestion dynamique

Ce qui arrive après la publication : le moteur répare sans tout recommencer.

## Modifications

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `IMP.ACTION.MANUEL` | Modification manuelle | Une séance se modifie à la main, repasse par les règles, et peut être forcée avec une justification tracée. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie (affectationRules.js, force) | 17.17 |
| `IMP.ACTION.AUTOMATIQUE` | Déplacement automatique | Le système propose un nouveau créneau, sans choix d'heure à la main. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie (report par le solveur, décision du 21 octobre) | 17.18 17.24 |
| `IMP.ACTION.REMPLACE_ENSEIGNANT` | Remplacement d'un enseignant | Trouve un enseignant libre et compétent. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | absent | 17.19 |
| `IMP.ACTION.REMPLACE_SALLE` | Remplacement d'une salle | Trouve une salle libre et adaptée. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie (imprévus de l'administration) | 17.20 |
| `IMP.ACTION.AJOUT` | Ajout d'une séance | Une séance s'ajoute après coup. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie | 17.21 |
| `IMP.ACTION.SUPPRESSION` | Suppression d'une séance | Une séance se retire ; son volume revient à placer. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie | 17.22 |
| `IMP.ACTION.ANNULATION` | Annulation d'un cours | La séance reste visible comme annulée. | gestion | booleen | `true` | global | non | — | 3 | — | etablissement | permanent | saisie | 17.23 |

## Causes

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `IMP.CAUSE.ABSENCE` | Absences imprévues | Liste les séances touchées et propose report ou remplacement. | gestion | structure | — | global | non | — | 2 | — | etablissement | datee | saisie (imprévus) | 17.25 |
| `IMP.CAUSE.PANNE_SALLE` | Pannes de salles | Liste les séances touchées et propose une autre salle. | gestion | structure | — | global | non | — | 2 | — | etablissement | datee | saisie (imprévus) | 17.26 |
| `IMP.CAUSE.PANNE_MATERIEL` | Indisponibilités de matériel | Comme une panne, pour un équipement seul. | gestion | structure | — | global | non | — | 2 | — | etablissement | datee | absent | 17.27 |
| `IMP.CAUSE.FERMETURE` | Fermetures exceptionnelles | Journée annulée : toutes les séances du jour sont à reprogrammer. | gestion | structure | — | global | non | — | 2 | — | etablissement | datee | saisie (imprévus) | 17.28 |

## Cycle d'une version

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `IMP.CYCLE.HISTORIQUE` | Conservation de l'historique | Chaque modification garde sa trace. | gestion | booleen | `true` | global | non | — | 2 | — | etablissement | permanent | base (HistoriqueAffectation) | 17.31 |
| `IMP.CYCLE.COMPARAISON` | Comparaison entre versions | Ce qui bouge entre deux versions, séance par séance. | gestion | booleen | `true` | global | non | — | 2 | — | etablissement | permanent | absent | 17.32 |
| `IMP.CYCLE.VALIDATION` | Validation par un responsable | Une version attend sa validation avant de partir. | gestion | booleen | `true` | global | non | — | 2 | — | etablissement | permanent | base (publication par l'administration) | 17.33 |
| `IMP.CYCLE.PUBLICATION` | Publication d'une nouvelle version | Rend la version visible. | gestion | booleen | `true` | global | non | — | 2 | — | etablissement | permanent | base (EnvoiEdt, PlanningSnapshot) | 17.34 |
| `IMP.CYCLE.NOTIFICATION` | Notification des personnes concernées | Seuls ceux dont le planning change sont prévenus. | gestion | booleen | `true` | global | non | — | 2 | — | etablissement | permanent | base (Notification) | 17.35 |
