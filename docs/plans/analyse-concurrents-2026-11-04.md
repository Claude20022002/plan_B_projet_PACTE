# Analyse des concurrents, 4 novembre 2026

Groupe B, à la demande du chef de projet. Onze applications comparées à Planner avant de le commercialiser : Odoo, OpenEduCat, Fedena, Classter, Skoolly, iLimo, Eduzaas, Scoliance, Schoolz, Caisso Scolarité, aSc Timetables.

**Méthode et limites** : lecture des sites des éditeurs le 3 et le 4 novembre 2026 (pages d'accueil, tarifs, fonctions), complétée par des comparateurs (Capterra, Software Advice, G2) quand l'éditeur ne publie rien. Ce sont des affirmations commerciales : aucun produit n'a été essayé, aucun chiffre de clientèle n'est vérifié. Les tableaux de bord des sites marocains montrent des données de démonstration, pas des clients. Les sources sont en fin de document.

## 1. Trois familles de produits

| Famille | Produits | Ce qu'ils vendent d'abord |
| --- | --- | --- |
| **Gestion d'école privée marocaine** | Skoolly, Schoolz, iLimo, Scoliance, Caisso Scolarité, Eduzaas (multi-pays, page Maroc en MAD) | encaissement des frais et impayés, application des parents, absences, bulletins, transport, cantine ; emploi du temps secondaire |
| **ERP éducatif international** | Odoo (ERP général), OpenEduCat (bâti sur Odoo), Fedena, Classter | couverture large (admissions, finances, RH, LMS) ; emploi du temps de base ou générateur peu détaillé |
| **Spécialiste de l'emploi du temps** | aSc Timetables | génération automatique, remplacements, publication ; 30 ans d'existence, « 200 000 écoles » revendiquées |

Planner n'appartient à aucune de ces familles : c'est un **planificateur sous contraintes** (solveur Timefold, règles dures et souples) prolongé par la vie de la séance (reports validés, publication, appel, quiz, changements notifiés). Son concurrent direct par la fonction est aSc. Les produits marocains sont ses concurrents **par le client** : l'école privée qui n'a qu'un budget logiciel.

## 2. Fiche par produit

| Produit | Éditeur, pays | Cible | Emploi du temps | Prix publié | Mise en route |
| --- | --- | --- | --- | --- | --- |
| **Skoolly** | Maroc | écoles privées | saisie « intuitive », salles et enseignants ; pas dans l'offre d'entrée ; génération non annoncée | 4, 5 ou 6 DH par élève et par mois (Starter ≤ 100 élèves, Pro, Élite) ; −10 % à l'année ; WhatsApp facturé à part | compte gratuit, import CSV/Excel, configuration accompagnée, essai 30 j sans carte |
| **Schoolz** | ThinkWeb SARL, Fès | écoles privées, crèches | calendrier à glisser-déposer, récurrence, **détection des conflits** avant publication ; pas de génération | à partir de 500 MAD/mois (≤ 100 élèves), 900 (≤ 300), 1 400 (≤ 500), devis au-delà ; tout compris | installation et formation offertes, démo de 30 min |
| **iLimo** | Rabat | écoles privées | « emplois du temps visuels par classe » ; génération non annoncée | sur devis (élèves, modules, durée) | 48 h en moyenne, import accompagné, formation |
| **Scoliance** | Maroc | écoles privées (élèves et étudiants) | « générez et publiez vos EDT en quelques clics », sans détail | 400 DH HT/mois (≤ 100), 700 (≤ 500), 1 500 (≤ 1 000, multi-établissement, marque propre) ; +50 élèves : 50 DH | « déployez en 48 h » |
| **Caisso Scolarité** | Caisso, Rabat (éditeur de caisses enregistreuses) | écoles privées | annoncé **généré automatiquement**, en français et en arabe ; sans détail | 700 DH HT **par an** (prix de lancement, 1 600 ensuite) ou 150 DH/mois ; 1 300 / 2 900 DH par an pour l'offre avancée | import des listes MASSAR, formation d'une heure, sans frais d'installation |
| **Eduzaas** | Nastronics, multi-pays | toutes écoles, de la crèche au lycée | non mentionné | 2 790 MAD/an (≤ 300 élèves), 7 790 (≤ 1 500), 19 490 (illimité) | « opérationnel le jour même », migration Excel offerte, essai 14 j |
| **Odoo** | Odoo SA, Belgique | entreprises | **aucune application école** ; « Planning » sert aux horaires du personnel ; modules école de tiers (OpenEduCat, etc.) | par utilisateur et par mois en US$ (Standard autour de 9 à 11 US$, Custom autour de 16 à 20 US$) ; une application gratuite | mise en place vendue à part (Success Packs, partenaires) |
| **OpenEduCat** | OpenEduCat, Inde | primaire à université | assistant « Generate Timetable » par promotion ; contrôles : double réservation d'enseignant, capacité de salle, chevauchements, indisponibilités ; remplacements | édition libre (LGPL v3) ; modules à partir de 79 $/an chacun, paquets d'utilisateurs, pas de prix par élève | essai 15 j ; mise en place et formation vendues |
| **Fedena** | Foradian, Inde | écoles et instituts, surtout en Inde | saisie manuelle ; **générateur automatique** dans l'offre Ultimate (préférences de placement, pas de conflit d'enseignant) | 999, 1 399, 1 699 $/an, utilisateurs illimités ; code source en Enterprise | reprise des données et formation incluses, essai 14 j |
| **Classter** | Classter, Grèce | primaire, supérieur, centres de formation | « horaires flexibles », sans mode de génération décrit ; une intégration avec aSc est citée par un comparateur | par élève et par module, sur devis ; exemple publié : socle à 8,50 € par élève et par an | audit, migration, hébergement, formation |
| **aSc Timetables** | Applied Software Consultants, Slovaquie | écoles du monde entier | **générateur automatique** (référence du marché), remplacements avec suggestion d'enseignant, réservation de salles, publication web et mobile, assistant IA ; en ligne et sur Windows hors ligne | sur demande ; essai complet illimité (sans export, impressions filigranées) : on paie une fois satisfait | pas d'assistant d'installation décrit |

