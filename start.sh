#!/usr/bin/env bash
# =============================================================================
#  HESTIM Planner — Script de démarrage complet
#  Usage : bash start.sh [--no-seed] [--dev]
#    --no-seed  : Ne pas exécuter le seed (données déjà présentes)
#    --dev      : Backend en mode nodemon (rechargement automatique)
# =============================================================================

set -euo pipefail

# ── Options ──────────────────────────────────────────────────────────────────
RUN_SEED=true
DEV_MODE=false

for arg in "$@"; do
    case $arg in
        --no-seed) RUN_SEED=false ;;
        --dev)     DEV_MODE=true  ;;
    esac
done

# ── Couleurs ─────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Variables ─────────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=5000
FRONTEND_PORT=5173
BACKEND_URL="http://localhost:${BACKEND_PORT}/health"
MAX_WAIT=45   # secondes max pour attendre le backend
BACKEND_PID=""
FRONTEND_PID=""

# ── Cleanup au Ctrl+C ─────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${YELLOW}${BOLD}⏹  Arrêt des services...${NC}"
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && echo -e "   ${CYAN}Backend arrêté  (PID $BACKEND_PID)${NC}"
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo -e "   ${CYAN}Frontend arrêté (PID $FRONTEND_PID)${NC}"
    echo -e "${GREEN}✓ Tous les services ont été arrêtés.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Vérification des dépendances ──────────────────────────────────────────────
check_deps() {
    local missing=()
    command -v node  >/dev/null 2>&1 || missing+=("node")
    command -v npm   >/dev/null 2>&1 || missing+=("npm")
    command -v curl  >/dev/null 2>&1 || missing+=("curl")
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}✗ Dépendances manquantes : ${missing[*]}${NC}"
        echo "  Installez-les puis relancez le script."
        exit 1
    fi
}

# ── Affichage du banner ───────────────────────────────────────────────────────
print_banner() {
    echo ""
    echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}${BOLD}║        HESTIM Planner — Démarrage            ║${NC}"
    echo -e "${BLUE}${BOLD}║   Projet PACTE • École d'Ingénierie HESTIM   ║${NC}"
    echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    $DEV_MODE  && echo -e "   Mode : ${CYAN}Développement (nodemon)${NC}"
    $DEV_MODE  || echo -e "   Mode : ${CYAN}Production (node)${NC}"
    $RUN_SEED  && echo -e "   Seed : ${GREEN}activé${NC}"
    $RUN_SEED  || echo -e "   Seed : ${YELLOW}désactivé (--no-seed)${NC}"
    echo ""
}

# ── Vérification des .env ─────────────────────────────────────────────────────
check_env() {
    if [ ! -f "$ROOT/backend/.env" ]; then
        echo -e "${YELLOW}⚠  Fichier backend/.env manquant.${NC}"
        if [ -f "$ROOT/backend/.env.example" ]; then
            echo -e "   Copie de .env.example → .env"
            cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
            echo -e "${GREEN}✓ backend/.env créé — pensez à configurer DB_USER, DB_PASSWORD, etc.${NC}"
        else
            echo -e "${RED}✗ Aucun .env.example trouvé. Créez backend/.env manuellement.${NC}"
            exit 1
        fi
    fi
}

# ── Installation des dépendances si node_modules absent ───────────────────────
install_deps() {
    if [ ! -d "$ROOT/backend/node_modules" ]; then
        echo -e "${YELLOW}[npm] Installation des dépendances backend...${NC}"
        (cd "$ROOT/backend" && npm install --silent)
        echo -e "${GREEN}✓ Backend : dépendances installées${NC}"
    fi
    if [ ! -d "$ROOT/frontend/node_modules" ]; then
        echo -e "${YELLOW}[npm] Installation des dépendances frontend...${NC}"
        (cd "$ROOT/frontend" && npm install --legacy-peer-deps --silent)
        echo -e "${GREEN}✓ Frontend : dépendances installées${NC}"
    fi
}

