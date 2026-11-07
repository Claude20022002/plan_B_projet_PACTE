#!/usr/bin/env bash
# Sauvegarde quotidienne des bases de la plateforme (lot A-3), à lancer par cron en root :
#   15 2 * * * bash /opt/hestim/deploy/vps/sauvegarder.sh >> /var/log/hestim-sauvegarde.log 2>&1
#
# Ce que fait le script :
#   1. exporte les bases MySQL (Planner et la bibliothèque) et la base PostgreSQL du quiz, puis
#      archive les fichiers : documents de la bibliothèque (volume de MinIO) et images des quiz ;
#   2. chiffre chaque export (GPG) : une sauvegarde contient des données personnelles et quitte
#      le serveur. De préférence pour une clé publique, dont la clé privée n'est PAS sur le
#      serveur : un intrus qui prend le serveur ne peut alors relire aucune sauvegarde ;
#   3. envoie les fichiers chiffrés hors du serveur avec rclone ;
#   4. ne garde que 14 jours de sauvegardes, sur le serveur comme à distance.
# Redis, les index de recherche et les certificats de Caddy ne sont pas sauvegardés : ils se
# reconstruisent seuls.
#
# Réglages, dans /root/hestim-sauvegarde.conf (lisible par root seul) :
#   CLE_PUBLIQUE=/root/hestim-sauvegarde.pub   clé publique GPG (format texte) pour laquelle chiffrer ;
#                                        la clé privée reste hors du serveur (recommandé)
#   PHRASE=/root/hestim-sauvegarde.cle   ancien mode, utilisé seulement sans CLE_PUBLIQUE : phrase
#                                        de chiffrement symétrique, présente sur le serveur
#   DESTINATION=nom:chemin               destination rclone hors du serveur (voir « rclone config »)
#   JOURS=14                             durée de rétention
#   SUPPRESSION_DISTANTE=oui             « non » : le script n'efface rien à distance. À choisir quand
#                                        la clé de la destination n'a pas le droit d'effacer (clé
#                                        Backblaze B2 sans « deleteFiles ») et que la destination
#                                        efface elle-même les vieux fichiers (règle de cycle de vie) :
#                                        un intrus qui prend le serveur ne peut alors pas détruire
#                                        les sauvegardes déjà envoyées. Obligatoire avec le
#                                        verrouillage d'objet de B2 (Object Lock).
#   FICHIERS=oui                         « non » : bases seulement, sans l'archive des fichiers (par
#                                        exemple pour une seconde tâche, plus fréquente)
#   BATTEMENT=https://…                  adresse de battement de la sonde (lot ME-21), appelée quand
#                                        tout est fait et sorti du serveur ; la sonde alerte sinon
#   BATTEMENT_JOURNAUX=https://…         la même chose pour sauvegarder-journaux.sh
# La clé privée (ou, dans l'ancien mode, la phrase) doit être gardée AILLEURS que sur le serveur :
# sans elle, aucune sauvegarde ne se relit. Restauration : DEPLOIEMENT.md, « Sauvegarde quotidienne ».
#
# Codes de sortie : 0 tout est fait ; 1 un export ou le chiffrement a échoué ; 3 les sauvegardes
# sont faites mais ne sont PAS sorties du serveur (pas de destination, ou envoi en échec).
set -euo pipefail

# Réglages, journal et chiffrement communs avec sauvegarder-journaux.sh
# shellcheck source=sauvegarde-commun.sh
. "$(dirname "$0")/sauvegarde-commun.sh"
DOSSIER="${DOSSIER:-/root/sauvegardes/quotidien}"
CONTENEUR_QUIZ="${CONTENEUR_QUIZ:-hestim_quiz_db}"
FICHIERS="${FICHIERS:-oui}"
CONTENEUR_MINIO="${CONTENEUR_MINIO:-hestim_minio}"
CONTENEUR_QUIZ_FICHIERS="${CONTENEUR_QUIZ_FICHIERS:-hestim_quiz_worker}"
# Image jetable qui lit les volumes en lecture seule (version fixée : rien ne change sans nous)
IMAGE_ARCHIVE="${IMAGE_ARCHIVE:-alpine:3.20}"
DATE="$(date +%Y%m%d-%H%M%S)"

[[ "$FICHIERS" =~ ^(oui|non)$ ]] || { journal "FICHIERS vaut « oui » ou « non »"; exit 1; }
[ -n "$CLE_PUBLIQUE" ] && journal "chiffrement pour la clé publique $CLE_PUBLIQUE"
mkdir -p "$DOSSIER"

