<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# REG · Réglementation

Aucune valeur par défaut : une règle de pays est saisie par pays, type et niveau, jamais écrite dans le moteur.

## Travail des enseignants

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `REG.TRAVAIL.DUREE_LEGALE` | Durée légale du travail enseignant | Durée de référence annuelle ou hebdomadaire. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | plateforme | annee | absent | 9.1 |
| `REG.TRAVAIL.MAX_JOUR` | Durée maximale quotidienne | Plafond légal : aucun plafond d'école ne le dépasse. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | plateforme | annee | absent | 9.2 |
| `REG.TRAVAIL.MAX_SEMAINE` | Durée maximale hebdomadaire | Plafond légal hebdomadaire. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | plateforme | annee | absent | 9.3 |
| `REG.TRAVAIL.REPOS` | Temps de repos obligatoire | Repos légal entre deux journées. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | plateforme | annee | absent | 9.4 |
| `REG.TRAVAIL.PAUSE` | Temps de pause obligatoire | Pause légale après une durée continue. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | plateforme | annee | absent | 9.5 |

## Programme et validation

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `REG.PROGRAMME.VOLUME_MATIERE` | Volume officiel par matière | Volume officiel ; un écart est signalé avant le calcul. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.6 |
| `REG.PROGRAMME.VOLUME_NIVEAU` | Volume officiel par niveau | Total officiel d'un niveau. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.7 |
| `REG.PROGRAMME.PROGRAMME` | Programme national | Liste des matières obligatoires d'un niveau. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.8 |
| `REG.PROGRAMME.PRESENCE` | Obligations de présence | Séances à présence obligatoire. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.13 |
| `REG.PROGRAMME.TP` | Réglementation des travaux pratiques | Effectif ou encadrement imposé en TP. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.18 |
| `REG.PROGRAMME.EXAMENS` | Règles concernant les examens | Durées, tiers-temps, surveillance imposés. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.21 |
| `REG.PROGRAMME.VALIDATION` | Règles de validation des enseignements | Conditions de validation d'un module. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.22 |
| `REG.PROGRAMME.ACCREDITATION` | Formations accréditées | Obligations propres à une accréditation. | donnee | structure | — | pédagogique | non | — | 2 | — | plateforme | annee | absent | 9.23 |

## Règles réglementaires

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `REG.REGLE.HORAIRES` | Horaires réglementaires respectés | Aucun plafond retenu ne dépasse le plafond légal renseigné. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | absent | 18A.10 |
| `REG.REGLE.VOLUMES_OFFICIELS` | Volumes officiels respectés | Le volume d'une matière couvre le volume officiel renseigné. | regle | booleen | `true` | global | non | strict * | 2 | — | etablissement | permanent | absent | ajout |
