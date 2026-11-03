# Modèle économique par modules

Statut : **le principe est décidé par le chef de projet (4 novembre 2026) ; tout le reste de ce document est une proposition à valider**. Il s'appuie sur [le benchmark](benchmark.md) et relit deux documents d'étude : `docs/ecole/benchmarkChatGPT.txt` et `docs/ecole/plan.txt`.

## 1. L'essentiel

1. **Le principe tient** : des modules, des paliers d'effectif, des packs. Le marché le comprend déjà, Scoliance le pratique à partir de 70 DH.
2. **Odoo n'est pas le modèle qu'on croit** : il ne vend pas ses modules à la carte. Ce qu'il faut lui prendre, c'est l'entrée sans friction, pas la grille (§ 2).
3. **La vraie arme est l'emploi du temps automatique** : Planner l'a déjà, et parmi les pages marocaines lues, une seule l'annonce clairement (Caisso). Il peut se vendre seul, dès maintenant, à condition de corriger le piège des dépendances (§ 3).
4. **Viser les écoles privées avec un ERP complet demande un gros chantier** : notes, bulletins, frais, parents, arabe et Massar manquent. Ce sont les tickets d'entrée du marché (benchmark, § 7).
5. **`plan.txt` ne doit pas être suivi tel quel** : ses totaux de packs sont faux, ses prix du haut de grille divisent par 3 à 5 ce que l'offre actuelle facturerait à un grand établissement, et il propose de réécrire toute la pile technique (§ 5 et 6).

## 2. Ce qu'Odoo fait vraiment

