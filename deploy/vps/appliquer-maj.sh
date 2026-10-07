#!/usr/bin/env bash
# Applique sur le serveur une mise à jour préparée par preparer-maj.sh. À lancer en root :
#   cd /root && tar -xzf maj8.tar.gz && bash maj8/deploy-vps/appliquer-maj.sh /root/maj8
# Étapes : sauvegarde des images actuelles (tag avant-<date>), superposition, recréation du backend
# puis du site, scripts .mjs mis à jour dans /opt/hestim/deploy/vps, contrôles.
# FinAdminTech n'est jamais touché (ni conteneurs, ni nginx). Aucune migration de base.
set -euo pipefail

PAQUET="$(cd "${1:?usage : appliquer-maj.sh <dossier extrait, par ex. /root/maj8>}" && pwd)"
HESTIM=/opt/hestim
DATE="$(date +%Y%m%d-%H%M%S)"
COMPOSE=(docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml)

echo "== Version du paquet"; cat "$PAQUET/VERSION"

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
EOF