ECHECS=0
# Nos fichiers dans le dossier et à distance : exports de bases (.sql) et archives de fichiers (.tar)
MOTIF='*.gz.gpg'

# exporter <nom> <sql|tar> <commande d'export…> : export compressé puis chiffré, sans fichier en
# clair sur le disque. Si la commande échoue (pipefail), le fichier est retiré : mieux vaut une
# sauvegarde manquante, signalée, qu'un fichier qui a l'air d'une sauvegarde et ne contient rien.
exporter() {
    local nom="$1"
    local cible="$DOSSIER/$nom-$DATE.$2.gz.gpg"
    shift 2
    if "$@" | gzip | chiffrer "$cible"; then
        journal "ok $(basename "$cible") ($(du -h "$cible" | cut -f1))"
    else
        rm -f "$cible"
        journal "ÉCHEC : export « $nom »"
        ECHECS=1
    fi
}

# Les bases MySQL de la plateforme en un seul export (Planner et la bibliothèque), cohérent à un
# instant donné. Les bases du système (comptes, réglages de MySQL) n'y sont pas : la restauration
# ne change ni les mots de passe ni les droits du serveur qui la reçoit. Si les journaux binaires
# sont actifs, l'export note en commentaire le journal et la position où il a été pris : c'est le
# point de départ pour rejouer les journaux envoyés par sauvegarder-journaux.sh.
# shellcheck disable=SC2016  # les variables sont celles du conteneur
exporter mysql sql docker exec "$CONTENEUR_MYSQL" sh -c '
    export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
    bases=$(mysql -uroot -N -e "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\"mysql\", \"sys\", \"information_schema\", \"performance_schema\")")
    [ -n "$bases" ] || exit 1
    position=""
    [ "$(mysql -uroot -N -e "SELECT @@log_bin")" = "1" ] && position="--source-data=2"
    mysqldump -uroot --single-transaction --routines $position --databases $bases'
if docker inspect "$CONTENEUR_QUIZ" >/dev/null 2>&1; then
    exporter quiz sql docker exec "$CONTENEUR_QUIZ" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"'
else
    journal "quiz : conteneur $CONTENEUR_QUIZ absent, base non sauvegardée"
fi

# archiver <nom> <conteneur> <dossier> : les fichiers d'un volume, lus par un conteneur jetable qui
# monte les volumes du conteneur en lecture seule (le service continue de tourner). L'archive de
# MinIO est son dossier de données tel quel : elle se restaure dans un MinIO de même version.
archiver() {
    if docker inspect "$2" >/dev/null 2>&1; then
        exporter "$1" tar docker run --rm --network none --volumes-from "$2:ro" "$IMAGE_ARCHIVE" tar -C "$3" -cf - .
    else
        journal "$1 : conteneur $2 absent, fichiers non sauvegardés"
    fi
}
if [ "$FICHIERS" = "oui" ]; then
    archiver fichiers-bibliotheque "$CONTENEUR_MINIO" /data
    archiver fichiers-quiz "$CONTENEUR_QUIZ_FICHIERS" /app/data
fi

# Rétention sur le serveur : seulement nos fichiers, seulement dans ce dossier
find "$DOSSIER" -maxdepth 1 -type f -name "$MOTIF" -mtime "+$JOURS" -print -delete | sed 's/^/supprimé (plus de '"$JOURS"' jours) : /'

# Envoi hors du serveur. Un export manquant n'empêche pas d'envoyer ceux qui ont réussi.
# Sans suppression distante, la destination applique sa propre rétention (voir le réglage).
SORTIES=0
if [ -z "$DESTINATION" ]; then
    journal "ATTENTION : aucune DESTINATION dans $CONF, les sauvegardes restent sur le serveur"
elif envoyer "$DOSSIER" "$DESTINATION"; then
    journal "envoyé vers $DESTINATION"
    SORTIES=1
else
    journal "ÉCHEC : envoi vers $DESTINATION, les sauvegardes restent sur le serveur"
fi

[ "$ECHECS" -eq 0 ] || { journal "ÉCHEC : au moins un export manque"; exit 1; }
[ "$SORTIES" -eq 1 ] || exit 3
# Tout est fait et hors du serveur : battement vers la sonde (lot ME-21)
battre "$BATTEMENT"
