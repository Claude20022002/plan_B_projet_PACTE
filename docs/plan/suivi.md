# Suivi des fonctions

**Le seul tableau des fonctions et de leur état.** Toute personne et tout agent le met à jour **à la fin de chaque session, obligatoirement** ([organisation.md](organisation.md), § 7), dans la branche de sa tâche, avec sa fiche de session dans `docs/sessions/`.

Une ligne par fonction. L'état passe à « en cours » (avec la branche) au premier commit, à « PR ouverte » (avec le numéro) quand la PR existe, puis à « fait » à la fusion. Le détail, les dépendances et les critères de « terminé » sont dans le fichier du module (lien sur l'identifiant). L'état réel = ce fichier sur `main`, plus les PR ouvertes (`gh pr list`).

États : à faire · en cours · PR ouverte · fait · reporté (plus tard, sans date) · gelé (attend la reprise de la vente) · conditionnel (attend une décision).

## Chantiers

Au plus **3 chantiers ouverts** en même temps, bloqués compris. On ne prend une fonction que dans un chantier ouvert. Un chantier ouvert se termine avant d'en ouvrir un autre à sa place ([organisation.md](organisation.md), § 3).

### Ouverts (3 sur 3)

| Module | Ouvert le | Fonctions du chantier, dans l'ordre | Reste | État |
|---|---|---|---|---|
| [EXP](modules/EXP-exploitation.md) | avant le 9 nov. (EXP-01 en cours) | EXP-01, EXP-02, EXP-03, EXP-04, EXP-05 | 5 | ouvert ; liste confirmée le 10 nov. |
| [PLA](modules/PLA-plateforme.md) | 9 nov. 2026 | PLA-06, PLA-03, PLA-05, PLA-01, PLA-02, PLA-04, PLA-07 | 7 | ouvert ; ordre validé le 10 nov. PLA-01 attend EXP-02 et QUA-03, PLA-07 attend EXP-04 |
| [QUA](modules/QUA-qualite-docs.md) | 10 nov. 2026 | QUA-03 | 1 | ouvert, limité à QUA-03 pour débloquer PLA-01 |

### Fermés

| Module | Ouvert le | Fermé le | Fonctions |
|---|---|---|---|
| — | | | |

### Travaux en cours hors chantier, d'avant la règle

| Quoi | Branche ou PR | À faire |
|---|---|---|
| Correctif : le dimanche s'affiche dans l'emploi du temps (CI de `main` rouge le dimanche) | `fix/edt-dimanche-visible` (local) | pousser, PR, fusionner en premier |
| Essai du contexte d'école (base de PLA-01) | #142 | fusionner après le correctif |
| MOT-01, partie serveur (MP-1) | #156 | fusionner après #142 |
| Plan par modules | #161 | fusionner après #156 |
| Organisation de l'équipe, module MKT | `doc/organisation-equipe` | fusionner après #161 |

## Numéros de migration réservés

Réserver ici **avant** d'écrire une migration. Le moteur de migrations (Umzug) applique toute migration absente de `SequelizeMeta`, même hors d'ordre : un trou dans la numérotation est sans danger.

| Numéro | Fonction | État |
|---|---|---|
| 0059 | COU-01 sondages (EC-9) | fusionnée |
| 0060 | UIX-01 socle neutre | réservée |
| 0061 | MOT-01 valeurs du moteur (MP-1) | dans la PR #156, pas encore fusionnée |
| 0062 à 0079 | VSC-01 et suivantes : tables du scolaire | réservées |
| 0080 et plus | libres | — |

## Fonctions

