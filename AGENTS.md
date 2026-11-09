# Règles pour tout agent qui travaille sur Planner

Ces règles sont **obligatoires** pour tout agent d'IA (Claude Code, Codex, autre) et pour toute personne de l'équipe. Leur détail et leurs raisons : [docs/plan/organisation.md](docs/plan/organisation.md).

## Qui décide

Le chef de projet est le compte GitHub **Claude20022002**, initiateur et maître du projet. **Lui seul** pousse, fusionne, lance les commandes du serveur, ouvre ou ferme un chantier, valide un plan et tranche une décision. L'agent propose, conçoit, code sur sa branche et commite **en local**. Il ne fait jamais `git push`.

## Au début de chaque session

1. Lire [docs/plan/README.md](docs/plan/README.md), puis [docs/plan/suivi.md](docs/plan/suivi.md) (fonctions, états, **chantiers ouverts**).
2. Lire les branches et PR ouvertes (`gh pr list`, `git branch -r`), et la dernière fiche de session de la fonction dans `docs/sessions/`.
3. Si le chef n'a pas dit quelle fonction faire, **le demander**. Ne prendre qu'une fonction d'un **chantier ouvert** (au plus 3 chantiers ouverts ; un chantier commencé se termine avant d'en ouvrir un autre à sa place).

## Avant d'écrire une ligne de code

4. **Une tâche, une branche** : `feat/`, `fix/`, `etude/`, `refactor/`, `test/`, `doc/`, `chore/` ou `mkt/`, puis `<identifiant>-<mot>` (`feat/pla-05-creer-ecole`). Un dossier de travail à part : `..\travaux-planner\<nom>`.
5. **Poser le maximum de questions** sur tout ce que le code, le plan et `docs/plan/decisions.md` n'établissent pas. Questions numérotées, chacune avec une proposition de réponse. **Ne jamais supposer** un chiffre, un nom, un comportement ou un choix de produit.
6. **Écrire un plan de conception** s'il n'en existe pas ([modèle](docs/plan/modeles/conception.md), dans `docs/conception/<module>/`) ; pour un correctif, un plan court suffit. Le faire **valider par le chef**, puis le commiter seul. **Aucun code avant ce « validé ».**

## Pendant la session

7. Suivre le plan. Si le code le contredit : s'arrêter, corriger le plan, le refaire valider.
8. Règles de code : fichiers courts (300 lignes, 200 pour un contrôleur), commentaire de rôle en tête, noms en français, un test de régression par correctif, `git add <fichiers>` (jamais `git add .`), rien de réel dans le dépôt (il est public). Le reste : [docs/plan/README.md](docs/plan/README.md), § 4 et § 5.

## À la fin de chaque session : obligatoire

9. Commiter le travail.
10. Mettre à jour **[docs/plan/suivi.md](docs/plan/suivi.md)** (état de la fonction, chantiers) et le fichier du module si ce qui existe a changé.
11. Écrire la **fiche de session** `docs/sessions/AAAA-MM-JJ-<branche>.md` ([modèle](docs/plan/modeles/fiche-de-session.md)) avec son **prompt de reprise**, et la commiter.
12. Donner au chef les **commandes à lancer** (push, PR) et le **prompt de reprise**.

## Session trop longue

13. Dès que la conversation a été résumée une fois, ou qu'une autre fonction commencerait, ou qu'un fait établi se perd : finir l'étape, appliquer les points 9 à 12, puis proposer `/compact` (même fonction, une fois) ou une **nouvelle session** ouverte avec le prompt de reprise.
