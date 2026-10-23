# 2. Décisions d'architecture

Format inspiré des « Architecture Decision Records » : contexte, options réellement envisagées, décision, raisons, conséquences, et **ce qui ferait changer la décision**. Une décision ne se modifie pas : une nouvelle la remplace et le dit.

## D-01 Isolation : une base de données par établissement

- **Contexte** : le schéma n'a aucune colonne d'établissement (72 modèles, 127 fichiers qui les importent). Une colonne `id_institution` a existé, jamais appliquée dans les requêtes, et a été retirée le 2 octobre (migration 0002).
- **Options** : (a) une pile complète par école (« silo ») ; (b) une application partagée, **une base par école** (« pont ») ; (c) une base unique avec une colonne `id_etablissement` partout (« mutualisé »).
- **Décision** : (b). Chaque base a son propre utilisateur MySQL, qui n'a de droits que sur elle.
- **Pourquoi** : MySQL n'a pas de sécurité par ligne ; en (c), chacune des centaines de requêtes est un point de fuite, et 18 contraintes d'unicité (codes, courriels, numéros d'étudiant, codes d'accès) deviendraient composées. En (b), le code actuel reste presque intact, l'isolation tient même en cas d'oubli (le pool d'une école ne peut pas lire une autre base), et la sauvegarde, la restauration, l'export et la suppression se font par école. (a) multiplierait par N les mises à jour, que le chef de projet applique déjà à la main.
- **Conséquences** : les migrations tournent N fois (par vagues, D-16) ; un pool de connexions par école, petit et fermé quand il dort ; les chiffres consolidés passent par la Plateforme.
- **Changerait si** : plus de 500 établissements, ou beaucoup de très petites écoles. Le registre garde l'adresse du serveur de chaque base : on peut répartir les bases sur plusieurs serveurs, et offrir à un grand client (a) avec la même image.

## D-02 L'établissement se déduit de l'adresse et du jeton, jamais du corps de la requête

- **Options** : en-tête `X-Etablissement` ; paramètre d'URL `/e/emsi/...` ; sous-domaine ; revendication `tid` du jeton.
- **Décision** : site web par **sous-domaine** (`emsi.<domaine>`, domaine propre en option avec certificat automatique de Caddy) ; API et application par la revendication **`tid`** du jeton signé. Si l'adresse et le jeton désignent deux établissements différents : 401.
- **Pourquoi** : un en-tête ou un paramètre se forge ; le jeton est signé ; le sous-domaine isole aussi les cookies entre écoles et permet une page de connexion à la marque de l'école.
- **Changerait si** : une école refuse les sous-domaines ; le domaine propre couvre déjà ce cas.

## D-03 Un contexte d'établissement obligatoire pour toute lecture ou écriture

- **Décision** : un `AsyncLocalStorage` porte `{ etablissement, sequelize, modeles }` pour chaque requête, tâche ou message. Les modèles exportés par `models/index.js` deviennent des **résolveurs** qui renvoient le modèle de l'établissement courant ; hors contexte, tout accès lève une erreur (« échec fermé »).
- **Pourquoi** : les 127 fichiers qui importent les modèles ne changent pas. Sequelize associe les inclusions par **nom** de modèle (`associations/mixin.js`, ligne 53, version 6.37.8), ce qui rend un résolveur possible.
- **Condition** : une **preuve de concept** (lot ME-3a) doit faire passer toute la suite d'intégration (458 tests) et les parcours avec deux établissements. Échec : on bascule sur l'injection explicite (`req.modeles`), par une transformation de code automatique, plus longue mais sans magie.
- **Garde-fous** : règle de lint qui interdit d'importer `config/db.js` hors du module de contexte ; test qui appelle une route sans contexte et attend l'erreur.

## D-04 Un service « Plateforme » à part, avec sa base

- **Décision** : nouveau service `plateforme/` (même dépôt que Planner, processus et base `planner_plateforme` séparés) : établissements, domaines, bases, comptes, appartenances, abonnements, comptage des comptes actifs, factures, fonctionnalités par établissement, journal des actions de l'équipe Planner.
- **Pourquoi** : ces données sont communes à tous, donc hors de toute base d'école. Même dépôt que Planner, car la création d'un établissement exécute les migrations de Planner : les deux doivent avancer ensemble.
- **Fonctionnalités par établissement** : les interrupteurs de `shared/fonctions.js` (devoirs, surveillances) deviennent des réglages par établissement ; ClassQuiz est éteint pour tout nouvel établissement.

## D-05 Identité : un compte pour la plateforme, des appartenances par établissement

- **Options** : (a) chaque école garde ses comptes et ses mots de passe ; (b) comptes communs dans la Plateforme, rôles dans chaque école.
- **Décision** : (b), en deux temps. D'abord, chaque utilisateur d'une école reçoit un `uid` de compte et le jeton porte `tid`. Ensuite, la connexion passe à la Plateforme, qui signe les jetons (le RS256 et le JWKS actuels déménagent tels quels) ; elle accepte l'authentification unique de l'école (Microsoft Entra, Google Workspace) par OIDC.
- **Pourquoi** : une seule application mobile doit trouver l'école de la personne ; un vacataire de deux écoles doit avoir un seul compte pour que ses heures soient partagées (D-10) ; les grandes écoles exigent leur authentification unique. StudyLib vérifie déjà les jetons par JWKS : rien ne change pour elle.
- **Garde-fou** : une école qui ajoute une adresse déjà connue crée une **invitation**, acceptée par la personne ; elle ne voit rien de ses autres établissements.

## D-06 Le code garde le sens, l'école nomme

- **Contexte** : des listes fermées dans `config/referentiel.js` sont propres à HESTIM : types de salles (« Labo génie civil »), régimes, écoles (« engineering, business »), cycles, périodes S1 et S2, Ramadan.
- **Décision** : deux niveaux. **Le sens** reste dans le code, en petit nombre : nature de séance (cours magistral, dirigé, pratique, projet, examen), effet d'un événement (bloquant ou non), niveaux d'emboîtement des groupes. **Les libellés et les listes** deviennent des données de l'école : types de salles, équipements, rythmes (ex-régimes), pôles (ex-écoles), cycles, périodes, variantes de grille (ex-Ramadan).
- **Pourquoi** : le solveur n'a besoin que d'égalités (type demandé = type de la salle) et de quelques rôles ; tout le reste varie d'une école à l'autre.

## D-07 Les réglages sont datés et passent par « aperçu puis appliquer »

- **Décision** : trois classes de réglages. **Présentation** (nom, logo, couleurs) : immédiat. **Prospectif** (poids d'une règle souple) : vaut pour les prochaines générations, sans toucher l'existant. **Structurel** (grille horaire, calendrier, règle dure, salle retirée) : nouvelle version datée, aperçu de l'impact (séances déplacées, conflits créés), application atomique, annulation par une version inverse.
- **Modèles suivis** : le « plan puis apply » de Terraform, les dates d'effet de Workday.
- **Pourquoi pas tout dater** : dater le logo n'apporte rien et alourdit chaque écran.

## D-08 Import : une zone de préparation, un classeur unique, des clés naturelles

- **Décision** : import côté serveur en sept étapes (lecture, correspondance des colonnes, contrôles de format, de cohérence interne, de cohérence avec la base, aperçu, application atomique), annulable tant que rien n'en dépend. Les lignes se rapprochent par **clé naturelle** (code de salle, adresse électronique), jamais par identifiant. Formats : le classeur Planner (une feuille par nature, dans l'ordre des dépendances), tout CSV ou Excel après correspondance, et **OneRoster 1.2 CSV** (norme IMS de l'échange de données scolaires).
- **Pourquoi côté serveur** : un seul endroit pour les contrôles, un journal, et pas de logique en double entre site et serveur. Aujourd'hui l'import est lu dans le navigateur puis envoyé entité par entité, sans transaction d'ensemble.

## D-09 Solveur : règles dures fixes, règles souples réglables, gros établissements découpés

- **Décision** : les règles dures (conflits salle, enseignant, groupe ; capacité ; indisponibilités) ne se règlent pas. Les règles souples (vœux, journées sans trous, même salle, CM avant TD…) s'activent et se pondèrent par établissement. Les règles propres à HESTIM deviennent des données : « samedi après-midi » (souple dans le solveur) et « pause du vendredi » (contrôlée seulement à la saisie manuelle) deviennent des **plages restreintes** par rythme, chacune « interdite » (dure) ou « à éviter » (souple). Une grande université se génère par **lots** (pôle ou département) qui partagent les ressources.
- **Technique** : poids passés dans les paramètres du problème (`ConstraintWeightOverrides` si la version de Timefold le permet, sinon multiplicateur explicite).

## D-10 Enseignants partagés entre établissements : des heures « occupé » fédérées

- **Décision** : quand un même compte enseigne dans deux établissements et l'accepte, chacun reçoit de l'autre des **plages occupées, sans aucun détail** (ni cours, ni groupe, ni salle), plus un temps de trajet entre établissements. Elles comptent comme indisponibilités dures. Seules les séances **publiées** sont partagées ; à la publication, un contrôle signale ce qui chevauche une plage reçue depuis la génération.
- **Pourquoi** : c'est le seul conflit entre écoles qui existe dans la réalité marocaine (vacataires de plusieurs écoles). Le partage de disponibilités libre/occupé est le modèle des agendas (CalDAV free-busy).

## D-11 Marque et documents par établissement

- **Décision** : nom, nom court, logo, couleur d'accent (refusée si le contraste n'atteint pas AA), adresse d'expédition des courriels, fuseau, langues, modèle de l'EDT du mois. Le format de l'EDT de HESTIM devient **un modèle** parmi d'autres ; un modèle « Planner » sert par défaut.

## D-12 Les jeux dans un service à part, des gabarits d'abord

- **Décision** : dépôt et service `planner-jeux`, base `planner_jeux`. Niveau 1 : les créateurs **remplissent des gabarits** programmés par Planner (quiz, remise en ordre, appariement, tri, texte à trous, simulations d'Alexis) ; le serveur des jeux évalue. Niveau 2, plus tard : des jeux programmés (HTML5) par des studios vérifiés, isolés sur un autre domaine, dont les scores ne servent qu'à l'entraînement.
- **Pourquoi** : Kahoot fait créer du contenu, pas du code. Un code tiers exécuté chez les élèves est le premier risque de sécurité et le plus coûteux à relire.
- **Conditions pour ouvrir le niveau 2** : 50 jeux de niveau 1 publiés, une procédure de revue tenue trois mois, une politique de sécurité du contenu testée.

## D-13 Rémunération : un fonds par école, réparti selon l'usage qualifié dans cette école

- **Options** : vente à l'unité (Teachers Pay Teachers) ; somme fixe par usage ; fonds global réparti au prorata (Spotify) ; **fonds de chaque école réparti selon l'usage dans cette école** (« centré utilisateur », Deezer, SoundCloud).
- **Décision** : la dernière. Détail, calcul et fraude : fichier 08.
- **Pourquoi** : la vente à l'unité ferait payer l'école en plus (contraire à C-2) ; une somme fixe par usage fait porter le risque à Planner ; le fonds global laisse une école très active capter l'argent payé par les autres. Le fonds par école est juste et coûte cher à tromper : chaque faux élève coûte 4,99 MAD à son école.

## D-14 Échanges entre services : HTTP signé et boîte d'envoi, sans courtier au départ

- **Décision** : questions synchrones en HTTP avec jeton de service (RS256, audience par service). Événements par une **boîte d'envoi transactionnelle** (table `BoiteEnvoi` écrite dans la même transaction que le changement), livrés en HTTP avec reprises, reçus par des consommateurs idempotents (identifiant d'événement unique).
- **Changerait si** : plus de quelques dizaines d'événements par seconde ; on passerait alors à Redis Streams (déjà déployé pour StudyLib) sans changer les messages.

## D-15 Une donnée a un seul propriétaire ; on se réfère à elle par un identifiant stable

- **Décision** : chaque donnée partagée a un propriétaire unique (tableau du fichier 03) ; les autres services en gardent une **copie de lecture**, mise à jour par événement. Filières, modules, groupes, campus, salles et personnes reçoivent un `uid` (UUID v7) qui ne change jamais. Un service ne se réfère jamais à la donnée d'un autre par un code.
- **Pourquoi** : StudyLib rapproche aujourd'hui filières et modules par **code** (`planner:sync`) ; or l'école doit pouvoir renommer un code en quelques clics (EX-07), et deux écoles ont souvent les mêmes codes (« IIIA »).

## D-16 Exploitation : vagues, migrations compatibles, sauvegardes hors serveur d'abord

- **Décision** : une version de Planner est déployée, puis les migrations sont appliquées par vagues (établissement d'essai, HESTIM, les autres). Toute migration suit « étendre puis contracter » : une version de l'application fonctionne avec le schéma d'avant et d'après. Un établissement dont la migration échoue passe seul en maintenance. **Préalable bloquant** : les sauvegardes hors du serveur (A-3, en attente depuis le 18 octobre), par établissement.

## D-17 Planner reste un monolithe modulaire ; seuls quatre services sont séparés

- **Options** : découper Planner en microservices (calendrier, appel, génération…) ; ou garder un seul service découpé en modules aux frontières nettes.
- **Décision** : Planner reste **un** service, rangé par contextes métier (fichier 03, § 2). Services séparés : Plateforme, solveur (déjà), Bibliothèque des documents (StudyLib, déjà), jeux (nouveau).
- **Pourquoi** : la planification, l'appel et les reports partagent les mêmes séances dans des transactions ; les séparer créerait des transactions réparties sans bénéfice pour deux petites équipes. On sépare ce qui a un cycle de vie, des données ou des utilisateurs différents : c'est le cas des quatre services retenus.
