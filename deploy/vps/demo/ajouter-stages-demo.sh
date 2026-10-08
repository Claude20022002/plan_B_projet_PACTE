#!/usr/bin/env bash
# Ajoute dans StudyLib les retours de stage de démonstration (texte et photo de ce dossier).
# Sans effet si un retour existe déjà. À lancer en root sur le serveur, après la mise à jour :
#   bash /opt/hestim/deploy/vps/demo/ajouter-stages-demo.sh
set -euo pipefail

DEMO="$(cd "$(dirname "$0")" && pwd)"
CONTENEUR=hestim_studylib

docker exec "$CONTENEUR" mkdir -p /tmp/demo-stages
docker cp "$DEMO/stage-cybel.txt" "$CONTENEUR:/tmp/demo-stages/stage-cybel.txt"
docker cp "$DEMO/stage-cybel.jpg" "$CONTENEUR:/tmp/demo-stages/stage-cybel.jpg"

# Retour de Claudia LUSAMOTE KIMFUTA (accord donné), stage Cybel au FabLab
docker exec "$CONTENEUR" php artisan studylib:add-internship-review \
    --company="HESTIM FabLab" \
    --city=Casablanca \
    --sector=Robotique \
    --position="Stage en robotique : reconstruction du système robotique Cybel" \
    --description-file=/tmp/demo-stages/stage-cybel.txt \
    --rating=4 \
    --year-done=2026 \
    --year-level=3 \
    --filiere=IIIA \
    --photo=/tmp/demo-stages/stage-cybel.jpg \
    --consent

docker exec "$CONTENEUR" rm -rf /tmp/demo-stages
