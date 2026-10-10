# Plan : répondre aux critiques, profil par profil

Statut : **à valider**. Rédigé le 11 octobre 2026. Dix regards ont été portés sur le projet (développeur, chef de projet, expert UI/UX, expert marketing, administrateur, professeur, étudiant, investisseur, acheteur, regard extérieur). Ce plan donne une réponse à chaque critique et dit quand elle se traite.

Il complète `assainissement.md` sans le remplacer : quand une réponse existe déjà là-bas, ce plan y renvoie. Les lots nouveaux portent la lettre **R**. Les critiques sur le marché, les prix et l'usage sont des jugements : le projet ne mesure pas encore son usage (voir R-12).

## 1. Décisions prises le 11 octobre 2026

| Sujet | Décision |
|---|---|
| Application mobile pour les enseignants | **Une idée pour un plan futur**, pas un lot à faire avant la soutenance. Les lots M-1 à M-4 de `espace-enseignant.md` sont reportés ; `assainissement.md` est mis à jour en conséquence. En attendant, l'enseignant utilise le site sur son téléphone. |
| Adresse `finadmintech.fr` | Elle ne sert qu'à disposer d'un nom de domaine. Ce n'est pas une marque. Une adresse propre à l'école la remplacera à l'adoption. |
| Trajectoire du produit | Aujourd'hui : **HESTIM Planner**, conçu pour être adopté par HESTIM. Demain : **Planner**, adoptable par n'importe quel établissement (§ 4). |
| Revenu futur | Un **montant facturé à l'école par utilisateur** (§ 5). |
| Récit du produit | Une **vidéo en motion design, courte**, réalisée une fois les problèmes actuels réglés (§ 6). |

## 2. Quand traiter quoi

- **Maintenant** : avant la soutenance, dans le cadre de `assainissement.md`.
- **Après** : après la soutenance, avant toute démarche vers un autre établissement.
- **Planner** : quand le produit s'ouvre à d'autres établissements (§ 4).

## 3. Critiques et réponses

### Développeur

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Cinq technologies pour une petite équipe ; chaque fonction de quiz en touche trois | Ne plus ajouter de type de question ni de fonction au fork avant la soutenance (déjà acté : `assainissement.md`, § 3.2). Ensuite, trancher par une note écrite : garder le fork, ou faire jouer les quiz par Planner lui-même, qui corrige déjà les devoirs et joue déjà les parties dans l'application | R-1 | Après |
| Le fork s'éloigne de son projet d'origine | Un fichier `FORK.md` dans le dépôt du quiz : commit d'origine suivi, liste des fichiers modifiés pour HESTIM, règle « une modification HESTIM vit dans un fichier HESTIM quand c'est possible ». Pas de reprise de l'amont avant la soutenance | R-2 | Maintenant |
| Le déploiement par superposition casse dès que les dépendances changent | `preparer-maj.sh` compare `package-lock.json` à celui de l'image en ligne et s'arrête avec un message clair s'il a changé (« reconstruire l'image »). La procédure de chargement d'une image est écrite dans `DEPLOIEMENT.md` | R-3, avec A-9 | Maintenant |

### Chef de projet

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Le périmètre dérive : des fonctions sont demandées, construites puis retirées le même jour | Gel du périmètre (`assainissement.md`, 0-4). Toute idée nouvelle s'écrit dans une « boîte à idées » en fin de plan, sans code, et n'est examinée qu'au point hebdomadaire. Un journal des décisions, une ligne par décision, avec sa date | R-4 | Maintenant |
| La recette n'a jamais été déroulée (134 scénarios) | Ne pas viser les 134 d'un coup : dérouler la section 0 et les cinq parcours de démonstration après le déploiement (0-3), et automatiser ces cinq parcours (B-8). Le reste se déroule par rôle, une section par semaine | 0-3, B-8 | Maintenant |
| L'IA est prête mais bloquée par une décision de l'école | Une note d'une page pour l'école : ce qui part chez le fournisseur (le texte du support, aucune donnée d'étudiant), les options (fournisseur hors du Maroc, fournisseur européen, service coupé), le coût par quiz, la conservation de 30 jours. L'école coche une option | R-5 | Maintenant |

### Expert UI/UX

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Trois identités visuelles (Planner, StudyLib, quiz) | Avant la soutenance, seulement la cohérence de ce qui relie les trois : même marque, même sélecteur d'espaces, mêmes noms (R-7). L'unification des styles demande de reprendre les composants de deux applications : elle attend Planner | R-7, puis Planner | Maintenant, puis Planner |
| L'enseignant est « surtout sur mobile » mais n'a pas d'application ; son rappel d'appel ne s'affiche que si le site est ouvert | Décision du 11 octobre : idée pour un plan futur. D'ici là, le site sur téléphone (onglet « Mes classes » en bas, fait) et le rappel à l'écran. Corriger `PRODUCT.md` s'il dit encore que l'enseignant a une application | Idée future | Planner |
| La page Activités mélange jeux, quiz en direct, devoirs et IA | Pour l'enseignant, deux zones nettes sur la page : « Mes quiz » (en direct, en devoir, par l'IA) en haut, « Jeux de mes modules » en dessous. Pas de nouvelle page | R-6 | Maintenant, priorité 2 |

