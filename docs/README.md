# Documentation de Planner

Par où commencer, selon ce que vous venez faire. Tout ce qui est listé ici est tenu à jour ; ce qui ne l'est plus est dans [archives/](archives/README.md).

## Pour arriver sur le projet

| Document | Pour |
|---|---|
| [**Le plan, par modules**](plan/README.md) | **La seule référence** pour savoir quoi faire, dans quel ordre, et comment se déroule une session (une fonction, une branche, fusionnée si tout est correct) |
| [Suivi des fonctions](plan/suivi.md) | **À ouvrir en début de session** : l'état de chaque fonction, les numéros de migration réservés |
| [Décisions et questions ouvertes](plan/decisions.md) | Ce qui est décidé, ce qui reste à trancher |
| [README du dépôt](../README.md) | Ce que fait la plateforme, son architecture, l'installation en local, les tests |
| [Comptes rendus de session](sessions/) | L'histoire des sessions ; le dernier est [celui du 29 au 31 octobre](sessions/compte-rendu-2026-10-31-groupe-a.md) |

## Le produit

| Document | Pour |
|---|---|
| [Vision à long terme](ecole/plan.txt) | Planner comme ERP modulaire pour les écoles d'Afrique. C'est une vision, pas un plan : ses choix de pile et de prix ne s'appliquent pas |
| [PRODUCT.md](../PRODUCT.md) | Utilisateurs, usages, principes du produit (à mettre à jour, QUA-01) |
| [DESIGN.md](../DESIGN.md) | Système visuel « panneau à volets » : couleurs, typographie, composants |
| [Étude de marché](etude-marche/README.md) | Concurrents, problèmes des établissements, arguments ; registre des propositions P-01 à P-83 (figé le 7 novembre) |
| [Cahier des charges PACTE](ecole/Descriptif%20du%20projet%20PACTE%20-%203A-IIIA.pdf) | Le sujet d'origine ; aussi le [livrable 2](ecole/Livrable%202%20projet%20pacte.pdf) et les [remarques reçues](ecole/Remarques.pdf) |
| [Emploi du temps officiel](Planning/) | Le rendu HESTIM ; un [exemple de mois](exemple_emploi_du_temp%20-%203A%20IIIA%20%28Du%2030%20Mars%20Au%2026%20Avril%202026%29.pdf) et [ses données](exemple_emploi_du_temps_donnee.yaml) |

## Conception

[conception/](conception/README.md) : **comment** chaque partie est construite. On y trouve :
- l'architecture multi-écoles et les décisions D-01 à D-21 ;
- le moteur de planification et son catalogue ;
- le déploiement et la supervision ;
- le socle neutre ;
- le modèle du scolaire ;
- le contrat des jeux.

## Tester et déployer

| Document | Pour |
|---|---|
| [Scénarios de recette](recette/scenarios-de-test.md) | Les parcours à dérouler à la main avant une mise en production |
| [DEPLOIEMENT.md](../DEPLOIEMENT.md) | Le serveur de production : installation, mise à jour, sauvegardes, supervision, retour arrière |
| [deploy/quiz/](../deploy/quiz/README.md) | Le moteur de quiz (fork de ClassQuiz) sur le serveur |
| [Modèles d'import](modeles/README.md) | Fichiers à remplir pour importer étudiants et enseignants (personnes fictives) |

## Le code, partie par partie

| Document | Pour |
|---|---|
| [mobile/README.md](../mobile/README.md) | L'application mobile : développement, builds, sécurité |
| [FORK.md du moteur de quiz](https://github.com/Claude20022002/ClassQuiz/blob/hestim/FORK.md) | Ce que le fork de ClassQuiz change, et ce que sa licence impose |

## Présentation

[presentation/](presentation/) : diaporamas, discours de 3 minutes, [script de la vidéo](presentation/script-video-motion-design.md), captures et projet vidéo.

## Archives et documents anciens

- [archives/plans/](archives/plans/) : **tous les plans d'octobre et du début de novembre**, remplacés le 7 novembre par le [plan par modules](plan/README.md). Ils restent utiles pour retrouver d'où vient une fonction : la colonne « ancien nom » de chaque module y renvoie.
- [archives/sessions/](archives/sessions/) : anciens comptes rendus et journaux des groupes, arrêtés au 13 octobre.
- Documents qui datent de décembre 2025 et ne suivent plus le code :
  - [api/](api/) ;
  - [architecture/](architecture/README.md) ;
  - [database/](database/) ;
  - [maquettes/](maquettes/) ;
  - [backend/README.md](../backend/README.md), [backend/SEED_README.md](../backend/SEED_README.md) et [frontend/README.md](../frontend/README.md). Pour l'installation, suivre plutôt le [README du dépôt](../README.md).
