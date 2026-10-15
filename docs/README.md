# Documentation de HESTIM Planner

Par où commencer, selon ce que vous venez faire. Tout ce qui est listé ici est tenu à jour ; ce qui ne l'est plus est dans [archives/](archives/README.md).

## Pour arriver sur le projet

| Document | Pour |
|---|---|
| [README du dépôt](../README.md) | Ce que fait la plateforme, son architecture, l'installation en local, les tests |
| [Dernier compte rendu](sessions/compte-rendu-2026-10-14.md) | L'état du projet, ce qui reste à faire, les décisions attendues. **À lire en début de session** |
| [Règles de travail entre les groupes](sessions/compte-rendu-2026-10-11.md#4-règles-communes-aux-deux-équipes) | Dossiers, branches, ports et bases de test de chaque groupe ; règles de code |
| [Journal du groupe A](sessions/journal-groupe-a.md) · [Journal du groupe B](sessions/journal-groupe-b.md) | Avancement de chaque groupe, demandes à l'autre groupe, questions au chef de projet |

## Le produit

| Document | Pour |
|---|---|
| [PRODUCT.md](../PRODUCT.md) | Utilisateurs, usages, principes du produit |
| [DESIGN.md](../DESIGN.md) | Système visuel « panneau à volets » : couleurs, typographie, composants |
| [Cahier des charges PACTE](ecole/Descriptif%20du%20projet%20PACTE%20-%203A-IIIA.pdf) | Le sujet de l'école ; aussi le [livrable 2](ecole/Livrable%202%20projet%20pacte.pdf) et les [remarques reçues](ecole/Remarques.pdf) |
| [Emploi du temps officiel](Planning/) | Le rendu HESTIM à reproduire ; un [exemple de mois](exemple_emploi_du_temp%20-%203A%20IIIA%20%28Du%2030%20Mars%20Au%2026%20Avril%202026%29.pdf) et [ses données](exemple_emploi_du_temps_donnee.yaml) |

## Les plans

[`assainissement.md`](plans/assainissement.md) fait foi en cas de contradiction. Les plans ne changent que sur demande du chef de projet.

| Plan | Contenu |
|---|---|
| [assainissement.md](plans/assainissement.md) | Constats, fonctions abandonnées ou reportées, lots 0, A, B, D et Q, règles de code (§ 6) |
| [remarques-par-profil.md](plans/remarques-par-profil.md) | Remarques des utilisateurs, lots R, revenu, vidéo |
| [quiz-ia.md](plans/quiz-ia.md) | Quiz générés par l'IA, quiz dans Planner (lots IA et CQ) |
| [espace-enseignant.md](plans/espace-enseignant.md) | Espace de l'enseignant |
| [espace-de-cours.md](plans/espace-de-cours.md) | Espace de cours : supports par classe, appel à quatre statuts, banque de quiz (lots E) |
| [studio-quiz.md](plans/studio-quiz.md) | Studio quiz : moteur de quiz natif (10 types, médias, IA, passation par QR code ou code, analyse des résultats) |

## Tester et déployer

| Document | Pour |
|---|---|
| [Scénarios de recette](recette/scenarios-de-test.md) | Les parcours à dérouler à la main avant une mise en production |
| [DEPLOIEMENT.md](../DEPLOIEMENT.md) | Le serveur de production : mise à jour, changement de dépendances, retour arrière |
| [deploy/quiz/](../deploy/quiz/README.md) | Le moteur de quiz (fork de ClassQuiz) sur le serveur |
| [Modèles d'import](modeles/README.md) | Fichiers à remplir pour importer étudiants et enseignants (personnes fictives) |

## Le code, partie par partie

| Document | Pour |
|---|---|
| [mobile/README.md](../mobile/README.md) | L'application mobile : développement, builds, sécurité |
| [FORK.md du moteur de quiz](https://github.com/Claude20022002/ClassQuiz/blob/hestim/FORK.md) | Ce que le fork de ClassQuiz change, et ce que sa licence impose |

## Présentation

[presentation/](presentation/) : diaporamas, discours de 3 minutes, [script de la vidéo](presentation/script-video-motion-design.md), captures et projet vidéo.

## Documents anciens, à manier avec prudence

Gardés là où d'autres documents les citent, mais anciens : ils ne suivent plus le code. Les guides d'API, l'architecture, la base de données et les README du serveur et du site datent de décembre 2025 (table « Réservation », routes d'avant les migrations).


- [api/](api/) : exemples d'appels, collection Postman, guide de test des routes. À réécrire avec le format d'erreur commun (lot A-5).
- [architecture/](architecture/README.md) et [database/](database/) : diagrammes de composants, de déploiement, MCD et MLD du livrable.
- [maquettes/](maquettes/) : wireframes et maquettes du début du projet.
- [backend/README.md](../backend/README.md), [backend/SEED_README.md](../backend/SEED_README.md) et [frontend/README.md](../frontend/README.md) : pour l'installation, suivre plutôt le [README du dépôt](../README.md).
