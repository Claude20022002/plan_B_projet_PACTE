# Décisions et questions ouvertes

Registre unique à partir du 7 novembre 2026.

**Où se trouvent les décisions plus anciennes :**
- le registre des propositions P-01 à P-83 ([../etude-marche/03-propositions.md](../etude-marche/03-propositions.md)) est **figé** : il reste l'historique des propositions ;
- le détail des décisions d'architecture est dans [../conception/plateforme/02-decisions.md](../conception/plateforme/02-decisions.md).

**Règle** : une décision nouvelle s'ajoute ici, datée, avec sa source. Une décision qui en remplace une autre le dit.

## 1. Décisions d'architecture (D-01 à D-21)

| N° | Décision | État |
|---|---|---|
| D-01 | Une base de données par école | en vigueur ; **à confirmer par la mesure de 200 bases** (PLA-06), puisque la cible compte désormais beaucoup de petites écoles |
| D-02 | L'école se déduit de l'adresse et du jeton, jamais du corps de la requête | en vigueur |
| D-03 | Un contexte d'école obligatoire pour toute lecture ou écriture | en vigueur ; l'essai du 29 octobre montre que la solution tient (`17-essai-contexte.md`) |
| D-04 | Un service « Plateforme » à part, avec sa base | en vigueur (PLA) |
| D-05 | Un compte pour la plateforme, des appartenances par école | en vigueur ; à relire avec VSC-01 (parents à deux écoles) |
| D-06 | Le code garde le sens, l'école nomme | en vigueur ; **à amender** dans VSC-01 pour les groupes transversaux (langues, options), hors de la limite de trois niveaux |
| D-07 | Réglages datés, « aperçu puis appliquer » | en vigueur ; MOT-01 en est le socle |
| D-08 | Import : zone de préparation, classeur unique, clés naturelles | en vigueur (ADM-03) |
| D-09 | Solveur : règles dures fixes, règles souples réglables | **amendée le 4 novembre** : 26 règles strictes verrouillées, 22 strictes réglables, 86 souples. Un profil ou la Plateforme peut rendre une règle stricte ; l'école ne choisit que « indispensable » |
| D-10 | Enseignants partagés : heures « occupé » fédérées | en vigueur (ADM-07) |
| D-11 | Marque et documents par école | en vigueur (migration 0055) |
| D-12 | Les jeux dans un service à part, des gabarits d'abord | en vigueur (QJE-05) |
| D-13 | Fonds des créateurs de jeux, par école | **gelée** avec la vente ; son calcul change avec un prix par module |
| D-14 | Échanges entre services : HTTP signé et boîte d'envoi | en vigueur |
| D-15 | Une donnée a un seul propriétaire, identifiant stable | en vigueur (BIB-01) |
| D-16 | Exploitation : vagues, migrations compatibles, sauvegardes hors serveur | en vigueur (EXP) |
| D-17 | Monolithe modulaire ; quatre services séparés | en vigueur |
| D-18 | Désactiver plutôt que supprimer | en vigueur |
| D-19 | L'année est le cadre ; une année close est en lecture seule | en vigueur (ADM-06) |
| D-20 | Des sites indépendants dans une même école | en vigueur, conditionnelle (PLA-13) |
| D-21 | Configuration et marque dans la base de l'école | en vigueur |

## 2. Décisions de produit et de travail, datées