Depuis sa [page de prix](https://www.odoo.com/pricing) : **une application gratuite à vie, utilisateurs illimités** ; puis **toutes les applications** pour un prix unique, **par utilisateur** ; la mise en place est vendue à part, souvent par des partenaires.

| | Odoo | `plan.txt` |
|---|---|---|
| Unité de prix | l'utilisateur | l'établissement et son effectif |
| Choix des modules | tout est inclus | 44 modules payants un par un, plus les SMS |
| Entrée | gratuite, une application | essai de 14 à 30 jours |
| Revenu de mise en place | partenaires | prestations à 500-2 000 DH |

**Ce qu'on en garde** : l'adoption progressive sur une seule base ; une entrée qui ne demande aucune décision d'achat ; les prix publics ; le réseau de partenaires, plus tard. **Ce qu'on n'en garde pas** : le prix par utilisateur. Toutes les offres marocaines facturent à l'effectif ou au forfait, et le plan a raison de ne pas faire payer chaque enseignant.

## 3. Le piège des dépendances

`plan.txt` annonce le module Timetable AI à **149 DH/mois**, vendable seul. Mais ses dépendances doivent être achetées aussi :

| Module requis (sa propre fiche) | Prix |
|---|---|
| Timetable AI | 149 |
| Core Platform | 149 |
| Class Management | 49 |
| Teacher Management | 79 |
| Room Management | 49 |
| « Gestion des matières » | **absent du catalogue**, aucun prix |
| **Total réel** | **475 DH/mois** |

Soit 3 fois le prix affiché, et **plus que tout Caisso Avancé** (242 à 300 DH), ou 68 % de Scoliance Pro complet (700 DH). Un client qui découvre ce total à la commande perd confiance, et cela contredit la « tarification transparente » proposée.

**Recommandation : le socle n'est pas à vendre.** Comptes, droits, établissement, élèves, classes, enseignants, matières et salles sont inclus dans tout abonnement. On vend ce qui est au-dessus. C'est plus simple, et tous les modules ont de toute façon besoin de ces données.

## 4. Proposition : quoi vendre, à quel prix

### Trois étapes, pas 44 modules

`plan.txt` le dit lui-même (« commencer avec 8 à 10 modules ») ; avec une personne par groupe (R-5), il faut être plus strict encore.

| Étape | Vendu | Cible | Reste à construire |
|---|---|---|---|
| **1. Planification seule** | Emploi du temps automatique, salles, reports, remplacements | toute école avec un outil existant ou Excel | import simple (ME-9), profil de l'école pilote, facturation par module |
| **2. Supérieur privé** | Étape 1, plus présences, examens, cours, quiz, IA | ce que Planner sait faire aujourd'hui | Plateforme ou instance dédiée (D-01), contrats |
| **3. École privée complète** | Notes, bulletins, frais, parents, arabe, export Massar | primaire, collège, lycée | tout cela (§ 7) ; **à lancer seulement si les entretiens le confirment** |

Cet ordre diffère de la conclusion de `plan.txt` (« commencer par les écoles privées »), pour une raison simple : il part de ce qui existe. Les étapes 1 et 2 se vendent bien plus tôt, et leurs revenus financent la 3.

### Grille à tester

**Hypothèses de lancement, en DH HT par mois**, à confronter à de vrais directeurs d'école avant toute publication. Socle inclus.

| Effectif | Planification | École (étape 3) | Complet |
|---|---|---|---|
| Jusqu'à 150 | 149 | 449 | 749 |
| 151 à 300 | 199 | 549 | 899 |
| 301 à 800 | 299 | 849 | 1 399 |
| 801 à 2 000 | 599 | **1 799** | **2 999** |
| Plus de 2 000 | devis | devis | devis |

- **Planification** : moins cher que les offres complètes à chaque palier, sauf Caisso au-dessus de 300 élèves. Justifié : il ne remplace pas l'outil en place.
- **École et Complet** : les montants de `plan.txt` jusqu'à 800 élèves. Le palier 801-2 000 est relevé : voir § 5.
- **Supérieur** : la même grille **multipliée par 3, à tester**. Logesco applique × 4. Pour un établissement de la taille de l'école pilote (768 comptes), Complet × 3 donne 4 197 DH, proche des 4 147 DH de l'offre actuelle. Les 1 499 DH de `plan.txt` diviseraient ce revenu par près de 3.
- **Modules isolés** : gardés pour ajouter un module à un pack. Prix de `plan.txt` en repère, avec des packs à **25 à 35 % de remise** plutôt que 40 à 50 % (§ 5).
- **Facturation** : contrat annuel par défaut (Q-17, et le budget des écoles est annuel), mensuel sans engagement à +20 %. En dirhams : Eduzaas fait payer en dollars, c'est un argument pour nous.

### L'entrée à la manière d'aSc plutôt que d'Odoo

**Essai sans limite de durée : on prépare et on génère son emploi du temps gratuitement, l'export est bloqué et l'impression porte un filigrane.** On paie quand le résultat convient. aSc le fait déjà, et il répond au budget marketing nul : le produit se montre seul. Un gratuit permanent à la Odoo coûterait trop cher en support et en calcul tant que ces coûts ne sont pas mesurés. Limiter le nombre de générations de l'essai protège le serveur.

### L'argumentaire

| Face à | Ce qu'on dit |
|---|---|
| Excel | Un emploi du temps sans conflit, sans y passer des semaines |
| ERP déjà en place (Skoolly, Scoliance...) | Gardez-le. Ajoutez le moteur qu'il n'a pas |
| FET (gratuit) | Même résultat sans expertise ; publication et notifications à chaque changement |
| aSc | En français, hébergé pour vous, prix local, et les reports sont gérés |
| Caisso (très bas prix) | Il vient de la caisse ; nous venons de la planification. Plusieurs campus, CM, TD, TP |

**À ne pas promettre** : « moins cher du marché » (Caisso et Eduzaas sont imbattables, et le coût par client n'est pas mesuré), ni « IA » sans preuve. La comparaison de `plan.txt` sur les heures gagnées est bonne, mais elle doit se mesurer d'abord à l'école pilote.

## 5. Ce qui est faux ou risqué dans `plan.txt`

| Point | Dans le document | Réalité |
|---|---|---|
| Valeur de School Professional | 826 DH | **996 DH** (somme de ses propres modules) |
| Valeur de School Enterprise | environ 1 650 DH | **1 818 DH**, en comptant Staff pour « HR Management », qui n'existe pas au catalogue |
| Remise des packs | non dite | **40 %, 45 % et 51 %** : avec de tels écarts, personne n'achète à la carte, et le prix des modules ne sert plus de repère |
| Catalogue complet | non dit | **3 516 DH/mois** pour 300 élèves, soit 2 à 15 fois les offres marocaines complètes |
| Haut de grille | Enterprise 801-2 000 : 2 199 DH ; University Professional : 1 499 DH | **Revenu divisé par 3 à 5 sur les grands comptes**, comparé à l'offre actuelle (Q-15) : l'école pilote passerait de 4 147 à 1 499 DH ; 2 000 élèves, de 11 610 à 2 199 DH. Skoolly facture 7 500 DH à 1 500 élèves |
| Mise en place | 500 à 2 000 DH | Q-28 a validé **6 000 et 15 000 MAD**. Et iLimo, Schoolz, Caisso, Fedena l'**offrent**. Elle ne peut donc tenir que si l'import et l'assistant sont en libre-service (ME-9, ME-10) |
| IA | Module à 149 DH | Décision du 11 octobre : IA incluse. À 330 comptes, le coût va de 76 MAD (usage typique) à 347 MAD (tous au plafond), d'après le fichier 13, § 13.4. **Les plafonds doivent rester** |
| Équipe | 8 fonctions, 24 mois | une personne par groupe (R-5) : chaque jalon est à refaire |
| Simulation | 598 800 DH/an pour 100 écoles | Chiffre d'affaires brut, sans aucun coût. Elle dépend de 100 clients payants, dont aucun n'existe |

Ordre de grandeur du plafond marocain, à titre de **prudence et non de prévision** : 10 % des 6 922 établissements (chiffre de 2019-2020) à 499 DH font environ 4,1 millions de DH par an. Le marché existe, mais à ce prix, il n'autorise ni beaucoup de support, ni beaucoup de vente directe par école.

**Le coût par client n'est pas connu.** Sans lui, aucune marge ne peut être affirmée, et l'objectif de 70 % de marge brute de `plan.txt` reste un souhait. **Une instance dédiée n'est pas compatible avec 199 DH par mois** : les petits clients supposent la Plateforme partagée, donc les vagues V4 et V5 (15 canaux d'isolation à fermer, dont 4 critiques).

## 6. La pile technique : ne pas réécrire

`plan.txt` propose NestJS, PostgreSQL, TypeScript, Tailwind, Python et Keycloak. **Recommandation : refuser.** Le même document demande pourtant d'auditer l'existant d'abord (§ 25), et parle de monolithe modulaire, ce que D-17 a déjà retenu.

| Proposé | Existant | Décision proposée |
|---|---|---|
| NestJS | Express, 74 fichiers de modèles, suites de tests | garder |
| PostgreSQL | MySQL, dont le passage à 8.4 vient d'être préparé | garder |
| Tailwind | MUI 7 et le langage visuel de `DESIGN.md` | garder |
| Keycloak | Planner est déjà fournisseur d'identité OIDC | garder |
| Python + CP-SAT | Timefold en Java ; CP-SAT existe aussi en Java | **mesure en cours** (`docs/plans/moteur-planification`), sans changer de langage par principe |
| Multi-tenant | une base par école (D-01), audit d'isolation fait | garder |

Une réécriture coûterait des mois sans gain pour un client. Seul le **Module Registry** est vraiment nouveau, et sa première brique existe : la fonctionnalité par école de ME-0c (`services/etablissement/fonctionnalites.js`, PR #141) et l'interrupteur de EC-5.

## 7. Ce que cela change dans le plan

| Sujet | Avant | Après (proposé) |
|---|---|---|
| Prix (Q-15, Q-17) | 4,99 MAD net par compte actif | paliers d'effectif par offre. **À amender dans le fichier 13 après validation** |
| IA (11 octobre) | incluse | incluse dans Complet ; option ailleurs ; plafonds gardés |
| ME-15 facturation | comptes actifs × prix | modules, paliers, régularisation d'effectif |
| Nouveau | — | **MO-1** registre des modules et droits d'accès (M) ; **MO-2** page d'abonnement et factures (M) |
| Étape 3, à décider | — | Notes et bulletins (L), frais et paiements (L, sans doute plus), portail parents (M), arabe sur le site et l'application (L), export Massar (M) |

L'étape 3 représente environ **19 jours bruts, soit 29 à 38 jours-personne réels** avec la règle du plan (§ 12.7) ; MO-1 et MO-2, nécessaires dès l'étape 1, ajoutent 4 jours bruts. **Estimation grossière**, avant conception : les frais, avec échéanciers et reçus, peuvent dépasser un L.

## 8. Décisions à prendre

| # | Question | Recommandation |
|---|---|---|
| 1 | Ordre des cibles : Planification seule, puis supérieur, puis écoles complètes ; ou écoles privées d'abord, comme `plan.txt` ? | **Planification d'abord** : c'est ce qui se vend le plus tôt |
| 2 | La pile de `plan.txt` est-elle abandonnée ? | **Oui** |
| 3 | Socle inclus plutôt que Core à 149 DH ? | **Oui** |
| 4 | La grille du § 4 sert-elle de base aux entretiens ? | **Oui**, à confronter à 10 écoles avant publication |
| 5 | Qui fait les entretiens, et quelle école pilote (Q-25) ? | Chef de projet. C'est le point qui bloque le plus : aucune école extérieure n'a encore donné son avis sur un prix |

## 9. À vérifier avant de publier un prix

- Relire à la main chaque prix du benchmark, avec une capture datée.
- Coût mensuel réel d'un client : hébergement, calcul du solveur, stockage, support (ME-14a et ME-21 donneront une partie).
- TVA, facturation en dollars ou en dirhams : expert-comptable.
- Massar : accès et obligation réelle auprès de l'AREF.
- Le droit de comparer publiquement à des concurrents nommés : les textes de vente ne les citent pas sans avis juridique.
- Données des mineurs dès l'étape 3 : CNDP et loi 09-08.
