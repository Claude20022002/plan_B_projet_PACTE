# Session du 2026-11-11 · MKT (agence) et diagramme d'architecture · `doc/diagramme-architecture`

| | |
|---|---|
| Fait par | directeur marketing, session principale de `..\planner-marketing` (Claude Opus 5.5) |
| Chantier | aucun chantier MKT ouvert (3 sur 3 : EXP, PLA, QUA) ; travail demandé directement par le chef de projet |
| Dossier de travail | `..\travaux-planner\diagramme-architecture` (ce dépôt) et `..\planner-marketing` (agence) |
| Dernier commit | voir `git log` de la branche |

## Objectif de la session

1. Prendre le contexte de Planner et de l'agence.
2. Trouver, vérifier et installer deux skills, `logo-design-skill` et `stack-diagram`.
3. Concevoir un logo pour Planner avec le premier.
4. Documenter l'architecture avec le second.

## Plan

**Logo** : brief validé par le chef le 11 novembre (`..\planner-marketing\marketing\brand\logo\00-brief.md`).

**Diagramme**, plan court validé le 11 novembre (« proposition validée ») :
- un diagramme d'architecture de Planner pour `docs/architecture/`, tiré de `docker-compose.yml`, `deploy/Caddyfile`, `frontend/nginx.conf` et `deploy/vps/sauvegarder.sh` ;
- aucune adresse, aucun nom d'hôte, aucun secret ;
- vérifié en regardant les rendus clair et sombre.

## Fait

Dans `..\planner-marketing`, sur `main`, en local :

| Commit | Contenu |
|---|---|
| `7c78d70` | les skills `logo-design` (kaankiziltug/logo-design-skill, `bbf31e5`, MIT) et `stack-diagram` (caru-ini/stack-diagram, `5af3b09`, MIT), relus avant installation. L'étape 7 de `stack-diagram` (galerie publique) est interdite |
| `52638cc` | brief du logo |
| `170d2cf` | réponses du chef L-1 à L-6 ; propositions L-3 (assemblage avec une école) et L-5 (pose dans le produit par UIX-01 et MOB-03) ; deux tours de pistes, avec la recommandation A « le volet » ; arrêt avant le kit |

Dans ce dépôt, sur `doc/diagramme-architecture` :
- `docs/architecture/vue-d-ensemble/` : source, page HTML autonome, PNG clair et sombre, notice ;
- renvoi en tête de `docs/architecture/README.md` (page d'octobre) ;
- ligne « Travaux en cours hors chantier » dans `suivi.md`.

## Vérifié

- **Diagramme** : rendus clair et sombre relus image par image. Aucune flèche ne traverse un texte (l'étiquette `/biblio` a été déplacée deux fois). Tous les logos sont visibles sur les deux fonds.
- **Faits du diagramme** : lus dans les fichiers cités. Les piles de ClassQuiz (FastAPI, SvelteKit) et de StudyLib (Laravel 13, PHP 8.3) ont été lues dans leurs dépôts voisins (`../ClassQuiz`, `../StudyLib`).
- **Données réelles** : aucune occurrence de « hestim » ni d'adresse IP dans les nouveaux fichiers. `scripts/verifier-neutre.mjs` ne contrôle que le code, il ne couvre donc pas ces fichiers.
- **Logo** : audit `svg_audit.py` à 100/100 pour les trois pistes. Essais de 16 à 256 px, inversé, flou, miroir, et test du rayon parmi 12 logos du secteur de l'éducation.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| 1 | Cible élargie aux écoles publiques (« toute structure de formation ») : à inscrire dans `docs/plan/decisions.md` ? | dit par le chef le 11 novembre ; inscription à faire par le chef, pas dans cette branche (une tâche par branche) | ouverte |
| 2 | Quel chantier pour l'agence (3 sur 3 ouverts) ? | proposition : chantier MKT limité à MKT-01 et MKT-02, avec une limite portée à 4 | ouverte |
| 3 | Premier commit complet de `..\planner-marketing` et dépôt privé (MKT-01) | proposition : tout sauf ce que `.gitignore` exclut ; dépôt créé et poussé par le chef | ouverte |
| 4 | Piste du logo : A, B ou C ? | recommandation : A « le volet » | ouverte |
| 5 | L-3 et L-5 (`01-assemblage-et-pose.md`) | propositions écrites | ouverte |

## État laissé

- `docs/plan/suivi.md` : ligne « Diagramme d'architecture » ajoutée dans les travaux hors chantier.
- Aucune fonction MKT ne change d'état : MKT-01 à MKT-07 restent « à faire ». Le logo prépare MKT-06.

## Reste à faire, dans l'ordre

1. Le chef relit le diagramme, puis pousse et ouvre la PR.
2. Le chef choisit la piste du logo et valide L-3 et L-5. L'agence prépare ensuite le kit, dans `marketing/brand/logo/kit/`.
3. Le chef ouvre un chantier pour l'agence, puis MKT-01.

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\diagramme-architecture" push -u origin doc/diagramme-architecture
gh pr create --base main --head doc/diagramme-architecture --title "Diagramme d'architecture : vue d'ensemble d'une installation" --fill
```

## Prompt de reprise

```text
Tu es le directeur marketing de Planner (session principale de ..\planner-marketing).
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/suivi.md et docs/plan/modules/MKT-marketing.md
du dépôt Planner (sur origin/main, le main local est en retard), puis cette fiche
(docs/sessions/2026-11-11-doc-diagramme-architecture.md, branche doc/diagramme-architecture).
Dans ..\planner-marketing, lis CLAUDE.md, marketing/brand/logo/00-brief.md,
01-assemblage-et-pose.md et 02-pistes.md.
Fait : skills logo-design et stack-diagram installés (commit 7c78d70) ; brief du logo validé ;
trois pistes en gris, A « le volet » recommandée, arrêt avant le kit (170d2cf) ;
diagramme d'architecture sur doc/diagramme-architecture.
Reste : choix de la piste par le chef, puis kit du logo (marketing/brand/logo/kit/) ;
validation de L-3 et L-5 ; chantier de l'agence et MKT-01 (premier commit complet, dépôt privé).
Questions en attente : 1 à 5 de la fiche.
Règles : rien avant validation du chef ; questions numérotées avec proposition ;
vente gelée, rien publié ; fiche de session et suivi.md à jour en fin de session ; jamais de git push.
```
