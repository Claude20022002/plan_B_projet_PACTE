#!/usr/bin/env bash
# Prépare sur le PC une mise à jour « par superposition » du backend et du site déjà en ligne :
# FROM l'image actuelle + COPY du code (quelques Mo à envoyer au lieu de toute l'image).
# Valable tant que les dépendances (package*.json) n'ont pas changé ; sinon reconstruire l'image :
# le script s'arrête de lui-même dans ce cas (verifier-dependances.mjs).
#
# Avant : construire le site depuis PowerShell (Git Bash réécrit « /api » en chemin Windows) :
#   cd frontend; $env:VITE_API_URL="/api"; npm run build
# Puis, depuis la racine du dépôt, dans Git Bash :
#   bash deploy/vps/preparer-maj.sh maj8
# Résultat : deploy/vps/paquets/maj8.tar.gz (ignoré par git), à appliquer avec appliquer-maj.sh.
#
# Option --classquiz : ajoute ClassQuiz (fork ../ClassQuiz, thème HESTIM) : le code Python de l'API
# et du worker, et le site, construit avant :
#   cd ../ClassQuiz/frontend && rm -rf build && NODE_ENV=production npx vite build
# Option --studylib : ajoute StudyLib (../StudyLib : app, routes, database, resources, config,
# bootstrap/app.php et providers.php, et le CSS/JS
# compilé public/build), construit avant : cd ../StudyLib && npm run build. Sans changement de
# dépendances Composer ni npm (sinon reconstruire l'image).
# Option --quiz-seul : un paquet qui ne contient que le code Python du moteur de quiz (API et
# worker), pour corriger le moteur sans livrer Planner. Rien à construire avant. Seule, sans autre
# option ; le paquet s'applique avec appliquer-quiz.sh, pas avec appliquer-maj.sh :
#   bash deploy/vps/preparer-maj.sh quiz-correctif1 --quiz-seul
set -euo pipefail

NOM="${1:?usage : preparer-maj.sh <nom, par ex. maj8> [--classquiz] [--studylib] | <nom> --quiz-seul}"
AVEC_CLASSQUIZ=""
AVEC_STUDYLIB=""
QUIZ_SEUL=""
for option in "${@:2}"; do
    case "$option" in
        --classquiz) AVEC_CLASSQUIZ="--classquiz" ;;
        --studylib) AVEC_STUDYLIB="--studylib" ;;
        --quiz-seul) QUIZ_SEUL="--quiz-seul" ;;
        *) echo "option inconnue : $option" >&2; exit 1 ;;
    esac
done
if [ -n "$QUIZ_SEUL" ] && [ -n "$AVEC_CLASSQUIZ$AVEC_STUDYLIB" ]; then
    echo "--quiz-seul s'emploie seule : un paquet complet se prépare avec --classquiz" >&2
    exit 1
fi
RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
SORTIE="$RACINE/deploy/vps/paquets"
TRAVAIL="$SORTIE/$NOM"

cd "$RACINE"

# Code Python de l'API du quiz (et du worker), superposé à l'image en ligne : sans changement de
# dépendances (Pipfile), sinon reconstruire l'image
api_du_quiz() {
    [ -d "$RACINE/../ClassQuiz/classquiz" ] || { echo "ClassQuiz introuvable : $RACINE/../ClassQuiz" >&2; exit 1; }
    mkdir -p "$TRAVAIL/classquiz-api"
    tar -C "$RACINE/../ClassQuiz" -cf - --exclude=__pycache__ --exclude=tests classquiz | tar -C "$TRAVAIL/classquiz-api" -xf -
    cat > "$TRAVAIL/Dockerfile.classquiz-api" <<'EOF'
FROM claude20022002/hestim-classquiz-api:latest
COPY classquiz-api/classquiz/ /app/classquiz/
EOF
}

# Les lignes qui suivent le commit sont les fichiers non commités : un paquet propre n'en a aucune
version_du_quiz() {
    echo "ClassQuiz : $(git -C "$RACINE/../ClassQuiz" rev-parse --short HEAD)" >> "$TRAVAIL/VERSION"
    git -C "$RACINE/../ClassQuiz" status --porcelain >> "$TRAVAIL/VERSION"
}

