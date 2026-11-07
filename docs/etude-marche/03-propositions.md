# Registre des propositions

Toutes les propositions faites par le groupe B depuis le 3 novembre 2026, avec leur statut. Consigne du chef de projet (4 novembre) : chaque proposition est notée ici. Une décision met à jour le statut ; la ligne n'est jamais effacée.

Statuts : **décidée**, **proposée** (en attente d'avis), **à trancher** (une question précise attend le chef de projet ou le groupe A), **écartée**.

Sources :
- **socle** : `docs/plans/planner-multi-etablissements/conception-socle-neutre-groupe-b.md`, branche `b/socle-neutre` ;
- **01**, **02** : les fichiers de ce dossier ;
- **rapport** : le rapport de recherche du 4 novembre ;
- **conv.** : la conversation avec le chef de projet.

## Décisions du chef de projet

| Date | Décision |
| --- | --- |
| 3 nov. | Le style par défaut devient neutre et plat ; le « panneau des départs » devient un thème au choix de l'école. |
| 3 nov. | Maquettes en HTML cliquable, plus un document de conception. |
| 3 nov. | Démonstration sur une école fictive neutre, au lieu de HESTIM. |
| 4 nov. | `docs/ecole/plan.txt` (ERP scolaire modulaire pour l'Afrique) remplace le plan 15 comme référence, mais reste à structurer. |
| 4 nov. | Le groupe A mène d'abord une étude sur la pile technique : rien ne change d'ici là. |
| 4 nov. | Plusieurs écoles sur une même installation (multi-établissements) devient la première priorité. |
| 4 nov. | Pas d'audit de HESTIM Planner par le groupe B. |
| 4 nov. | Cible : **d'abord les écoles privées, ensuite la formation professionnelle**. |
| 4 nov. | Toutes les propositions sont notées dans ce registre. |
| 5 nov. | Le plan par fonctionnalités ne remplace pas les vagues V : un plan les fusionne, pour une équipe plus nombreuse (`docs/plans/plan-produit/04-plan-fusionne.md`). |
| 5 nov. | La vente est mise de côté : priorité à l'optimisation du SaaS face aux problèmes des autres outils. La planification seule pourra se vendre plus tard. |
| 5 nov. | Le groupe A pousse ses études et écrit avec B le modèle de données du scolaire (prompt fourni par B). |
| 5 nov. | Les entretiens et la démonstration aux directeurs viennent plus tard. |
| 5 nov. | Il faut un site public où les utilisateurs peuvent nous contacter, comme pour les autres outils. |
| 4 nov. | Rencontre avec le directeur d'une école privée (maternelle au lycée) dans 3 à 6 semaines : écouter, puis montrer ; présentation courte et démonstration sur une école fictive (`04-rencontre-directeur.md`). |

## Propositions

### Conception et apparence

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-01 | 3 nov. | Une installation neuve affiche « Planner », sans nom, logo ni couleur d'école. La migration remet l'identité au neutre sur une base sans comptes ; HESTIM est inchangée. | socle N-1, N-19 | proposée (contrat pour le groupe A) |
| P-02 | 3 nov. | Le thème est un réglage de l'école ; chaque personne garde seulement clair, sombre ou automatique. Fin du choix « StudyLib » par appareil. | socle N-2 | proposée ; garder une préférence personnelle est à trancher (question 2 du socle) |
| P-03 | 3 nov. | Deux couleurs d'école, jamais posées sur une couleur d'état ; la couleur principale est refusée si elle ne passe pas le contraste AA. | socle N-3, N-8 | proposée |
| P-04 | 3 nov. | Jetons neutres (tableau du socle) : encre ardoise, Inter, rayons de 6 et 8 px, sans ombre. | socle | proposée, à valider sur les maquettes |
| P-05 | 3 nov. | Deux états de l'école, « en configuration » et « active ». Pendant la configuration : menu réduit, page « en préparation » pour les autres rôles, bouton « Ouvrir Planner » qui exige un contrôle global propre. | socle N-12 à N-14 | proposée |
| P-06 | 3 nov. | Les pages vides disent quoi faire et mènent à l'import ou à la saisie. | socle N-15 | proposée |
| P-07 | 3 nov. | Page d'accueil publique éteinte par défaut. | socle N-16 | proposée |
| P-08 | 3 nov. | Une fonction partagée par le site et l'application, `construireTheme`, au lieu de modifier les jetons sur place. | socle | proposée |
| P-09 | 3 nov. | Découpage en lots SN-1 à SN-5, migration 0060 à réserver. | socle | proposée ; numéro à confirmer avec A |
| P-10 | 4 nov. | Arabe et écriture de droite à gauche prévus dès SN-1 : propriétés logiques CSS, police arabe en complément d'Inter. | socle question 6, 01 § 6 | proposée ; **devient nécessaire** avec la cible des écoles privées |
| P-11 | 4 nov. | Garder la pile actuelle (Express, MySQL, Timefold) plutôt que NestJS, PostgreSQL et OR-Tools. | conv. | à trancher (étude du groupe A) |

### Marché, positionnement, prix

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-12 | 4 nov. | Positionner Planner comme planificateur du supérieur privé, branché sur les logiciels de frais existants. | 01 § 6 | **écartée** le 4 nov. (écoles privées d'abord) |
| P-13 | 4 nov. | Viser d'abord le supérieur privé et la formation professionnelle. | rapport | **écartée** en partie : la formation professionnelle vient en second |
| P-14 | 4 nov. | Ne pas construire les frais, le transport ni la cantine maintenant. | 01 § 6 | **à revoir** : le rapport montre que les frais sont le ticket d'entrée des écoles privées |
| P-15 | 4 nov. | Le prix de travail de 9,99 MAD par élève et par mois est au-dessus du marché marocain (0,4 à 6) ; prévoir une offre « emploi du temps seul ». | 01 § 5 | à trancher, avec la grille de `plan.txt` |
| P-16 | 4 nov. | Essai gratuit sans carte bancaire. | 01 § 6 | proposée (rejoint `plan.txt`, § 6) |
| P-17 | 4 nov. | Chronométrer la mise en route avec deux personnes extérieures, puis l'annoncer (« installé en moins d'une heure »). | 01 § 6, 02 | proposée |
| P-18 | 4 nov. | Import et export MASSAR. | 01 § 6, rapport | proposée ; vérifier d'abord s'il existe un format d'échange officiel |
| P-19 | 4 nov. | Prix public, mise en route incluse, hausse au renouvellement plafonnée et écrite au contrat. | 01 § 7, 02 | proposée |
| P-20 | 4 nov. | Assistance par WhatsApp, en darija, avec un délai de réponse annoncé. | 01 § 7, rapport | proposée |

### Produit (tirées des avis et du rapport)

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-21 | 4 nov. | Chaque conflit dit quelle règle est enfreinte et pour quel groupe. | 01 § 7 | proposée |
| P-22 | 4 nov. | Passage d'une année à l'autre compris dans le produit, pas vendu comme service. | 01 § 7 | proposée (ME-19, ME-20) |
| P-23 | 4 nov. | « Saisir une fois, exporter partout » : saisie unique des absences et des notes, export vers Massar. | rapport | proposée |
| P-24 | 4 nov. | Réduire la saisie des enseignants : appel en un geste, saisie mobile pré-remplie, saisie déléguée au surveillant général ou à la scolarité. | rapport | proposée |
| P-25 | 4 nov. | Horaires saisonniers (Ramadan, heure légale) : régénérer en gardant professeurs, classes et salles, ne changer que les heures. | rapport | proposée |
| P-26 | 4 nov. | État mensuel des heures des vacataires, calculé sur les séances réellement tenues. | rapport | proposée |
| P-27 | 4 nov. | Compteur par classe et par matière des séances prévues, tenues et à rattraper, avec proposition de créneaux de rattrapage. | rapport | proposée |
| P-28 | 4 nov. | Plafond de cumul public-privé (8 h par semaine, 6 h par jour) comme contrainte du solveur. | rapport | proposée |
| P-29 | 4 nov. | Tableau d'avancement de la saisie des notes ; bulletin partiel si une note manque. | rapport | proposée |
| P-30 | 4 nov. | Examens : affectation des surveillants, plan de salle, registre d'incidents, jalons de délibération et de publication. | rapport | proposée |
| P-31 | 4 nov. | Notifications par plages horaires, envoi différé, résumés ; SMS ou WhatsApp pour les seules alertes critiques. | rapport | proposée |
| P-32 | 4 nov. | Application légère et lecture hors ligne. | rapport, `plan.txt` § 17 | proposée |
| P-33 | 4 nov. | Frais : caisse au guichet, reçus numérotés, échéanciers, relances, suivi par famille. | rapport, `plan.txt` | proposée ; **priorité haute** avec la cible des écoles privées |
| P-34 | 4 nov. | Vue consolidée de plusieurs sites, effectifs par filière accréditée, exports pour l'ANEAQ. | rapport | proposée (concerne surtout le supérieur) |
| P-35 | 4 nov. | Hébergement au Maroc, aide à la déclaration CNDP, export complet des données. | rapport, Q-23 | à trancher (Q-23) |

### Campagne marketing

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-36 | 4 nov. | Ne promettre que ce qui existe ou se démontre ; démonstrations chronométrées face aux promesses invérifiables du marché. | 02, rapport | proposée |
| P-37 | 4 nov. | Messages à tester (tableaux de 02 § 3 et du rapport). | 02, rapport | proposée, à tester en entretien |
| P-38 | 4 nov. | Calendrier de campagne : février (Ramadan), avril-mai (réinscriptions), juin-juillet (examens, préparation de la rentrée), septembre (rentrée, heure légale). | rapport | proposée |
| P-39 | 4 nov. | Sujets à proscrire : le drame d'Oulmès ; Massar présenté comme un contrôle des enseignants ; chiffres non sourcés ; critique nommée d'un concurrent. | 02 § 5, rapport | proposée |
| P-40 | 4 nov. | Entretiens de terrain : 6 à 8 directeurs d'écoles privées, vacataires, surveillants généraux, parents, centres de formation (plan dans le rapport). | rapport | proposée ; premier entretien possible avec le directeur que connaît le chef de projet |

### Rencontre avec le directeur (école privée, maternelle au lycée)

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-41 | 4 nov. | Objectif « écouter, puis montrer », puis proposer d'être école pilote. | conv. | **décidée** |
| P-42 | 4 nov. | Démonstration sur le vrai produit adapté au scolaire (option A) : nomenclatures minimales (cycles du scolaire, composante « cours », classes et demi-groupes), textes selon le type d'établissement, école fictive, emploi du temps du collège généré. | 04 | **reportée** le 5 nov. (à trancher (option A, B ou C ; accord du groupe A pour le serveur)) |
| P-43 | 4 nov. | Calendrier en quatre semaines : conception, adaptation, données et solveur, scénario et répétition. | 04 | **reportée** le 5 nov. (proposée) |
| P-44 | 4 nov. | Contenu de la démonstration en six temps : identité de l'école, classes et matières, emploi du temps généré, changement notifié, appel sur téléphone, modules prévus annoncés comme tels. | 04 | **reportée** le 5 nov. (proposée) |
| P-45 | 4 nov. | Questions à poser au directeur (administratif, emploi du temps, impayés, outils, Massar, parents, budget, conditions d'un pilote). | 04, rapport | **reportée** le 5 nov. (proposée) |
| P-46 | 4 nov. | Ajuster l'école fictive au profil de l'école du directeur (ville, effectifs, langues). | 04 | **reportée** le 5 nov. (proposée ; dépend des informations du chef de projet) |

### Fusions

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-47 | 4 nov. | Ordre de fusion :<br>1. `b/socle-neutre` et `b/etude-marche` (documentation) ;<br>2. #141 (ME-0c serveur, migration 0057, groupe A), puis #144 (EC-11, 0058), puis ME-0c écrans, dans l'ordre des numéros de migration ;<br>3. #148 (EC-9, 0059) en dernier, après résolution de son conflit avec #141 par le groupe B (`ConfigurationEtablissement.js`). | conv. | proposée |

### Code et plan produit (5 nov.)

| N° | Date | Proposition | Source | Statut |
| --- | --- | --- | --- | --- |
| P-48 | 4 nov. | Découper les fichiers de plus de 300 lignes signalés par le lint : `ThemeContext.jsx` (dans SN-1), `DepartureBoard.jsx` (quand il devient le thème « panneau »), `App.jsx` et `Annonces.jsx` (lot à part). | conv. | proposée |
| P-49 | 5 nov. | Créer un plan produit par fonctionnalités : cadrage, socle de la plateforme, démonstration au directeur, pack « École privée », formation professionnelle (`docs/plans/plan-produit/`). | plan-produit | **décidée** en partie : catalogue des fonctionnalités gardé, ordre dans le plan fusionné (P-60) |
| P-50 | 5 nov. | Un seul tableau de suivi (`04-suivi.md`) à la place des statuts des plans d'octobre. | plan-produit § 3.1 | proposée |
| P-51 | 5 nov. | Écrire, groupes A et B ensemble, un modèle de données du scolaire (classe, matière, responsable légal, notes, frais) avant la phase 2. | plan-produit C-5 | proposée |
| P-52 | 5 nov. | Registre des modules à la manière d'Odoo : dépendances déclarées, liaisons qui s'activent seules, socle toujours inclus. | plan-produit F-02 | proposée |
| P-53 | 5 nov. | Vocabulaire et nomenclatures lus dans la base selon le profil de l'école, et non plus figés dans `referentiel.js`, sur la base du catalogue du groupe A. | plan-produit F-04 | proposée |
| P-54 | 5 nov. | Ordre du pack « École privée » : élèves et familles ; absences prévenues et espace parents ; frais ; notes et bulletins ; Massar. Emploi du temps scolaire en parallèle, arabe au fil de l'eau. | plan-produit § 3.6 | proposée |
| P-55 | 5 nov. | Un critère de réussite produit mesurable par fonctionnalité (exemple : le bulletin d'une classe en un clic). | plan-produit | proposée |
| P-56 | 5 nov. | Vendre la planification seule (F-11) dès qu'elle est prête, en plus du pack (recommandation du groupe A). | plan-produit § 3.8 | **décidée** le 5 nov., mais la vente est mise de côté |
| P-57 | 5 nov. | Supprimer les branches dont le contenu est déjà dans `main` ou abandonné, et fermer `b/v4-application` et `feature/phase-e-timefold-dev` après relecture. | plan-produit § 1.3 | proposée |
| P-58 | 5 nov. | Pousser et fusionner les études du groupe A : `a/benchmark-modules` et `a/moteur-catalogue`. | plan-produit C-2 | proposée (groupe A) |
| P-59 | 5 nov. | Aucun module de la phase 4 (transport, cantine, hors ligne, etc.) sans demande confirmée par au moins deux écoles. | plan-produit § 3.7 | proposée |
| P-60 | 5 nov. | Plan fusionné : vagues V0 à V5 et fonctionnalités, six équipes (Plateforme, Moteur, Interface, Vie scolaire, Finance, Mobile et parents), lots de la vente mis de côté. | plan-produit 04 | proposée |
| P-61 | 5 nov. | Douze exigences produit (EP-1 à EP-12), tirées des reproches faits aux autres outils, comme conditions de « terminé ». | plan-produit 04 § 4.2 | proposée |
| P-62 | 5 nov. | Avancer en V2 ce qui servait aux grandes écoles dans les anciennes V4 et V5 : isolation, migrations par vagues, registre des écoles, choix de l'école à la connexion. | plan-produit 04 | proposée |
| P-63 | 5 nov. | EC-3 (carnet de notes officiel) et EC-4 fusionnent dans F-13 (notes et bulletins). | plan-produit 04 | proposée |
| P-64 | 5 nov. | Garder ME-22 (test d'intrusion) à la fin de V4, malgré la vente mise de côté. | plan-produit 04 | proposée |
| P-65 | 5 nov. | Site public du produit en cinq lots (SP-1 conception, SP-2 vitrine, SP-3 contact et demandes, SP-4 centre d'aide, SP-5 page d'état et nouveautés), porté par une équipe SC ; sans prix tant que la vente est mise de côté ; nom de marque et domaine à trancher avant SP-2. | plan-produit 04 | proposée |
| P-66 | 5 nov. | Garder `a/mp1-valeurs` (valeurs versionnées, migration 0061) et l'ouvrir en PR avant F-04. | groupe A | proposée (groupe A) |
| P-67 | 5 nov. | C-5 : réutiliser les tables du supérieur plutôt que les doubler. | conception C-5, Q-1 à Q-3 | à trancher |
| P-68 | 5 nov. | C-5 : responsable légal à part, compte facultatif ; un seul compte plateforme, chaque école ne voit que sa fiche. | conception C-5, Q-4, Q-5 | à trancher |
| P-69 | 5 nov. | C-5 : une table `Inscription` par élève et par année. | conception C-5, Q-6 | à trancher |
| P-70 | 5 nov. | C-5 : ni CIN obligatoire, ni données de santé dans le socle ; code Massar facultatif. | conception C-5, Q-7 | à trancher (CNDP) |
| P-71 | 5 nov. | C-5 : note absente distincte d'un zéro ; note verrouillée par période ; paiement et reçu jamais modifiés. | conception C-5, Q-8, Q-9 | à trancher (scolarité, juriste, expert-comptable) |
| P-72 | 5 nov. | C-5 : tables des notes et des frais communes au supérieur, éteintes par le registre des modules. | conception C-5, Q-10 | à trancher |
| P-73 | 5 nov. | Réserver les migrations 0062 à 0079 pour C-5 ; 0060 reste au socle neutre, 0061 à MP-1. | conception C-5, Q-12 | à trancher |
