<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# EVT · Activités et événements

Absent de la liste des 16 familles de para.txt, mais présent dans sa section 15 : gardé. Chaque événement réserve des créneaux sans détruire le planning.

## Nature de l'événement

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EVT.NATURE.SPORT` | Activités et compétitions sportives | Récurrentes ou datées. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.1 15.15 |
| `EVT.NATURE.CLUBS` | Clubs et associations | Clubs scolaires, universitaires, associations : plage commune à garder libre. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | absent | 15.2 15.3 15.4 |
| `EVT.NATURE.REUNIONS` | Réunions | Pédagogiques, de département ou de coordination : les participants sont occupés. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.5 15.8 15.9 |
| `EVT.NATURE.CONSEILS` | Conseils de classe et de discipline | Les membres du conseil sont occupés. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | absent | 15.6 15.7 |
| `EVT.NATURE.CONFERENCES` | Conférences, séminaires, ateliers | Remplacent ou suspendent des cours. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.10 15.11 15.12 |
| `EVT.NATURE.OUVERTURE` | Portes ouvertes et journées culturelles | Bloquent tout ou partie de l'école. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.13 15.14 |
| `EVT.NATURE.SORTIES` | Sorties, voyages, visites d'entreprises | Le groupe est absent ; ses enseignants peuvent être mobilisés. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.16 15.17 15.18 |
| `EVT.NATURE.PFE` | Projets de fin d'études | Plages réservées dans la semaine du groupe. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.20 16E.15 |
| `EVT.NATURE.CEREMONIES` | Cérémonies de remise de diplômes | Mobilisent salles et personnel. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.22 |
| `EVT.NATURE.FORMATIONS` | Formations du personnel | Les personnes concernées sont occupées. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.23 |
| `EVT.NATURE.SENSIBILISATION` | Activités de sensibilisation | Plage ponctuelle. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.24 |
| `EVT.NATURE.ORIENTATION` | Journées d'orientation | Plage ponctuelle pour certains niveaux. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | datee | saisie (Evenement.type_evenement) | 15.25 16C.11 |

## Règle des événements

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `EVT.REGLE.RESPECTES` | Événements bloquants respectés | Une séance ne chevauche pas un événement qui concerne son groupe, son enseignant ou sa salle. | regle | booleen | `true` | global | oui | strict | 2 | — | non | datee | saisie (Evenement.bloque_affectations) | ajout |
