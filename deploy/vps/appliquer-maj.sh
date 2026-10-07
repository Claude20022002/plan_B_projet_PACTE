#!/usr/bin/env bash
# Applique sur le serveur une mise à jour préparée par preparer-maj.sh. À lancer en root :
#   cd /root && tar -xzf maj8.tar.gz && bash maj8/deploy-vps/appliquer-maj.sh /root/maj8
# Étapes : sauvegarde de la base (/root/sauvegardes) et des images actuelles (tag avant-<date>),
# superposition, recréation du backend (qui applique ses migrations) puis du site, scripts .mjs
# mis à jour dans /opt/hestim/deploy/vps, contrôles. FinAdminTech n'est jamais touché.
set -euo pipefail

PAQUET="$(cd "${1:?usage : appliquer-maj.sh <dossier extrait, par ex. /root/maj8>}" && pwd)"
HESTIM=/opt/hestim
DATE="$(date +%Y%m%d-%H%M%S)"
COMPOSE=(docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml)

echo "== Version du paquet"; cat "$PAQUET/VERSION"

echo "== Sauvegarde de la base (le backend applique ses migrations au démarrage)"
mkdir -p /root/sauvegardes && chmod 700 /root/sauvegardes
# Mot de passe lu dans le conteneur : jamais affiché ni passé en argument visible de l'hôte
docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' \
    | gzip > "/root/sauvegardes/hestim-$DATE.sql.gz"
chmod 600 "/root/sauvegardes/hestim-$DATE.sql.gz"
ls -lh "/root/sauvegardes/hestim-$DATE.sql.gz"

echo "== Sauvegarde des images actuelles : :avant-$DATE"
for s in backend frontend; do
    docker tag "claude20022002/hestim-$s:latest" "claude20022002/hestim-$s:avant-$DATE"
done

echo "== Superposition"
docker build -q -t claude20022002/hestim-backend:latest -f "$PAQUET/Dockerfile.backend" "$PAQUET"
docker build -q -t claude20022002/hestim-frontend:latest -f "$PAQUET/Dockerfile.frontend" "$PAQUET"

echo "== Scripts d'exploitation"
cp "$PAQUET"/deploy-vps/*.mjs "$PAQUET"/deploy-vps/appliquer-maj.sh "$HESTIM/deploy/vps/"

cd "$HESTIM"
attendre_sain() {
    for _ in $(seq 1 40); do
        [ "$(docker inspect -f '{{.State.Health.Status}}' "$1" 2>/dev/null)" = healthy ] && return 0
        sleep 3
    done
    echo "$1 n'est pas « healthy » après 2 minutes" >&2
    return 1
}

echo "== Backend"
"${COMPOSE[@]}" up -d --no-deps backend
attendre_sain hestim_backend
echo "== Site"
"${COMPOSE[@]}" up -d --no-deps frontend
attendre_sain hestim_frontend

echo "== Contrôles (attendu : 404, 400, 200, 200)"
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
echo "route inexistante : $(code https://planner.finadmintech.fr/api/route-inexistante)"
echo "login vide        : $(code -X POST -H 'Content-Type: application/json' -d '{}' https://planner.finadmintech.fr/api/auth/login)"
echo "site HESTIM       : $(code https://planner.finadmintech.fr/)"
echo "FinAdminTech      : $(code https://finadmintech.fr/)"

cat <<EOF

Retour arrière si besoin :
  docker tag claude20022002/hestim-backend:avant-$DATE claude20022002/hestim-backend:latest
  docker tag claude20022002/hestim-frontend:avant-$DATE claude20022002/hestim-frontend:latest
  cd $HESTIM && ${COMPOSE[*]} up -d --no-deps backend frontend
  (si une migration a été appliquée, restaurer aussi la base ; ses nouvelles tables restent, à supprimer avant de redéployer :)
  gunzip -c /root/sauvegardes/hestim-$DATE.sql.gz | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="\$MYSQL_ROOT_PASSWORD" mysql -uroot "\$MYSQL_DATABASE"'
EOF
