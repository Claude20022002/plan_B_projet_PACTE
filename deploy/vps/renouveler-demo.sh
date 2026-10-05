#!/bin/sh
# Renouvelle les mots de passe des comptes de démonstration listés dans /root/hestim-identifiants.txt
# (root seulement). Seuls les rôles et adresses entrent dans le conteneur ; rien n'est affiché à
# part le nombre de comptes renouvelés.
set -e
FICHIER=/root/hestim-identifiants.txt
docker cp /opt/hestim/deploy/vps/renouveler-mots-de-passe-demo.mjs hestim_backend:/tmp/renouveler.mjs
umask 077
awk '!/^#/ && NF {print $1, $2}' "$FICHIER" \
  | docker exec -i hestim_backend node /tmp/renouveler.mjs > "$FICHIER.nouveau"
docker exec -u 0 hestim_backend rm -f /tmp/renouveler.mjs
mv "$FICHIER.nouveau" "$FICHIER"
chmod 600 "$FICHIER"
