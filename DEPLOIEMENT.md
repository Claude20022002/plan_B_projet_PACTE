# Guide de déploiement — HESTIM Planner

Deux parties. La première décrit le **serveur de production** (le VPS de `planner.finadmintech.fr`) : mise à jour, changement de dépendances, retour arrière. La seconde, à partir de « Comparatif des plateformes », décrit l'hébergement gratuit d'origine (Railway et Vercel).

## Serveur de production : mise à jour et retour arrière

Toutes les commandes du serveur se lancent en `root`. Le chef de projet les lance lui-même. Les scripts sont dans `deploy/vps/` ; chacun explique son rôle dans son en-tête.

### Mettre à jour par paquet

Un paquet `majNN` ne contient que le code. Il se superpose aux images déjà en ligne.

1. **Sur le PC, construire le site depuis PowerShell** (Git Bash réécrirait `/api` en chemin Windows) :
   `cd frontend; $env:VITE_API_URL="/api"; npm run build`
2. **Préparer le paquet**, dans Git Bash, depuis la racine du dépôt : `bash deploy/vps/preparer-maj.sh majNN`. Ajouter `--classquiz` ou `--studylib` si le quiz ou la bibliothèque ont changé (leurs constructions préalables sont dans l'en-tête du script).
3. **Vérifier le fichier `VERSION` du paquet** : le commit attendu, et aucune ligne de fichier non commité, pour aucun des dépôts.
4. **Copier `deploy/vps/paquets/majNN.tar.gz` dans `/root`** du serveur, puis :
   `cd /root && tar -xzf majNN.tar.gz && bash majNN/deploy-vps/appliquer-maj.sh /root/majNN`
5. **Lire les contrôles** affichés à la fin, puis dérouler la recette (`docs/recette/scenarios-de-test.md`), en commençant par la section 0.

`appliquer-maj.sh` fait dans l'ordre : contrôle des dépendances, sauvegarde de la base dans `/root/sauvegardes`, étiquette `avant-<date>` sur les images en service, superposition, redémarrage du backend (qui applique ses migrations), puis du site, rechargement de l'aiguillage Caddy s'il a changé. Il affiche à la fin les commandes de retour arrière **avec la date du jour déjà remplie** : les copier avant de fermer le terminal.

### Corriger le moteur de quiz seul

Pour un correctif du moteur (le code Python de `../ClassQuiz`) qui ne doit pas attendre la prochaine mise à jour de Planner. Le paquet ne contient ni Planner, ni le site du quiz, ni migration : la base n'est pas touchée.

1. **Sur le PC**, dans Git Bash, depuis la racine du dépôt, le correctif étant commité dans `../ClassQuiz` :
   `bash deploy/vps/preparer-maj.sh quiz-correctifN --quiz-seul`
2. **Vérifier le fichier `VERSION`** affiché : le commit du quiz attendu, aucune ligne de fichier non commité.
3. **Copier `deploy/vps/paquets/quiz-correctifN.tar.gz` dans `/root`** du serveur, puis, hors des heures de cours (les parties en cours sont coupées) :
   `cd /root && tar -xzf quiz-correctifN.tar.gz && bash quiz-correctifN/deploy-vps/appliquer-quiz.sh /root/quiz-correctifN`
4. **Lire les contrôles**, copier la commande de retour arrière affichée, puis jouer une partie d'essai.

Si les dépendances Python du quiz (`Pipfile`) ont changé, ce paquet ne suffit pas : il faut une nouvelle image de l'API.

### Quand les dépendances changent

La superposition ne met pas à jour les modules npm du backend. Si `backend/package-lock.json` demande un module absent de l'image, `preparer-maj.sh` puis `appliquer-maj.sh` **s'arrêtent avec la liste des modules en cause**, avant d'avoir rien modifié. Il faut alors une nouvelle image.

1. **Sur le PC, reconstruire l'image**, depuis la racine du dépôt :
   `docker build -t claude20022002/hestim-backend:latest --build-context shared=./shared ./backend`
2. **L'enregistrer** : `docker save claude20022002/hestim-backend:latest | gzip > deploy/vps/paquets/hestim-backend-majNN.tar.gz`, puis la copier dans `/root` du serveur.
3. **Sur le serveur, garder l'ancienne image sous une étiquette à part, avant de charger la nouvelle** :
   `docker tag claude20022002/hestim-backend:latest claude20022002/hestim-backend:avant-image-majNN`
   Sans cela, l'étiquette `avant-<date>` posée ensuite par `appliquer-maj.sh` désignerait déjà la nouvelle image, et le retour arrière ne serait plus possible.
4. **Charger la nouvelle** : `gunzip -c /root/hestim-backend-majNN.tar.gz | docker load`
5. **Appliquer le paquet** comme d'habitude. Le contrôle des dépendances doit maintenant répondre « identiques à celles de l'image ».

### Revenir en arrière

Dans `/opt/hestim`, avec `COMPOSE` pour `docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml`, et `<date>` pour la date affichée par `appliquer-maj.sh`.

**Cas 1, le code seul** (aucune migration appliquée par la mise à jour) :

```bash
docker tag claude20022002/hestim-backend:avant-<date> claude20022002/hestim-backend:latest
docker tag claude20022002/hestim-frontend:avant-<date> claude20022002/hestim-frontend:latest
$COMPOSE up -d --no-deps backend frontend
```

Si une nouvelle image avait été chargée (« Quand les dépendances changent »), l'étiquette du backend à reprendre est `avant-image-majNN`, pas `avant-<date>`.

**Cas 2, la mise à jour a appliqué une migration.** L'ancien code ne connaît pas le nouveau schéma, et tout ce qui a été saisi depuis la mise à jour sera perdu : décider vite. Savoir si une migration a été appliquée : le journal du backend le dit à son démarrage (`docker logs hestim_backend | grep -i migration`).

```bash
# 1. Arrêter le backend : plus aucune écriture pendant la restauration
$COMPOSE stop backend
# 2. Mettre de côté l'état actuel, au cas où
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' | gzip > /root/sauvegardes/hestim-avant-retour.sql.gz
# 3. Repartir d'une base vide : les tables créées par la migration disparaissent avec elle
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "DROP DATABASE \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\`"'
# 4. Restaurer la sauvegarde faite par appliquer-maj.sh
gunzip -c /root/sauvegardes/hestim-<date>.sql.gz | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"'
# 5. Remettre les anciennes images (cas 1), ce qui redémarre le backend
```

Restaurer sans vider la base (sans l'étape 3) laisserait en place les tables de la migration : le paquet suivant échouerait en voulant les recréer.

**Le reste, seulement si le paquet le contenait :**

| Élément | Retour |
|---|---|
| Site du quiz | étiquette `avant-<date>` de `hestim-classquiz-frontend`, puis `$COMPOSE up -d --no-deps quiz-frontend` |
| Moteur du quiz | étiquette `avant-<date>` de `hestim-classquiz-api`, puis `$COMPOSE up -d --no-deps quiz-api quiz-worker` |
| Bibliothèque | étiquette `avant-<date>` de `hestim-studylib`, puis `$COMPOSE up -d --no-deps studylib studylib-queue studylib-scheduler` ; sa base : `/root/sauvegardes/studylib-<date>.sql.gz`, à restaurer comme au cas 2 |
| Aiguillage Caddy | `cp deploy/vps/Caddyfile.vps.avant-<date> deploy/vps/Caddyfile.vps` (toujours `cp`, jamais `mv`), puis `docker exec hestim_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile` |

**Après un retour arrière** : relancer les contrôles de la recette (section 0), et noter dans le journal du groupe A la date, le paquet et la raison.

### Sauvegarde quotidienne

`appliquer-maj.sh` ne sauvegarde la base qu'au moment d'une mise à jour, et sur le serveur lui-même. `deploy/vps/sauvegarder.sh` le fait chaque nuit et **sort les sauvegardes du serveur** : il exporte les bases MySQL (Planner et la bibliothèque) et la base du quiz, archive les fichiers (documents de la bibliothèque, dans le volume de MinIO, et images des quiz), chiffre le tout, l'envoie avec `rclone`, et garde 14 jours des deux côtés. Les fichiers sont lus par un conteneur jetable (`alpine:3.20`) qui monte les volumes en lecture seule, sans arrêter les services. Redis, les index de recherche et les certificats de Caddy ne sont pas sauvegardés : ils se reconstruisent seuls. Les archives de fichiers sont entières chaque nuit : surveiller leur taille dans le journal (`ok fichiers-bibliotheque-… (taille)`) ; si elle devient lourde, garder `FICHIERS=non` dans la tâche quotidienne et ajouter une seconde tâche hebdomadaire avec `FICHIERS=oui`.

**Mise en place, une fois, en `root` :**

1. Installer les deux outils : `apt install rclone gnupg`.
2. Déclarer la destination hors du serveur : `rclone config` (un autre serveur en SFTP, un stockage objet ou un Drive ; `rclone` connaît les trois). Noter le nom donné, par exemple `hors-site`.
3. Créer la paire de clés de chiffrement **sur le PC du chef de projet, jamais sur le serveur** (Git Bash, qui fournit `gpg`). Le serveur ne reçoit que la clé publique : il peut chiffrer, pas relire. Un intrus qui prend le serveur ne lit donc aucune sauvegarde (revue d'expert, fichier 16, B-1).

   ```bash
   gpg --quick-generate-key "Planner sauvegardes <sauvegardes@planner.invalid>" default default never
   # gpg demande une phrase de protection de la clé privée : la noter dans le coffre de mots de passe
   gpg --armor --export sauvegardes@planner.invalid > planner-sauvegardes.pub
   gpg --armor --export-secret-keys sauvegardes@planner.invalid > planner-sauvegardes-PRIVEE.asc
   scp planner-sauvegardes.pub root@<serveur>:/root/hestim-sauvegarde.pub
   ```

   **Ranger `planner-sauvegardes-PRIVEE.asc` hors ligne** (clé USB dans un lieu sûr, et une seconde copie ailleurs), avec sa phrase dans le coffre, puis l'effacer du PC s'il n'est pas lui-même sûr. Sans la clé privée, aucune sauvegarde ne se relit.
4. Écrire `/root/hestim-sauvegarde.conf` (`chmod 600`) :

   ```bash
   CLE_PUBLIQUE=/root/hestim-sauvegarde.pub
   DESTINATION=hors-site:hestim-sauvegardes
   ```

   Ancien mode, encore accepté : `PHRASE=/root/hestim-sauvegarde.cle` (phrase créée par `openssl rand -base64 48`), utilisé seulement sans `CLE_PUBLIQUE`. La phrase est alors sur le serveur : à éviter.

5. Lancer une première fois à la main et lire la sortie : `bash /opt/hestim/deploy/vps/sauvegarder.sh ; echo "code $?"`. Attendu : quatre lignes « ok » (`mysql`, `quiz`, `fichiers-bibliotheque`, `fichiers-quiz`), « envoyé vers … », code 0.
6. Programmer la tâche (`crontab -e`) :
   `15 2 * * * bash /opt/hestim/deploy/vps/sauvegarder.sh >> /var/log/hestim-sauvegarde.log 2>&1`
7. **Journaux binaires, toutes les 15 minutes** (`deploy/vps/sauvegarder-journaux.sh`, mêmes réglages). L'export de la nuit ne protège que jusqu'à 2 h 15 ; les journaux binaires de MySQL notent chaque écriture et permettent de revenir à n'importe quelle minute. Vérifier d'abord qu'ils sont actifs (c'est le réglage par défaut de MySQL 8.0, gardés 30 jours) : `docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -e "SELECT @@log_bin"'` doit répondre `1`. Lancer une fois à la main (`bash /opt/hestim/deploy/vps/sauvegarder-journaux.sh ; echo "code $?"`, attendu : « ok … journal(aux) chiffré(s) », code 0), puis ajouter la tâche :
   `*/15 * * * * bash /opt/hestim/deploy/vps/sauvegarder-journaux.sh >> /var/log/hestim-journaux.log 2>&1`
   Les journaux partent dans le sous-dossier `journaux` de la destination ; un passage sans écriture dans la base n'envoie rien.

**Destination Backblaze B2 (choisie le 24 octobre 2026, à titre provisoire).** Dans la console B2 :

1. *Buckets* → *Create a Bucket* : nom unique (par exemple `planner-sauvegardes-<suffixe>`), *Files* **Private**, *Default Encryption* **Enable**, *Object Lock* **Enable**, rétention par défaut **30 jours** en mode *Governance*. Un fichier verrouillé ne peut être ni effacé ni remplacé avant 30 jours, même avec la clé du serveur : un intrus ne peut pas détruire les sauvegardes déjà envoyées. Pour un compartiment déjà créé sans verrouillage, l'activer dans ses réglages si la console le propose, sinon créer un nouveau compartiment et changer `DESTINATION`.
2. *Lifecycle Settings* du compartiment → règle personnalisée sur tout le compartiment : cacher les fichiers **30 jours** après leur envoi, les effacer **7 jours** après. C'est B2 qui fait la rétention ; les 7 jours laissent le temps de voir un incident avant que les fichiers disparaissent.
3. *Application Keys* → *Add a New Application Key* : limitée à **ce compartiment**, accès *Read and Write*, puis retirer le droit d'effacer si la console le permet (capacités voulues : `listFiles`, `readFiles`, `writeFiles`, **sans `deleteFiles`**). Noter `keyID` et `applicationKey` : la clé ne s'affiche qu'une fois.

Sur le serveur, à l'étape 2 ci-dessus : `rclone config create b2-planner b2 account <keyID> key <applicationKey>`, puis `rclone lsd b2-planner:` (doit lister le compartiment). Dans `/root/hestim-sauvegarde.conf` :

```bash
CLE_PUBLIQUE=/root/hestim-sauvegarde.pub
DESTINATION=b2-planner:planner-sauvegardes-<suffixe>
JOURS=30
SUPPRESSION_DISTANTE=non
```

`SUPPRESSION_DISTANTE=non` est obligatoire avec le verrouillage d'objet : le script ne doit rien effacer à distance, B2 s'en charge. Avec une version du script antérieure à `SUPPRESSION_DISTANTE`, garder une clé qui peut effacer : sinon l'effacement des vieux fichiers échoue et le script rend le code 3.

**Passer de la phrase à la clé publique (serveur déjà en service).** Faire l'étape 3 ci-dessus sur le PC, ajouter `CLE_PUBLIQUE=/root/hestim-sauvegarde.pub` dans `/root/hestim-sauvegarde.conf`, lancer le script à la main : le journal doit dire « chiffrement pour la clé publique ». Les sauvegardes déjà envoyées restent chiffrées par l'ancienne phrase : vérifier que sa copie hors ligne existe, puis **retirer la phrase du serveur** (`shred -u /root/hestim-sauvegarde.cle` et la ligne `PHRASE` du fichier de réglages). Tant qu'elle y reste, un intrus peut relire les anciennes sauvegardes.

**Lire le résultat.** Code 0 : tout est fait. Code 1 : un export a échoué (le journal dit lequel). Code 3 : les sauvegardes sont faites mais **ne sont pas sorties du serveur**. Regarder `/var/log/hestim-sauvegarde.log` chaque semaine : une sauvegarde que personne ne regarde finit par ne plus se faire.

**Restaurer une sauvegarde chiffrée par la clé publique.** Le déchiffrement se fait **sur le PC qui détient la clé privée** (importée une fois par `gpg --import planner-sauvegardes-PRIVEE.asc`) ; la clé privée ne va jamais sur le serveur. Dans Git Bash, sur le PC :

```bash
# 1. Le serveur récupère le fichier chiffré, le PC le copie
ssh root@<serveur> "rclone copy b2-planner:planner-sauvegardes-<suffixe>/mysql-<date>.sql.gz.gpg /root/restauration/"
scp root@<serveur>:/root/restauration/mysql-<date>.sql.gz.gpg .

# 2. Le PC déchiffre et renvoie l'export compressé par SSH, sans fichier en clair sur le PC
gpg -d mysql-<date>.sql.gz.gpg | ssh root@<serveur> "cat > /root/restauration/mysql-<date>.sql.gz"

# 3. Le serveur restaure (bases MySQL : Planner et bibliothèque), puis efface l'export en clair
ssh root@<serveur> "gunzip -c /root/restauration/mysql-<date>.sql.gz | docker exec -i hestim_mysql sh -c 'MYSQL_PWD=\"\$MYSQL_ROOT_PASSWORD\" mysql -uroot' && shred -u /root/restauration/mysql-<date>.sql.gz"
```

La base du quiz se restaure de la même façon, avec `quiz-<date>` et la commande `psql` ci-dessous.

**Restaurer une sauvegarde de l'ancien mode (phrase).** Récupérer le fichier voulu (`rclone copy hors-site:hestim-sauvegardes/mysql-<date>.sql.gz.gpg /root/`), puis :

```bash
# Bases MySQL (Planner et bibliothèque). L'export recrée chaque base si elle manque.
gpg --batch --pinentry-mode loopback --passphrase-file /root/hestim-sauvegarde.cle -d /root/mysql-<date>.sql.gz.gpg \
  | gunzip | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot'

# Base du quiz, dans une base vide
gpg --batch --pinentry-mode loopback --passphrase-file /root/hestim-sauvegarde.cle -d /root/quiz-<date>.sql.gz.gpg \
  | gunzip | docker exec -i hestim_quiz_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q'
```

Sur un serveur neuf, ces commandes suffisent. **Sur un serveur qui a déjà ses bases, arrêter d'abord le backend, la bibliothèque et le quiz, puis vider chaque base à restaurer** (étapes 1 à 3 du cas 2 ci-dessus) : restaurer par-dessus laisserait en place les tables créées depuis la sauvegarde. L'export ne contient ni les comptes ni les réglages de MySQL : les mots de passe du serveur qui reçoit la restauration ne changent pas.

**Restaurer les fichiers.** L'archive de MinIO est son dossier de données tel quel : elle se restaure dans le même MinIO (l'image est fixée dans `docker-compose.yml`). Récupérer le fichier comme à l'étape 1 ci-dessus (`fichiers-bibliotheque-<date>.tar.gz.gpg`), puis, sur le PC, déchiffrer et envoyer directement dans le volume, services arrêtés :

```bash
gpg -d fichiers-bibliotheque-<date>.tar.gz.gpg | ssh root@<serveur> "docker stop hestim_studylib hestim_studylib_queue hestim_studylib_scheduler hestim_minio && docker run --rm -i --network none --volumes-from hestim_minio alpine:3.20 sh -c 'find /data -mindepth 1 -delete && tar -C /data -xzf -' && docker start hestim_minio hestim_studylib hestim_studylib_queue hestim_studylib_scheduler"
```

Les images des quiz se restaurent de la même façon avec `fichiers-quiz-<date>`, les conteneurs `hestim_quiz_api` et `hestim_quiz_worker`, et le dossier `/app/data` (`--volumes-from hestim_quiz_worker`). Restaurer les fichiers **et** la base de la même nuit : une base plus récente que ses fichiers pointe vers des documents absents.

**Revenir à une heure précise** (par exemple juste avant une erreur de manipulation à 10 h 14). On restaure l'export de la nuit, puis on rejoue les journaux binaires écrits depuis, en s'arrêtant à l'heure voulue. Essayé le 26 octobre sur un MySQL 8.0 jetable : les écritures d'avant l'heure limite reviennent, celles d'après non.

1. Restaurer l'export de la nuit comme ci-dessus, services arrêtés.
2. Lire dans cet export la position où il a été pris (MySQL 8.0 écrit `CHANGE MASTER TO MASTER_LOG_FILE=…`, MySQL 8.4 `CHANGE REPLICATION SOURCE TO SOURCE_LOG_FILE=…`) : `gpg -d mysql-<date>.sql.gz.gpg | gunzip | grep -m1 -E "CHANGE (MASTER|REPLICATION SOURCE) TO"`. Exemple : `MASTER_LOG_FILE='binlog.000042', MASTER_LOG_POS=868`.
3. Récupérer depuis `<destination>/journaux/` le journal noté et tous les suivants (`<identifiant du serveur>-binlog.000042.gz.gpg`, `…000043…`), les déchiffrer sur le PC et les envoyer, décompressés, dans `/root/restauration/journaux/` (même méthode qu'à l'étape 2 de la restauration : `gpg -d … | ssh root@<serveur> "gunzip > /root/restauration/journaux/binlog.000042"`).
4. Rejouer, avec `mysqlbinlog` de l'image `mysql:8.0-debian` (l'image `mysql:8.0` du serveur ne le contient pas) :

   ```bash
   ssh root@<serveur> "cd /root/restauration/journaux && docker run --rm --network none -v \"\$PWD\":/j:ro mysql:8.0-debian mysqlbinlog --start-position=868 --stop-datetime='2026-10-27 10:14:00' /j/binlog.000042 /j/binlog.000043 | docker exec -i hestim_mysql sh -c 'MYSQL_PWD=\"\$MYSQL_ROOT_PASSWORD\" mysql -uroot'"
   ```

   `--start-position` ne vaut que pour le premier journal de la liste ; `--stop-datetime` est l'heure du serveur. Puis effacer les journaux en clair (`shred -u /root/restauration/journaux/*`) et redémarrer les services.

