# Base des fuseaux horaires (tzdata 2026c)

Node n'utilise pas la tzdata du système mais celle de sa bibliothèque ICU. Une version de Node
plus ancienne que 22.23.3 embarque une tzdata antérieure à 2026c, où le Maroc reste en UTC+1 ;
or depuis le 20 septembre 2026 le Maroc est à UTC+0 toute l'année. Les heures envoyées à
l'extérieur (agendas ICS, envoi de l'emploi du temps) seraient alors décalées d'une heure.

Ces fichiers ICU (`zoneinfo64.res`, `timezoneTypes.res`, `metaZones.res`, `windowsZones.res`)
viennent de https://github.com/unicode-org/icu-data/tree/main/tzdata/icunew/2026c/44/le et sont
chargés grâce à `ICU_TIMEZONE_FILES_DIR=/app/tzdata` (Dockerfile et paquets de mise à jour).

Mise à jour lors d'une nouvelle tzdata : remplacer les quatre fichiers par ceux du dossier
`icunew/<version>/44/le`, puis vérifier dans le conteneur :
`node -p process.versions.tz`.
