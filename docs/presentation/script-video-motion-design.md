# Script de la vidéo de présentation (lot V-1)

Rédigé le 11 octobre 2026. Il remplace `prompt-video-motion-design.md` (vidéo de 42 s) et le tableau des scènes de `video/README.md` (62 s) comme référence de ce que la vidéo raconte. Il suit `docs/plans/remarques-par-profil.md`, § 6.

**Statut : à valider par le chef de projet.** Le montage du 12 octobre 2026 (`video/out/matinee-ecole.mp4`, 1 min 15, et `matinee-ecole-9x16.mp4`, 40 s) suit ce script avec trois décisions prises ce jour-là, qui l'emportent sur les sections 2 à 4 ci-dessous :

- **Plus court** : 1 min 15 pour la salle (la durée décidée, au lieu de 1 min 54), 40 s pour les réseaux.
- **La scène 7 ne dit plus « Bientôt »** : elle présente les formes d'un quiz (en direct, avec un schéma, avec un extrait vidéo). Les deux dernières restent des maquettes ; la règle « des écrans réels, sauf une scène annoncée » ne s'applique donc plus à cette scène.
- **Une scène de plus : la bibliothèque de jeux pédagogiques** (scène 8), « par module, inspirés de ceux qui existent déjà ». Elle montre le seul jeu d'aujourd'hui, Terminal Linux.

- **Corrections du 13 octobre** : une seule promesse (« Votre emploi du temps accessible en un geste. »), une action à la dernière image, un vrai QR dans le scanner, plus de code sur l'écran du quiz, les téléphones à l'heure de l'histoire (13 h 32 à 15 h 20).

`video/README.md` donne le tableau des douze scènes et ce qui sépare encore le montage de ce script.

## 1. Ce qui change

| | Ancienne vidéo | Nouvelle vidéo |
|---|---|---|
| Forme | Une liste de fonctions | **Une seule histoire** : une matinée à l'école, vue par l'étudiante, le professeur, puis l'administration |
| Durée, salle | 62 s | **1 min 54** (228 temps à 120 BPM) |
| Durée, réseaux | 34 s et 29 s | **45 s**, vertical |
| Devoirs | Une scène « devoir noté » | **Retirés** : ils sont masqués dans l'application (lots D-1 et D-2) |
| Appel par QR | Une animation de texte | **Les vrais écrans** : le QR projeté, les présents qui apparaissent |
| Quiz | Les résultats seulement | Le quiz **en train de se jouer**, avec une question illustrée |
| Noms à l'écran | StudyLib, ClassQuiz | **Planner, Bibliothèque, Quiz, Activités** (règle de nommage, lot R-7) |

## 2. Règles de la vidéo

- **La promesse ouvre et ferme la vidéo.** Phrase proposée, à écrire avec vos mots : « L'emploi du temps, l'appel et les quiz d'une école, au même endroit. »
- **Planner et la Bibliothèque, deux questions.** Planner répond à « où et quand » ; la Bibliothèque (StudyLib en interne) répond à « avec quoi je travaille » : dépôt de ressources par module, modération, recherche, stages et retours d'expérience, projets. Ce n'est pas du calendrier : la vidéo dit que le produit couvre la **vie de l'étudiant**, pas seulement son emploi du temps.
- **Une seule connexion.** Planner est le fournisseur d'identité : le même compte ouvre Planner, la Bibliothèque et les quiz, sur le web comme dans l'application. À dire une fois, à la scène 9, sans entrer dans le détail technique.
- **Quatre rôles, un écran chacun.** Étudiant (surtout sur téléphone), enseignant (disponibilités, appel, quiz), responsable de filière (maquette, groupes, services), administration (calendrier, génération, imprévus, examens, suivi, paie des vacataires). Les scènes 3 à 10 montrent trois d'entre eux ; le responsable de filière tient en une phrase de sous-titre à la scène 10.
- **Lisible sans le son.** Chaque scène a un sous-titre, en français et en anglais. Aucune information n'est portée par la voix seule.
- **On sait toujours où l'on en est.** La durée est annoncée avant la lecture, et une barre de progression fine reste en bas de l'image.
- **Des écrans réels, sauf une scène.** La scène 7 montre des fonctions à venir : ses images sont des maquettes, et le mot **« Bientôt »** reste à l'écran pendant toute la scène.
- **Des données fictives.** Aucun vrai nom d'étudiant ou d'enseignant. Les comptes de démonstration viennent du jeu de données fictif.
- **Jamais l'adresse `finadmintech`** à l'image : ce n'est qu'un nom de domaine.
- **Le nom et le logo de HESTIM** dans la version publiée sur les réseaux demandent l'accord de l'école.
- **Rythme** : 120 BPM, un temps = 0,5 s, chaque coupe tombe sur un temps, comme dans le projet actuel.