Après le passage à MySQL 8.4 (lot ME-0e), remplacer `mysql:8.0-debian` par `percona/percona-server:8.4` dans la commande ci-dessus : elle fournit `mysqlbinlog` 8.4.11 (vérifié le 26 octobre), alors que l'image `mysql:8.4` ne le contient pas.

**Essai de restauration, chaque premier dimanche du mois** (environ 20 minutes, sans toucher à la production) :

1. Récupérer les sauvegardes de la nuit (`mysql-…` et `fichiers-bibliotheque-…`) comme à l'étape 1 ci-dessus, dans `/root/essai/`.
2. Restaurer la base dans un MySQL jetable, puis compter :

   ```bash
   ssh root@<serveur> "docker run -d --name essai_restauration --network none -e MYSQL_ROOT_PASSWORD=essai mysql:8.0"
   # attendre 30 s que MySQL démarre, puis, depuis le PC :
   gpg -d mysql-<date>.sql.gz.gpg | ssh root@<serveur> "gunzip | docker exec -i -e MYSQL_PWD=essai essai_restauration mysql -uroot"
   ssh root@<serveur> "docker exec -e MYSQL_PWD=essai essai_restauration mysql -uroot -N -e 'SHOW DATABASES'"
   ```

   Comparer le nombre de comptes (`SELECT COUNT(*) FROM <base de Planner>.Users`) avec la production : l'écart doit se limiter aux comptes créés depuis la nuit.
