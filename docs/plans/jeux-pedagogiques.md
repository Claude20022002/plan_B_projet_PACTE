# Plan : la bibliothèque de jeux pédagogiques

Statut : **contrat en vigueur** (16 octobre 2026). Alexis (branche `jeux-pedagogique`) construit les jeux ; ce document fixe ce qu'un jeu doit respecter pour entrer dans Planner, et garde la relecture de chaque livraison.

Décisions déjà prises, rappelées ici :

- **12 octobre** : Planner propose une bibliothèque de jeux pédagogiques **classés par module** ; un jeu repris d'ailleurs garde son auteur et sa licence (comme Terminal Linux, MIT).
- **11 octobre** : plus d'onglet Jeux dans la barre du bas de l'application ; l'étudiant ouvre un jeu **par un scan**, comme Wooclap, ou depuis son module.
- **15 octobre** : `Jeux_HESTIM/` est le projet d'un autre groupe ; il ne revient pas dans ce dépôt (PR #41).

## 1. Ce qu'est un jeu dans Planner

Un jeu = **une entrée de catalogue + un moteur partagé + un écran web + un écran mobile**. Le serveur ne fait jamais confiance au navigateur : il rejoue la réponse et calcule lui-même les points.

| Pièce | Où | Règle |
|---|---|---|
| Entrée de catalogue | `shared/jeux/catalogue.js` (terminal) ou `shared/simulations/catalogue/<code>.js` (simulations) | `code` stable (il est enregistré en base, ne jamais le renommer), `type`, `discipline`, `titre` et `resume` en **fr et en**, `source` (jeu repris : nom, auteur, url, licence) **ou** `curriculum` (jeu original : page HESTIM du programme) |
| Défis | dans l'entrée | `id` stable, `niveau`, `xp` ; l'XP n'est lue que côté serveur |
| Moteur | `shared/<famille>/` | Fonctions pures, sans réseau ni DOM : même code pour le serveur, le site et l'application |
| Évaluation | `backend/services/jeux/` | Le client envoie **sa réponse**, jamais un score ; toute propriété en trop est refusée (400) |
| Accès | `jeuAccessible` | Un étudiant ne joue qu'à un jeu **proposé dans un de ses modules** ; revérifié à chaque essai |
| Écrans | `frontend/src/pages/jeux/`, `mobile/src/app/` | 360 px de large au minimum, cibles tactiles de 44 px, thème Planner (clair et sombre) |
| Textes | `shared/<famille>/i18n.js` | Aucune chaîne en dur, français par défaut |

## 2. Ce qu'un jeu n'a pas le droit de faire

- Demander un compte externe, afficher de la publicité, appeler un service tiers ou un traceur.
- Copier le nom, les visuels, les textes ou le code d'un jeu sans licence qui le permet. Une **mécanique** (podium, équipes, remise en ordre) se reprend librement ; le reste non.
- Être présenté comme une évaluation officielle de l'école : ce sont des entraînements (`but: 'entrainer'`).
- Modifier un fichier qui ne le concerne pas (reformatage, configuration commune) sans le dire dans la PR.

## 3. Règles de code (rappel de `assainissement.md`, § 6)

- **300 lignes au plus par fichier**, une responsabilité par fichier ; un catalogue qui grossit se découpe (un fichier par jeu).
- Chaque fichier commence par un commentaire de rôle, **en français** ; chaque fonction exportée a sa ligne.
- Pas de reformatage de masse : un diff ne contient que ce que le jeu change.

## 4. Livrer un jeu

1. Une branche par jeu ou par lot cohérent : `j/<code-du-jeu>`, partie de `main` à jour.
2. Les tests, tous verts avant la PR :
   - moteur : `backend/tests/utils/` (cas réussi, cas raté, réponse mal formée) ;
   - serveur : `backend/tests/integration/` (401 sans compte, 403 hors module, aucun score accepté du client, première réussite seule enregistrée) ;
   - application : `mobile/__tests__/` ;
   - `npm run lint` sans erreur dans `backend/` et `frontend/`.
3. Une PR vers `main` qui dit : les jeux ajoutés, leur source ou leur programme, les fichiers communs touchés et pourquoi.
4. Relecture par le chef de projet (ou Claude, modèle Opus) avant fusion ; aucune fusion directe.

## 5. Relecture de `jeux-pedagogique` (16 octobre 2026, commits `5ddd791` et `aa485f1`)

**Contenu** : neuf simulations originales (Robot Route, Labo des seuils, Pilote des stocks, Tri Cyber, Requête parfaite, Nœuds réseaux, Ordonnanceur CPU, Sprint agile, Budget ERP), une route d'essai évaluée par le serveur, un écran web et un écran mobile communs à toutes les simulations, et une proposition des jeux dans le module CPI-1-PY par le seed.

**Vérifié sur ce poste** : tests unitaires du serveur 278 sur 278, tests de l'application 50 sur 50, construction du site réussie, lint sans erreur (deux avertissements de longueur), aucune fusion en conflit avec `main`, `b/offres-stage`, `b/bibliotheque-sans-studylib` ni `b/corrections-tests-locaux`. **Non lancés** (Docker arrêté) : tests d'intégration du serveur et parcours Playwright `frontend/tests/simulations/`.

**Points forts** : le score n'est jamais pris au client (un essai qui envoie `points` est refusé), l'accès est revérifié à chaque essai, la première réussite seule est enregistrée, le code est partagé entre le site et l'application, les tests couvrent les contournements.

**À corriger avant la fusion** :

| # | Point | Où |
|---|---|---|
| 1 | Le catalogue fait 407 lignes : un fichier par simulation (`shared/simulations/catalogue/<code>.js`) et un index | `shared/simulations/catalogue.js` |
| 2 | 122 lignes d'`App.jsx` ne sont que du réalignement (espaces des `import` et des `lazy`) : ne garder que l'import de `routesJeux` et le remplacement des trois routes | `frontend/src/App.jsx` |
| 3 | Commentaires en anglais : à passer en français | fichiers nouveaux |
| 4 | Le seed propose **tous** les jeux dans CPI-1-PY (Python) : Pilote des stocks ou Budget ERP n'y ont pas leur place. Proposer chaque jeu dans un module de sa discipline | `backend/seed.js` |

**À expliquer dans la PR** (pas bloquant) :

- `mobile/jest.config.js`, `jest.resolver.js` et `jest.esm-fix.js` remplacent la configuration de Jest de `package.json` et neutralisent les modules ES de `vm` pour lire `shared/`. Les 50 tests passent, mais c'est un réglage commun aux deux groupes : le groupe B doit le connaître. Dans `jest.resolver.js`, `unstable_shouldLoadAsEsm` rend `false` dans les deux branches : la condition est inutile.
- Le commentaire retiré de `mobile/babel.config.js` (plugin des worklets de Reanimated) était utile : à remettre.

**Reste à faire, hors de cette branche** : dans l'application, les jeux ne s'ouvrent encore que depuis l'écran `jeux.jsx`, qui n'a plus d'onglet. L'entrée prévue le 11 octobre (un scan, ou le module dans « Mes cours ») reste à construire ; c'est elle qui rendra les simulations visibles aux étudiants.