| Date | Décision | Remplace |
|---|---|---|
| 11 oct. | Les comptes actifs sont facturés à l'école ; l'IA est incluse ; on dit « Bibliothèque » ; la soutenance n'est plus un repère | — |
| 15 oct. | L'espace de cours est géré dans Planner, ses fichiers sont gardés par StudyLib | — |
| 20 oct. | Limite d'appels à l'API par compte ; sortir de ClassQuiz au profit du Studio quiz | — |
| 20 oct. | Dans les écrans et les messages, on dit « Quiz » ; « PlannerQuiz » et « ClassQuiz » restent des noms techniques | — |
| 21 oct. | La publication de l'emploi du temps est faite par l'administration ; un report se fait sans choix d'heure (le solveur propose, puis l'administration valide) | — |
| 24 oct. | Planner pour toute école, une base par école, sites indépendants (plan multi-établissements validé) | — |
| 25 oct. | Les devoirs avec rendu de fichier reviennent (COU-02) | « devoirs masqués » du 11 octobre |
| 26 oct. | Revue d'expert : corrections R-1 à R-5 retenues, R-6 (sauvegardes à clé publique) faite le 29 octobre, R-7 et R-8 non retenues | — |
| 29 oct. | Un test de régression avant d'annoncer un correctif ; suite complète et parcours (la CI tranche si le poste ne peut pas) | — |
| 30 oct. | Supervision : sonde hébergée, alerte par notification sur le téléphone et par courriel, **aucune erreur envoyée hors du serveur** | — |
| 31 oct. | L'ancien serveur expire ; Planner est réinstallé ailleurs ; les secrets sont copiés à part (ils ne sont dans aucune sauvegarde) | — |
| 3 nov. | Le solveur devient un **moteur central configurable par profil** (primaire, collège, lycée, formation, université), jamais un générateur par type d'école ; Timefold contre CP-SAT se tranche par la mesure | — |
| 3 nov. | Style neutre et école fictive tant qu'une école n'est pas configurée (socle neutre) | — |
| 4 nov. | **La pile ne change pas** (Express, Sequelize, MySQL, React et MUI, Timefold) ; la pile proposée par `plan.txt` n'est pas retenue. L'étude de la pile se clôt dans QUA-03 | — |
| 4 nov. | MP-1 : table unique de valeurs avec portée ; migrations 0059 (EC-9), 0060 (socle neutre), 0061 (MP-1) | — |
| 4 nov. | Planner ne connaît pas les bâtiments : ni filière ni classe n'a de campus | R-3 du 21 octobre |
| 4 nov. | Le socle est inclus dans tout abonnement | — |
| 5 nov. | **Vente mise de côté** : facturation, contrats, offre d'IA, école pilote, démonstration aux directeurs, campagne marketing. Priorité : régler les problèmes reprochés aux autres outils | — |
| 5 nov. | Un site public du produit, pour être contacté (VIT) | — |
| 5 nov. | Le nom du produit est **Planner** ; Jadwal est abandonné | Q-29 |
| 7 nov. | **Plusieurs écoles sur une installation d'abord**, puis le scolaire, puis le pack « École privée » | la feuille de route du 4 novembre au soir (« finir le supérieur d'abord ») |
| 7 nov. | Cible : écoles privées de la maternelle au lycée, puis formation professionnelle ; HESTIM reste servi | Q-3 (« supérieur seulement, pas de mineurs ») |
| 7 nov. | **Le dépôt GitHub reste public** (limite de durée de GitHub Actions sur un dépôt privé) ; règle : aucune donnée réelle ni aucun secret dans le dépôt | « dépôt privé » du 11 octobre |
| 7 nov. | Ce plan par modules remplace tous les plans précédents ; une session = une fonction, sur sa branche, fusionnée si la définition de « terminé » est tenue | — |
| 7 nov. | Nouveau serveur Debian, partagé avec n8n (adresse et accès hors du dépôt, qui est public) : **tout en conteneurs, n8n n'est jamais touché** | serveur provisoire du 31 octobre |
| 8 nov. | `docs/users.xlsx` ne contient que des personnes fictives : **pas de réécriture de l'historique** ; le dépôt reste public (GitHub Actions) | Q-14 |
| 8 nov. | **`main` protégée** : CI verte exigée avant de fusionner (déjà en place : les 6 contrôles de la CI) ; les parcours qui échouaient le dimanche sont corrigés (QUA-07) | Q-15 |
| 8 nov. | **Un élève a un compte, créé par son établissement** (jamais d'inscription libre) | Q-02 (« séparer la personne du compte ») et Q-14 de conception-c5 |
| 8 nov. | Les réponses proposées aux questions Q-1 à Q-13 de [conception-c5](../conception/vie-scolaire/conception-c5-modele-donnees-scolaire.md) sont retenues ; sa Q-14 est remplacée par la décision précédente | Q-03 |
| 9 nov. | **Le chef de projet est le compte Claude20022002**, initiateur et maître du projet : lui seul pousse, fusionne, ouvre et ferme un chantier, valide un plan, tranche une décision ([organisation.md](organisation.md)) | — |
| 9 nov. | **Chantiers de module** : au plus 3 ouverts à la fois ; on ne prend une fonction que dans un chantier ouvert ; un chantier commencé se termine | — |
| 9 nov. | **Une tâche, une branche**, nommée par son type (`feat/`, `fix/`, `etude/`, `refactor/`, `test/`, `doc/`, `chore/`, `mkt/`) puis son identifiant | les préfixes de module (`pla/`, `mot/`…) du 7 novembre |
| 9 nov. | **Aucun code sans plan de conception validé** par le chef ; l'agent pose ses questions avant, sans rien supposer | « conception d'abord pour une fonction M ou plus » du 7 novembre |
| 9 nov. | **Fin de session obligatoire** : `suivi.md` à jour et une fiche de session avec son prompt de reprise ; une session trop longue se résume (`/compact`) ou passe la main | — |
| 9 nov. | Module **MKT** (marketing) ajouté, porté par les 9 agents de `..\planner-marketing` ; la vente reste gelée : on prépare, on ne publie pas | — |
| 9 nov. | Chantier **PLA** ouvert, dans l'ordre PLA-06, PLA-03, PLA-05, PLA-01, PLA-02, PLA-04, PLA-07 ; ordre validé et chantier **EXP** confirmé ouvert (EXP-01 à EXP-05) le 10 novembre | — |
| 10 nov. | Chantier **QUA** ouvert, limité à **QUA-03** (clore l'étude de la pile), pour débloquer PLA-01 : 3 chantiers ouverts sur 3 | — |
| 10 nov. | L'agence marketing se sauvegarde dans un **dépôt GitHub privé** `planner-marketing` (logos, stratégie) ; la vente reste gelée : le marketing prépare, ne publie pas | — |
| 10 nov. | PLA-06 : mesure en local, MySQL limité aux ressources du nouveau serveur ; 200 bases au schéma complet, chacune avec une école fictive d'environ 300 élèves ; seuils, activité et réglages proposés le 9 novembre, retenus le 10 ; si D-01 tombe, le chantier PLA s'arrête jusqu'à décision | — |

**Questions anciennes déjà réglées**, gardées pour mémoire :
- **Q-8** : partage des heures éteint par défaut.
- **Q-11** : essai gratuit effacé après 60 jours (gelé).
- **Q-12 à Q-14** : 5 ans de conservation, 30 jours de grâce, préavis de 5 jours.
- **Q-16 et Q-24** : IA avec Haiku 5.5, sous enveloppe.
- **Q-17, Q-18 et Q-28** : contrat annuel, accompagnement, forfaits (gelés).
- **Q-20 et Q-26** : 15 minutes de perte au plus, 4 h pour rétablir, 99,5 % de disponibilité.
- **Q-21** : une deuxième personne en production (qui : Q-10 ci-dessous).
- **Q-22** : les créateurs de jeux plus tard.
- **Q-23** : une école qui l'exige est hébergée au Maroc, dans une instance dédiée.

## 3. Questions ouvertes

| N° | Question | Proposition | Bloque |
|---|---|---|---|
| Q-01 | Effectif réel, budget, date cible. Qui finance une équipe plus nombreuse, et jusqu'à quand ? | viser la rentrée de septembre 2027 pour le pack « École privée », sinon réduire le pack | l'étape 4 |
| Q-04 | Relecture du contrat de MP-1 (R-1 à R-10 du groupe B) | à répondre avant les écrans de MOT-01 | MOT-01 (écrans) |
| Q-05 | Fin de la ligne Timefold 1.x (annoncée début 2027, à confirmer) ; en 2.x, `ScoreAnalysis`, qu'utilise le solveur, devient payant | décider dans MOT-04, avant l'étape 3 | MOT-03, EP-4 |
| Q-06 | Entretiens de terrain : séparés de toute démonstration ? | oui : cinq directeurs écoutés, sans rien leur montrer, avant de concevoir VSC-04 et FIN-01 | VSC-04, FIN-01 |
| Q-07 | Primaire et maternelle : emploi du temps généré, ou simple saisie ? | collège et lycée générés d'abord ; primaire et maternelle en saisie simple tant qu'un entretien n'en dit pas plus | MOT-07 |
| Q-08 | Le catalogue n'a pas de profil maternelle ; la colonne « École privée » de `profils.md` désigne le profil formation | ajouter un profil ou décider que la maternelle n'est pas générée (avec Q-07) | MOT-05 |
| Q-09 | École pilote (ancienne Q-25), et où elle est hébergée (Q-23) | gelé avec la vente | VEN |
| Q-10 | Qui est la deuxième personne en production (ancienne Q-27) ? | à nommer avant la première école extérieure | EXP |
| Q-11 | Nom de domaine du nouveau serveur, et du site vitrine | à choisir avant EXP-02 et VIT-02 | EXP-02, VIT-02 |
| Q-12 | Images du registre GitHub (`ghcr.io`) publiques ou privées ? | publiques (aucun secret dans les images) ; sinon un jeton en lecture seule sur le serveur | EXP-03 |
| Q-13 | Service de sonde : Better Stack ou UptimeRobot | à l'inscription, selon les limites de l'offre gratuite | EXP-05 |
| Q-16 | Règles du carnet de notes (modification, verrouillage, arrondis) | à faire valider par une scolarité et le juriste | VSC-04 |
| Q-17 | Règles de modération de la messagerie | à trancher avant COU-08 | COU-08 |
| Q-18 | Nom de l'application dans les magasins | « Planner » sauf conflit de marque | MOB |
| Q-19 | Les 28 questions juridiques, fiscales et Massar de l'étude du modèle économique | gelées, sauf Massar (VSC-05) et loi 09-08 (condition légale) | VSC-05 |
| Q-20 | Un élève a un compte (décision du 8 novembre), mais un enfant de 6 ans n'a pas d'adresse électronique, et `Users.email` est obligatoire et unique. Avec quoi se connecte-t-il ? | un **identifiant donné par l'école**, adresse facultative, mot de passe initial remis par l'école (ou par le parent) ; pas d'adresse factice. Étude d'impact sur chaque fichier qui lit `Users.email` (connexion, réinitialisation, notifications, import) | VSC-01 |
