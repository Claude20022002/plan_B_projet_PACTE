# Compte rendu de la session du groupe A, 29 au 31 octobre 2026

À lire en début de la prochaine session du groupe A, puis celui du 27 au 29 octobre (`compte-rendu-2026-10-29-groupe-a.md`, même branche), avec le plan validé (`docs/plans/planner-multi-etablissements/15-plan-de-developpement.md`) et la revue d'expert (`16-revue-expert.md`). Règles inchangées : § 15.6 du plan ; **seul le chef de projet pousse le code** ; les commandes du serveur sont lancées par lui (Windows PowerShell 5.1, enveloppées dans `ssh`, sans guillemets doubles dans la commande distante, `$K` et `$H` redéfinies en tête de bloc ; `gpg` par le bash de Git). Règle nouvelle : **un test de régression avant d'annoncer** (§ 4).

## 1. L'essentiel

1. **Production inchangée** : maj44 (`3e36d46`) toujours en ligne ; rien n'a été mis en ligne pendant la session. `main` est à `7bf45ee` (fusions du groupe B : #131, #134, #135, #136, #139 ; du groupe A : #127 et #132).
2. **Passage à MySQL 8.4 le dimanche 1er novembre au matin** (décidé le 29 octobre ; répétition sur le serveur réussie, #127 fusionnée). L'essai de restauration du mois suit, dans un `mysql:8.4.13` jetable.
3. **Cinq PR du groupe A attendent, toutes vertes sur la CI** : #138, #137, #141, #142, #145. Une sixième branche, ME-21, est **commitée mais pas poussée** (`554160f`).
4. **V1 du groupe A presque finie** : il ne reste que **ME-14a** (mesure du solveur sur 20 000 étudiants).
5. **Essai de ME-3a : D-03 tient.** L'audit d'isolation trouve 15 canaux à fermer avant toute deuxième école (4 critiques) ; leur correction reste en V4 (ME-3a, ME-3b), décision du 29 octobre.

## 2. Fait du 29 au 31 octobre

| Quoi | Où | État |
|---|---|---|
| Fusion de #132 (tous les scripts d'exploitation livrés par les paquets) | `main` | fusionnée |
| **Premier essai de restauration avec la clé publique** : sauvegarde de nuit à 02:15, déchiffrée sur le PC ; 768/768 comptes, 163/163 documents (écart brut de 6 fichiers : corbeille interne de MinIO) ; `DEPLOIEMENT.md` corrigé (comptage hors `.minio.sys`, pipes binaires dans Git Bash) | #138, `a/essai-restauration-2026-10-29` | verte, à fusionner (documentation seule) |
| **ME-0e** : répétition sur le serveur réussie (mise à niveau 80046 → 80413, empreintes identiques) ; procédure de passage et de retour par `sed` | #127 | **fusionnée** (`fc297bb`) ; passage le 1er novembre |
| **Règle de lint R-2** : `config/db.js` interdit hors de `models/`, un modèle n'importe pas un autre ; `models/acces.js` (`enTransaction`, `requete`) ; 24 exceptions figées | #137, `a/lint-acces-base` | verte, à fusionner en premier |
| **Essai réduit de ME-3a** : résolveurs de modèles et `AsyncLocalStorage` sur deux bases ; trois routes réelles, transaction, crochet de modèle corrigé (`Groupe.js`), mode strict ; rapport `17-essai-contexte.md` ; **audit d'isolation** `18-audit-isolation.md` ; clonage des modèles sorti du code de production, avec un test d'architecture | #142, `a/essai-me3a` | verte ; contient #137 ; **fusion à décider** (§ 5) |
| **ME-0c (serveur)** : ClassQuiz derrière une fonctionnalité de l'école (migration **0057**, `classquiz_actif`), éteint pour une installation neuve, allumé pour HESTIM ; contrat pour le groupe B dans la PR | #141, `a/me0c-classquiz` | verte ; relecture du groupe B, puis sa partie écrans |
| **ME-0b** : mise en ligne en une commande. La CI publie les images (`ghcr.io/claude20022002/hestim-*`) après les contrôles sur `main` ; `deploy/vps/deployer.sh <commit>`, `--essai`, `--retour` ; version vérifiée en marche (`/health`, `/version.txt`) ; conception avec diagrammes UML | #145, `a/me0b-deploiement` | verte (« Publier » sauté sur une PR, normal) |
| **ME-21 (serveur)** : `/api/supervision/sante` (public), `/api/supervision/mesures` (jeton), compteurs en mémoire, journaux par école, battements des sauvegardes ; conception avec diagrammes UML ; procédure dans `DEPLOIEMENT.md` | `a/me21-supervision`, `554160f` | **à pousser**, puis PR |
| Relectures publiées pour le groupe B : #126, #131, #134, #135 | GitHub | #135 relue **après** sa fusion (§ 6) |

Vérifications locales de la session : intégration complète 499 à 514 tests selon la branche, toutes vertes ; unitaires 225 à 230 ; parcours verts sur la CI de chaque PR (#141, #142, #145).

## 3. Lots V1 du groupe A (fichier 15, § 15.5)

| Lot | État |
|---|---|
| ME-0e | fusionné ; passage le 1er novembre |
| Essai ME-3a et règle de lint | #142 et #137 |
| ME-0c | #141 (serveur) ; écrans au groupe B |
| ME-0b | #145 |
| ME-21 | branche à pousser ; configuration de la sonde et essai de nuit par le chef de projet |
| **ME-14a** | **à faire** : mesure du solveur sur 20 000 étudiants de démonstration (dit si les universités sont visées la première année) |

## 4. Décisions

- **Date du passage à MySQL 8.4** : dimanche 1er novembre au matin.
- **« Le reste » = la suite de V1**, pas les corrections d'isolation (celles-ci restent à ME-3a et ME-3b, en V4).
- **ME-21** : sonde par un **service hébergé** (Better Stack ou UptimeRobot, compte créé par le chef de projet) ; alerte par **notification d'application** sur le téléphone, plus le courriel ; **aucune erreur hors du serveur** (loi 09-08, Q-23).
- **Test de régression avant d'annoncer** : suite complète du serveur et parcours, et un test qui fige chaque correctif (ou un `test.failing` pour une faille connue non corrigée). Quand le poste ne permet pas les parcours, la CI de la PR tranche, et on le dit.
- **Recommandation (à décider)** : fusionner #142 après #137 ; ne pas mettre en ligne le même jour que le passage à MySQL 8.4.

## 5. Ordre de travail de la prochaine session

1. **Dimanche 1er novembre** : passage à MySQL 8.4 (`DEPLOIEMENT.md`, « Passer à MySQL 8.4 »), puis l'essai de restauration du mois dans un `mysql:8.4.13` jetable, ligne dans `docs/recette/essais-restauration.md`.
2. **Pousser ME-21** (`git -C "..\travaux-planner\me21-supervision" push -u origin a/me21-supervision`), ouvrir sa PR, suivre la CI.
3. **Fusions, dans cet ordre** : #138 ; #137 ; #141 (après relecture du groupe B) ; #142 (si décidé) ; #145 ; ME-21. **#145 et ME-21 ajoutent chacune une ligne au même endroit de `docs/plans/planner-multi-etablissements/README.md`** : petit conflit à résoudre sur la seconde.
4. **Première mise en ligne par ME-0b** (maj45), un autre jour que MySQL 8.4, après la fusion de #145 et la publication des images : vérifier que les quatre images `hestim-*` sont **publiques** dans GitHub (Packages), copier une fois `deployer.sh` et `deploiement-commun.sh` dans `/opt/hestim/deploy/vps/`, `deployer.sh --essai <commit>`, puis `deployer.sh <commit>`. Le paquet majNN reste prêt en secours. Contenu : tout ce qui est fusionné depuis `3e36d46`, dont les migrations **0056** (#131) et **0057** (#141).
5. **ME-21 côté exploitation** (chef de projet, `DEPLOIEMENT.md`, « Supervision ») : `SUPERVISION_TOKEN` et `ETABLISSEMENT_NOM` dans `.env.docker`, moniteurs de la sonde, battements des sauvegardes, page d'état, puis **l'essai de panne de nuit** (critère : alerte en moins de 5 minutes), noté dans `docs/recette/essais-supervision.md`.
6. **ME-14a**, dernier lot V1 du groupe A : conception d'abord (avec diagrammes), comme ME-0b et ME-21.
7. **Groupe B** : partie écrans de ME-0c (contrat dans #141) ; correctif de l'import des étudiants avec « Toutes les années » (#140, `b/import-etudiants-annee`), avec un test de régression.

## 6. Incidents et leçons

| Incident | Cause | Règle |
|---|---|---|
| Relecture de #135 publiée à 09:24, PR fusionnée à 07:53 ; le défaut de l'import (« 4A IIIA » de deux années confondus) est passé sur `main` | état de la PR non revérifié avant de relire | relire `gh pr view <n> --json state` juste avant de publier ; le groupe B corrige (#140) |
| Première série de parcours de l'essai : 17 échecs, serveur d'API injoignable sans trace ; deuxième série identique : 31/31 ; CI verte | poste saturé (processeur à 100 %, 342 Mo libres : Docker, ClassQuiz local, finadmintech, navigateur) | ne pas lancer parcours et suite complète en même temps ; arrêter ses conteneurs de test ; la CI tranche |
| « read ECONNRESET » sur la CI de #142 (requêtes mêlées des deux écoles) | supertest ouvrait un serveur par requête, 20 requêtes à la fois | un seul serveur HTTP par fichier de test (`e009a54`) |
| Réinitialisation de la base au-delà de 30 s en local, premier fichier de la suite | MySQL de test lancé sans les options rapides | toujours `--tmpfs /var/lib/mysql --innodb-flush-log-at-trx-commit=0 --skip-log-bin --innodb-doublewrite=0` |
| `docker run --tmpfs /var/lib/mysql` ou `cat /usr/share/…` réécrits en chemins Windows | Git Bash convertit les chemins | `MSYS_NO_PATHCONV=1` devant `docker` |
| `git checkout --detach` lancé par erreur dans le dépôt principal | commande lancée dans le mauvais dossier | remis sur `main` aussitôt, sans perte ; ne travailler que dans les dossiers de travail |
| #127 fusionnée avant que « Test Backend » soit vert | — | attendre la CI verte (règle du 26 octobre) ; `main` est restée verte |

## 7. Questions ouvertes

- **#142** : fusionner (recommandé) ou garder comme référence pour ME-3a complet.
- **GHCR** : images publiques (aucun secret sur le serveur) ou privées (`docker login ghcr.io` avec un jeton en lecture seule).
- **Service de sonde** : Better Stack ou UptimeRobot ; limites de l'offre gratuite à vérifier à l'inscription.
- Inchangées : **Q-25** (école pilote, campus dissociés), **Q-23** (hébergement de l'école pilote), **Q-27** (deuxième personne sur la production), **EC-2** (devoirs le jour de l'ouverture), protection de `main` (« Require status checks »), `app.json`.

## 8. Dossiers de travail (`Github Project\travaux-planner\`)

**Attention avant de supprimer un dossier** : plusieurs ont des **jonctions** `node_modules` vers `plan_B_projet_PACTE` (`essai-me3a\frontend`, `lint-acces-base\frontend`, `me0c-classquiz\backend` et `\frontend`, `me0b-deploiement\backend`, `me21-supervision\backend`). Les retirer d'abord avec `cmd /c rmdir <dossier>\backend\node_modules` (retire le lien seul) : une suppression récursive pourrait vider les `node_modules` du dépôt principal.

| Dossier | Branche | Suite |
|---|---|---|
| `lint-acces-base` | `a/lint-acces-base` | garder jusqu'à la fusion de #137 |
| `essai-restauration-29` | `a/essai-restauration-2026-10-29` | garder jusqu'à la fusion de #138 |
| `me0c-classquiz` | `a/me0c-classquiz` | garder jusqu'à la fusion de #141 |
| `essai-me3a` | `a/essai-me3a` | garder jusqu'à la décision sur #142 |
| `me0b-deploiement` | `a/me0b-deploiement` | garder jusqu'à la fusion de #145 |
| `me21-supervision` | `a/me21-supervision` | à pousser ; garder jusqu'à la fusion |
| `compte-rendu-26`, `compte-rendu-29`, `compte-rendu-31` | comptes rendus | garder jusqu'à leur fusion (#129 pour le 26 ; celui-ci porte aussi le 29) |
| `me0e-mysql84`, `paquet-scripts-exploitation` | fusionnées (#127, #132) | à supprimer : `git worktree remove --force ..\travaux-planner\<dossier>` depuis `plan_B_projet_PACTE` |
| `maj44` et les dossiers fusionnés listés au § 8 du 29 octobre | — | à supprimer de même |
