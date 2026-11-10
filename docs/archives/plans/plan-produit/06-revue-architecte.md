# 6. Revue d'architecte des plans

Revue du groupe A, comme chef adjoint et architecte logiciel, à la demande du chef de projet. Relue sur `main` (`141cdea`) et `b/plan-produit` (`b3d5b5c`). Chaque constat vient d'une lecture du code ou d'un croisement des plans ; ce qui reste une opinion ou une estimation est dit comme tel. **Aucun plan n'est modifié ici** : ce sont des propositions (P-74 et suivantes au registre).

## 6.1 Verdict

**Le plan fusionné (fichier 04) est la bonne base, mais il n'est pas prêt à être suivi.** Ce qu'il apporte est juste : les exigences EP, les fonctionnalités, la propriété des tables. Il a cinq défauts qui bloqueraient l'équipe en cours de route : un jalon impossible (§ 6.2, B-1), un modèle élève qui ne convient pas au scolaire (B-2), l'isolation mal bornée (B-3), le moteur presque absent (B-4), et des tailles sans rapport avec le travail (B-5).

| Plan | Note | Ce qu'il faut en faire |
|---|---|---|
| `plan-produit/04` | bonne base, à corriger avant validation | appliquer le § 6.8 |
| `plan-produit/03` | utile comme catalogue | aligner sur 04 (§ 6.4) |
| `plan-produit/01` | juste sur le fond, déjà périmé par endroits | corriger le § 6.6 |
| `plan-produit/02` | bonne lecture | rien |
| `planner-multi-etablissements/` | le plus solide sur le **comment** | garder, avec un statut par fichier ; rouvrir D-01 et D-06 (§ 6.5) |
| `docs/ecole/plan.txt` | une vision, pas un plan | référence de vision seulement (§ 6.4, I-1) |
| `socle neutre` | solide | y ajouter les données de départ (B-1) |
| `moteur-planification/`, `modele-economique/` (les miens) | utiles, mais pas reliés à 04 | § 6.6 et B-4 |
| `docs/etude-marche/` | utile | une affirmation à corriger (§ 6.6) |
| Plans d'octobre (`assainissement`, `remarques-par-profil`, etc.) | statuts périmés | à archiver (I-2) |

## 6.2 Les bloquants

### B-1. Le jalon de V2 ne peut pas être atteint

**Constat.** V2 promet deux écoles sur la même installation, « l'une du supérieur, l'autre de la maternelle au lycée », et « une installation neuve est neutre ». Or :

- le vocabulaire scolaire est F-04, en **V3**, et les tables du scolaire arrivent en V4. Le groupe B l'écrit lui-même : une école de la maternelle au lycée « ne s'y représente pas » (`04-rencontre-directeur.md`) ;
- `migrations/0003-campus-salles.js` crée **Gandhi et Stendhal sans condition**, dans toute base neuve (`CAMPUS_HESTIM`). Le socle neutre traite l'identité (0055), pas les campus ;
- ME-4 promet une école créée en moins de 2 minutes, en rejouant les 58 migrations et plus. Ce temps n'est pas mesuré, et chaque nouvelle migration l'allonge.

**Proposition.** Avancer de V3 à V2 une version réduite de ME-2a (cycles, composante « cours », classe, demi-groupe). Ajouter un lot « base neuve sans données d'école » : retirer les campus de la base neuve, mêmes règles que 0057 (une base avec des comptes garde tout), et un schéma de départ pour ne plus rejouer toute l'histoire. Mesurer les 2 minutes.

### B-2. Un élève ne peut exister que comme compte

**Constat.** `Users.email` et `Users.password_hash` sont **obligatoires**, l'adresse est unique, et `Etudiant` a pour clé `id_user`. Pour exister, un enfant de 6 ans doit donc avoir une adresse et un mot de passe. Aucun plan ne le signale, ni le mien. `Cours.semestre`, `Cours.volume_horaire`, `Cours.type_cours` et `Groupe.id_filiere` sont aussi obligatoires.

**Conséquence.** C'est la décision la plus lourde de C-5 : `Users` est lu partout (session, jetons, appel, notifications, OIDC, StudyLib). Une adresse factice serait un piège : invitations, réinitialisations, jetons, et demain comptes communs (D-05).

