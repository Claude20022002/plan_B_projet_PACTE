# Arguments pour la campagne marketing

4 novembre 2026, groupe B. Tirés de l'analyse des concurrents et des avis de leurs utilisateurs ([01-concurrents.md](01-concurrents.md), § 7), et du positionnement de `docs/ecole/plan.txt`. La recherche sur les problèmes des établissements ([rapport](<reports/Problèmes des établissements scolaires.md>)) le complète : messages fondés sur des faits publics, calendrier de campagne et sujets à proscrire (sections « Implications pour la campagne marketing »).

Règle de base : **on ne promet que ce qui existe déjà dans Planner, ou ce qu'on peut démontrer**. Chaque argument dit sur quoi il repose et ce qu'il faut encore prouver.

## 1. Les douleurs que les clients des concurrents expriment

Ce que les utilisateurs reprochent aux produits installés : ce sont les portes d'entrée de la campagne.

| Douleur exprimée | Chez qui | Ce que Planner peut y répondre |
| --- | --- | --- |
| « Pas prêt à l'emploi », mise en route lourde, « beaucoup de travail pour le rendre utilisable » | OpenEduCat, Classter, Fedena, Odoo | assistant de démarrage pas à pas, pages vides qui disent quoi faire (conception du socle neutre, N-12 à N-15) |
| Interface « datée », écrans vieillis | aSc, EduPage, OpenEduCat | interface neutre, plate, pensée d'abord pour le téléphone |
| Trop de fonctions, menus qui submergent | aSc, Classter, OpenEduCat | le menu ne montre que les modules activés par l'école |
| Application mobile lente, qui plante | EduPage (3,5/5 sur 39 100 avis), Fedena | application Expo existante ; la fiabilité reste à prouver (essai sur téléphone, ME-11) |
| Coûts cachés de mise en place, hausses au renouvellement | Odoo (« 250 $ de l'heure », « plus de 5 000 $ ») | prix public, mise en route incluse, hausse plafonnée au contrat (à décider) |
| Assistance lente ou injoignable | Fedena, Odoo | assistance par WhatsApp avec délai de réponse annoncé (à organiser) |
| Faux conflits, erreurs de génération | aSc | chaque refus de Planner dit quelle règle est enfreinte ; hiérarchie promotion › TD › TP déjà gérée |
| Double saisie entre le logiciel de l'école et MASSAR | écoles marocaines | import et export MASSAR (à construire, ME-9) |

## 2. Ce que Planner fait déjà et que les autres ne font pas

D'après le README de main et le menu du site (`frontend/src/components/layouts/navigation.jsx`) au 4 novembre 2026. Ce sont les seuls arguments utilisables aujourd'hui, sous réserve de les montrer en démonstration.

1. **Génération automatique sous contraintes** (solveur Timefold) : salles, enseignants, groupes, disponibilités, trajets entre campus, règles strictes et souples, versions réactivables. **Planner n'est pas le seul à l'annoncer** : au Maroc, cinq éditeurs annoncent une génération automatique, à savoir Acadelta, SchoolApp, Minassa, Tayssir et Caisso. Caisso la propose dans un ERP à 242 DH par mois. Aucun de ces produits n'a été essayé (benchmark du groupe A, `docs/plans/modele-economique/benchmark.md`, corrigé le 5 novembre). L'argument n'est donc pas « nous générons et les autres non ». Il est dans ce que la génération sait faire et qui se démontre : règles strictes et souples, CM, TD et TP, groupes emboîtés, plusieurs campus, reports. Aucune page lue ne décrit ces points chez les autres.
2. **Les cours, TD et TP et les groupes emboîtés** du supérieur, cours mutualisés, enseignants vacataires et leurs disponibilités.
3. **Le report de séance de bout en bout** : l'enseignant demande, la scolarité valide, les étudiants sont prévenus, le changement est publié.
4. **Plusieurs campus** avec temps de trajet.
5. **La vie de la séance** : appel, quiz en direct ou en devoir, annonces, espace de cours, réservation de salles, examens et surveillances.
6. **Une seule connexion** pour Planner, la bibliothèque et les jeux.

## 3. Messages possibles

À tester en entretien avec des directeurs avant de les imprimer.

| Pour qui | Message | Preuve à montrer |
| --- | --- | --- |
| Direction | « Votre emploi du temps du semestre en quelques minutes, sans conflit de salle ni d'enseignant. » | démonstration chronométrée de la génération sur l'école fictive |
| Scolarité | « Un report demandé, validé et annoncé aux étudiants en trois clics. » | parcours de report en vidéo |
| Enseignant | « Votre semaine, vos changements et votre appel sur votre téléphone. » | captures de l'application |
| Étudiant, parent | « Le cours annulé ou déplacé, vous le savez avant de vous déplacer. » | notification et tableau du jour |
| Acheteur | « Installé en moins d'une heure par vous-même, sans consultant. » | **à prouver** : deux essais chronométrés avec des personnes extérieures (ME-10) |

## 4. Objections attendues

| Objection | Réponse honnête aujourd'hui |
| --- | --- |
| « Votre logiciel est-il en arabe ? » | non, français et anglais ; l'arabe est prévu (question ouverte de la conception) |
| « Vous gérez les frais et les paiements ? » | pas encore ; c'est un module prévu par `plan.txt` (School Fees, Payments) |
| « Vous êtes plus cher que Skoolly ou Schoolz. » | leurs pages ne montrent pas de génération automatique, seulement une saisie avec contrôle des conflits chez Schoolz ; la planification se vend aussi seule. Face à Caisso, Acadelta, SchoolApp, Minassa ou Tayssir, qui l'annoncent, il faut montrer la génération sur un cas réel |
| « Vous avez des clients ? » | une école en service (HESTIM) ; ne citer son nom qu'avec son accord |
| « Où sont mes données ? » | hébergement et conformité loi 09-08 à préciser (Q-23) ; Schoolz et iLimo l'affichent déjà |

## 5. À ne pas dire

- Aucun chiffre de clients, de note ou de satisfaction qu'on ne peut pas sourcer.
- Pas de « n° 1 », « le seul » ni « le meilleur » sans preuve.
- Pas de prix courant tant que la grille de `plan.txt` n'est pas validée. Les 4,99 et 5,40 MAD des anciens documents sont périmés.
- Pas de critique nommée d'un concurrent dans une publicité : la publicité comparative a ses règles au Maroc, à faire vérifier par le juriste.
- Pas de fonction annoncée comme disponible si elle est seulement prévue (arabe, frais, hors ligne, MASSAR).