### Expert marketing

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Quatre noms pour un produit | Une règle de nommage : **Planner** est le produit ; **HESTIM Planner** est l'installation de HESTIM ; ses espaces s'appellent **Planner**, **Bibliothèque**, **Quiz** et **Activités** dans tous les écrans. « StudyLib », « ClassQuiz » et « PlannerQuiz » restent des noms techniques ou d'onglet, jamais des marques concurrentes. L'application mobile s'appelle « HESTIM Planner » | R-7 | Maintenant |
| La promesse n'est dite nulle part | Une phrase et trois preuves, reprises telles quelles par la page d'accueil, le README et la vidéo. Proposition : « L'emploi du temps, l'appel et les quiz d'une école, au même endroit. » Preuves : un emploi du temps généré sans conflit ; un appel en une minute, sans fraude ; un quiz rattaché à la séance, sans code à saisir | R-8 | Maintenant |
| L'adresse `finadmintech.fr` ne dit rien d'une école | Sans objet aujourd'hui (décision § 1). À l'adoption : une adresse de l'école. Le code de l'application ne contient aucune adresse (`SITE_ADDRESS`, `QUIZ_ADDRESS`) ; seuls quatre fichiers de `deploy/vps/` la citent, à paramétrer au changement de domaine | P-2 | Planner |

### Administrateur de l'école

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Plus de travail : réservations, téléphones à délier, demandes de report | Regrouper ce qui l'attend sur son tableau de bord (le panneau « À traiter » existe) : reports en attente, téléphones à délier, séances sans appel. Et alléger la source la plus fréquente : l'étudiant demande lui-même le changement de téléphone (R-10) | R-9, R-10 | Après |
| Risque sur la paie : une séance planifiée et passée est comptée réalisée d'office, même si le cours n'a pas eu lieu | L'appel sert de preuve. Dans « Heures du mois » et dans l'export des vacataires, une séance sans appel validé est marquée « à vérifier ». L'administration la confirme ou l'écarte avant l'export. Aucune action de plus pour l'enseignant | R-11 | Maintenant, priorité 1 |
| Sauvegardes faites seulement à chaque mise à jour, sur le même serveur | Sauvegarde quotidienne hors du serveur, restauration testée | A-3 | Maintenant |

### Professeur

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Le quiz se lance sur un autre site | Lancer et projeter le quiz depuis Planner. En attendant : arrivée sans reconnexion, même onglet, lien de retour (fait) | CQ-1 à CQ-3 | Maintenant |
| Un quiz créé par l'IA ne se modifie plus depuis Planner | Route de mise à jour d'un quiz (reste de IA-4) et éditeur « Mes quiz » (reste de IA-5) | IA-4, IA-5 | Après |
| Plus de devoir « fichier », pas d'export des notes | Le devoir « fichier » a été retiré par décision : on ne le remet pas. Pour les notes : un export CSV des notes d'un devoir, protégé contre les formules comme les autres exports | R-13 | Après |

### Étudiant

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Un compte lié à un seul téléphone : téléphone cassé ou changé, il ne peut plus pointer | Depuis l'application, l'étudiant déclare son nouveau téléphone ; l'administration reçoit la demande et l'accepte d'un geste. La demande est tracée, pour que la protection contre la fraude reste entière | R-10 | Après |
| Pas de pointage sans smartphone | L'enseignant coche à la main sur son écran d'appel : c'est en place et expliqué dans l'aide. Rien de plus | — | Fait |
| Les alertes de devoir et de quiz ne s'ouvrent pas au toucher | Dans l'application, une alerte ou un push de devoir ouvre le devoir, celle d'un quiz ouvre la partie | R-14 | Maintenant, priorité 2 |

