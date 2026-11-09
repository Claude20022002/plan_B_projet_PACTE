# Session du AAAA-MM-JJ · <IDENTIFIANT> · `<branche>`

<!-- Copier ce modèle dans docs/sessions/AAAA-MM-JJ-<branche, « / » remplacé par « - »>.md.
     Une fiche par session (ajouter -2, -3 si plusieurs le même jour). Obligatoire, même sans code. -->

| | |
|---|---|
| Fait par | <agent (modèle) ou personne> |
| Chantier | <CODE du module> |
| Dossier de travail | `..\travaux-planner\<nom>` |
| Dernier commit | `<sha court>` |

## Objectif de la session

## Plan

<!-- Lien vers le document de conception validé ; ou, pour un correctif, le plan court :
     cause, ce qui change, comment c'est vérifié. -->

## Fait

<!-- Commits, avec leur sha court et une ligne chacun. -->

## Vérifié

<!-- Tests lancés et leur résultat (chiffres) ; ce qui reste à la CI. Un échec se dit, avec sa sortie. -->

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|

## État laissé

- `docs/plan/suivi.md` : <fonction> → <état>
- Chantier <CODE> : <reste N fonctions : …>

## Reste à faire, dans l'ordre

1.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\<nom>" push -u origin <branche>
gh pr create --base main --head <branche> --title "<IDENTIFIANT> : <titre>" --fill
```

## Prompt de reprise

```text
Tu reprends <IDENTIFIANT> (<nom>) du chantier <CODE>, sur la branche <branche>,
dans le dossier ..\travaux-planner\<nom>.
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/suivi.md,
la conception <chemin> et cette fiche (docs/sessions/<fichier>).
Fait : <…>.
Reste : <…>.
Questions en attente : <…>.
Règles : pas de code hors du plan validé ; questions avant toute supposition ;
fiche de session et suivi.md à jour en fin de session ; jamais de git push.
```
