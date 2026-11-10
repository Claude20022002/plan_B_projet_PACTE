# Planner : consignes pour Claude Code

Les règles de l'équipe s'appliquent à toute session de Claude Code, et à chacun de ses sous-agents :

@AGENTS.md

## En plus, pour Claude Code

- **Sous-agents** : un sous-agent reçoit dans sa consigne la fonction, la branche, le dossier de travail et le plan validé. Il ne pousse pas, ne fusionne pas et ne modifie pas `docs/plan/suivi.md`. C'est la session principale qui tient les fichiers d'état et écrit la fiche de session.
- **Questions** : utiliser l'outil de questions quand il est disponible ; sinon, les écrire numérotées dans le message, chacune avec sa proposition.
- **Rien publié en ligne** (artefacts claude.ai, Claude Docs) sans demande du chef : les livrables sont des fichiers du dépôt.
- **`/compact`** : seul le chef le lance. L'agent le propose (AGENTS.md, point 13), après avoir écrit la fiche de session.
