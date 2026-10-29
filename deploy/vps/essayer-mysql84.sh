#!/usr/bin/env bash
# Répétition du passage de MySQL 8.0 à 8.4 (lot ME-0e) sur une COPIE des données de production,
# sans arrêter ni modifier la production. À lancer en root sur le serveur, avant le vrai passage :
#   bash /opt/hestim/deploy/vps/essayer-mysql84.sh
#
# Ce que fait le script :
#   1. vérifie que chaque compte de la production peut se connecter en 8.4 : mysql_native_password
#      y est désactivé par défaut, un compte qui l'utilise serait refusé après le passage ;
#   2. exporte les bases de la production (export cohérent, sans verrou d'écriture) dans un
#      MySQL 8.0 jetable, avec le même mysql.cnf, sans réseau ;
#   3. relève l'empreinte de chaque table, arrête proprement ce MySQL 8.0, puis ouvre le même
#      dossier de données avec MySQL 8.4 : c'est la mise à niveau sur place du vrai passage ;
#   4. compare les empreintes, lit le journal de la mise à niveau, la mémoire utilisée, et
#      demande à Planner s'il lui reste des migrations à appliquer sur cette copie ;
#   5. supprime le conteneur et le volume jetables.
# Rien n'est écrit dans la production. Durée : quelques minutes. Code de sortie 0 si tout est bon.
set -euo pipefail

CONTENEUR_MYSQL="${CONTENEUR_MYSQL:-hestim_mysql}"
IMAGE_BACKEND="${IMAGE_BACKEND:-claude20022002/hestim-backend:latest}"
CNF="${CNF:-/opt/hestim/deploy/vps/mysql.cnf}"
AVANT="mysql:8.0"
APRES="mysql:8.4.13"
# Noms fixes de la copie jetable : jamais ceux de la production
ESSAI="essai_mysql84"
VOLUME="essai_mysql84_donnees"
MOT_DE_PASSE="$(openssl rand -hex 16)"

journal() { echo "$(date '+%F %T') $*"; }
ECHECS=0
echec() { journal "ÉCHEC : $*"; ECHECS=1; }
# prod <requête> : lecture seule dans la production
# shellcheck disable=SC2016  # les variables sont celles du conteneur
prod() { docker exec "$CONTENEUR_MYSQL" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -e "$1"' sh "$1"; }
essai() { docker exec -e MYSQL_PWD="$MOT_DE_PASSE" "$ESSAI" mysql -uroot -N -e "$1"; }
nettoyer() { docker rm -f "$ESSAI" >/dev/null 2>&1 || true; docker volume rm "$VOLUME" >/dev/null 2>&1 || true; }
trap nettoyer EXIT
attendre() {
    for _ in $(seq 120); do essai "SELECT 1" >/dev/null 2>&1 && return 0; sleep 2; done
    docker logs "$ESSAI" 2>&1 | tail -20
    return 1
}
lancer() {
    docker run -d --name "$ESSAI" --network none --memory 512m -v "$VOLUME:/var/lib/mysql" \
        -v "$CNF:/etc/mysql/conf.d/hestim.cnf:ro" -e MYSQL_ROOT_PASSWORD="$MOT_DE_PASSE" "$1" >/dev/null
    attendre || { echec "$1 ne démarre pas sur la copie"; exit 1; }
}
empreintes() {
    local tables
    tables="$(essai "SELECT CONCAT(table_schema, '.', table_name) FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('mysql', 'sys', 'information_schema', 'performance_schema') ORDER BY 1")"
    for t in $tables; do essai "CHECKSUM TABLE ${t%%.*}.\`${t#*.}\`"; done
}

[ -f "$CNF" ] || { journal "ÉCHEC : $CNF introuvable"; exit 1; }
nettoyer

# 1. Comptes de la production : aucun ne doit utiliser mysql_native_password
journal "comptes de la production :"
prod "SELECT CONCAT('  ', user, '@', host, ' : ', plugin) FROM mysql.user WHERE user NOT LIKE 'mysql.%'"
anciens="$(prod "SELECT COUNT(*) FROM mysql.user WHERE plugin = 'mysql_native_password' AND user NOT LIKE 'mysql.%'")"
[ "$anciens" = "0" ] || echec "$anciens compte(s) en mysql_native_password : les passer en caching_sha2_password avant le passage (DEPLOIEMENT.md)"

# 2. Copie des données dans un MySQL 8.0 jetable
journal "copie des bases de la production dans $AVANT (export cohérent, sans arrêt)"
lancer "$AVANT"
bases="$(prod "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('mysql', 'sys', 'information_schema', 'performance_schema')" | tr '\n' ' ')"
# shellcheck disable=SC2016
docker exec "$CONTENEUR_MYSQL" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --databases '"$bases" \
    | docker exec -i -e MYSQL_PWD="$MOT_DE_PASSE" "$ESSAI" mysql -uroot
journal "bases copiées : $bases"

# 3. Empreintes en 8.0, arrêt lent (purge complète avant de changer de version), puis 8.4
AVANT_EMPREINTES="$(empreintes)"
journal "$(echo "$AVANT_EMPREINTES" | wc -l) tables relevées en 8.0"
essai "SET GLOBAL innodb_fast_shutdown = 0"
docker stop -t 300 "$ESSAI" >/dev/null
docker rm "$ESSAI" >/dev/null
journal "même dossier de données ouvert par $APRES"
lancer "$APRES"

# 4. Contrôles
docker logs "$ESSAI" 2>&1 | grep -E "upgrade from .* completed" | sed 's/^/  /' || echec "la mise à niveau ne s'est pas signalée terminée"
if docker logs "$ESSAI" 2>&1 | grep -q "\[ERROR\]"; then
    echec "erreurs dans le journal de MySQL 8.4 :"
    docker logs "$ESSAI" 2>&1 | grep "\[ERROR\]" | head -10
fi
APRES_EMPREINTES="$(empreintes)"
if [ "$AVANT_EMPREINTES" = "$APRES_EMPREINTES" ]; then journal "empreintes identiques avant et après"; else echec "empreintes différentes"; diff <(echo "$AVANT_EMPREINTES") <(echo "$APRES_EMPREINTES") | head -20; fi
journal "mémoire de MySQL 8.4 sur la copie : $(docker stats --no-stream --format '{{.MemUsage}}' "$ESSAI")"
base_planner="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$CONTENEUR_MYSQL" | sed -n 's/^MYSQL_DATABASE=//p')"
if docker image inspect "$IMAGE_BACKEND" >/dev/null 2>&1; then
    attente="$(docker run --rm --network "container:$ESSAI" -e DB_HOST=127.0.0.1 -e DB_PORT=3306 -e DB_USER=root -e DB_PASSWORD="$MOT_DE_PASSE" -e DB_NAME="$base_planner" "$IMAGE_BACKEND" node migrations/cli.js pending 2>&1 | tail -3)"
    journal "migrations de Planner en attente sur la copie : $attente"
else
    journal "image $IMAGE_BACKEND absente : contrôle des migrations sauté"
fi

[ "$ECHECS" -eq 0 ] && journal "RÉPÉTITION RÉUSSIE : le passage à MySQL 8.4 peut être planifié (DEPLOIEMENT.md, « Passer à MySQL 8.4 »)"
exit "$ECHECS"
