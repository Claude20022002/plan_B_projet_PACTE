# 10. Vérification du plan

Ce fichier sert à relire le plan, et plus tard chaque lot. Il dit ce qui couvre chaque exigence, ce qui doit rester vrai, ce qui peut casser, et ce qui a été remis en question pendant la conception.

## 10.1 Traçabilité

| Exigence | Décisions | Lots | Contrôle |
|---|---|---|---|
| EX-01 Produit neutre | D-11 | ME-1, ME-11 | `verifier:neutre` en CI ; page de connexion de deux écoles |
| EX-02 Tout contexte | D-06, D-09 | ME-2a, ME-10, ME-14 | ME-7 : école non marocaine sans changement de code |
| EX-03 Mise en place rapide | D-08 | ME-9, ME-10 | deux essais chronométrés |
| EX-04 Import Excel | D-08 | ME-9, ME-9b | classeur de démonstration de 3 000 étudiants |
| EX-05 Zéro conflit interne | D-08, D-09 | ME-9 | catalogue V-01 à V-14 (V-10 retiré), chacun testé ; import tout ou rien |
| EX-06 Zéro conflit entre écoles | D-01, D-02, D-03, D-10 | ME-2e, ME-3a à ME-6, ME-13 | suite d'isolation de Planner et de StudyLib ; deux écoles avec une session de même numéro ; scénario du vacataire |
| EX-07 Réglages en quelques clics | D-07 | ME-2b, ME-2c | trois clics ; aperçu ; annulation |
| EX-08 Cohésion des bases | D-01, D-15, D-16 | ME-2d, ME-5 | contrôle de version et d'empreinte du schéma |
| EX-09 Créateurs tiers | D-12 | JC-1 à JC-6 | un créateur extérieur publie, une autre école utilise |
| EX-10 Rémunération à l'usage | D-13 | RC-1 à RC-4 | invariants I-R1 à I-R6 |
| EX-11 Jeux en microservice | D-12, D-14, D-17 | JC-1 | Planner fonctionne service des jeux arrêté |
| EX-12 Désactivation des comptes | D-18 | ME-17 (puis ME-8, ME-9) | invariants I-A1 à I-A3 (fichier 11) |
| EX-13 Archivage des années | D-19 | ME-18, ME-19, ME-20 | invariants I-A4 à I-A8 (fichier 11) |
| Sites indépendants (Q-4, 24 octobre) | D-20 | ME-25 | invariant I-15 |
| EX-Q1 Isolation | D-01, D-03 | ME-6 | toutes les routes, générées depuis le routeur |
| EX-Q2 Continuité de HESTIM | D-16 | tous | retour arrière écrit par lot ; base de HESTIM jamais déplacée |
| EX-Q3 Montée en charge | D-09 | ME-5, ME-14 | université de 20 000 étudiants |
| EX-Q4 Réversibilité | D-01 | ME-16 | export restauré dans un établissement vide |
| EX-Q5 Conformité | D-10, D-12 | ME-13, JC-6 | pseudonymes, seuil de 10, consentement |
| EX-Q6 Sauvegardes | D-16 | ME-0a | restauration d'une base seule |
| EX-Q7 Exploitation | D-16 | ME-0b, ME-5 | migration cassée isolée |

