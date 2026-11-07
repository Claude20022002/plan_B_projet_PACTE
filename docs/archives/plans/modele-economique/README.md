# Modèle économique par modules

Statut : **étude du groupe A. La vente est mise de côté** (décision du 5 novembre 2026) : la priorité est d'optimiser le produit. Le plan à suivre est `docs/archives/plans/plan-produit/04-plan-fusionne.md`. Cette étude reste la référence pour le marché, les prix et les coûts, quand la vente reprendra. Les prix sont des **hypothèses** : aucune école extérieure n'a encore réagi à un prix.

| Lire | Pour |
|---|---|
| [benchmark.md](benchmark.md) | les concurrents, les prix, le marché, Massar, le droit, les coûts, avec leurs sources |
| [verifications-et-consequences.md](verifications-et-consequences.md) | ce que valent les documents de ChatGPT, l'analyse détaillée de l'offre, les 28 questions ouvertes |
| [feuille-de-route.md](feuille-de-route.md) | ancien ordre des vagues, remplacé par le plan fusionné ; gardé pour l'historique |
| `docs/ecole/benchmarkChatGPT.txt`, `plan.txt` | les deux documents d'étude, corrigés |

## 1. Décisions des 4 et 5 novembre 2026

| Sujet | Décision |
|---|---|
| Ordre des cibles | **Écoles privées d'abord, de la maternelle au lycée, puis formation professionnelle.** La vente est mise de côté. La planification seule pourra se vendre plus tard |
| Plusieurs écoles sur une installation | **Première priorité** (vague V2 du plan fusionné) |
| Pile technique | **Rien ne change tant que l'étude du groupe A n'a pas conclu** ; sa recommandation est au § 8 |
| Socle | **Inclus dans tout abonnement** : comptes, droits, établissement, élèves, classes, enseignants, matières, salles. Pas de Core payant |
| École pilote | **Pas choisie.** Les entretiens et la démonstration aux directeurs viennent plus tard |

## 2. L'essentiel

1. **Le principe tient** : des modules, des paliers d'effectif, des packs. Scoliance vend déjà des modules à la carte dès 70 DH.
2. **« Le moteur que les autres n'ont pas » n'est plus défendable** : Acadelta, SchoolApp, Minassa, Tayssir et Caisso annoncent une génération automatique, Caisso dans un ERP à 242 DH par mois. **Aucun n'a été testé**, et aucune page lue ne vend de CM, TD, TP ou de volumes semestriels. Il faut donc montrer, pas affirmer.
3. **Le marché est encombré et peu prouvé** : au moins 20 éditeurs lisibles au Maroc, 12 avec un prix public, une offre gratuite (Tayssir), des preuves de clientèle faibles, aucun avis indépendant trouvé.
4. **Le support décide de la marge, pas le serveur.** Sur un scénario d'hypothèses, la première grille passait sous son coût à 800 et 2 000 élèves (§ 5).
5. **Deux échéances techniques pèsent sur la première vente** : la fin de Timefold 1.x, annoncée début 2027, et la compatibilité d'OR-Tools avec notre image Alpine (§ 8).

## 3. Ce qu'Odoo fait vraiment

Ce n'est pas un modèle à la carte : **une application gratuite à vie, puis toutes les applications, à un prix par utilisateur** ; la mise en place se vend à part, de 190 à 8 000 $ vue du Maroc. Odoo a abandonné le cumul d'un prix par utilisateur et d'un prix par application en **octobre 2022**, en disant qu'il perdait ainsi les clients de 1 à 5 utilisateurs. C'est le plaidoyer d'un éditeur, sans chiffre de résultat, et il condamne le cumul des deux prix plutôt que le module en soi.

**Ce qu'on en garde** : l'adoption progressive sur une seule base ; une entrée sans décision d'achat ; le prix public. **Ce qu'on n'en garde pas** : le prix par utilisateur, car presque toutes les offres marocaines lues facturent à l'effectif ou au forfait.