3. Lister l'archive des fichiers sur le PC (`gpg -d fichiers-bibliotheque-<date>.tar.gz.gpg | tar -tzf - | wc -l`) et comparer au volume (`ssh root@<serveur> "docker run --rm --volumes-from hestim_minio:ro alpine:3.20 find /data -type f | wc -l"`).
4. Nettoyer : `ssh root@<serveur> "docker rm -f essai_restauration && rm -rf /root/essai"`.
5. **Écrire le résultat** dans `docs/recette/essais-restauration.md` : date, fichiers utilisés, nombres comparés, durée, problème rencontré. Un essai non écrit n'a pas eu lieu.

### Faire de la place

Chaque mise à jour laisse une archive, un dossier extrait et des images `avant-<date>`. `nettoyer-paquets.sh` garde les 3 derniers. Sans option, il montre ce qu'il supprimerait ; il ne supprime qu'avec `--supprimer` :

```bash
bash /opt/hestim/deploy/vps/nettoyer-paquets.sh /root
bash /opt/hestim/deploy/vps/nettoyer-paquets.sh /root --supprimer
```

Il ne touche ni aux sauvegardes de la base (`/root/sauvegardes`), ni aux images `avant-image-majNN`, ni aux archives d'images. À ne lancer qu'une fois la mise à jour en cours validée par la recette : les paquets et images supprimés sont ceux qui permettraient un retour plus ancien.

