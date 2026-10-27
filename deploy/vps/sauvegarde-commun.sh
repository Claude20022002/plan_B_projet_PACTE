# Partie commune aux scripts de sauvegarde (sauvegarder.sh, sauvegarder-journaux.sh), lue par
# « . sauvegarde-commun.sh » : réglages de /root/hestim-sauvegarde.conf, journal, choix du
# chiffrement, droits des fichiers créés. Les réglages sont décrits en tête de sauvegarder.sh.

CONF="${CONF:-/root/hestim-sauvegarde.conf}"
# shellcheck disable=SC1090
[ -f "$CONF" ] && . "$CONF"
JOURS="${JOURS:-14}"
CLE_PUBLIQUE="${CLE_PUBLIQUE:-}"
PHRASE="${PHRASE:-}"
DESTINATION="${DESTINATION:-}"
SUPPRESSION_DISTANTE="${SUPPRESSION_DISTANTE:-oui}"
CONTENEUR_MYSQL="${CONTENEUR_MYSQL:-hestim_mysql}"

journal() { echo "$(date '+%F %T') $*"; }
[[ "$JOURS" =~ ^[1-9][0-9]*$ ]] || { journal "JOURS doit être un entier d'au moins 1"; exit 1; }
[[ "$SUPPRESSION_DISTANTE" =~ ^(oui|non)$ ]] || { journal "SUPPRESSION_DISTANTE vaut « oui » ou « non »"; exit 1; }

# Chiffrement : pour la clé publique si elle est réglée (le serveur ne peut pas relire), sinon
# avec la phrase (ancien mode, phrase présente sur le serveur). CHIFFRER s'ajoute à « gpg ».
if [ -n "$CLE_PUBLIQUE" ]; then
    [ -s "$CLE_PUBLIQUE" ] || { journal "ÉCHEC : clé publique introuvable ($CLE_PUBLIQUE)"; exit 1; }
    CHIFFRER=(--encrypt --recipient-file "$CLE_PUBLIQUE" --trust-model always)
elif [ -s "$PHRASE" ]; then
    CHIFFRER=(--symmetric --cipher-algo AES256 --pinentry-mode loopback --passphrase-file "$PHRASE")
    journal "ATTENTION : chiffrement par phrase, présente sur le serveur ; préférer CLE_PUBLIQUE"
else
    journal "ÉCHEC : ni CLE_PUBLIQUE ni PHRASE dans $CONF"
    exit 1
fi
umask 077

# chiffrer <fichier cible> : chiffre l'entrée standard vers le fichier
chiffrer() { gpg --batch --quiet --yes "${CHIFFRER[@]}" -o "$1"; }

# envoyer <dossier local> <destination rclone> : copie nos fichiers chiffrés des JOURS derniers
# jours, puis efface à distance les plus vieux, sauf avec SUPPRESSION_DISTANTE=non
envoyer() {
    rclone copy "$1" "$2" --include '*.gz.gpg' --max-age "${JOURS}d" || return 1
    [ "$SUPPRESSION_DISTANTE" = "non" ] && return 0
    rclone delete "$2" --include '*.gz.gpg' --min-age "${JOURS}d"
}