## 3. Ce que le marché tient pour acquis

Ce que presque tous annoncent, et qu'un acheteur marocain demandera dès la démonstration :

1. **Essai gratuit sans carte** (14 à 30 jours), **démonstration de 30 minutes**, **mise en route en un à deux jours** avec import Excel accompagné et formation offerte.
2. **Français et arabe** à l'écran et sur les documents (reçus et bulletins bilingues chez Caisso et iLimo) ; **darija** pour l'assistance WhatsApp (Skoolly, Schoolz, Caisso).
3. **Application des parents**, notifications et **WhatsApp**.
4. **Encaissement des frais**, échéanciers et relances d'impayés : c'est le cœur de l'offre des six produits marocains.
5. **MASSAR** : import des listes ou export des notes et absences au format du ministère (iLimo, Caisso).
6. **Données hébergées au Maroc**, loi 09-08 et déclaration CNDP (Schoolz, iLimo) : rejoint Q-23 du plan.

## 4. Où Planner se distingue, où il est absent

| | Planner | Produits marocains | ERP internationaux | aSc |
| --- | --- | --- | --- | --- |
| Génération sous contraintes dures et souples | **oui** (Timefold, versions réactivables) | non, sauf Caisso (sans détail) | OpenEduCat, Fedena Ultimate (contraintes peu décrites) | **oui** |
| Structure du supérieur : CM/TD/TP, groupes emboîtés, cours mutualisés, vacataires | **oui** | non | en partie | en partie |
| Plusieurs campus, temps de trajet | **oui** | non | non annoncé | non annoncé |
| Report demandé par l'enseignant, validé, notifié ; publication des changements | **oui** | non | remplacements | remplacements |
| Appel, quiz, jeux, espace de cours | **oui** | appel, cahier de textes | LMS | registre de classe (EduPage) |
| Frais, caisse, impayés | **non** | **oui** | oui | non |
| Application des parents, transport, cantine | **non** | **oui** | oui | non |
| Arabe à l'écran | **non** (français, anglais) | **oui** | à vérifier | oui (multilingue) |
| MASSAR | **non** | iLimo, Caisso | non | non |

## 5. Prix : Planner est au-dessus du marché marocain

La référence de travail est 9,99 MAD HT par étudiant actif et par mois (présentation du 25 octobre, en attente de l'accord d'une école pilote). Ramenés au même étalon :

