#!/usr/bin/env bash
# Applique sur le serveur un paquet du moteur de quiz seul, préparé par
# « preparer-maj.sh <nom> --quiz-seul ». À lancer en root :
#   cd /root && tar -xzf quiz-correctif1.tar.gz && bash quiz-correctif1/deploy-vps/appliquer-quiz.sh /root/quiz-correctif1
# Étapes : étiquette avant-<date> sur l'image de l'API du quiz, superposition du code Python,
# redémarrage de l'API et de son worker, contrôles. Planner, la bibliothèque, le site du quiz et
# les bases ne sont pas touchés : le moteur n'applique aucune migration avec ce paquet.
# Les parties en cours sont coupées au redémarrage : à lancer hors des heures de cours.
set -euo pipefail

PAQUET="$(cd "${1:?usage : appliquer-quiz.sh <dossier extrait, par ex. /root/quiz-correctif1>}" && pwd)"
HESTIM=/opt/hestim
DATE="$(date +%Y%m%d-%H%M%S)"
IMAGE=claude20022002/hestim-classquiz-api
COMPOSE=(docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml)

[ -f "$PAQUET/Dockerfile.classquiz-api" ] || { echo "ce paquet ne contient pas le moteur de quiz" >&2; exit 1; }
# Un paquet complet se reconnaît à son backend : il passe par appliquer-maj.sh, qui sauvegarde la base
[ ! -f "$PAQUET/Dockerfile.backend" ] || { echo "paquet complet : l'appliquer avec appliquer-maj.sh" >&2; exit 1; }

echo "== Version du paquet"; cat "$PAQUET/VERSION"

echo "== Sauvegarde de l'image actuelle : :avant-$DATE"
docker tag "$IMAGE:latest" "$IMAGE:avant-$DATE"

echo "== Superposition"
docker build -q -t "$IMAGE:latest" -f "$PAQUET/Dockerfile.classquiz-api" "$PAQUET"

echo "== API du quiz et son worker"
cd "$HESTIM"
"${COMPOSE[@]}" up -d --no-deps quiz-api quiz-worker

code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
# L'API met quelques secondes à répondre : 401 sans session dit qu'elle est repartie
for _ in $(seq 1 20); do
    [ "$(code https://quiz.finadmintech.fr/api/v1/users/me)" = 401 ] && break
    sleep 3
done

echo "== Contrôles"
echo "API du quiz             : $(code https://quiz.finadmintech.fr/api/v1/users/me) (attendu : 401 sans session)"
echo "site du quiz            : $(code https://quiz.finadmintech.fr/) (attendu : 200)"
echo "site HESTIM             : $(code https://planner.finadmintech.fr/) (attendu : 200)"
# Correctif du 11 octobre 2026 : la route ne rend plus l'identifiant d'une partie. Sans partie
# ouverte, elle répond 404 dans les deux versions ; le vrai contrôle est la case de la recette
echo "identifiant d'une partie : $(code https://quiz.finadmintech.fr/api/v1/quiz/join/000000) (attendu : 404, aucune partie à ce code)"

cat <<EOF

Retour arrière si besoin :
  docker tag $IMAGE:avant-$DATE $IMAGE:latest
  cd $HESTIM && ${COMPOSE[*]} up -d --no-deps quiz-api quiz-worker
EOF
