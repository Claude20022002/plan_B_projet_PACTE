<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# FIN · Finances

Absent de la liste des 16 familles de para.txt, mais présent dans sa section 13 : gardé. Tout est facultatif : sans prix, aucun coût n'entre dans le calcul.

## Coûts

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `FIN.COUT.BUDGET` | Budget de fonctionnement | Plafond général. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.1 |
| `FIN.COUT.VACATAIRES` | Coût horaire des vacataires | Par enseignant ou par statut. | donnee | montant | — | global, individuel (enseignant) | non | — | 4 | — | etablissement | annee | absent | 13.2 |
| `FIN.COUT.HEURES_SUP` | Coût des heures supplémentaires | Au-delà du service contractuel. | donnee | montant | — | global | non | — | 4 | — | etablissement | annee | absent | 13.3 |
| `FIN.COUT.LOCATION` | Coût de location des salles | Par heure de salle externe. | donnee | montant | — | global, individuel (salle) | non | — | 5 | — | etablissement | annee | absent | 13.4 |
| `FIN.COUT.LABO` | Coût d'utilisation des laboratoires | Par heure de laboratoire. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.5 |
| `FIN.COUT.EQUIPEMENTS` | Coût des équipements | Par usage d'un équipement. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.6 |
| `FIN.COUT.DEPLACEMENTS` | Coût des déplacements entre campus | Par trajet. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.7 |
| `FIN.COUT.ACTIVITES` | Coût des activités externes | Par activité. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.8 |
| `FIN.COUT.FORMATIONS` | Budget des formations | Plafond des formations. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.9 |
| `FIN.COUT.RECRUTEMENT` | Marge pour recruter des intervenants | Permet au rapport de proposer un recrutement plutôt qu'un échec. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.10 |
| `FIN.COUT.SURVEILLANCE` | Coût des heures de surveillance | Par heure de surveillance. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.11 |
| `FIN.COUT.ENERGIE` | Coût des ressources énergétiques | Permet de regrouper les séances pour fermer un bâtiment. | donnee | montant | — | global, individuel (batiment) | non | — | 5 | — | etablissement | annee | absent | 13.12 12.20 |
| `FIN.COUT.CHANGEMENTS` | Coût des changements de planning | Prix administratif d'un changement. | donnee | montant | — | global | non | — | 5 | — | etablissement | annee | absent | 13.13 |

## Objectif financier

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `FIN.REGLE.MINIMISER_COUT` | Minimiser le coût | Départage les plannings de même qualité pédagogique ; ne passe jamais avant elle. | regle | booleen | `false` | global | non | souple | 5 | 1 | etablissement | generation | absent | ajout |
