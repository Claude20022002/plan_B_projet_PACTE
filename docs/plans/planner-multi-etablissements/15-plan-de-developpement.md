# 15. Plan de développement pour deux équipes

Statut : **validé par le chef de projet le 26 octobre 2026**, avec les corrections retenues de la revue d'expert (fichier 16, § 16.5 : R-1 à R-4 ; R-5 : une personne par groupe). Elles sont reportées ci-dessous : jalon pilote allégé (§ 15.5, V3 et « Après l'ouverture »), essai du contexte et règle de lint dès V1, lot ME-27 (installation de l'école pilote), revue de sécurité de EC-2 et EC-3 par A, calendrier (§ 15.8).

Ce fichier répartit les lots des fichiers 09, 11 et 14 entre les deux groupes, en six vagues. Chaque vague se termine par un jalon qu'on peut montrer. Le premier objectif est une **école pilote ouverte sur sa propre installation** (vague 3) ; la plateforme commune à plusieurs écoles vient ensuite (vagues 4 et 5). C'est le découpage en tranches du § 12.11, appliqué.

## 15.1 Les deux équipes

| | Groupe A | Groupe B |
|---|---|---|
| Périmètre | Serveur (API, base, migrations), solveur, déploiement, sauvegardes, supervision, Plateforme, documentation technique | Site (React), application mobile (Expo), dossier `shared`, parcours Playwright, textes et accessibilité |
| Préfixe des branches | `a/<lot>` | `b/<lot>` |
| Possède aussi | Les contrats d'API (routes, codes d'erreur, tests d'intégration) | Les fonctions enseignant du fichier 14 (lots EC), **de bout en bout**, serveur compris (§ 15.4) |

L'équipe jeux (Alexis) suit son propre contrat (`docs/plans/jeux-pedagogiques.md`) ; elle apparaît ici seulement là où elle touche A ou B.

## 15.2 Où on en est (26 octobre 2026)

| Lot | État | Ce qui reste |
|---|---|---|
| ME-0a Sauvegardes hors serveur | B2 en service, restauration d'essai réussie ; code de la clé publique, des fichiers MinIO et quiz, des journaux binaires toutes les 15 min et de l'essai mensuel dans la PR #125 | Fusion, puis mise en place sur le serveur (`DEPLOIEMENT.md`) ; clé sans droit d'effacer |
| ME-1 et ME-11 Identité de l'école | PR #122, migration 0055, tests verts | Fusion après #120 (conflit d'une ligne) ; grille horaire du PDF tirée des créneaux |
| ME-17 Désactivation | Serveur : PR #120, migration 0053, aperçu et rétablissement des lots ajoutés le 26 octobre. Écrans : PR #126 (B), relue | Fusion ; reprises de #126 (aperçu du lot, « Défaire », libellés du journal, confirmation de l'anonymisation) |
| ME-18 Année des groupes | Serveur : PR #121, migration 0054, filtre `?id_annee` sur les groupes | Fusion ; sélecteur d'année de l'administration (B) |
| CI | PR #124 : machines Ubuntu 24.04, failles de body-parser et nodemailer | Fusion ; parcours `iiia` et `report` rouges depuis le 25 octobre (dates des données de test, ME-0d) |
| Plan, fichiers 01 à 14 | Validé le 24 octobre ; fichier 15 validé le 26 octobre avec la revue (fichier 16) | — |

Effort restant estimé : **environ 132 jours-personne bruts** (S = 0,5 j, M = 2 j, L = 5 j), soit **200 à 265 jours-personne réels** avec la règle d'expérience de 1,5 à 2 fois plus (§ 12.7). Avec une personne par groupe, cela fait plusieurs mois : calendrier au § 15.8.

## 15.3 Vue d'ensemble

