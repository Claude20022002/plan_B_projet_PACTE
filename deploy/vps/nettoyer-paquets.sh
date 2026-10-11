#!/usr/bin/env bash
# Ne garde que les derniers paquets de mise à jour (lot A-9) : les archives majNN.tar.gz, leurs
# dossiers extraits, et les images de retour arrière « avant-<date> » qui s'accumulent à chaque
# appliquer-maj.sh. Les sauvegardes de la base (/root/sauvegardes) ne sont jamais touchées.
#
# Sans option, le script montre seulement ce qu'il supprimerait. Avec --supprimer, il supprime.
#   Sur le serveur (root) : bash /opt/hestim/deploy/vps/nettoyer-paquets.sh /root [--supprimer]
#   Sur le PC             : bash deploy/vps/nettoyer-paquets.sh deploy/vps/paquets [--supprimer]
# GARDER=5 change le nombre de paquets et d'images gardés (3 par défaut, jamais moins de 1).
set -euo pipefail

DOSSIER="${1:?usage : nettoyer-paquets.sh <dossier des paquets> [--supprimer]}"
SUPPRIMER="${2:-}"
GARDER="${GARDER:-3}"
[[ "$GARDER" =~ ^[1-9][0-9]*$ ]] || { echo "GARDER doit être un entier d'au moins 1" >&2; exit 1; }
[ -d "$DOSSIER" ] || { echo "dossier introuvable : $DOSSIER" >&2; exit 1; }
[ -z "$SUPPRIMER" ] || [ "$SUPPRIMER" = "--supprimer" ] || { echo "option inconnue : $SUPPRIMER" >&2; exit 1; }

retirer() {
    if [ "$SUPPRIMER" = "--supprimer" ]; then
        "$@"
    else
        echo "  (à blanc) $*"
    fi
}

# Numéros des paquets présents (archive ou dossier extrait), du plus récent au plus ancien
mapfile -t NUMEROS < <(
    for chemin in "$DOSSIER"/maj*; do
        nom="$(basename "$chemin" .tar.gz)"
        [[ "$nom" =~ ^maj([0-9]+)$ ]] && echo "${BASH_REMATCH[1]}"
    done | sort -rnu
)
echo "== Paquets dans $DOSSIER : ${#NUMEROS[@]} ; gardés : les $GARDER derniers"
for numero in "${NUMEROS[@]:$GARDER}"; do
    [ -f "$DOSSIER/maj$numero.tar.gz" ] && retirer rm -f "$DOSSIER/maj$numero.tar.gz"
    [ -d "$DOSSIER/maj$numero" ] && retirer rm -rf "$DOSSIER/maj$numero"
done

# Images de retour arrière : par dépôt, on garde les GARDER dates les plus récentes
if command -v docker >/dev/null 2>&1; then
    echo "== Images « avant-<date> »"
    mapfile -t DEPOTS < <(docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^claude20022002/hestim-[a-z-]+:avant-[0-9]{8}-[0-9]{6}$' | cut -d: -f1 | sort -u)
    for depot in "${DEPOTS[@]}"; do
        mapfile -t ETIQUETTES < <(docker images --format '{{.Tag}}' "$depot" | grep -E '^avant-[0-9]{8}-[0-9]{6}$' | sort -r)
        for etiquette in "${ETIQUETTES[@]:$GARDER}"; do
            retirer docker rmi "$depot:$etiquette"
        done
    done
fi
[ "$SUPPRIMER" = "--supprimer" ] || echo "Rien n'a été supprimé. Relancer avec --supprimer pour le faire."