**Aucune étude publique solide** ne compare les modules et le tout compris sur le churn ou le revenu. Ce choix reste un pari à mesurer.

## 4. Quoi vendre, et dans quel ordre

*Analyse du 4 novembre : l'ordre ci-dessous ne s'applique plus (§ 1). Elle reste utile quand la vente reprendra.*

| Étape | Vendu | Cible | Reste à construire |
|---|---|---|---|
| **1. Planification seule** | Génération, salles, reports, remplacements, publication et notifications | les écoles privées d'abord, qui gardent leur outil ou travaillent sur Excel ; sur instance dédiée jusqu'à la vague I | moteur (MP-1 à MP-7), import par fichiers (ME-9), profil scolaire, arabe des vues publiées à évaluer, MO-1 et MO-2 |
| **2. Supérieur privé** | Étape 1, plus présences, examens, cours, quiz, IA | 213 établissements et 91 082 étudiants (2024-2025, extraits) | Plateforme partagée ou instance dédiée (D-01), contrats |
| **3. École complète** | Notes, bulletins, frais, parents, arabe, fichiers Massar | environ 1,25 million d'élèves du privé | tout cela : **environ 19 jours bruts, soit 29 à 38 jours-personne**, estimation grossière ; à lancer si les entretiens le confirment |

### Le produit avant la phase pilote

L'école pilote n'étant pas choisie, **les preuves ne peuvent pas dépendre d'elle**. Le produit est prêt pour un pilote quand :

1. une école peut, sans nous, importer ses données, générer, corriger et publier ;
2. un **jeu de démonstration public** est généré, avec des temps mesurés. Il contient ce que les pages marocaines laissent dans l'ombre : vacataires, salles spécialisées, double vacation matin et après-midi, surplus horaire du privé. Il sert aussi à vérifier les concurrents ;
3. un **essai** existe à la manière d'aSc : génération gratuite, export bloqué et filigrane, nombre de calculs plafonné ;
4. le contrat de sous-traitance et la liste des sous-traitants et de leurs pays sont prêts (§ 9).

L'existant reste un atout : les données et la production de l'école d'origine servent à mesurer et à ne pas régresser.

## 5. Grille à tester

**Hypothèses, en DH HT par mois, socle inclus. À faire réagir en entretien, pas à publier.**

| Effectif | Planification | Coût estimé, usage réduit | Repères (périmètres différents) |
|---|---:|---:|---|
| Jusqu'à 150 | **149** | 43 | Caisso 108 puis 242 ; Eduzaas 233 ; EduSchoolConnect 299 ; Mon Ecole PRO 300 |
| 151 à 300 | **199** | 86 | Caisso 108 puis 242 ; Eduzaas 233 ; EduSchoolConnect 449 ; Mon Ecole PRO 450 ; Qalam 499 |
| 301 à 800 | **449** (au lieu de 299) | 217 | Caisso 242 ; Qalam 999 ; Scoliance 1 000-1 500 ; Acadelta 2 000 |
| 801 à 2 000 | **899** (au lieu de 599) | 449 | Caisso 242 ; SchoolMA 800 ; Qalam 999 ; Eduzaas 1 624 |
| Plus de 2 000 | devis | | |

Le coût est celui du scénario de `benchmark.md` au **haut de palier** : plateforme remplie à 8 000 comptes, peu de support, hors IA et hors SMS. **Ce sont des hypothèses, jamais des mesures.** Dans le scénario complet, le coût atteint encore 71 et 78 % du prix sur les deux derniers paliers : **le prix seul ne suffit pas sans libre-service**.

Cette grille n'est pas la moins chère, et ne le sera pas : une école prête à changer d'outil obtient chez Caisso un ERP avec génération annoncée pour moins, ou à peine plus. **Elle ne se justifie que face à une école qui garde son outil, ou dont le besoin dépasse ce que ces pages promettent.**