```mermaid
flowchart LR
    subgraph GA["Groupe A : serveur"]
        A0["V0 Livrer<br/>maj44, fin de ME-0a"]
        A1["V1 Fondations<br/>ME-0e, ME-0b, ME-21, ME-14a,<br/>essai ME-3a et règle de lint"]
        A2["V2 Mise en place<br/>ME-2a, ME-2b réduit, ME-9,<br/>ME-25 si campus dissociés"]
        A3["V3 Pilote<br/>ME-10, ME-22, ME-24, ME-27"]
        A3b["Après l'ouverture<br/>ME-15, ME-19"]
        A4["V4 Isoler<br/>ME-2b complet, ME-2d, ME-3a, ME-3b,<br/>ME-4, ME-5, ME-6"]
        A5["V5 Plusieurs écoles<br/>ME-7, ME-8, ME-12 à ME-14, ME-16, ME-20"]
        A0 --> A1 --> A2 --> A3 --> A3b --> A4 --> A5
    end
    subgraph GB["Groupe B : site et application"]
        B0["V0 Livrer<br/>écrans ME-17, sélecteur ME-18"]
        B1["V1 Fondations<br/>ME-0d, ME-0c, EC-1, EC-5, EC-9, EC-11"]
        B2["V2 Mise en place<br/>ME-2c panneau, écrans ME-9 et ME-25, EC-6, EC-8"]
        B3["V3 Pilote<br/>ME-10 assistant, ME-26, EC-2"]
        B3b["Après l'ouverture<br/>écrans ME-19"]
        B4["V4 Isoler<br/>console ME-4, EC-4, EC-7, EC-3"]
        B5["V5 Plusieurs écoles<br/>ME-8 choix de l'école, ME-12, ME-20"]
        B0 --> B1 --> B2 --> B3 --> B3b --> B4 --> B5
    end
    A2 -. "API d'import et des réglages" .-> B2
    A3 -. "API de l'assistant" .-> B3
    A3b -. "API de la clôture" .-> B3b
    A4 -. "API de la Plateforme" .-> B4
    A5 -. "jetons de la Plateforme" .-> B5
    A3 --> P(("Jalon : école pilote ouverte"))
    B3 --> P
    P --> A3b
```

Les flèches en pointillé sont les passages de relais : A livre la route et ses tests d'intégration, B construit l'écran dessus. Pour ne pas attendre, B commence chaque vague par les maquettes et les parcours, sur une route simulée dont A a figé le contrat.

## 15.4 Équilibrer la charge

| Vague | Groupe A (jours bruts) | Groupe B (jours bruts) |
|---|---|---|
| V0 Livrer | 3 | 3 |
| V1 Fondations | 11 | 5,5 |
| V2 Mise en place | 11,5 (8,5 sans ME-25) | 9,5 |
| V3 École pilote | 7 | 10,5 |
| Après l'ouverture | 5 | 2 |
| V4 Isoler | 23 | 10,5 |
| V5 Plusieurs écoles | 20 | 10 |
| **Total** | **80,5** | **51** |

