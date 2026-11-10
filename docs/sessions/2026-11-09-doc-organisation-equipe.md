# Session du 2026-11-09 · organisation de l'équipe · `doc/organisation-equipe`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | aucun : tâche `doc/` demandée par le chef de projet |
| Dossier de travail | `..\travaux-planner\organisation` (part de `doc/plan-modulaire`, non fusionnée) |
| Dernier commit | voir `git log -1 doc/organisation-equipe` |

## Objectif de la session

1. Prendre le contexte de tout le projet et de toutes ses branches.
2. Organiser le travail de l'équipe et des agents, à la demande du chef de projet :
   - un fichier d'état mis à jour à chaque fin de session ;
   - des chantiers de module : finir un module commencé, plusieurs modules à la fois ;
   - un plan de conception avant le code ;
   - une branche par tâche ;
   - des questions plutôt que des suppositions ;
   - un prompt de reprise ;
   - le module marketing et ses agents.
3. Lancer le chantier PLA.

## Plan (court, tâche `doc/`)

- **Un seul fichier d'état** : `docs/plan/suivi.md`, enrichi, plutôt qu'un second tableau qui le contredirait. On y ajoute l'obligation de fin de session et le tableau des chantiers.
- **Les règles** :
  - `AGENTS.md` à la racine, lu par Codex et les autres outils ;
  - `CLAUDE.md`, qui l'importe pour Claude Code ;
  - le détail dans `docs/plan/organisation.md`.
- **Deux modèles** : plan de conception et fiche de session.
- **Module MKT** : il s'appuie sur l'agence existante (`..\planner-marketing`, 9 agents).
- **Mises à jour** : README du plan, décisions du 9 novembre, modèle de PR, index des conceptions.

## Fait

- `AGENTS.md`, `CLAUDE.md` : règles obligatoires, le chef de projet est Claude20022002.
- `docs/plan/organisation.md` : rôles, fichiers d'état, chantiers (au plus 3, diagramme d'états), une tâche par branche, conception validée avant le code, questions, fin de session, sessions longues, marketing.
- `docs/plan/modeles/conception.md` et `docs/plan/modeles/fiche-de-session.md`.
- `docs/plan/modules/MKT-marketing.md` : MKT-01 à MKT-10. Les fonctions 08 à 10 sont gelées avec la vente.
- `docs/plan/suivi.md` :
  - obligation de fin de session ;
  - chantiers EXP et PLA ouverts ;
  - travaux d'avant la règle et leur ordre de fusion ;
  - lignes MKT ;
  - états remis d'accord avec GitHub : MOT-01 et la migration 0061 sont dans #156, pas encore fusionnée ; l'essai de PLA-01 est dans #142, pas encore fusionnée.
- `docs/plan/README.md` : MKT, chantiers, nommage des branches, routine (questions, plan validé, fin de session).
- `docs/plan/decisions.md` : 7 décisions datées du 9 novembre.
- `docs/plan/modules/PLA-plateforme.md` : #142 n'est pas fusionnée (le fichier disait le contraire).
- `.github/pull_request_template.md` : liens vers le plan et la fiche, quatre cases pour les règles de l'équipe.
- Branche locale `edt/edt-dimanche-visible` renommée `fix/edt-dimanche-visible`.

## Vérifié

- `node scripts/verifier-neutre.mjs` : aucun nom d'école en dur.
- Aucun code modifié : la CI du serveur et du site n'est pas concernée.

## Constats de la prise de contexte

- **`main` est rouge depuis le dimanche 8 novembre**. Les parcours `edtPdf` et `entreRoles` créent une séance « aujourd'hui », et le dimanche était masqué de la grille. Le correctif est `ca1db8b`, sur `fix/edt-dimanche-visible`, jamais poussé. Les PR #142, #156 et #161 échouent pour la même raison.
- `doc/plan-modulaire` a 2 commits locaux non poussés (`9841f09`, `e527dba`). GitHub dit #161 « en conflit », mais une fusion d'essai avec `main` passe sans conflit.
- `..\planner-marketing` n'a **aucun commit** : tout son travail peut être perdu (MKT-01).
- Il y a environ 150 branches et 6 dossiers de travail anciens (QUA-05).

## Questions

Posées au chef de projet dans le message de fin de session. Les réponses seront reportées ici et dans `decisions.md` par la session suivante.

| N° | Question | Proposition | État |
|---|---|---|---|
| O-1 | Limite de chantiers ouverts | 3 | **validé** le 10 nov. |
| O-2 | Le chantier EXP (EXP-01 à EXP-05) est-il bien ouvert ? | oui, il l'était de fait | **validé** le 10 nov. |
| O-3 | Dépôt de l'agence marketing | dépôt GitHub privé `planner-marketing` (logos et stratégie hors du dépôt public) | **validé** le 10 nov. |
| O-4 | Gel de la vente : le marketing prépare sans publier | oui, jusqu'à décision contraire | **validé** le 10 nov. |
| P-1 à P-10 | Questions du chantier PLA (ordre, PLA-06) | voir le message de fin de session | **propositions validées** le 10 nov. ; P-4 (caractéristiques du serveur) reste sans réponse, faute de proposition |

## État laissé

- `docs/plan/suivi.md` : chantiers EXP et PLA ouverts (2 sur 3) ; aucune fonction PLA en cours. PLA-06 commencera après les réponses aux questions et la fusion de cette branche.

## Reste à faire, dans l'ordre

1. Le chef pousse `fix/edt-dimanche-visible`, `doc/plan-modulaire` et `doc/organisation-equipe` (commandes dans le message de fin de session).
2. Fusionner dans cet ordre : `fix/edt-dimanche-visible`, #142, #156, #161, `doc/organisation-equipe`.
3. Répondre aux questions O-1 à O-4 et P-1 à P-10.
4. PLA-06 : branche `etude/pla-06-mesure-d01` partant de `origin/main`, plan de conception `docs/conception/plateforme/pla-06-mesure-d01.md`, validation, puis mesure.

## Prompt de reprise

```text
Tu reprends le chantier PLA (plateforme multi-écoles) de Planner, première fonction : PLA-06
(mesure de D-01, une base par école : 200 bases sur un serveur).
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/organisation.md, docs/plan/suivi.md,
docs/plan/modules/PLA-plateforme.md, docs/conception/plateforme/02-decisions.md (D-01),
03-architecture.md, 17-essai-contexte.md, et cette fiche (docs/sessions/2026-11-09-doc-organisation-equipe.md).
Vérifie avec gh pr list que fix/edt-dimanche-visible, #142, #156, #161 et doc/organisation-equipe
sont fusionnées ; sinon, dis-le au chef avant tout.
Les réponses du chef aux questions O-1 à O-4 et P-1 à P-10 sont <à coller ici>.
Ensuite : crée etude/pla-06-mesure-d01 depuis origin/main dans ..\travaux-planner\pla-06-mesure-d01,
pose les questions qui restent, écris le plan de conception (docs/plan/modeles/conception.md)
dans docs/conception/plateforme/pla-06-mesure-d01.md et fais-le valider. Aucun code avant ce « validé ».
Fin de session : suivi.md (PLA-06 en cours), fiche dans docs/sessions/, prompt de reprise, jamais de git push.
```
