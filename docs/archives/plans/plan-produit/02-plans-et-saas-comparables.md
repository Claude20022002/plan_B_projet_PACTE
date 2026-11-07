# 2. Les plans du projet et ceux des SaaS comparables

## 2.1 Les plans actuels du projet

Une vingtaine de documents décrivent ce qu'il faut faire. Ils ont été écrits à des moments différents, pour des cibles différentes.

| Document | Écrit | Cible | Statut affiché | Lecture |
| --- | --- | --- | --- | --- |
| `docs/ecole/plan.txt` | nov. | ERP scolaire modulaire pour l'Afrique, écoles privées d'abord | **référence depuis le 4 nov.**, à structurer | Bonne vision : socle et modules, packs, tranches d'effectif, hors ligne, pays. Mais il ne part pas de l'existant. Ses totaux de packs sont faux, son haut de grille sous-facture les grands comptes, et il propose une autre pile technique (critique détaillée du groupe A, `a/benchmark-modules`). Ses 44 modules ne sont reliés à aucun lot |
| `docs/ecole/para.txt` | nov. | référentiel de 16 familles de paramètres | données d'entrée | déjà traduit en 498 paramètres par le groupe A (`a/moteur-catalogue`) |
| `docs/ecole/benchmarkChatGPT.txt` | nov. | concurrents et grille de prix | étude | recoupé, et parfois corrigé, par le benchmark du groupe A et notre `docs/etude-marche/` |
| `planner-multi-etablissements/` (fichiers 01 à 16) | 24-26 oct. | une école pilote sur sa propre installation, puis plusieurs écoles | validé le 26 oct., remplacé le 4 nov. | Le plus solide techniquement : décisions D-01 à D-21, modèle de données, import, isolation, vérification, offre. Il garde toute sa valeur sur le **comment**. C'est le **quoi** et l'**ordre** qui changent |
| `modele-economique/` (groupe A, non poussé) | 3-4 nov. | offre par modules | principe décidé, reste proposé | Le meilleur document sur l'offre. Il recommande **la planification seule d'abord**, ce qui contredit la décision « écoles privées d'abord » |
| `moteur-planification/` (groupe A, non poussé) | 3-4 nov. | moteur unique, profils par type d'école | décidé le 4 nov. | Réponse directe au vocabulaire du scolaire : profils primaire, collège, lycée, formation |
| `conception-socle-neutre-groupe-b.md` | 3 nov. | apparence neutre, état « en configuration » | fusionné (#150) | Base de l'assistant et du registre de modules |
| `docs/etude-marche/` | 4 nov. | concurrents, douleurs, marketing | fusionné (#151) | Base des priorités produit et de la campagne |
| Plans d'octobre : `assainissement`, `espace-enseignant`, `quiz-ia`, `remarques-par-profil`, `studio-quiz`, `retours-2026-10-21`, `plan-groupe-b-2026-10-22` | 10-22 oct. | HESTIM | « à faire », « en cours » ou « à valider » | Leurs statuts ne sont plus tenus à jour. Une partie est faite, une partie dépassée |
| `espace-de-cours`, `jeux-pedagogiques` | 15-16 oct. | HESTIM, équipe jeux | fait ; contrat en vigueur | à garder |

### Ce que ces plans ont en commun

1. **Il n'y a pas de plan produit.** Les plans décrivent des lots techniques (ME-, EC-, R-, M-), ou bien une stratégie commerciale (`plan.txt`). Aucun document ne relie un **module vendu** à ses **fonctions**, à ses **lots** et à ce qui **existe déjà dans le code**.
2. **Trois ordres de priorité coexistent** :
   - le plan 15 commence par une école pilote sur sa propre installation ;
   - le groupe A propose la planification seule, puis le supérieur, puis l'école complète ;
   - le chef de projet a décidé : plusieurs écoles sur une même installation d'abord, les écoles privées comme cible, puis la formation professionnelle.

   Le plan proposé (fichier 3) part de la décision du chef de projet et reprend ce qui est juste dans les deux autres.
3. **Le scolaire n'a pas de modèle de données.** Classe, matière, responsable légal, note, bulletin, frais, année scolaire n'existent nulle part. Le fichier 04 (modèle de données) décrit le supérieur multi-établissements.
4. **Le parent n'existe pas comme utilisateur.** Aucun plan ne le décrit. Les rôles sont administration, responsable de filière, enseignant, étudiant.
5. **Aucune mesure de réussite produit.** Pas de critère du type « une école de 300 élèves est en service en moins d'une journée » ni « un directeur voit les impayés du mois en un écran ». Les critères existants sont techniques (tests verts).
6. **Les statuts vieillissent.** Il faut un seul tableau de suivi, tenu à jour à chaque fusion.

## 2.2 Comment les SaaS du même type sont conçus

Lus sur les sites des éditeurs et leur documentation, le 5 novembre. Les détails des concurrents marocains et des avis d'utilisateurs sont dans `docs/etude-marche/01-concurrents.md`.

| Produit | Comment le produit est découpé | Ce qu'on en retient |
| --- | --- | --- |
| **Untis / WebUntis** | Un **paquet de base** (emploi du temps, remplacements, réservations, cahier de textes numérique), puis des modules ajoutés : journées parents-professeurs, messagerie, application. Le générateur reste un logiciel à part ([Untis](https://www.untis.at/en/products/webuntis), [remplacements](https://www.untis.at/en/products/webuntis/online-substitution-planning)) | La **séance planifiée** est le centre ; tout le reste s'y accroche. Les remplacements sont proposés automatiquement |
| **EduPage (aSc)** | Emploi du temps et remplacements → cahier de textes qui reflète les changements → absences avec alerte aux parents → notes avec notification immédiate → frais et cantine ([EduPage](https://edupage.org/)). Plusieurs fonctions exigent le générateur aSc | Même colonne vertébrale. Chaque module **prévient le parent** au moment où la donnée naît. Le générateur est la porte d'entrée commerciale |
| **Odoo** | Un module déclare ses **dépendances** dans son manifeste. Elles s'installent d'abord, la base est toujours présente, et des « modules de liaison » s'installent seuls quand deux modules sont présents (exemple : `sale_crm`) ([documentation](https://www.odoo.com/documentation/saas-17.4/fr/developer/reference/backend/module.html)) | Le modèle du **registre de modules** : dépendances déclarées, socle toujours là, liaisons automatiques (exemple : « Notes × Parents » s'active seul si les deux modules sont achetés) |
| **Classter** | Socle plus modules, facturés par élève ; la mise en place configure la **terminologie** de l'établissement ([Zoftware](https://zoftwarehub.com/products/classter/zoftware-analysis)) | Le vocabulaire se règle par école, il ne se code pas. Ses utilisateurs reprochent des réglages initiaux lourds |
| **OpenEduCat** | Modules Odoo, un par fonction (cours, examens, frais, emploi du temps) | Couverture large, mais « pas prêt à l'emploi » selon ses utilisateurs : la largeur ne remplace pas la mise en route |
| **Skoolly, Schoolz, Scoliance** | Socle commun, paliers d'effectif, toutes fonctions incluses ou trois offres ; mise en route accompagnée en 48 h | Au Maroc, l'école achète d'abord **frais, parents, absences, bulletins, arabe**. L'emploi du temps est secondaire et saisi à la main |

### Les principes de conception qui ressortent

1. **Une colonne vertébrale, des modules autour.** Pour Untis et EduPage, c'est la séance (planifiée, tenue, modifiée). Pour les ERP marocains, c'est l'élève et sa famille (inscription, frais, absences, notes). Un ERP scolaire complet a besoin des deux, et les relie par la **classe**.
2. **Le socle n'est jamais vendu seul.** Comptes, établissement, élèves, classes, enseignants, matières et salles sont inclus partout. Le groupe A arrive à la même conclusion.
3. **Les dépendances sont déclarées et vérifiées** par le registre, et les liaisons entre modules s'activent seules.
4. **Chaque module livre trois choses** : l'écran de l'administration, la vue de l'enseignant, et ce que voit le parent ou l'élève.
5. **La mise en route fait partie du produit**, avec import, modèles et assistant. C'est la première plainte des utilisateurs d'OpenEduCat, de Classter et d'Odoo.
6. **Le vocabulaire et les règles se règlent par école** (profil, pays). Ils ne se codent pas.
