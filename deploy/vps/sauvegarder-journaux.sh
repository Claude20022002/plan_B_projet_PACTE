#!/usr/bin/env bash
# Journaux binaires de MySQL hors du serveur (lot ME-0a), toutes les 15 minutes, par cron en root :
#   */15 * * * * bash /opt/hestim/deploy/vps/sauvegarder-journaux.sh >> /var/log/hestim-journaux.log 2>&1
#
# L'export de la nuit (sauvegarder.sh) ne protège que jusqu'à 2 h 15 : une panne en fin de journée
# perdrait les appels et les séances saisis depuis. Les journaux binaires notent chaque écriture ;
# avec l'export de la nuit, ils permettent de revenir à n'importe quelle minute, à 15 minutes près
# au pire (procédure : DEPLOIEMENT.md, « Revenir à une heure précise »).
#
# Ce que fait le script :
#   1. ferme le journal en cours (FLUSH BINARY LOGS), seulement si quelque chose a été écrit
#      depuis le passage précédent : pas de petits fichiers vides toutes les 15 minutes ;
#   2. chiffre chaque journal fermé qui n'a pas encore été envoyé (comme les sauvegardes) ;
#   3. les envoie dans le sous-dossier « journaux » de la DESTINATION ;
#   4. garde JOURS jours, sur le serveur comme à distance.
# Réglages : ceux de sauvegarder.sh, dans le même fichier, plus DOSSIER_JOURNAUX.
#
# Codes de sortie : 0 tout est fait ; 1 un journal n'a pas pu être chiffré ; 3 journaux chiffrés
# mais PAS sortis du serveur.
set -euo pipefail

# shellcheck source=sauvegarde-commun.sh
. "$(dirname "$0")/sauvegarde-commun.sh"
DOSSIER_JOURNAUX="${DOSSIER_JOURNAUX:-/root/sauvegardes/journaux}"
ENVOYES="$DOSSIER_JOURNAUX/envoyes.txt"
ETAT="$DOSSIER_JOURNAUX/dernier-passage.txt"

# sql <requête> : réponse de MySQL, sans en-tête, colonnes séparées par des tabulations
# shellcheck disable=SC2016  # les variables sont celles du conteneur
sql() { docker exec "$CONTENEUR_MYSQL" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -e "$1"' sh "$1"; }

[ "$(sql 'SELECT @@log_bin')" = "1" ] || { journal "ÉCHEC : journaux binaires désactivés dans MySQL (log_bin)"; exit 1; }
mkdir -p "$DOSSIER_JOURNAUX"
touch "$ENVOYES"
# L'identifiant du serveur entre dans le nom : après une réinstallation, les journaux repartent de
# binlog.000001 et ne doivent ni écraser ni être pris pour ceux d'avant
SERVEUR="$(sql 'SELECT @@server_uuid')"
REPERTOIRE="$(dirname "$(sql 'SELECT @@log_bin_basename')")"

# 1. Fermer le journal en cours s'il a grandi depuis le passage précédent
en_cours="$(sql 'SHOW BINARY LOGS' | tail -n 1 | cut -f1,2)"
if [ "$en_cours" != "$(cat "$ETAT" 2>/dev/null || true)" ]; then
    sql 'FLUSH BINARY LOGS'
fi

# 2. Chiffrer les journaux fermés (tous sauf le dernier, en cours d'écriture) pas encore envoyés
mapfile -t journaux < <(sql 'SHOW BINARY LOGS' | cut -f1)
ECHECS=0
NOUVEAUX=0
for nom in "${journaux[@]:0:${#journaux[@]}-1}"; do
    cle="$SERVEUR-$nom"
    grep -qxF "$cle" "$ENVOYES" && continue
    cible="$DOSSIER_JOURNAUX/$cle.gz.gpg"
    if docker exec "$CONTENEUR_MYSQL" cat "$REPERTOIRE/$nom" | gzip | chiffrer "$cible"; then
        echo "$cle" >> "$ENVOYES"
        NOUVEAUX=$((NOUVEAUX + 1))
    else
        rm -f "$cible"
        journal "ÉCHEC : journal $nom"
        ECHECS=1
    fi
done
# Le journal ouvert après la fermeture : point de comparaison du prochain passage
sql 'SHOW BINARY LOGS' | tail -n 1 | cut -f1,2 > "$ETAT"

# 3 et 4. Rétention locale, puis envoi (même rétention à distance que les sauvegardes)
find "$DOSSIER_JOURNAUX" -maxdepth 1 -type f -name '*.gz.gpg' -mtime "+$JOURS" -delete
SORTIES=0
if [ -z "$DESTINATION" ]; then
    journal "ATTENTION : aucune DESTINATION dans $CONF, les journaux restent sur le serveur"
elif envoyer "$DOSSIER_JOURNAUX" "$DESTINATION/journaux"; then
    SORTIES=1
else
    journal "ÉCHEC : envoi des journaux vers $DESTINATION/journaux"
fi
[ "$NOUVEAUX" -eq 0 ] || journal "ok $NOUVEAUX journal(aux) chiffré(s)"

[ "$ECHECS" -eq 0 ] || exit 1
[ "$SORTIES" -eq 1 ] || exit 3
