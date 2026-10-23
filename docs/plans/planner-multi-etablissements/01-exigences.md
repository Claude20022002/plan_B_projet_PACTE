# 1. Exigences

Chaque exigence a un numéro, repris dans la matrice de traçabilité (`10-verification.md`). « Fait quand » est le critère qui permet de dire, par un test ou une mesure, qu'elle est satisfaite. Une exigence sans critère vérifiable n'est pas une exigence : elle a été réécrite ou retirée.

## 1.1 Demande du chef de projet (23 octobre 2026), reformulée

| N° | Exigence | Fait quand |
|---|---|---|
| EX-01 | **Un produit neutre** : « Planner » ; chaque école y voit son nom, son logo et ses couleurs (« EMSI Planner ») | Aucun texte « HESTIM » dans le code hors migrations et tests (contrôle automatique en CI) ; un second établissement affiche son nom sur la page de connexion, les courriels, les PDF et l'agenda |
| EX-02 | **S'adapter à tout contexte** : nombre de campus (dans une ou plusieurs villes), d'enseignants, de salles, de ressources, jours fériés du pays, grilles horaires, semestres ou trimestres, week-end, langue, fuseau | Un établissement de démonstration non marocain (France, trimestres, week-end samedi-dimanche, grille d'une heure) se configure sans changer de code |
| EX-03 | **Mise en place simple et rapide** | Un établissement type (2 campus, 60 salles, 150 enseignants, 3 000 étudiants, 40 filières-niveaux) passe de « créé » à « prêt à générer » en **moins d'une journée de travail d'un administrateur**, dont **moins de 30 minutes** pour la configuration sans données. Mesuré sur deux essais avec des personnes qui ne connaissent pas Planner |
| EX-04 | **Import Excel** des données de l'école | Un classeur modèle unique couvre toutes les données ; un fichier de l'école avec ses propres en-têtes s'importe après correspondance des colonnes, mémorisée pour la fois suivante |
| EX-05 | **Zéro conflit interne** à l'import | Aucune donnée incohérente n'entre en base : un import est tout ou rien, et chaque refus dit la feuille, la ligne, la colonne et quoi corriger |
| EX-06 | **Zéro conflit entre écoles** | (a) Aucune donnée d'une école n'est lisible ni modifiable par une autre, même par un appel forgé ; (b) un enseignant présent dans deux écoles n'est jamais placé à la même heure dans les deux (ni sans le temps de trajet entre elles) |
| EX-07 | **Modifier un réglage en quelques clics**, sans casser l'existant | Un réglage se change en 3 clics au plus depuis sa page ; s'il touche des séances, l'aperçu dit combien et lesquelles avant d'appliquer ; tout changement appliqué s'annule en un clic |
| EX-08 | **Cohésion des bases de données** | Tous les établissements ont le même schéma, à la même version (contrôlé au démarrage) ; aucun service ne référence une donnée d'un autre par un code modifiable |
| EX-09 | **Créateurs tiers de jeux pédagogiques**, avec une bibliothèque de jeux | Une personne extérieure crée un jeu sans écrire de code, le soumet, il est relu, publié, puis proposé par un enseignant d'une autre école dans un module |
| EX-10 | **Rémunération selon l'usage**, comme les places de marché de contenus (Kahoot) | Chaque mois, chaque créateur reçoit un relevé : jeux, usages qualifiés, montant ; la somme versée ne dépasse jamais le fonds du mois |
| EX-11 | **Bibliothèque de jeux en microservice**, dans un dépôt séparé | Le service des jeux se déploie seul, a sa propre base, et Planner continue de fonctionner (sans jeux tiers) s'il est arrêté |

## 1.2 Exigences de qualité déduites

| N° | Exigence | Fait quand |
|---|---|---|
| EX-Q1 | **Sécurité de l'isolation** | Suite de tests d'isolation en CI : deux établissements aux données identiques, chaque route appelée avec le jeton de l'un sur l'adresse de l'autre rend 401 ou 404, jamais 200 |
| EX-Q2 | **Continuité de HESTIM** | Aucune coupure de plus de 15 minutes pendant toute la transformation ; aucune donnée déplacée de sa base actuelle ; chaque lot a son retour arrière écrit |
| EX-Q3 | **Montée en charge** | 50 établissements sur un serveur d'application, une université de 20 000 étudiants générée en moins de 30 minutes par découpage, sans ralentir les autres établissements |
| EX-Q4 | **Réversibilité** | Une école obtient l'export complet de ses données (base, fichiers, jeux privés) en un geste, et sa suppression effacée partout sous 30 jours |
| EX-Q5 | **Conformité** | Planner est sous-traitant de chaque école au sens de la loi 09-08 ; un contrat de sous-traitance type existe ; les créateurs ne voient jamais l'identité d'un élève |
| EX-Q6 | **Sauvegardes** | Une sauvegarde par établissement, chaque nuit, **hors du serveur** ; restauration d'un seul établissement testée chaque mois |
| EX-Q7 | **Exploitation** | Une mise à jour s'applique à tous les établissements par vagues, sans commande par école ; un établissement en échec de migration est mis en maintenance seul |
| EX-Q8 | **Lisibilité du code** | Règles de `assainissement.md` § 6 ; aucune nouvelle dépendance sans justification écrite dans la PR |

## 1.3 Contraintes héritées (décisions antérieures, non rediscutées)

| N° | Contrainte | Source |
|---|---|---|
| C-1 | L'école paie ; rien n'est jamais facturé à un élève ni à un enseignant | décisions du 11 octobre |
| C-2 | Prix : 4,99 MAD par compte actif et par mois, tous rôles ; IA incluse avec un plafond | décisions du 11 octobre |
| C-3 | Noms à l'écran : Planner, Bibliothèque, Quiz, Activités | lot R-7 du 11 octobre |
| C-4 | La Bibliothèque des documents est StudyLib (dépôt séparé), les fichiers n'y sont qu'à un endroit | décisions du 15 octobre |
| C-5 | Sortie de ClassQuiz : aucun code du fork repris ; retrait seulement après l'essai du direct en classe | décisions du 20 octobre |
| C-6 | Mode créateur de jeux façon Kahoot et bibliothèque des jeux plus belle | décisions du 20 octobre, point 4 |
| C-7 | Claude ne touche pas à la production ; le chef de projet commite, fusionne et applique | mémoire du projet |

## 1.4 Hypothèses (à confirmer, listées aussi au fichier 10)

- H-1 : les clients visés sont d'abord des établissements du supérieur au Maroc, puis d'Afrique francophone ; un lycée (élèves mineurs) n'est pas visé dans un premier temps.
- H-2 : une école de plusieurs villes (EMSI) est **un** établissement avec plusieurs campus, pas plusieurs établissements.
- H-3 : le nom de domaine du produit reste à choisir ; ce plan écrit `<domaine>`.
- H-4 : l'équipe reste petite (deux groupes et l'équipe jeux) : l'architecture doit rester exploitable par elle, sur un ou deux serveurs.

## 1.5 Hors périmètre de ce plan

- Les applications mobiles en marque blanche (une application par école dans les magasins) : une seule application « Planner », qui affiche l'école après la connexion.
- La paie des enseignants (toujours en attente de la scolarité de HESTIM).
- Le portage du produit hors du supérieur (écoles primaires, centres de formation) : le modèle le permet, mais aucun lot n'y est consacré.
- Les jeux contenant du code tiers : prévus, mais seulement après les conditions de D-12.
