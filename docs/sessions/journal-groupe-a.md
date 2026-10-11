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

### R-11, côté serveur : séances à vérifier avant la paie (branche `a/r11-seances-a-verifier`, à la suite d'A-2)

**Fait.**
- **État d'une séance réalisée** (`backend/services/planning/visaSeances.js`) : `appel_valide` (l'enseignant a fermé l'appel), `a_verifier` (pas d'appel validé, pas de décision), `confirmee` ou `ecartee` (décision de l'administration). La décision l'emporte toujours sur l'appel.
- **Table `VisasSeance`** (migration 0039) : une ligne par séance décidée, avec le motif, l'administrateur et la date.
- **Heures du mois** (`GET /api/suivi/enseignants`) : `heures_realisees` ne compte plus les séances écartées ; trois champs s'ajoutent.
- **Export des vacataires** : les séances écartées n'y sont plus ; une colonne `etat` s'ajoute en dernière position.
- **Deux routes nouvelles**, réservées à l'administration (contrat ci-dessous).

**Vérifié.** Suite d'intégration `suivi` : 9 tests sur 9, dont 4 nouveaux (à vérifier dans les heures, la liste et l'export ; appel lancé puis validé ; écarter, confirmer, annuler ; refus). Tests unitaires : 180 sur 180. Suite d'intégration complète : 345 sur 345 (31 fichiers).

**Pas vérifié** : la migration 0039 sur une copie de la base de production.

**Limites à connaître.**
- Une séance à vérifier **part quand même dans l'export**, marquée « à vérifier ». C'est la lettre du lot. La règle « sans visa, rien ne part » (`remarques-par-profil.md`, § 8, étape 3) n'est pas appliquée : question au chef de projet ci-dessous.
- Écarter une séance ne change pas l'avancement des modules : la séance y reste « réalisée ».
- La décision n'est pas inscrite au journal de sécurité ; la table garde qui a décidé et quand.
- `backend/models/index.js`, déjà trop long, a grossi de deux lignes (enregistrement du modèle).

### Demandes au groupe B

- **R-11, côté écran** : la route est prête, sur la branche `a/r11-seances-a-verifier`. À écrire après sa fusion. Contrat :
  - `GET /api/suivi/enseignants?mois=AAAA-MM` : chaque ligne garde `heures_realisees` et gagne `heures_a_verifier` (part de `heures_realisees` sans appel validé ni décision), `heures_ecartees` et `seances_a_verifier` (un nombre).
  - `GET /api/suivi/seances-a-verifier?mois=AAAA-MM` rend `{ mois, note, a_verifier, seances }`. `note` est la phrase à afficher (« un appel validé est un indice, pas une preuve »). Chaque séance : `id_affectation`, `date`, `debut`, `fin`, `heures`, `module`, `groupe`, `salle`, `enseignants` (`id_user`, `nom`, `prenom`, `statut`), `etat` (`a_verifier`, `confirmee` ou `ecartee`), `libelle`, `appel_ouvert` (un appel a été lancé sans être validé), `motif`, `decide_le`. Les séances dont l'appel est validé n'y figurent pas.
  - `PUT /api/suivi/seances/:id/visa`, corps `{ decision, motif? }` : `decision` vaut `"confirmee"`, `"ecartee"` ou `null` (annuler la décision). Rend le nouvel état de la séance. 400 si la décision est inconnue, 404 si la séance n'existe pas, 409 si elle n'est pas réalisée.
  - L'export CSV ne change pas d'adresse.

- **Modèles CSV du site** : `MODELE_CSV` dans `frontend/src/pages/gestion/Etudiants.jsx` et `Enseignants.jsx` cite des noms plausibles avec des adresses `@hestim.ma`. Les remplacer par les personnes fictives de `docs/modeles/` (`@exemple.hestim.test`).
- **Journal de la console** : `frontend/src/utils/fileImport.js` écrit dans la console du navigateur toutes les lignes lues d'un fichier Excel (`console.log("Données parsées depuis Excel:", …)`), donc des noms et des adresses. À retirer.
- **D-2** et notifications « devoir » : demandes lues dans votre journal. D-2 est le lot 8 du groupe A ; la question des notifications est posée au chef de projet ci-dessous.

### Questions au chef de projet

- **R-11, l'export** : une séance « à vérifier » doit-elle partir dans l'export avec sa mention (fait aujourd'hui), ou en être retenue tant que l'administration ne l'a pas confirmée (« sans visa, rien ne part ») ? Le changement tient en une ligne.
- **R-11, l'avancement** : une séance écartée doit-elle aussi sortir des heures réalisées du module ?

- **`POST /api/users/import`** n'est plus appelée par le site. La garder (elle est testée), ou l'inscrire parmi les routes à retirer ?
- **Notifications « devoir » déjà envoyées** (question du groupe B) : les masquer côté serveur avec D-2, ou les laisser ?
- **A-2** : vérifier qu'aucun compte de production n'a de mot de passe de démonstration demande une commande sur le serveur. Le groupe A prépare la commande et la note dans la recette ; le chef de projet la lance.
