# Étude de la pile : critères et verdicts (QUA-03)

Étude sur dossier du 13 novembre 2026 ([plan validé](qua-03-plan.md)). Elle clôt l'étude ouverte le 4 novembre (point A-4 de la revue d'architecte, P-82) : la pile actuelle est comparée à celle que proposait `docs/ecole/plan.txt` (§ 16), partie par partie, selon quatre critères. Les faits sur le code ont été relevés dans `main` (`548c19e`). Les dates de support viennent des pages citées au § 6, consultées le 13 novembre 2026.

## 1. Les critères

| Critère | Ce qu'on regarde | Mesure |
|---|---|---|
| **Coût du changement** | ce qu'il faudrait réécrire et revérifier ; le risque pour l'école en service | lignes de code et de tests, migrations, requêtes propres à l'outil |
| **Plusieurs écoles** | une base par école (D-01), contexte d'école obligatoire (D-03), migrations sur 200 bases, isolation (EP-12) | ce que l'essai du contexte (#142) et PLA-06 ont montré |
| **Exploitation** | mémoire du nouveau serveur (n8n à côté, pas de mémoire d'échange), images Docker, sauvegardes déjà en place (journaux binaires, B2) | services en plus, outils de sauvegarde à refaire |
| **Produit et équipe** | arabe de droite à gauche (EP-11), mobile rapide et hors ligne (EP-3), mises à jour sans casse (EP-9), compétences, durée de support, licences, sécurité | documentation officielle, dates de fin de support |

**Verdicts possibles** : « garder », ou « rouvrir » (la question repart en décision). Une montée de version n'est pas un changement de pile : elle est listée au § 3, sans être décidée.

## 2. Une fiche par partie de la pile

**Volume actuel**, relevé le 13 novembre :

| Partie | Volume |
|---|---|
| Serveur | environ 36 600 lignes de JavaScript, tests exclus, dont 81 modèles, 63 migrations, 52 fichiers de routes et 38 contrôleurs ; 81 fichiers de tests (plus de 270 tests unitaires et plus de 500 tests d'intégration) |
| Site | environ 42 500 lignes |
| Application mobile | environ 9 200 lignes |
| Solveur | environ 2 000 lignes de Java |
| Parcours Playwright | 25 fichiers |

### 2.1 Serveur : Node 22 et Express 4.18

- **`plan.txt` proposait** NestJS, en TypeScript.
- **Coût** : tout le serveur serait à réécrire : routes, contrôleurs, garde-fous, middleware de contexte. Il faudrait aussi reprendre une grande partie des tests d'intégration, qui appellent les routes Express.
- **Plusieurs écoles** : le contexte d'école repose sur `AsyncLocalStorage` de Node (`backend/contexte/etablissement.js`), et non sur Express. NestJS n'apporte pas de contexte d'école tout fait : il faudrait le refaire.
- **Exploitation** : rien ne change. Une image `node:22-alpine` dans les deux cas.
- **Produit et équipe** :
  - Express 4 est en maintenance depuis le 1er avril 2025, et sa fin de vie est visée « au plus tôt le 1er octobre 2026 ». Aucune date effective n'a été annoncée au 13 novembre ;
  - Express 5 est la version par défaut sur npm depuis mars 2025 ;
  - Node 22 est maintenu jusqu'au 30 avril 2027.
- **Verdict : garder.** Passer à Express 5, puis à Node 24, est une montée de version (§ 3).

### 2.2 Accès aux données : Sequelize 6.37 et mysql2

- **`plan.txt`** ne nomme pas d'outil d'accès aux données. Avec NestJS et PostgreSQL, il en faudrait un autre (TypeORM, Prisma…).
- **Coût** :
  - 81 modèles et 63 migrations sont écrits pour Sequelize ;
  - 57 requêtes SQL brutes, dont 3 seulement sont propres à MySQL (2 `GET_LOCK` et 1 `ON DUPLICATE KEY`) ;
  - la règle R-2 (#137) limite l'accès à la base à `backend/models/` : un changement futur resterait donc circonscrit à ce dossier, sans toucher aux contrôleurs.
- **Plusieurs écoles** : l'essai du contexte d'école (#142, D-03) tient avec Sequelize. Chaque école a son instance, et les modèles exportés sont des résolveurs qui prennent la connexion du contexte. C'est la base de PLA-01.
- **Exploitation** : rien à ajouter.
- **Produit et équipe : point d'attention.**
  - Sequelize 7 est toujours en alpha (`@sequelize/core` 7.0.0-alpha.48, février 2026).
  - Le README de la 6.37.8 cherche de nouveaux mainteneurs.
  - Une source secondaire signale un an sans version 6 (de mars 2025 à mars 2026).
  - La version 6.37.8, celle du dépôt, corrige une faille de gravité haute des versions précédentes.
- **Verdict : garder, sous surveillance.** Changer d'outil maintenant coûterait plus que le risque, puisque R-2 borne le coût d'un changement futur. Les conditions de réouverture sont au § 5 (point 2).

### 2.3 Base : MySQL 8.4.13

- **`plan.txt` proposait** PostgreSQL.
- **Coût** :
  - les 63 migrations, à revérifier ;
  - les 3 requêtes propres à MySQL ;
  - les scripts de sauvegarde (`deploy/vps/sauvegarder.sh`, `sauvegarder-journaux.sh`, journaux binaires toutes les 15 minutes, B2), avec leur essai de restauration ;
  - la reprise des données d'HESTIM.
- **Plusieurs écoles** : MySQL fait une base par école sans réglage particulier, et PLA-06 la mesure sur 200 bases. PostgreSQL permettrait aussi un schéma par école, mais D-01 ne le demande pas.
- **Exploitation** : la base passe à MySQL 8.4 depuis le 1er novembre (ME-0e), et les sauvegardes sont essayées. Changer de base obligerait à refaire EXP-04.
- **Produit et équipe** : MySQL 8.4 LTS a un support premier jusqu'au 30 avril 2029 et un support étendu jusqu'au 30 avril 2032.
- **Verdict : garder, si D-01 tient** (PLA-06, § 5, point 1).

### 2.4 Site : React 19 et MUI 7

- **`plan.txt` proposait** Tailwind à la place de MUI. Il gardait React.
- **Coût** : environ 42 500 lignes d'écrans construits sur les composants et le thème de MUI, avec le socle neutre conçu dans UIX-01.
- **Plusieurs écoles** : sans effet direct. Le thème par école passe par le thème de MUI.
- **Exploitation** : rien ne change. Un site statique servi par nginx.
- **Produit et équipe** :
  - MUI décrit officiellement l'écriture de droite à gauche : `direction: 'rtl'` dans le thème et le module `@mui/stylis-plugin-rtl`. Il n'est pas encore installé : c'est UIX-01 qui le prouvera ;
  - MUI 7 (mars 2025) est la ligne de support long, avec les correctifs de sécurité et de régression ; la version courante est la 9 ;
  - `i18next` est déjà en place sur le site et le mobile.
- **Verdict : garder.**

### 2.5 Application mobile : Expo 57 et React Native 0.86

- **`plan.txt`** ne proposait pas d'autre outil. Il demandait une application qui marche hors ligne.
- **Coût** : environ 9 200 lignes et 16 fichiers de tests.
- **Plusieurs écoles** : sans effet direct. L'application suit l'école de son compte.
- **Exploitation** : les builds passent par Expo. Rien sur le serveur.
- **Produit et équipe** :
  - le stockage local (`async-storage`, `expo-file-system`) est déjà présent, de quoi lire l'emploi du temps hors ligne (MOB-06, EP-3) ;
  - Expo publie trois SDK par an et soutient chacun environ un an : il faut monter chaque année.
- **Verdict : garder.** Montées annuelles (§ 3).

### 2.6 Solveur : Java 21, Spring Boot 3.3.5 et Timefold 1.15.0

- **`plan.txt` proposait** OR-Tools en Python, derrière FastAPI.
- **Coût** : environ 2 000 lignes de Java et 9 fichiers de tests. Côté serveur, il y a aussi `services/generation/timefold/`.
- **Plusieurs écoles** : sans effet. Le solveur ne garde aucune donnée et reçoit tout par requête.
- **Exploitation** : le solveur est limité en mémoire (640 Mo sur le serveur provisoire) et n'est **jamais exposé** : seul le serveur l'appelle, sur le réseau interne, avec un jeton et en lecture seule (`docker-compose.yml`).
- **Produit et équipe** : trois faits datés.
  - **Spring Boot 3.3** n'a plus de support libre depuis le 30 juin 2025 (dernière version : 3.3.13). La 3.5 l'a perdu à son tour le 30 juin 2026. Il faut passer à la ligne 4.
  - **Timefold 1.x** est en maintenance : la 1.31 est sa dernière version de fonctions. Des correctifs trimestriels sont annoncés **pendant 2026** seulement.
  - Timefold 2.0 (avril 2026) passe à Java 21, déjà en place. Il fait passer l'analyse du score (`ScoreAnalysis`, qu'utilise le solveur) dans une édition payante. Les sources de Timefold se contredisent sur le nom de cette édition, « Plus » ou « Enterprise ».
- **Verdict : garder jusqu'à MOT-04.** Le choix entre Timefold et CP-SAT (l'OR-Tools de `plan.txt`) se tranche par la mesure dans MOT-04 (Q-05, décision du 3 novembre), et non dans QUA-03. Le fait nouveau : la fin de Timefold 1.x n'est pas « début 2027 », comme le note Q-05, mais **la fin de 2026**. Et Spring Boot 3.3 est déjà sans support. Montées au § 3.

### 2.7 Authentification : JWT maison (jsonwebtoken 9, bcryptjs, helmet)

- **`plan.txt` proposait** Keycloak.
- **Coût** : il faudrait reprendre les comptes, les rôles, la connexion du site et du mobile, la réinitialisation des mots de passe et les jetons du solveur.
- **Plusieurs écoles** : Keycloak demanderait un « realm » ou une organisation par école, en plus de la base de l'école. La connexion actuelle passe déjà par le contexte d'école.
- **Exploitation** : Keycloak est un service Java de plus, avec sa propre base, sur un serveur sans mémoire d'échange qui accueille déjà n8n.
- **Produit et équipe** : aucune école n'a demandé de connexion unique (OIDC, SAML) à ce jour.
- **Verdict : garder.** Condition de réouverture au § 5, point 6.

### 2.8 Ce que `plan.txt` ajoutait : TypeScript et BullMQ

- **TypeScript** : `plan.txt` le liait à NestJS. Le passer à tout le code ne se décide pas ici. Une adoption progressive (vérification par JSDoc, nouveaux fichiers) reste possible sans changer la pile. C'est noté, pas décidé.
- **BullMQ**, avec Redis : les tâches périodiques tournent aujourd'hui sous un verrou MySQL nommé (`backend/services/taches/periodiques.js`, `GET_LOCK`), sans Redis. **Verdict : garder.** La conception de COM-01 (service d'envoi commun, plages de silence) dira si un envoi en masse demande une file d'attente (§ 5, point 5).

## 3. Les montées de version (listées, non décidées)

| Outil | Dans le dépôt | Ligne suivante | Fin de support de la version actuelle | Effort estimé | Remarque |
|---|---|---|---|---|---|
| Spring Boot | 3.3.5 | 4.x | support libre fini le 30 juin 2025 | M | **la plus pressante** ; le risque est réduit parce que le solveur n'est pas exposé ; compatibilité avec Timefold 1.x à vérifier |
| Timefold | 1.15.0 | 1.31 (dernière 1.x), puis 2.x | correctifs annoncés pendant 2026 | S pour la 1.31 ; la 2.x relève de MOT-04 | passer à la 1.31 avant tout passage à la 2.x (procédure officielle) |
| Node | 22 | 24 LTS | 30 avril 2027 | S | images Docker et CI (`NODE_VERSION`) |
| Express | 4.18 | 5.x | en maintenance depuis le 1er avril 2025 ; fin visée au plus tôt le 1er octobre 2026, non annoncée | M | syntaxe des chemins, erreurs des fonctions asynchrones ; 52 fichiers de routes |
| Sequelize | 6.37.8 | 7 (alpha) | aucune annoncée | — | rester sur la 6 ; surveiller (§ 5, point 2) |
| MUI | 7 | 9 | 7 = ligne de support long | M | à placer avec UIX-01 ou après |
| Expo et React Native | SDK 57, RN 0.86 | SDK suivant | environ un an par SDK | S à M par an | montée annuelle |
| MySQL | 8.4.13 | — | 30 avril 2029 (premier), 30 avril 2032 (étendu) | — | rien à faire |
| Java (Temurin) | 21 | — | 31 décembre 2029 (selon les relevés de tiers ; date d'Adoptium à confirmer) | — | rien à faire |

## 4. Verdict d'ensemble

**Garder la pile actuelle, si D-01 tient à la mesure de PLA-06.** Aucune partie ne reçoit le verdict « rouvrir ».

- La pile de `plan.txt` coûterait la réécriture presque complète du serveur, de ses tests et des sauvegardes.
- Elle n'apporte rien que D-01, D-03 ou les exigences produit demandent.
- Elle ajoute deux services (Keycloak et Redis) sur un serveur à la mémoire comptée.

Deux faits demandent une action, sans changer la pile :
1. **Spring Boot 3.3 est sans support libre**, et **Timefold 1.x ne sera plus corrigé après 2026**. MOT-04 et la montée du solveur deviennent plus urgentes que ne le disait Q-05.
2. **Sequelize** est maintenu par une petite équipe, et sa version 7 n'arrive pas. On le garde parce que R-2 borne le coût d'un changement futur, mais on le surveille.

**Ligne proposée pour `docs/plan/decisions.md`** (section 2) :

> 13 nov. | **La pile est confirmée** (QUA-03, [pile.md](../conception/qualite/pile.md)) : Express, Sequelize, MySQL 8.4, React et MUI, Expo, Timefold et Java 21, JWT. La pile de `plan.txt` reste écartée. Confirmation **sous condition que D-01 tienne** (PLA-06). Montées à prévoir, non décidées : Spring Boot 4 (support libre de la 3.3 fini), Timefold 1.31 puis MOT-04, Node 24, Express 5. Conditions de réouverture : § 5 de la page | la décision du 4 novembre (« l'étude se clôt dans QUA-03 »)

## 5. Conditions de réouverture

La question de la pile se rouvre, partie par partie, si l'un de ces faits se produit :

| N° | Fait observable | Partie rouverte | Qui le voit |
|---|---|---|---|
| 1 | **D-01 tombe** à la mesure de PLA-06 (seuils du 10 novembre non tenus) | base et accès aux données | PLA-06 |
| 2 | Sequelize 6 a une **faille haute ou critique sans correctif** 60 jours après sa publication, ou il est **déclaré en fin de vie** sans version 7 stable | accès aux données (dans `backend/models/`, grâce à R-2) | `npm audit` dans la CI |
| 3 | Un outil arrive à sa **fin de support sans montée possible** (par exemple, Express 4 en fin de vie, et le passage à Express 5 bloqué) | la partie concernée | revue des montées (§ 3) |
| 4 | Une **exigence produit ne peut pas être tenue** avec l'outil : droite à gauche avec MUI (UIX-01, EP-11), hors ligne avec Expo (MOB-06, EP-3), génération d'un collège de 600 élèves en moins de 10 minutes (MOT-02, MOT-04, EP-10) | la partie concernée | la fonction qui le constate |
| 5 | La conception de **COM-01** montre que les envois ne tiennent pas sous le verrou MySQL des tâches périodiques | files d'attente (BullMQ ou autre) | COM-01 |
| 6 | Une école **exige une connexion unique** (OIDC, SAML), ou une règle légale demande une authentification que la connexion actuelle ne peut pas offrir | authentification (Keycloak ou bibliothèque OIDC) | VEN-02, entretiens |

## 6. Sources (consultées le 13 novembre 2026)

- Express :
  - [Express 5.1 par défaut sur npm, calendrier de support long](https://expressjs.com/2025/03/31/v5-1-latest-release) ;
  - [annonce de la version 5](https://expressjs.com/en/blog/2024-10-15-v5-release) ;
  - [endoflife.date : Express](https://endoflife.date/express).
- Node : [endoflife.ai : Node 22](https://endoflife.ai/nodejs/22) ; calendrier officiel `nodejs/Release`.
- Sequelize :
  - [politique de versions](https://sequelize.org/releases/) ;
  - [Sequelize 7 (alpha)](https://sequelize.org/v7/) ;
  - [README de la 6.37.8](https://cdn.jsdelivr.net/npm/sequelize@6.37.8/README.md) ;
  - [Open Collective, versions](https://opencollective.com/sequelize/updates).
- MySQL :
  - [endoflife.date : MySQL](https://endoflife.date/mysql) ;
  - [versionlog : MySQL 8.4](https://versionlog.com/mysql/8.4/) ;
  - [Percona : MySQL 8.4 LTS](https://www.percona.com/blog/whats-new-in-mysql-8-4-lts-key-enhancements-explained/).
- MUI :
  - [politique de support](https://mui.com/getting-started/support/) ;
  - [droite à gauche](https://mui.com/guides/right-to-left/) ;
  - [droite à gauche (v7)](https://v7.mui.com/material-ui/customization/right-to-left.md).
- Expo :
  - [versions du SDK](https://docs.expo.dev/versions/latest/) ;
  - [anciennes versions du SDK](https://github.com/expo/fyi/blob/main/outdated-sdk-versions.md).
- Spring Boot :
  - [Spring Boot 3.3.13, fin du support libre de la 3.3](https://spring.io/blog/2025/06/19/spring-boot-3-3-13-available-now/) ;
  - [politique de support de Spring](https://spring.io/blog/2025/02/13/support-policy-updates).
- Timefold :
  - [Timefold Solver 2.0 publié](https://timefold.ai/blog/timefold-solver-2.0-release) ;
  - [Introducing Timefold Solver 2.0](https://timefold.ai/blog/introducing-timefold-solver-2-0) ;
  - [passage depuis la 1.x](https://docs.timefold.ai/timefold-solver/latest/upgrading-timefold-solver/upgrade-from-v1) ;
  - [éditions commerciales](https://docs.timefold.ai/timefold-solver/latest/commercial-editions/commercial-editions).
- Java : [support d'Adoptium (Temurin)](https://adoptium.net/support) ; [endoflife.date : Temurin](https://endoflife.date/eclipse-temurin).

Les dates venant de sites tiers ou commerciaux (endoflife.ai, versionlog, éditeurs de support étendu) sont recoupées entre plusieurs sources. Une date encore incertaine est dite comme telle dans le texte.
