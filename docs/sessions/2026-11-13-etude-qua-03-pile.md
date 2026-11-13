# Session du 2026-11-13 · QUA-03 · `etude/qua-03-pile`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | QUA (limité à QUA-03) |
| Dossier de travail | `..\travaux-planner\qua-03-pile` |
| Dernier commit | voir `git log -1 etude/qua-03-pile` (la fiche suit `b5958bb`) |

## Objectif de la session

Clore l'étude de la pile : une page de critères, puis la décision du 4 novembre (« la pile ne change pas ») confirmée ou rouverte.

Au début de la session, #167 et #170 ont été fusionnées par le chef, et la branche est partie de `main` (`548c19e`).

## Plan

[docs/conception/qualite/qua-03-plan.md](../conception/qualite/qua-03-plan.md), **validé par Claude20022002 le 13 novembre**.

Il prévoit une étude sur dossier de toute la pile, comparée à celle de `plan.txt` et aux montées de version, selon quatre critères :
- coût du changement ;
- plusieurs écoles ;
- exploitation ;
- produit et équipe.

Le critère de « terminé » est fait d'un verdict par partie et de conditions de réouverture. Il n'y a aucun code.

## Fait

- `07f5833` : plan validé, commité seul ; QUA-03 passe « en cours ».
- `d7fc0c5` : [pile.md](../conception/qualite/pile.md), qui examine sept parties de la pile et leur donne un verdict :

  | Partie | Verdict |
  |---|---|
  | Serveur | garder |
  | Accès aux données (Sequelize) | garder, **sous surveillance** |
  | Base (MySQL 8.4) | garder, **si D-01 tient** |
  | Site | garder |
  | Application mobile | garder |
  | Solveur | garder **jusqu'à MOT-04** |
  | Authentification | garder |

  La page contient aussi les montées de version (listées, non décidées), six conditions de réouverture et des sources datées.
- `b5958bb` : mise à jour des documents du plan.
  - `decisions.md` :
    - décision du 13 novembre : la pile est confirmée sous condition que D-01 tienne ;
    - Q-05 précisée : Timefold 1.x n'est corrigé que pendant 2026, et Spring Boot 3.3 est sans support libre depuis le 30 juin 2025.
  - Module QUA : critère de « terminé » de QUA-03, état et ligne « Pile ».
  - Module PLA : PLA-01 ne dépend plus que d'EXP-02.
  - `suivi.md` : QUA-03 « étude faite, à fusionner » ; le chantier QUA se ferme à la fusion.
  - `docs/conception/README.md` : ajout du dossier `qualite/`.

## Vérifié

- `node scripts/verifier-neutre.mjs` : aucun nom d'école en dur.
- Liens Markdown de `docs/plan/`, `docs/conception/README.md` et `docs/conception/qualite/` : 347 liens locaux, 0 cassé après correction d'un lien de `pile.md`.
- Pas de code modifié : la CI n'a rien de neuf à vérifier.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| 1 à 8 | Portée, comparaison, profondeur, critères, « terminé », montées, fichiers, sources | voir § 3 du plan | réglé le 13 nov. |
| 9 | Ouvrir une fonction pour la montée du solveur, c'est-à-dire Spring Boot 4 et Timefold 1.31 ? Dans quel module, MOT ou QUA ? | proposition : une fonction MOT, avant MOT-04 ou avec lui, puisque Spring Boot 3.3 est sans support libre depuis juin 2025 | **en attente du chef** |
| 10 | Que faire de la place libérée par le chantier QUA à sa fermeture ? | — | **en attente du chef** |
| Thème bleu | Le bleu comme couleur de Planner (règle N-4 du socle neutre) | — | en attente (reporté de la fiche précédente) |

## État laissé

- `docs/plan/suivi.md` : QUA-03 passe à « en cours : étude faite, à fusionner ».
- Chantier QUA : il ne reste rien. Il se ferme à la fusion : passer QUA-03 à « fait » et déplacer la ligne QUA dans « Fermés ».
- Chantier PLA : PLA-01 n'attend plus qu'EXP-02.
- **Conflits possibles à la fusion** : des lignes ajoutées dans les mêmes tableaux. Il suffit de garder toutes les lignes.
  - `decisions.md` (section 2, après les lignes du 13 novembre) avec #169 et avec la branche de PLA-06 (décision Ollama) ;
  - `suivi.md` avec #166.

## Reste à faire, dans l'ordre

1. Le chef pousse, ouvre la PR et la fusionne quand la CI est verte.
2. À la fusion : QUA-03 passe à « fait », le chantier QUA se ferme (`suivi.md`), et le chef décide quel chantier ouvrir à sa place.
3. Questions 9 et 10 ci-dessus.
4. Reprendre un chantier ouvert : PLA-06 (banc sur le PC Ubuntu), EXP-01 ou EXP-02.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\qua-03-pile" push -u origin etude/qua-03-pile
gh pr create --base main --head etude/qua-03-pile --title "QUA-03 : étude de la pile close (pile confirmée si D-01 tient)" --fill
gh pr checks etude/qua-03-pile --watch
gh pr merge etude/qua-03-pile --merge
```

## Prompt de reprise

```text
Tu reprends Planner après QUA-03 (étude de la pile close), chantier QUA,
branche etude/qua-03-pile, dossier ..\travaux-planner\qua-03-pile.
Lis AGENTS.md, docs/plan/README.md, docs/plan/suivi.md, docs/plan/decisions.md (13 novembre),
docs/conception/qualite/pile.md et cette fiche (docs/sessions/2026-11-13-etude-qua-03-pile.md).
Vérifie avec gh pr list si la PR de etude/qua-03-pile est fusionnée ; sinon, dis-le au chef avant tout.
Fait : pile confirmée sous condition que D-01 tienne ; Sequelize sous surveillance ; solveur gardé jusqu'à MOT-04 ;
montées listées (Spring Boot 3.3 sans support libre, Timefold 1.x corrigé pendant 2026 seulement, Node 24, Express 5).
Après la fusion : QUA-03 à « fait » et chantier QUA fermé dans suivi.md ; le chef choisit le chantier à ouvrir à sa place.
Questions en attente : fonction pour la montée du solveur (MOT ou QUA ?), chantier à ouvrir, thème bleu.
Chantiers ouverts ensuite : EXP et PLA (PLA-06, EXP-01, EXP-02) ; rien sur le marketing.
Règles : questions avant toute supposition, plan validé avant le code, fiche de session et suivi.md en fin de session ;
jamais de git push.
```
