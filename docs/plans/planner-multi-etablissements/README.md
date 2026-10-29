# Plan : de HESTIM Planner à Planner, pour tout établissement

Statut : **validé par le chef de projet le 24 octobre 2026.** Les plans ne changent que sur sa demande ; les questions encore ouvertes sont au fichier 13, § 13.15.

Ce dossier décrit deux transformations :

1. **Planner multi-établissements** : un seul produit, « Planner », que n'importe quelle école (EMSI, UM6P, HESTIM…) met en place seule, en quelques heures, en important ses fichiers Excel, sans aucune donnée commune ni aucun conflit avec une autre école, et qu'elle règle ensuite en quelques clics.
2. **Créateurs de jeux** : des personnes extérieures conçoivent des jeux pédagogiques dans un service à part (dépôt séparé), les écoles les utilisent depuis Planner, et les créateurs sont rémunérés selon l'usage.

## Comment lire ce dossier

| Fichier | Contenu | Pour qui |
|---|---|---|
| [01-exigences.md](01-exigences.md) | Ce que le produit doit faire, avec un critère vérifiable pour chaque exigence | Tous |
| [02-decisions.md](02-decisions.md) | Les 21 décisions d'architecture, chacune avec les options écartées et ce qui la ferait changer | Chef de projet, groupe A |
| [03-architecture.md](03-architecture.md) | Services, frontières, résolution de l'établissement, échanges entre services, déploiement | Groupes A et B |
| [04-modele-donnees.md](04-modele-donnees.md) | Bases de la plateforme et des établissements, identifiants partagés, invariants | Groupe A |
| [05-configuration-import.md](05-configuration-import.md) | Assistant de démarrage, paramètres datés « aperçu puis appliquer », import Excel sans conflit | Groupes A et B |
| [06-planification-adaptative.md](06-planification-adaptative.md) | Calendriers par pays, grilles, règles du solveur réglables, enseignants partagés entre écoles | Groupe A |
| [07-jeux-createurs.md](07-jeux-createurs.md) | Le service des jeux : gabarits, création, revue, exécution, confidentialité | Équipe jeux |
| [08-remuneration.md](08-remuneration.md) | Le fonds des créateurs, le calcul, la fraude, le grand livre, les paiements | Chef de projet, équipe jeux |
| [09-migration-lots.md](09-migration-lots.md) | Passage de HESTIM sans coupure, lots ordonnés et leurs dépendances | Tous |
| [11-comptes-et-annees.md](11-comptes-et-annees.md) | Désactivation des comptes par l'administration ; années closes archivées, séparées de l'année en cours ; passage à l'année suivante | Groupes A et B |
| [12-contre-expertise.md](12-contre-expertise.md) | Contre-expertise par domaine (finance, vente, scolarité, sécurité, exploitation, équipe, droit, produit, créateurs) : verdicts, corrections faites, découpage en trois tranches, décisions Q-15 à Q-23 | Chef de projet |
| [13-offre-et-exploitation.md](13-offre-et-exploitation.md) | Décisions du 24 octobre : prix (5,40 MAD HT, 6,48 TTC), modèle et offre d'IA, contrat annuel, accompagnement, école pilote, engagements de service, deuxième personne en production, hébergement au Maroc, nom | Chef de projet |
| [14-parite-moodle-classroom.md](14-parite-moodle-classroom.md) | Fonctions de Moodle et de Classroom pour les enseignants : inventaire, écarts, lots EC-1 à EC-12, chacun derrière un interrupteur par établissement | Chef de projet, groupes A et B |
| [15-plan-de-developpement.md](15-plan-de-developpement.md) | Plan de développement pour les deux groupes : six vagues avec leur jalon, répartition A / B, charge, passages de relais, règles communes, décisions qui bloquent | Chef de projet, groupes A et B |
| [16-revue-expert.md](16-revue-expert.md) | Revue d'expert logiciel et sécurité du 26 octobre : verdict, six corrections du plan de développement (dont un lot manquant), sept corrections de sécurité, décisions R-1 à R-8 | Chef de projet, groupes A et B |
| [17-essai-contexte.md](17-essai-contexte.md) | Essai réduit de ME-3a du 29 octobre : D-03 tient (résolveurs et `AsyncLocalStorage` sur deux bases), ce que l'essai a trouvé, conditions et reste à faire de ME-3a | Chef de projet, groupe A |
| [18-audit-isolation.md](18-audit-isolation.md) | Audit d'isolation entre écoles du 29 octobre : 15 canaux à fermer avant une deuxième école (4 critiques), avec emplacement, gravité, preuve et lot ; ce qui est déjà isolé ; ordre proposé | Chef de projet, groupes A et B |
| [conception-v0-groupe-b.md](conception-v0-groupe-b.md) | Conception de la vague V0 pour le groupe B : contrat d'API de ME-17, écrans, sélecteur d'année de ME-18, essai de ME-11 sur téléphone, passage de relais | Groupe B |
| [10-verification.md](10-verification.md) | Traçabilité, invariants testés, analyse des défaillances, contradictions trouvées et levées, relecture point par point du 23 octobre (§ 10.4.1 : 25 corrections), questions | Chef de projet |

