# Session du 2026-11-11 · MKT-05 et MKT-09 · `mkt/mkt-05-kit-video`

| | |
|---|---|
| Fait par | Claude Code (Claude Opus 5.5) |
| Chantier | MKT, hors chantier : exception décidée par le chef le 11 novembre |
| Dossier de travail | `..\travaux-planner\mkt-05-kit-video` |
| Dernier commit | voir `git log` de la branche (commit de fin de session) |

## Objectif de la session

1. Retrouver le travail interrompu le matin (session VS Code `f221f726`, arrêtée à 11 h 40 par la limite des 5 heures) : l'étude « Outils scolaires et besoins par pays » et les questions de la vidéo.
2. Préparer le kit de la vidéo « problèmes et besoins » (montage fait par le chef sur un autre abonnement).
3. Faire, à partir de la présentation Direction de HESTIM, une présentation générale de Planner pour convaincre des chefs d'établissement.

## Plan

[docs/conception/marketing/mkt-05-kit-video-et-presentation.md](../conception/marketing/mkt-05-kit-video-et-presentation.md), validé par le chef le 11 novembre et commité seul (6aba7d9).

## Fait

- `30067f0` (branche `doc/inventaire-outils-formation`) : l'étude du matin, commitée telle quelle (rapport et neuf fichiers de notes, chacun avec ses « Lacunes »).
- `6aba7d9` : plan de conception.
- Commit de fin de session :
  - `kit-video-planner/Script problemes et besoins 1 min 30.md` : 13 scènes, voix off prête pour ElevenLabs, textes à l'écran, 6 illustrations et 11 captures (3 existent) ;
  - `kit-video-planner/Kit vidéo Planner.md` corrigé : public élargi, HESTIM retiré, prix retiré ;
  - `kit-video-planner/Presentation chefs d'etablissement.md` : texte des 14 pages ;
  - `decisions.md`, `suivi.md`, `03-propositions.md` (P-84 à P-91).
- Canva : copie `DAHanRcCaps` « Planner — Chefs d'établissement », 14 pages réécrites avec leurs notes d'orateur. Le logo et la planche du kit du logo sont en couverture, et une capture ORION remplace les écrans réels de HESTIM. La notification « HESTIM Planner » de la page 7 est masquée par un recadrage. Enregistrement dans Canva : seulement après l'accord du chef.

## Vérifié

- Chaque page Canva a été regardée sur sa miniature après modification. Chevauchements, faute de frappe et liste numérotée ont été corrigés.
- L'export mensuel des heures des vacataires existe dans le code (`backend/routes/suiviRoutes.js`, `/vacataires.csv`).
- Aucun test de code : la session n'a modifié que des documents.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| 1 | Est-ce le travail interrompu ? | oui : commiter l'étude et écrire le script | fait |
| 2 | Où faire la présentation ? | copie Canva | fait |
| 3 | Prix ? | packs sans montant, plus des modules seuls | fait |
| 4 | Citer HESTIM ? | anonymiser | fait |
| 5 | Durée de la vidéo ? | 1 min 30 | fait |
| 6 | Offre pilote ? | sans durée offerte | fait |
| 7 | Contact de la dernière page ? | — | à compléter par le chef |

## État laissé

- `docs/plan/suivi.md` : MKT-05 → en cours ; MKT-09 → gelé, avec l'exception du 11 novembre.
- Canva `DAHanRcCaps` : à enregistrer après l'accord du chef ; la page 5 contient encore l'ancienne vidéo.

## Reste à faire, dans l'ordre

1. Le chef enregistre la copie Canva (ou demande des corrections).
2. Faire les 8 captures manquantes sur l'environnement de démonstration ORION (liste dans le script, § 4).
3. Monter la vidéo, l'insérer à la page 5, compléter le contact à la page 14.
4. Vérifier la licence commerciale d'ElevenLabs avant toute diffusion.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\inventaire-outils-formation" push -u origin doc/inventaire-outils-formation
gh pr create --base main --head doc/inventaire-outils-formation --title "Étude : outils scolaires et besoins par pays" --fill
git -C "..\travaux-planner\mkt-05-kit-video" push -u origin mkt/mkt-05-kit-video
gh pr create --base main --head mkt/mkt-05-kit-video --title "MKT-05 et MKT-09 : kit vidéo « problèmes et besoins » et présentation aux chefs d'établissement" --fill
```

## Prompt de reprise

```text
Tu reprends MKT-05 (vidéo) et MKT-09 (présentation aux chefs d'établissement), exception hors chantier
du 11 novembre, sur la branche mkt/mkt-05-kit-video, dans le dossier ..\travaux-planner\mkt-05-kit-video.
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/suivi.md,
la conception docs/conception/marketing/mkt-05-kit-video-et-presentation.md
et cette fiche (docs/sessions/2026-11-11-mkt-mkt-05-kit-video.md).
Fait : étude du 11 nov. commitée (doc/inventaire-outils-formation, 30067f0) ; script de 1 min 30,
kit vidéo corrigé, texte de la présentation ; copie Canva DAHanRcCaps réécrite (14 pages).
Reste : enregistrement Canva selon l'accord du chef ; 8 captures ORION ; vidéo à insérer page 5 ;
contact page 14 ; licence ElevenLabs.
Questions en attente : le contact de la page 14.
Règles : aucun prix, HESTIM jamais nommé, le prévu présenté comme objectif ; questions avant toute
supposition ; fiche de session et suivi.md à jour en fin de session ; jamais de git push.
```
