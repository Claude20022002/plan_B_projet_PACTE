# HESTIM Planner — déroulé de la présentation (3 minutes)

Déroulé conseillé : la vidéo d'ouverture (36 s), puis trois slides. Les temps sont cumulés.
Les phrases sont écrites pour être dites, pas lues : garde les chiffres en tête, le reste peut varier.

---

## 0:00 – 0:36 · Vidéo d'ouverture

Lancer la vidéo sans rien dire. Laisser la dernière image (l'adresse du site) à l'écran pendant que tu prends la parole.

## 0:36 – 1:10 · Slide 1 — Le problème

> « Chaque mois, HESTIM publie un nouvel emploi du temps. Il est préparé à la main, dans des tableurs, puis envoyé en PDF. Quand un cours est reporté, l'information circule par WhatsApp, et certains l'apprennent devant une salle vide.
>
> Les supports de cours sont éparpillés entre Drive et les groupes de discussion. Les quiz passent par des sites extérieurs, Kahoot ou Wooclap, et les résultats sont perdus.
>
> Bref : tout existe, mais rien ne se parle. »

## 1:10 – 2:25 · Slide 2 — La solution (et la démo)

> « HESTIM Planner réunit tout cela dans une seule plateforme.
>
> **Un : le semestre se construit tout seul.** Un solveur d'optimisation, Timefold, place les cours en respectant toutes les règles de l'école : disponibilités des enseignants, salles, campus Gandhi et Stendhal, pause du vendredi, Ramadan. Sur le serveur en ligne, en 90 secondes, il a placé 261 enseignements et déployé 2 620 séances sur le semestre, et il signale lui-même ce qui reste à arbitrer.
>
> **Deux : chacun voit sa journée en temps réel.** L'écran s'inspire des panneaux d'aéroport : la prochaine séance, la salle, et les changements en orange. Sur mobile, l'étudiant reçoit une notification au moindre report.
>
> **Trois : une seule connexion pour tout.** Les supports du cours s'ouvrent depuis la séance, et l'enseignant lance un quiz en un clic : ses étudiants sont prévenus et rejoignent la partie sans saisir de code. »

*Si le temps le permet (20 s) :* montrer sur ton téléphone l'écran **Jeux**, ou ouvrir `planner.finadmintech.fr` en direct.

## 2:25 – 3:00 · Slide 3 — Ce que ça change

> « Pour la scolarité, des heures gagnées chaque mois et un emploi du temps sans conflit. Pour les enseignants, un service suivi et des quiz intégrés. Pour les étudiants, la bonne information, au bon moment, dans leur poche.
>
> Le projet est en ligne aujourd'hui, à l'adresse planner.finadmintech.fr. Il est construit comme une vraie plateforme : six services qui se parlent, une connexion unique sécurisée, et plus de 440 tests automatiques.
>
> HESTIM Planner : l'école, à l'heure. Merci. »

---

## Chiffres à connaître (questions du jury)

| Sujet | Chiffre |
|---|---|
| Génération (serveur en ligne) | 2 620 séances déployées, 261 enseignements placés en 90 s (25 incomplets signalés), ~20 000 essais par seconde |
| Bibliothèque | 82 supports de cours importés depuis Drive, rattachés à leur module |
| Données de démonstration | 11 filières, 149 modules, 76 enseignants, 684 étudiants, 41 salles sur 2 campus |
| Tests automatiques | 199 intégration + 74 unitaires (Planner), 142 (StudyLib), 14 (solveur Java), 13 (mobile) |
| Architecture | Planner (Node.js), web (React), solveur (Java, Timefold), bibliothèque (Laravel), jeux (ClassQuiz, Python), mobile (Expo / React Native) |
| Sécurité | connexion unique par jetons signés RS256 et OpenID Connect, protection CSRF, secrets hors du code |

## Questions probables

- **« Pourquoi pas un outil existant ? »** Les logiciels d'EDT du marché ne connaissent ni les deux campus, ni le rythme mensuel, ni les séances en demi-journée d'HESTIM ; et ils ne relient pas l'EDT aux supports et aux quiz.
- **« Et si le solveur ne trouve pas ? »** Il place le maximum et liste ce qui manque (par exemple un vacataire pas assez disponible) ; l'administration tranche, et chaque modification manuelle repasse par les mêmes règles.
- **« Les données des étudiants ? »** Hébergées sur un serveur à nous, pas de revente, comptes créés par l'école, avis de stage publiés uniquement avec l'accord explicite de l'étudiant.
