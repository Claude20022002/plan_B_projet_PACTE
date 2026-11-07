# Préparer la rencontre avec le directeur d'une école privée

4 novembre 2026, groupe B. Le chef de projet connaît le directeur d'une école privée qui va de la maternelle au lycée. La rencontre aura lieu dans 3 à 6 semaines. Elle sert aussi de premier entretien de terrain (plan d'entretiens du rapport, ligne « directeurs et fondateurs d'écoles privées »).

## Décisions du chef de projet (4 novembre)

| Sujet | Décision |
| --- | --- |
| Objectif | **Écouter, puis montrer.** Recueillir ses vrais problèmes, lui montrer la vision et ce qui existe, puis lui demander s'il veut être école pilote. |
| Livrables | Une **présentation courte** et une **démonstration sur une école fictive** de la maternelle au lycée. |
| Pas demandé | Guide d'entretien séparé, fiche d'une page. Les questions à poser seront intégrées à la présentation ou au scénario. |

## Ce qui bloque la démonstration

Le référentiel de Planner est écrit pour le supérieur. Il est fixé dans `backend/config/referentiel.js` et dans les colonnes à liste fermée des modèles :

| Notion | Valeurs possibles aujourd'hui | Ce qu'il faudrait pour une école de la maternelle au lycée |
| --- | --- | --- |
| Cycle (`Filiere.cycle`) | prépa, licence, ingénieur, master, executive | maternelle, primaire, collège, lycée |
| École (`Filiere.ecole`) | engineering, business | sans objet ou « général » |
| Composante d'un enseignement (`CoursComposante.type`) | CM, TD, TP, projet | cours (et TP en sciences, demi-groupes de langue) |
| Niveau de groupe (`Groupe.type_groupe`) | promotion, td, tp | niveau (6e), classe (6e A), demi-groupe |
| Année | « année universitaire » | année scolaire |
| Textes des écrans | filière, module, groupe de TD, vacataire | cycle, matière, classe, professeur principal |

Montrer Planner tel quel à un directeur d'école obligerait à traduire chaque écran à voix haute (« ici, TD veut dire classe »). Cela affaiblit la démonstration et contredit l'objectif « une école se configure seule ».

C'est le cœur du lot **ME-2a** du plan (nomenclatures propres à chaque école), confié au groupe A et estimé L. Une version réduite suffit pour la démonstration.

## Options pour la démonstration

| Option | Contenu | Avantages | Limites |
| --- | --- | --- | --- |
| **A. Adapter le vrai produit** (recommandée) | Nomenclatures minimales (cycles du scolaire, composante « cours », niveaux « classe » et « demi-groupe »), textes des écrans selon le type d'établissement, école fictive dans les données de démonstration, génération de l'emploi du temps du collège et du lycée | C'est le premier pas vers la cible décidée (écoles privées) ; on montre un vrai emploi du temps généré ; le travail sert ensuite à toutes les écoles | Touche le serveur (référentiel, migration) : accord et relecture du groupe A nécessaires ; environ 2 à 3 semaines |
| B. Maquettes cliquables | Parcours du directeur, de la scolarité et des parents en HTML, comme les maquettes du socle neutre | Rapide (environ 1 semaine), aucun risque sur le code | Ce n'est pas le produit ; la génération de l'emploi du temps n'est pas réelle |
| C. Produit tel quel | Démonstration sur les données du supérieur, en expliquant la transposition | Aucun travail | Vocabulaire étranger au directeur ; mauvaise première impression |

## Calendrier proposé (option A)

| Semaine | Travail |
| --- | --- |
| 1 | Conception (document `conception-demo-ecole-privee-groupe-b.md`) : correspondance des notions, textes par type d'établissement, contrat proposé au groupe A, école fictive ; brouillon de la présentation |
| 2 et 3 | Nomenclatures minimales et textes (avec le groupe A pour le serveur), données de l'école fictive, réglage du solveur sur une semaine de collège et de lycée |
| 4 | Scénario de démonstration de 10 minutes, répétition chronométrée, captures pour la présentation |
| 5 et 6 | Marge ; rencontre |

## Ce que la démonstration montrera (proposition)

1. L'école se présente : son nom, son logo, ses couleurs, appliqués en direct (thème neutre).
2. Les classes de la 6e à la terminale, les matières et les professeurs.
3. **L'emploi du temps du collège généré** : salles, professeurs, demi-groupes de langue, aucune collision.
4. Un changement : un professeur absent, une séance déplacée, les familles prévenues.
5. L'appel en un geste sur téléphone.
6. Ce qui vient ensuite, annoncé comme **prévu et non disponible** : frais et reçus, espace parents, Massar, arabe.

## Ce qu'on demandera au directeur (proposition)

Tiré du plan d'entretiens du rapport, ligne « directeurs et fondateurs d'écoles privées » :
- heures par semaine consacrées à l'administratif, et par qui ;
- comment se construit l'emploi du temps, combien de temps cela prend, ce qui casse en cours d'année ;
- impayés : taux et délai moyen, part des espèces, chèques et virements ;
- outils actuels et ressaisie dans Massar ;
- communication avec les parents : canaux, volume, plaintes ;
- budget logiciel, critères de choix, raisons d'un éventuel changement ;
- conditions pour être école pilote.

## Questions ouvertes

1. Option A, B ou C pour la démonstration ? Si A, accord du groupe A sur une version réduite de ME-2a.
2. Nom de l'école fictive (question 1 du socle neutre).
3. Profil de l'école du directeur, s'il est connu : ville, effectifs par cycle, langues, outils actuels. Cela permet d'ajuster l'école fictive pour qu'elle lui ressemble.
