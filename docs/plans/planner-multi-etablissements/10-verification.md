# 10. Vérification du plan

Ce fichier sert à relire le plan, et plus tard chaque lot. Il dit ce qui couvre chaque exigence, ce qui doit rester vrai, ce qui peut casser, et ce qui a été remis en question pendant la conception.

## 10.1 Traçabilité

| Exigence | Décisions | Lots | Contrôle |
|---|---|---|---|
| EX-01 Produit neutre | D-11 | ME-1, ME-11 | `verifier:neutre` en CI ; page de connexion de deux écoles |
| EX-02 Tout contexte | D-06, D-09 | ME-2a, ME-10, ME-14 | ME-7 : école non marocaine sans changement de code |
| EX-03 Mise en place rapide | D-08 | ME-9, ME-10 | deux essais chronométrés |
| EX-04 Import Excel | D-08 | ME-9, ME-9b | classeur de démonstration de 3 000 étudiants |
| EX-05 Zéro conflit interne | D-08, D-09 | ME-9 | catalogue V-01 à V-12, chacun testé ; import tout ou rien |
| EX-06 Zéro conflit entre écoles | D-01, D-02, D-03, D-10 | ME-3a à ME-6, ME-13 | suite d'isolation ; scénario du vacataire |
| EX-07 Réglages en quelques clics | D-07 | ME-2b, ME-2c | trois clics ; aperçu ; annulation |
| EX-08 Cohésion des bases | D-01, D-15, D-16 | ME-2d, ME-5 | contrôle de version et d'empreinte du schéma |
| EX-09 Créateurs tiers | D-12 | JC-1 à JC-6 | un créateur extérieur publie, une autre école utilise |
| EX-10 Rémunération à l'usage | D-13 | RC-1 à RC-4 | invariants I-R1 à I-R6 |
| EX-11 Jeux en microservice | D-12, D-14, D-17 | JC-1 | Planner fonctionne service des jeux arrêté |
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
| I-06 | Toutes les bases au même schéma | contrôle de version à l'ouverture, empreinte du schéma comparée chaque nuit | tâche de nuit, alerte |
| I-07 | Un réglage structurel ne s'applique jamais sans aperçu | une seule route d'application, qui exige l'identifiant d'un aperçu récent | test |
| I-08 | Un import est tout ou rien | transaction | test d'échec à la dernière ligne |
| I-09 | Un élève n'est identifiable par aucun créateur ni par le service des jeux | pseudonyme par école, seuil de 10 | test de la route des statistiques |
| I-10 | Les invariants de données I-D1 à I-D8 (fichier 04) et de rémunération I-R1 à I-R6 (fichier 08) | — | — |

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

## 10.5 Faits vérifiés dans le code le 23 octobre 2026

- 72 fichiers de modèles, 127 fichiers qui importent `models/index.js`, 18 contraintes d'unicité, 2 fichiers seulement avec des requêtes SQL brutes (`services/taches/periodiques.js` et `middleware/rateLimiterMiddleware.js`), aucun usage de `useCLS` ni d'`AsyncLocalStorage`.
- Migration 0002 : retrait du multi-établissement par colonne, irréversible, décidé le 2 octobre (« une seule école »).
- Sequelize 6.37.8 associe les inclusions par nom de modèle (`lib/associations/mixin.js`, `getAssociations`).
- `GET_LOCK` des tâches périodiques déjà préfixé par le nom de la base.
- Timefold 1.15.0 ; 22 règles, dont 12 dures et 10 souples ; « Pas de samedi après-midi » souple (50).
- `APP_TIMEZONE` lu dans 10 fichiers avec Casablanca par défaut.
- StudyLib vérifie déjà les jetons de Planner par JWKS (`PlannerTokenVerifier.php`) et synchronise le référentiel par code (`SyncPlannerReferential.php`).
- `shared/simulations/` n'existe pas encore sur `main` (branche `jeux-pedagogique`).

## 10.6 Ce que ce plan ne garantit pas

- Des dates : il donne un ordre, des conditions et des efforts, pas un calendrier.
- La faisabilité du contexte par résolveurs : c'est l'objet de la preuve ME-3a, avec une solution de repli décrite.
- Les règles fiscales et juridiques de la rémunération : elles sont listées (08, § 8.8) et bloquent le premier paiement, pas la construction.
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