### Passer à MySQL 8.4 (lot ME-0e)

MySQL 8.0 n'est plus suivi depuis avril 2026 ; 8.4 est la version suivie à long terme. Le passage est une **mise à niveau sur place** : MySQL 8.4 ouvre le dossier de données de 8.0 et le met à jour lui-même au premier démarrage. Il ne se défait pas sur place (8.4 ne redescend pas en 8.0) : le retour arrière passe par une copie du dossier faite juste avant.

Essayé le 26 octobre 2026 sur le PC : schéma de Planner et données de démonstration créés en 8.0.46, puis ouverts par 8.4.13 ; mise à niveau sans erreur, les 69 tables gardent la même empreinte (`CHECKSUM TABLE`), comptes en `caching_sha2_password` acceptés, aucune migration en attente, suite d'intégration complète verte (461 tests) ; mémoire au repos avec `mysql.cnf` : 157 Mo en 8.0, 139 à 182 Mo en 8.4 (limite du conteneur : 512 Mo).

**1. Répéter sur une copie des vraies données** (sans arrêt, rien n'est modifié), quelques jours avant :

```bash
bash /opt/hestim/deploy/vps/essayer-mysql84.sh ; echo "code $?"
```

Attendu : « RÉPÉTITION RÉUSSIE », code 0. Le script vérifie aussi qu'aucun compte n'utilise `mysql_native_password`, désactivé par défaut en 8.4. S'il en signale un : `ALTER USER '<nom>'@'<hôte>' IDENTIFIED WITH caching_sha2_password BY '<son mot de passe>';` avant le passage. Récupérer l'image à l'avance : `docker pull mysql:8.4.13`.

**2. Le passage**, dans la fenêtre du dimanche matin (environ 15 minutes d'arrêt), dans `/opt/hestim` avec `COMPOSE` comme plus haut :

```bash
# Une sauvegarde fraîche, sortie du serveur (code 0 attendu)
bash /opt/hestim/deploy/vps/sauvegarder.sh ; echo "code $?"
# Plus aucune écriture
$COMPOSE stop backend studylib studylib-queue studylib-scheduler
# Arrêt lent : InnoDB vide tout avant de changer de version
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "SET GLOBAL innodb_fast_shutdown = 0"'
$COMPOSE stop mysql
# Copie du dossier de données de 8.0, MySQL arrêté : c'est le retour arrière
VOL=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/mysql"}}{{.Name}}{{end}}{{end}}' hestim_mysql)
docker volume create hestim_mysql80_avant84
docker run --rm --network none -v "$VOL":/de:ro -v hestim_mysql80_avant84:/vers alpine:3.20 cp -a /de/. /vers/
```

Les paquets majNN ne livrent pas `docker-compose.yml` et `appliquer-maj.sh` ne relance jamais MySQL : l'image ne change qu'ici, à la main.

```bash
sed -i 's#^\( *image: \)mysql:8\.0$#\1mysql:8.4.13#' /opt/hestim/docker-compose.yml
grep -n 'image: mysql' /opt/hestim/docker-compose.yml   # une seule ligne, mysql:8.4.13
$COMPOSE up -d mysql
docker logs -f hestim_mysql    # attendre « Server upgrade from '80046' to '80413' completed » puis « ready for connections », Ctrl+C
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -e "SELECT VERSION()"'   # 8.4.13
$COMPOSE up -d backend studylib studylib-queue studylib-scheduler
```

Recette courte : connexion, emploi du temps d'un étudiant, un document de la Bibliothèque, puis `bash /opt/hestim/deploy/vps/sauvegarder.sh` (code 0). Garder le volume `hestim_mysql80_avant84` deux semaines, puis `docker volume rm hestim_mysql80_avant84`.

**Retour arrière** (tout ce qui a été saisi depuis le passage est perdu : décider vite) :

```bash
$COMPOSE stop backend studylib studylib-queue studylib-scheduler mysql
docker run --rm --network none -v hestim_mysql80_avant84:/de:ro -v "$VOL":/vers alpine:3.20 sh -c 'find /vers -mindepth 1 -delete && cp -a /de/. /vers/'
sed -i 's#^\( *image: \)mysql:8\.4\.13$#\1mysql:8.0#' /opt/hestim/docker-compose.yml
$COMPOSE up -d mysql
$COMPOSE up -d backend studylib studylib-queue studylib-scheduler
```

Pendant l'arrêt, la tâche `*/15` de `sauvegarder-journaux.sh` peut échouer une fois (MySQL arrêté) : sans effet, la sauvegarde fraîche du début couvre ce moment ; la lancer à la main après la recette. Après le passage, les journaux binaires continuent sans rupture (même identifiant de serveur, même suite de numéros), et l'essai de restauration du mois se fait dans un MySQL jetable `mysql:8.4.13` (un export de 8.4 ne se relit pas à coup sûr en 8.0). Pour les rejouer (« Revenir à une heure précise »), l'outil `mysqlbinlog` 8.4 vient de l'image `percona/percona-server:8.4` (8.4.11, vérifié le 26 octobre) : l'image `mysql:8.4` ne le contient pas.

### Supervision (lot ME-21)

Conception et diagrammes : `docs/plans/planner-multi-etablissements/conception-me21-supervision.md`. Une sonde hébergée (Better Stack ou UptimeRobot) interroge Planner depuis l'extérieur et prévient la personne d'astreinte par courriel et par notification sur le téléphone. Aucune donnée d'élève ne sort : la sonde ne lit que des codes HTTP et des mots-clés.

1. **Sur le serveur, une fois** : ajouter à `/opt/hestim/.env.docker` le jeton des mesures et le nom de l'école dans les journaux, puis recréer le conteneur du serveur de Planner (un simple redémarrage ne relit pas `.env.docker`) :
   ```bash
   echo "SUPERVISION_TOKEN=$(openssl rand -hex 32)" >> /opt/hestim/.env.docker
   echo "ETABLISSEMENT_NOM=hestim" >> /opt/hestim/.env.docker
   cd /opt/hestim && docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml up -d --no-deps --force-recreate backend
   ```
2. **Dans le service de sonde** : créer les moniteurs du tableau du § 3 de la conception (site, `/api/supervision/sante` en code 200, les mots-clés `"solveur":"ok"` et `"erreurs":"ok"`, la bibliothèque), à l'intervalle le plus court de l'offre ; les alertes vont au courriel et à l'application du service sur le téléphone d'astreinte (notifications autorisées la nuit).
3. **Battements des sauvegardes** : créer dans la sonde deux tâches attendues (sauvegarde de nuit chaque jour vers 02:15, journaux binaires toutes les 15 minutes), puis mettre leurs adresses dans `/root/hestim-sauvegarde.conf` (`BATTEMENT=…`, `BATTEMENT_JOURNAUX=…`). Lancer une fois `sauvegarder.sh` à la main et vérifier que la sonde a reçu le battement.
4. **Page d'état publique** : les moniteurs du site, de l'API et de la bibliothèque ; la maintenance du dimanche (06 h à 09 h) s'y annonce 48 heures avant.
5. **Essai de panne de nuit** (critère du lot), un dimanche dans la fenêtre de maintenance, **sans** la déclarer dans la sonde : noter l'heure, `docker pause hestim_backend`, attendre la notification sur le téléphone, `docker unpause hestim_backend`. L'alerte doit arriver en moins de 5 minutes ; noter le résultat dans `docs/recette/essais-supervision.md`.

Mesures à la demande (trafic, temps de réponse, erreurs, courriels en échec, générations, connexions MySQL), sur le serveur :
`docker exec hestim_backend sh -c 'wget -qO- --header "X-Supervision-Jeton: $SUPERVISION_TOKEN" http://localhost:5000/api/supervision/mesures'`

---

## Comparatif des plateformes

| Critère | Railway | Render | Fly.io |
|---|---|---|---|
| MySQL natif | ✅ plugin | ❌ (PostgreSQL only free) | ⚠️ via machine |
| Déploiement auto GitHub | ✅ sans config | ✅ | ❌ CLI requis |
| Free tier | $5/mois credit | Limité (sleep 15min) | 3 VMs partagées |
| Simplicité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| CB requise | Non (hobby) | Non | Oui |

**→ Recommandation : Railway (backend + DB) + Vercel (frontend)**

- **Railway** : héberge l'API Express et la base MySQL — auto-deploy sur push, panel visuel, logs intégrés.
- **Vercel** : héberge l'app React — CDN mondial, HTTPS automatique, zéro config.
- **Coût total** : 0 € dans les limites du free tier.

---

## Architecture cible

```
┌─────────────────────┐      HTTPS       ┌─────────────────────────┐
│   Vercel (frontend) │ ──────────────── │  Railway (backend API)  │
│   React + Vite SPA  │  /api/* → proxy  │  Node.js / Express      │
│   CDN mondial       │                  │  Port 5000              │
└─────────────────────┘                  └──────────┬──────────────┘
                                                    │ TCP 3306
                                         ┌──────────▼──────────────┐
                                         │  Railway MySQL Plugin   │
                                         │  MySQL 8.0              │
                                         └─────────────────────────┘
```

---

## Étape 1 — Préparer le backend pour Railway

### 1.1 Créer un compte Railway

1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Sélectionner **Hobby Plan** (gratuit, $5 de crédit/mois)

### 1.2 Créer le projet Railway

1. Cliquer **New Project**
2. Sélectionner **Deploy from GitHub repo**
3. Autoriser Railway à accéder au dépôt `plan_B_projet_PACTE`
4. Choisir le repo → Railway détecte automatiquement Node.js

### 1.3 Configurer le service backend

Dans les paramètres du service :

- **Root Directory** : `backend`
- **Build Command** : `npm install`
- **Start Command** : `node server.js`
- **Watch Paths** : `backend/**`

### 1.4 Ajouter le plugin MySQL

1. Dans le projet Railway, cliquer **+ New**
2. Sélectionner **Database → Add MySQL**
3. Railway crée automatiquement `MYSQL_URL`, `MYSQL_HOST`, `MYSQL_PORT`, etc.

### 1.5 Variables d'environnement du backend

Dans **Variables** du service backend, ajouter :

```env
NODE_ENV=production
PORT=5000

# Base de données — utiliser les valeurs auto-injectées par Railway MySQL
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DIALECT=mysql

# JWT — générer avec :
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=VOTRE_SECRET_FORT_ICI
JWT_EXPIRES_IN=7d

# CORS — sera l'URL Vercel (ajouter après le deploy frontend)
ALLOWED_ORIGINS=https://votre-app.vercel.app

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=VOTRE_APP_PASSWORD_GMAIL
EMAIL_FROM="HESTIM Planner <votre-email@gmail.com>"
```

### 1.6 Premier déploiement et seed

Railway déploie automatiquement sur push. Attendez le deploy vert, puis :

```bash
# Installer Railway CLI localement
npm install -g @railway/cli

# Se connecter
railway login

# Lancer le seed depuis votre machine locale
railway run --service backend node seed.js
```

**URL du backend Railway** : copiez l'URL publique (ex: `https://hestim-backend.up.railway.app`)

---

## Étape 2 — Déployer le frontend sur Vercel

### 2.1 Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer **Add New Project**

### 2.2 Importer le dépôt

1. Sélectionner le repo `plan_B_projet_PACTE`
2. Configurer :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### 2.3 Variable d'environnement Vercel

Dans **Environment Variables** du projet Vercel :

```env
VITE_API_URL=https://hestim-backend.up.railway.app/api
```

> Remplacer par l'URL réelle de votre service Railway.

### 2.4 Déployer

Cliquer **Deploy**. Vercel construit et publie en ~2 minutes.

**URL frontend** (ex: `https://hestim-planner.vercel.app`)

### 2.5 Mettre à jour CORS sur Railway

Retournez dans Railway → Variables du backend, mettez à jour :

```env
ALLOWED_ORIGINS=https://hestim-planner.vercel.app
```

Railway redéploie automatiquement.

---

## Étape 3 — Automatisation CI/CD avec GitHub Actions

Le fichier `.github/workflows/ci-cd.yml` est déjà créé. Il faut configurer les secrets GitHub.

### 3.1 Secrets GitHub requis

Dans votre repo GitHub → **Settings → Secrets → Actions → New repository secret** :

| Secret | Comment l'obtenir |
|---|---|
| `RAILWAY_TOKEN` | Railway Dashboard → Account → Tokens → Create Token |
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General → Project ID |

### 3.2 Fonctionnement du pipeline

```
Push sur main
    │
    ├── Job 1 : Build frontend (npm run build)
    │         └── Upload artifact du dist
    │
    ├── Job 2 : Tests backend (Jest + MySQL de test)
    │
    └── Si les deux passent :
        ├── Job 3 : Deploy backend → Railway (railway up)
        └── Job 4 : Deploy frontend → Vercel (vercel --prod)
```

### 3.3 Visualiser les déploiements

- **GitHub** : onglet **Actions** du repo
- **Railway** : onglet **Deployments** du service
- **Vercel** : onglet **Deployments** du projet

---

## Étape 4 — Domaine personnalisé (optionnel)

### Vercel (frontend)
1. Vercel Project → Settings → Domains
2. Ajouter `planner.hestim.ma`
3. Configurer le CNAME chez votre registrar :
   ```
   planner  CNAME  cname.vercel-dns.com
   ```

### Railway (backend)
1. Railway Service → Settings → Networking → Custom Domain
2. Ajouter `api.hestim.ma`
3. CNAME :
   ```
   api  CNAME  <votre-service>.up.railway.app
   ```

---

## Limites du free tier

| Service | Limite | Dépassement |
|---|---|---|
| Railway | $5/mois de compute | ~500h backend, suffisant pour démo |
| Railway MySQL | 1 Go de données | Suffisant pour des centaines d'utilisateurs |
| Vercel | 100 GB bandwidth/mois | Très largement suffisant |
| Vercel | Builds illimités | — |

> Pour un usage production intensif, Railway Starter = $20/mois.

---

## Commandes utiles

```bash
# Déploiement manuel du backend
cd backend && railway up

# Logs en temps réel
railway logs --service backend

# Ouvrir le dashboard Railway
railway open

# Seed de la base Railway
railway run node seed.js

# Variables d'environnement Railway
railway variables

# Déploiement manuel Vercel
cd frontend && vercel --prod
```

---

## Checklist avant le premier déploiement

- [ ] `JWT_SECRET` généré (64+ caractères aléatoires)
- [ ] `SMTP_PASSWORD` configuré (Google App Password)
- [ ] Plugin MySQL ajouté sur Railway
- [ ] `ALLOWED_ORIGINS` contient l'URL Vercel exacte
- [ ] `VITE_API_URL` contient l'URL Railway exacte
- [ ] Seed lancé après le premier déploiement
- [ ] Secrets GitHub Actions configurés (si CI/CD activé)
- [ ] Mots de passe de démonstration remplacés (`deploy/vps/mots-de-passe-demo.mjs`), puis contrôle : `deploy/vps/verifier-mots-de-passe-demo.mjs` se termine par « OK »
- [ ] Test de connexion admin avec le mot de passe écrit par ce script (plus jamais `password123`)

---

*Guide rédigé pour HESTIM Planner — Mai 2026*