if [ -n "$QUIZ_SEUL" ]; then
    rm -rf "$TRAVAIL" "$SORTIE/$NOM.tar.gz"
    mkdir -p "$TRAVAIL/deploy-vps"
    api_du_quiz
    cp deploy/vps/appliquer-quiz.sh "$TRAVAIL/deploy-vps/"
    echo "moteur de quiz seul (Planner $(git rev-parse --short HEAD), non livré)" > "$TRAVAIL/VERSION"
    version_du_quiz
    tar -C "$SORTIE" -czf "$SORTIE/$NOM.tar.gz" "$NOM"
    rm -rf "$TRAVAIL"
    ls -lh "$SORTIE/$NOM.tar.gz"
    exit 0
fi

[ -f frontend/dist/index.html ] || { echo "frontend/dist absent : construire le site d'abord" >&2; exit 1; }
if grep -rlq "Program Files" frontend/dist; then
    echo "frontend/dist contient « Program Files » : build lancé depuis Git Bash, à refaire depuis PowerShell" >&2
    exit 1
fi

# Paquets npm du backend mis à jour pour un correctif de sécurité, sans changement de dépendances
# (même arbre) : superposés dans /app/node_modules au lieu de reconstruire l'image.
MODULES_SUPERPOSES=(proxy-addr)

# Dépendances du backend (lot R-3) : la superposition ne les met pas à jour. Premier contrôle, contre
# l'image du PC ; appliquer-maj.sh refait le même contre l'image réellement en ligne, qui fait foi.
IMAGE_BACKEND=claude20022002/hestim-backend:latest
if docker image inspect "$IMAGE_BACKEND" >/dev/null 2>&1; then
    INSTALLE="$(mktemp)"
    MSYS_NO_PATHCONV=1 docker run --rm --entrypoint cat "$IMAGE_BACKEND" /app/node_modules/.package-lock.json > "$INSTALLE"
    if ! node deploy/vps/verifier-dependances.mjs backend/package-lock.json "$INSTALLE" "${MODULES_SUPERPOSES[@]}"; then
        rm -f "$INSTALLE"
        echo "Paquet non préparé." >&2
        exit 1
    fi
    rm -f "$INSTALLE"
else
    echo "ATTENTION : image $IMAGE_BACKEND absente de ce PC, dépendances non contrôlées ici (elles le seront sur le serveur)" >&2
fi

rm -rf "$TRAVAIL" "$SORTIE/$NOM.tar.gz"
mkdir -p "$TRAVAIL/backend" "$TRAVAIL/shared" "$TRAVAIL/site"

# Code du backend, sans dépendances, secrets ni tests (mêmes exclusions que backend/.dockerignore)
tar -C backend -cf - \
    --exclude=node_modules --exclude='.env' --exclude='.env.*' --exclude='*.log' \
    --exclude=tests --exclude=.impeccable --exclude='storage' . | tar -C "$TRAVAIL/backend" -xf -
tar -C shared -cf - --exclude=node_modules . | tar -C "$TRAVAIL/shared" -xf -
for module in "${MODULES_SUPERPOSES[@]}"; do
    mkdir -p "$TRAVAIL/backend/node_modules"
    cp -r "backend/node_modules/$module" "$TRAVAIL/backend/node_modules/$module"
