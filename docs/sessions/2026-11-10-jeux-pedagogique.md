# Session du 2026-11-10 · QJE-04 · `jeux-pedagogique` — consignes pour Alexis et son agent

| | |
|---|---|
| Préparé par | Claude Code (Opus 5.5), pour le chef de projet (Claude20022002) |
| Pour | Alexis (`Destroya2`) et l'agent d'IA qui travaille avec lui |
| Chantier | QJE, ouvert par exception le 10 novembre, pour QJE-04 seule |
| Branche | `jeux-pedagogique` (`main` fusionné le 10 novembre : la branche est à jour) |

**Agent : lis cette fiche en entier avant d'écrire une ligne de code.** Lis aussi [AGENTS.md](../../AGENTS.md) : ses règles sont obligatoires.

## Où en est la branche

La relecture du 10 novembre (contrat des jeux, [§ 6](../conception/jeux/jeux-pedagogiques.md)) conclut :
- la branche est **sûre** : le serveur calcule les points, l'accès au module est revérifié, les moteurs sont bornés, les contournements sont testés ;
- elle n'est **pas fusionnable en l'état** : il y a deux points bloquants et une règle nouvelle à appliquer.

Depuis cette fiche, `main` est fusionné dans la branche : elle contient le plan par modules (`docs/plan/`), `AGENTS.md` et le contrat amendé.

## À faire, dans l'ordre

| # | Quoi | Où | Contrôle |
|---|---|---|---|
| B-1 | **Aucun nom d'école** (contrat, § 1, amendé le 10 nov.) : retirer les adresses `hestim.ma` et la mention « publiés par HESTIM ». `curriculum` ne garde que la discipline et le niveau | `shared/simulations/catalogue/_aide.js`, `shared/simulations/i18n.js`, les entrées du catalogue | `node scripts/verifier-neutre.mjs` passe |
| B-2 | Réponse de référence du **Labo Big-O** dans le test mobile | `mobile/__tests__/simulations.test.js` (`premier`, entrée `big-o-01`) | `npx jest` dans `mobile/` : 73 sur 73 |
| I-1 | **Ne pas donner la réponse après un échec** (contrat, **§ 1.0**). Voir ci-dessous | `shared/simulations/moteurs/*.js`, `backend/services/jeux/`, écrans web et mobile | les tests de I-1 |
| m | Si possible : commentaires et noms de tests en français ; remettre le commentaire de `mobile/babel.config.js` ; retirer la condition inutile de `mobile/jest.resolver.js` ; ne pas faire grossir `frontend/src/pages/jeux/Jeux.jsx` (déjà plus de 300 lignes) | — | relecture |

### I-1 en détail (contrat, § 1.0)

1. **Après un échec**, le serveur dit seulement quels éléments sont faux (`correct: false`, code du problème). Il ne renvoie **ni `attendu`, ni la bonne position, ni le bon classement**.
2. **« Voir la solution »** : disponible sur demande, et proposé d'office après **trois échecs** du même défi.
3. **La solution vue coûte les points** : une réussite après la solution est enregistrée **sans points**, et le suivi de l'enseignant l'affiche comme « réussi avec la solution ».
4. **Le serveur note la solution vue** avant de la renvoyer ; il ne croit jamais le client. La migration **0080** est réservée pour cela (`docs/plan/suivi.md`). Attention : `JeuProgressions.reussi_le` est obligatoire, une ligne de progression ne peut donc pas noter une solution vue avant la réussite. Il faut une petite table, ou un autre choix justifié dans le plan.
5. **Tests** :
   - aucun `attendu` dans un échec, un test par moteur ;
   - solution vue puis réussite : 0 point ;
   - solution d'un jeu hors module : 403 ;
   - sans compte : 401.

## Règles de travail (AGENTS.md)

- **Plan avant le code.** Pour I-1, écris un plan de conception à partir de [docs/plan/modeles/conception.md](../plan/modeles/conception.md), dans `docs/conception/jeux/qje-04-solution.md`. Fais-le valider par le chef de projet. Pour B-1 et B-2, un plan court suffit (dans ta fiche de session).
- **Questions avant toute supposition**, numérotées, chacune avec ta proposition. Par exemple : la forme exacte de la réponse de « Voir la solution », ou le texte affiché à l'enseignant.
- **Une PR** de `jeux-pedagogique` vers `main`. Elle dit les jeux, leurs modes et les fichiers communs touchés. Elle n'est ouverte que quand tout passe en local :
  - tests du serveur (`npm test` dans `backend/`) ;
  - tests de l'application (`npx jest` dans `mobile/`) ;
  - tests du site (`npm run test:unit` dans `frontend/`) ;
  - lint ;
  - contrôle de neutralité.
- **Fin de session obligatoire** : mettre à jour la ligne QJE-04 de [docs/plan/suivi.md](../plan/suivi.md), et écrire une fiche dans `docs/sessions/` (modèle : [docs/plan/modeles/fiche-de-session.md](../plan/modeles/fiche-de-session.md)) avec son prompt de reprise.
- **Seul le chef de projet fusionne** dans `main`.

## Prompt de reprise (pour l'agent d'Alexis)

```text
Tu travailles sur QJE-04 de Planner : la fusion de la branche jeux-pedagogique (jeux pédagogiques d'Alexis).
Lis d'abord AGENTS.md, docs/plan/README.md, docs/plan/suivi.md, le contrat des jeux
docs/conception/jeux/jeux-pedagogiques.md (§ 1, § 1.0 et § 6) et cette fiche
(docs/sessions/2026-11-10-jeux-pedagogique.md).
À faire, dans l'ordre : B-1 (aucun nom d'école dans shared/simulations, verifier-neutre doit passer),
B-2 (réponse de référence big-o-01 dans mobile/__tests__/simulations.test.js),
puis I-1 (ne plus renvoyer la réponse attendue après un échec ; « Voir la solution » qui coûte les points,
noté par le serveur, migration 0080 réservée).
Pour I-1 : pose tes questions, écris le plan dans docs/conception/jeux/qje-04-solution.md et fais-le
valider avant de coder. Un test par correctif. Tous les tests et le contrôle de neutralité verts avant la PR.
Fin de session : suivi.md (ligne QJE-04) et une fiche dans docs/sessions/ avec son prompt de reprise.
```
