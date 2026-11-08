# 1. État des lieux au 5 novembre 2026

Relevé par le groupe B sur `main` (86a4ccf) et sur toutes les branches du dépôt. Les chiffres viennent des commandes `git`, `gh` et d'une lecture du code, pas de la documentation.

## 1.1 Ce que contient Planner

| Partie | Taille | Contenu |
| --- | --- | --- |
| Serveur (`backend/`) | environ 34 900 lignes, 47 fichiers de routes, 74 modèles, 58 migrations | Express, Sequelize, MySQL 8.4 |
| Site (`frontend/`) | environ 42 200 lignes, 23 pages de gestion | React 19, MUI 7, français et anglais |
| Application (`mobile/`) | environ 8 400 lignes, 24 écrans | Expo 54 |
| Solveur (`solver/`) | environ 2 000 lignes | Timefold, Java 21 |
| Tests | 55 suites d'intégration, 16 unitaires côté serveur, 24 parcours Playwright, 16 côté application | intégration continue sur chaque PR |

Planner est un produit **réel et en service** chez une école. Mais il est construit pour l'**enseignement supérieur** : son référentiel (`backend/config/referentiel.js`) ne connaît que les cycles prépa, licence, ingénieur, master et executive, les composantes CM, TD, TP et projet, et les groupes promotion, TD et TP.

## 1.2 Couverture du catalogue de `plan.txt`

`docs/ecole/plan.txt` (§ 8) propose huit familles de modules. Le tableau dit, pour chacune, ce que Planner a déjà.

**Légende** : **oui** = utilisable aujourd'hui ; **partiel** = existe, mais incomplet ou propre au supérieur ; **non** = absent.

| Famille | Module de `plan.txt` | Dans Planner | Où |
| --- | --- | --- | --- |
| Administration | Socle (comptes, rôles, sécurité, API) | **oui** | comptes, invitations, double authentification, journal de sécurité, connexion unique OIDC, désactivation (ME-17), années (ME-18) |
| | Élèves et inscriptions | partiel | élèves, import ; pas de dossier complet ni de responsables légaux |
| | Admissions | non | |
| | Documents et attestations | non | la bibliothèque (StudyLib) gère les supports de cours, pas les attestations |
| | Classes et groupes | partiel | filières et groupes emboîtés du supérieur |
| Pédagogie | Présences | **oui** | appel par QR code, signalements, rappels |
| | Notes et bulletins | **non** | aucune table de notes ; seuls les quiz ont des résultats |
| | Examens | partiel | planification des examens et surveillances ; pas de jury ni de délibération |
| | Compétences, progression | partiel | suivi du réalisé ; pas de compétences |
| Planification | Emploi du temps | **oui** | génération Timefold, versions, publication, reports, imprévus, variante Ramadan (`services/planning/ramadan.js`) |
| | Salles, réservations | **oui** | |
| | Remplacements | partiel | imprévus et absences ; pas de proposition de remplaçant |
| Finance | Frais, paiements, comptabilité, paie | **non** | seul l'export des heures des vacataires existe |
| RH | Enseignants, services, charges | **oui** | permanents, vacataires, disponibilités, vœux, services |
| | Congés, recrutement, évaluation | non | indisponibilités seulement |
| Communication | Portails élève et enseignant | **oui** | site et application |
| | Portail parents | **non** | |
| | Annonces, notifications | **oui** | annonces par classe, notifications push et courriel |
| | Messagerie, SMS, WhatsApp | non | messagerie prévue (EC-10) |
| Logistique | Bibliothèque | **oui** | StudyLib, dépôt voisin |
| | Transport, cantine, internat, infirmerie, stocks | non | |
| Numérique | Espace de cours, devoirs, quiz, IA | **oui** | espace de cours, Studio quiz, quiz en direct, quiz générés par IA, jeux |
| | Statistiques | **oui** | occupation des salles, heures |
| | Plusieurs campus | **oui** | campus, temps de trajet |

Exigences transverses de `plan.txt` :

| Exigence | État |
| --- | --- |
| Plusieurs écoles sur une même installation | **non**. Une base par école (D-01). L'essai de ME-3a a réussi (#142, ouverte), mais l'audit d'isolation laisse 15 canaux à fermer, dont 4 critiques |
| Registre des modules, abonnements | partiel : des interrupteurs par école existent (`services/etablissement/fonctionnalites.js`, ClassQuiz, annonces, sondages) ; pas de registre ni de facturation |
| Réglages par pays, devises | non ; fériés et calendrier marocains seulement |
| Arabe, écriture de droite à gauche | non |
| Hors ligne | non |
| Paiements (mobile money, carte) | non |
| Massar | non |