- **École et Complet** (étape 3) : non publiées avant cette étape. Les 549, 1 799 et 2 999 DH du premier projet sont fragilisés par Qalam, SchoolMA, Eduzaas et EduSchoolConnect, à périmètres non vérifiés.
- **Supérieur** : sur devis pour l'instant. **Rien ne permet de fixer un multiple** : Logesco applique × 4, Kanda Campus est proche de × 1, Hyperplanning coûte environ 6 340 MAD/mois pour une configuration (2024).
- **Facturation** : contrat annuel par défaut, virement sur facture en MAD ; mensuel à tarif majoré. Si les écoles ne déduisent pas la TVA, c'est le prix TTC qu'elles comparent : à clarifier avec l'expert-comptable.
- **Vente** : sans commercial salarié. Sur le même scénario, il mettrait de 30 à 119 mois à se rembourser à 199 DH.
- **IA** : plafonds maintenus. À 2 000 élèves, le coût va de 495 à 2 259 MAD/mois selon l'usage.

## 6. La promesse

Une formulation défendable, à tester : **« un emploi du temps généré, publié et tenu à jour, sans changer de logiciel scolaire »**, avec des temps mesurés sur un jeu de données publié.

| Face à | Ce qu'on peut dire | Réserve |
|---|---|---|
| Excel | Un emploi du temps sans conflit, publié à chacun | à chiffrer une fois mesuré |
| ERP en place sans génération annoncée (Skoolly, Schoolz, Eduzaas...) | Gardez-le, ajoutez la planification | import par fichiers ; aucune API de ces ERP n'est établie |
| Les cinq qui annoncent la génération | Montrons-le sur le même jeu de données | seul un essai tranche ; aucune comparaison publique sans avis juridique |
| FET (gratuit, français et arabe) | Hébergé, publication, notifications, remplacements | la qualité du résultat n'a pas été comparée |
| aSc | Le prix local reste à vérifier | aSc a une page française, une version en ligne et les remplacements |
| Supérieur | CM, TD, TP, volumes, plusieurs campus : une différence **vendue** | pas une absence prouvée chez les autres |

**À proscrire** : « seul », « N°1 », « le moins cher », « IA » sans méthode.

**Un manque visible** : Caisso et FET affichent le français et l'arabe, et Planner n'a pas l'arabe. À trancher pour le scolaire, dès l'étape 1 sur les emplois du temps imprimés si le besoin se confirme.

## 7. Ce qui reste faux dans les documents d'étude

Le détail, affirmation par affirmation, est dans [verifications-et-consequences.md](verifications-et-consequences.md). Les plus lourdes de conséquences :

| Point | Corrigé |
|---|---|
| Timetable AI à 149 DH « vendu seul » | 475 DH avec ses dépendances, d'où le socle inclus |
| Valeur des packs : 413, 826, environ 1 650 DH | 414, 996 et 1 818 DH, soit 40, 45 et 51 % de remise |
| Marché « mature » ; transparence comme différence | une page de prix ne prouve pas l'adoption ; 12 éditeurs publient déjà |
| Plafond du marché | sur 4 400 à 6 000 structures (estimation), 10 % à 199 DH font 1,05 à 1,43 M DH/an ; à 499 DH, 2,6 à 3,6 M DH/an. Un ordre de grandeur, pas une prévision |
| Mise en place à 500-2 000 DH | souvent offerte par les concurrents ; les 6 000 et 15 000 MAD de Q-28 ne tiennent pas pour une petite école sans libre-service |
| Revenu sur grands comptes | 2,8 à 5,3 fois moins qu'avec l'offre actuelle (5,40 MAD par compte) |

## 8. La pile, et deux échéances

Recommandation du groupe A, l'étude continue. La pile reste : Express, Sequelize, MySQL 8.4, React et MUI, Expo, le solveur Java, OIDC (`oidc-provider`), une base par école (D-01). Le **Module Registry** est le seul vrai ajout. Sa première brique existe : `services/etablissement/fonctionnalites.js` (PR #141).