done
cp -r frontend/dist "$TRAVAIL/site/dist"
cp frontend/nginx.conf "$TRAVAIL/site/nginx.conf"
# Scripts d'exploitation à jour (renommage, mots de passe de démonstration…)
mkdir -p "$TRAVAIL/deploy-vps"
cp deploy/vps/*.mjs deploy/vps/appliquer-maj.sh deploy/vps/appliquer-quiz.sh deploy/vps/nettoyer-paquets.sh deploy/vps/sauvegarder.sh "$TRAVAIL/deploy-vps/"
# Aiguillage interne : appliqué seulement s'il a changé (relais /socket.io/ du lot CQ-1)
cp deploy/vps/Caddyfile.vps "$TRAVAIL/deploy-vps/"
# Contenus de démonstration (retours de stage et leurs photos)
[ -d deploy/vps/demo ] && cp -r deploy/vps/demo "$TRAVAIL/deploy-vps/demo"

if [ "$AVEC_STUDYLIB" = "--studylib" ]; then
    SL="$RACINE/../StudyLib"
    [ -f "$SL/artisan" ] || { echo "StudyLib introuvable : $SL" >&2; exit 1; }
    [ -f "$SL/public/build/manifest.json" ] || { echo "StudyLib non construit : cd ../StudyLib && npm run build" >&2; exit 1; }
    mkdir -p "$TRAVAIL/studylib"
    # config/ et bootstrap/ aussi : réglages (config/planner.php) et intergiciels (bootstrap/app.php)
    # en font partie ; bootstrap/cache reste celui de l'image
    for dossier in app routes database resources config bootstrap/app.php bootstrap/providers.php public/build; do
        tar -C "$SL" -cf - "$dossier" | tar -C "$TRAVAIL/studylib" -xf -
    done
    # Nouvelles classes : l'image charge les classes par une carte figée (classmap-authoritative)
    cat > "$TRAVAIL/Dockerfile.studylib" <<'EOF'
FROM claude20022002/hestim-studylib:latest
COPY --chown=www-data:www-data studylib/app/ /var/www/html/app/
COPY --chown=www-data:www-data studylib/routes/ /var/www/html/routes/
COPY --chown=www-data:www-data studylib/database/ /var/www/html/database/
COPY --chown=www-data:www-data studylib/resources/ /var/www/html/resources/
COPY --chown=www-data:www-data studylib/config/ /var/www/html/config/
COPY --chown=www-data:www-data studylib/bootstrap/app.php studylib/bootstrap/providers.php /var/www/html/bootstrap/
COPY --chown=www-data:www-data studylib/public/build/ /var/www/html/public/build/
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative --working-dir=/var/www/html
EOF
fi

if [ "$AVEC_CLASSQUIZ" = "--classquiz" ]; then
    CQ="$RACINE/../ClassQuiz/frontend/build"
    [ -f "$CQ/index.js" ] || { echo "ClassQuiz non construit : $CQ/index.js absent" >&2; exit 1; }
    mkdir -p "$TRAVAIL/classquiz/build"
    # Sans les cartes de sources (.map) : inutiles en production, et 4 fois plus lourdes
    tar -C "$CQ" -cf - --exclude='*.map' . | tar -C "$TRAVAIL/classquiz/build" -xf -
    # Le site Node de SvelteKit (adapter-node) est autonome : on remplace son dossier de construction
    cat > "$TRAVAIL/Dockerfile.classquiz" <<'EOF'
FROM claude20022002/hestim-classquiz-frontend:latest
USER root
RUN rm -rf /app/client /app/server /app/prerendered /app/index.js /app/handler.js /app/env.js /app/shims.js
COPY classquiz/build/ /app/
RUN chown -R node:node /app
USER node
EOF
    api_du_quiz
fi

cat > "$TRAVAIL/Dockerfile.backend" <<'EOF'
FROM claude20022002/hestim-backend:latest
COPY --chown=hestim:hestim backend/ /app/
COPY --chown=hestim:hestim shared/ /shared/
# Base des fuseaux à jour (Maroc à UTC+0 depuis le 20 septembre 2026), voir backend/tzdata/LISEZMOI.md
ENV ICU_TIMEZONE_FILES_DIR=/app/tzdata
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
if [ "$AVEC_STUDYLIB" = "--studylib" ]; then
    echo "StudyLib : $(git -C "$RACINE/../StudyLib" rev-parse --short HEAD)" >> "$TRAVAIL/VERSION"
    git -C "$RACINE/../StudyLib" status --porcelain >> "$TRAVAIL/VERSION"
fi
if [ "$AVEC_CLASSQUIZ" = "--classquiz" ]; then
    version_du_quiz
fi

tar -C "$SORTIE" -czf "$SORTIE/$NOM.tar.gz" "$NOM"
rm -rf "$TRAVAIL"
ls -lh "$SORTIE/$NOM.tar.gz"