| ID | Fonction | Étape | Taille | État | Branche ou PR |
|---|---|---|---|---|---|
| [PLA-01](modules/PLA-plateforme.md) | Contexte d'école en production | 2 | L | à faire (essai en PR, pas encore fusionné) | #142 (essai) |
| [PLA-02](modules/PLA-plateforme.md) | Fermer les canaux de l'étape 2 | 2 | L | à faire |  |
| [PLA-03](modules/PLA-plateforme.md) | Base neuve sans données d'école | 2 | M | à faire |  |
| [PLA-04](modules/PLA-plateforme.md) | Tests d'isolation de chaque route dans la CI, côté serveur et parcours | 2 | M + S | à faire |  |
| [PLA-05](modules/PLA-plateforme.md) | Registre des écoles et création d'une école par une commande (base, migrations,… | 2 | L | à faire |  |
| [PLA-06](modules/PLA-plateforme.md) | Mesure de D-01 | 1 | M | en cours : plan revu (21 corrections), en attente de validation | `etude/pla-06-mesure-d01` |
| [PLA-07](modules/PLA-plateforme.md) | Sauvegarde et restauration par école (canal I-11) | 2 | M | à faire |  |
| [PLA-08](modules/PLA-plateforme.md) | Console de l'équipe Planner (créer, suspendre, voir l'état des écoles) | 5, ou juste avant la 1re école extérieure | M | reporté |  |
| [PLA-09](modules/PLA-plateforme.md) | Migrations par vagues, hors du démarrage du serveur | 5, ou juste avant la 1re école extérieure | M | reporté |  |
| [PLA-10](modules/PLA-plateforme.md) | Choisir son école à la connexion | 5, ou juste avant la 1re école extérieure | M | reporté |  |
| [PLA-11](modules/PLA-plateforme.md) | Comptes communs | 5 | L | reporté |  |
| [PLA-12](modules/PLA-plateforme.md) | Export complet d'une école | 5 | M | à faire |  |
| [PLA-13](modules/PLA-plateforme.md) | Une école hors du Maroc configurée sans changer le code (fuseau, langue, devise) | 5 | M (+ L, conditionnel) | reporté |  |
| [EXP-01](modules/EXP-exploitation.md) | Nouveau serveur | 0 | S | en cours |  |
| [EXP-02](modules/EXP-exploitation.md) | Première installation conteneurisée à côté de n8n. Comprend | 1 | L | à faire |  |
| [EXP-03](modules/EXP-exploitation.md) | ME-0b adapté au nouveau serveur | 1 | M | code fait (#145), adaptation à faire | #145 |
| [EXP-04](modules/EXP-exploitation.md) | Sauvegardes sur le nouveau serveur | 1 | M | à faire |  |
| [EXP-05](modules/EXP-exploitation.md) | Supervision en service | 1 | M | code fait, mise en service à faire | ME-21 |
| [EXP-06](modules/EXP-exploitation.md) | Premier administrateur d'une vraie école, sans le jeu de démonstration d'HESTIM… | 2 | S | à faire |  |
| [EXP-07](modules/EXP-exploitation.md) | Noms neutres | 2 | M | à faire |  |
| [EXP-08](modules/EXP-exploitation.md) | Test d'intrusion et de charge, avant que toute école extérieure utilise l'installation… | 4 | M | à faire |  |
| [EXP-09](modules/EXP-exploitation.md) | Mises à jour de StudyLib et ClassQuiz par la CI comme le reste (aujourd'hui par paquets) | libre | M | à faire |  |
| [MOT-01](modules/MOT-moteur.md) | Valeurs du moteur datées et résolues (profil, école, niveau) | 1 | M | PR ouverte (partie serveur) ; écrans avec ADM-02 | #156 |
| [MOT-02](modules/MOT-moteur.md) | Mesurer le solveur sur un jeu scolaire (collège de 600 élèves), puis sur 20 000… | 1 | M | à faire |  |
| [MOT-03](modules/MOT-moteur.md) | Validation avant le calcul | 3 | M | à faire |  |
| [MOT-04](modules/MOT-moteur.md) | Modèle neutre et évaluateur indépendant | 3 | L + M | à faire |  |
| [MOT-05](modules/MOT-moteur.md) | Profils et nomenclatures lus dans la base (cycle, niveau, classe, demi-groupe), à la… | 2 puis 3 | M + L | à faire |  |
| [MOT-06](modules/MOT-moteur.md) | Collège | 3 | XL | à faire |  |
| [MOT-07](modules/MOT-moteur.md) | Lycée | 3 | L | à faire |  |
| [MOT-08](modules/MOT-moteur.md) | File simple des calculs | 2 | M | à faire |  |
| [MOT-09](modules/MOT-moteur.md) | Remplaçant proposé automatiquement en cas d'absence d'un enseignant | 4 | M | à faire |  |
| [MOT-10](modules/MOT-moteur.md) | Grande échelle | 5 | L | à faire |  |
| [MOT-11](modules/MOT-moteur.md) | Règles nouvelles, famille par famille (examens dans le calcul F-8, ressources F-7,… | 5 | M par famille | à faire |  |
| [EDT-01](modules/EDT-emploi-du-temps.md) | Changement structurel refusé une fois les séances générées (groupes, volumes), avec un… | 3 | S | à faire |  |
| [EDT-02](modules/EDT-emploi-du-temps.md) | Horaires saisonniers (ramadan, hiver, été) appliqués sans tout regénérer | libre | M | à faire |  |
| [EDT-03](modules/EDT-emploi-du-temps.md) | Écran d'explication des conflits et des refus | 3 | M | à faire |  |
| [EDT-04](modules/EDT-emploi-du-temps.md) | Publication, PDF et courriels selon l'école | libre | M | à faire |  |
| [EDT-05](modules/EDT-emploi-du-temps.md) | Paramètres datés complets | 5 | L | reporté |  |
| [ADM-01](modules/ADM-administration.md) | Habilitations à portée | 5 | M | à faire |  |
| [ADM-02](modules/ADM-administration.md) | Panneau de configuration de l'école | 3 | L | à faire |  |
| [ADM-03](modules/ADM-administration.md) | Import | 3 | L | à faire |  |
| [ADM-04](modules/ADM-administration.md) | Assistant de démarrage avec un modèle par type d'école (EP-1) | 3 | L | à faire |  |
| [ADM-05](modules/ADM-administration.md) | Rôle parent | 4 | M | à faire |  |
| [ADM-06](modules/ADM-administration.md) | Clôture d'une année (lecture seule) et préparation de la suivante | 5 | L + M | à faire |  |
| [ADM-07](modules/ADM-administration.md) | Enseignants partagés entre écoles | 5 | M | à faire |  |
| [ADM-08](modules/ADM-administration.md) | Annuaire de l'école | — | M | reporté |  |
| [ADM-09](modules/ADM-administration.md) | Échanges OneRoster | — | M | reporté |  |
| [VSC-01](modules/VSC-vie-scolaire.md) | Modèle de données du scolaire (conception seule, avec diagrammes) | 1 | L | plan du document à valider |  |
| [VSC-02](modules/VSC-vie-scolaire.md) | Élèves et familles | 4 | L | à faire |  |
| [VSC-03](modules/VSC-vie-scolaire.md) | Absences prévenues aux parents, justificatifs, saisie déléguée (EP-6) | 4 | M | à faire |  |
| [VSC-04](modules/VSC-vie-scolaire.md) | Notes et bulletins | 4 | XL | à faire |  |
| [VSC-05](modules/VSC-vie-scolaire.md) | Massar | 4 | M | à faire |  |
| [VSC-06](modules/VSC-vie-scolaire.md) | Formation professionnelle | 5 | M + S | à faire |  |
| [COU-01](modules/COU-espace-de-cours.md) | Sondage de l'enseignant à sa classe | libre | S | fait (#148) | #148 |
| [COU-02](modules/COU-espace-de-cours.md) | Devoirs avec rendu de fichier, après une revue de sécurité (taille, type, antivirus,… | 4 | L | à faire |  |
| [COU-03](modules/COU-espace-de-cours.md) | Commentaires sur un support ou un devoir | 4 | M | à faire |  |
| [COU-04](modules/COU-espace-de-cours.md) | Questions partagées de la classe | 4 | M | à faire |  |
| [COU-05](modules/COU-espace-de-cours.md) | « Vu » | 4 | M | à faire |  |
| [COU-06](modules/COU-espace-de-cours.md) | Export des notes d'un devoir | libre | S | à faire |  |
| [COU-07](modules/COU-espace-de-cours.md) | Offres de stage (espace Carrière) | libre | M | à décider |  |
| [COU-08](modules/COU-espace-de-cours.md) | Messagerie, si les règles de modération sont tranchées (Q-17) | 5 | L | conditionnel |  |
| [COU-09](modules/COU-espace-de-cours.md) | LTI | — | L | reporté |  |
| [BIB-01](modules/BIB-bibliotheque.md) | Identifiants stables (`uid`) des entités partagées, et envois par boîte d'envoi (D-14,… | 2 | M | à faire |  |
| [BIB-02](modules/BIB-bibliotheque.md) | StudyLib par école | 5 | M | à faire |  |
| [BIB-03](modules/BIB-bibliotheque.md) | Médias du Studio quiz (images, sons, vidéos) hors de la base, dans le stockage de fichiers | libre | M | à faire |  |
| [BIB-04](modules/BIB-bibliotheque.md) | Quiz généré par l'IA à partir d'un document de la Bibliothèque | libre | M | à faire |  |
| [QJE-01](modules/QJE-quiz-jeux-ia.md) | L'entrée « Quiz » du sélecteur d'espaces ouvre le Studio, plus ClassQuiz… | libre | S | à faire |  |
| [QJE-02](modules/QJE-quiz-jeux-ia.md) | Import des formats GIFT et Moodle XML dans le Studio | libre | M | à faire |  |
| [QJE-03](modules/QJE-quiz-jeux-ia.md) | Joueur natif dans l'application, sans passer par le site | libre | M | à faire |  |
| [QJE-04](modules/QJE-quiz-jeux-ia.md) | Fusion de `jeux-pedagogique` et ses quatre corrections | libre | M | à faire |  |
| [QJE-05](modules/QJE-quiz-jeux-ia.md) | Service des jeux à part, avec des gabarits | libre | L + M + M | à faire |  |
| [QJE-06](modules/QJE-quiz-jeux-ia.md) | Sortie complète de ClassQuiz | libre | M | à faire |  |
| [QJE-07](modules/QJE-quiz-jeux-ia.md) | Fournisseur d'IA en production | libre | M | à faire |  |
| [QJE-08](modules/QJE-quiz-jeux-ia.md) | Créateurs de jeux et leur rémunération | — | — | gelé |  |
| [QJE-09](modules/QJE-quiz-jeux-ia.md) | Défis Linux dans un quiz | — | M | reporté |  |
| [MOB-01](modules/MOB-application.md) | Essai sur un vrai téléphone (Android d'entrée de gamme), noté dans la recette | libre | S | à faire |  |
| [MOB-02](modules/MOB-application.md) | Rôle enseignant | libre | L | à faire |  |
| [MOB-03](modules/MOB-application.md) | Thème neutre et thème de l'école | 2 | M | à faire |  |
| [MOB-04](modules/MOB-application.md) | Trouver son école | 5 | M | reporté |  |
| [MOB-05](modules/MOB-application.md) | Espace parents | 4 | L | à faire |  |
| [MOB-06](modules/MOB-application.md) | Emploi du temps lisible hors ligne (EP-3) | 4 | M | à faire |  |
| [MOB-07](modules/MOB-application.md) | Adresse de l'API qui n'est plus figée à la construction (une application pour toutes… | libre | M | à faire |  |
| [UIX-01](modules/UIX-interface.md) | Socle neutre | 2 | L | conçu, à coder |  |
| [UIX-02](modules/UIX-interface.md) | Vocabulaire des écrans selon le profil de l'école (classe et non groupe, matière et… | 3 | M | à faire |  |
| [UIX-03](modules/UIX-interface.md) | Accessibilité AA | libre | M | en partie |  |
| [UIX-04](modules/UIX-interface.md) | Arabe complet | 4 | XL | à faire |  |
| [UIX-05](modules/UIX-interface.md) | Ton des messages du serveur | libre | M | à faire |  |
| [UIX-06](modules/UIX-interface.md) | Style unifié entre les pages anciennes et récentes | libre | M | à faire |  |
| [VIT-01](modules/VIT-site-vitrine.md) | Conception | libre | M | à faire |  |
| [VIT-02](modules/VIT-site-vitrine.md) | Une page et un formulaire de contact | libre | M | à faire |  |
| [VIT-03](modules/VIT-site-vitrine.md) | Centre d'aide | libre | M | à faire |  |
| [VIT-04](modules/VIT-site-vitrine.md) | Page d'état du service et journal des nouveautés de chaque version | libre | S | à faire |  |
| [VIT-05](modules/VIT-site-vitrine.md) | Vitrine complète | quand la vente reprend | L | gelé |  |
| [VEN-01](modules/VEN-vente-modules.md) | Registre des modules | 2 | L | à faire |  |
| [VEN-02](modules/VEN-vente-modules.md) | Cinq entretiens de terrain avec des directeurs d'écoles privées, séparés de toute… | 3 | S par entretien | à faire |  |
| [VEN-03](modules/VEN-vente-modules.md) | Abonnements et factures | — | L | gelé |  |
| [VEN-04](modules/VEN-vente-modules.md) | Essai gratuit avec filigrane, effacé après 60 jours | — | M | gelé |  |
| [VEN-05](modules/VEN-vente-modules.md) | Contrats (sous-traitance, conditions générales) | — | M | gelé |  |
| [VEN-06](modules/VEN-vente-modules.md) | Installation d'une école pilote | — | L | gelé |  |
| [VEN-07](modules/VEN-vente-modules.md) | Démonstration aux directeurs | — | M | gelé |  |
| [VEN-08](modules/VEN-vente-modules.md) | Offre d'IA payante (les plafonds techniques restent, dans QJE-07) | — | M | gelé |  |
| [VEN-09](modules/VEN-vente-modules.md) | Vidéos par lien dans le Studio quiz | — | M | gelé |  |
| [FIN-01](modules/FIN-finance-ecole.md) | Frais, échéanciers, caisse, reçus bilingues numérotés sans trou | 4 | XL | à faire |  |
| [FIN-02](modules/FIN-finance-ecole.md) | Relances, impayés, export comptable (EP-5) | 4 | L | à faire |  |
| [FIN-03](modules/FIN-finance-ecole.md) | Relevé mensuel des heures des vacataires, à partir des séances visées | libre | M | à faire |  |
| [MKT-01](modules/MKT-marketing.md) | Sauvegarder l'agence (premier commit, dépôt privé, règles de l'équipe) | libre | S | à faire |  |
| [MKT-02](modules/MKT-marketing.md) | Contexte produit et personas à la cible du 7 novembre | libre | M | à faire |  |
| [MKT-03](modules/MKT-marketing.md) | Argumentaire par cible, tiré des exigences produit | libre | M | à faire |  |
| [MKT-04](modules/MKT-marketing.md) | Textes du site vitrine et du formulaire de contact | libre | M | à faire |  |
| [MKT-05](modules/MKT-marketing.md) | Vidéo de démonstration sur une école fictive | libre | M | à faire |  |
| [MKT-06](modules/MKT-marketing.md) | Charte visuelle et gabarits de visuels | libre | M | à faire |  |
| [MKT-07](modules/MKT-marketing.md) | Plan de mesure à coût nul | libre | S | à faire |  |
| [MKT-08](modules/MKT-marketing.md) | Calendrier éditorial et publications | quand la vente reprend | M | gelé |  |
| [MKT-09](modules/MKT-marketing.md) | Supports commerciaux pour les directeurs | quand la vente reprend | M | gelé |  |
| [MKT-10](modules/MKT-marketing.md) | Campagne de lancement auprès des écoles | quand la vente reprend | L | gelé |  |
| [QUA-01](modules/QUA-qualite-docs.md) | `README.md` et `PRODUCT.md` à jour | libre | M | à faire |  |
| [QUA-02](modules/QUA-qualite-docs.md) | Découper les contrôleurs trop longs, sans changer leur comportement, chacun couvert… | libre | M par contrôleur | à faire |  |
| [QUA-03](modules/QUA-qualite-docs.md) | Clore l'étude de la pile | 1 | S | à faire |  |
| [QUA-04](modules/QUA-qualite-docs.md) | Reste des dates | libre | S | à faire |  |
| [QUA-05](modules/QUA-qualite-docs.md) | Supprimer les branches et les dossiers de travail morts, après vérification de leur… | libre | S | à faire |  |
| [QUA-06](modules/QUA-qualite-docs.md) | `docs/users.xlsx` | 0 | S | fait (personnes fictives, rien à réécrire) |  |
| [QUA-07](modules/QUA-qualite-docs.md) | Protéger `main` | 0 | S | fait : les 6 contrôles de la CI sont exigés (contournable seulement par `gh pr merge --admin`) |  |