# ── Démarrage du backend ──────────────────────────────────────────────────────
start_backend() {
    echo -e "${BOLD}[1/4]${NC} Démarrage du backend sur le port ${CYAN}${BACKEND_PORT}${NC}..."
    cd "$ROOT/backend"

    if $DEV_MODE; then
        npx nodemon server.js > "$ROOT/backend.log" 2>&1 &
    else
        node server.js > "$ROOT/backend.log" 2>&1 &
    fi

    BACKEND_PID=$!
    echo -e "      PID : ${CYAN}${BACKEND_PID}${NC} • Logs → ${CYAN}backend.log${NC}"
}

# ── Attente que le backend soit prêt ─────────────────────────────────────────
wait_backend() {
    echo -e "${BOLD}[2/4]${NC} Attente du démarrage du serveur..."
    local waited=0
    printf "      "

    while ! curl -sf "$BACKEND_URL" > /dev/null 2>&1; do
        # Vérifier que le processus backend est toujours vivant
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo ""
            echo -e "${RED}✗ Le backend s'est arrêté de façon inattendue.${NC}"
            echo -e "  Consultez les logs : ${CYAN}cat backend.log${NC}"
            tail -20 "$ROOT/backend.log" 2>/dev/null
            exit 1
        fi

        if [ "$waited" -ge "$MAX_WAIT" ]; then
            echo ""
            echo -e "${RED}✗ Timeout : le backend n'a pas répondu après ${MAX_WAIT}s.${NC}"
            echo -e "  Consultez : ${CYAN}cat backend.log${NC}"
            tail -20 "$ROOT/backend.log" 2>/dev/null
            cleanup
            exit 1
        fi

        sleep 1
        waited=$((waited + 1))
        printf "·"
    done

    echo ""
    echo -e "      ${GREEN}✓ Backend prêt en ${waited}s${NC} — ${CYAN}http://localhost:${BACKEND_PORT}${NC}"
}

# ── Exécution du seed ─────────────────────────────────────────────────────────
run_seed() {
    if ! $RUN_SEED; then
        echo -e "${BOLD}[3/4]${NC} Seed ${YELLOW}ignoré${NC} (--no-seed)"
        return
    fi

    echo -e "${BOLD}[3/4]${NC} Exécution du seed..."
    cd "$ROOT/backend"

    if node seed.js >> "$ROOT/backend.log" 2>&1; then
        echo -e "      ${GREEN}✓ Seed terminé avec succès${NC}"
    else
        echo -e "      ${YELLOW}⚠  Seed a retourné une erreur (données déjà présentes ?)${NC}"
        echo -e "      Consultez : ${CYAN}cat backend.log${NC}"
    fi
}

# ── Démarrage du frontend ─────────────────────────────────────────────────────
start_frontend() {
    echo -e "${BOLD}[4/4]${NC} Démarrage du frontend sur le port ${CYAN}${FRONTEND_PORT}${NC}..."
    cd "$ROOT/frontend"
    npm run dev > "$ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo -e "      PID : ${CYAN}${FRONTEND_PID}${NC} • Logs → ${CYAN}frontend.log${NC}"

    # Attendre que Vite soit prêt (~3s max)
    local waited=0
    printf "      "
    while ! curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; do
        sleep 1
        waited=$((waited + 1))
        printf "·"
        [ "$waited" -ge 15 ] && break
    done
    echo ""
    echo -e "      ${GREEN}✓ Frontend prêt${NC} — ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
}

# ── Affichage final ────────────────────────────────────────────────────────────
print_ready() {
    echo ""
    echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║          ✓ Tous les services sont actifs     ║${NC}"
    echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}${BOLD}║${NC}  Backend   →  ${CYAN}http://localhost:${BACKEND_PORT}${NC}           ${GREEN}${BOLD}║${NC}"
    echo -e "${GREEN}${BOLD}║${NC}  Frontend  →  ${CYAN}http://localhost:${FRONTEND_PORT}${NC}           ${GREEN}${BOLD}║${NC}"
    echo -e "${GREEN}${BOLD}║${NC}  Logs      →  ${CYAN}backend.log / frontend.log${NC}    ${GREEN}${BOLD}║${NC}"
    echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}${BOLD}║${NC}             Ctrl+C pour tout arrêter         ${GREEN}${BOLD}║${NC}"
    echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
    echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
print_banner
check_deps
check_env
install_deps
start_backend
wait_backend
run_seed
start_frontend
print_ready

# Garder le script vivant — attendre que tous les jobs se terminent
wait
