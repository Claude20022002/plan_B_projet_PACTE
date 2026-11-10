# Session du 2026-11-10 · PLA-06 · `etude/pla-06-mesure-d01`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | PLA (ouvert le 9 nov., ordre validé le 10) |
| Dossier de travail | `..\travaux-planner\pla-06-mesure-d01` (part de `doc/organisation-equipe`, en attendant les fusions) |
| Dernier commit | voir `git log -1 etude/pla-06-mesure-d01` |

## Objectif de la session

Lancer le chantier PLA. Enregistrer les réponses du chef. Écrire le plan de conception de PLA-06 et le soumettre à validation. **Pas de code** avant ce « validé ».

## Plan

[docs/conception/plateforme/pla-06-mesure-d01.md](../conception/plateforme/pla-06-mesure-d01.md), **en attente de validation**.

## Fait

- Sur `doc/organisation-equipe`, commit « Réponses du chef de projet » :
  - organisation validée (O-1 à O-4) ;
  - chantier QUA ouvert, limité à QUA-03 : 3 chantiers sur 3 ;
  - ordre de PLA et réglages de la mesure inscrits dans `decisions.md`.
- Sur cette branche :
  - le plan de conception de PLA-06 ;
  - `suivi.md` : PLA-06 en cours ;
  - l'index des conceptions ;
  - cette fiche.

## Vérifié

- Lu :
  - l'essai #142 (`17-essai-contexte.md`, `migrateurPour`, résolveur, fabrique de test) ;
  - `config/db.js` et `server.js` ;
  - `deploy/vps/mysql.cnf` et `docker-compose.vps.yml` ;
  - `seed.js`.
- Constat : les réglages MySQL de l'ancien serveur (60 connexions, 400 tables en cache, 512 Mo) ne tiennent pas 200 bases sur le papier. La mesure dira de combien les relever.
- Aucun code écrit, aucun test lancé.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| P-1 à P-3, P-5 à P-10 | voir le plan, § 3 | propositions validées le 10 nov. | réglé |
| P-4 | Caractéristiques du nouveau serveur | — | **en attente** |
| P-4 bis | Sans P-4 : mesurer sous 4 Go et 8 Go | — | **en attente** |
| P-5 bis, P-5 ter | Base modèle tirée de `seed.js`, réduite à 300 étudiants ; séances recopiées par SQL | — | **en attente** |
| P-11 | Démarrage : mesurer la vérification des 200 bases et l'ouverture à la demande | — | **en attente** |
| P-12 | Pas de dépendance nouvelle pour la charge | — | **en attente** |
| P-13 | MySQL temporaire sur le nouveau serveur pendant EXP-02 | — | **en attente** |
| P-14 | Attendre la fusion de #142 (et des autres) avant de coder | — | **en attente** |

## État laissé

- `docs/plan/suivi.md` : PLA-06 → en cours (plan en attente de validation).
- Chantiers ouverts : EXP (5 fonctions restantes), PLA (7), QUA (1).

## Reste à faire, dans l'ordre

1. Le chef répond à P-4 à P-14 et valide le plan (ou le fait corriger).
2. Le chef pousse et fusionne : `fix/edt-dimanche-visible` (#162), #142, #156, #161, `doc/organisation-equipe` (#163).
3. La branche se replace sur `main` (`git rebase origin/main`) ; la ligne « Validé » est remplie et commitée.
4. Étapes 3 à 8 du plan (§ 9).

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\organisation" push origin doc/organisation-equipe
git -C "..\travaux-planner\pla-06-mesure-d01" push -u origin etude/pla-06-mesure-d01
gh pr create --draft --base main --head etude/pla-06-mesure-d01 --title "PLA-06 : mesure de D-01 (200 bases sur un serveur)" --fill
```

## Prompt de reprise

```text
Tu reprends PLA-06 (mesure de D-01 : 200 écoles, une base chacune, sur un serveur) du chantier PLA,
sur la branche etude/pla-06-mesure-d01, dans le dossier ..\travaux-planner\pla-06-mesure-d01.
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/organisation.md, docs/plan/suivi.md,
le plan docs/conception/plateforme/pla-06-mesure-d01.md et cette fiche
(docs/sessions/2026-11-10-etude-pla-06-mesure-d01.md).
Vérifie avec gh pr list que #162, #142, #156, #161 et #163 sont fusionnées ; sinon, dis-le avant tout.
Réponses du chef à P-4 à P-14 et validation du plan : <à coller ici>.
Ensuite : reporte les réponses dans le § 3 du plan, remplis la ligne « Validé », replace la branche
sur origin/main, commite, puis code les étapes 3 à 8 du § 9, une étape par commit.
Rien dans backend/, aucun export de base dans le dépôt, rien sur le serveur de production.
Fin de session : suivi.md, fiche dans docs/sessions/, prompt de reprise, jamais de git push.
```
