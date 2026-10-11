# Journal du groupe A (socle)

Avancement, demandes au groupe B et questions au chef de projet. Une entrée par session, la plus récente en haut.

## 11 octobre 2026

### Point de départ

- **Écart aux règles, à savoir avant de fusionner.** Le compte rendu demande d'attendre 0-1 et 0-2. Au démarrage, le dépôt était privé mais l'historique n'était pas réécrit, aucune PR n'était ouverte et `main` avait 47 commits de retard. Sur demande du chef de projet, le travail a quand même commencé, sur une branche partie de `feature/phase-e-timefold` (`cc0d028`) et non de `main`, comme l'a fait le groupe B.
- Le dossier de travail du groupe A est passé de `feature/phase-e-timefold` à `a/a1-modele-import`.
- Rien n'a été poussé.

### A-1 : modèle d'import (branche `a/a1-modele-import`)

**Fait.**
- `docs/modeles/modele-etudiants.xlsx` et `docs/modeles/modele-enseignants.xlsx` : mêmes colonnes que les modèles CSV proposés par le site, deux personnes fictives chacun, adresses en `@exemple.hestim.test`, aucune colonne de mot de passe.
- `docs/modeles/README.md` : où importer chaque fichier, colonnes obligatoires, pièges (groupe inconnu, statut).
- `.gitignore` : `*.xlsx` et `*.xls` écartés, sauf `docs/modeles/*.xlsx`.

**Reste à faire, par le chef de projet.** La suppression de `docs/users.xlsx` a été bloquée par le garde-fou de la session. Le fichier est toujours versionné. Sur la branche `a/a1-modele-import` : `git rm docs/users.xlsx`, puis commit. Sans cela, le résultat attendu du lot (« aucun vrai nom n'est versionné ») n'est pas atteint. L'historique reste à réécrire (lot 0-1).

**Vérifié.** Les deux modèles relus avec les options de lecture du site (`frontend/src/utils/fileImport.js`) : une feuille, deux lignes, colonnes identiques aux modèles CSV, toutes les adresses dans le domaine fictif.

**Pas vérifié** : un import réel des deux fichiers depuis le site, serveur lancé.

**Choix à connaître.** `docs/users.xlsx` avait les colonnes `nom, prenom, email, role, telephone, password`, celles de `POST /api/users/import`. Aucune page du site n'appelle plus cette route : les modèles suivent donc les deux imports que l'administration utilise vraiment (Étudiants, Enseignants).

### A-2 : mots de passe de démonstration (branche `a/a2-mots-de-passe-demo`, à la suite d'A-1)

**Fait.**
- `deploy/vps/verifier-mots-de-passe-demo.mjs` : essaie `password123` (seed) et `Hestim@2026` (tests) sur chaque compte, plus ceux donnés dans `MOTS_DE_PASSE`. Lecture seule. Il liste les comptes concernés et sort avec le code 1 s'il y en a.
- Recette, section 0 : une case pour ce contrôle, avec la date du dernier passage à noter.
- `DEPLOIEMENT.md` : la liste de contrôle ne demande plus de se connecter avec `admin@hestim.ma` / `password123`.

**Vérifié**, sur une base jetable (`hestim_a2_test`, supprimée ensuite) : base saine, « OK » et code 0 ; un compte en `password123`, listé et code 1 ; un mot de passe donné par `MOTS_DE_PASSE`, listé aussi. Une empreinte illisible ne fait pas échouer le script.

**Reste à faire, par le chef de projet** : lancer le script sur le serveur de production et noter le résultat dans la recette. Tant que ce n'est pas fait, le lot n'est pas fini. Si d'anciens mots de passe de démonstration ont circulé (captures, messages), les passer dans `MOTS_DE_PASSE`.

**À savoir pour la fusion** : le script a été commité sur `a/a1-modele-import` (`3fb4d50`) avant la création de la branche d'A-2. La branche d'A-1 contient donc un fichier d'A-2 ; fusionner A-1 puis A-2, dans cet ordre.

**Hors du groupe A** : les identifiants de test lus dans des variables d'environnement vivent dans `frontend/` (groupe B, avec B-8).

### Demandes au groupe B

- **Modèles CSV du site** : `MODELE_CSV` dans `frontend/src/pages/gestion/Etudiants.jsx` et `Enseignants.jsx` cite des noms plausibles avec des adresses `@hestim.ma`. Les remplacer par les personnes fictives de `docs/modeles/` (`@exemple.hestim.test`).
- **Journal de la console** : `frontend/src/utils/fileImport.js` écrit dans la console du navigateur toutes les lignes lues d'un fichier Excel (`console.log("Données parsées depuis Excel:", …)`), donc des noms et des adresses. À retirer.
- **D-2** et notifications « devoir » : demandes lues dans votre journal. D-2 est le lot 8 du groupe A ; la question des notifications est posée au chef de projet ci-dessous.

### Questions au chef de projet

- **`POST /api/users/import`** n'est plus appelée par le site. La garder (elle est testée), ou l'inscrire parmi les routes à retirer ?
- **Notifications « devoir » déjà envoyées** (question du groupe B) : les masquer côté serveur avec D-2, ou les laisser ?
- **A-2** : vérifier qu'aucun compte de production n'a de mot de passe de démonstration demande une commande sur le serveur. Le groupe A prépare la commande et la note dans la recette ; le chef de projet la lance.
