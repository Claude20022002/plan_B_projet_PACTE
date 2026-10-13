# Plan : comptes de démonstration, supports de classe, jeux et illustrations

Statut : **à lancer**. Rédigé le 13 octobre 2026, à la demande du chef de projet.

## 1. Objectif

Montrer, sans toucher aux vraies classes, tout ce qui se passe entre un enseignant et ses étudiants : lancer un quiz ou un jeu, faire l'appel, déposer un support de cours, demander un report, recevoir le rappel de l'appel. Pour cela :
- des comptes de démonstration ;
- un dépôt de supports par classe, comme sur Moodle ;
- dix jeux dans la page Activités ;
- des illustrations libres de droits.

## 2. Décisions prises (13 octobre 2026)

| Sujet | Décision |
|---|---|
| Comptes de test | **Classe de démo dédiée** : un super enseignant et un super étudiant dans une classe « DÉMO », avec des séances tous les jours, plus un super administrateur. Les vraies classes ne sont pas touchées. |
| Supports de cours | Une fois sa classe choisie (Mes classes), l'enseignant a une **section de dépôt propre à cette classe**. Ce qu'il y dépose apparaît dans la **bibliothèque de l'application des étudiants de la classe**, rangé par module. |
| Jeux | **Mélange** : 6 formats génériques construits par l'équipe (l'enseignant les remplit avec son cours) et 4 jeux libres de spécialité informatique, adaptés comme Terminal Quest. |
| Illustrations | **CC0 seulement** : Kenney (déjà utilisé), Open Peeps, Open Doodles. Aucune attribution obligatoire. |

## 3. Existant sur lequel on s'appuie

- **Démonstration** : `deploy/vps/demo/demo-enseignant.mjs` crée déjà :
  - un compte enseignant à mot de passe aléatoire ;
  - le groupe « IIIA-4 DÉMO NoSQL » et ses étudiants de test ;
  - le service sur le module ;
  - des séances sur deux semaines, chacune dans une salle libre (aucun conflit).
  Le script peut être relancé, et `RESET=1` remet l'appel du jour à zéro.
- **Supports** : StudyLib range les documents par module (`Module.code`).
  - Planner y mène depuis Mes classes (« Supports du cours », `partagerSupport`).
  - L'application lit les supports d'un module (`chargerSupports`).
  - Il manque le lien à une **classe** et le dépôt sans modération par l'enseignant de la classe.
- **Jeux** : `shared/jeux/catalogue.js` décrit les jeux, aujourd'hui Terminal Linux seul. Un jeu = une entrée du catalogue, son moteur dans `shared/<jeu>/`, son écran sur le web et sur le mobile. Le serveur valide la progression.
- **Rappel de l'appel** : déjà envoyé à l'enseignant quand une séance se termine sans appel validé.

## 4. Lots

Répartition et règles du 11 octobre :
- le groupe A a `backend/`, `deploy/` et les migrations ;
- le groupe B a `frontend/`, `mobile/` et `shared/` ;
- StudyLib n'avait aucun lot : les lots S y ouvrent une branche par lot.

### D-1 · Super comptes et classe de démo (A)
Script `deploy/vps/demo/demo-complete.mjs`, relançable, qui reprend `demo-enseignant.mjs` :
- **super administrateur**, **super enseignant** et **super étudiant**, à mots de passe aléatoires écrits sur la sortie standard (règle A-2 : aucun mot de passe dans le code) ;
- classe « DÉMO HESTIM » avec **trois modules**, pour voir le rangement par module dans la bibliothèque, et quelques étudiants de test en plus du super étudiant ;
- **une séance à chaque créneau de chaque jour ouvré**, sur deux semaines, dans une salle libre. Pendant la journée, une séance est donc toujours en cours : appel, quiz et jeux se testent à toute heure ;
- `RESET=1` remet à zéro l'appel du jour, les reports en cours et les parties.

Vérification : le parcours de démonstration ci-dessous se déroule de bout en bout.

### S-1 · Supports d'une classe dans StudyLib (StudyLib)
- Un document reçoit une **classe** facultative : le groupe de Planner, par son identifiant.
- Un document déposé par l'enseignant de la classe, par la route signée de S-2, est publié **sans modération**.
- Une route lit les supports d'un étudiant : ceux des classes de ses groupes et groupes parents, **rangés par module**.

### P-1 · Dépôt depuis Planner (A, puis B)
- **A** : route `POST /api/classes/:module/:groupe/supports`, réservée à l'enseignant de la classe. Elle transmet le fichier à StudyLib par requête signée, comme pour les quiz. Une route liste et retire les supports de la classe.
- **B** : dans Mes classes, la carte de la classe ouvre la **section « Supports de la classe »** : déposer (fichier, titre), liste, retrait.

### M-1 · Bibliothèque de l'étudiant (B, application)
- Onglet Bibliothèque : une section **« Mes cours »** en tête, les supports de mes classes rangés par module (S-1).

### J-1 à J-6 · Formats de jeu génériques (A pour le stockage, B pour les écrans)
L'enseignant remplit un format avec le contenu de son module ; ses étudiants y jouent sur le web et dans l'application. Les formats :
1. associer ;
2. mémoire ;
3. remettre dans l'ordre ;
4. vrai ou faux chronométré ;
5. texte à trous ;
6. trier par catégorie.

Pour chaque format :
- un moteur pur dans `shared/jeux/formats/`, testé ;
- un écran web et un écran mobile ;
- un formulaire de contenu pour l'enseignant ;
- côté serveur, une table des contenus (migration) et la validation des scores.

### J-7 à J-10 · Jeux libres de spécialité (B)
Quatre jeux informatiques sous licence permissive, à vérifier avant tout import : MIT, BSD, Apache ou CC0, licence lue dans le dépôt d'origine et citée dans `jeux.source`. Candidats à vérifier : SQL Murder Mystery (SQL), Learn Git Branching (Git), Elevator Saga (algorithmique JavaScript), et un jeu de réseaux ou d'expressions régulières. Un jeu sans licence claire est écarté.

### I-1 · Illustrations (B)
- Illustrations CC0 dans `frontend/public/img/illustrations/` et `mobile/assets/illustrations/` : pages vides, en-têtes de la page Activités, carte de chaque jeu, écran de bienvenue.
- Un fichier `SOURCES.md` donne l'origine de chaque image.
- Teinte marine HESTIM là où le format le permet (SVG).

## 5. Ordre

1. D-1 : il sert à tester tout le reste.
2. S-1, puis P-1, puis M-1.
3. I-1.
4. J-1 à J-6 (un format par PR).
5. J-7 à J-10.

V-5 (style de PlannerQuiz) continue en parallèle.

## 6. Parcours de démonstration (recette)

1. Le super administrateur se connecte : tableau de bord, « À traiter ».
2. Le super enseignant se connecte :
   - la séance en cours de la classe DÉMO est en tête du tableau ;
   - il lance un quiz en direct, que le super étudiant rejoint depuis l'application ;
   - il fait l'appel par QR code, que le super étudiant scanne ;
   - il dépose un support dans « Supports de la classe » : le super étudiant le voit dans sa bibliothèque, sous le bon module ;
   - il propose un jeu, auquel le super étudiant joue.
3. Le super enseignant demande un report ; le super administrateur l'accepte ; le super étudiant voit le changement.
4. À la fin d'une séance sans appel, le super enseignant reçoit le rappel.
