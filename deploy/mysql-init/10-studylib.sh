#!/bin/sh
# Premier démarrage de MySQL : une base et un utilisateur propres à StudyLib, sans droit sur
# la base de Planner. STUDYLIB_DB_PASSWORD : hexadécimal recommandé (pas de guillemet).
set -eu
case "$STUDYLIB_DB_PASSWORD" in
  *\'*|*\\*) echo "STUDYLIB_DB_PASSWORD ne doit contenir ni apostrophe ni barre oblique inverse" >&2; exit 1 ;;
esac
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS studylib CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'studylib'@'%' IDENTIFIED BY '${STUDYLIB_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON studylib.* TO 'studylib'@'%';
FLUSH PRIVILEGES;
SQL