Changements du 26 octobre (revue, R-1 à R-3) : V1 gagne l'essai du contexte (M) et la règle de lint (S) ; V2 perd ME-2b complet (L, passé en V4) au profit d'une version réduite (S), et ME-25 ne se fait que si l'école pilote a des campus dissociés ; V3 perd ME-15 et ME-19 (après l'ouverture) et gagne ME-27 (M, L si l'hébergement est au Maroc). Le chemin du jalon pilote passe, pour A, de 37,5 à 32,5 jours bruts (29,5 sans ME-25).

Le groupe A est le **chemin critique** : la mise en place, l'isolation et les comptes communs sont du travail de serveur. Trois mesures pour que B n'attende pas :

1. **Les lots EC (fichier 14) sont portés entièrement par B**, serveur compris : ce sont des fonctions isolées (une table, quelques routes, leurs écrans), sans effet sur l'isolation ni sur le solveur. A relit les migrations, et **fait une revue de sécurité obligatoire de EC-2 (rendus de fichiers) et EC-3 (notes officielles)** avant leur fusion (R-4) : type réel du fichier lu dans ses octets, taille et quota par école, analyse antivirus, adresses signées de courte durée, préfixe par établissement, journal des accès ; pour EC-3, verrouillage après jury et historique de chaque note.
2. **B prend les tests d'isolation côté parcours** (ME-6) et la console de la Plateforme (ME-4).
3. Si A prend plus de deux semaines de retard sur une vague, **B passe une partie de son temps dans A** pour la vague suivante, sur un lot sans solveur (ME-9, ME-16 ou ME-20). Avec une seule personne par groupe (R-5), cela retarde d'autant les lots de B : le chef de projet arbitre.

## 15.5 Les vagues en détail

### V0 · Livrer ce qui est fait

Jalon : **maj44 en ligne** (migrations 0053, 0054, 0055), HESTIM inchangée à l'écran sauf le panneau « Identité et marque ».

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-1, ME-11, ME-17, ME-18 | Ouvrir les trois PR, relecture croisée, paquet maj44, mise en ligne | S |
| A | ME-0a | Journaux binaires toutes les 15 min hors serveur, MinIO, clé B2 sans droit d'effacer, essai de restauration mensuel écrit | M |
| A | ME-17 | Libellés des 5 nouveaux événements du journal de sécurité | S |
| B | ME-17 | Écrans : aperçu avant désactivation (séances futures, services), date programmée, préavis, désactivation en lot, réactivation | M |
| B | ME-18 | Sélecteur d'année de l'administration | S |
| B | ME-11 | Essai de l'application sur un vrai téléphone avec une identité de démonstration | S |

### V1 · Fondations

Jalon : **MySQL 8.4 en production, déploiement en une commande, alertes en place, mesure du solveur écrite.**

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-0e | MySQL 8.0 → 8.4, essayé d'abord sur une copie de la base de HESTIM | M |
| A | ME-0b | Une commande de déploiement qui remplace `preparer-maj.sh` et `appliquer-maj.sh` | M |
| A | ME-21 | Sonde extérieure, alertes par courriel et téléphone, page d'état | M |
| A | ME-14a | Mesure du solveur sur 20 000 étudiants de démonstration : dit si les universités sont visées la première année | M |
| A | ME-0c | ClassQuiz derrière une fonctionnalité par établissement (serveur) | S |
| A | ME-3a (essai) | Essai réduit du contexte d'établissement (R-2) : un résolveur de modèles, `AsyncLocalStorage`, trois routes, une transaction, un crochet de modèle, deux bases de test. Dit tôt si D-03 tient ou s'il faut l'injection explicite. **Fait le 29 octobre : D-03 tient** (fichier 17) | M |
| A | Lint | Règle `no-restricted-imports` sur `config/db.js` et sur l'import direct d'un modèle par un autre, avec la liste des exceptions actuelles figée (33 fichiers le 26 octobre) : la dette ne grossit plus | S |
| B | ME-0d | Parcours `cours.spec` fiable, parcours complets verts dix fois sur dix | S |
| B | ME-0c | ClassQuiz masqué dans les écrans quand la fonctionnalité est éteinte | S |
| B | ME-1 | Grille horaire du PDF de l'emploi du temps tirée des créneaux de l'école | S |
| B | EC-1, EC-5, EC-9, EC-11 | Dates d'ouverture des supports, annonces de l'enseignant, sondage, lien de visioconférence | 4 × S |
| B | ME-10 | Conception de l'assistant : maquettes et parcours, sans code | M |

### V2 · Une école se configure seule

Jalon : **une personne qui ne connaît pas Planner règle une école de démonstration depuis le panneau et ses fichiers Excel**, sans aide.

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-2a | Nomenclatures (types de salle, équipements, rythmes, pôles…) ; le problème envoyé au solveur reste identique | L |
| A | ME-2b réduit | Pour le pilote (R-1) : un changement structurel (grille, calendrier, règle dure) est refusé une fois des séances générées, avec un message qui dit quoi faire. Le lot complet (aperçu, appliquer, annuler) passe en V4 | S |
| A | ME-9 | Moteur d'import (zone de préparation, contrôles V-01 à V-15, tout ou rien) ; les imports actuels passent par lui | L (A : 3 j) |
| A | ME-25 | Sites indépendants (campus dissociés) : règle dure du solveur, envois filtrés par site. **Seulement si l'école pilote a des campus dissociés** (Q-25) ; sinon après l'ouverture | L (A : 3 j) |
| B | ME-2c | Panneau de configuration : une entrée « Configuration », ses sections, recherche, aperçu, « Appliquer », « Annuler ce changement », modèle Excel par section | M |
| B | ME-9 | Écrans de l'import : correspondance des colonnes, aperçu, erreurs ligne par ligne | M |
| B | ME-25 | Sélecteur de site à partir de deux sites, choix « campus associés » ou « dissociés » dans le panneau | S |
| B | EC-6 | Commentaires sous un support, visibles de la classe ou de l'enseignant seul | M |
| B | EC-8 | « Vu » sur un support, taux par étudiant | M |

### V3 · École pilote prête

Jalon : **l'école pilote ouvre sur sa propre installation**. Conditions : Q-25 tranchée (quelle école), contrats signables (ME-23, chef de projet et juriste), test d'intrusion sans défaut grave ouvert.

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-10 | Assistant de démarrage (serveur) : modèles d'établissement, calendriers marocain et français | L (A : 2 j) |
| A | ME-24 | Offre d'IA : enveloppe par école, plafonds par personne, alertes à 80 %, passage à Claude Haiku 5.5 | M |
| A | ME-27 | **Installation de l'école pilote** (R-3) : serveur, DNS et certificats, secrets propres, sauvegardes B2 de cette installation (`sauvegarder.sh`, journaux binaires), supervision (ME-21), mise à jour de deux installations par la commande de ME-0b | M (L si l'hébergement est au Maroc, Q-23) |
| A | ME-22 | Test d'intrusion et de charge sur l'installation de l'école pilote (ME-27) | M |
| B | ME-10 | Écrans de l'assistant, deux essais chronométrés avec des personnes extérieures (moins de 30 min hors données) | L (B : 3 j) |
| B | ME-24 | Page « Consommation d'IA » | S |
| B | ME-26 | Vidéos par lien dans le Studio quiz | M |
| B | EC-2 | Devoirs : quiz et rendu de fichier (MinIO), retard, nouveau rendu, export des notes. **Revue de sécurité par A avant fusion** (R-4, § 15.4) | L |