**Proposition.** Séparer la **personne** du **compte** dans C-5. Soit `Etudiant` reçoit sa propre clé et un compte facultatif, soit `Users.email` devient facultatif avec une connexion par code. Les deux demandent une étude d'impact fichier par fichier. **C'est la question Q-14 à ajouter à C-5.**

### B-3. « 15 canaux d'isolation fermés en V2 » est faux par le plan lui-même

**Constat.** F-01, en V2, annonce la fermeture des 15 canaux de l'audit (fichier 18). Mais ce plan repousse leurs lots :

| Canal | Lot qui le ferme | Où le plan le met |
|---|---|---|
| I-5 StudyLib, I-4 jetons | ME-2e | **V5** |
| I-15 clé d'IA | ME-24 | **mis de côté** |
| I-11 sauvegardes par école | aucun | **absent** |
| I-12 application, une seule adresse | ME-8 réduit | V2, mais l'école ne se trouve que par adresse ou code |

**Un canal manque aussi à l'audit, et c'est mon oubli : I-16, les réglages globaux à l'installation.** `DEVOIRS_ACTIFS` et `ANNONCES_ENSEIGNANTS_ACTIVES` sont des variables d'environnement : une école ne peut pas avoir un réglage différent de l'autre. `APP_TIMEZONE` est lu dans 14 fichiers, souvent dans une constante au chargement. Or le plan vise tous les pays à terme (ME-7).

