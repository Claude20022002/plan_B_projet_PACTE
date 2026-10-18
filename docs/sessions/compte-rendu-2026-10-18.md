# État complet du projet HESTIM Planner (18 octobre 2026)

À lire en début de session : il remplace les comptes rendus du 15, du 16 et du 17 octobre pour l'état du projet. Les règles de travail restent celles du § 4 de `compte-rendu-2026-10-11.md`, et les règles de code celles du § 6 de `docs/plans/assainissement.md`.

## 1. L'essentiel

1. **La production est en maj38** (18 octobre). Tout ce qui est fusionné sur `main` est en ligne : Planner, la Bibliothèque (StudyLib) et le Quiz (ClassQuiz).
2. **L'espace de cours est terminé** (lots E-0 à E-10). Il reste à passer sa recette en ligne.
3. **Les constats de l'audit du 15 octobre sont traités**, sauf trois : les sauvegardes hors du serveur, les couleurs définies à cinq endroits, et le style clair du Quiz du groupe B.
4. **Le risque le plus sérieux est l'absence de sauvegarde hors du serveur.** La base n'est sauvegardée qu'à chaque mise à jour, et sur le même serveur. Le script est prêt ; il ne manque que la destination (§ 8).
5. **Le dépôt principal est sur la branche `video/promo`**, pas sur `main` : elle porte 13 commits de vidéo, non fusionnés. maj38 a été préparé depuis cette branche ; c'est sans conséquence, car elle ne change que `docs/`. Mais les prochains paquets doivent partir de `main`.

## 2. En ligne

| Service | Adresse | Version | Contrôles du 18 octobre |
|---|---|---|---|
| Planner (site et API) | `planner.finadmintech.fr` | `main` à `a6d6b58` (dans le paquet : `6678069`, même code, plus la vidéo) | Site 200 ; un seul `X-Frame-Options` sur `/api` |
| Bibliothèque (StudyLib) | `planner.finadmintech.fr/biblio` | `a0e31e2` (PR #8, projets sur téléphone) | Le CSS en ligne contient la correction du débordement |
| Quiz (ClassQuiz) | `quiz.finadmintech.fr` | `fcd121a2` (nom « Quiz », mode équipe) | Titre « Quiz », API 401, quatre en-têtes de sécurité |
| Application mobile | Expo Go, depuis le PC (`mobile/.env` vise la production) | `main` | Pas de version sur les stores (`eas init` jamais fait) |

Paquets appliqués depuis le 15 octobre :

| Paquet | Date | Contenu |
|---|---|---|
| maj34 | 15 oct. | Espace de cours, appel à trois statuts, Mon service, Mes cours, documents de classe dans StudyLib |
| maj35 | 17 oct. | Studio quiz (migration 0044), réservations à l'administration, PR #41 à #47 (E-4, E-9, E-10, contrat des jeux, vidéo Keynote, en-têtes du Quiz), StudyLib PR #7 |
| maj36 | 17 oct. | PR #48 à #51 : séances en cours, graphiques, écrans du mot de passe, en-têtes sur `/api`, tâches périodiques |
| maj37 | 17 oct. | Même Planner que maj36 ; Quiz : nom « Quiz », titres en français, mode équipe (`--classquiz`) |
| maj38 | 18 oct. | StudyLib : page Projets sur téléphone |

Le prochain paquet est **maj39**.

## 3. Le produit aujourd'hui

**Administration** : préparation de l'année et génération automatique de l'emploi du temps (solveur), conflits, emploi du temps du mois au format de l'école, imprévus et reports, examens, réservations de salles (réservées à l'administration), suivi du réalisé et heures du mois, comptes, signalements de présence, journal de sécurité, double authentification.