| Produit | MAD HT par élève et par mois (calcul) |
| --- | --- |
| Skoolly | 4 à 6 |
| Schoolz | 5 (100 élèves) à 2,8 (500 élèves) |
| Scoliance | 4 (100 élèves) à 1,4 (500 élèves) |
| Eduzaas | 0,8 (300 élèves) à 0,4 (1 500 élèves) |
| Caisso Scolarité | 0,6 pour 100 élèves au prix de lancement (prix par établissement et par an : moins encore au-delà) |
| Classter (socle seul, exemple publié) | environ 7,7 (8,50 € par an) |
| **Planner** | **9,99** |

Pour une école privée de primaire ou de collège, Planner coûterait de deux à plus de quinze fois plus cher que des produits qui encaissent ses frais et parlent arabe. Le prix ne se défend que là où l'emploi du temps est **difficile** : enseignement supérieur privé, écoles d'ingénieurs et de commerce, groupes TD/TP, vacataires, plusieurs campus. C'est justement là que les produits marocains ne vont pas.

## 6. Conséquences proposées

Recommandations du groupe B, à trancher par le chef de projet :

1. **Positionnement** : Planner se vend comme **le planificateur du supérieur privé** (et des grands lycées à options), pas comme un logiciel de gestion d'école de plus. Il s'**intègre** aux logiciels de frais existants (import et export Excel, MASSAR) au lieu de les remplacer : c'est le modèle d'aSc avec Classter.
2. **Le prix suit le positionnement** : garder 9,99 pour le supérieur, ou prévoir une offre « emploi du temps seul » nettement plus basse pour le secondaire. À rapprocher du fichier 13 avant toute présentation.
3. **L'arabe devient une exigence** pour le Maroc : interface en arabe, donc mise en page de droite à gauche. Le thème neutre en cours de conception doit le prévoir dès maintenant (propriétés logiques CSS, icônes miroir, chiffres). Ajouté aux questions ouvertes de `conception-socle-neutre-groupe-b.md`.
4. **La mise en route est un argument de vente** : l'objectif de l'assistant (moins de 30 minutes hors données, § 5.2) est meilleur que les « 48 heures » affichées. Il faut le chronométrer (ME-10) puis l'annoncer. Ajouter un **essai gratuit sans carte** à l'offre.
5. **MASSAR** : un import des listes d'élèves au format MASSAR est un petit lot (ME-9) qui lève une objection fréquente au Maroc.
6. **À ne pas faire maintenant** : encaissement des frais, transport, cantine. Ce sont des produits entiers, déjà bien servis et bon marché.

## Sources

- Skoolly : [skoolly.ma](https://skoolly.ma/), [tarifs](https://skoolly.ma/tarifs), [App Store](https://apps.apple.com/ma/app/skoolly/id6768355092)
- Schoolz : [schoolz.ma](https://schoolz.ma/), [tarifs](https://schoolz.ma/tarifs/)
- iLimo : [ilimo.ma](https://ilimo.ma/)
- Eduzaas : [eduzaas.com](https://eduzaas.com/)
- Scoliance : [scoliance.com](https://scoliance.com/)
- Caisso : [caisso.ma](https://caisso.ma/), [tarifs écoles](https://caisso.ma/tarifs/ecoles/)
- Odoo : [tarifs](https://www.odoo.com/pricing), [applications](https://www.odoo.com/page/all-apps), modules école de tiers sur [apps.odoo.com](https://apps.odoo.com/apps/modules/19.0/do_school_timetable)
- OpenEduCat : [tarifs](https://openeducat.org/pricing), [emploi du temps](https://openeducat.org/feature-timetable-management-system/), [module Odoo](https://apps.odoo.com/apps/modules/19.0/openeducat_timetable)
- Fedena : [tarifs](https://fedena.com/pricing-and-plans), [emploi du temps](https://fedena.com/feature-tour/timetable-management-system), [modules Ultimate](https://fedena.com/feature-tour/ultimate-modules)
- Classter : [tarifs](https://www.classter.com/pricing/), [Academics & LMS](https://www.classter.com/product/modules/academics-and-lms/), [EdTech Impact](https://edtechimpact.com/products/classter)
- aSc Timetables : [asctimetables.com](https://www.asctimetables.com/), [tarifs](https://www.asctimetables.com/a/prices)