## 3. Version pour la salle (16:9, 1 min 54)

| # | Temps | Durée | Ce qu'on voit | Sous-titre | Images |
|---|---|---|---|---|---|
| 1 | 0:00 | 6 s | Les douze triangles de l'emblème s'assemblent, puis le nom en volets | La promesse | Animation existante (`S1Intro`) |
| 2 | 0:06 | 8 s | Six outils éparpillés (messagerie, PDF, groupe de discussion…), barrés un à un | « Aujourd'hui, six outils qui ne se parlent pas. » | Animation existante (`S2Outils`) |
| 3 | 0:14 | 12 s | **7 h 40, l'étudiante.** Son téléphone : la prochaine séance, la semaine, puis le détail d'un cours | « Son emploi du temps arrive sur son téléphone. » | `mobile-38-tableau`, `mobile-33-semaine-grille`, `mobile-36-fiche-verre` |
| 4 | 0:26 | 8 s | Une alerte glisse en haut de l'écran : cours reporté | « Un report, une salle qui change : elle est prévenue. » | Scène existante (`S5Alerte`) |
| 5 | 0:34 | 16 s | **8 h 30, la salle.** Le professeur projette le QR code ; les téléphones scannent ; les présents apparaissent un à un ; il valide | « L'appel en une minute, sans fraude. » | À faire : appel projeté, scanner de l'application |
| 6 | 0:50 | 20 s | **9 h 10, le quiz.** Il le lance depuis sa séance ; la question et son schéma sont à l'écran de la salle ; sur les téléphones, quatre formes ; le compteur de réponses monte ; la bonne réponse s'allume | « Un quiz rattaché à la séance, sans code à saisir. » | À faire : « Mes classes », téléphone du joueur. Écran de la salle : `maquette-quiz-projecteur-illustration` en attendant le lot CQ-2 |
| 7 | 1:10 | 12 s | **Bientôt.** Deux téléphones côte à côte : le schéma sur le téléphone, puis un extrait vidéo avec le son, suivi de sa question | « Bientôt : le schéma et l'extrait vidéo, sur le téléphone de chacun. » | `maquette-quiz-mobile-illustration`, `maquette-quiz-mobile-video` |
| 8 | 1:22 | 8 s | Le classement de la classe, puis le résultat de l'étudiante | « Chacun voit où il en est. » | `web-21-resultats-enseignant`, `mobile-13-resultats` |
| 9 | 1:30 | 8 s | Les supports du cours dans la Bibliothèque ; le même compte ouvre Planner puis la Bibliothèque, sans nouvelle saisie | « Une seule connexion. Planner dit où et quand ; la Bibliothèque, avec quoi on travaille. » | `mobile-39-supports-module`, à refaire après R-7 |
| 10 | 1:38 | 10 s | **L'administration.** L'emploi du temps du mois, généré sans conflit ; la séance du matin apparaît faite | « Un emploi du temps sans conflit, préparé par les responsables de filière et suivi de bout en bout. » | `web-09-edt-mensuel` ; à faire : heures du mois |
| 11 | 1:48 | 6 s | L'emblème, le nom, « Web · iPhone · Android » ; dernière seconde immobile | La promesse | Animation existante (`S9Fin`) |

### La scène 6, en détail

C'est la scène qui dit le plus : elle montre ce qu'un professeur fait aujourd'hui avec un outil extérieur.

1. **0 à 4 s.** Le professeur ouvre sa séance et touche « Lancer un quiz ». Pas de second site, pas de reconnexion.
2. **4 à 12 s.** L'écran de la salle : la question, le schéma de la poutre, les quatre réponses. À côté, un téléphone : les quatre formes, et rien à lire. L'étudiant regarde l'écran et touche une forme.
3. **12 à 16 s.** Le compteur passe de 0 à 23 réponses sur 29.
4. **16 à 20 s.** La bonne réponse s'allume (30 kN·m) ; les trois autres s'éteignent.

### La scène 7, en détail

- Le mot « Bientôt » apparaît d'abord, seul, pendant une seconde.
- Premier téléphone : la même question que dans la scène 6, mais le schéma est maintenant sur le téléphone, avec les réponses écrites. C'est le quiz que l'étudiant fera seul, à son rythme.
- Second téléphone : un extrait de 45 secondes, image et son, puis sa question. L'onde sonore s'anime ; le sous-titre de l'extrait défile.
- Les deux exemples viennent de filières différentes, pour montrer que l'outil sert toute l'école : génie civil (résistance des matériaux) et achats et supply chain (logistique internationale).

