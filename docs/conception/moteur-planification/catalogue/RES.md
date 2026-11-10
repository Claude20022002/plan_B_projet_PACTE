<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# RES · Ressources humaines complémentaires et matérielles

Tout ce qu'une séance peut mobiliser en plus d'un enseignant et d'une salle.

## Rôles de personnel à planifier

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `RES.ROLE.ASSISTANTS` | Assistants pédagogiques | Personnes mobilisables pour une séance qui demande un assistant. | donnee | liste_references | — | global, individuel (personne) | non | — | 4 | — | etablissement | periode | absent | 11.1 |
| `RES.ROLE.TECHNICIENS` | Techniciens de laboratoire | Présence requise pour certains TP. | donnee | liste_references | — | global, individuel (personne) | non | — | 4 | — | etablissement | periode | absent | 11.2 |
| `RES.ROLE.SURVEILLANTS` | Surveillants | Mobilisés pour les examens et les permanences. | donnee | liste_references | — | global, individuel (personne) | non | — | 4 | — | etablissement | periode | base (Surveillance) | 11.3 |
| `RES.ROLE.ENCADRANTS_SPORT` | Encadrants sportifs | Présence requise pour le sport. | donnee | liste_references | — | global, individuel (personne) | non | — | 4 | — | etablissement | periode | absent | 11.4 |
| `RES.ROLE.CONSEILLERS` | Conseillers pédagogiques | Disponibilités à connaître pour les rencontres. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.5 |
| `RES.ROLE.RESPONSABLES` | Responsables de filière, de département, coordinateurs | Valident les plannings de leur portée. | donnee | liste_references | — | global, individuel (personne) | non | — | 4 | — | etablissement | periode | base (ResponsableFiliere) | 11.6 11.7 11.8 |
| `RES.ROLE.INFORMATIQUE` | Personnel informatique | Présence pour certaines salles ou épreuves. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.9 |
| `RES.ROLE.SECURITE` | Personnel de sécurité | Sa présence peut borner l'ouverture des bâtiments. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.10 |
| `RES.ROLE.ENTRETIEN` | Personnel de nettoyage et de maintenance | Ses horaires donnent les temps de nettoyage et de maintenance. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.11 11.12 |
| `RES.ROLE.TUTEURS` | Tuteurs | Disponibilités pour le tutorat. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.16 |
| `RES.ROLE.JURYS` | Membres de jury | Disponibilités des jurys de soutenance. | donnee | liste_references | — | global, individuel (personne) | non | — | 3 | — | etablissement | periode | absent | 11.18 10.16 16E.19 |
| `RES.ROLE.STAGES` | Responsables de stages | Disponibilités pour les visites et les soutenances. | donnee | liste_references | — | global, individuel (personne) | non | — | 5 | — | etablissement | periode | absent | 11.19 |

## Matériel mobile

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `RES.MATERIEL.MOBILE` | Équipements mobiles | Chariot de portables : quantité par campus. | donnee | structure | — | global | non | — | 4 | — | etablissement | periode | plan (ME-2a RessourceMobile) | 12.13 |
| `RES.MATERIEL.TRANSPORT` | Transport du matériel | Marge entre deux usages sur deux lieux. | donnee | duree_min | — | global | non | — | 4 | — | etablissement | periode | absent | 12.14 |

## Règles des ressources

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `RES.REGLE.PERSONNEL_REQUIS` | Personnel requis présent | Une séance qui demande un assistant, un technicien ou un encadrant ne se place que s'il est libre. | regle | booleen | `false` | global | non | strict * | 3 | — | etablissement | permanent | absent | 4.35 |
| `RES.REGLE.MATERIEL_MOBILE` | Matériel mobile disponible | Le nombre de séances simultanées ne dépasse pas la quantité sur le campus. | regle | booleen | `false` | global | non | strict * | 3 | — | etablissement | permanent | absent | 12.13 6.56 |
