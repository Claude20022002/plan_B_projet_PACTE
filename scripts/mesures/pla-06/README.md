# Banc de mesure PLA-06 : 200 écoles, une base chacune

Ce banc mesure si un serveur tient **200 écoles avec une base MySQL chacune** (décision D-01). Le plan validé est [docs/conception/plateforme/pla-06-mesure-d01.md](../../../docs/conception/plateforme/pla-06-mesure-d01.md) ; le rapport ira dans `docs/conception/plateforme/19-mesure-d01.md`.

**Jamais sur le serveur de production.** Le banc ne change rien dans `backend/`, `shared/` ni `deploy/` : il les lit.

## Les deux machines (répartition provisoire, P-24)

| Machine | Rôle | Il lui faut |
|---|---|---|
| **PC du banc** (Ubuntu) | MySQL 8.4.13 et le serveur de banc, dans Docker ; `releves.mjs` | Docker Engine, Node 22, Git, `openssh-server`, environ 10 Go de disque |
| **PC de charge** (Windows) | `serie.mjs` et `charge.mjs` | Node 22, client SSH (fourni par Windows) |

Les adresses, les rôles et les limites se règlent dans `.local/machines.json`, jamais dans le code : changer de machine ne demande aucune modification. `.local/` et `resultats/` sont ignorés par Git ; **rien de ce qu'ils contiennent n'entre dans le dépôt**, qui est public.

## 1. Préparer le PC du banc (une fois)

```bash
git clone https://github.com/Claude20022002/Planner.git ~/Planner && cd ~/Planner
git switch etude/pla-06-mesure-d01
cd scripts/mesures/pla-06
df -h ~                                   # au moins 10 Go libres
node preparer.mjs initialiser             # .local/secrets.json et .local/mesure.env
C="docker compose -f docker-compose.mesure.yml --env-file .local/mesure.env"
$C --profile installer run --rm installer # dépendances du serveur, installées dans le conteneur
$C up -d mysql
$C run --rm --no-deps banc node /banc/preparer.mjs bases --ecoles 200
```

La dernière commande dure de l'ordre d'une heure. Elle mesure M5a (une base neuve), construit la base modèle, la copie en 200 bases, contrôle chacune et vérifie l'isolation. Le résultat est dans `resultats/preparation-….json` ; `controles_ok` doit valoir `true`.

**Pare-feu** : seul le PC de charge peut joindre le serveur de banc. MySQL n'écoute jamais sur le réseau.

```bash
sudo ufw allow from <adresse du PC de charge> to any port 5099 proto tcp
```

**Pendant les séries**, arrêtez le bureau graphique pour rendre sa mémoire (4 Go en tout sur le PC du banc) :

```bash
sudo systemctl isolate multi-user.target     # retour : sudo systemctl isolate graphical.target
```

## 2. Préparer le PC de charge (une fois)

```powershell
cd scripts\mesures\pla-06
New-Item -ItemType Directory -Force .local | Out-Null
Copy-Item machines.exemple.json .local\machines.json     # puis le remplir
# Clé SSH sans mot de passe vers le PC du banc (P-22)
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh <utilisateur>@<PC du banc> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
ssh -o BatchMode=yes <utilisateur>@<PC du banc> echo ok
```

Sans `banc.ssh` dans `machines.json`, `serie.mjs` affiche chaque commande à lancer à la main sur le PC du banc et attend Entrée.

## 3. Les séries

Une série dure de 30 à 45 minutes. Elle relance MySQL et le serveur de banc avec ses réglages, attend que le banc réponde (M4), lance les relevés, la charge (P-17), puis un repos de 15 minutes pour voir si les écoles inactives se libèrent (P-8, C-2). Les résultats reviennent ensuite sur le PC de charge.

```powershell
cd scripts\mesures\pla-06
node serie.mjs --nom prod-1g --reglage production --mysql-memoire 1g --innodb 512m
node serie.mjs --nom ajuste-1g --reglage ajuste --mysql-memoire 1g --innodb 512m
node serie.mjs --nom ajuste-2g-p1 --reglage ajuste --mysql-memoire 2g --innodb 1g --rampe --migrations
node serie.mjs --nom ajuste-2g-p2 --reglage ajuste --mysql-memoire 2g --innodb 1g --rampe
node serie.mjs --nom ajuste-2g-p3 --reglage ajuste --mysql-memoire 2g --innodb 1g --rampe
node serie.mjs --nom defaut-2g --reglage defaut --mysql-memoire 2g --innodb 1g
node serie.mjs --nom ajuste-2g-modeb --reglage ajuste --mysql-memoire 2g --innodb 1g --mode b
node serie.mjs --nom ajuste-2g-sans-taches --reglage ajuste --mysql-memoire 2g --innodb 1g --taches non
```

Le palier de 4 Go ne se fait que si celui de 2 Go échoue, et alors sur le PC Windows (P-24).

**Sous Windows** (Git Bash), préfixez les commandes `docker compose … run` par `MSYS_NO_PATHCONV=1`, sinon les chemins `/banc/…` sont réécrits. Le premier démarrage y est lent : 79 s pour 3 écoles le 10 novembre, à cause des fichiers montés depuis Windows. L'écart est à dire dans le rapport.

Options de la charge, transmises par `serie.mjs` : `--ecoles 20 --utilisateurs 50 --intervalle 30 --duree 600 --chauffe 120 --froides 10 --rampe`.

### Ce qui invalide une série

Le fichier `resultats/<série>/serie.json` le dit (`valide`, `raisons`) :
- une réponse 429 (une limite de requêtes a joué) ou 401 (jeton perdu) ;
- une école qui voit une autre base que la sienne ;
- un emploi du temps de la semaine vide (mois non publiés, C-4) ;
- le générateur de charge à plus de 90 % d'un cœur : c'est lui qui limite ;
- de la mémoire d'échange utilisée sur le PC du banc (C-26).

Le processeur saturé du PC du banc **n'invalide rien** : c'est ce que la montée en charge cherche.

## 4. Les résultats

| Fichier, dans `resultats/<série>/` | Contenu | Mesures |
|---|---|---|
| `serie.json` | réglages, santé au démarrage, validité | M4 |
| `charge.json` | réseau à vide, connexions, régime, écoles froides, rampe et capacité | M6, M4c |
| `releves.jsonl`, `releves-resume.json` | mémoire réelle des conteneurs, Node, connexions, tables, tâches, échange | M1, M2, M3, M7, M8 |
| `banc.log` | journal du serveur de banc (écoles libérées, erreurs) | M3 |
| `../<série>-migrations.json` | migration d'étude sur 200 bases, une à une puis 4 à la fois | M5b |
| `../preparation-….json` | base neuve, copies, taille des bases, contrôles | M5a, M7 |

Seuls les **résumés chiffrés** vont dans le rapport. Les fichiers bruts restent sur les machines.

## 5. Nettoyer

```bash
C="docker compose -f docker-compose.mesure.yml --env-file .local/mesure.env"
$C run --rm --no-deps banc node /banc/preparer.mjs nettoyer
$C down -v
rm -rf .local resultats
sudo ufw delete allow from <adresse du PC de charge> to any port 5099 proto tcp
sudo systemctl isolate graphical.target
```

## Tests des fonctions pures

```bash
node --test scripts/mesures/pla-06/tests/pur.test.mjs
```
