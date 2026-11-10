# Session du 2026-11-10 · PLA-06 · `etude/pla-06-mesure-d01`

| | |
|---|---|
| Fait par | Claude Code (Opus 5.5) |
| Chantier | PLA (ouvert le 9 nov., ordre validé le 10) |
| Dossier de travail | `..\travaux-planner\pla-06-mesure-d01` (part de `doc/organisation-equipe`, en attendant les fusions) |
| Dernier commit | voir `git log -1 etude/pla-06-mesure-d01` |

## Objectif de la session

1. Lancer le chantier PLA et enregistrer les réponses du chef.
2. Écrire le plan de conception de PLA-06.
3. Sur demande du chef, **chercher les failles du plan et le corriger**.

**Pas de code** avant le « validé ».

## Plan

[docs/conception/plateforme/pla-06-mesure-d01.md](../conception/plateforme/pla-06-mesure-d01.md). Les propositions du 9 novembre sont validées. Les corrections de la revue (§ 12, C-1 à C-21) et les questions P-15 à P-18 attendent la validation.

## Fait

- Sur `doc/organisation-equipe` :
  - les réponses du chef (O-1 à O-4, P-1 à P-10) ;
  - le chantier QUA ouvert pour QUA-03 ;
  - la fusion de `doc/plan-modulaire`, où `main` a été fusionné : GitHub voyait un conflit qui n'existait pas.
- Sur cette branche :
  - le plan de PLA-06 (`5c00ae7`) ;
  - la fusion de `doc/organisation-equipe` ;
  - la **revue critique** et le plan corrigé.

## Vérifié (lecture du code de `a/essai-me3a`)

- Le parcours mesuré (connexion, `GET /api/emplois-du-temps/moi`) ne passe par aucun des 23 fichiers qui utilisent la connexion par défaut.
- L'étudiant ne voit rien d'un mois non publié. `deploy/vps/marquer-edt-publie.mjs` publie au vrai format.
- La limite de l'API est comptée par `user:<id>`, en mémoire. Les limites de connexion sont écrites en dur (20 et 30 par adresse, 10 par compte). `trust proxy` vaut 1.
- Le rappel d'appel passe chaque minute. Les autres tâches passent chaque heure ou chaque jour.
- Les autres services ont 3,2 Go de limites de mémoire (2,0 Go sans ClassQuiz).
- Le seed ne crée aucune séance.
- Aucun code écrit, aucun test lancé.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| P-4 | Caractéristiques du nouveau serveur | commandes données au chef (ci-dessous) | **résultats attendus** |
| P-11 à P-14 | voir le plan, § 3 | validées le 10 nov. | réglé |
| P-15 | S1 sur le besoin réel (C-1) | — | **en attente** |
| P-16 | Garder les ~680 étudiants du seed (C-6) | — | **en attente** |
| P-17 | 50 utilisateurs par école active, toutes les 30 s, puis rampe (C-13) | — | **en attente** |
| P-18 | Tâches périodiques lancées sur les 200 écoles (C-2) | — | **en attente** |

## Commandes de reconnaissance du serveur (P-4)

En lecture seule, à lancer par le chef sur le nouveau serveur. Seuls les chiffres sont reportés dans le dépôt : ni adresse, ni nom de machine.

```bash
nproc; lscpu | grep -E "Model name|^CPU\(s\)|Thread|MHz"
free -h; swapon --show
df -hT / /var/lib/docker 2>/dev/null; lsblk -d -o NAME,ROTA,SIZE,TYPE
docker version --format '{{.Server.Version}}'; docker compose version
docker info --format 'CPUs={{.NCPU}} Mem={{.MemTotal}} Driver={{.Driver}} Cgroup={{.CgroupVersion}}'
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'
docker inspect --format '{{.Name}} limite={{.HostConfig.Memory}} cpus={{.HostConfig.NanoCpus}}' $(docker ps -q)
docker run --rm debian:12-slim sh -c 'ulimit -n; ulimit -Hn'
uptime
```

## État laissé

- `docs/plan/suivi.md` : PLA-06 → en cours (plan revu, en attente de validation).
- Chantiers ouverts : EXP (5 fonctions restantes), PLA (7), QUA (1).

## Reste à faire, dans l'ordre

1. Le chef lance les commandes de P-4, en donne les chiffres, et répond à P-15 à P-18 (ou fait corriger le plan).
2. Le chef pousse, puis fusionne #162, #142, #156, #161 et #163.
3. Cette branche fusionne `origin/main`. Les réponses vont dans le § 3 du plan, la ligne « Validé » est remplie, et le tout est commité.
4. Étapes 3 à 8 du plan (§ 9).

## Commandes pour le chef de projet

```powershell
git -C "..\travaux-planner\plan-modulaire" push origin doc/plan-modulaire
git -C "..\travaux-planner\organisation" push origin doc/organisation-equipe
git -C "..\travaux-planner\pla-06-mesure-d01" push -u origin etude/pla-06-mesure-d01
gh pr create --draft --base main --head etude/pla-06-mesure-d01 --title "PLA-06 : mesure de D-01 (200 bases sur un serveur)" --fill
```

## Prompt de reprise

```text
Tu reprends PLA-06 (mesure de D-01 : 200 écoles, une base chacune, sur un serveur) du chantier PLA,
sur la branche etude/pla-06-mesure-d01, dans le dossier ..\travaux-planner\pla-06-mesure-d01.
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/organisation.md, docs/plan/suivi.md,
le plan docs/conception/plateforme/pla-06-mesure-d01.md (surtout § 3 et § 12) et cette fiche
(docs/sessions/2026-11-10-etude-pla-06-mesure-d01.md).
Vérifie avec gh pr list que #162, #142, #156, #161 et #163 sont fusionnées ; sinon, dis-le avant tout.
Chiffres du serveur (P-4) : <à coller ici, sans adresse ni nom de machine>.
Réponses à P-15 à P-18 et validation du plan : <à coller ici>.
Ensuite : fusionne origin/main dans la branche (pas de rebase), reporte les réponses dans le § 3,
remplis la ligne « Validé », commite, puis code les étapes 3 à 8 du § 9, une étape par commit.
Rien dans backend/ ni dans deploy/, aucun export ni secret dans le dépôt, rien sur le serveur de production.
Fin de session : suivi.md, fiche dans docs/sessions/, prompt de reprise, jamais de git push.
```
