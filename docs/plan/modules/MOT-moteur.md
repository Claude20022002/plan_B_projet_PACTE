# MOT · Moteur de planification

**Objet** : un **moteur central, configurable par profil pédagogique** (primaire, collège, lycée, formation, université). Ce n'est jamais un générateur par type d'école (décision du 3 novembre). Le module couvre :
- le solveur ;
- le catalogue des paramètres et les profils ;
- les valeurs datées ;
- la validation avant le calcul ;
- les performances.

**Hors module** : l'affichage et la gestion des séances, la publication, les examens saisis (EDT).

**Tables possédées** : `ParametrePlanning`, `VersionParametres`, `ValeurParametre`, `GenerationSession`, `PlanningSnapshot`.

## Ce qui existe

- **Solveur** : `solver/`, en Java 21 avec **Timefold 1.15.0** (`solver/pom.xml`), limité à 1 Go et à 2 calculs simultanés. Côté serveur : `backend/services/generation/timefold/*`, `generationAutomatiqueRoutes`, et la page `gestion/GenerationAutomatique`. Il compte 7 classes de test.
- **Catalogue** : 498 paramètres et 5 profils, dans `backend/services/moteur/catalogue/` (JSON, qui font foi). Les pages lisibles sont générées par `node scripts/catalogue-moteur-doc.mjs` dans [conception/moteur-planification/catalogue](../../conception/moteur-planification/catalogue/README.md).
- **MP-1** (fusionnée le 7 novembre) : valeurs versionnées et datées (migration 0061), routes `/api/moteur`. **La génération ne lit pas encore ces valeurs.**
- **Limites du modèle actuel** ([ecarts-du-solveur.md](../../conception/moteur-planification/ecarts-du-solveur.md)) :
  - F-1 : une seule semaine type ;
  - F-2 : enseignant imposé avant le calcul ;
  - F-3 : une séance couvre 1 ou 2 créneaux ;
  - F-4 : au plus 6 séances par semaine ;
  - F-5 : conflits calculés par hiérarchie de groupes, **pas par élève** ;
  - F-6 : les groupes sont donnés ;
  - F-7 : une séance ne mobilise que des enseignants et une salle ;
  - F-8 : les examens sont hors du calcul.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| MOT-01 | Valeurs du moteur datées et résolues (profil, école, niveau) ; répondre à la relecture du contrat (Q-04) avant les écrans | MP-1 | 1 | M | — | fait (serveur) ; écrans avec ADM-02 |
| MOT-02 | Mesurer le solveur sur un **jeu scolaire** (collège de 600 élèves), puis sur 20 000 étudiants | ME-14a | 1 | M | — | à faire |
| MOT-03 | Validation avant le calcul : toutes les règles `requiert`, `borne` et `exclut` du catalogue, avec un message qui dit quoi faire (EP-4) | MP-2 | 3 | M | MOT-01 | à faire |
| MOT-04 | Modèle neutre et évaluateur indépendant ; essai Timefold contre CP-SAT ; **décision sur la fin de Timefold 1.x** (Q-05) | MP-3, MP-4 | 3 | L + M | MOT-02 | à faire |
| MOT-05 | Profils et nomenclatures lus dans la base (cycle, niveau, classe, demi-groupe), à la place de `config/referentiel.js` (importé par 28 fichiers). Version réduite à l'étape 2, complète à l'étape 3 | ME-2a, F-04 | 2 puis 3 | M + L | VSC-01, Q-08 | à faire |
| MOT-06 | Collège : conflits **par élève** (F-5), groupes transversaux de langue et d'option, demi-groupes, salles spécialisées | MP-6, F-11 | 3 | XL | MOT-03, MOT-05 | à faire |
| MOT-07 | Lycée : options, plus de 2 créneaux par séance (F-3), semaines A et B (F-1). Le primaire et la maternelle selon Q-07 | MP-6 | 3 | L | MOT-06 | à faire |
| MOT-08 | File simple des calculs : une école attend son tour sans bloquer les autres | A-3 de la revue | 2 | M | PLA-01 | à faire |
| MOT-09 | Remplaçant proposé automatiquement en cas d'absence d'un enseignant | F-11 (2e partie) | 4 | M | MOT-06 | à faire |
| MOT-10 | Grande échelle : solveur réglable, file par école, 20 000 étudiants en moins de 30 min ; poids et plages lus depuis les valeurs | ME-14, MP-5 | 5 | L | MOT-04 | à faire |
| MOT-11 | Règles nouvelles, famille par famille (examens dans le calcul F-8, ressources F-7, etc.), chacune avec ses données et son test | MP-7 | 5 | M par famille | MOT-10 | à faire |

## Critères de « terminé »

- **MOT-02** :
  - le jeu de démonstration est versionné ;
  - le temps, la mémoire et la qualité (règles dures violées) sont notés dans `docs/conception/moteur-planification/mesures.md` ;
  - le rapport dit si EP-10 tient.
- **MOT-03** :
  - toute combinaison de valeurs invalide est refusée **avant** le calcul ;
  - le message nomme la règle et propose une correction ;
  - un test par famille de règles.
- **MOT-04** :
  - le même jeu est résolu par les deux moteurs et noté par l'évaluateur indépendant ;
  - la décision est écrite dans [decisions.md](../decisions.md), avec son coût (licence de `ScoreAnalysis` en 2.x).
- **MOT-06** : un collège de démonstration avec deux langues vivantes réparties sur plusieurs classes est généré **sans conflit d'élève**. C'est le jalon de l'étape 3.
- **MOT-08** : deux écoles lancent un calcul en même temps ; la seconde voit sa place dans la file ; aucune ne bloque l'autre.

## Exigences produit

EP-4 (chaque refus s'explique), EP-10 (rapide à grande échelle).

## Décisions

- **D-09 amendée le 4 novembre** : 26 règles strictes verrouillées, 22 strictes réglables, 86 souples.
- **Choix du moteur** : tranché par la mesure (MOT-04).
- **Primaire et maternelle** : saisie simple tant que Q-07 n'est pas tranchée.

## Conception et références

- [README du moteur](../../conception/moteur-planification/README.md)
- [Conception de MP-1](../../conception/moteur-planification/conception-mp1.md)
- [Relecture du contrat de MP-1](../../conception/moteur-planification/relecture-mp1-contrat.md)
- [Catalogue et profils](../../conception/moteur-planification/catalogue/profils.md)
- Archives : [planification adaptative](../../archives/plans/planner-multi-etablissements/06-planification-adaptative.md)