Aucune exigence sans lot ; aucun lot sans exigence (ME-0d sert EX-Q2 : on ne change pas l'isolation sans parcours fiables).

## 10.2 Invariants de l'ensemble

| N° | Invariant | Garanti par | Testé par |
|---|---|---|---|
| I-01 | Aucune lecture ni écriture en base hors d'un contexte d'établissement | résolveurs qui lèvent une erreur ; lint | test sans contexte |
| I-02 | Le pool d'un établissement ne peut lire aucune autre base | utilisateur MySQL par base, droits limités | test qui tente un `SELECT` sur la base voisine avec ce pool |
| I-03 | L'établissement d'une requête = celui de l'hôte = celui du jeton | middleware de contexte | suite d'isolation |
| I-04 | Rien d'une école ne sort vers un autre service sans son `etablissement_uid` | boîte d'envoi : champ obligatoire | test du livreur |
| I-05 | Aucun identifiant entier d'une base ne sort d'elle | revue ; schéma des événements (seuls des `uid`) | validation des événements par schéma |
| I-06 | Chaque base dans la plage de schémas acceptée ; toutes au même schéma hors des vagues | contrôle de version à l'ouverture, empreinte du schéma comparée chaque nuit | tâche de nuit, alerte |
| I-07 | Un réglage structurel ne s'applique jamais sans aperçu | une seule route d'application, qui exige l'identifiant d'un aperçu récent | test |
| I-08 | Un import est tout ou rien | transaction | test d'échec à la dernière ligne |
| I-09 | Un élève n'est identifiable par aucun créateur ni par le service des jeux | pseudonyme par école, seuil de 10 | test de la route des statistiques |
| I-10 | Les invariants de données I-D1 à I-D8 (fichier 04), de rémunération I-R1 à I-R6 (fichier 08), des comptes et des années I-A1 à I-A8 (fichier 11) | — | — |
| I-11 | Aucun état en mémoire du processus n'est partagé entre écoles : toute clé commence par l'`uid` de l'établissement, tout travail différé emporte son contexte | revue ; inventaire des `Map` et files au niveau des modules | test de deux écoles avec des identifiants égaux (session de génération, compte du limiteur) |
| I-12 | Une école n'apprend jamais qu'une personne a un compte dans une autre école | invitation identique pour toute adresse ; `OccupationExterne` sans source lisible | test de l'import et de l'invitation |
| I-14 | Une connexion par l'annuaire d'une école n'ouvre que cette école, et seulement pour les domaines d'adresse qu'elle a prouvé posséder | règle de la Plateforme (D-05) | test : un annuaire de A qui affirme l'adresse d'un enseignant de B n'ouvre rien chez B |
| I-15 | Un étudiant ne reçoit jamais l'emploi du temps, l'annonce ou la notification d'un autre site ; aucune séance d'un groupe n'a lieu hors de son site | règle dure du solveur, envois filtrés par site (D-20) | test sur un établissement de deux sites |
| I-13 | Les identifiants techniques figés ne changent pas | liste écrite (D-11), exclue du contrôle de neutralité | test : un secret de double authentification chiffré avant la mise à jour se déchiffre après |

## 10.3 Analyse des défaillances

Gravité : **3** fuite ou perte de données, ou argent ; **2** service coupé pour une école ; **1** gêne.

| Défaillance | Effet | Cause probable | Détection | Parade | Gravité |
|---|---|---|---|---|---|
| Requête servie avec la mauvaise base | fuite entre écoles | oubli de contexte, code asynchrone qui perd le contexte | I-01, suite d'isolation | échec fermé ; I-02 limite tout de même la portée au pool courant | 3 |
| Registre en cache périmé après un changement de domaine | une adresse sert l'ancienne école | cache trop long | I-03 (le jeton ne correspond plus) | cache de 60 s, invalidation par événement, slug jamais réutilisé | 3 |
| Plateforme compromise | accès à toutes les bases | secrets des bases | journal, alertes de connexion | secrets chiffrés (clé hors base), double authentification obligatoire pour l'équipe Planner, console sur réseau restreint | 3 |
| Plateforme arrêtée (après ME-8) | plus de connexion nouvelle | panne | sonde | deux instances ; Planner garde le registre en cache ; les sessions ouvertes continuent jusqu'à expiration | 2 |
| Migration en échec sur une base | une école en maintenance | donnée inattendue | ME-5 | école seule en maintenance, sauvegarde avant migration, correction puis reprise | 2 |
| Dérive de schéma (changement fait à la main) | erreurs aléatoires | intervention hors migration | I-06 | interdiction écrite ; tâche de nuit | 2 |
| Connexions MySQL épuisées | lenteurs, erreurs | trop d'écoles actives | supervision | pools de 3, fermeture au repos, ProxySQL ensuite | 2 |
| Grosse génération qui occupe le solveur | autres écoles en attente | file non équitable | temps d'attente mesuré | file par établissement, durée plafonnée | 1 |
| Réglage structurel appliqué par erreur | séances déplacées | mauvaise manipulation | aperçu | annulation en un clic ; rien de visible pour les étudiants avant publication | 1 |
| Import qui écrase des données justes | données perdues | mauvaise correspondance des colonnes | aperçu des modifications | annulation d'import, journal des valeurs d'avant | 2 |
| Paiement en double à un créateur | perte d'argent | clôture relancée | I-R5, I-R3 | clôture idempotente, validation humaine avant virement | 3 |
| Fraude aux usages | argent mal réparti | élèves fictifs, robot | anomalies, plafonds | borne économique (§ 8.3), exclusions, retenue et contre-passation | 2 |
| Contenu illicite publié | atteinte à l'image, aux élèves | revue insuffisante | signalements | revue humaine, suspension sous 24 h ouvrées | 2 |
| Heures d'un enseignant divulguées | atteinte à la vie privée | partage sans accord | — | consentement explicite, aucune information hors début, fin, ville | 2 |
| Perte du serveur de données | perte de toutes les écoles | panne de disque, incident | — | ME-0a avant tout ; restauration mensuelle d'essai | 3 |

## 10.4 Contradictions trouvées pendant la conception, et comment elles sont levées

| Contradiction | Levée par |
|---|---|
| L'école doit pouvoir renommer ses codes, mais StudyLib rapproche filières et modules **par code** | `uid` stable, codes jamais utilisés entre services (D-15, ME-2d) |
| « Une base par école » et « une bibliothèque commune à toutes les écoles » | StudyLib et jeux gardent une base commune ; seuls leurs éléments privés portent l'`etablissement_uid` (03, § 3.2) |
| « Aucune donnée commune entre écoles » et « un vacataire ne doit pas être placé deux fois » | heures occupées sans détail, avec consentement (D-10) |
| On croyait « samedi après-midi » interdit ; le solveur le traite en souple (poids 50), et la pause du vendredi n'est contrôlée qu'à la saisie | plages restreintes avec une force (interdite, à éviter) et une seule définition pour la saisie et le solveur (06, § 6.3) |
| Un code de session (quiz, jeu) doit-il être unique pour toute la plateforme ? | non : l'élève est connecté à son école, le code se cherche dans sa base ; le QR porte l'adresse de l'école. Deux écoles peuvent avoir le même code sans effet |
| Exclure les sessions lancées par le créateur, alors que le service des jeux ne voit que des pseudonymes | Planner compare lui-même le compte qui lance et celui du créateur, et le dit au service (08, § 8.4) |
| Une personne de deux écoles est comptée deux fois comme compte actif | voulu : chaque école ouvre et paie son accès ; dit dans le contrat |
| Un fonds global récompense l'école la plus active avec l'argent des autres | fonds par école (D-13) |
| Payer les créateurs sur facture émise, alors qu'une école peut ne pas payer | fonds créé à l'encaissement seulement |
| Microservices demandés, mais la planification, l'appel et les reports partagent les mêmes séances | monolithe modulaire pour Planner, quatre services séparés (D-17) |
| Identité commune tout de suite, ou plus tard | deux temps : `tid` dans le jeton d'abord, comptes communs ensuite ; aucun travail jeté |
| Une école multi-villes : un établissement ou plusieurs ? | un établissement, des campus et des habilitations par campus (H-2, ME-12) ; plusieurs établissements casseraient le partage des enseignants et des salles |
| Laisser l'école rendre « dure » une règle souple | non : risque d'insolubilité muette ; « indispensable » = poids fort signalé dans le rapport |
| Un assistant de démarrage ajoute-t-il des écrans à maintenir ? | non : il enchaîne les pages existantes dans l'ordre des dépendances |
| L'application installée chez les étudiants de HESTIM envoie des jetons sans `tid` | acceptés seulement sur l'adresse de HESTIM, deux versions, date de fin écrite |
| Désactiver le compte d'un vacataire qui quitte une école, alors qu'il enseigne encore dans une autre | on désactive l'appartenance à l'école, jamais le compte commun (D-18) |
| « Archiver » en effaçant les inscriptions passées supprimerait le mélange, mais aussi l'historique de l'étudiant | on garde tout et on filtre par année, par une seule fonction (D-19) |
| Supprimer un compte (droit à l'effacement) et garder les relevés de présence et les heures faites | anonymisation : l'identité part, l'historique reste sans nom (§ 11.2) |
| La maquette sert à toutes les années : renommer un module l'année suivante réécrirait l'archive | photo de l'année écrite à la clôture ; un module servi n'est jamais supprimé (§ 11.3) |
| Effacer l'identité d'un compte (loi 09-08) et garder un relevé de notes officiel rattaché à une personne | proposition : l'obligation légale de conservation l'emporte, l'identité reste sur les relevés seulement, archivés à part ; à faire valider par le juriste (fichier 14, § 14.5) |
| La décision « le devoir fichier ne revient pas » et la demande de rapports à téléverser | remplacée le 25 octobre : les devoirs-fichiers reviennent, avec leurs fichiers hors de la base (fichier 14, § 14.6) |
| Un ancien étudiant qui consulte ses archives devient un « compte actif » facturé à l'école | 30 jours de grâce en lecture seule, sans téléchargement des fichiers, puis désactivation (Q-13, tranchée le 24 octobre) |

### 10.4.1 Relecture du 23 octobre (deuxième passage, point par point)

Chaque affirmation du plan a été confrontée au code et aux autres fichiers. Erreurs trouvées et corrigées :

| N° | Ce que disait le plan | Ce qui est vrai | Correction |
|---|---|---|---|
| R-01 | La colonne `id_institution` n'avait « jamais » été appliquée dans les requêtes | elle filtrait une trentaine de fichiers (commit `b16b17c`, mai 2026) ; elle a été retirée par une décision de produit | D-01 réécrit ; l'option (c) y est présentée comme un retour à l'ancien modèle |
| R-02 | « 18 contraintes d'unicité deviendraient composées » | une partie porte sur des jetons aléatoires, uniques partout ; une dizaine sont des clés métier | D-01 corrigé |
| R-03 | La base par école suffit à isoler | trois états en mémoire du processus mélangeraient deux écoles : générations en cours rangées par numéro de session, limiteur rangé par `user:<id>`, file des notifications vidée hors requête | D-03, I-11, ME-3b |
| R-04 | Les 127 fichiers ne changent pas | les 26 fichiers qui importent `config/db.js` et les prototypes modifiés au chargement changent | D-03 |
| R-05 | « Aucun hestim dans le code » sans exception | renommer le sel de `mfa.js`, `DOMAINE_UID` de l'agenda ou le format d'export des quiz bloquerait les administrateurs, doublerait les agendas, rendrait les exports illisibles | D-11 (identifiants figés), ME-1, I-13 |
| R-06 | StudyLib a un « catalogue public commun » | StudyLib n'a que `school` et `class` ; `school` veut dire HESTIM, et une partie des documents vient du Drive de HESTIM | § 3.2, nouveau lot ME-2e |
| R-07 | Toutes les bases au même schéma, sinon 503 | contredisait les migrations par vagues (D-16) : pendant une vague, toutes les écoles pas encore migrées seraient en panne | plage de schémas acceptés (D-16, I-D1, I-06, ME-5) |
| R-08 | Pools : 40 écoles actives tiennent dans 151 connexions | avec deux instances de l'API et les autres services, c'est une vingtaine ; les écoles travaillent aux mêmes heures | § 3.8, `max_connections` à 500 |
| R-09 | Les plages occupées reçues d'une autre école sont des indisponibilités du solveur | le solveur place une **semaine type**, les plages reçues sont **datées** | plages répétées dans la semaine type, plages isolées au déploiement (D-10, § 6.5) |
| R-10 | Le contrôle V-10 signale une adresse « connue d'un autre établissement » | cela révèle qu'une personne travaille ailleurs, contraire à D-05 | V-10 retiré, I-12 |
| R-11 | `OccupationExterne` garde l'`uid` de l'école d'origine, « jamais affiché » | stocké dans la base de l'autre école, il reste lisible par elle (export, accès direct) | source opaque calculée par la Plateforme (I-D7) |
| R-12 | Première école cliente possible dès ME-7 | sans ME-8, deux comptes de même adresse avec deux mots de passe ; sans ME-9, ME-10, ME-15, ME-16, ni mise en place simple, ni facture, ni réversibilité | condition d'ouverture écrite (§ 9.1) |
| R-13 | Aucun lot n'ajoutait `tid` aux jetons | ME-2e et la règle de transition en dépendent | ajouté à ME-3b |
| R-14 | Critère de ME-2a : « génération identique » avant et après | le solveur cherche par essais successifs dans un temps limité : deux générations diffèrent toujours | critère : problème envoyé au solveur identique |
| R-15 | « Un compte actif s'est connecté dans le mois » | l'application garde la session des semaines : un étudiant actif ne se reconnecte pas | « au moins une requête authentifiée dans le mois » (§ 4.1, ME-15) |
| R-16 | `Cours.semestre` se range dans S1 ou S2 | par la parité du numéro (`periodeDuSemestre`), fausse pour une école en trimestres | `Cours.rang_periode` (§ 4.3) |
| R-17 | Le gabarit quiz reprend le moteur du Studio | deux copies divergeraient | paquet commun aux deux dépôts (§ 7.2, JC-4) |
| R-18 | Diagramme de la clôture : calcul avant la date de clôture | ordre inversé ; un fonds en attente d'encaissement n'était pas traité clairement | diagramme refait (§ 8.5) |
| R-19 | I-R2 : paiements ≤ fonds | le fonds contient aussi la part de Planner : un trop-payé passerait | paiements ≤ parts acquises, par créateur |
| R-20 | Planner arbitre la bibliothèque et y place ses jeux, sans règle | conflit d'intérêts visible des créateurs | règles d'équité publiées (§ 8.7) |
| R-21 | Courriels « depuis l'adresse de l'école » | sans SPF ni DKIM de l'école, ils tombent en indésirables | envoi depuis Planner, nom de l'école affiché, réponse à la scolarité (D-11) |
| R-22 | `ConstraintWeightOverrides` « si la version le permet » | présent dans Timefold 1.15.0 (vérifié dans le jar) | réserve levée (D-09) |
| R-23 | La sauvegarde ne visait que les bases d'école ; l'effacement en 30 jours ignorait les sauvegardes | le grand livre des créateurs et la Plateforme doivent aussi être sauvegardés ; une sauvegarde garde les données de l'école effacée | ME-0a élargi, rétention de 30 jours, EX-Q4 et ME-16 précisés |
| R-24 | Le service des jeux recevait une copie du référentiel (filières, modules) | il n'en a pas besoin | retiré (§ 3.5, minimisation des données) |
| R-25 | Le jeton d'intégration de StudyLib n'était pas cité parmi les secrets partagés | `X-Integration-Token` est un secret partagé | § 3.6 |

Points relus et **confirmés** sans changement : le choix de la base par école (D-01) contre la colonne ; l'établissement déduit du jeton et de l'hôte (cookies sans attribut `Domain`, vérifié) ; le monolithe modulaire (D-17) ; la rémunération par fonds d'école (exemple chiffré recalculé : 898,20 + 449,10 + 149,70 = 1 497,00 MAD ; 249,50 MAD pour B) ; la borne de la fraude (0,499 MAD par compte et par mois pour τ = 10 %) ; le temps de l'assistant (29 minutes, somme refaite) ; les 22 règles du solveur, 12 dures et 10 souples ; l'absence de dépendance circulaire dans le graphe des lots.

## 10.5 Faits vérifiés dans le code le 23 octobre 2026

- 72 fichiers de modèles, 127 fichiers qui importent `models/index.js`, 18 contraintes d'unicité, 2 fichiers seulement avec des requêtes SQL brutes (`services/taches/periodiques.js` et `middleware/rateLimiterMiddleware.js`), aucun usage de `useCLS` ni d'`AsyncLocalStorage`.
- Migration 0002 : retrait du multi-établissement par colonne, irréversible, décidé le 2 octobre (« une seule école »).
- Sequelize 6.37.8 associe les inclusions par nom de modèle (`lib/associations/mixin.js`, `getAssociations`).
- `GET_LOCK` des tâches périodiques déjà préfixé par le nom de la base.
- Timefold 1.15.0 ; 22 règles, dont 12 dures et 10 souples ; « Pas de samedi après-midi » souple (50).
- `APP_TIMEZONE` lu dans 10 fichiers avec Casablanca par défaut.
- StudyLib vérifie déjà les jetons de Planner par JWKS (`PlannerTokenVerifier.php`) et synchronise le référentiel par code (`SyncPlannerReferential.php`).
- `shared/simulations/` n'existe pas encore sur `main` (branche `jeux-pedagogique`).
- Ancien multi-établissement : commit `b16b17c` (12 mai 2026), `id_institution` dans 30 fichiers, retiré par la migration 0002 (commit `e6fb99b`, 3 octobre).
- Cookies d'authentification sans attribut `Domain` (`config/authCookies.js`).
- `services/mfa.js` : clé HKDF avec le sel `"hestim-planner"` ; `ics.js` : `UID:…@hestim-planner` ; `questionnaires.js` : l'import refuse tout format autre que `hestim-studio-quiz`.
- État en mémoire : `enCours` (`timefold/generation.js`, clé = numéro de session), limiteur en mémoire (clé `user:<id_user>`), file de `push.js`.
- Le solveur place une semaine type ; `timefold/deploiement.js` la déploie sur les dates en sautant les dates bloquées.
- `importEtudiants` n'utilise pas de transaction.
- StudyLib : visibilités `school` et `class` seulement (`app/Enums/DocumentVisibility.php`).
- Timefold 1.15.0 contient `ai.timefold.solver.core.api.domain.solution.ConstraintWeightOverrides`.

## 10.6 Ce que ce plan ne garantit pas

- Des dates : il donne un ordre, des conditions et des efforts, pas un calendrier.
- La faisabilité du contexte par résolveurs : c'est l'objet de la preuve ME-3a, avec une solution de repli décrite.
- Les règles fiscales et juridiques de la rémunération : elles sont listées (08, § 8.9) et bloquent le premier paiement, pas la construction.
- Le temps de mise en place réel : 29 minutes est une estimation, mesurée en ME-10.

## 10.7 Questions au chef de projet

| N° | Question | Proposition |
|---|---|---|
| Q-1 | Nom de domaine du produit ? Et « Planner » est-il disponible comme marque (Microsoft Planner existe) ? Vérification à faire à l'OMPIC | garder « Planner » à l'écran avec le nom de l'école devant (« EMSI Planner »), vérifier la marque avant tout dépôt dans les magasins |
| Q-2 | Part des créateurs τ et seuil de paiement | 10 %, 200 MAD |
| Q-3 | Clients visés d'abord (H-1) : supérieur seulement, sans élèves mineurs ? | oui |
| Q-4 | Une école de plusieurs villes = un établissement (H-2) ? | oui |
| Q-5 | Destination des sauvegardes hors serveur (question ouverte depuis le 18 octobre) | Storage Box Hetzner dans un autre centre |
| Q-6 | Nom à l'écran de l'espace des créateurs | « Espace créateurs » ; les enseignants trouvent les jeux dans « Activités » |
| Q-7 | Qui relit les jeux soumis ? | l'équipe Planner au début ; plus tard des enseignants relecteurs rémunérés |
| Q-8 | Partage des heures occupées : désactivé par défaut, proposé à l'enseignant ? | oui |
| Q-9 | Les créateurs voient-ils le pays des écoles qui utilisent leurs jeux (jamais leur nom) ? | oui |
| Q-10 | Un prix négocié par établissement est-il permis (grandes écoles) ? | oui, le modèle le prévoit (`Abonnement.prix_compte_mois`) |
| Q-11 | Établissement d'essai gratuit, effacé après 60 jours sans activité ? | oui |
| Q-1 à Q-11 | Réponses du 24 octobre (Q-3, Q-4, Q-5, Q-8, Q-10, Q-11) | voir fichier 13, § 13.15 ; Q-2, Q-6, Q-7, Q-9 attendent l'ouverture du volet créateurs |
| Q-12 à Q-14 | Durée de conservation des années closes, accès des diplômés à leurs archives, préavis avant une désactivation programmée | **tranchées le 24 octobre** : 5 ans ; 30 jours de grâce, téléchargement des fichiers désactivé ; préavis 5 jours avant (fichier 11, § 11.6) |
