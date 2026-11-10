# VEN · Vente, registre des modules, abonnements

**Objet** : Planner se vend **par modules**. Le module couvre :
- le **registre des modules** : ce qu'une école a activé, les dépendances entre modules, le menu qui suit ;
- tout ce qui sert à vendre : abonnements, factures, contrats, essai, école pilote, prix, entretiens.

**La vente est mise de côté depuis le 5 novembre.** Seuls VEN-01, dont la plateforme a besoin, et VEN-02, les entretiens de terrain, avancent.

## Ce qui existe

- **Fonctionnalités par école** : `services/etablissement/fonctionnalites.js`, avec ClassQuiz par école (migration 0057).
- **Interrupteurs de l'installation** : `shared/fonctions.js` (devoirs, surveillances, annonces des enseignants, quiz dans l'application).
- **Étude du modèle économique** (gelée) : [README](../../archives/plans/modele-economique/README.md), [benchmark de 20 éditeurs marocains](../../archives/plans/modele-economique/benchmark.md), [28 questions juridiques, fiscales et Massar](../../archives/plans/modele-economique/verifications-et-consequences.md).
- **Prix** : **quatre prix différents ont circulé** (4,99 MAD par compte, 5,40 MAD HT, 9,99 MAD par élève, une grille de 149 à 899 DH par école). **Aucun n'est en vigueur**. Une seule grille sera fixée quand la vente reprendra.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| VEN-01 | **Registre des modules** : chaque module déclare ses dépendances ; les liaisons s'activent seules ; le socle est toujours inclus ; le menu et les routes suivent les modules actifs de l'école | F-02, MO-1 | 2 | L | PLA-01 | à faire |
| VEN-02 | **Cinq entretiens de terrain** avec des directeurs d'écoles privées, séparés de toute démonstration : écouter, sans rien montrer, avant de concevoir VSC-04 et FIN-01 | C-4, L-1 de la revue | 3 | S par entretien | Q-06 | à faire |
| VEN-03 | Abonnements et factures | MO-2, ME-15 | — | L | VEN-01 | gelé |
| VEN-04 | Essai gratuit avec filigrane, effacé après 60 jours | MO-3 | — | M | VEN-01 | gelé |
| VEN-05 | Contrats (sous-traitance, conditions générales) | ME-23 | — | M | juriste | gelé |
| VEN-06 | Installation d'une école pilote | ME-27 | — | L | EXP-02, PLA-05 | gelé |
| VEN-07 | Démonstration aux directeurs | D-1 à D-4 | — | M | — | gelé |
| VEN-08 | Offre d'IA payante (les plafonds techniques restent, dans QJE-07) | ME-24 | — | M | QJE-07 | gelé |
| VEN-09 | Vidéos par lien dans le Studio quiz | ME-26 | — | M | — | gelé |

## Critères de « terminé »

- **VEN-01** :
  - éteindre un module retire son menu et ses routes (404) ;
  - allumer un module dont un autre dépend allume aussi celui-ci ;
  - HESTIM ne voit rien changer.
- **VEN-02** :
  - cinq comptes rendus d'entretien sont rangés dans `docs/etude-marche/entretiens/`, anonymisés ;
  - les conséquences pour VSC-04 et FIN-01 sont écrites dans leurs modules.

## Décisions

- Le socle est inclus dans tout abonnement (4 novembre).
- Les comptes actifs sont facturés à l'école ; l'IA est incluse (11 octobre). Ces deux points sont à revoir avec la vente.

## Références

- Archives : [offre et exploitation](../../archives/plans/planner-multi-etablissements/13-offre-et-exploitation.md), [rémunération](../../archives/plans/planner-multi-etablissements/08-remuneration.md), [rencontre avec le directeur](../../etude-marche/04-rencontre-directeur.md)