## 4. Version pour les réseaux (9:16, 45 s)

L'accroche d'abord : la première image doit donner envie de rester.

| # | Temps | Durée | Scène | Reprise de |
|---|---|---|---|---|
| 1 | 0:00 | 8 s | L'appel par QR code, les présents qui apparaissent | Scène 5 |
| 2 | 0:08 | 12 s | Le quiz : la salle et le téléphone | Scène 6, sans son premier plan |
| 3 | 0:20 | 8 s | « Bientôt » : le schéma et l'extrait vidéo | Scène 7 |
| 4 | 0:28 | 6 s | L'alerte de report | Scène 4 |
| 5 | 0:34 | 6 s | L'emploi du temps sur le téléphone | Scène 3, un seul écran |
| 6 | 0:40 | 5 s | La promesse, le nom | Scène 11 |

Sous-titres incrustés, plus gros que dans la version pour la salle. Les écrans d'ordinateur sont recadrés sur leur partie utile : ils ne tiennent pas en entier dans un format vertical.

## 5. Les images

### Faites le 11 octobre : trois maquettes

Elles sont dans `captures/`, sous un nom qui commence par `maquette-`. **Ce ne sont pas des captures de l'application.** Leur source est dans `maquettes/` ; `scripts/capturer-maquettes.mjs` les rend de nouveau.

| Fichier | Format | Ce qu'elle montre | Ce qui existe aujourd'hui |
|---|---|---|---|
| `maquette-quiz-mobile-illustration.png` | 780 × 1688 | Une question avec un schéma, sur le téléphone | L'application n'affiche pas d'image dans une question |
| `maquette-quiz-mobile-video.png` | 780 × 1688 | Un extrait vidéo avec le son, puis sa question | L'application ne lit ni vidéo ni son dans une question |
| `maquette-quiz-projecteur-illustration.png` | 1920 × 1080 | La même question à l'écran de la salle | Le quiz projeté affiche déjà l'image d'une question ; l'écran du projecteur dans Planner (lot CQ-2) n'est pas fusionné |

Les deux questions sont justes : une poutre sur deux appuis chargée en son milieu a pour moment maximal F·L/4, soit 20 × 6 / 4 = 30 kN·m ; l'incoterm par lequel le vendeur a livré dès que la marchandise est à bord du navire est FOB.

### À garder

`mobile-38-tableau`, `mobile-33-semaine-grille`, `mobile-36-fiche-verre`, `mobile-13-resultats`, `web-09-edt-mensuel`, `web-21-resultats-enseignant`. À revoir une à une avant le montage : elles datent d'avant le 10 octobre.

### À ne plus utiliser

- **Les devoirs** : `mobile-28`, `mobile-29*`, `web-23` à `web-27`.
- **Les anciens noms** : toute capture qui affiche « StudyLib », « ClassQuiz » ou « HESTIM Quiz » (`web-13` à `web-15`, `mobile-11`, `mobile-35`, les thèmes `*-studylib-*`).

### À faire, une fois D-1 et R-7 fusionnés

Les faire avant figerait des écrans qui vont encore changer : c'est la raison pour laquelle le lot V-1 attend ces deux lots.

| Image | Écran | Dépend de |
|---|---|---|
| Appel projeté | `/appel/:id/projection`, avec quelques présents | Rien |
| Scanner de l'application | L'onglet Scanner, devant le QR | Rien |
| « Mes classes » et le bouton « Lancer un quiz » | Site, sur téléphone | D-1, R-7 |
| Téléphone du joueur | Les quatre formes pendant une question | Rien |
| Écran de la salle | Le projecteur dans Planner | CQ-2 |
| Supports du cours | La Bibliothèque de l'application | R-7 |
| Heures du mois | La séance faite, les séances « à vérifier » | R-11, côté écran |

## 6. Ce qu'il reste à décider

- **La durée** : 1 min 54 pour la salle et 45 s pour les réseaux conviennent-elles ?
- **La promesse** : la phrase de la scène 1.
- **La scène 7** : montrer des fonctions à venir dans une vidéo de présentation est un choix. Elle peut aussi sortir de la version pour la salle et ne rester que dans un second montage.
- **La bande-son** : `video/scripts/composer-musique.py` suit les durées des scènes ; elle se recompose seule une fois les scènes remontées.
