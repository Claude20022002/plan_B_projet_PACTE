# Vérifications, conséquences et questions ouvertes

Dernière relecture : 4 novembre 2026. Les marqueurs de fiabilité ([L], [E], [V], [T], [M], [A]) sont expliqués dans [benchmark.md](benchmark.md). Les deux documents d'étude de `docs/ecole/` ont été corrigés en conséquence ; leur version d'origine reste dans l'historique de git (commit `927cee5`).

## Ce que valent `benchmarkChatGPT.txt` et `plan.txt`

Deux précisions sur le périmètre du contrôle. **Aucun des deux documents ne mentionne Timefold ni Java** : `plan.txt` propose « Python + FastAPI » et « Google OR-Tools CP-SAT ». Et `plan.txt` **ne contient pas le mot Massar**, alors que le Maroc y est le marché pilote. Les images d'illustration ne prouvent rien : Minassa est un vrai concurrent marocain, placé sur iLimo ; Cleezo Class est indien ([Cleezo](https://www.cleezoclass.com/about)) ; Sikolo, dans la version lue, est gabonais ([SikoloTech](https://sikolo.durable.site/)) ; Eduzia reste introuvable ; l'image de SchoolSoft Maroc porte un titre suédois (« Logga in på Schoolsoft ») [M].

### `benchmarkChatGPT.txt`

