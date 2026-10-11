# Journal du groupe B (interface)

Avancement, demandes au groupe A et questions au chef de projet. Une entrée par session, la plus récente en haut.

## 11 octobre 2026, au soir

### Point de départ

- Dépôt privé (dit par le chef de projet). La soutenance n'est plus un repère : les lots suivent l'ordre du compte rendu, § 5.
- 0-1 (historique) et 0-2 (fusion dans `main`) ne sont toujours pas faits. Comme pour D-1, le travail part de `feature/phase-e-timefold` (`cc0d028`), dans `../planner-b`. Rien n'a été poussé.

### B-1 : code mort du site (branche `b/b1-code-mort`)

**Fait.**
- Supprimés : `hooks/api/`, `services/domains/`, `services/queries/`, `services/apiClient.js`, `services/queryClient.js`, `services/index.js`.
- Les trois fichiers isolés, trouvés en suivant les imports depuis `main.jsx` : `components/emploi-du-temps/OptimizedCalendar.jsx`, `design-system/components/MetricCard.jsx`, `hooks/useMemoized.js`.
- Dépendance `@tanstack/react-query` retirée, avec son chunk et son pré-bundling dans `vite.config.js` et l'exception du lint pour `MIGRATION_EXAMPLE.jsx`.
- `services/api.js` est la seule couche d'accès au serveur.

**Vérifié.** Aucun import restant vers ces fichiers ; lint : 0 erreur, les 7 avertissements connus ; build réussi.

**Pas vérifié** : les tests Playwright (ils demandent un serveur lancé ; B-8).

**Laissé** : `design-system/board/index.js`, un fichier d'index que personne n'importe (les écrans importent les composants un par un). Hors de la liste du plan ; à retirer si le chef de projet le souhaite.

**Fusion.** Cette branche reprend le commit du journal de `b/d1-masquer-devoirs` : fusionner D-1 d'abord, puis B-1. Les deux lots ne touchent pas les mêmes fichiers de code.

## 11 octobre 2026

### Point de départ

- **Écart aux règles, à savoir avant de fusionner.** Le compte rendu demande d'attendre 0-1 (dépôt privé) et 0-2 (fusion dans `main`). Au démarrage, le dépôt était encore public, aucune PR n'était ouverte et `main` avait 46 commits de retard. Sur demande du chef de projet, le travail a quand même commencé, dans le dossier `../planner-b`, sur une branche partie de `feature/phase-e-timefold` (`cb7047a`) et non de `main` : partir de `main` aurait perdu « Mes classes » et le quiz par l'IA. Une fois 0-2 fusionné, la branche se fusionne dans `main` sans reprise.
- Rien n'a été poussé.

### D-1 : devoirs masqués (branche `b/d1-masquer-devoirs`)

**Fait.**
- **Interrupteur** : `shared/fonctions.js`, `DEVOIRS_ACTIFS = false`, lu par le site et par l'application.
- **Textes** : ceux qui citent les devoirs ont une variante `_sansDevoirs`, choisie par le contexte i18next (`CONTEXTE_DEVOIRS`). Interrupteur rallumé, les textes d'origine reviennent.
- **Site** :
  - page Activités : plus de panneau « Devoirs » ; le panneau « Quiz par l'IA » reste pour l'enseignant (`ZoneQuizEtDevoirs.jsx`) ;
  - sous-titres et historique : les devoirs déjà donnés n'apparaissent plus ;
  - « Mes classes » : plus de bouton « Donner un quiz en devoir » ;
  - quiz par l'IA : plus de « Le donner en devoir » ;
  - `/jeux/devoirs/:id` renvoie vers `/jeux` (anciens liens de notification) ;
  - fiches d'aide : `profDevoir` est masquée ; `etuDevoirs` devient « Rejoindre un quiz » ; `profQuizIa` ne parle plus de devoir.
- **Application** : l'onglet Activités ne liste plus les devoirs ; l'écran `/devoir/[id]` renvoie vers l'onglet Activités. L'onglet lui-même reste en place : son retrait de la barre du bas est une idée pour après la soutenance (`remarques-par-profil.md`, § 10).
- **Aucun fichier supprimé** ; `App.jsx` et `Jeux.jsx`, déjà trop longs, n'ont pas grossi.

**Vérifié.**
- Lint du site : 0 erreur, les 7 avertissements connus.
- Build du site : réussi.
- `npx expo lint` : 0 erreur, 3 avertissements anciens dans `mobile/src/i18n.js`.
- Tests de l'application : 32 sur 32.
- Résolution des variantes `_sansDevoirs` par i18next, y compris le repli sur le texte d'origine quand une clé n'a pas de variante.

**Pas vérifié** : un vrai navigateur ou un téléphone avec un serveur lancé. Ce sera couvert par B-8.

### Demandes au groupe A

- **D-2** : le serveur renvoie encore les devoirs (`/api/devoirs`, activités de l'étudiant, historique de l'enseignant). Le site et l'application les filtrent déjà ; D-2 peut se faire quand vous voulez.
- **Notifications** : les notifications « devoir » déjà envoyées restent dans la liste de l'étudiant. Leur lien ramène aux activités. Faut-il les masquer côté serveur avec D-2 ?

### Questions au chef de projet

- Valider la lecture de D-1 sur un point : « onglet Jeux de l'application » est compris comme les devoirs **dans** l'onglet, pas le retrait de l'onglet.
- Les questions du compte rendu (§ 6) restent ouvertes, en particulier le parcours qui remplace « quiz donné en devoir » dans B-8.