**Bilan** : Planner couvre bien la **planification**, la **vie de la séance** et le **numérique pédagogique**. Il lui manque tout ce qu'une école privée achète en premier : notes et bulletins, frais, parents, arabe, Massar. Il lui manque aussi le vocabulaire du scolaire.

## 1.3 Les branches

Au 5 novembre, 30 branches ont des commits hors de `main`. Les branches dont tout le contenu est déjà dans `main` ne sont pas listées.

### À fusionner

| Branche | PR | Contenu | Remarque |
| --- | --- | --- | --- |
| `b/ec9-sondage` | #148 ouverte | EC-9, sondage de l'enseignant (migration 0059) | conflit avec #141 résolu (f93179a) ; chaîne de fusion en cours |
| `a/lint-acces-base` | #137 | règle de lint R-2 | groupe A |
| `a/essai-restauration-2026-10-29` | #138 | essai de restauration | groupe A, documentation |
| `a/essai-me3a` | #142 | essai du contexte d'établissement, audit d'isolation | **à fusionner avant le lot « plusieurs écoles »** |
| `a/me0b-deploiement` | #145 | déploiement en une commande | groupe A |
| `a/me21-supervision` | aucune | supervision | groupe A, non poussée |
| `a/benchmark-modules` | aucune | modèle économique par modules et benchmark (3 nov.) | groupe A, **non poussée** ; base du plan d'offre |
| `a/moteur-catalogue` (et `a/mp1-valeurs`, même commit) | aucune | catalogue de 498 paramètres du moteur, dépendances, **profils primaire, collège, lycée, formation, université** | groupe A, **non poussée** ; base du vocabulaire du scolaire |
| comptes rendus du groupe A (20, 22, 26, 29 et 31 oct.) | #92, #129 pour deux d'entre eux | journaux de session | documentation |

### À trancher (contenu absent de `main`)

| Branche | Date | Contenu | Proposition |
| --- | --- | --- | --- |
| `b/offres-stage` | 15 oct. | application : onglet « Offres » et partage d'une offre | à relire : le lot F (avis de stage) n'est pas dans le plan actuel |
| `b/corrections-tests-locaux` (#40) | 15 oct. | écran Stages, éditeur de quiz | même question ; PR en conflit depuis octobre |
| `b/v4-application` | 13 oct. | V-1 à V-4, thème clair de l'application | dépassée par le socle neutre (SN-1) : à fermer après relecture |
| `jeux-pedagogique` | 16 oct. | jeux d'Alexis | contrat séparé (`jeux-pedagogiques.md`) |
| `video/promo` (#53) | 18 oct. | vidéo publicitaire | utile au marketing ; à fusionner ou archiver |
| `a/plans-modes-classquiz` (#91), `a/plan-demo-et-activites` | oct. | plans du groupe A | groupe A |
| `feature/phase-e-timefold-dev` | 5 oct. | anciens messages hors ligne du terminal | à fermer |
| `b/m7-alerte-semaine` | 21 oct. | doublon écarté de M-7 | à supprimer |
| `b/retirer-cache-impeccable` | 21 oct. | abandon décidé le 21 oct. | à supprimer |
| `integration/2026-10-21`, `b/m12-jeu-non-propose`, `a/sc1a-quiz-direct`, `b/r2-surveillances`, `b/r8-quiz-etudiant`, `b/textes-enseignant` | oct. | contenu déjà dans `main` | à supprimer |

Il reste aussi environ 80 dossiers de travail dans `travaux-planner/` et `planner-*`, dont beaucoup pour des branches fusionnées. Leur nettoyage demande de retirer d'abord les jonctions `node_modules`.

## 1.4 Le plan 15 face à la réalité

Le plan de développement (fichier 15) a été validé le 26 octobre. `plan.txt` le remplace depuis le 4 novembre, mais ses vagues V0 et V1 décrivent ce qui a été fait.

| Vague | Lot | État |
| --- | --- | --- |
| V0 | ME-17, ME-18 écrans | fusionnés (#126, #135, #136, #140) |
| V0 | ME-11 essai sur un vrai téléphone | **non fait** |
| V1 | ME-0d, ME-1, EC-1, EC-5, EC-11, ME-0c (serveur et écrans) | fusionnés |
| V1 | EC-9 | #148, en cours de fusion |
| V1 | ME-10 conception de l'assistant | **non fait** ; le socle neutre en pose le cadre |
| V1 (A) | ME-0e MySQL 8.4 | fusionné |
| V1 (A) | ME-0b, essai ME-3a, lint, ME-21 | PR ouvertes ou branche non poussée |
| V1 (A) | ME-14a mesure du solveur sur 20 000 étudiants | **non fait** |
