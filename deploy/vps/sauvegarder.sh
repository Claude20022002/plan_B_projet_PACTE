#!/usr/bin/env bash
# Sauvegarde quotidienne des bases de la plateforme (lot A-3), à lancer par cron en root :
#   15 2 * * * bash /opt/hestim/deploy/vps/sauvegarder.sh >> /var/log/hestim-sauvegarde.log 2>&1
#
# Ce que fait le script :
#   1. exporte les bases MySQL (Planner et la bibliothèque) et la base PostgreSQL du quiz ;
#   2. chiffre chaque export (GPG, AES-256) : une sauvegarde contient des données personnelles
#      et quitte le serveur ;
#   3. envoie les fichiers chiffrés hors du serveur avec rclone ;
#   4. ne garde que 14 jours de sauvegardes, sur le serveur comme à distance.
# Il ne sauvegarde pas les fichiers (documents de la bibliothèque, images des quiz).
#
# Réglages, dans /root/hestim-sauvegarde.conf (lisible par root seul) :
#   PHRASE=/root/hestim-sauvegarde.cle   fichier contenant la phrase de chiffrement (obligatoire)
#   DESTINATION=nom:chemin               destination rclone hors du serveur (voir « rclone config »)
#   JOURS=14                             durée de rétention
# La phrase de chiffrement doit aussi être gardée AILLEURS que sur le serveur : sans elle, aucune
# sauvegarde ne se relit. Restauration : DEPLOIEMENT.md, « Sauvegarde quotidienne ».
#
# Codes de sortie : 0 tout est fait ; 1 un export ou le chiffrement a échoué ; 3 les sauvegardes
# sont faites mais ne sont PAS sorties du serveur (pas de destination, ou envoi en échec).
set -euo pipefail

CONF="${CONF:-/root/hestim-sauvegarde.conf}"
# shellcheck disable=SC1090
[ -f "$CONF" ] && . "$CONF"
DOSSIER="${DOSSIER:-/root/sauvegardes/quotidien}"
JOURS="${JOURS:-14}"
PHRASE="${PHRASE:-}"
DESTINATION="${DESTINATION:-}"
CONTENEUR_MYSQL="${CONTENEUR_MYSQL:-hestim_mysql}"
CONTENEUR_QUIZ="${CONTENEUR_QUIZ:-hestim_quiz_db}"
DATE="$(date +%Y%m%d-%H%M%S)"

journal() { echo "$(date '+%F %T') $*"; }
[[ "$JOURS" =~ ^[1-9][0-9]*$ ]] || { journal "JOURS doit être un entier d'au moins 1"; exit 1; }
[ -s "$PHRASE" ] || { journal "ÉCHEC : phrase de chiffrement absente ($CONF, réglage PHRASE)"; exit 1; }
umask 077
mkdir -p "$DOSSIER"

ECHECS=0
# exporter <nom> <commande d'export…> : export compressé puis chiffré, sans fichier en clair sur le
# disque. Si la commande échoue (pipefail), le fichier est retiré : mieux vaut une sauvegarde
# manquante, signalée, qu'un fichier qui a l'air d'une sauvegarde et ne contient rien.
exporter() {
    local nom="$1"
    local cible="$DOSSIER/$nom-$DATE.sql.gz.gpg"
    shift
    if "$@" | gzip | gpg --batch --quiet --yes --symmetric --cipher-algo AES256 --pinentry-mode loopback --passphrase-file "$PHRASE" -o "$cible"; then
        journal "ok $(basename "$cible") ($(du -h "$cible" | cut -f1))"
    else
        rm -f "$cible"
        journal "ÉCHEC : export « $nom »"
        ECHECS=1
    fi
}

# Les bases MySQL de la plateforme en un seul export (Planner et la bibliothèque), cohérent à un
# instant donné. Les bases du système (comptes, réglages de MySQL) n'y sont pas : la restauration
# ne change ni les mots de passe ni les droits du serveur qui la reçoit.
# shellcheck disable=SC2016  # les variables sont celles du conteneur
exporter mysql docker exec "$CONTENEUR_MYSQL" sh -c '
    export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
    bases=$(mysql -uroot -N -e "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\"mysql\", \"sys\", \"information_schema\", \"performance_schema\")")
    [ -n "$bases" ] || exit 1
    mysqldump -uroot --single-transaction --routines --databases $bases'
if docker inspect "$CONTENEUR_QUIZ" >/dev/null 2>&1; then
    exporter quiz docker exec "$CONTENEUR_QUIZ" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"'
else
    journal "quiz : conteneur $CONTENEUR_QUIZ absent, base non sauvegardée"
fi

# Rétention sur le serveur : seulement nos fichiers, seulement dans ce dossier
find "$DOSSIER" -maxdepth 1 -type f -name '*.sql.gz.gpg' -mtime "+$JOURS" -print -delete | sed 's/^/supprimé (plus de '"$JOURS"' jours) : /'

# Envoi hors du serveur. Un export manquant n'empêche pas d'envoyer ceux qui ont réussi.
SORTIES=0
if [ -z "$DESTINATION" ]; then
    journal "ATTENTION : aucune DESTINATION dans $CONF, les sauvegardes restent sur le serveur"
elif rclone copy "$DOSSIER" "$DESTINATION" --include '*.sql.gz.gpg' --max-age "${JOURS}d" && rclone delete "$DESTINATION" --include '*.sql.gz.gpg' --min-age "${JOURS}d"; then
    journal "envoyé vers $DESTINATION"
    SORTIES=1
else
    journal "ÉCHEC : envoi vers $DESTINATION, les sauvegardes restent sur le serveur"
fi

[ "$ECHECS" -eq 0 ] || { journal "ÉCHEC : au moins un export manque"; exit 1; }
[ "$SORTIES" -eq 1 ] || exit 3
