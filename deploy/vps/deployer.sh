#!/usr/bin/env bash
# Mise en ligne en une commande (lot ME-0b ; conception : docs/plans/planner-multi-etablissements/
# conception-me0b-deploiement.md). Remplace preparer-maj.sh et appliquer-maj.sh pour Planner :
# les images sont construites et publiées par la CI après chaque fusion sur main, au nom du commit.
# À lancer en root sur le serveur :
#   bash /opt/hestim/deploy/vps/deployer.sh <commit>           mise en ligne de ce commit (7 ou 40 caractères)
#   bash /opt/hestim/deploy/vps/deployer.sh --essai <commit>   tire et vérifie, ne change rien
#   bash /opt/hestim/deploy/vps/deployer.sh --retour           remet la version précédente
# Rien n'est touché tant que les quatre images ne sont pas là et ne portent pas ce commit. Ensuite :
# sauvegarde de la base, images remplacées (les anciennes gardées en :avant-<date>), scripts
# d'exploitation à jour, serveur (migrations), site et solveur redémarrés, version vérifiée en marche.
# MySQL n'est jamais redémarré ; StudyLib et ClassQuiz restent aux paquets majNN (hors périmètre).
# shellcheck source-path=SCRIPTDIR
set -Eeuo pipefail

REGISTRE="${REGISTRE:-ghcr.io/claude20022002}"
HESTIM="${HESTIM:-/opt/hestim}"
ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploiement-commun.sh
. "$ICI/deploiement-commun.sh"

usage() {
    echo "usage : deployer.sh <commit> | --essai <commit> | --retour" >&2
    exit 2
}

# Retour arrière, affiché à la fin et à toute erreur après le début des changements
afficher_retour() {
    cat <<EOF

Retour arrière :
  bash $HESTIM/deploy/vps/deployer.sh --retour
  (sans registre : docker tag $NOM_LOCAL/hestim-<backend|frontend|solver>:avant-$1 $NOM_LOCAL/hestim-<…>:latest
   puis, dans $HESTIM : ${COMPOSE[*]} up -d --no-deps backend frontend solver)
  Si une migration a été appliquée, restaurer aussi la base (ses nouvelles tables restent, à supprimer avant de redéployer) :
  gunzip -c $2 | docker exec -i hestim_mysql sh -c 'MYSQL_PWD="\$MYSQL_ROOT_PASSWORD" mysql -uroot "\$MYSQL_DATABASE"'
EOF
}

# Démarre un service et vérifie, s'il le faut, la version qu'il annonce
relancer() {
    "${COMPOSE[@]}" up -d --no-deps "$1"
    attendre_sain "$2"
}
verifier_version() {
    if [ "$2" != "$3" ]; then
        echo "$1 annonce « ${2:-rien} », attendu $3 : la mise en ligne n'est pas celle demandée" >&2
        return 1
    fi
    echo "$1 : $2"
}

principal() {
    local essai="" commit complet date sauvegarde dossier site
    case "${1:-}" in
        --essai) essai=1; commit="${2:-}" ;;
        --retour) commit="$(version_precedente)" ;;
        -*|"") usage ;;
        *) commit="$1" ;;
    esac
    commit_valide "$commit" || usage
    COMPOSE=(docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml)

    echo "== Images du commit $commit ($REGISTRE)"
    complet="$(tirer_et_verifier "$commit")"
    echo "les quatre images portent le commit $complet"
    if [ -n "$essai" ]; then
        echo "essai : prêt à mettre en ligne, rien n'a été changé"
        return 0
    fi

    date="$(date +%Y%m%d-%H%M%S)"
    echo "== Sauvegarde de la base (le serveur applique ses migrations au démarrage)"
    sauvegarde="$(sauvegarder_base "$date")"
    ls -lh "$sauvegarde"
    # À partir d'ici, toute erreur affiche le retour arrière
    trap 'afficher_retour "$date" "$sauvegarde"' ERR

    echo "== Images mises en place (anciennes : :avant-$date)"
    mettre_en_place "$commit" "$date"
    echo "== Scripts d'exploitation"
    dossier="$(installer_scripts "$commit")"

    cd "$HESTIM"
    echo "== Serveur"
    relancer backend hestim_backend
    verifier_version "serveur" "$(version_du_serveur)" "$complet"
    echo "== Site"
    relancer frontend hestim_frontend
    verifier_version "site" "$(version_du_site)" "$complet"
    echo "== Solveur"
    relancer solver hestim_solver
    echo "== Aiguillage (Caddy)"
    mettre_a_jour_caddy "$dossier/Caddyfile.vps" "$date"
    rm -rf "$dossier"

    site="$(adresse_du_site)"
    echo "== Contrôles (attendu : 404, 400, 200)"
    code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
    echo "route inexistante : $(code "https://$site/api/route-inexistante")"
    echo "login vide        : $(code -X POST -H 'Content-Type: application/json' -d '{}' "https://$site/api/auth/login")"
    echo "site              : $(code "https://$site/")"

    noter_version "$complet" "$date"
    trap - ERR
    echo "== En ligne : $complet (historique : $(historique))"
    afficher_retour "$date" "$sauvegarde"
}

# Chargé par les tests (tests/tester-deployer.sh) : les fonctions seulement
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    principal "$@"
fi
