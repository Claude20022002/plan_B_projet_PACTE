#!/usr/bin/env bash
# Tests de deployer.sh (lot ME-0b) sur un faux Docker : vérification des versions, refus avant tout
# changement, mise en place des images, historique et retour. Lancé par la CI (job « Scripts
# d'exploitation ») et en local : bash deploy/vps/tests/tester-deployer.sh
set -uo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAC="$(mktemp -d)"
trap 'rm -rf "$BAC"' EXIT
COMPLET=0123456789abcdef0123456789abcdef01234567
COURT=0123456

# Faux docker : « pull » échoue pour les images de FAUX_ABSENTES ; « image inspect -f » rend
# FAUX_REVISION (étiquette revision) ou FAUX_SOURCE_<nom> (étiquette planner.source) ; chaque
# appel est noté dans $BAC/docker.log
mkdir -p "$BAC/bin"
cat > "$BAC/bin/docker" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$BAC/docker.log"
case "$1 $2" in
    "pull -q") [[ " ${FAUX_ABSENTES:-} " == *" $3 "* ]] && exit 1; exit 0 ;;
    "image inspect")
        [ "$3" = "-f" ] || exit 0
        image="$5"
        case "$4" in
            *revision*) echo "${FAUX_REVISION:-<no value>}" ;;
            *planner.source*) [[ "$image" == *":latest" ]] && echo "${FAUX_SOURCE_ACTUELLE:-<no value>}" || echo "${FAUX_SOURCE_NOUVELLE:-<no value>}" ;;
        esac ;;
    *) exit 0 ;;
esac
EOF
chmod +x "$BAC/bin/docker"
export PATH="$BAC/bin:$PATH" BAC

export REGISTRE=registre.test HESTIM="$BAC/hestim"
# shellcheck source-path=SCRIPTDIR/.. source=deployer.sh
. "$ICI/../deployer.sh"
# deployer.sh pose « set -Eeuo pipefail » : les tests gardent la main sur les échecs attendus,
# et rejouent principal dans un sous-shell avec ses vraies options
set +eE
en_vrai() { ( set -Eeuo pipefail; principal "$@" ); }

echecs=0
verifier() { # verifier "<nom>" <commande…> : la commande doit réussir
    local nom="$1"; shift
    if "$@" >/dev/null 2>&1; then echo "ok      $nom"; else echo "ÉCHEC   $nom"; echecs=$((echecs + 1)); fi
}
refuser() { # refuser "<nom>" <commande…> : la commande doit échouer
    local nom="$1"; shift
    if "$@" >/dev/null 2>&1; then echo "ÉCHEC   $nom (acceptée)"; echecs=$((echecs + 1)); else echo "ok      $nom"; fi
}
egal() { [ "$1" = "$2" ]; }

# Format du commit demandé
verifier "commit court accepté" commit_valide "$COURT"
verifier "commit complet accepté" commit_valide "$COMPLET"
refuser "8 caractères refusés" commit_valide 01234567
refuser "majuscules refusées" commit_valide 0123ABC
refuser "commande glissée refusée" commit_valide "0123456;rm"
refuser "vide refusé" commit_valide ""

# Images tirées et vérifiées
export FAUX_REVISION="$COMPLET"
verifier "les quatre images du bon commit : acceptées" egal "$(tirer_et_verifier "$COURT")" "$COMPLET"
FAUX_ABSENTES="registre.test/hestim-solver:$COURT" refuser "une image absente : arrêt" tirer_et_verifier "$COURT"
FAUX_REVISION=fedcba9876543210fedcba9876543210fedcba98 refuser "image d'un autre commit : arrêt" tirer_et_verifier "$COURT"
FAUX_REVISION="<no value>" refuser "image sans étiquette de commit : arrêt" tirer_et_verifier "$COURT"
FAUX_REVISION="$COURT" refuser "étiquette de commit tronquée : arrêt" tirer_et_verifier "$COURT"

# Aucun changement avant la vérification : un essai et un refus ne font ni tag ni compose
: > "$BAC/docker.log"
FAUX_REVISION=fedcba9876543210fedcba9876543210fedcba98 en_vrai "$COURT" >/dev/null 2>&1
refuser "refus : aucun tag ni redémarrage" grep -qE "^(tag|compose|exec|create)" "$BAC/docker.log"
: > "$BAC/docker.log"
en_vrai --essai "$COURT" >/dev/null 2>&1
refuser "essai : aucun tag ni redémarrage" grep -qE "^(tag|compose|exec|create)" "$BAC/docker.log"

# Mise en place : ancienne image gardée, nouvelle au nom local ; solveur gardé si ses sources n'ont pas changé
: > "$BAC/docker.log"
FAUX_SOURCE_ACTUELLE=arbre1 FAUX_SOURCE_NOUVELLE=arbre1 mettre_en_place "$COURT" 20261029-120000 >/dev/null
verifier "serveur : ancienne image gardée" grep -q "^tag claude20022002/hestim-backend:latest claude20022002/hestim-backend:avant-20261029-120000$" "$BAC/docker.log"
verifier "serveur : nouvelle image en place" grep -q "^tag registre.test/hestim-backend:$COURT claude20022002/hestim-backend:latest$" "$BAC/docker.log"
refuser "solveur inchangé : pas remplacé" grep -q "^tag registre.test/hestim-solver" "$BAC/docker.log"
: > "$BAC/docker.log"
FAUX_SOURCE_ACTUELLE=arbre1 FAUX_SOURCE_NOUVELLE=arbre2 mettre_en_place "$COURT" 20261029-120000 >/dev/null
verifier "solveur modifié : remplacé" grep -q "^tag registre.test/hestim-solver:$COURT claude20022002/hestim-solver:latest$" "$BAC/docker.log"

# Historique et retour
refuser "retour sans historique : refusé" version_precedente
noter_version aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa 20261029-100000
refuser "retour avec une seule version : refusé" version_precedente
noter_version bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb 20261029-110000
verifier "retour : la version d'avant" egal "$(version_precedente)" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

# Version annoncée en marche
verifier "même commit : accepté" verifier_version serveur "$COMPLET" "$COMPLET"
refuser "autre commit annoncé : refusé" verifier_version serveur inconnue "$COMPLET"

echo
if [ "$echecs" -eq 0 ]; then echo "deployer.sh : tous les tests passent"; else echo "deployer.sh : $echecs échec(s)"; exit 1; fi