**Enseignant** : tableau du jour ; **Mes classes** (la séance en cours en tête, l'appel en action principale, une carte par classe) ; l'**espace d'une classe** avec trois onglets :
- Supports : sections, dépôt de fichiers, liens, documents épinglés depuis la Bibliothèque, masquer, publier ;
- Appel : historique, corrections, export ;
- Élèves : taux de présence.

L'appel se fait par QR projeté qui change toutes les 30 s, à trois statuts. **Mon service** regroupe services, disponibilités et reports. Le **Studio quiz** permet de créer un quiz (à la main ou par l'IA) et d'ouvrir une passation par QR ou par code ; le **quiz en direct** est lancé depuis la séance (moteur ClassQuiz). Les jeux sont rangés par module ; un seul est en ligne, Terminal Linux.

**Étudiant** : tableau du jour et semaine, alertes de report et d'annulation, scan de l'appel (depuis l'application seulement, un téléphone par compte), **Mes cours** (supports de ses classes), Bibliothèque (documents, stages, projets), Quiz, agenda ICS.

**Commun** : français et anglais, thèmes Planner et StudyLib (clair et sombre), aide contextuelle (fiches par rôle), une seule connexion pour les trois espaces.

**Prix décidé** : 4,99 MAD par compte actif et par mois, tous rôles confondus, facturés à l'école, IA comprise (décisions du 11 octobre).

## 4. Ce qui a été fait du 15 au 18 octobre

| Domaine | Fait |
|---|---|
| Espace de cours | E-4 Mes classes en cartes (#45) ; E-9 épinglage depuis la Bibliothèque (#46) et renvois de StudyLib vers Planner (StudyLib #7) ; E-10 recette et fiches d'aide (#47) |
| Audit du 15 octobre | En-têtes de sécurité du Quiz (#42) ; plus de doublons d'en-têtes sur `/api` et `/biblio` (#49) ; chaque séance qui a lieu est « En cours » ; `chart.js` retiré et graphiques plus préchargés (1 317 → 998 Ko au premier chargement) ; écrans du mot de passe au style de la connexion, adresses en français, anciennes redirigées avec le jeton (#48) ; nom « Quiz » sur le site du quiz (ClassQuiz #4) |
| Défaut de production | **Tâches périodiques une à la fois** (#50) : à chaque démarrage, cinq tâches prenaient les cinq connexions de la base, qui restait bloquée 60 s (première connexion d'un utilisateur : 59,5 s ; purges quotidiennes en échec). C'était aussi la cause du parcours Playwright qui échouait au premier test |
| Mobile | Page Projets de la Bibliothèque sans débordement sur téléphone (StudyLib #8) |
| Dépôt | `Jeux_HESTIM/` retiré et ignoré (#41) |
| Jeux | Contrat d'un jeu et relecture de la branche d'Alexis (`docs/plans/jeux-pedagogiques.md`, #43) |
| Présentation | Vidéo Keynote (62 s) et discours de 3 minutes (`docs/presentation/discours-keynote.md`, #44) ; sur `video/promo`, non fusionnés : Keynote 1 min 20, Lancement (67 s, voix off), PactePromo en 16:9, 9:16 et 1:1 (`docs/presentation/video/out/`) |

## 5. Chantiers ouverts (branches non fusionnées)

| Dépôt | Branche ou PR | Qui | Contenu | État |
|---|---|---|---|---|
| Planner | `video/promo` | Chef de projet | Vidéos Lancement, Keynote 1 min 20, PactePromo, captures du 18 octobre | 13 commits ; le dépôt principal est dessus ; des fichiers modifiés non commités (`Keynote.tsx`, `composer-musique.py`, `package.json` de la vidéo) |
| Planner | `jeux-pedagogique` | Alexis | 9 simulations (Robot Route, Labo des seuils, Pilote des stocks, Tri Cyber, Requête parfaite, Nœuds réseaux, Ordonnanceur CPU, Sprint agile, Budget ERP) | Pas de PR ; 4 corrections demandées (§ 5 de `jeux-pedagogiques.md`) |
| Planner | #33 B-7 | Groupe B | Découpage de Cours, Calendrier et Affectations | Ouverte depuis le 12 octobre, aucun commit hors de `main` : à fermer ou à reprendre |
| Planner | #39 | Groupe B | Bibliothèque sans StudyLib (onglet de l'application) | Ouverte depuis le 15 octobre |
| Planner | #40 | Groupe B | Corrections des tests locaux | Ouverte depuis le 15 octobre |
| Planner | `b/offres-stage` (`../planner-integ`) | Groupe B | Écran Stages, onglet Offres de l'application | 4 commits, pas de PR |
| StudyLib | #6 `e/stages-mobile`, `e/offres-stage` | — | API de l'écran Stages, offres | Ouverte depuis le 15 octobre |
| ClassQuiz | `b/v5-style-clair` (`../ClassQuiz-b`) | Groupe B | Quiz en cartes claires, mode clair par défaut | 4 commits **non poussés** ; 8 fichiers en conflit avec le renommage « Quiz » (relancer `nom_quiz.py`, voir ClassQuiz #4) |
| ClassQuiz | #2, #3 | — | Statistique sans `game_id` ; règles du fork | Ouvertes depuis le 11 et le 12 octobre |

## 6. Ce qui reste à faire

**Avant toute présentation publique**
- Passer la recette du § 10 de `docs/recette/scenarios-de-test.md` sur le site en ligne (enseignant, étudiant, téléphone).
- Une partie d'essai du **mode équipe** du Quiz depuis deux téléphones (livré par maj37, jamais essayé en ligne).
- Préparer le quiz en direct du discours la veille et répéter (`discours-keynote.md`, § 3 et 5).
- Choisir la vidéo : Keynote (62 s, sur `main`) ou Lancement (67 s, sur `video/promo`). Le plan des jeux montre les simulations d'Alexis, pas encore en ligne.
- Renouveler les mots de passe de démonstration après la présentation (`renouveler-demo.sh`).

**Plans en cours**

| Plan | Reste |
|---|---|
| Espace de cours (`espace-de-cours.md`) | La recette en ligne |
| Studio quiz (`studio-quiz.md`) | SQ-1 à SQ-5 : joueur natif et QR dans le scanner de l'application, médias dans le stockage objet, import Moodle, lancement depuis la séance et onglet Quiz de la classe, entrée dans le sélecteur d'espaces |
| Jeux (`jeux-pedagogiques.md`) | Corrections d'Alexis puis fusion ; **l'entrée des jeux dans l'application** (scan ou module dans Mes cours) : aujourd'hui, l'écran des jeux n'a plus d'onglet |
| Assainissement (`assainissement.md`) | **A-3 sauvegardes hors du serveur** ; refonte des couleurs (définies à cinq endroits, thème StudyLib aux couleurs de Tailwind) |
| Application mobile | Construire une version (`eas init`, puis `eas build`) et la publier sur les stores ; essai complet sur téléphone depuis l'ajout de Mes cours |

## 7. Qualité

| Contrôle | État |
|---|---|
| Serveur Planner | Intégration 410/410 (17 octobre), unitaires 202/202 (18 octobre) |
| Site Planner | Unitaires 19/19, lint sans erreur (avertissements de longueur sur quelques fichiers déjà longs) |
| Application | 40/40 |
| Parcours Playwright | 11/11 sans reprise sur connexion, appel, entreRoles (deux lancements sur trois ; un échec isolé non expliqué) ; `generation` et `iiia` demandent le vrai solveur |
| StudyLib | 179/179 |
| Site du Quiz | Build OK ; `svelte-check` : 304 erreurs héritées du projet d'origine (même nombre avant nos changements) |

## 8. Points de vigilance

| Point | Pourquoi | Que faire |
|---|---|---|
| **Sauvegardes** | Pas de copie hors du serveur : une panne du disque ou du serveur perd tout | Choisir la destination (recommandation : Storage Box Hetzner dans un autre centre, avec instantanés ; ou Backblaze B2), mettre `sauvegarder.sh` en cron, faire une restauration d'essai |
| Redémarrage du serveur | « System restart required » (mises à jour du système) | Un soir, hors des heures de cours |
| FinAdminTech répond 301 au contrôle de `appliquer-maj.sh` | Le script attend 200 ; site non touché par nos paquets | Ouvrir le site une fois pour vérifier |
| Tâches périodiques | Corrigées par maj36 | Sur le serveur : `docker logs --since 1h hestim_backend 2>&1 \| grep "Operation timeout"` doit être vide après un redémarrage |
| Branche du dépôt principal | Sur `video/promo`, avec des fichiers non commités | Commiter la vidéo, revenir sur `main` (`git switch main`) avant le prochain paquet |
| Dossiers de travail | Une vingtaine, dont beaucoup fusionnés (§ 10) | Les supprimer (retirer d'abord les jonctions `node_modules`) |
| Données personnelles | Serveur en Finlande ; la CNDP (loi 09-08) encadre le transfert hors du Maroc | À faire valider par l'école |

## 9. Questions au chef de projet

1. **Sauvegardes** : Storage Box Hetzner ou Backblaze B2 ? Le compte doit être ouvert à une adresse de l'école.
2. **Pilote** proposé dans le discours : gratuit ou payant ?
3. **Vidéo** pour la présentation : Keynote ou Lancement ? Adresse à afficher, s'il en faut une (`planner.hestim.ma` n'existe pas).
4. **PR du groupe B** ouvertes depuis plusieurs jours (#33, #39, #40, StudyLib #6, ClassQuiz #2 et #3) : à reprendre ou à fermer ?
5. **Stores** : lance-t-on la publication de l'application (comptes développeur Apple et Google, à payer) ?

## 10. Repères pratiques

- **Préparer un paquet** : site construit dans PowerShell (`cd frontend; $env:VITE_API_URL="/api"; npm run build`), puis `& "C:\Program Files\Git\bin\bash.exe" deploy/vps/preparer-maj.sh majNN [--studylib] [--classquiz]`. Le site du Quiz se construit avant avec `$env:NODE_ENV="production"; npx vite build` dans `../ClassQuiz/frontend` ; StudyLib avec `npm run build` dans `../StudyLib`.
- **Appliquer** : `scp` du paquet, puis sur le serveur `cd /root && tar -xzf majNN.tar.gz && bash majNN/deploy-vps/appliquer-maj.sh /root/majNN`. Le chef de projet lance lui-même les commandes du serveur.
- **Tests locaux** : base `hestim_mysql_test_cours` sur le port 3311 (`docker start hestim_mysql_test_cours`) ; parcours sur les ports 5061, 5164, 5167 à 5169 (voir `compte-rendu-2026-10-15.md`, § 7).
- **Application** : `cd mobile; npx expo start --tunnel`, puis Expo Go sur le téléphone. Un compte étudiant se lie au premier téléphone qui scanne un QR d'appel.
- **Identifiants de démonstration** : `/root/hestim-identifiants.txt` sur le serveur, jamais dans le dépôt.
- **Dossiers de travail fusionnés, à supprimer** : `planner-hygiene`, `planner-entetes`, `planner-contrat-jeux`, `planner-keynote`, `planner-e4`, `planner-e9`, `planner-e10`, `planner-audit`, `planner-entetes2`, `planner-taches`, `planner-cr`, `planner-cr18` (après fusion de ce compte rendu), `planner-cours` (si `planner-integ` n'en dépend plus), `planner-quiz` (quand le chantier quiz le dit) ; `StudyLib-e9`, `StudyLib-prj` ; `ClassQuiz-nom`. **À garder** : `planner-integ` (`b/offres-stage`), `planner-b`, `StudyLib-cours`, `ClassQuiz-b`.
