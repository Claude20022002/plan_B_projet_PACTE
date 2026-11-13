# GRP · Groupes et réseaux d'écoles

**Objet** : servir un **groupe scolaire ou un réseau** (confessionnel, multi-campus) :
- une vue consolidée en lecture sur plusieurs écoles, chacune restant dans sa propre base ;
- des paramètres communs avec des dérogations locales ;
- la marque du réseau.

**Hors module** :
- l'isolation entre écoles et leur création (PLA) ;
- les comptes communs à plusieurs écoles (PLA-11) ;
- les enseignants partagés (ADM-07).

**Tables possédées** : groupes, appartenance d'une école à un groupe, paramètres communs (à concevoir, dans le registre des écoles de PLA-05).

**Origine** : inventaire du 11 novembre (besoin P), décision du 13 novembre.

## Ce qui existe

- **Plusieurs campus d'une même école** : `Campus`, et `TrajetCampus` pour les temps de trajet pris en compte par le moteur.
- **Une base par école** : décision D-01, en cours dans le chantier PLA.
- **Absent** : aucune notion de groupe d'écoles.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| GRP-01 | Vue consolidée en lecture sur plusieurs écoles (effectifs, encaissements, présence), chaque école restant dans sa base | — | 5 | L | PLA-05, PLA-11 | reporté |
| GRP-02 | Paramètres communs au groupe avec dérogations locales ; marque du réseau | — | 5 | M | GRP-01, ADM-02 | reporté |

## Critères de « terminé »

- **GRP-01** : la vue consolidée ne lit que les écoles du groupe ; un test d'isolation le prouve, comme pour PLA-04.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin P.
