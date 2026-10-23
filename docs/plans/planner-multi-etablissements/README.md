# Plan : de HESTIM Planner à Planner, pour tout établissement

Statut : **proposé** (23 octobre 2026), à valider par le chef de projet. Rien n'est commencé dans le code. Les plans ne changent que sur sa demande.

Ce dossier décrit deux transformations :

1. **Planner multi-établissements** : un seul produit, « Planner », que n'importe quelle école (EMSI, UM6P, HESTIM…) met en place seule, en quelques heures, en important ses fichiers Excel, sans aucune donnée commune ni aucun conflit avec une autre école, et qu'elle règle ensuite en quelques clics.
2. **Créateurs de jeux** : des personnes extérieures conçoivent des jeux pédagogiques dans un service à part (dépôt séparé), les écoles les utilisent depuis Planner, et les créateurs sont rémunérés selon l'usage.

## Comment lire ce dossier

| Fichier | Contenu | Pour qui |
|---|---|---|
| [01-exigences.md](01-exigences.md) | Ce que le produit doit faire, avec un critère vérifiable pour chaque exigence | Tous |
| [02-decisions.md](02-decisions.md) | Les 17 décisions d'architecture, chacune avec les options écartées et ce qui la ferait changer | Chef de projet, groupe A |
| [03-architecture.md](03-architecture.md) | Services, frontières, résolution de l'établissement, échanges entre services, déploiement | Groupes A et B |
| [04-modele-donnees.md](04-modele-donnees.md) | Bases de la plateforme et des établissements, identifiants partagés, invariants | Groupe A |
| [05-configuration-import.md](05-configuration-import.md) | Assistant de démarrage, paramètres datés « aperçu puis appliquer », import Excel sans conflit | Groupes A et B |
| [06-planification-adaptative.md](06-planification-adaptative.md) | Calendriers par pays, grilles, règles du solveur réglables, enseignants partagés entre écoles | Groupe A |
| [07-jeux-createurs.md](07-jeux-createurs.md) | Le service des jeux : gabarits, création, revue, exécution, confidentialité | Équipe jeux |
| [08-remuneration.md](08-remuneration.md) | Le fonds des créateurs, le calcul, la fraude, le grand livre, les paiements | Chef de projet, équipe jeux |
| [09-migration-lots.md](09-migration-lots.md) | Passage de HESTIM sans coupure, lots ordonnés et leurs dépendances | Tous |
| [10-verification.md](10-verification.md) | Traçabilité, invariants testés, analyse des défaillances, contradictions trouvées et levées, questions | Chef de projet |

Les diagrammes sont écrits en Mermaid : GitHub les affiche directement. Ils font partie du plan : un changement de conception commence par le diagramme.

## L'essentiel en dix lignes

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