**Proposition.** Dire exactement ce que V2 ferme : I-1, I-2, I-3, I-6, I-7, I-8, I-10, I-11, I-13 et I-16. La seconde école n'a ni StudyLib ni ClassQuiz jusqu'à ME-2e (c'est déjà la règle du § 18.4). Corriger F-01 en conséquence, et ajouter un lot de sauvegarde par école.

### B-4. Le moteur a disparu du plan

**Constat.** Le chef de projet a demandé un moteur capable de nombreux paramètres. Le plan n'en garde que F-04 (profils), F-11 (taille **M**, soit 2 jours) et ME-14 (V5). Manquent :

| Manque | Pourquoi c'est bloquant |
|---|---|
| **Fin de Timefold 1.x** (début 2027, à confirmer) ; en 2.x, `ScoreAnalysis` devient payant et `EmploiDuTempsController.java` l'utilise | EP-4 (« chaque refus s'explique ») repose dessus. Il faut décider avant V3 : c'est une échéance fixe |
| **Choix du moteur** (essai Timefold et CP-SAT, évaluateur indépendant) | aucun lot |
| **MP-1** (valeurs résolues, déjà écrit), **MP-2** (validation avant le calcul) | aucun lot ; MP-2 est le cœur de EP-4 |
| **Limites du modèle** (`ecarts-du-solveur.md`) : semaine type seule, séance de 1 ou 2 créneaux, conflits par hiérarchie et non par élève, enseignant imposé | **F-11 ne les traite pas.** Sans conflits par élève, pas de groupes de langue ni d'options : c'est le cas courant au collège et au lycée. Le jalon de V3 (« génère l'emploi du temps du collège ») risque d'être un collège simplifié |
| **ME-14a mesure 20 000 étudiants du supérieur** | la cible est un collège de 600 élèves (EP-10). Le solveur ne sait pas encore représenter ce collège : la mesure ne répond plus à la question |
| **Primaire** | le profil choisit l'enseignant, ce que le solveur ne sait pas faire. L'enseignant y est imposé par le service : à décider, le plan vise « de la maternelle au lycée » |

**Proposition.** Une ligne de lots MO en V3 : MP-1, MP-2, évaluateur et essai des moteurs (MP-3, MP-4), décision sur Timefold, puis levée des limites dans l'ordre collège, lycée, primaire. ME-14a sur un jeu scolaire d'abord.

### B-5. Les tailles ne correspondent pas au travail, et le plan n'a pas de calendrier

**Constat.** Les tailles S, M, L (0,5, 2 et 5 jours) viennent du plan 15, pour des extensions d'un code connu. Le fichier 04 les applique à des domaines entièrement nouveaux. **F-13 (notes, bulletins, conseil de classe) tient en 7 jours, F-14 (frais, caisse, reçus, relances, export comptable) en 5, F-16 (arabe) en 5.** Pour l'arabe, seulement : `frontend/src/i18n/fr.js` compte 2 575 lignes, 133 styles dépendent du sens de lecture dans 81 fichiers, et il faut des PDF arabes alors que le site génère les siens avec jsPDF, sans que ce rendu soit prouvé.

| Bloc | Fichier 04, jours bruts | Mon estimation (opinion, avant conception) |
|---|---|---|
| V1 | 5 | 8 |
| V2 | 27,5 | 35 |
| V3 | 26,5 | 50 |
| V4 | 38,5 | 95 |
| V5 | 31,5 | 40 |
| Site public | 11,5 | 11,5 |
| **Total** | **140,5** | **environ 240** |

Le détail de V4 : F-10 de 2 à 8, F-13 de 7 à 18, F-14 de 5 à 20, F-15 de 4 à 8, F-16 de 5 à 20.

**Conséquence.** Le plan dit « ordres de passage, pas des dates », et son repli sans recrutement est : A prend PF et MO, B prend UI, VS, FI, MP et SC. Jusqu'à la fin de V4, B porte alors environ 66 jours bruts (fichier 04) ou 120 (mon estimation), soit **de 5 à 12 mois pour une seule personne**, et A environ 40. **Avec deux personnes, le pack « École privée » manque probablement la rentrée de septembre 2027.** Personne ne peut le voir aujourd'hui, car aucune date n'est écrite.

**Une question logique reste sans réponse : la vente est mise de côté et le plan suppose une équipe plus nombreuse. Qui la finance, et jusqu'à quand ?**

**Proposition.** Fixer une date cible (la rentrée de septembre 2027, décision au printemps, me paraît la seule qui compte), l'effectif réel, et réduire le périmètre en fonction. Recalculer les tailles de V4 après C-5.

## 6.3 Trois critiques de logique

**L-1. Tout construire sans parler à une école.** C-4 (entretiens) et D-1 à D-4 sont mis de côté avec la vente. Or un entretien n'est pas une vente. Le plan va engager plus de 40 jours (mon estimation, § B-5) sur les frais, les notes et l'espace parents à partir d'une étude dont le rapport liste lui-même quinze chiffres contradictoires, souvent venus d'éditeurs, et aucun entretien de terrain. Le registre garde en plus deux décisions opposées : « rencontre avec le directeur dans 3 à 6 semaines » et « les entretiens viennent plus tard ». **Proposition : séparer entretien et démonstration.** Une heure d'écoute avec ce directeur, sans rien lui montrer, plus quatre autres directeurs, avant la conception de F-13 et F-14. Cela coûte quelques heures et peut éviter des semaines.

**L-2. Plusieurs écoles d'abord, alors qu'il n'y a pas de seconde école.** Le choix est défendable : tout code écrit après le contexte d'établissement est sûr dès sa création, ce qui évite de reprendre V4. Mais une partie de V2 n'a de valeur qu'avec une vraie seconde école. **Proposition : garder la décision et couper V2 en deux.** Le **noyau** (ME-3a, ME-3b, canaux du § B-3, ME-6, F-02, F-03) reste en V2. La **console** de ME-4 (une commande suffit d'abord), ME-5 (les vagues n'ont pas de sens à trois bases) et ME-8 réduit passent juste avant la première école extérieure. On gagne environ 8 jours bruts.

**L-3. La production est hors du plan.** Le fichier 04 dit de V0 « fusionnés et en ligne », et V2 va toucher toutes les requêtes (ME-3b). Or, d'après git, le dernier paquet connu est maj44 (`3e36d46`) : **38 commits et les migrations 0056 à 0058 sont sur `main` sans mise en ligne connue**, les écrans ME-18 compris. Le serveur a changé depuis, et le déploiement a été mis de côté. Le dernier essai de restauration écrit date du 25 octobre (#138 attend, pour celui du 29). Je ne sais donc pas ce qui tourne, ni si les sauvegardes tournent sur le nouveau serveur. **Proposition : avant V2, un lot court : vérifier la production et ses sauvegardes, faire un essai de restauration sur le nouveau serveur, mettre `main` en ligne une fois.** Sinon, V2 deviendra une seule très grosse mise en ligne pour la seule école réelle, ce que EP-9 veut justement éviter.

## 6.4 Incohérences entre les plans

| N° | Incohérence | Proposition |
|---|---|---|
| I-1 | **Trois « références »** : `plan.txt` (« la référence »), le fichier 04 (« le plan à suivre », encore marqué « à valider », **sans PR et absent de `main`**), et `docs/README.md`, pour qui `assainissement.md` « fait foi ». Le fichier 15 fusionné renvoie à un fichier qui n'est pas sur `main` | `plan.txt` = vision ; 04 = plan ; le reste = détail technique. L'écrire dans `docs/README.md`. Ouvrir la PR de `b/plan-produit` |
| I-2 | Une vingtaine de plans, et des statuts périmés (`assainissement` « à faire », `remarques-par-profil` « à valider ») | les archiver dans `docs/archives/plans/archives/` avec une ligne de statut |
| I-3 | Le tableau de suivi s'appelle `04-suivi.md` dans 03 et `05-suivi.md` dans 04 ; il n'existe pas, et le plan exige d'y réserver les migrations | `05-suivi.md`, à créer tout de suite : 0060 et 0061 sont déjà attribuées |
| I-4 | **Hors ligne, trois positions** : « aucun compromis », saisie comprise (`plan.txt`, § 17) ; lecture en V4 (EP-3) ; « à la demande » (03, phase 4) | lecture seule jusqu'à ce qu'un entretien demande plus. Le corriger dans `plan.txt` |
| I-5 | **Réglages par pays, devises, adaptateur de paiement** : exigés par `plan.txt`, présents dans aucun lot du 04 | une colonne `devise` dès F-14 ; le reste plus tard, mais écrit comme tel |
| I-6 | **ME-20 (V5) et F-10 (V4)** font tous deux la réinscription | F-10 fait l'inscription d'une année, ME-20 le passage. Reprendre EP-8 |
| I-7 | **ME-2b réduit (V3) et MP-1** recouvrent les versions de réglages | MP-1 est le socle de ME-2b, le dire |
| I-8 | **Lots disparus du 04, sans décision** : ME-8b (annuaire de l'école), ME-9b (OneRoster), EC-12 (LTI) ; et ME-8 complet (comptes communs), dont F-10 a besoin pour un parent à deux écoles (D-05) | les écrire « reportés » ; décider ME-8 avec C-5 |
| I-9 | **Le site public** (SP-1 à SP-5) sert à recevoir des demandes, alors que la vente est mise de côté. SP-3 recueille des données personnelles, sans nom de marque (Q-29) | une page et un formulaire d'abord ; SP-2 complet quand la vente reprend |
| I-10 | **Prix.** Fichier 13 (5,40 MAD par compte, décidé), `modele-economique` (paliers, à tester), registre (9,99 MAD, « prix de travail ») | une mention dans 13 : gelé jusqu'à la reprise de la vente |
| I-11 | **Fonds des créateurs de jeux.** Le fichier 08 repose sur la facture et les 4,99 MAD par compte. Un prix par module change son calcul (D-13) | question à reprendre avec la vente ; une note dans 08 |
| I-12 | **Propriété des tables.** Une règle dit « une table, une équipe », mais personne n'a réparti les 74 modèles existants ; `Groupe` et `Cours` touchent MO et VS | répartir dans `05-suivi.md` ; C-5 le fait pour les tables du scolaire |
| I-13 | **Sept équipes** pour deux personnes aujourd'hui, avec relecture croisée et point chaque semaine | garder le découpage comme propriété, pas comme organisation, tant que l'effectif n'est pas connu |
| I-14 | **Dates.** Les documents disent « 5 novembre », les commits sont datés du 4 novembre à 20 h 15 UTC | sans gravité ; dater selon la commande `date` |

## 6.5 Risques d'architecture

| N° | Risque | Preuve | Proposition |
|---|---|---|---|
| A-1 | **D-01 atteint sa propre limite.** « Changerait si : plus de 500 établissements, ou beaucoup de très petites écoles ». C'est maintenant la cible : des milliers de structures de quelques centaines d'élèves | fichier 02 ; `benchmark.md` | garder D-01 pour l'instant (les données restent bien isolées), mais **mesurer** : 200 bases sur un serveur, mémoire des pools, temps de migration. Ce test décide. À faire avant de créer ME-4 |
| A-2 | **D-06 limite à trois niveaux emboîtés**, et les groupes de langue et d'option ne s'emboîtent pas | fichier 02 ; écart F-5 du solveur | amender D-06 avec C-5 (Q-3) |
| A-3 | **Capacité.** Solveur limité à 1 Go et 2 calculs simultanés ; `docker-compose.yml` lance encore StudyLib, ClassQuiz, Meilisearch et MinIO sur le même serveur. Le dernier serveur connu est un PC de 4 Go | `docker-compose.yml` ; la file par établissement est en V5 (ME-14) | une école pourrait attendre pendant la génération de l'autre : une file simple en V2, avant ME-14 |
| A-4 | **Étude de la pile sans fin.** Toute la vague V2 repose sur Sequelize (D-03, ME-3a) et MySQL. Changer après V2 serait une réécriture. Aucun document d'étude n'existe | registre, P-11 | **la clore en V1.** Je m'en charge, sur une page de critères. Ma recommandation reste de ne rien changer |
| A-5 | **Données de mineurs sans étape légale.** ME-23 est mis de côté, et ME-22 est en fin de V4, mais rien ne dit quand on peut recevoir de vraies données | `benchmark.md` : la loi 09-08, le sous-traitant exposé au pénal | une condition écrite : **aucune donnée réelle de mineur** avant le contrat de sous-traitance, le dossier CNDP de l'école et ME-22 |
| A-6 | **Un parent et des droits fragiles.** F-10 crée des comptes parents : qui prouve le lien ? Parents séparés, tuteur retiré, droits différents selon l'enfant | aucun plan ne le traite | à poser dans C-5, avec le juriste |

## 6.6 Erreurs à corriger

| Où | Écrit | Réalité |
|---|---|---|
| `01`, § 1.1 | Application « Expo 54 » | `mobile/package.json` : **`~57.0.27`** |
| `01`, § 1.3 ; `04`, V1 | `a/benchmark-modules`, `a/moteur-catalogue`, `a/mp1-valeurs`, ME-21 « non poussées », « même commit » | toutes poussées ; #153 fusionnée, #154 ouverte ; `a/mp1-valeurs` porte son propre code ; **ME-21 attend seulement sa PR** |
| `04`, V0 | ME-18 « en ligne » | fusionné après maj44 : à vérifier (L-3) |
| `02-arguments-marketing.md` | « Au Maroc, seul Caisso annonce la génération » ; objection « ils ne génèrent pas » | cinq éditeurs l'annoncent (Skoolly et Schoolz restent manuels) |
| `ecarts-du-solveur.md`, § 5 (**le mien**) | lots MP-1 à MP-7 sans lien avec 04 | à relier (B-4) |
| `plan.txt` corrigé (**le mien**) | Fiche Timetable à 199 DH : ne dit pas clairement que la vente est de côté | ajouter la mention |
| Catalogue (**le mien**) | `ETA.ID.TYPE` et les profils n'ont **pas de maternelle**, alors que la cible va « de la maternelle au lycée » (209 013 enfants en 2024-2025) | ajouter un profil, ou décider que la maternelle n'a pas d'emploi du temps généré |
| Audit d'isolation (**le mien**) | 15 canaux | **16** (B-3, I-16) |
| `conception-c5` (**le mien**) | ne pose pas la question du compte de l'élève | ajouter Q-14 (B-2) |

## 6.7 Les exigences EP sont une bonne idée, mais plusieurs ne se mesurent pas

| EP | Problème | Proposition |
|---|---|---|
| EP-1 | Moins d'une heure « données comprises » : aucune base. Le fichier 13 parlait de 29 minutes **hors** données, et des données sales font tout dépasser | mesurer sur un fichier réel et le noter |
| EP-2 | « Trois clics jusqu'à n'importe quel réglage » : tenue en V2, mais le panneau arrive en V3. Et le catalogue a 498 paramètres | V3 ; ajouter au catalogue ce qui est montré à l'école, et ce qui reste au profil |
| EP-3 | « Zéro plantage connu » : aucune remontée d'erreur n'existe, et la décision du 30 octobre exclut d'envoyer des erreurs hors du serveur. « 2 s sur un téléphone d'entrée de gamme » : aucun téléphone de référence ni mesure de départ | choisir le téléphone, mesurer aujourd'hui ; décider des plantages |
| EP-5 | « Aucune donnée saisie deux fois ; exports Massar ». Aucune API officielle trouvée, l'obligation exacte reste à vérifier | « exports au format accepté » ; condition : réponse de l'AREF |
| EP-6 | « Aucune tâche administrative nouvelle sans en retirer une » : F-13 ajoute la saisie des notes | préciser ce qui est retiré, et le mesurer (temps de saisie d'une classe) |
| EP-9 | « Retour arrière en une commande » : `deployer.sh --retour` ramène l'image, pas le schéma | préciser : tient avec « étendre puis contracter » seulement |
| EP-10 | Mesurée par ME-14a, sur le mauvais jeu (B-4) | jeu scolaire |

## 6.8 Le plan que je propose

Les vagues restent. Ce qui change :

| Vague | Ajouter | Retirer ou déplacer | Jalon corrigé |
|---|---|---|---|
| **V1** | Vérifier la production et les sauvegardes, mise en ligne de `main` (L-3) ; clore l'étude de la pile (A-4) ; `05-suivi.md` ; PR de `b/plan-produit` ; ME-14a sur un jeu scolaire ; test de 200 bases (A-1) ; C-5 avec Q-14 | | les fondations sont fusionnées **et en ligne** ; D-01 et la pile sont confirmées |
| **V2** | ME-2a réduit (depuis V3) ; base neuve sans données d'école (B-1) ; canaux bornés, I-16 et sauvegarde par école (B-3) ; file simple du solveur (A-3) | console de ME-4 (une commande d'abord), ME-5, ME-8 réduit : juste avant la première école extérieure (L-2) | deux écoles sur une installation : HESTIM et une école neuve au vocabulaire scolaire, **sans StudyLib ni ClassQuiz** ; rien ne passe de l'une à l'autre |
| **V3** | MP-1, MP-2, MP-3, MP-4 et la décision sur Timefold ; levée des limites pour le collège, puis le lycée (B-4) ; **5 entretiens** (L-1) | | une personne extérieure configure l'école et génère **un vrai collège avec groupes de langue** |
| **V4** | Tailles recalculées après C-5 ; condition légale (A-5) | Primaire et maternelle : selon Q-13 | inchangé |
| **Site public** | | SP-2 complet après la reprise de la vente (I-9) | une page et un formulaire |

## 6.9 Ce que je demande au chef de projet

| N° | Décision | Ma recommandation |
|---|---|---|
| 1 | Effectif réel, budget, et date cible | la rentrée de septembre 2027 ; sinon réduire le pack |
| 2 | Corriger le fichier 04 selon le § 6.8 | oui ; le groupe B le fait, je relis |
| 3 | Élève sans compte (B-2) : personne et compte séparés dans C-5 | oui, avec une étude d'impact |
| 4 | Entretiens séparés de la démonstration, et le directeur écouté (L-1) | oui |
| 5 | V2 coupée en noyau et confort (L-2) | oui |
| 6 | Production : vérification et mise en ligne avant V2 (L-3) | oui, et me dire ce qui tourne sur le nouveau serveur |
| 7 | Étude de la pile close en V1, et test de D-01 (A-1, A-4) | oui |
| 8 | Primaire et maternelle : emploi du temps généré, ou simple saisie ? | commencer par collège et lycée ; primaire et maternelle en saisie simple tant qu'un entretien n'en dit pas plus |