### Investisseur

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Un seul client, aucun modèle de revenu | Modèle retenu : un montant par utilisateur, facturé à l'école (§ 5). HESTIM est le premier client et la référence | § 5 | Planner |
| Une seule personne sait tout | Revue croisée entre les deux équipes, documentation rangée, procédures de déploiement et de retour arrière écrites et suivies une fois | `assainissement.md`, § 6, A-9, A-10 | Maintenant |
| Dépendances risquées : fork sous licence MPL, fournisseur d'IA étranger | Licence : noter dans `FORK.md` ce qu'elle impose (les fichiers modifiés restent publiés) et ce qu'elle permet (un usage commercial). IA : le fournisseur est déjà configurable ; la note R-5 fixe le choix | R-2, R-5 | Maintenant |
| Aucun chiffre d'usage | Des compteurs tirés des tables existantes, sans traceur : comptes actifs par mois et par rôle, appels validés, quiz joués, devoirs rendus. Ils servent aussi à la facturation par utilisateur | R-12 | Après |

### Acheteur (un autre établissement)

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| Le produit n'est pas transposable : marque HESTIM dans le code, installation à la main | Trois étapes (§ 4) : sortir la marque du code, rendre l'installation reproductible, puis seulement se poser la question de plusieurs établissements sur un même serveur | P-1 à P-3 | Planner |
| Rien sur l'engagement de service, la réversibilité, la conformité | Un dossier court pour l'acheteur : où sont les données, sauvegardes et délai de restauration, export complet des données à la demande, durées de conservation (déjà fixées : journal 365 jours, supports de l'IA 30 jours), registre des traitements pour la loi 09-08 | P-4 | Planner |

### Regard extérieur

| Critique | Réponse | Lot | Quand |
|---|---|---|---|
| « C'est quoi, exactement ? » | La promesse en une phrase (R-8) et la vidéo courte (§ 6) | R-8, V-1 | Maintenant, puis après |
| Un dépôt public avec des données personnelles | Dépôt privé tout de suite, puis historique réécrit | 0-1 | Maintenant |

## 4. De « HESTIM Planner » à « Planner »

L'ordre compte : chaque étape rend la suivante possible, et aucune n'est à faire avant que HESTIM ait adopté le produit.

| Lot | Contenu | Résultat |
|---|---|---|
| **P-1** | Sortir l'établissement du code : nom, logo, couleurs, domaine des adresses, fuseau, textes des e-mails dans une configuration d'établissement. Aujourd'hui « HESTIM » est écrit dans les écrans, les e-mails, le PDF officiel et l'application | Changer d'école ne demande plus de modifier le code |
| **P-2** | Installation reproductible : une commande, un fichier de configuration, une documentation pour l'exploitant, des images publiées avec un numéro de version | Un tiers installe Planner sans l'auteur |
| **P-3** | **Une installation par établissement** d'abord. Le partage d'un même serveur entre plusieurs établissements ne se décide qu'avec un deuxième client réel : c'est un chantier lourd, qui touche toutes les tables | Deux écoles servies sans risque de mélange de données |
| **P-4** | Dossier de l'acheteur : hébergement, sauvegardes, réversibilité, conformité, engagement de service | Une école peut signer |
| **P-5** | Unifier le style des trois espaces sous l'identité de Planner | Un seul produit à l'œil |

Ce qui aide déjà : le code de l'application ne contient aucune adresse (seuls les scripts de `deploy/vps/` en citent une), le fournisseur d'IA est configurable, et les règles propres au Maroc (Ramadan, fuseau) sont isolées dans leurs fichiers.

## 5. Revenu : un montant par utilisateur, facturé à l'école

Le principe est retenu. Il reste à le préciser avant d'en parler à un établissement :

- **Qui compte comme utilisateur ?** Tout compte créé, ou seulement les comptes actifs dans le mois ? Les étudiants seulement, ou aussi les enseignants et l'administration ? Un compteur de comptes actifs (R-12) permet les deux lectures.
- **Qui porte le coût de l'IA ?** Chaque génération de quiz se paie au fournisseur. Soit le prix par utilisateur l'inclut avec un plafond (le quota par enseignant existe déjà), soit l'IA est une option.
- **La facturation reste hors du produit** au début : un relevé mensuel exporté suffit. Pas de paiement en ligne.
- **HESTIM** : premier établissement, donc conditions de lancement à décider (gratuité pendant le pilote, prix réduit ensuite).
- **Licence du moteur de quiz** : elle permet un usage commercial, à condition de laisser publiés les fichiers modifiés (R-2).

## 6. La vidéo en motion design

Elle se fait **une fois les problèmes actuels réglés** : une vidéo montre les écrans, et les écrans bougent encore.

- **Courte** : 60 à 75 secondes. Une personne qui la lance ne doit jamais se demander quand elle finit : une barre de progression discrète reste visible, et la durée est annoncée avant la lecture.
- **Une seule histoire**, pas une liste de fonctions : une matinée à l'école. L'emploi du temps arrive sur le téléphone de l'étudiante ; le professeur projette le QR code et la classe est pointée en une minute ; il lance un quiz, les réponses s'affichent ; l'administration voit la séance faite. La promesse (R-8) ouvre et ferme la vidéo.
- **Lisible sans le son** : sous-titres en français et en anglais, aucune information portée par la voix seule.
- **Outil** : le dépôt contient déjà un projet de vidéo (`docs/presentation/video`, Remotion). La nouvelle le remplace ; ses fichiers audio ne sont plus versionnés (ils pèsent l'essentiel des 88 Mo du dépôt).
- **Distincte des vidéos de guide** par rôle (G-2, G-3 de `espace-enseignant.md`), qui restent reportées : celles-ci expliquent comment faire, celle-là dit ce que c'est.

Lot **V-1**, après la soutenance ou juste avant si le périmètre est gelé à temps.

## 7. Lots nouveaux

Effort : **S** = une demi-journée au plus ; **M** = 1 à 3 jours ; **L** = plus de 3 jours.

| Lot | Contenu | Équipe | Effort | Quand |
|---|---|---|---|---|
| **R-1** | Note de décision : garder le fork du quiz, ou faire jouer les quiz par Planner | A et B | S | Après |
| **R-2** | `FORK.md` dans le dépôt du quiz : commit d'origine, fichiers modifiés, obligations de la licence | A | S | Maintenant |
| **R-3** | `preparer-maj.sh` s'arrête si les dépendances du backend ont changé ; chargement d'une image écrit dans `DEPLOIEMENT.md` | A | S | Maintenant |
| **R-4** | Boîte à idées en fin de chaque plan et journal des décisions (`docs/decisions.md`) | Chef de projet | S | Maintenant |
| **R-5** | Note d'une page pour l'école sur le fournisseur d'IA | Chef de projet | S | Maintenant |
| **R-6** | Page Activités de l'enseignant en deux zones : « Mes quiz », puis « Jeux de mes modules » | B | S | Maintenant, priorité 2 |
| **R-7** | Règle de nommage appliquée aux écrans du site, de l'application, de la bibliothèque et du quiz | B | S | Maintenant |
| **R-8** | La promesse et ses trois preuves sur la page d'accueil et dans le README | B | S | Maintenant |
| **R-9** | Tableau de bord de l'administration : téléphones à délier et séances sans appel dans « À traiter » | B, avec A pour les données | M | Après |
| **R-10** | L'étudiant demande le changement de téléphone depuis l'application ; l'administration l'accepte d'un geste | A (route), B (écrans) | M | Après |
| **R-11** | Séances sans appel validé marquées « à vérifier » dans « Heures du mois » et dans l'export des vacataires | A (calcul), B (écran) | M | Maintenant, priorité 1 |
| **R-12** | Compteurs d'usage mensuels tirés des tables existantes, avec export | A | M | Après |
| **R-13** | Export CSV des notes d'un devoir | A (route), B (bouton) | S | Après |
| **R-14** | Application : une alerte ou un push de devoir ou de quiz ouvre le bon écran | B | S | Maintenant, priorité 2 |
| **V-1** | Vidéo de présentation en motion design, 60 à 75 secondes | Chef de projet | L | Après |
| **P-1 à P-5** | De HESTIM Planner à Planner (§ 4) | A et B | L | Planner |

## 8. Points ouverts

- **R-11, la paie** : est-ce bien l'appel validé qui prouve qu'une séance a eu lieu ? Un enseignant qui oublie l'appel verrait sa séance « à vérifier » : c'est le but, mais il faut que l'école l'accepte.
- **Utilisateur facturé** (§ 5) : compte créé ou compte actif, et quels rôles ?
- **Nom de l'espace de la bibliothèque** : « Bibliothèque » partout, ou « StudyLib » reste-t-il visible ?
- **La promesse** (R-8) : la phrase proposée est un point de départ, à écrire avec vos mots.
- **La vidéo** : avant ou après la soutenance ?
