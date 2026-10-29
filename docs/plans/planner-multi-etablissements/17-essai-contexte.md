# 17. Essai réduit du contexte d'établissement (ME-3a, R-2)

29 octobre 2026, groupe A. Branche `a/essai-me3a`. Demandé par la revue d'expert (fichier 16, A-2 et R-2) et le plan de développement (fichier 15, V1) : dire tôt si la décision D-03 tient, ou s'il faut passer à l'injection explicite (`req.modeles`) avant que le code des vagues V1 à V3 ne s'ajoute à reprendre.

## 17.1 Verdict

**D-03 tient.** Avec une seule école, la suite d'intégration complète passe à travers les résolveurs, sans changer un seul appelant : contrôleurs, services, tâches et tests importent toujours `models/index.js`. Avec deux écoles et deux bases, trois routes réelles écrivent et lisent dans la bonne base, y compris sous des requêtes mêlées, et un accès hors contexte échoue en mode strict. L'injection explicite n'est pas nécessaire.

Quatre conditions, à tenir dans ME-3a complet (§ 17.4) :

1. les 23 fichiers figés par la règle de lint passent par `models/acces.js` **avant** toute deuxième école : le mode strict ne les arrête pas (§ 17.3, point 2) ;
2. un crochet de modèle lit les autres modèles par `instance.sequelize.models`, jamais par un import ;
3. tout travail différé (file des notifications, tâches périodiques) garde ou choisit son établissement ;
4. la fabrique de modèles remplace le clonage de l'essai.

## 17.2 Ce qui a été essayé

