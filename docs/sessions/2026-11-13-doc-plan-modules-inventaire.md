# Session du 2026-11-13 · modules de l'inventaire · `doc/plan-modules-inventaire`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | aucun : tâche `doc/` hors chantier, accord du chef de projet le 13 nov. |
| Dossier de travail | `..\travaux-planner\plan-modules-inventaire` (part de `doc/inventaire-outils-formation`, #167, non fusionnée) |
| Dernier commit | voir `git log -1 doc/plan-modules-inventaire` |

## Objectif de la session

Reprendre le travail sans la partie marketing : ajouter au plan les modules proposés par l'inventaire du 11 novembre.

## Plan (court, tâche `doc/`, validé le 13 nov.)

Réponses du chef :
- **I-1** : les 12 modules entrent dans le plan.
- **Recoupements** : FIN-03, VSC-05 et COU-07 sont déplacées (RHP-01, ETA-02, STA-01), ainsi que le plafond de cumul de VSC-06 (dans RHP-02).
- **Étapes** :
  - COM, ETA et PAI à l'étape 4 ;
  - RHP, FOR, DOC et INS à l'étape 5 ;
  - « reporté » pour PIL, GRP, STA-02, SER, STK, ETA-03 et PAI-03.
- **Tailles** : provisoires, comme le reste du plan.
- **I-3** (seconde passe de recherche plus tard) et **I-5** (entretiens de VEN-02 avant FIN, COM et PAI) : acceptées.
- **Numérotation** : l'inventaire devient le fichier 06 ; le 05 reste au modèle économique (#169).

Documentation seule, aucun code.

## Fait

- Sur `doc/inventaire-outils-formation` (#167) : `docs/etude-marche/05-outils-structures-formation.md` renommé en `06-…`, liens mis à jour (`8dc7a87`).
- Sur cette branche :
  - **12 fichiers de module** dans `docs/plan/modules/` : COM, ETA, PAI, RHP, FOR, DOC, INS, PIL, GRP, STA, SER, STK. Leur section « Ce qui existe » a été vérifiée dans le code : `Notification`, `services/push.js`, `utils/sendEmail.js`, annonces, envoi de l'emploi du temps, `VisaSeance`, `Enseignant.statut`, appel par QR code, statistiques, `Campus` et `TrajetCampus`, branche `b/offres-stage`.
  - **Modules existants** :
    - FIN : FIN-03 retirée, renvois vers RHP, PAI et SER ;
    - VSC : VSC-05 retirée, VSC-06 sans le plafond de cumul, VSC-03 dépend de COM-01 ;
    - COU : COU-07 retirée ;
    - MOB : MOB-05 dépend de COM-01.
  - **`docs/plan/README.md`** : tableau des modules, étapes 4, 5 et libre, total d'environ 290 jours bruts (environ 53 ajoutés).
  - **`docs/plan/decisions.md`** : 5 décisions datées du 13 novembre ; Q-19 renvoie à ETA-02.
  - **`docs/plan/suivi.md`** : 29 lignes de fonctions ajoutées, 3 retirées ; VSC-06 passe de M + S à M ; deux lignes hors chantier mises à jour.
  - **`06-outils-structures-formation.md`** : réponses aux décisions I-1 à I-5.

## Vérifié

- `node scripts/verifier-neutre.mjs` : aucun nom d'école en dur.
- Liens Markdown de `docs/plan/` : 0 lien cassé (contrôle par script).
- Aucune mention de l'école pilote dans les nouveaux fichiers.
- Aucun code modifié : la CI n'est pas concernée.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| I-1 à I-5 | Décisions de l'inventaire | voir « Plan » | réglé le 13 nov. |
| Thème bleu | Le bleu comme couleur de Planner (règle N-4 du socle neutre) | — | **en attente** (avis donné le 11 nov.) |

## État laissé

- Chantiers ouverts inchangés : EXP, PLA, QUA (3 sur 3). Aucun des nouveaux modules n'est un chantier ouvert : il faudra en ouvrir un pour y travailler.
- **Conflits à prévoir à la fusion** :
  - `suivi.md` (tableau hors chantier) avec #166 ;
  - `decisions.md` avec #169 et avec la branche de PLA-06 (`7b195b6`, décision Ollama).

  Ce sont des lignes ajoutées dans les mêmes tableaux : il suffit de garder toutes les lignes.

## Reste à faire, dans l'ordre

1. Le chef pousse `doc/inventaire-outils-formation` (#167), puis cette branche, et ouvre la PR, qui part de #167.
2. Fusionner #167, puis cette PR (en gardant toutes les lignes en cas de conflit avec #166 et #169).
3. Plus tard : la seconde passe de recherche (I-3), et les entretiens de VEN-02 (I-5) avant FIN, COM et PAI.
4. Reprendre un chantier ouvert : PLA-06 (banc sur le PC Ubuntu), EXP ou QUA-03.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\inventaire-outils-formation" push origin doc/inventaire-outils-formation
git -C "..\travaux-planner\plan-modules-inventaire" push -u origin doc/plan-modules-inventaire
gh pr create --base doc/inventaire-outils-formation --head doc/plan-modules-inventaire --title "Plan : douze modules de l'inventaire (COM, ETA, PAI, RHP, FOR, DOC, INS, PIL, GRP, STA, SER, STK)" --fill
git -C "..\travaux-planner\pla-06-mesure-d01" push origin etude/pla-06-mesure-d01
```

La PR vise `doc/inventaire-outils-formation`. Quand #167 sera fusionnée, GitHub la redirigera vers `main`. On peut aussi viser `main` tout de suite (`--base main`) : elle montrera alors aussi les commits de #167.

## Prompt de reprise

```text
Tu reprends Planner après l'ajout au plan des douze modules de l'inventaire (tâche doc/ hors chantier,
branche doc/plan-modules-inventaire, partie de doc/inventaire-outils-formation, #167).
Lis AGENTS.md, docs/plan/README.md, docs/plan/suivi.md, docs/plan/decisions.md (décisions du 13 novembre)
et cette fiche (docs/sessions/2026-11-13-doc-plan-modules-inventaire.md).
Vérifie avec gh pr list si #167 et la PR de cette branche sont fusionnées ; sinon, dis-le au chef avant tout.
Les chantiers ouverts sont EXP, PLA, QUA : demande au chef quelle fonction prendre (PLA-06, EXP-01/02 ou QUA-03),
sans toucher au marketing. Pour un nouveau module (COM, ETA, PAI…), il faut d'abord que le chef ouvre son chantier.
Règles : questions avant toute supposition, plan validé avant le code, fiche de session et suivi.md en fin de session ;
jamais de git push.
```
