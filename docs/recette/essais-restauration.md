# Essais de restauration des sauvegardes

Un essai chaque premier dimanche du mois, selon la procédure de `DEPLOIEMENT.md` (« Sauvegarde quotidienne », « Essai de restauration »). Une ligne par essai, la plus récente en haut. Un essai raté s'écrit aussi : c'est lui qui apprend quelque chose.

| Date | Par | Sauvegardes utilisées | Comptes (sauvegarde / production) | Fichiers (archive / volume) | Durée | Résultat et problèmes |
|---|---|---|---|---|---|---|
| 2026-10-29 | chef de projet (commandes), Claude (procédure, comparaison) | nuit du 29 octobre à 02:15, **clé publique** (`mysql-` et `fichiers-bibliotheque-20261029-021501`), depuis B2, déchiffrées sur le PC | 768 / 768 | 163 / 163 documents (hors `.minio.sys`) ; 181 / 187 en tout | 2 min 30 pour la copie sur le PC (128 Mo), la restauration et les comptes | réussi : première sauvegarde de nuit à clé publique ; bases `hestim_planner` et `studylib` restaurées dans un MySQL 8.0 jetable. Écart de 6 fichiers venu de la corbeille interne de MinIO (`.minio.sys/tmp/.trash`), qui change d'elle-même : procédure corrigée pour la laisser de côté. Base et fichiers du quiz non essayés |
| 2026-10-25 | chef de projet | base de la nuit, ancien mode (phrase), depuis B2 | non noté | fichiers pas encore sauvegardés | non notée | restauration d'essai réussie (compte rendu du 25 octobre) |