| Élément demandé | Dans l'essai | Résultat |
|---|---|---|
| Un résolveur de modèles | `backend/contexte/resolveur.js` : un `Proxy` par nom de modèle, relu à chaque accès sur l'établissement courant. `models/index.js` n'exporte plus que ces résolveurs ; les définitions et les relations sont dans `models/definitions.js` (l'ancien `index.js`, inchangé à deux lignes près) | `findAll`, `create`, `new`, `instanceof`, `include: [{ model }]` (y compris un modèle inclus dans lui-même), `scope` (la connexion lit `Users.scope("withPassword")`, dans les deux écoles) : la suite complète passe |
| `AsyncLocalStorage` | `backend/contexte/etablissement.js` ; `middleware/etablissementMiddleware.js` choisit l'école par le nom d'hôte, juste après CORS | Le contexte suit les `await`, les lecteurs de corps (`express.json`, `express.raw`) et les crochets de Sequelize : vérifié en mode strict avec un corps JSON de 300 Ko et l'envoi du logo |
| Trois routes | `GET /api/groupes` (lecture, deux inclusions) ; `POST /api/groupes` (création, crochet) ; `POST /api/presences/demandes-telephone/:id/accepter` (transaction) | Chaque école ne lit et n'écrit que sa base ; 20 requêtes des deux écoles lancées ensemble ne se mélangent pas |
| Une transaction | `models/acces.js` : `enTransaction` et `requete` prennent la connexion de l'établissement courant | La décision sur le téléphone écrit dans la base de B seulement |
| Un crochet de modèle | `beforeSave` de `Groupe` (année retrouvée par son libellé) et `afterSave` de `AnneeUniversitaire` (ME-18) | Faux au premier essai, corrigé (§ 17.3, point 1) |
| Deux bases de test | `hestim_test` (école A, celle de `config/db.js`) et `hestim_test_b`, migrée par `migrateurPour(connexion)` | Mêmes adresses et numéros d'année différents dans les deux bases : un mélange se verrait |
| Échec fermé | `CONTEXTE_STRICT=true` | Un modèle utilisé hors contexte lève `HorsContexteError` ; un hôte inconnu reçoit 404 sans toucher de base |

Le test : `backend/tests/integration/contexteEtablissement.test.js` (10 tests).

## 17.3 Ce que l'essai a trouvé

1. **Un crochet qui importe un autre modèle lit la base de A.** Le `beforeSave` de `Groupe` cherchait l'année par `AnneeUniversitaire`, importé directement : dans l'école B, il donnait au groupe l'identifiant de l'année de A, et la base de B le refusait (clé étrangère). C'était l'exception unique de la règle de lint sur les modèles. Corrigé : les deux crochets lisent par `instance.sequelize.models`, le crochet sur les années est posé dans `definitions.js`, `Groupe.js` n'importe plus aucun modèle et la liste d'exceptions des modèles est vide.
2. **Une transaction ouverte sur `config/db.js` emporte dans A l'écriture d'un modèle de B**, sans erreur, même en mode strict : Sequelize exécute la requête sur la connexion de la transaction. Un test le constate. C'est le cas des 23 fichiers figés par la règle de lint (`sequelize.transaction`) : ils doivent passer par `enTransaction` avant qu'une deuxième école n'existe.
3. **La file d'envoi des notifications mélangerait les écoles.** `services/push.js` garde une seule file et une seule minuterie pour tout le processus ; la file est vidée dans le contexte de la requête qui a lancé la minuterie, donc les notifications de B seraient envoyées aux appareils des comptes de A de même numéro. Non corrigé dans l'essai ; c'est la règle de D-03 (« tout travail différé capture le contexte ») : chaque entrée de la file gardera son établissement.
4. **Un jeton de B rejoué sur A est refusé** (401) : la session est cherchée dans la base de A, où elle n'existe pas. D-05 rendra ce refus explicite (`tid` dans le jeton).
5. **Pas de coût mesurable.** Mêmes fichiers de test, même machine : 62 s avec ou sans résolveurs.

## 17.4 Ce qui reste à ME-3a complet

- **Fabrique.** L'essai crée les modèles de B en clonant ceux de A (`tests/integration/helpers/fabriqueEtablissement.js`, outil de test seulement : attributs, options, crochets, méthodes ajoutées, relations). ME-3a complet fait de chaque fichier de modèle une fonction `(sequelize) => sequelize.define(...)`, appelée une fois par établissement ; `definitions.js` devient la fonction qui les crée et les relie.
- **Les 23 fichiers figés** de la règle de lint (point 2 ci-dessus), dont `services/taches/periodiques.js`, qui nomme son verrou d'après la base.
- **Travail hors requête** : tâches périodiques (une boucle sur les établissements, chacune dans `dansEtablissement`), file des notifications (point 3), générations en cours et limiteur en mémoire (clés préfixées par l'établissement, D-03).
- **Mode strict par défaut**, une fois ces points faits ; l'école par défaut ne sert plus que pendant la transition.
- **Registre des établissements** : l'essai les enregistre à la main par nom d'hôte ; la Plateforme (D-04) les fournira.
- **Critère de D-03 complet** : toute la suite et tous les parcours sur deux établissements, plus le test « deux écoles, même numéro de session de génération ».

## 17.5 Ce que contient la branche

| Fichier | Changement |
|---|---|
| `backend/contexte/etablissement.js`, `resolveur.js` | Nouveaux : contexte et résolveurs |
| `backend/tests/integration/helpers/fabriqueEtablissement.js` | Nouveau : clonage des modèles pour la deuxième base de test (jamais importé par le code de production, vérifié par `tests/architecture/importsProduction.test.js`) |
| `backend/middleware/etablissementMiddleware.js` | Nouveau : école choisie par le nom d'hôte |
| `backend/models/index.js` → `definitions.js` ; nouvel `index.js` | Les définitions changent de nom ; `index.js` exporte un résolveur par nom |
| `backend/models/acces.js` | `enTransaction` et `requete` prennent la connexion de l'établissement courant |
| `backend/models/Groupe.js` | Crochets par `instance.sequelize.models` ; plus d'import de modèle |
| `backend/migrations/migrator.js` | `migrateurPour(connexion)` |
| `backend/app.js` | Le middleware d'établissement, après CORS |
| `backend/eslint.config.js` | `contexte/` autorisé ; `models/definitions.js` interdit hors de `models/` ; exception de `Groupe.js` retirée |

En production, avec une seule école et sans mode strict, le comportement ne change pas : la suite complète le vérifie. La branche peut donc être fusionnée, ce qui fait passer dès maintenant tout code nouveau par les résolveurs ; ou rester une référence pour ME-3a. Décision du chef de projet.