Les diagrammes sont écrits en Mermaid : GitHub les affiche directement. Ils font partie du plan : un changement de conception commence par le diagramme.

## L'essentiel en treize lignes

1. **Une base de données par établissement**, sur des serveurs MySQL partagés, avec un utilisateur MySQL propre à chaque école. Une école ne peut pas lire une autre, même en cas de bogue (décision D-01).
2. **Un service « Plateforme »** connaît les établissements, leurs domaines, leurs bases, les comptes, les abonnements et la facturation. Il n'a aucune donnée pédagogique (D-04).
3. **L'établissement se déduit de l'adresse** (`emsi.<domaine>`) et du jeton, jamais d'un champ envoyé par le navigateur. Toute requête sans établissement échoue (D-02, D-03).
4. **Le code ne garde que le sens, l'école nomme** : types de salles, équipements, rythmes, périodes, pôles deviennent des données de chaque école ; le solveur ne connaît que des rôles (D-06).
5. **Un réglage qui déplace des séances passe par « aperçu puis appliquer »**, avec une date d'effet et un retour arrière (D-07).
6. **L'import Excel passe par une zone de préparation** : lecture, correspondance des colonnes, trois niveaux de contrôle, aperçu, application tout ou rien, annulation (D-08).
7. **« Zéro conflit entre écoles »** veut dire deux choses : aucune donnée partagée, et un enseignant vacataire qui travaille dans deux écoles n'y est jamais placé deux fois à la même heure (D-05, D-10).
8. **Les jeux vivent dans un service à part** (dépôt `planner-jeux`). Les créateurs remplissent des gabarits, comme sur Kahoot ; le code tiers n'arrive que plus tard, sous conditions (D-12).
9. **Les créateurs sont payés par un fonds** : une part fixe de ce que chaque école paie, répartie entre les jeux selon leur usage réel dans cette école (D-13).
10. **HESTIM devient le premier établissement sans déplacer ses données** : sa base actuelle est enregistrée telle quelle ; le passage se fait par petits lots, chacun réversible (fichier 09).
11. **L'administration désactive un compte en un geste**, avec motif et date, après un aperçu de ce que cela touche ; on ne supprime jamais un compte qui a un historique (D-18).
12. **Chaque année se clôture et s'archive** : étudiants et enseignants ne voient que l'année en cours, les années closes restent consultables à part, en lecture seule (D-19).
13. **Planner est un modèle que chaque école règle elle-même** : un panneau de configuration (identité, logo et couleurs du site et de l'application, campus associés ou dissociés, salles, offre de formation, calendrier, grilles, règles, fonctionnalités, personnes), et un fichier Excel par section (D-21, § 5.5).

## Vocabulaire

| Terme | Sens dans ce plan |
|---|---|
| Établissement | Une école cliente : HESTIM, EMSI… C'est l'unité d'isolation (une base). Dans le code : `etablissement` (pas « tenant ») |
| Organisation | Un groupe d'établissements (un groupe scolaire) qui peut partager la facturation. Facultative |
| Campus | Un lieu d'un établissement, éventuellement dans une autre ville |
| Plateforme | Le service commun à tous les établissements (registre, comptes, facturation) |
| Compte | Une personne pour toute la plateforme (une adresse, un mot de passe). Elle peut appartenir à plusieurs établissements |
| Appartenance | Le lien entre un compte et un établissement, avec un rôle |
| Paramètre structurel | Un réglage qui peut déplacer des séances existantes (grille, calendrier, règle dure) |
| Gabarit | Un type de jeu programmé par Planner (quiz, remise en ordre, simulation…) que les créateurs remplissent |
| Usage qualifié (UQ) | Un élève, un jeu, un jour, avec un minimum de jeu réel : l'unité qui sert à rémunérer |
| Fonds des créateurs | La part du chiffre d'affaires encaissé réservée aux créateurs |

## Ce qui ne change pas

- Les décisions déjà prises restent : facturation **à l'école**, jamais à l'élève ; 4,99 MAD par compte actif et par mois ; IA incluse ; noms à l'écran « Planner, Bibliothèque, Quiz, Activités » ; trois statuts d'appel ; règles de code (§ 6 de `assainissement.md`, 300 lignes par fichier).
- La Bibliothèque des documents reste StudyLib, dans son dépôt.
- La sortie de ClassQuiz suit son plan : **aucun nouvel établissement n'aura ClassQuiz** (D-04, fonctionnalités par établissement).
