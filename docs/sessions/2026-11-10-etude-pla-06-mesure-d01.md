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
- **CI du 10 novembre** :
  - #162 a échoué aux parcours parce que la suite a démarré à 23 h 50 UTC. Le test « entre 23 h et minuit » prend la vraie heure du serveur (rappel d'appel affiché), et les données fixent « aujourd'hui » au démarrage, avant que la suite ne passe minuit. Le correctif n'est pas en cause : il suffit de relancer.
  - #161, #163 et #164 : faux conflit. Ces branches avaient deux ancêtres communs avec `main`, et GitHub n'en retient qu'un. `main` a été fusionné dans chacune.
  - `main` est vert avec #142 et #156.
  - Le dépôt s'appelle maintenant `Claude20022002/Planner` ; l'adresse du dépôt local a été mise à jour.

## Questions

| N° | Question | Réponse | État |
|---|---|---|---|
| P-4 | Caractéristiques du nouveau serveur | relevé le 10 nov. (plan, § 2) ; poste de mesure encore attendu | serveur réglé |
| P-19 | Ollama (4,7 Gio) | reportée par le chef le 10 nov. ; à trancher avant EXP-02 (Q-21) | reportée |
| P-20, P-21 | Mémoire d'échange, pics de n8n | — | **en attente** |
| P-11 à P-14 | voir le plan, § 3 | validées le 10 nov. | réglé |
| P-15 | S1 sur le besoin réel (C-1) | — | **en attente** |
| P-16 | Garder les ~680 étudiants du seed (C-6) | — | **en attente** |
| P-17 | 50 utilisateurs par école active, toutes les 30 s, puis rampe (C-13) | — | **en attente** |
| P-18 | Tâches périodiques lancées sur les 200 écoles (C-2) | — | **en attente** |

## Commandes de reconnaissance du serveur (P-4)

En lecture seule. Seuls les chiffres sont reportés dans le dépôt : ni adresse, ni nom de machine.

**Sur le serveur Debian**, et non dans PowerShell sur le poste : un premier essai, le 10 novembre, a tourné sur le poste Windows et n'a rien donné. Se connecter d'abord (`ssh <utilisateur>@<serveur>`), puis coller les lignes. Si `docker` répond « permission denied », préfixer les commandes `docker` par `sudo`.

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

**Sur le poste de mesure** (PowerShell, Docker Desktop **démarré**), pour P-3 et C-19 :

```powershell
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
"{0:N1} Go de mémoire" -f ((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
Get-PSDrive C | Select-Object @{n='Libre (Go)';e={[math]::Round($_.Free/1GB,1)}}
wsl --status; Get-Content "$env:USERPROFILE\.wslconfig" -ErrorAction SilentlyContinue
docker info --format 'CPUs={{.NCPU}} Mem={{.MemTotal}} Version={{.ServerVersion}}'
```

## État laissé

- `docs/plan/suivi.md` : PLA-06 → en cours (plan revu, en attente de validation).
- Chantiers ouverts : EXP (5 fonctions restantes), PLA (7), QUA (1).

## Reste à faire, dans l'ordre

1. Le chef lance les commandes de P-4, en donne les chiffres, et répond à P-15 à P-18 (ou fait corriger le plan).
2. Le chef pousse, puis fusionne #162, #142, #156, #161 et #163.
3. Cette branche fusionne `origin/main`. Les réponses vont dans le § 3 du plan, la ligne « Validé » est remplie, et le tout est commité.
4. Étapes 3 à 8 du plan (§ 9).
5. **Pour le chantier EXP** (EXP-01, EXP-02) : sur le nouveau serveur, le proxy de l'hôte est **Traefik** (conteneur de n8n), pas nginx ; aucune mémoire d'échange ; Ollama occupe 4,7 Gio sans limite (plan PLA-06, § 2 et C-22 à C-25).

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
