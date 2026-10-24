# 2. Décisions d'architecture

Format inspiré des « Architecture Decision Records » : contexte, options réellement envisagées, décision, raisons, conséquences, et **ce qui ferait changer la décision**. Une décision ne se modifie pas : une nouvelle la remplace et le dit.

## D-01 Isolation : une base de données par établissement

- **Contexte** : le schéma n'a aucune colonne d'établissement (72 modèles, 127 fichiers qui les importent). Le modèle (c) ci-dessous **a déjà existé** : colonne `id_institution`, tables `Institutions`, `InstitutionUsers`, `Plans`, `Subscriptions`, filtre `req.tenant.id_institution` dans une trentaine de fichiers (commit `b16b17c`, 12 mai 2026). Il a été retiré le 2 octobre (migration 0002) sur une décision de produit (« une seule école, HESTIM »), pas sur un échec technique.
- **Options** : (a) une pile complète par école (« silo ») ; (b) une application partagée, **une base par école** (« pont ») ; (c) une base unique avec une colonne `id_etablissement` partout (« mutualisé »), c'est-à-dire le retour de l'ancien modèle.
- **Décision** : (b). Chaque base a son propre utilisateur MySQL, qui n'a de droits que sur elle.
- **Pourquoi** : MySQL n'a pas de sécurité par ligne ; en (c), chacune des centaines de requêtes est un point de fuite, le code écrit depuis mai (espace de cours, Studio quiz, direct, publication, reports) n'a jamais filtré par établissement et serait à reprendre en entier, et une dizaine de contraintes d'unicité métier (codes de salle, de filière, de module, courriel, numéro d'étudiant, libellé d'année, codes d'accès) deviendraient composées. En (b), le code actuel reste presque intact, l'isolation tient même en cas d'oubli (le pool d'une école ne peut pas lire une autre base), et la sauvegarde, la restauration, l'export et la suppression se font par école. (a) multiplierait par N les mises à jour, que le chef de projet applique déjà à la main.
- **Conséquences** : les migrations tournent N fois (par vagues, D-16) ; un pool de connexions par école, petit et fermé quand il dort ; les chiffres consolidés passent par la Plateforme.
- **Changerait si** : plus de 500 établissements, ou beaucoup de très petites écoles. Le registre garde l'adresse du serveur de chaque base : on peut répartir les bases sur plusieurs serveurs, et offrir à un grand client (a) avec la même image.

## D-02 L'établissement se déduit de l'adresse et du jeton, jamais du corps de la requête

- **Options** : en-tête `X-Etablissement` ; paramètre d'URL `/e/emsi/...` ; sous-domaine ; revendication `tid` du jeton.
- **Décision** : deux sortes d'adresses. **Adresse d'école** (site web, `emsi.<domaine>`, domaine propre en option avec certificat automatique de Caddy) : l'établissement est celui de l'hôte, et le jeton doit porter le même `tid`, sinon 401. **Adresse neutre** (`api.<domaine>`, utilisée par l'application mobile) : l'établissement est le `tid` du jeton, seul. Une requête sans jeton (page de connexion, lien public d'agenda, QR) n'est acceptée que sur une adresse d'école, ou sur la Plateforme.
- **Pourquoi** : un en-tête ou un paramètre se forge ; le jeton est signé ; le sous-domaine isole aussi les cookies entre écoles et permet une page de connexion à la marque de l'école. Les cookies actuels n'ont pas d'attribut `Domain` (`config/authCookies.js`) : ils restent liés à l'hôte, donc à l'école. **Règle à garder** : ne jamais leur donner `Domain=.<domaine>`, qui les ferait envoyer à toutes les écoles.
- **Changerait si** : une école refuse les sous-domaines ; le domaine propre couvre déjà ce cas.

## D-03 Un contexte d'établissement obligatoire pour toute lecture ou écriture

- **Décision** : un `AsyncLocalStorage` porte `{ etablissement, sequelize, modeles }` pour chaque requête, tâche ou message. Les modèles exportés par `models/index.js` deviennent des **résolveurs** qui renvoient le modèle de l'établissement courant ; hors contexte, tout accès lève une erreur (« échec fermé »).
- **Pourquoi** : les 127 fichiers qui importent les modèles ne changent pas. Sequelize associe les inclusions par **nom** de modèle (`associations/mixin.js`, ligne 53, version 6.37.8), ce qui rend un résolveur possible. **Ce qui change quand même** : les 26 fichiers hors `models/` qui importent `config/db.js` (transactions, verrous), et les modèles qui modifient leur prototype au chargement (`Users.prototype.toJSON`), à déplacer dans la fabrique des modèles.
- **Condition** : une **preuve de concept** (lot ME-3a) doit faire passer toute la suite d'intégration (458 tests) et les parcours avec deux établissements. Échec : on bascule sur l'injection explicite (`req.modeles`), par une transformation de code automatique, plus longue mais sans magie.
- **L'état gardé en mémoire du processus** est l'autre voie de mélange entre écoles, que la base par école ne protège pas. Relevé le 23 octobre : les générations en cours rangées par numéro de session (`timefold/generation.js`, `enCours`), le limiteur de requêtes en mémoire rangé par `user:<id>`, la file d'envoi des notifications (`push.js`, vidée par une minuterie, donc hors de toute requête). Règle : **toute clé en mémoire commence par l'`uid` de l'établissement**, et tout travail différé capture le contexte au moment où il est mis en file.
- **Garde-fous** : règle de lint qui interdit d'importer `config/db.js` hors du module de contexte ; test qui appelle une route sans contexte et attend l'erreur ; test où deux écoles ont une session de génération de même numéro.

## D-04 Un service « Plateforme » à part, avec sa base

- **Décision** : nouveau service `plateforme/` (même dépôt que Planner, processus et base `planner_plateforme` séparés) : établissements, domaines, bases, comptes, appartenances, abonnements, comptage des comptes actifs, factures, fonctionnalités par établissement, journal des actions de l'équipe Planner.
- **Pourquoi** : ces données sont communes à tous, donc hors de toute base d'école. Même dépôt que Planner, car la création d'un établissement exécute les migrations de Planner : les deux doivent avancer ensemble.
- **Fonctionnalités par établissement** : les interrupteurs de `shared/fonctions.js` (devoirs, surveillances) deviennent des réglages par établissement ; ClassQuiz est éteint pour tout nouvel établissement.
- **Accès de l'équipe Planner aux données d'une école** (assistance) : jamais par défaut. L'administration de l'école l'ouvre pour une durée limitée (24 h par défaut), chaque action est journalisée et visible de l'école. Planner est sous-traitant (EX-Q5) : il n'a pas à lire ce qu'on ne lui a pas confié.

## D-05 Identité : un compte pour la plateforme, des appartenances par établissement

- **Options** : (a) chaque école garde ses comptes et ses mots de passe ; (b) comptes communs dans la Plateforme, rôles dans chaque école.
- **Décision** : (b), en deux temps. D'abord, chaque utilisateur d'une école reçoit un `uid` de compte et le jeton porte `tid`. Ensuite, la connexion passe à la Plateforme, qui signe les jetons (le RS256 et le JWKS actuels déménagent tels quels) ; elle accepte l'authentification unique de l'école (Microsoft Entra, Google Workspace) par OIDC.
- **Pourquoi** : une seule application mobile doit trouver l'école de la personne ; un vacataire de deux écoles doit avoir un seul compte pour que ses heures soient partagées (D-10) ; les grandes écoles exigent leur authentification unique. StudyLib vérifie déjà les jetons par JWKS : rien ne change pour elle.
- **Garde-fou** : une école qui ajoute une adresse crée toujours une **invitation**, que l'adresse soit connue ou non de la plateforme ; l'école ne peut pas savoir si la personne a déjà un compte, ni où.
- **Points de passage vérifiés** : les empreintes bcrypt des mots de passe se recopient telles quelles ; les secrets de double authentification, chiffrés avec une clé propre au serveur Planner (`services/mfa.js`), doivent être déchiffrés puis rechiffrés avec la clé de la Plateforme pendant la migration ; la Plateforme devient l'émetteur des jetons, donc l'adresse JWKS et l'émetteur (`iss`) changent dans la configuration de StudyLib ; comme les cookies sont liés à l'hôte de chaque école, la connexion par la Plateforme passe par un **code d'autorisation** (le flux OIDC habituel), jamais par un cookie partagé. Si deux écoles ont déjà des comptes de même adresse avec deux mots de passe différents au moment de la migration, la personne choisit le sien à la première connexion ; d'où la règle du fichier 09 : **aucune école cliente avant ME-8**.
- **Authentification unique de l'école (ajout de la contre-expertise, § 12.5)** : une connexion par l'annuaire de l'école A n'ouvre **que** l'école A, même si le compte a d'autres appartenances. L'annuaire de A n'est accepté que pour les domaines d'adresse que A a prouvé posséder (enregistrement DNS). Sinon, l'administrateur de l'annuaire de A pourrait créer une adresse d'un enseignant de B et entrer chez B.

## D-06 Le code garde le sens, l'école nomme

- **Contexte** : des listes fermées dans `config/referentiel.js` sont propres à HESTIM : types de salles (« Labo génie civil »), régimes, écoles (« engineering, business »), cycles, périodes S1 et S2, Ramadan.
- **Décision** : deux niveaux. **Le sens** reste dans le code, en petit nombre : nature de composante (CM, TD, TP, projet, comme `TYPES_COMPOSANTE` aujourd'hui ; les examens restent un modèle à part), effet d'un événement (bloquant ou non), trois niveaux d'emboîtement des groupes (promotion, TD, TP). **Les libellés** de ces natures se personnalisent (« Cours », « Atelier »). **Les listes** deviennent des données de l'école : types de salles, équipements, rythmes (ex-régimes), pôles (ex-écoles), cycles, périodes, variantes de grille (ex-Ramadan).
- **Pourquoi** : le solveur n'a besoin que d'égalités (type demandé = type de la salle) et de quelques rôles ; tout le reste varie d'une école à l'autre.
- **Limite assumée** : trois niveaux de groupes au plus. Une école qui aurait besoin d'un quatrième (groupes de langue dans des TD, par exemple) le signalera ; on ne généralise pas sans cas réel.

## D-07 Les réglages sont datés et passent par « aperçu puis appliquer »

- **Décision** : trois classes de réglages. **Présentation** (nom, logo, couleurs) : immédiat. **Prospectif** (poids d'une règle souple) : vaut pour les prochaines générations, sans toucher l'existant. **Structurel** (grille horaire, calendrier, règle dure, salle retirée) : nouvelle version datée, aperçu de l'impact (séances déplacées, conflits créés), application atomique, annulation par une version inverse.
- **Recalage des séances** : quand une grille change, une séance garde son jour et son **rang** dans la journée (le principe qui fait déjà fonctionner la variante Ramadan, `Creneau.rang`) ; une séance dont le rang disparaît passe « à reprogrammer » (statut existant depuis R-1). Le solveur n'est pas relancé.
- **Modèles suivis** : le « plan puis apply » de Terraform, les dates d'effet de Workday.
- **Pourquoi pas tout dater** : dater le logo n'apporte rien et alourdit chaque écran.

## D-08 Import : une zone de préparation, un classeur unique, des clés naturelles

- **Décision** : import côté serveur en sept étapes (lecture, correspondance des colonnes, contrôles de format, de cohérence interne, de cohérence avec la base, aperçu, application atomique), annulable tant que rien n'en dépend. Les lignes se rapprochent par **clé naturelle** (code de salle, adresse électronique), jamais par identifiant. Formats : le classeur Planner (une feuille par nature, dans l'ordre des dépendances), tout CSV ou Excel après correspondance, et **OneRoster 1.2 CSV** (norme 1EdTech de l'échange de données scolaires). OneRoster ne couvre que les personnes, les classes, les inscriptions et les périodes : les salles, la maquette et les services passent toujours par le classeur Planner.
- **Pourquoi côté serveur** : un seul endroit pour les contrôles, un journal, et pas de logique en double entre site et serveur. Aujourd'hui le fichier est lu dans le navigateur, puis chaque page envoie ses lignes à sa propre route (`/etudiants/import`, `/enseignants/import`, `/salles/import`, `/users/import`), sans transaction (vérifié dans `etudiantController.js`) : un import qui échoue au milieu laisse la moitié des lignes.

## D-09 Solveur : règles dures fixes, règles souples réglables, gros établissements découpés

- **Décision** : les règles dures (conflits salle, enseignant, groupe ; capacité ; indisponibilités) ne se règlent pas. Les règles souples (vœux, journées sans trous, même salle, CM avant TD…) s'activent et se pondèrent par établissement. Les règles propres à HESTIM deviennent des données : « samedi après-midi » (souple dans le solveur) et « pause du vendredi » (contrôlée seulement à la saisie manuelle) deviennent des **plages restreintes** par rythme, chacune « interdite » (dure) ou « à éviter » (souple). Une grande université se génère par **lots** (pôle ou département) qui partagent les ressources ; un lot qui ne trouve pas de solution complète le dit dans le rapport, et l'administration peut relancer avec un autre ordre des lots.
- **Technique** : poids passés avec le problème par `ConstraintWeightOverrides`, présent dans Timefold 1.15.0 (vérifié dans le jar), sans changer de version.

## D-10 Enseignants partagés entre établissements : des heures « occupé » fédérées

- **Décision** : quand un même compte enseigne dans deux établissements et l'accepte, chacun reçoit de l'autre des **plages occupées, sans aucun détail** (ni cours, ni groupe, ni salle), plus un temps de trajet entre établissements. Seules les séances **publiées** sont partagées ; à la publication, un contrôle signale ce qui chevauche une plage reçue depuis la génération.
- **Comment le solveur s'en sert** : il place une **semaine type**, que `timefold/deploiement.js` déploie ensuite sur les dates en sautant les dates bloquées. Les plages reçues sont datées. Elles se traitent donc en deux temps : une plage qui revient à la même heure la plupart des semaines de la période devient une indisponibilité de la semaine type ; une plage isolée est traitée au déploiement comme une indisponibilité ponctuelle (la séance saute cette date, comme pour un férié).
- **Pourquoi** : c'est le principal conflit entre écoles dans la réalité marocaine (vacataires de plusieurs écoles). Les autres partages possibles (salles communes à deux écoles d'un même groupe, étudiants en double cursus) ne sont pas couverts : aucun cas connu aujourd'hui. Le partage de disponibilités libre/occupé est le modèle des agendas (CalDAV free-busy).

## D-11 Marque et documents par établissement

- **Décision** : nom, nom court, logo, couleur d'accent (refusée si le contraste n'atteint pas AA), nom d'expéditeur et adresse de réponse des courriels, fuseau, langues, modèle de l'EDT du mois. Le format de l'EDT de HESTIM devient **un modèle** parmi d'autres ; un modèle « Planner » sert par défaut.
- **Courriels** : ils partent de l'adresse de Planner (`ne-pas-repondre@<domaine>`), avec le nom de l'école comme expéditeur affiché et la scolarité en adresse de réponse. Envoyer depuis le domaine de l'école (`@emsi.ma`) exigerait que l'école publie nos clés SPF et DKIM : c'est une option, pas le défaut, sinon les courriels tombent en indésirables.
- **Identifiants techniques figés** : certains « hestim » du code ne sont pas des textes mais des constantes dont dépendent des données déjà en circulation. Les renommer casserait l'existant : le sel de la clé de chiffrement de la double authentification (`services/mfa.js` : tous les administrateurs perdraient leur double authentification), le domaine des identifiants d'événements d'agenda (`DOMAINE_UID` de `ics.js` : chaque séance apparaîtrait en double dans les agendas des téléphones), le format des fichiers de quiz exportés (`hestim-studio-quiz` : les anciens fichiers doivent rester lisibles). Ils restent tels quels, avec un commentaire qui le dit, et sont exclus du contrôle `verifier:neutre`.

## D-12 Les jeux dans un service à part, des gabarits d'abord

- **Décision** : dépôt et service `planner-jeux`, base `planner_jeux`. Niveau 1 : les créateurs **remplissent des gabarits** programmés par Planner (quiz, remise en ordre, appariement, tri, texte à trous, simulations d'Alexis) ; le serveur des jeux évalue. Niveau 2, plus tard : des jeux programmés (HTML5) par des studios vérifiés, isolés sur un autre domaine, dont les scores ne servent qu'à l'entraînement.
- **Pourquoi** : Kahoot fait créer du contenu, pas du code. Un code tiers exécuté chez les élèves est le premier risque de sécurité et le plus coûteux à relire.
- **Conditions pour ouvrir le niveau 2** : 50 jeux de niveau 1 publiés, une procédure de revue tenue trois mois, une politique de sécurité du contenu testée.
- **Conséquence pour la rémunération** : un jeu de niveau 2 s'évalue dans le navigateur, donc le serveur ne peut pas vérifier qu'un défi a été terminé. Il n'entre dans le fonds que sur des signaux que le serveur observe lui-même (session rejointe par un élève, temps de présence) ; la règle exacte sera fixée à l'ouverture du niveau 2.

## D-13 Rémunération : un fonds par école, réparti selon l'usage qualifié dans cette école

- **Options** : vente à l'unité (Teachers Pay Teachers) ; somme fixe par usage ; fonds global réparti au prorata (Spotify) ; **fonds de chaque école réparti selon l'usage dans cette école** (« centré utilisateur », Deezer, SoundCloud).
- **Décision** : la dernière. Détail, calcul et fraude : fichier 08.
- **Pourquoi** : la vente à l'unité ferait payer l'école en plus (contraire à C-2) ; une somme fixe par usage fait porter le risque à Planner ; le fonds global laisse une école très active capter l'argent payé par les autres. Le fonds par école est juste et coûte cher à tromper : chaque faux élève coûte 4,99 MAD à son école.

## D-14 Échanges entre services : HTTP signé et boîte d'envoi, sans courtier au départ

- **Décision** : questions synchrones en HTTP avec jeton de service (RS256, audience par service). Événements par une **boîte d'envoi transactionnelle** (table `BoiteEnvoi` écrite dans la même transaction que le changement), livrés en HTTP avec reprises, reçus par des consommateurs idempotents (identifiant d'événement unique).
- **Livreur** : chaque base d'école a sa boîte d'envoi ; un seul livreur parcourt les écoles qui ont écrit un événement (signal en mémoire à l'écriture, plus un passage de rattrapage toutes les minutes), pas toutes les bases à chaque seconde.
- **Changerait si** : plus de quelques dizaines d'événements par seconde ; on passerait alors à Redis Streams (déjà déployé pour StudyLib) sans changer les messages.

## D-15 Une donnée a un seul propriétaire ; on se réfère à elle par un identifiant stable

- **Décision** : chaque donnée partagée a un propriétaire unique (tableau du fichier 03) ; les autres services en gardent une **copie de lecture**, mise à jour par événement. Filières, modules, groupes, campus, salles et personnes reçoivent un `uid` (UUID v7, ordonné dans le temps ; Node ne fournit que le v4 avec `crypto.randomUUID`, une fonction de quelques lignes suffit, sans dépendance) qui ne change jamais. Un service ne se réfère jamais à la donnée d'un autre par un code.
- **Pourquoi** : StudyLib rapproche aujourd'hui filières et modules par **code** (`planner:sync`) ; or l'école doit pouvoir renommer un code en quelques clics (EX-07), et deux écoles ont souvent les mêmes codes (« IIIA »).

## D-16 Exploitation : vagues, migrations compatibles, sauvegardes hors serveur d'abord

- **Décision** : une version de Planner est déployée, puis les migrations sont appliquées par vagues (établissement d'essai, HESTIM, les autres). Toute migration suit « étendre puis contracter » : une version de l'application fonctionne avec le schéma d'avant et d'après. Chaque version de Planner déclare donc une **plage de schémas acceptés** (de la dernière migration de la version précédente à la sienne) ; une école dont le schéma est dans la plage est servie normalement pendant les vagues, une école hors de la plage passe en maintenance. Un établissement dont la migration échoue passe seul en maintenance. **Préalable bloquant** : les sauvegardes hors du serveur (A-3, en attente depuis le 18 octobre), par établissement, et aussi pour les bases de la Plateforme, des jeux (le grand livre des créateurs) et de StudyLib.

## D-17 Planner reste un monolithe modulaire ; seuls quatre services sont séparés

- **Options** : découper Planner en microservices (calendrier, appel, génération…) ; ou garder un seul service découpé en modules aux frontières nettes.
- **Décision** : Planner reste **un** service, rangé par contextes métier (fichier 03, § 3.3). Services séparés : Plateforme, solveur (déjà), Bibliothèque des documents (StudyLib, déjà), jeux (nouveau).
- **Pourquoi** : la planification, l'appel et les reports partagent les mêmes séances dans des transactions ; les séparer créerait des transactions réparties sans bénéfice pour deux petites équipes. On sépare ce qui a un cycle de vie, des données ou des utilisateurs différents : c'est le cas des quatre services retenus.

## D-18 Désactiver plutôt que supprimer

- **Contexte** : `Users.actif` coupe déjà l'accès à chaque requête, mais il n'y a ni action dédiée, ni motif, ni date, ni lot, ni traitement des séances futures d'un enseignant ; `deleteUser` efface un compte même s'il a un historique.
- **Options** : (a) garder le champ dans la fenêtre de modification ; (b) une action de désactivation avec aperçu, et une suppression réservée aux comptes sans historique.
- **Décision** : (b). Désactivation immédiate ou programmée, seule ou en lot, avec motif ; aperçu des conséquences pour un enseignant ; sessions et jetons d'appareils supprimés ; réactivation sans perte ; anonymisation à la place de la suppression pour l'effacement légal. Après ME-8, on désactive l'appartenance à l'école, jamais le compte commun. Détail : fichier 11.
- **Pourquoi** : l'historique (présences, séances faites, résultats) appartient aussi à l'école et sert aux relevés ; une suppression le casse.

## D-19 L'année est le cadre de ce que voit chacun ; une année close est archivée en lecture seule

- **Contexte** : l'année d'un groupe n'est qu'un texte libre ; deux fonctions calculent les groupes d'un étudiant sans filtrer l'année : les modules de deux années se mélangent.
- **Options** : (a) effacer les inscriptions de l'année passée ; (b) filtrer par année partout, avec une année close en lecture seule.
- **Décision** : (b). `Groupe.id_annee` devient une vraie clé ; une seule fonction `groupesDeLAnnee(personne, année)` ; année en cours par défaut, années closes dans une rubrique à part ; clôture et préparation de l'année suivante par « aperçu puis appliquer ». Détail : fichier 11.
- **Pourquoi pas (a)** : on perdrait l'historique de l'étudiant (présences, résultats) et l'enseignant ses classes passées ; et la règle resterait écrite deux fois.

## D-20 Des sites indépendants dans un même établissement

- **Contexte** : décision du 24 octobre (Q-4) : une école de plusieurs villes (EMSI) est **un** établissement, mais ses campus sont **indépendants** : un emploi du temps ne doit jamais partir vers les étudiants d'un autre campus, et un étudiant ne doit jamais être placé dans un campus où il n'est pas inscrit. La décision du 21 octobre (« plus aucun campus préféré ; une filière va dans n'importe quel bâtiment ») reste vraie **pour HESTIM**, dont les deux campus partagent les mêmes étudiants.
- **Options** : (a) un établissement par ville (casse le partage des enseignants, de la maquette et de l'administration) ; (b) rendre chaque `Campus` indépendant (casse HESTIM, dont Gandhi et Stendhal accueillent les mêmes classes) ; (c) **un niveau de plus, le site** : un site regroupe un ou plusieurs campus qui partagent leurs étudiants et leurs salles ; deux sites sont étanches.
- **Décision** : (c). HESTIM a un seul site (« Casablanca ») avec ses deux campus : rien ne change pour elle, et la notion de site reste invisible à l'écran tant qu'un établissement n'en a qu'un. L'EMSI a un site par ville (ou par campus indépendant). Détail : fichier 06, § 6.7.
- **Pourquoi** : (c) est la seule option qui tient à la fois la règle de HESTIM et celle de l'EMSI, sans deuxième établissement.
