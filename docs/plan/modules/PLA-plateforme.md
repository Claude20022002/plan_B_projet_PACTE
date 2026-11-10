# PLA · Plateforme multi-écoles et isolation

**Objet** : plusieurs écoles sur une même installation, chacune dans sa base (D-01). Aucune donnée ne passe de l'une à l'autre. Ce module couvre :
- le contexte d'école ;
- le registre des écoles et la création d'une école ;
- la base neuve ;
- les tests d'isolation ;
- l'export d'une école ;
- les comptes communs à plusieurs écoles.

**Hors module** :
- le registre des **modules** d'une école : VEN-01 ;
- le déploiement : EXP ;
- StudyLib par école : BIB-02.

**Tables possédées** : celles de la Plateforme (registre des écoles, appartenances) et `ConfigurationEtablissement`.

## Ce qui existe

- **Une seule base aujourd'hui** : `backend/config/db.js`.
- **Essai du contexte d'école** (#142, **fusionné le 10 novembre**) :
  - `backend/contexte/etablissement.js` (`AsyncLocalStorage`) et `backend/contexte/resolveur.js` ;
  - `backend/models/definitions.js` contient les modèles et leurs relations ; `backend/models/index.js` n'exporte plus que des résolveurs ;
  - un test à deux bases ;
  - le mode strict est **éteint**.
  - Le résultat est noté dans [17-essai-contexte.md](../../conception/plateforme/17-essai-contexte.md).
- **Règle de lint R-2** (#137) : la connexion à la base n'est importée que dans `models/`. Il reste 24 exceptions figées.
- **Audit d'isolation** : [18-audit-isolation.md](../../conception/plateforme/18-audit-isolation.md) liste 15 canaux, plus I-16. **I-16** : `DEVOIRS_ACTIFS`, `ANNONCES_ENSEIGNANTS_ACTIVES` et `APP_TIMEZONE` sont des variables d'environnement, donc communes à toute l'installation.
- **Fonctionnalités par école** : `services/etablissement/fonctionnalites.js` ; ClassQuiz par école (migration 0057).
- **Identité de l'école** : migration 0055.
- **Contrôle CI** `scripts/verifier-neutre.mjs` : aucun nom d'école écrit en dur.
- **Problème connu** : `migrations/0003-campus-salles.js` crée les campus d'HESTIM dans **toute** base neuve.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| PLA-01 | Contexte d'école en production : mode strict allumé, toute requête dans le contexte de son école | ME-3a | 2 | L | EXP-02, QUA-03 | à faire (essai fait) |
| PLA-02 | Fermer les canaux de l'étape 2 : I-1, I-2, I-3, I-6, I-7, I-8, I-10, I-13, **I-16** (réglages par école au lieu de variables d'environnement) | ME-3b, I-16 | 2 | L | PLA-01 | à faire |
| PLA-03 | Base neuve sans données d'école : la migration 0003 ne crée plus de campus dans une base sans comptes ; un **schéma de départ** évite de rejouer 60 migrations | B-1 de la revue | 2 | M | — | à faire |
| PLA-04 | Tests d'isolation de chaque route dans la CI, côté serveur et parcours : rien d'une école n'apparaît dans l'autre | ME-6 | 2 | M + S | PLA-01 | à faire |
| PLA-05 | Registre des écoles et création d'une école **par une commande** (base, migrations, premier administrateur), temps mesuré | ME-4 réduit | 2 | L | PLA-03 | à faire |
| PLA-06 | Mesure de D-01 : 200 bases sur un serveur (mémoire des pools, temps de migration, démarrage) | A-1 de la revue | 1 | M | — | à faire |
| PLA-07 | Sauvegarde et restauration **par école** (canal I-11) | I-11 | 2 | M | EXP-04 | à faire |
| PLA-08 | Console de l'équipe Planner (créer, suspendre, voir l'état des écoles) | ME-4 (console) | 5, ou juste avant la 1re école extérieure | M | PLA-05 | reporté |
| PLA-09 | Migrations par vagues, hors du démarrage du serveur | ME-5 | 5, ou juste avant la 1re école extérieure | M | PLA-05 | reporté |
| PLA-10 | Choisir son école à la connexion ; l'application la trouve par adresse ou par code (canal I-12) | ME-8 réduit | 5, ou juste avant la 1re école extérieure | M | PLA-05, MOB-07 | reporté |
| PLA-11 | Comptes communs : un compte, plusieurs écoles (parents, enseignants partagés) | ME-8 | 5 | L | PLA-10, VSC-01 | reporté |
| PLA-12 | Export complet d'une école ; effacement sous 30 jours après son départ (EP-12) | ME-16 | 5 | M | PLA-07 | à faire |
| PLA-13 | Une école hors du Maroc configurée sans changer le code (fuseau, langue, devise) ; sites indépendants si une école en a besoin | ME-7, ME-25 | 5 | M (+ L, conditionnel) | PLA-02, FIN-01 | reporté |

## Critères de « terminé »

- **PLA-01** : le mode strict est allumé en production ; une requête hors contexte échoue dans les tests ; la suite complète passe sur deux bases.
- **PLA-02** :
  - un test par canal fermé ;
  - I-16 : deux écoles ont `DEVOIRS_ACTIFS` différent, et le fuseau est lu dans la configuration de l'école ;
  - les canaux laissés ouverts sont écrits ici, avec le module qui les ferme : I-4 et I-5 → BIB-02 ; I-9 → la seconde école n'a pas ClassQuiz ; I-11 → PLA-07 ; I-12 → PLA-10 ; I-14 → EXP-05 ; I-15 → QJE-07.
- **PLA-03** : une base neuve ne contient aucun nom, campus ni salle d'HESTIM ; une base qui a des comptes garde tout (même règle que la migration 0057).
- **PLA-04** : une route nouvelle sans test d'isolation fait échouer la CI.
- **PLA-05** : `creer-ecole <code>` donne une école utilisable ; le temps est mesuré et noté ; la création est refaite deux fois sans erreur.
- **PLA-06** : rapport chiffré ; D-01 confirmée ou rouverte dans [decisions.md](../decisions.md).
- **PLA-07** : une école se restaure seule, sans toucher les autres ; l'essai est noté dans `docs/recette/essais-restauration.md`.

## Exigences produit

EP-9 (mises à jour), EP-12 (isolation, export).

## Conception et références

- [Architecture](../../conception/plateforme/03-architecture.md)
- [Modèle de données](../../conception/plateforme/04-modele-donnees.md)
- [Décisions D-01 à D-21](../../conception/plateforme/02-decisions.md)
- [Essai du contexte](../../conception/plateforme/17-essai-contexte.md)
- [Audit d'isolation](../../conception/plateforme/18-audit-isolation.md)
- Archives : [lots ME du plan multi-établissements](../../archives/plans/planner-multi-etablissements/09-migration-lots.md)
