<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# LOG · Logistique et géographie

## Trajets

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `LOG.TRAJET.CAMPUS_MATRICE` | Temps de trajet entre campus | Minutes par paire de campus ; à défaut, la valeur par défaut. | donnee | matrice | — | global | non | — | 1 | — | etablissement | periode | solveur (TrajetCampus) | 12.3 3.36 5.31 6.54 6.53 |
| `LOG.TRAJET.CAMPUS_DEFAUT` | Temps de trajet par défaut | Pour une paire non renseignée. | donnee | duree_min | `30` | global | non | — | 1 | — | etablissement | periode | solveur (trajet_inter_campus_defaut_minutes) | ajout |
| `LOG.TRAJET.DISTANCE` | Distance entre campus | Kilomètres, pour les coûts de déplacement. | donnee | distance_km | — | global | non | — | 4 | — | etablissement | periode | absent | 12.2 |
| `LOG.TRAJET.MOYEN` | Moyen de transport | Change le temps et le coût du trajet. | donnee | texte | — | global | non | — | 4 | — | etablissement | periode | absent | 12.4 |
| `LOG.TRAJET.TRAJET_ENSEIGNANT` | Temps de trajet des enseignants | Entre son domicile, un autre établissement et le campus. | donnee | duree_min | — | global, individuel (enseignant) | non | — | 3 | — | etablissement | periode | absent | 12.6 |
| `LOG.TRAJET.TRAJET_ELEVE` | Temps de trajet des élèves | Peut borner le début et la fin de journée. | donnee | duree_min | — | global, pédagogique | non | — | 4 | — | etablissement | periode | absent | 12.7 |
| `LOG.TRAJET.BATIMENTS` | Circulation entre bâtiments | Minutes par paire de bâtiments. | donnee | matrice | — | global | non | — | 3 | — | etablissement | periode | absent | 12.8 6.51 6.53 |
| `LOG.TRAJET.PARCOURS` | Accessibilité des parcours | Un parcours sans ascenseur allonge ou interdit un déplacement. | donnee | matrice | — | global | non | — | 4 | — | etablissement | periode | absent | 6.55 12.11 |

## Lieux et accès

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `LOG.SITE.ASSOCIES` | Campus associés ou dissociés | Des campus associés partagent élèves et salles ; un campus dissocié forme un site. | donnee | structure | — | global | non | — | 2 | — | etablissement | periode | plan (D-20, ME-25) | ajout |
| `LOG.SITE.TRANSPORTS_SCOLAIRES` | Transports scolaires | Horaires des cars. | donnee | structure | — | global | non | — | 2 | — | etablissement | periode | absent | 12.5 |
| `LOG.SITE.PARKINGS` | Disponibilité des parkings | Information ; n'entre pas dans le calcul. | contexte | entier | — | global | non | — | 5 | — | etablissement | periode | absent | 12.12 |
| `LOG.SITE.SALLES_COMMUNES` | Salles communes | Salles partagées entre départements. | donnee | liste_references | — | global | non | — | 4 | — | etablissement | periode | absent | 12.15 |
| `LOG.SITE.FERMETURE_BATIMENTS` | Fermeture des bâtiments | Heure de fermeture propre à un bâtiment. | donnee | heure | — | global | non | — | 2 | — | etablissement | periode | absent | 12.16 |
| `LOG.SITE.SECURITE` | Contraintes de sécurité | Accès limité à certaines heures ou à certains publics. | donnee | structure | — | global | non | — | 2 | — | etablissement | periode | absent | 12.17 |
| `LOG.SITE.METEO` | Activités extérieures et météo | Une activité dehors prévoit une salle de repli ; pas de prévision dans le moteur. | donnee | reference | — | global | non | — | 4 | — | etablissement | periode | absent | 12.18 |
| `LOG.SITE.INSTALLATIONS_SPORT` | Installations sportives | Disponibles par plage, parfois hors de l'école. | donnee | structure | — | global | non | — | 3 | — | etablissement | periode | absent | 12.19 |

## Règles de déplacement

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `LOG.REGLE.TRAJET_REALISABLE` | Temps de trajet réalisable | Deux séances sur deux campus laissent le temps du trajet. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | solveur (trajetEntreCampus) | 17B.9 18A.9 |
| `LOG.REGLE.DEPLACEMENTS_INUTILES` | Limiter les déplacements | Réduit les trajets inutiles d'un enseignant ou d'un groupe. | regle | booleen | `false` | global | non | souple * | 4 | 6 | etablissement | permanent | absent | 14.4 14.14 17D.5 18B.6 |
| `LOG.REGLE.MEME_CAMPUS_ENSEIGNANT` | Un campus par jour pour un enseignant | Réduit les allers-retours d'un enseignant. | regle | booleen | `false` | global | non | souple * | 4 | 4 | etablissement | permanent | absent | ajout |
