# Conceptions et contrats en vigueur

Ce dossier dit **comment** une partie de Planner est construite. Le **quoi** et le **quand** sont dans le [plan par modules](../plan/README.md).

Une conception nouvelle se range ici, dans le dossier de son module, nommée `<identifiant>-<mot>.md`, à partir du [modèle](../plan/modeles/conception.md). **Elle s'écrit et se fait valider par le chef de projet avant toute ligne de code** ([organisation.md](../plan/organisation.md), § 5), avec ses diagrammes en Mermaid. Elle se met à jour quand le code change.

| Dossier | Contenu | Module |
|---|---|---|
| [plateforme/](plateforme/) | [Décisions D-01 à D-21](plateforme/02-decisions.md), [architecture](plateforme/03-architecture.md), [modèle de données](plateforme/04-modele-donnees.md), [essai du contexte d'école](plateforme/17-essai-contexte.md), [audit d'isolation](plateforme/18-audit-isolation.md), [mesure de D-01, PLA-06](plateforme/pla-06-mesure-d01.md) (plan revu, en attente de validation) | PLA |
| [moteur-planification/](moteur-planification/README.md) | Moteur par profil, [catalogue des 498 paramètres](moteur-planification/catalogue/README.md) (pages générées depuis les JSON du serveur), [écarts du solveur](moteur-planification/ecarts-du-solveur.md), [conception de MP-1](moteur-planification/conception-mp1.md) et [sa relecture](moteur-planification/relecture-mp1-contrat.md) | MOT |
| [exploitation/](exploitation/) | [Mise en ligne en une commande (ME-0b)](exploitation/conception-me0b-deploiement.md), [supervision (ME-21)](exploitation/conception-me21-supervision.md) | EXP |
| [interface/](interface/) | [Socle neutre](interface/conception-socle-neutre.md) | UIX |
| [espace-de-cours/](espace-de-cours/) | [Sondage de l'enseignant (EC-9)](espace-de-cours/conception-ec9-sondage.md) | COU |
| [vie-scolaire/](vie-scolaire/) | [Modèle de données du scolaire (C-5)](vie-scolaire/conception-c5-modele-donnees-scolaire.md), plan du document à valider | VSC |
| [jeux/](jeux/) | [Contrat des jeux pédagogiques](jeux/jeux-pedagogiques.md) | QJE |

Les numéros de ces documents (02, 03, 17, 18…) et leurs identifiants (D-, ME-, EC-, MP-) viennent des anciens plans. Ils sont gardés tels quels, pour que les commits et le code qui les citent restent lisibles. La correspondance avec les identifiants des modules est dans la colonne « ancien nom » de chaque module.
