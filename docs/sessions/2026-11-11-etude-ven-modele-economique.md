# Session du 2026-11-11 · VEN · `etude/ven-modele-economique`

| | |
|---|---|
| Fait par | Claude Code (Claude Opus 5.5) |
| Chantier | VEN, hors chantier : demande du chef le 11 novembre, à la suite de MKT-09 |
| Dossier de travail | `..\travaux-planner\modele-economique` |
| Dernier commit | voir `git log` de la branche |

## Objectif de la session

Le chef a jugé la présentation aux chefs d'établissement « pas vendeuse ». Il demande :
- un modèle économique appuyé sur les études, avec des prix en dollars ;
- une nouvelle présentation Canva, orientée vente, qui commence par le supérieur.

## Fait

- `0ce02d0` : [05-modele-economique.md](../etude-marche/05-modele-economique.md). Il contient :
  - les segments ;
  - le socle, les trois packs et les modules seuls ;
  - les prix en USD par effectif (écoles) et par apprenant actif (supérieur) ;
  - les consommables, les services et les conditions ;
  - les marges, sur hypothèses, et trois scénarios de revenus.
- `a0cdbc5` : décisions du 11 novembre (grille validée, présentation orientée vente).
- Canva : nouvelle présentation générée à partir d'un plan de 12 pages (voir la fiche suivante, ou le message de fin de session).

## Vérifié

- Chaque prix de repère a été recalculé à partir du benchmark du groupe A (1 USD = 9,8261 MAD, cours BAM du 3 novembre 2026). Deux erreurs de conversion ont été corrigées avant le commit : Acadelta et Skoolly à 150 élèves.
- Les marges et les scénarios ont été recalculés à la main ; ce sont des hypothèses, jamais des mesures.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| 1 | Grille de prix | validée | fait |
| 2 | Capture de l'école en service | gardée, nom et logo masqués | à faire dans Canva |
| 3 | Modules à venir | étiquette « bientôt » | fait dans le plan des pages |
| 4 | Public de départ | le supérieur d'abord | fait |
| 5 | Facturation en USD ou en MAD au Maroc | — | à trancher (§ 6 de 05) |

## Reste à faire, dans l'ordre

1. Relire la présentation générée, corriger, placer la capture masquée, puis l'enregistrer avec l'accord du chef.
2. Nouveau logo : session de l'agence (prompt donné le 11 novembre).
3. Les cinq entretiens de VEN-02, pour confirmer les prix.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\modele-economique" push -u origin etude/ven-modele-economique
gh pr create --base main --head etude/ven-modele-economique --title "Étude : modèle économique de Planner (prix en dollars)" --fill
```

## Prompt de reprise

```text
Tu reprends le modèle économique de Planner et la présentation commerciale, sur la branche
etude/ven-modele-economique, dans le dossier ..\travaux-planner\modele-economique.
Lis d'abord AGENTS.md, docs/plan/suivi.md, docs/etude-marche/05-modele-economique.md,
docs/plan/decisions.md (11 nov.) et cette fiche.
Fait : grille de prix en USD validée ; nouvelle présentation Canva générée (12 pages, orientée vente,
le supérieur d'abord).
Reste : relire et corriger la présentation ; capture de l'école en service avec le nom HESTIM masqué
(média Canva MAHYmgn3w2Y) ; logo à refaire dans la session de l'agence ; contact de la dernière page.
Règles : aucun chiffre inventé ; HESTIM jamais nommé ; modules à venir marqués « bientôt » ;
questions avant toute supposition ; jamais de git push.
```
