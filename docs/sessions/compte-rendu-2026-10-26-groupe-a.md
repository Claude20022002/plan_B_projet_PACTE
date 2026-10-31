# Compte rendu de la session du groupe A, 26 octobre 2026

À lire en début de la prochaine session du groupe A, avec le plan de développement validé (`docs/plans/planner-multi-etablissements/15-plan-de-developpement.md`) et la revue d'expert (`16-revue-expert.md`). Les règles de travail et de code restent celles de `docs/plans/assainissement.md`, § 6, et du § 15.6 du plan.

## 1. L'essentiel

1. **`main` ne démarre plus** depuis la fusion de #122 : les marqueurs de conflit (`<<<<<<<`, `=======`, `>>>>>>>`) ont été commités dans `backend/models/index.js`. Le correctif est la **PR #128** ; rien n'est en production (toujours maj43). **Premier geste de la session : vérifier que la CI de #128 est verte (« Test Backend »), puis la fusionner.**
2. **La vague V0 est fusionnée** (sauf les écrans de B) : ME-17 désactivation (#120), ME-18 année des groupes (#121), ME-1 et ME-11 identité de l'école (#122), sauvegardes complètes (#125), réparation de la CI (#124), plan (#123).
3. **Le plan de développement (fichier 15) est validé** avec les corrections R-1 à R-5 de la revue (§ 4). Une personne par groupe : **école pilote ouverte entre fin janvier et mi-février 2027**.
4. **ME-0e (MySQL 8.4.13) est prêt** : PR **#127**, à fusionner **seulement après la mise en ligne de maj44** (§ 3).
5. **maj44 est à préparer** dès que #128 est fusionnée, avec **reconstruction de l'image du backend** (dépendances changées).

## 2. Fait le 26 octobre

| PR | Branche | Contenu | État |
|---|---|---|---|
| #120 | `a/me17-desactivation` | Désactivation des comptes, migration 0053 ; ajout : aperçu d'un lot (`GET /api/users/desactivations/apercu`) et rétablissement d'un lot (`POST /api/users/reactivations`) | fusionnée |
| #121 | `a/me18-annees` | `Groupe.id_annee`, migration 0054, `groupesDeLAnnee` ; ajout : filtre `?id_annee` sur `GET /api/groupes` et `/arbre` | fusionnée |
| #122 | `a/identite-ecole` | Identité et marque de l'école, migration 0055 | fusionnée, **avec les marqueurs de conflit** |
| #123 | `a/plan-multi-etablissements` | Plan 01 à 16, conception V0 du groupe B, fichier 15 validé | fusionnée |
| #124 | `a/ci-reparation` | CI sur Ubuntu 24.04 (Playwright 1.59.1 ne gère pas 26.04) ; body-parser 1.20.9 et nodemailer 10.2.1 (audit) | fusionnée |
| #125 | `a/sauvegardes-cle-publique` | ME-0a : chiffrement pour une clé publique, fichiers MinIO et quiz, journaux binaires toutes les 15 min, retour à une heure précise, essai mensuel | fusionnée |
| #127 | `a/me0e-mysql84` | ME-0e : `mysql:8.4.13`, répétition serveur, procédure de passage et de retour arrière | **ouverte, attendre maj44** |
| #128 | `a/correctif-conflit-modeles` | Marqueurs de conflit retirés ; version du logo toujours nouvelle ; préavis au nom de l'école ; test TOTP à jour | **ouverte, à fusionner en premier** |

Relu pour le groupe B : **#126** (`b/me17-ecrans`, écrans de la désactivation). Commentaire publié sur la PR ; quatre reprises demandées : aperçu avant de désactiver un groupe (route ajoutée par A), bouton « Défaire » (route ajoutée), libellés des six nouveaux événements du journal (`journalSecurite.evenements`), confirmation tapée pour l'anonymisation. Sa base est maintenant `main`.

Vérifié avant chaque PR : intégration complète (492/492 sur #128), unitaires (225/225), lint, `verifier:neutre`, construction du site. Les sauvegardes et MySQL 8.4 ont été essayés pour de vrai, sur des conteneurs jetables (détail dans `DEPLOIEMENT.md`).

## 3. Ordre de travail de la prochaine session

1. **#128** : CI verte, puis fusion. Vérifier ensuite `git grep -n -E "^(<<<<<<<|>>>>>>>) " origin/main` (aucune ligne attendue).
2. **maj44** : dans un dossier neuf (`npm ci`, jamais les `node_modules` existants), site construit depuis PowerShell avec `VITE_API_URL=/api`, `preparer-maj.sh` dans Git Bash. **`backend/package-lock.json` a changé** : reconstruire l'image du backend (« Quand les dépendances changent », `DEPLOIEMENT.md`). Migrations 0053, 0054, 0055. Lire `VERSION` du paquet avant de dire qu'il est prêt.
3. **Sur le serveur, après maj44** (le chef de projet applique) : mettre en place les sauvegardes complètes selon `DEPLOIEMENT.md`, « Sauvegarde quotidienne » (journaux binaires, fichiers MinIO, verrouillage B2) ; premier essai de restauration écrit dans `docs/recette/essais-restauration.md`.
4. **ME-0e** : `bash /opt/hestim/deploy/vps/essayer-mysql84.sh` sur le serveur (sans arrêt) ; si « RÉPÉTITION RÉUSSIE », fusionner #127, puis le passage un dimanche matin (`DEPLOIEMENT.md`, « Passer à MySQL 8.4 »), **séparé de maj44**.
5. **V1 du groupe A** (fichier 15, § 15.5) : essai réduit de ME-3a et règle de lint sur `config/db.js` (R-2, 33 fichiers à figer en exceptions), ME-0b (déploiement en une commande), ME-21 (supervision), ME-14a (mesure du solveur), ME-0c (ClassQuiz derrière une fonctionnalité).

## 4. Décisions du 26 octobre (chef de projet)

- Fichier 15 **validé avec la revue**. Retenues : **R-1** (V3 allégée : ME-15 et ME-19 « après l'ouverture », ME-25 seulement si l'école pilote a des campus dissociés, ME-2b réduit en V2 et complet en V4), **R-2** (essai ME-3a et lint en V1), **R-3** (lot **ME-27**, installation de l'école pilote), **R-4** (revue de sécurité par A de EC-2 et EC-3).
- **R-5 : une personne par groupe** (plein temps supposé) ; calendrier au § 15.8. En V3, c'est le groupe B qui fixe la date.
- **Non retenues** : R-6 (sauvegardes à clé publique), R-7 (politique de contenu CSP), R-8 (dossier CNDP maintenant). Le code de R-6 est pourtant fusionné (#125) : il ne s'active que si `CLE_PUBLIQUE` est réglé sur le serveur ; sans ce réglage, l'ancien mode par phrase continue. **À faire trancher** : activer la clé publique ou non.
- Le groupe A commence V1 par **ME-0e**.

## 5. Incidents et leçons

| Incident | Cause | Règle |
|---|---|---|
| Marqueurs de conflit dans `main` | conflit de #122 résolu à la main et commité sans retirer les marqueurs ; fusion sans attendre la CI | fusionner une PR **seulement avec « Test Backend » vert** ; proposé : règle de protection « Require status checks » sur `main` (réglage du chef de projet) |
| CI rouge sur toutes les PR | GitHub a passé `ubuntu-latest` en 26.04 ; faille publiée dans body-parser | machines fixées en `ubuntu-24.04` ; lire `npm audit` à chaque échec de « Test Backend » |
| Parcours `iiia` et `report` rouges depuis le 25 octobre | données de test qui suivent la date du jour (`donneesIiia.mjs`) contre dates fixes (`report` au 11 janvier 2027) ; `iiia` lit le mois en cours au lieu de `?mois=` | à corriger par le groupe B (ME-0d) ; non bloquant pour les fusions de A |
| Version du logo identique | colonne `logo_maj_le` à la seconde | corrigé dans #128 (`dateSuivante`) |
| Mesures MySQL fausses sur le PC | sous Windows, un `mysql.cnf` monté est vu « modifiable par tous » et **ignoré** | copier le fichier dans le conteneur (`docker cp`) pour mesurer ; le serveur Linux n'est pas concerné |
| `mysqlbinlog` absent | les images `mysql:8.0` et `mysql:8.4` ne le contiennent pas | outil : `mysql:8.0-debian` (8.0), `percona/percona-server:8.4` (8.4) |
| Solveur des parcours coupé entre groupes | conteneur `hestim-solveur-parcours` à nom fixe, supprimé au démarrage de chaque série | signalé au groupe B ; ne jamais le supprimer s'il tourne sur le port de B (8090) |
| Commande bloquée par Claude Code | un `sh -c` contenant une suppression n'est pas analysable | écrire les suppressions avec des noms en clair, sans script intérieur |

## 6. Questions ouvertes

- **R-6** : activer le chiffrement à clé publique sur le serveur (code fusionné) ou rester sur la phrase ?
- **Q-25** : quelle école pilote ? A-t-elle des campus dissociés (ME-25 avant ou après l'ouverture) ?
- **Q-23** : hébergement de l'école pilote (Hetzner ou Maroc) : effort de ME-27.
- **Q-27** : deuxième personne autorisée sur la production.
- **EC-2** : les devoirs sont-ils nécessaires le jour de l'ouverture ? Sinon, le jalon avance d'environ une semaine.
- Règle de protection de `main` (« Require status checks ») : à activer ?
- `app.json` : nom et identifiant de l'application dans les stores.

## 7. Dossiers de travail (`Github Project\travaux-planner\`)

| Dossier | Branche | Suite |
|---|---|---|
| `correctif-conflit-modeles` | `a/correctif-conflit-modeles` | garder jusqu'à la fusion de #128 |
| `me0e-mysql84` | `a/me0e-mysql84` | garder jusqu'à la fusion de #127 |
| `compte-rendu-26` | `a/compte-rendu-2026-10-26` | ce compte rendu |
| `ci-reparation`, `me17-desactivation`, `me18-annees`, `identite-ecole`, `sauvegardes-cle-publique`, `plan-multi-etablissements` | fusionnées | à supprimer : `git worktree remove --force ..\travaux-planner\<dossier>` depuis `plan_B_projet_PACTE` (leurs `node_modules` sont de vrais dossiers, pas des jonctions) |

Tests locaux du groupe A : MySQL de test `hestim_mysql_test_cours` sur le port **3311** (mot de passe `test_root`), une base par série (`<chantier>_test`), supprimée après. Ports des parcours du groupe A : API 5011, site 5184, solveur 8091 (B : 5001, 5174, 8090). La suite d'intégration complète prend 10 à 15 minutes sur ce poste ; un dépassement de délai isolé dans un `beforeAll` (`resetDatabase`) vient de la lenteur du MySQL de test : relancer la suite seule avant de conclure.
