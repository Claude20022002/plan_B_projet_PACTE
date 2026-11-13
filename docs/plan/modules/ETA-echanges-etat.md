# ETA · Échanges avec l'État

**Objet** : un **cadre commun de connecteurs** vers les systèmes d'État :
- import des listes officielles ;
- export au format exigé ;
- contrôle de cohérence avant envoi ;
- horodatage et envoi qu'on peut refaire ;
- calendrier des échéances.

Massar est le premier connecteur, les autres pays suivent avec le même cadre.

**Hors module** :
- les données elles-mêmes : élèves (VSC-02), absences (VSC-03), notes (VSC-04) ;
- la configuration d'une école d'un autre pays (fuseau, langue, devise : PLA-13).

**Tables possédées** : connecteurs, envois et leur journal, correspondance entre les identifiants de Planner et ceux de l'État (à concevoir).

**Origine** : inventaire du 11 novembre (besoin N), décision du 13 novembre.

## Ce qui existe

- **Rien** pour les échanges avec un système d'État.
- **Import fichier par fichier** depuis Excel ou CSV, sur chaque page de gestion. L'import commun est prévu dans ADM-03.
- **Formats** : celui de Massar n'est pas encore obtenu. Les connecteurs dépendent de documents à demander aux AREF et aux ministères.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| ETA-01 | Cadre des connecteurs : import des listes officielles, export au format exigé, contrôle de cohérence avant envoi, horodatage, envoi qu'on peut refaire, calendrier des échéances, correspondance des identifiants | — | 4 | L | VSC-01 | à faire |
| ETA-02 | Massar : import des listes, export des absences et des notes **au format accepté** (EP-5) ; premier connecteur du cadre | VSC-05, F-17 | 4 | M | ETA-01, VSC-03, VSC-04 | à faire |
| ETA-03 | Un connecteur par autre pays visé (cartescolaire.cm, « Vie scolaire » en Tunisie, PLANETE au Sénégal, LSU en France…), quand ce pays est visé | — | 5 | M par pays | ETA-01, PLA-13 | reporté |

## Critères de « terminé »

- **ETA-01** :
  - un envoi refusé par le contrôle de cohérence dit, ligne par ligne, ce qui manque ;
  - un envoi refait donne le même fichier ;
  - le journal garde qui a envoyé quoi et quand.
- **ETA-02** : un fichier exporté est **accepté par Massar**, preuve à l'appui (accusé ou capture de l'import réussi, sans donnée réelle dans le dépôt).

## Exigences produit

EP-5 (saisie unique : aucune donnée saisie deux fois).

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin N, garantie 5 (connecteurs aux systèmes d'État).
- Ancienne place de ETA-02 : [VSC](VSC-vie-scolaire.md).