**Timefold.** Community reste sous Apache 2.0, mais en 2.x `ScoreAnalysis` est réservé à l'édition payante et il faut Spring Boot 4. Or `EmploiDuTempsController.java` l'utilise, sur 1.15.0 et Spring Boot 3.3.5. La ligne 1.x finirait début 2027 (extrait, à confirmer). Aucun prix du solveur n'est publié. Trois chemins : monter en 1.35.0 et tenir jusqu'à la fin de la ligne ; passer en 2.x Community avec un compte rendu maison, ce que l'évaluateur indépendant prépare ; payer une licence au prix inconnu, qui ne rentre pas dans 149 à 899 DH sans avoir été chiffrée.

**OR-Tools.** Le paquet Maven requiert glibc et notre image est `eclipse-temurin:21-jre-alpine` : il faudra sans doute une image glibc. Aucun essai n'a été fait. L'explication d'une infaisabilité par CP-SAT n'est réduite qu'en monofil et sans objectif, donc dans une passe séparée. **Aucune comparaison publiée de CP-SAT et de Timefold n'a été trouvée sur l'emploi du temps** : l'essai prévu sur nos données reste nécessaire (`docs/conception/moteur-planification/ecarts-du-solveur.md`, branche `a/moteur-catalogue`).

## 9. Ce que cela change dans le plan

| Sujet | Avant | Après |
|---|---|---|
| Prix (Q-15, Q-17) | 4,99 MAD net par compte actif | paliers d'effectif par offre. **Le fichier 13 s'amendera quand la grille sera confrontée à des écoles** |
| IA (11 octobre) | incluse | incluse dans l'offre complète, option ailleurs, plafonds gardés (proposition) |
| ME-15 facturation | comptes actifs × prix | modules, paliers, régularisation d'effectif |
| Nouveau | — | **MO-1** registre des modules et droits d'accès (M) ; **MO-2** page d'abonnement et factures (M) ; **MO-3** essai avec filigrane et jeu de démonstration public (M). Estimations avant conception |
| Priorité | V1 puis V2 | voir `docs/archives/plans/plan-produit/04-plan-fusionne.md` : plusieurs écoles en V2, pack « École privée » en V4 |

L'ordre des vagues est dans `docs/archives/plans/plan-produit/04-plan-fusionne.md`. [feuille-de-route.md](feuille-de-route.md) n'est plus suivie.

## 10. À vérifier avant de vendre ou de publier

Les 28 questions, avec qui peut répondre, sont dans [verifications-et-consequences.md](verifications-et-consequences.md#questions-ouvertes). Celles qui naissent **dès la première vente** :

- **Droit** : contrat de sous-traitance (art. 23 et suivants de la loi 09-08) ; données d'enseignants et d'élèves dès l'étape 1, pas seulement à l'étape 3 ; région réelle de chaque sous-traitant, sauvegardes et IA comprises (les États-Unis ne figurent pas sur la liste CNDP de 2015) ; statut au regard de la loi 05-20 ; textes intégraux des lois 59-21 et 59-24. Rien de ce dossier n'est un avis juridique.
- **Fiscalité** : retenue de 10 % sur les prestations de non-résidents, plafond de carte à 50 000 MAD/an pour une société nouvelle, statut d'auto-entrepreneur inadapté, TVA déductible ou non pour l'école, facture électronique.
- **Encaissement** : le virement par défaut. Stripe ne liste pas le Maroc, et le CMI et ses banques ne signent plus de contrats de passerelle en ligne depuis octobre 2024.
- **Coûts réels** : ME-14a et ME-21 doivent remplacer les hypothèses (comptes par serveur, temps de solveur, tickets par école).
- **Prix** : relire à la main chaque prix du benchmark, avec une capture datée, avant de le citer. Les confronter à 10 écoles dès que la discussion avance.
