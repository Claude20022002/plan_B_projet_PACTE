<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# HUM · Contraintes humaines

## Besoins des personnes

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `HUM.BESOIN.ACCESSIBILITE` | Besoins d'accessibilité | Un élève ou un enseignant à mobilité réduite impose des salles accessibles. | donnee | booleen | `false` | individuel (groupe) | non | — | 2 | — | etablissement | periode | absent | 3.38 12.10 |
| `HUM.BESOIN.PAUSE_NECESSAIRE` | Temps de pause nécessaire | Pause propre à un groupe. | donnee | duree_min | — | individuel (groupe) | non | — | 2 | — | etablissement | periode | absent | 3.37 |
| `HUM.BESOIN.MINEURS` | Public mineur | Active les règles d'accueil et d'encadrement des mineurs. | donnee | booleen | `false` | pédagogique | non | — | 1 | — | etablissement | periode | absent | 9.19 16A.13 |
| `HUM.BESOIN.PRIERE` | Temps de prière | Plages à laisser libres si l'école l'a décidé ; ce choix reste le sien. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | parametre (pause_vendredi) | 7.46 |

## Règles humaines

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `HUM.REGLE.ACCESSIBILITE` | Salle accessible si besoin | Un groupe qui a un besoin d'accessibilité n'a cours que dans une salle accessible. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | absent | 9.20 12.10 |
| `HUM.REGLE.PAUSE_OBLIGATOIRE` | Pause obligatoire respectée | Après la durée maximale, une pause d'au moins la durée fixée est tenue. | regle | booleen | `true` | global | oui | strict | 1 | — | non | permanent | absent | 17B.12 9.5 |
| `HUM.REGLE.ENCADREMENT` | Encadrement des élèves | Un élève mineur n'est jamais sans adulte : le trou est interdit ou couvert par une permanence. | regle | booleen | `false` | global | non | strict * | 2 | — | etablissement | permanent | absent | 9.16 16A.13 |
| `HUM.REGLE.RATIO_ENCADREMENT` | Ratio enseignant/apprenants | Nombre maximal d'apprenants par adulte, propre au pays et à l'activité. | regle | entier | — | global, pédagogique | non | strict * | 2 | — | etablissement | permanent | absent | 9.17 9.18 |
| `HUM.REGLE.EQUITE` | Équilibre des charges entre enseignants | Réduit les écarts entre services comparables. | regle | booleen | `false` | global, pédagogique | non | souple * | 4 | 4 | etablissement | permanent | absent | 14.7 18B.10 17D.11 |
| `HUM.REGLE.REMPLACABLE` | Faciliter les remplacements | Garde, chaque créneau, un enseignant libre et compétent par discipline. | regle | booleen | `false` | global | non | souple * | 5 | 2 | etablissement | permanent | absent | 14.21 |
| `HUM.REGLE.SURVEILLANCE_SIMPLE` | Faciliter la surveillance | Regroupe les classes de mineurs pour une surveillance plus simple. | regle | booleen | `false` | global | non | souple * | 5 | 2 | etablissement | permanent | absent | 14.18 |