### Après l'ouverture · Ce que le pilote n'utilise pas le premier jour

Repoussé de V3 par la revue (R-1), avec une échéance fixée par l'usage de l'école pilote :

| Groupe | Lot | Ce qu'il faut faire | Échéance | Effort |
|---|---|---|---|---|
| A | ME-15 | Facturation simple : comptes actifs du mois × prix, contrat annuel régularisé | avant la fin de l'essai gratuit (J + 60) | M |
| A | ME-19 | Clôture d'une année, lecture seule, diplômés en délai de grâce, purge à 5 ans | avant la fin de l'année du pilote | L (A : 3 j) |
| B | ME-19 | « Années précédentes » (étudiant), « Reprendre mes supports » (enseignant) | avec ME-19 serveur | M |

### V4 · Isoler les écoles

Jalon : **HESTIM tourne par le contexte d'établissement**, sans différence visible, et une deuxième base de test passe toute la suite.

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-2b | Paramètres datés complets : aperçu de ce qui bouge, appliquer, annuler (repoussé de V2, R-1) | L (reste 4,5 j) |
| A | ME-2d | `uid` sur les entités partagées, boîte d'envoi vers StudyLib | M |
| A | ME-3a | Preuve complète du contexte sur deux bases, sur la voie choisie par l'essai de V1. **Si l'essai a échoué** : injection explicite, un lot L de plus | L |
| A | ME-3b | Contexte en production pour HESTIM seule, jetons avec `tid` | M |
| A | ME-4 | Plateforme v1 : registre, domaines, bases, création d'une école en moins de 2 min | L (A : 4 j) |
| A | ME-5 | Migrations par vagues, hors du démarrage du serveur | M |
| A | ME-6 | Tests d'isolation de chaque route d'API en CI | M (A : 1,5 j) |
| A | ME-2e | StudyLib par établissement (avec l'équipe StudyLib) | M |
| B | ME-4 | Console de l'équipe Planner (double authentification obligatoire) | S |
| B | ME-6 | Parcours d'isolation : rien d'une école n'apparaît dans une autre | S |
| B | EC-4, EC-7 | Grilles d'évaluation, questions partagées entre enseignants | 2 × M |
| B | EC-3 | Carnet de notes officiel, **après** validation des règles par la scolarité et le juriste (§ 14.5). **Revue de sécurité par A avant fusion** (R-4) | L |

### V5 · Plusieurs écoles sur une instance

Jalon : **ME-7**, un second établissement réel, non marocain, configuré sans changer de code. Ensuite seulement, d'autres écoles clientes sur la plateforme commune (conditions du § 9.1).

| Groupe | Lot | Ce qu'il faut faire | Effort |
|---|---|---|---|
| A | ME-7 | Second établissement de démonstration, écarts notés et corrigés | M |
| A | ME-8, ME-8b | Comptes communs signés par la Plateforme ; connexion par l'annuaire de l'école | L + M |
| A | ME-12, ME-13 | Habilitations à portée ; enseignants partagés entre écoles | 2 × M |
| A | ME-14 | Solveur réglable, file par établissement, 20 000 étudiants en moins de 30 min | L |
| A | ME-16 | Export complet d'une école, effacement sous 30 jours | M |
| A | ME-20, ME-9b | Préparer l'année suivante ; import OneRoster | 2 × M |
| B | ME-8 | « Choisir l'établissement », invitations ; l'application trouve l'école par l'adresse ou un code | M |
| B | ME-12, ME-13, ME-20 | Écrans de portée, d'heures partagées, de préparation de rentrée | 3 × S |
| B | EC-10 | Messagerie, **seulement si** les questions du § 14.4 sont tranchées | L |

### En parallèle : équipe jeux

JC-0 (fusion de `jeux-pedagogique`) et JC-1 (dépôt `planner-jeux`) avancent dès maintenant, sans argent. B fait JC-5 (bibliothèque des jeux dans « Activités ») après JC-1. Créateurs et rémunération (JC-3, JC-4, JC-6, RC-1 à RC-4) restent reportés (Q-22).

## 15.6 Règles communes

- **Un lot = une branche, un dossier de travail** (`travaux-planner\<lot>`), une PR. Une seule série de bases de test à la fois sur un même poste.
- **Le contrat d'abord** : pour un lot partagé, A écrit la route et ses tests d'intégration, B la relit avant de coder l'écran. Une route qui change après relecture repasse par B.
- **Relecture croisée** : chaque PR de A est relue par une personne de B, et l'inverse, sur les migrations et les contrats d'API.
- **Terminé veut dire** : tests d'intégration et parcours verts, lint sans erreur, `verifier:neutre` vert, diagramme du plan mis à jour dans la même PR, textes en français et en anglais, fichiers sous 300 lignes.
- **Migrations** : « étendre puis contracter » ; la contraction est un lot à part, une version plus tard. Les numéros se réservent dans le canal de l'équipe avant d'écrire la migration (deux branches ne prennent jamais le même).
- **Mise en ligne** par paquets majNN jusqu'à ME-0b, puis par la commande unique ; c'est le chef de projet qui lance la mise en ligne.
- **Point commun chaque semaine** (30 min) : jalon de la vague, passages de relais, blocages. Le chef de projet tranche ce que les groupes ne règlent pas entre eux.

## 15.7 Décisions qui bloquent une vague

| Question | Bloque | Depuis |
|---|---|---|
| Q-25 : quelle école pilote, et l'essai sur instance dédiée est-il accepté ? | Jalon V3 | 24 octobre |
| Q-27 : deuxième personne en production | Jalon V3 (astreinte) | 24 octobre |
| Q-25 : l'école pilote a-t-elle des campus dissociés ? | ME-25 avant ou après l'ouverture | 26 octobre |
| Q-23 : hébergement de l'école pilote (Hetzner ou fournisseur au Maroc) | Effort de ME-27 (M ou L) | 26 octobre |
| Q-29 : nom de la marque (Jadwal après l'OMPIC, ou Planner) | Vidéos, nom des stores ; pas le code (les écrans disent « [École] Planner ») | 24 octobre |
| Règles du carnet de notes (scolarité, juriste) | EC-3 en V4 | 25 octobre |
| Messagerie : modération, conservation, messages entre étudiants | EC-10 en V5 | 25 octobre |
| Nom et identifiant de l'application dans les stores (`app.json`) | Publication d'une version « Planner » de l'application | 26 octobre |

## 15.8 Calendrier (une personne par groupe)

Hypothèses (R-5, 26 octobre) : une personne à plein temps dans chaque groupe, 5 jours par semaine ; règle de 1,5 à 2 fois les jours bruts (§ 12.7) ; fériés marocains comptés (6 et 18 novembre, 1er, 11 et 14 janvier). V0 se termine avec maj44, fin octobre. Chaque vague se date sur le groupe le plus chargé.

| Vague | Plus chargé | Jours bruts | Durée | Fin estimée |
|---|---|---|---|---|
| V1 Fondations | A | 11 | 3,5 à 4,5 semaines | fin novembre à début décembre 2026 |
| V2 Mise en place | A | 11,5 (8,5 sans ME-25) | 3,5 à 4,5 semaines | fin décembre 2026 à début janvier 2027 |
| V3 École pilote | **B** | 10,5 (A : 7) | 3 à 4 semaines | **fin janvier à mi-février 2027** |
| Après l'ouverture | A | 5 | 1,5 à 2 semaines | ME-15 avant J + 60 |
| V4 Isoler | A | 23 | 7 à 9 semaines | avril à début mai 2027 |
| V5 Plusieurs écoles | A | 20 | 6 à 8 semaines | juin à juillet 2027 |

En V3, c'est le groupe B qui fixe la date (écrans de l'assistant, vidéos par lien, devoirs EC-2). Si le pilote n'a pas besoin des devoirs le premier jour, EC-2 peut passer après l'ouverture : le jalon avance d'environ une semaine (décision du chef de projet). Le calendrier se recale à chaque fin de vague, au point commun de la semaine.
