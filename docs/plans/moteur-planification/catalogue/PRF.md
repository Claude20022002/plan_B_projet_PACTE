<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# PRF · Préférences et qualité de vie

## Vœux des enseignants

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PRF.ENS.CRENEAUX_PREFERES` | Créneaux préférés | Récompense une séance posée sur un créneau préféré. | regle | structure | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | solveur (Disponibilite.preference) | 5.45 14.5 18B.4 17D.7 |
| `PRF.ENS.CRENEAUX_EVITER` | Créneaux à éviter | Pénalise une séance posée sur un créneau à éviter. | regle | structure | — | individuel (enseignant) | non | souple | 4 | 3 | personne | periode | solveur (Disponibilite.preference) | 5.46 |
| `PRF.ENS.JOURS_PREFERES` | Jours préférés | Récompense les séances de ces jours. | regle | liste_jours | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | absent | 5.47 |
| `PRF.ENS.JOURS_EVITER` | Jours à éviter | Pénalise les séances de ces jours. | regle | liste_jours | — | individuel (enseignant) | non | souple | 4 | 3 | personne | periode | absent | 5.48 |
| `PRF.ENS.MATIN` | Préférence pour le matin | Vise les créneaux du matin. | regle | booleen | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | absent | 5.49 |
| `PRF.ENS.APRES_MIDI` | Préférence pour l'après-midi | Vise les créneaux de l'après-midi. | regle | booleen | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | absent | 5.50 |
| `PRF.ENS.REGROUPES` | Préférence pour les cours regroupés | Concentre ses séances sur peu de jours. | regle | booleen | — | individuel (enseignant) | non | souple | 4 | 3 | personne | periode | absent | 5.51 14.3 |
| `PRF.ENS.JOURNEE_CONTINUE` | Préférence pour les journées continues | Réduit ses trous. | regle | booleen | — | individuel (enseignant) | non | souple | 4 | 2 | personne | periode | absent | 5.52 14.1 18B.8 |
| `PRF.ENS.JOURNEE_PAUSES` | Préférence pour des journées avec pauses | Garde des pauses entre ses séances. | regle | booleen | — | individuel (enseignant) | non | souple | 4 | 2 | personne | periode | absent | 5.53 |
| `PRF.ENS.CAMPUS` | Préférence de campus | Vise ce campus quand le choix est libre. | regle | reference | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | base (Enseignant.id_campus_prefere) | 5.54 |
| `PRF.ENS.SALLE` | Préférence de salle | Vise cette salle quand le choix est libre. | regle | reference | — | individuel (enseignant) | non | souple | 4 | 1 | personne | periode | absent | 5.55 |
| `PRF.ENS.JOURNEE_LONGUE` | Journée trop longue pour un enseignant | Amplitude quotidienne à ne pas dépasser. | regle | duree_min | — | global, pédagogique, individuel (enseignant) | non | souple | 4 | 3 | etablissement | periode | absent | 14.2 |

## Qualité de vie des apprenants

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PRF.APP.REPARTITION_MATIERES` | Répartir équitablement les matières | Chaque matière se répartit sur la semaine plutôt que sur un seul bloc. | regle | booleen | `false` | global, pédagogique | non | souple * | 4 | 6 | etablissement | periode | absent | 18B.5 16B.10 |
| `PRF.APP.SPORT_PRESERVE` | Préserver les activités sportives | Le sport n'est pas la variable d'ajustement. | regle | booleen | `false` | global, pédagogique | non | souple * | 4 | 3 | etablissement | periode | absent | 14.12 |
