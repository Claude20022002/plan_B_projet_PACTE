# Session du 2026-11-10 · QJE-04 (relecture) · `doc/qje-04-relecture`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | aucun : QJE n'est pas ouvert (3 chantiers sur 3 : EXP, PLA, QUA). Relecture demandée par le chef de projet |
| Dossier de travail | `..\travaux-planner\qje-04-relecture` |
| Dernier commit | voir `git log -1 doc/qje-04-relecture` |

## Objectif de la session

Relire la branche `jeux-pedagogique` d'Alexis (compte GitHub `Destroya2`) et la fusionner si elle est propre, sans faille de sécurité ni autre souci.

## Plan (court)

1. Comparer la branche au contrat (`docs/conception/jeux/jeux-pedagogiques.md`) et aux corrections du 16 octobre.
2. Relire le serveur et les moteurs pour la sécurité.
3. Fusionner `main` dans une copie de la branche, dans un dossier à part.
4. Lancer le contrôle de neutralité, les tests et les lints.
5. Conclure.

## Fait

- Relecture complète, écrite dans le contrat : § 6.
- `suivi.md` : QJE-04 passe à « relu le 10 nov. ».
- Le dossier de revue (`revue-jeux`) est supprimé, jonctions retirées d'abord.

## Vérifié

Résultats sur la branche fusionnée avec `main` :
- serveur : 431 tests sur 431 ;
- site : 42 tests sur 42, construction réussie ;
- lint : 0 erreur ;
- **application : 72 tests sur 73** ;
- **contrôle de neutralité : échec**, 11 mentions d'HESTIM ;
- tests d'intégration et parcours : non lancés (Docker arrêté).

## Questions

| N° | Question | Proposition | État |
|---|---|---|---|
| J-1 | Qui corrige B-1 et B-2 : Alexis sur sa branche, ou nous sur une branche `fix/qje-04-…` ? | Alexis : c'est son travail, et les corrections sont courtes | **validé le 10 nov.** |
| J-2 | Amender le § 1 du contrat : plus de page de programme d'une école dans `curriculum` (B-1) | oui, discipline et niveau seulement | **validé le 10 nov.** |
| J-3 | Les réponses attendues renvoyées après un échec (I-1) | ne dire que ce qui est faux ; la solution après trois essais ou sur demande, sans points | **validé le 10 nov.** |
| J-4 | QJE n'est pas un chantier ouvert (3 sur 3). Faire une exception pour QJE-04, ou attendre la fermeture d'un chantier ? | exception pour QJE-04 seule : la branche d'Alexis vieillit (55 commits de retard) | **validé le 10 nov.** |

## État laissé

- `suivi.md` : QJE-04 relu ; non fusionné.
- Branche d'Alexis inchangée (rien n'y a été poussé ni modifié).

## Reste à faire, dans l'ordre

1. Le chef répond à J-1 à J-4.
2. B-1 et B-2 sont corrigés, et I-1 aussi s'il est retenu.
3. `main` est fusionné dans `jeux-pedagogique`.
4. Une PR est ouverte, avec la CI complète.
5. Fusion.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\qje-04-relecture" push -u origin doc/qje-04-relecture
gh pr create --base main --head doc/qje-04-relecture --title "QJE-04 : relecture de jeux-pedagogique (10 novembre)" --fill
```

## Prompt de reprise

```text
Tu reprends QJE-04 (fusion de la branche jeux-pedagogique d'Alexis) de Planner.
Lis AGENTS.md, docs/plan/README.md, docs/plan/suivi.md, le contrat docs/conception/jeux/jeux-pedagogiques.md
(§ 1 et § 6, relecture du 10 novembre) et cette fiche (docs/sessions/2026-11-10-doc-qje-04-relecture.md).
Réponses du chef à J-1 à J-4 : <à coller ici>.
Si les corrections nous reviennent : branche fix/qje-04-corrections depuis origin/jeux-pedagogique,
plan court (B-1, B-2, I-1 s'il est retenu), test qui fige chaque correctif, contrôle de neutralité vert,
tests de l'application verts, puis PR vers main avec la CI complète.
Jamais de git push ; fiche de session et suivi.md en fin de session.
```
