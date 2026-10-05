#!/bin/sh
# Génère /opt/hestim/.env.docker sur le serveur : tous les secrets sont tirés au hasard ici,
# ne transitent jamais ailleurs, et le fichier n'est lisible que par root.
# Ne remplace jamais un fichier existant (les bases sont chiffrées avec ces valeurs).
# Usage : sh deploy/vps/generer-env.sh planner.finadmintech.fr fichiers.finadmintech.fr quiz.finadmintech.fr
set -eu
SITE="$1"; FICHIERS="$2"; QUIZ="$3"
CIBLE="$(dirname "$0")/../../.env.docker"
[ -e "$CIBLE" ] && { echo "$CIBLE existe déjà : rien n'est modifié." >&2; exit 1; }

hex() { openssl rand -hex "${1:-32}"; }
# Clé RSA des jetons (PKCS#8), sur une ligne avec des \n littéraux comme l'attend le backend
JWT_KEY="$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null | awk 'BEGIN{ORS="\\n"} {print}')"

umask 077
cat > "$CIBLE" <<EOF
# Généré le $(date -u +%Y-%m-%dT%H:%MZ) par deploy/vps/generer-env.sh — secrets, ne pas copier ailleurs
DB_NAME=hestim_planner
DB_USER=hestim
DB_PASSWORD=$(hex 24)
DB_ROOT_PASSWORD=$(hex 24)
JWT_PRIVATE_KEY="$JWT_KEY"
CSRF_SECRET=$(hex)
INTEGRATION_TOKEN=$(hex)
SOLVER_TOKEN=$(hex)
SITE_ADDRESS=$SITE
FICHIERS_ADDRESS=$FICHIERS
QUIZ_ADDRESS=$QUIZ
STUDYLIB_APP_KEY=base64:$(openssl rand -base64 32)
STUDYLIB_DB_PASSWORD=$(hex 24)
REDIS_PASSWORD=$(hex 24)
MINIO_ROOT_USER=hestim$(hex 4)
MINIO_ROOT_PASSWORD=$(hex 24)
MEILI_MASTER_KEY=$(hex)
GOOGLE_DRIVE_KEY_DIR=/opt/hestim/secrets/google
QUIZ_SECRET_KEY=$(hex)
QUIZ_DB_PASSWORD=$(hex 24)
CLASSQUIZ_OIDC_CLIENT_SECRET=$(hex)
QUIZ_WEBHOOK_SECRET=$(hex)
OIDC_COOKIE_KEYS=$(hex)
VITE_API_URL=/api
EOF
mkdir -p /opt/hestim/secrets/google
chmod 700 /opt/hestim/secrets
echo "$CIBLE créé (lisible par root seulement)."