| Affirmation | Verdict | Justification |
|---|---|---|
| Odoo : toutes applications incluses, une application gratuite | **Exact** | [Odoo](https://www.odoo.com/pricing) |
| Odoo : dès 24,90 $/utilisateur | **Inexact pour le Maroc** | Exact aux États-Unis [T] ; vu du Maroc 7,25 à 16,40 $ ; voir la contradiction sur la facturation |
| OpenEduCat : plateforme 489 $, modules dès 79 $, 160 à 329 $, avancés et LMS 499 $, utilisateurs à part | **Exact** (grille « us ») | [Script](https://openeducat.org/_next/static/chunks/bc53ec808451ada1.js) ; le Maroc relève d'une grille plus basse |
| OpenEduCat : plus de 70 modules | **Invérifiable** | 54 modules dans le catalogue lu, d'autres peuvent manquer |
| Fedena : 999, 1 399, 1 699 $, modules débloqués par niveau | **Exact** | [Fedena](https://fedena.com/pricing-and-plans) |
| Classter : total de 21 500 € | **Partiel** | Calcul juste, mais la page affiche aussi 25 500 € ([Classter](https://www.classter.com/pricing/)) |
| Skoolly : 4, 5, 6 DH, 100 élèves, 30 j ; 200 élèves = 1 000 DH | **Exact** | [Skoolly](https://skoolly.ma/tarifs) |
| iLimo : devis, Analytics 390, connecteur Massar | **Exact**, mais « connecteur » = fichiers | [iLimo](https://ilimo.ma/fr/tarifs) |
| Eduzaas Growth : 641 DH | **Inexact** | 649 MAD ([Eduzaas](https://eduzaas.com/fr-ma/pricing)) ; omet USD et facturation annuelle affichée |
| Scoliance : Pro 700, Enterprise 1 500, modules dès 70, pack 50 | **Exact, incomplet** | Starter à 400 DH omis |
| Schoolz : 900, 1 400 | **Exact, incomplet** | 500 MAD omis |
| Caisso : 700 et 1 300, puis 1 600 et 2 900, EDT automatique | **Exact, incomplet** | 150 et 300 DH/mois omis ; EDT seulement en Avancé |
| SchoolSoft : devis, outils Massar | **Exact** ; outils « prévus » | [SchoolSoft](https://schoolsoft.ma/integration-massar.html) |
| aSc : 399, 499, 995, 3 995 $, présentés comme tarification officielle | **Invérifiable, et attribution fausse** | La page citée n'affiche aucun prix [M] ; 995 et 3 995 retrouvés nulle part ; 499 € est le prix de Premium chez IBN |
| aSc : maintenance 79 $ dès l'an 3 | **Invérifiable** | Un seul concurrent [E] ; IBN dit 149 €/an après 2 ans |
| aSc : essai qui génère, limite l'export, filigrane | **Exact** | [aSc](https://www.asctimetables.com/a/trial-version) |
| « Beaucoup de concurrents marocains demandent un devis » ; la transparence serait un différenciateur | **Partiel** | Vrai pour 7 éditeurs lus, faux pour 12 qui publient : l'argument est faible |
| La plupart des ERP incluent le planning dans une offre large ; moteur vendu seul comme opportunité | **Cohérent, sans preuve de demande** | Aucune page marocaine relevée ne présente le générateur comme un produit vendu seul (à vérifier chez SchoolApp et Scoliance, qui parlent d'à la carte) ; aucune école extérieure interrogée |

### `plan.txt`

| Affirmation | Verdict | Justification |
|---|---|---|
| Msingi, Kanda, UOS, Logesco, Skoolly, Eduzaas : prix cités | **Exact** | Pages lues ci-dessus ; Kanda incomplet (250 000 et Campus omis), Logesco sans période |
| Go4School : 14 modules, 9 espaces | **Inexact** | **13 et 11** ([Go4School](https://www.go4school.net/)) ; seule la page d'accueil a été contrôlée |
| Go4School : Mobile Money, OHADA, FR/EN | **Exact** (déclaration) | idem |
| « Skoolly démontre » la compréhension du prix par élève ; le marché est « suffisamment mature » | **Invérifiable** | Une page de prix ne prouve pas l'adoption ; Skoolly ne publie aucun client |
| UOS, stratégie propre au supérieur | **Partiel** | Starter vise aussi les écoles ; Kanda Campus et Logesco sont de meilleurs exemples |
| **Paystack** ne couvre pas tous les pays africains | **Exact** | 7 pays ([API, 4 novembre 2026](https://api.paystack.co/country)) [L] : Nigeria, Ghana, Afrique du Sud, Kenya, Côte d'Ivoire ; Égypte et Rwanda en `pilot_mode` |
| Sa documentation distingue marchés actifs, canaux Mobile Money, bêta | **Exact sur le fond, sources inégales** | Canal réservé au Ghana, au Kenya, à la Côte d'Ivoire ([doc](https://paystack.com/docs/payments/payment-channels/)) [E] ; [une aide](https://support.paystack.com/en/articles/2130562) parle de bêta en Côte d'Ivoire, ce que l'API contredit |
| **OHADA** comme localisation, Country Pack | **Exact pour 17 États, sans valeur au Maroc** | [ohada.com](https://www.ohada.com/) [L] liste 17 États, dont Sénégal, Côte d'Ivoire, Cameroun, RDC, sans le Maroc, le Ghana, le Kenya ni le Nigeria. `plan.txt` n'affirme pas que le Maroc en relève |
| **Mobile Money** comme moyen à intégrer | **Exact pour les pays de la phase 2, marginal au Maroc** | Opérateurs confirmés ([Flutterwave](https://developer.flutterwave.com/docs/francophone), [Bankable, mai 2026](https://bankable.africa/en/digital/1305-2927-with-194-8-million-in-2025-revenue-airtel-money-closes-in-on-m-pesa-in-drc), [Financial Afrik, 8 octobre 2026](https://www.financialafrik.com/2026/10/08/cameroun-en-2025-mtn-mobile-money-reduit-son-retard-sur-le-leader-orange-money/)). Maroc : 16,4 millions de portefeuilles, 28 millions d'opérations contre 230,1 millions de paiements par carte, usage commerçant marginal ([Yabiladi, 22 octobre 2026, d'après BAM](https://en.yabiladi.com/articles/details/205514/moroccans-paid-billion-dirhams-card.html)) ; aucune donnée propre aux frais scolaires |
| Adaptateur de paiement par pays | **Justifié** | Au Maroc : Paystack absent de l'API, PayDunya absent ([6 pays](https://paydunya.com/faq)) [E], CinetPay et Flutterwave **non vérifiables** ([Flutterwave](https://developer.flutterwave.com/docs/francophone), [CinetPay](https://cinetpay.com/pricing)) [E] |
| **OR-Tools CP-SAT**, avec Python | **Exact sur le moteur, Python non nécessaire** | Paquet Maven officiel, Apache 2.0, v9.15.6755 du 12 janvier 2026 ([guide Java](https://developers.google.com/optimization/install/java), [licence](https://raw.githubusercontent.com/google/or-tools/stable/LICENSE), [Maven](https://repo1.maven.org/maven2/com/google/ortools/ortools-java/maven-metadata.xml)). Pile abandonnée de toute façon |
| **Licence de Timefold** | **Absente des deux documents** | Community reste Apache 2.0 ([Timefold](https://timefold.ai/pricing)) ; voir « Conséquences » pour ce qui est payant |
| Hors ligne « indispensable au marché africain » | **Partiel** | Soutenu par Kanda, Go4School ; aucune annonce marocaine lue |
| Timetable AI à 149 DH, vendable seul | **Inexact par ses propres chiffres** | Avec ses dépendances : 475 DH, et « Gestion des matières » n'a pas de prix |
| School Start : 413 DH | **Inexact** | **414 DH** (calcul sur sa propre grille) |
| School Professional : 826 DH ; Enterprise : environ 1 650 DH | **Inexact** | **996** et **1 818 DH**, « HR Management » absent du catalogue, compté comme Staff |
| 598 800 DH pour 100 écoles | **Calcul juste, sans valeur prédictive** | Revenu brut, aucun client |
| Marge brute supérieure à 70 % | **Invérifiable, et non atteinte par la Planification dans le scénario** | Coût de 41 à 191 % du prix |
| Installation à 500-2 000 DH | **À contre-courant du marché lu** | Offerte chez Schoolz, Caisso, iLimo, Fedena, sans frais chez Eduzaas ; payante chez EduSchoolConnect, 1ECOLE, Logesco |
| Loi 09-08 et CNDP « à prendre en compte » ; données de mineurs | **Exact, incomplet** | Ni 05-20 ni 59-21 ; la loi 09-08 n'a pas de règle propre aux mineurs |

## Conséquences pour l'offre

**Cette section est une analyse, pas une décision.** Elle ne rouvre pas les choix du 4 novembre. Elle porte sur la première grille (Planification à 149, 199, 299 et 599 DH) ; le README retient depuis 449 et 899 DH comme valeurs à tester pour les deux derniers paliers.

### La promesse doit passer de « nous l'avons » à « nous le montrons »

« Le moteur que les autres n'ont pas » n'est plus tenable au Maroc. Il reste, dans ce que les pages lues permettent de dire, quatre terrains. Le premier est la **vente seule sans changer de logiciel** : aucune page marocaine relevée ne présente le générateur comme un produit vendu seul, sous réserve de SchoolApp (« activation à la carte ») et de Scoliance (modules non listés). Le deuxième est le **supérieur** : aucun des cinq ne vend CM, TD, TP ni volumes semestriels, ce qui n'en prouve pas l'absence, et la référence trouvée dans le supérieur marocain est un produit importé bien plus cher. Le troisième est **ce qui suit le calcul** : publication, notifications, remplacements, là où FET ne documente rien et où EDT dépend de PRONOTE ; aSc le fait toutefois déjà. Le quatrième est la **preuve** : Acadelta publie des temps, les autres non, et la seule mesure interne citée (2 620 séances en 90 secondes) n'est pas comparable.

Une formulation défendable, à tester, ressemblerait à : « un emploi du temps généré, publié et tenu à jour, sans changer de logiciel scolaire », avec des temps mesurés sur un jeu de données publié. Sont à proscrire « seul », « N°1 », « IA » sans méthode, et toute comparaison nommée sans avis juridique. Le jeu de démonstration imposé sert à la fois à vérifier les concurrents et à se mesurer. Il devrait contenir ce que les pages marocaines laissent dans l'ombre : **vacataires**, salles spécialisées, **double vacation matin et après-midi**, surplus horaire du privé. Deux manques exposent Planner sur ce terrain : Caisso et FET affichent le français et l'arabe, et Planner n'a pas l'arabe ; l'import depuis les ERP en place, sans API connue, repose sur des fichiers.

### La grille tient en bas sous conditions, pas en haut

| Palier (haut de palier) | Planification | Coût complet, 8 000 / 3 000 comptes | Usage réduit | Support triplé, 8 000 / 3 000 comptes | Repères, périmètres différents |
|---|---:|---:|---:|---:|---|
| 150 élèves | 149 | 41 % / 64 % | 29 % | 92 % / 114 % | Caisso 108 puis 242 ; Eduzaas 233 ; EduSchoolConnect 299 ; Prime 122 |
| 300 | 199 | 62 % / 95 % | 43 % | 137 % / 171 % | Caisso 108 puis 242 ; Eduzaas 233 ; EduSchoolConnect 449 ; EDT dès 424 (2023) |
| 800 | 299 | **106 % / 165 %** | 73 % | 232 % / 291 % | Caisso 242 ; Qalam 999 ; Scoliance 1 000-1 500 ; Acadelta 2 000 |
| 2 000 | 599 | **117 % / 191 %** | 75 % | 242 % / 316 % | Caisso 242 ; SchoolMA 800 ; Qalam 999 ; Eduzaas 1 624 ; Skoolly 10 000 ; EDT jusqu'à 870 (2023) |

Les pourcentages sont le coût rapporté au prix, hors IA, sur hypothèses. Les repères sont en DH ou MAD par mois.

**Les paliers 301-800 et 801-2 000 ne tiennent pas dans ce scénario.** Même en usage réduit, le coût reste à 73-75 % du prix, loin d'une marge de 70 %. Les deux leviers sont le support et le prix. Des valeurs comme 449 et 899 DH, à faire réagir en entretien, resteraient sous Qalam, Scoliance et Acadelta à ces tailles, mais au-dessus de Caisso et, à 2 000 élèves, de SchoolMA, et laisseraient encore 71 % et 78 % de coût dans le scénario complet : **le prix seul ne suffit pas sans libre-service**. Les paliers bas passent si la plateforme se remplit et que le support reste bas, mais pas la première année si le support triple. Ils ne sont pas non plus les moins chers : une école prête à changer d'outil obtient chez Caisso un ERP avec génération annoncée pour moins, ou à peine plus. Le prix de la Planification ne se justifie donc que face à une école qui garde son outil, ou dont le besoin dépasse ce que ces pages promettent. **Aucune école extérieure n'a encore réagi à un prix.**

Les colonnes École et Complet n'ont pas à être publiées avant l'étape 3, et les nouveaux prix les fragilisent. À 300 élèves, École (549) dépasse EduSchoolConnect (449 HT, mise en place en sus), Mon Ecole PRO (450) et Qalam (499) ; en haut de grille, 1 799 et 2 999 DH font face à Qalam à 999, SchoolMA à 800 et Eduzaas à 1 624 en illimité, à périmètres non vérifiés. Complet avec IA atteindrait 40 % de coût à 2 000 élèves en usage typique, mais 99 à 113 % si tous les comptes atteignent le plafond : **les plafonds restent indispensables**. Le supérieur à × 3 reste une hypothèse : à la configuration d'Hyperplanning (environ 6 340 MAD/mois, 2024), la grille paraît basse ; face à Kanda Campus (1 995 MAD à 2 000 étudiants, hors Maroc) ou UOS (252 à 335 MAD), elle paraît haute. Rien ne permet de fixer un multiple. Enfin, si les écoles ne déduisent pas la TVA, la comparaison utile est le prix TTC, ce que plusieurs concurrents ne précisent pas.

L'entrée à la manière d'aSc reste cohérente avec un produit qui se vend sans commercial et un marché où l'essai long existe déjà (Skoolly 30 jours, Untis 3 mois). Aucune donnée ne chiffre sa conversion, et une école pourrait recopier le résultat affiché. Le risque se réduit si la valeur payante inclut la publication et les mises à jour, pas seulement le fichier final.

### Timefold 2.x et Alpine pèsent sur le calendrier, pas sur la promesse

**Timefold.** Community reste sous Apache 2.0 ([tarifs](https://timefold.ai/pricing)). Mais depuis la 2.x, `ScoreAnalysis` est « provided exclusively » par l'édition Enterprise, et il faut Java 21, Spring Boot 4 et Jackson 3 ([migration](https://docs.timefold.ai/timefold-solver/latest/upgrading-timefold-solver/upgrade-from-v1)). Or `EmploiDuTempsController.java` importe `ScoreAnalysis` et appelle `solutionManager.analyze(solution)` à la ligne 164, sur Timefold 1.15.0 et Spring Boot 3.3.5 [M]. Le multifil et la nearby selection étaient déjà réservés à Enterprise depuis le début ([v1.0.0](https://github.com/TimefoldAI/timefold-solver/releases/tag/v1.0.0)) : ce n'est pas une nouveauté. La ligne 1.x, à 1.35.0 le 15 octobre, finirait début 2027 après deux publications ([v1.34.0](https://github.com/TimefoldAI/timefold-solver/releases/tag/v1.34.0)) [E]. Les sources se contredisent sur l'édition payante, **Plus** dans [le billet 2.0](https://timefold.ai/blog/timefold-solver-2-0-release), **Enterprise** ailleurs, et **aucun prix du solveur n'est publié**. La gratuité pour les organismes non lucratifs ne couvre vraisemblablement pas une vente commerciale, à vérifier.

Trois chemins en découlent : monter en 1.35.0 et vivre sans changement d'édition jusqu'à la fin de la ligne ; passer en 2.x Community en remplaçant l'analyse de score par un compte rendu maison, ce qui renforce l'évaluateur indépendant déjà recommandé dans `ecarts-du-solveur.md` ; payer une licence au prix inconnu. Pour l'offre, l'échéance tombe au moment de la première vente : tout argument fondé sur l'explication des conflits repose sur cette API. Une licence de montant inconnu ne peut pas entrer dans un prix de 149 à 599 DH sans avoir été chiffrée.

**OR-Tools sur Alpine.** Le paquet Maven Linux 9.15.6755 requiert glibc (`libc.so.6`, symboles jusqu'à GLIBC_2.26) et pèse 71,5 Mo décompressés [M] ([jar](https://repo1.maven.org/maven2/com/google/ortools/ortools-linux-x86-64/9.15.6755/ortools-linux-x86-64-9.15.6755.jar)). L'image actuelle est `eclipse-temurin:21-jre-alpine` [M]. Un mainteneur écrit que ce paquet « will have hard time to work » sur Alpine, propos datant de la v9.4 ([or-tools-discuss](https://groups.google.com/g/or-tools-discuss/c/yeGl0WOoEmo)) ; une archive `alpine-edge` existe, liée à une version mouvante ([API GitHub](https://api.github.com/repos/google/or-tools/releases/latest)) [M]. **Aucun essai de chargement n'a été fait.** La voie la plus simple serait une image glibc ; elle change la taille de l'image et le coût de déploiement, à mesurer.

Autre réserve : le sous-ensemble d'hypothèses qui explique une infaisabilité n'est réduit « only in single-thread and if the problem is not an optimization problem », sans garantie de minimalité ; expliquer un échec demande donc une passe séparée ([cp_model.proto](https://raw.githubusercontent.com/google/or-tools/stable/ortools/sat/cp_model.proto)). **Aucune comparaison publiée CP-SAT contre Timefold n'a été trouvée sur l'emploi du temps.** ITC 2019 a été gagné par une méthode MIP sans limite de temps ([enquête](https://arxiv.org/pdf/2201.07525), [itc2019.org](https://www.itc2019.org/) [E]), ce qui ne dit rien d'un budget de quelques minutes. Une étude récente fait tourner CP-SAT sur 6 278 séances en 4,45 s, après découpage et avec un repli qui peut créer des conflits d'enseignants ([SEMISH 2026](https://sol.sbc.org.br/index.php/semish/article/view/43522)). Seul l'essai sur les données de Planner tranchera, à temps et mémoire égaux, en tenant compte du multifil payant côté Timefold. Le choix du moteur ne devrait pas apparaître dans la promesse commerciale. FET sous AGPL n'est pas une solution de repli gratuite pour un service en ligne sans lecture juridique.

## Questions ouvertes

| N° | Question | Qui peut répondre | Ce que cela change |
|---|---|---|---|
| 1 | Quelle loi s'applique aujourd'hui entre 06-00 et 59-21, quel régime transitoire, quel état des 35 décrets ? Que disent les textes intégraux sur les registres, les données et Massar ? | Avocat | Textes commerciaux, pièces à conserver |
| 2 | Quel est l'état réel de la loi 59-24 et ses effets sur le supérieur privé, notamment sa date de publication ? | Avocat, ministère | Deuxième cible |
| 3 | Un éditeur SaaS est-il « prestataire de services numériques » au sens de la loi 05-20 ? Quelles obligations concrètes ? | Avocat | Journaux, incidents, contrats |
| 4 | Quel risque (loi 07-03) pour une extension agissant dans la session d'un directeur ? Quelles clauses de sous-traitance (art. 23) ? | Avocat | Limite du connecteur Massar, contrat type |
| 5 | Peut-on comparer publiquement des concurrents nommés ? FET en AGPL peut-il servir derrière un service en ligne ? | Avocat | Argumentaire, repli technique |
| 6 | Portée des art. 12-1-d et 49 pour les sanctions disciplinaires et les casiers d'enseignants ; durées de conservation | Avocat, CNDP | Étape 3 |
| 7 | Existe-t-il un modèle ou une délibération pour les écoles privées ? La convention-cadre CNDP-ministère les couvre-t-elle ? | CNDP | Charge de l'école |
| 8 | Un dossier par traitement ? La CIN d'un parent ou d'un enseignant impose-t-elle une autorisation pour tout le fichier ? | CNDP | Champs optionnels dès la première version |
| 9 | Le SaaS doit-il déclarer en son nom ? Comment mentionner l'éditeur et ses sous-traitants ? La notification de transfert peut-elle être mutualisée ? | CNDP | Onboarding, hébergement |
| 10 | Quelle voie pour une IA ou une sauvegarde aux États-Unis, y compris avec données pseudonymisées ? La liste de 2015 est-elle à jour ? | CNDP | Sous-traitants de Planner |
| 11 | Base du traitement des données de mineurs, comptes élèves, QR de présence, photos | CNDP | Périmètre de l'étape 1 |
| 12 | Une synchronisation ou une extension vers Massar est-elle une « interconnexion » (art. 12-1-f) ? | CNDP | Connecteur |
| 13 | Le privé doit-il saisir dans Massar notes, absences, inscriptions, emplois du temps ? Selon quelle note ? Les programmes étrangers sont-ils exclus ? | AREF, ministère | Étape 3 |
| 14 | Existe-t-il une API, une autorisation ou une liste d'éditeurs ? Le gabarit Excel est-il stable et publié ? La note 25-028 sur la double authentification existe-t-elle ? | AREF, ministère | Choix fichier ou API |
| 15 | Recueil statistique complet, privés par région et par cycle, définition de l'« établissement » | Ministère | Taille du marché |
| 16 | Grilles horaires officielles par matière et niveau, marge du privé, obligation éventuelle de tenir un emploi du temps | Ministère, AREF | Paramètres du générateur |
| 17 | Rapport « L'enseignement supérieur en chiffres 2024-2025 » et nombre d'établissements reconnus | Ministère | Confirme 213 et 91 082 |
| 18 | Les frais de scolarité sont-ils hors TVA ? L'école peut-elle déduire ? Quel prix afficher ? | Expert-comptable | Prix TTC ressenti |
| 19 | La retenue de 10 % s'applique-t-elle à chaque fournisseur, selon sa convention et la qualification du SaaS ? | Expert-comptable | +11,1 % sur les coûts en devises |
| 20 | Le SaaS relève-t-il de l'art. 117-V ? Quel classement des crédits d'API, quel plafond carte applicable ? Quelle obligation de facture électronique ? | Expert-comptable, avec la banque | Trésorerie, ME-15, MO-2 |
| 21 | Démonstration sur un jeu imposé : que fait réellement le générateur, sur les salles, vacataires et double vacation ? | Acadelta, SchoolApp, Minassa, Tayssir, Caisso, Scoliance | Promesse |
| 22 | Comment fonctionne la synchronisation annoncée avec Massar ? | Tayssir, E-Schools, SchoolMA | Réalité du secteur |
| 23 | La génération est-elle dans l'offre gratuite de Tayssir ? Qalam passe-t-il réellement par Stripe, avec quelle entité ? | Tayssir, Qalam | Prix plancher |
| 24 | Prix applicable au Maroc | aSc, Index Éducation, Untis | Plafond de prix |
| 25 | Période du tarif ; lien entre logesco.org, .net et .fr | Logesco | Comparaison africaine |
| 26 | Prix réel pour une entité marocaine ; présence au Maroc et en RDC | Odoo ; Flutterwave, CinetPay | Référence ; paiements |
| 27 | Prix et frontière de Plus et Enterprise ; conditions de gratuité | Timefold | Choix du moteur |
| 28 | Devis d'hébergement certifié au Maroc ; offre de passerelle de paiement | N+ONE, inwi, Maroc Telecom ; établissement de paiement | Coût réel, encaissement |

## Ce qui n'a pas pu être vérifié

Aucun concurrent n'a été testé, aucune vidéo vue, aucun devis obtenu, aucune école interrogée. Le chargement réel d'OR-Tools sur Alpine n'a pas été essayé. Le coût par client n'est pas mesuré : ni comptes par serveur, ni mémoire par base, ni temps de solveur par effectif, ni tickets par école. Restent inaccessibles ou non lus : les textes intégraux des lois 59-21 et 59-24, la loi 09-08 au Bulletin officiel, le décret 2-00-1015, toute note ministérielle originale sur Massar et le rapport du supérieur. Ne reposent que sur des extraits : les pages de CinetPay et la documentation de Paystack, les prix d'Eduvate et de KAKO, DataSchool et Edumanage. Sur GENIE, rien d'exploitable n'a été trouvé. Aucun chiffre récent ne décrit les parts de marché, les frais officiels 2024-2026 ni la répartition régionale. Les noms ScolaWeb et EcoleManager n'ont rien donné ; aucune recherche dédiée n'a porté sur Smart School ni Edusoft. La liste des éditeurs n'est donc pas exhaustive. Les chiffres de clients sont tous déclaratifs, les prix de distributeurs d'aSc ne sont pas datés, et les taux des monnaies flottantes sont à recalculer avant toute citation.

## Conclusion

Le travail de ce relevé déplace le risque. Le marché marocain n'a plus besoin qu'on lui apprenne que la génération existe ; il lui manque des preuves, et personne n'en publie de solides. La concurrence par la promesse est donc peu coûteuse pour tous, y compris pour Planner, ce qui rend un jeu de données public et des temps mesurés plus utiles qu'une page de plus. L'essai sans limite peut remplir ce rôle sans attendre l'école pilote, à condition que son coût de calcul et de support soit plafonné.

Trois échéances se croisent désormais : la fin annoncée de Timefold 1.x début 2027, la mesure ME-14a dont dépend le prix, et le premier contrat, qui fait naître dès l'étape 1 les questions de sous-traitance et de transfert. Prix et moteur ne se décident donc pas séparément : le coût réel du solveur et du support fixe le haut de grille, et le choix de la version de Timefold fixe ce que Planner pourra expliquer à ses clients. Tant que ces mesures manquent, la grille du README sert à ouvrir des entretiens, pas à être publiée.
