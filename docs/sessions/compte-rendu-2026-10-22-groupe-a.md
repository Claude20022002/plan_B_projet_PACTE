# Compte rendu du 22 octobre 2026 (groupe A : fusions, correctif, déploiement)

À lire **après** `compte-rendu-2026-10-21-soir-groupe-a.md` et avec le plan du groupe B, `docs/plans/plan-groupe-b-2026-10-22.md`. Règles de code : § 6 de `docs/plans/assainissement.md`. Règles de fusion : § 5 ci-dessous.

## 1. L'essentiel

1. **maj42 est en ligne** (`4483aa4`). Avant : maj41 (`e3f8c66`). Migrations appliquées : 0046, 0049 à 0052 (0047 et 0048 l'étaient déjà).
2. **Toutes les PR des deux groupes en attente le 21 au soir sont fusionnées** (§ 2), plus un correctif du groupe A (#109) que la fusion de R-1 rendait nécessaire.
3. **Le solveur a été reconstruit sur le serveur**, pas sur le PC : depuis le PC, Docker Hub et l'API GitHub ne répondaient plus (§ 6).
4. **Le script de marquage des mois publiés avait un défaut**, corrigé (PR #112, ouverte) et lancé dans sa version corrigée (§ 4).
5. **Depuis maj42, `main` a reçu #111** (correctifs de sécurité du groupe B) : pas encore en ligne (§ 7).

## 2. Fusionné dans la journée

| PR | Groupe | Contenu |
|---|---|---|
| #94 | A | Plus de campus préféré sur les filières et les groupes (migration 0049, contrainte retirée du solveur) |
| #97, #105 | A, B | R-1 : report à une date ultérieure (serveur, migration 0052 ; écrans) |
| #98, #106 | A, B | R-4 et M-3 : génération sans réglage de durée, écran d'attente, rapport lisible, exploration des emplois du temps |
| #99 | B | SC-1c : le quiz en direct se joue dans l'application |
| #100, #104, #110 | A, B | Durée par question dans le direct, import ClassQuiz complet (images, durées ; migration 0051), champ « durée » dans l'éditeur du Studio |
| #102, #107 | A, B | Publication des changements : les étudiants lisent la version publiée ; écran des classes à republier |
| #103, #108 | A, B | M-6 : la demande de report garde la date et le créneau d'origine (migration 0050) ; écrans |
| **#109** | A | Séance à reprogrammer : publiée, visible des étudiants, mention dans l'EDT du mois (§ 3) |
| #101 | A | Compte rendu du 21 au soir |
| #111 | B | Correctifs de sécurité (§ 7) |

## 3. Correctif #109 : la séance « à reprogrammer » et la publication

**Le défaut** : R-1 (#97, #105) et la publication (#102) étaient justes chacun de leur côté, mais ensemble une séance « à reprogrammer » **disparaissait de la vue des étudiants** au lieu d'afficher « Reportée · date à venir » : son statut n'était pas dans les statuts publiés.

**La correction** :

| Fichier | Changement |
|---|---|
| `services/calendrier/versionPubliee.js` | `a_reprogrammer` est publié ; comme pour une annulation, la version publiée l'emporte sur la séance |
| `services/calendrier/envoiEdt.js` | « Publier et envoyer » le reprend ; le message dit « Reporté, date à venir » une fois, jamais « Annulé ou retiré » (même quand la nouvelle date tombe dans un autre mois) ; il ne compte pas dans le nombre de séances |
| `services/planning/edtMensuel.js` | L'EDT du mois **garde** la séance à sa date d'origine (décision du chef de projet : une mention suffit) ; une séance qui a pris la place passe avant ; elle ne fusionne pas avec une voisine ; elle ne compte pas pour (P.S)/(D.S) |
| `services/calendrier/ics.js` | Agenda du téléphone : événement annulé, titre « Reporté, date à venir : … » |
| `components/edt/DocumentEdtMois.jsx`, `i18n` | Mention « Reportée · date à venir » sous la matière |

Contrôles : `reportPlusTard.test.js` complété (5/5 avec le correctif, 2 échecs sans), intégration 458/458 sur la version fusionnée avec `main`, parcours `report` et `iiia` 5/5.

## 4. Déploiement de maj42

| Étape | Résultat |
|---|---|
| `appliquer-maj.sh` | Dépendances identiques, base sauvegardée (`/root/sauvegardes/hestim-20261022-135405.sql.gz`), contrôles 404/400/200, relais du quiz 200. « FinAdminTech : 301 » au lieu de 200 : redirection de l'autre site, pas du Planner |
| Migrations | `SequelizeMeta` va jusqu'à `0052-report-date-ulterieure.js` |
| `marquer-edt-publie.mjs` (version du paquet) | « 0 mois marqués » : les 29 classes avaient déjà leurs 75 envois depuis maj41 ; mais 10 envois de décembre et janvier restaient à l'ancien format |
| `marquer-edt-publie.mjs` (version corrigée, #112) | Simulation, puis réel : 10 envois remis au nouveau format, aucun mois oublié |
| Solveur | Reconstruit sur le serveur, redémarré ; ancienne image : `hestim-solver:avant-maj42` |

**Le défaut du script** : il cherchait les mois d'une classe dans les seules séances posées sur elle, pas dans celles de sa promotion ni des enseignements mutualisés. Une classe qui n'a ce mois-là que des séances de sa promotion n'avait donc pas d'envoi, et ses étudiants n'auraient rien vu. Sur la base de démonstration : 81 mois de classe trouvés par l'ancien script, **90** par le nouveau. En ligne, il n'a manqué aucun mois (seulement les 10 envois à l'ancien format, qui s'affichaient encore). La version corrigée part de `lignesDuMois` et a un mode `SIMULATION=1`.

**Retour arrière** (commandes affichées par `appliquer-maj.sh`) : images `:avant-20261022-135405` du backend et du site, base `hestim-20261022-135405.sql.gz` ; solveur : `docker tag claude20022002/hestim-solver:avant-maj42 claude20022002/hestim-solver:latest` puis `up -d --no-deps solver`.

**À dire à l'administration** : chaque mois se publie (« Publier et envoyer ») ; une régénération ne se voit qu'après publication ; un report validé doit maintenant être confirmé par l'enseignant.

## 5. Incidents et règles

| Incident | Règle |
|---|---|
| Un commit de fusion poussé avec les marqueurs de conflit (`monEmploiDuTemps.js`, branche de #102) : le serveur n'aurait pas démarré. Corrigé avant la fusion | Avant de commiter une fusion : `git diff --check` |
| GitHub marquait #109 « en conflit » alors que `git merge` la fusionnait sans conflit (plusieurs bases communes après des fusions de `main` dans les branches) | Fusionner `main` dans la branche en local, puis pousser |
| La branche de #109 suivait `a/publication-changements`, supprimée ensuite : `git push` ne poussait plus rien | `git push -u origin <branche>` ; ou `git config --global push.autoSetupRemote true` |
| Des commandes `gh` lancées depuis un dossier de StudyLib ont visé le dépôt StudyLib | `-R Claude20022002/plan_B_projet_PACTE` |
| Un premier maj42 construit sur `e31a213` : le `git pull` avait échoué en silence (réseau) | Lire `VERSION` du paquet avant de l'envoyer ; garde-fou sur `git rev-parse --short HEAD` |
| Le parcours `cours.spec` a échoué deux fois en CI (#92, #107), sans rapport avec ces PR : le champ « Type » de « Ajouter une composante » n'apparaît pas à temps, puis la reprise échoue parce que le module du premier essai existe déjà | Relancer le contrôle (`gh run rerun <id> --failed`) ; à corriger (§ 8) |
| Deux séries de tests lancées en même temps, même sur deux bases, ont fait échouer `mesQuiz` | Une série à la fois |

## 6. Réseau du PC

Depuis le PC, le 22 octobre à partir de midi environ : `api.github.com` et `auth.docker.io` répondent par « TLS handshake timeout » ; `git push` et `git ls-remote` passent. Conséquences : `gh pr …` échoue par moments, `docker build` du solveur impossible (image de base `eclipse-temurin:21-jre-alpine` absente du PC). **Contournement qui a marché** : envoyer les sources du solveur (`Dockerfile`, `pom.xml`, `src`) par `scp` et lancer `docker build` sur le serveur. Le fichier `deploy/vps/paquets/hestim-solver-maj42.tar.gz` du PC contient l'**ancienne** image : à supprimer.

## 7. Prochain paquet : maj43

Depuis maj42, `main` contient #111 (groupe B, correctifs de sécurité) : réinitialisation du mot de passe à lien unique, connexion à ClassQuiz refusée tant que le mot de passe provisoire ou la double authentification attendent, listes d'appartenances réservées à l'administration, mesure de la taille décompressée des supports de l'IA, tentatives simultanées du Studio bornées, lecteur PDF de l'application sans évaluation de code. **Ni migration ni dépendance** : un paquet par superposition suffit. Y joindre #112 une fois fusionnée. Le lecteur PDF (`mobile/`) demande une nouvelle version de l'application.

## 8. Reste à faire

| Qui | Tâche |
|---|---|
| Chef de projet | Contrôle dans le navigateur : un étudiant (semaine, EDT du mois de décembre), l'administration (« EDT du mois », « Demandes de report ») ; vérifier que `hestim_solver` tourne |
| A | Fusionner #112, puis maj43 (§ 7) |
| A | Import ClassQuiz : essai sur un compte, puis `deploy/vps/importer-classquiz.mjs` (service de quiz allumé) |
| A | m-7 : notifications traduites |
| A | SC-3 (rebrancher Mes classes, tableau du jour, Activités sur le Studio), SC-4 (historique, devoirs) ; SC-5 (retrait de ClassQuiz) interdit tant que le direct n'est pas essayé en classe |
| A ou B | Rendre `cours.spec` fiable : code de module unique par essai, chercher pourquoi « Type » tarde |
| B | Nouvelle version de l'application : quiz en direct (SC-1c), « Reportée · date à venir », lecteur PDF (#111) |
| B | R-9, M-13 (2e partie), mineurs m-3 à m-18, R-3 (données, après validation) : plan du groupe B, § 3 |
| Tous | Nettoyer les dossiers de travail fusionnés (`travaux-planner\…`, `planner-*`) en retirant d'abord les jonctions `node_modules` ; bases de test jetables du port 3311 (`hestim_areprog_test`, `hestim_areprog_parcours_test`, `hestim_fusion_pub_test`, `hestim_essai109_test`) |
| Tous | Anciennes PR : #92 (compte rendu du 20, parcours à relancer), #91 (plans), #53, #40 |
