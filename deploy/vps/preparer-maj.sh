#!/usr/bin/env bash
# Prépare sur le PC une mise à jour « par superposition » du backend et du site déjà en ligne :
# FROM l'image actuelle + COPY du code (quelques Mo à envoyer au lieu de toute l'image).
# Valable tant que les dépendances (package*.json) n'ont pas changé ; sinon reconstruire l'image.
#
# Avant : construire le site depuis PowerShell (Git Bash réécrit « /api » en chemin Windows) :
#   cd frontend; $env:VITE_API_URL="/api"; npm run build
# Puis, depuis la racine du dépôt, dans Git Bash :
#   bash deploy/vps/preparer-maj.sh maj8
# Résultat : deploy/vps/paquets/maj8.tar.gz (ignoré par git), à appliquer avec appliquer-maj.sh.
set -euo pipefail

NOM="${1:?usage : preparer-maj.sh <nom, par ex. maj8>}"
RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
SORTIE="$RACINE/deploy/vps/paquets"
TRAVAIL="$SORTIE/$NOM"

cd "$RACINE"
[ -f frontend/dist/index.html ] || { echo "frontend/dist absent : construire le site d'abord" >&2; exit 1; }
if grep -rlq "Program Files" frontend/dist; then
    echo "frontend/dist contient « Program Files » : build lancé depuis Git Bash, à refaire depuis PowerShell" >&2
    exit 1
fi

rm -rf "$TRAVAIL" "$SORTIE/$NOM.tar.gz"
mkdir -p "$TRAVAIL/backend" "$TRAVAIL/shared" "$TRAVAIL/site"

# Code du backend, sans dépendances, secrets ni tests (mêmes exclusions que backend/.dockerignore)
tar -C backend -cf - \
    --exclude=node_modules --exclude='.env' --exclude='.env.*' --exclude='*.log' \
    --exclude=tests --exclude=.impeccable --exclude='storage' . | tar -C "$TRAVAIL/backend" -xf -
tar -C shared -cf - --exclude=node_modules . | tar -C "$TRAVAIL/shared" -xf -
cp -r frontend/dist "$TRAVAIL/site/dist"
cp frontend/nginx.conf "$TRAVAIL/site/nginx.conf"
# Scripts d'exploitation à jour (renommage, mots de passe de démonstration…)
mkdir -p "$TRAVAIL/deploy-vps"
cp deploy/vps/*.mjs deploy/vps/appliquer-maj.sh "$TRAVAIL/deploy-vps/"

cat > "$TRAVAIL/Dockerfile.backend" <<'EOF'
FROM claude20022002/hestim-backend:latest
COPY --chown=hestim:hestim backend/ /app/
COPY --chown=hestim:hestim shared/ /shared/
EOF

cat > "$TRAVAIL/Dockerfile.frontend" <<'EOF'
FROM claude20022002/hestim-frontend:latest
RUN rm -rf /usr/share/nginx/html/*
COPY site/dist/ /usr/share/nginx/html/
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html
EOF

git rev-parse --short HEAD > "$TRAVAIL/VERSION"
git status --porcelain >> "$TRAVAIL/VERSION"

tar -C "$SORTIE" -czf "$SORTIE/$NOM.tar.gz" "$NOM"
rm -rf "$TRAVAIL"
ls -lh "$SORTIE/$NOM.tar.gz"
