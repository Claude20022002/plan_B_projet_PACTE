# Vidéo d'ouverture — HESTIM Planner (Remotion)

Vidéo motion design de **62 s** qui ouvre la présentation (voir `../discours-3-minutes.md` et
`../HESTIM-Planner-presentation.pptx`), réalisée d'après `../prompt-video-motion-design.md`.

- Public visé : non technique (investisseurs, direction, jury). On montre des services, pas des technologies.
- Images : uniquement de vraies captures de l'application (`../captures/`), dans leur version actuelle.

| Fichier | Format |
| --- | --- |
| `out/hestim-planner.mp4` | 1920 × 1080, 30 i/s, H.264 (yuv420p), 62 s, 1860 images, son AAC stéréo |
| `out/hestim-planner-9x16-accroche.mp4` | teaser B 1080 × 1920, 29 s : l'alerte d'abord (scènes 5, 2, 3, 4 puis 10), pour LinkedIn |
| `out/carrousel/hestim-planner-carrousel.pdf` | carrousel LinkedIn, 10 pages 1080 × 1350 (`npm run carrousel`) |
| `out/hestim-planner-9x16.mp4` | teaser 1080 × 1920, 34 s : toute l'histoire (scènes 1 à 5 puis 10), avec sa propre bande-son, pour les réseaux sociaux |

## « Keynote » (16 octobre 2026) : la vidéo de la présentation de 3 minutes

Elle passe entre l'ouverture et la clôture du discours (`../discours-keynote.md`). Ce sont les codes des films de lancement (Apple, NVIDIA, Samsung) avec les images existantes :
- une ouverture à froid, sans logo, qui reprend l'heure dite par l'orateur ;
- le chaos, puis le noir et le silence, puis la révélation ;
- une preuve par plan, avec de la profondeur (`components/Camera.tsx`) ;
- le grand chiffre, puis la promesse.

Composition `Keynote` (`src/Keynote.tsx`), sans repère ni barre de progression.

| Fichier | Format | Commande |
| --- | --- | --- |
| `out/keynote.mp4` | 1920 × 1080, 62 s (124 temps), son `public/audio/keynote.wav` | `npm run render:keynote` |

| # | Début | Plan | À l'écran | Fichier |
| --- | --- | --- | --- | --- |
| 1 | 0:00 | Ouverture à froid | **13:29**, puis **SALLE** et une case qui tourne sans trouver | `K1Froid.tsx` |
| 2 | 0:04 | Douze notifications des six outils s'empilent, puis le noir (1,2 s de silence) | **Six outils. Aucun ne lui dit où aller.** | `K2Chaos.tsx` |
| 3 | 0:09 | Halo, l'emblème s'assemble, reflet de lumière, le nom en volets | HESTIM PLANNER | `K3Revelation.tsx` |
| 4 | 0:13 | Le téléphone arrive en perspective, la caméra avance sur G-S05 ; la case du plan 1 se fixe sur **G-S05** | **Elle sait où aller.** | `K4Salle.tsx` (`app-01`, remise à 13:30) |
| 5 | 0:19 | Cours reporté | Prévenu à la seconde | `S5Alerte.tsx` dans `Camera` |
| 6 | 0:23 | L'appel projeté et le scanner | **L'appel en une minute.** Le code change toutes les 30 secondes. | `M5Appel.tsx` dans `Camera` |
| 7 | 0:33 | Le quiz en direct | **Le quiz se joue dans le cours.** | `M6Quiz.tsx` dans `Camera` (**maquette** de l'écran de salle) |
| 8 | 0:41 | Le classement | **Le classement, aussitôt.** | `D1PlanSite.tsx`, `web-21` (d'avant le 10 octobre) |
| 9 | 0:45 | Six noms de jeux en volets, avec leur discipline | **Réviser en jouant.** Rangés par module, choisis par l'enseignant. | `K7Jeux.tsx` |
| 10 | 0:50 | Trois rangées de chiffres | **2620** séances placées · **90 S** pour un semestre entier · **0** conflit ; note : semestre de démonstration | `K8Chiffres.tsx` |
| 11 | 0:56 | L'emblème, le nom, la promesse | **Toute l'école à l'heure.** · DÉJÀ EN LIGNE | `S9Fin.tsx` (nouvelle option `supports`) |

**À savoir avant de la diffuser.**

- **Plan 9** : cinq des six jeux sont les simulations d'Alexis (branche `jeux-pedagogique`, pas encore fusionnée). Ne pas projeter ce plan tant qu'elles ne sont pas en ligne.
- **Plan 7** : l'écran de la salle reste la maquette ; le quiz en direct existe, son écran réel n'a pas été capturé.
- **Plan 10** : les chiffres viennent du jeu de démonstration, la note du bas le dit.
- **Fin** : ni plateformes ni adresse. L'application n'est pas sur les stores, et `planner.hestim.ma` n'existe pas.
- **Bande-son** : synthétisée comme les autres (`composer-musique.py` : `section_froid`, `section_chaos`, `section_revelation`). Pour le niveau d'un film de lancement, une vraie piste sous licence (même nom de fichier) ferait la plus grande différence.

## « Keynote » en 1 min 20 (17 octobre 2026)

La Keynote, plan pour plan, avec quatre preuves de plus sur de vraies captures, dans la même mise en scène. Composition `Keynote80` (`src/Keynote80.tsx`). La Keynote de 62 s ne change pas.

| Fichier | Format | Commande |
| --- | --- | --- |
| `out/keynote-1m20.mp4` | 1920 × 1080, 80 s (160 temps), son `public/audio/keynote-1m20.wav` | `npm run render:keynote80` |

| Ajout | Début | Titre | Capture |
| --- | --- | --- | --- |
| Après la salle trouvée | 0:19 | Tout le campus, sur un écran. | `admin-01-tableau` |
| Après les jeux | 0:54 | Le semestre, préparé en huit étapes. | `admin-02-preparation` (« 7. Revue · 0 conflit(s) ouvert(s) ») |
| | 0:59 | Au format officiel de l'école. | `admin-04b-edt-mensuel-classe` |
| | 1:03 | Chaque heure faite est comptée. | `admin-05b-heures-du-mois` |

La fin passe de 6 à 7 s. Les réserves de la Keynote restent valables (plan des jeux, quiz sur maquette, « 90 S » du plan des chiffres non mesuré). La capture de la génération (`web-08`) a été écartée : son cadrage montrait aussi « −142 règles dures enfreintes » et une liste « Semaine type en conflit ».

## « Direction » (lot V-2, premier montage du 13 octobre 2026)

La vidéo pour ceux qui décident et paient, d'après `../script-video-vendeur.md` (§ 5) : une promesse, trois preuves, ce que l'école y gagne, une action. Composition `Direction` (`src/Direction.tsx`).

| Fichier | Format | Commande |
| --- | --- | --- |
| `out/direction.mp4` | 1920 × 1080, 60 s (120 temps) | `npm run render:direction` |

| # | Début | Plan | Titre à l'écran | Fichier | Image |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Le panneau « Prochains départs · Campus » | Tout le campus, sur un écran. | `D1PlanSite.tsx` | `admin-01` (13 octobre) |
| 2 | 0:04 | Six outils éparpillés | 6 outils qui ne se parlent pas. | `S2Outils.tsx` | animation |
| 3 | 0:10 | Le téléphone, puis la séance en cours en grand | Chaque étudiant sait où aller. | `D3Etudiant.tsx` | `app-01` (11 octobre) |
| 4 | 0:15 | Cours reporté | Prévenu à la seconde, sur son téléphone. | `S5Alerte.tsx` | `app-01`, bannière dessinée |
| 5 | 0:20 | L'appel projeté et le scanner | L'appel en une minute. | `M5Appel.tsx` | `prof-05` (13 octobre), caméra redessinée |
| 6 | 0:32 | Le quiz en direct | Un quiz lancé depuis la séance. | `M6Quiz.tsx` | **maquette** de l'écran de la salle |
| 7 | 0:40 | Le classement de la classe | Le classement, aussitôt. | `D1PlanSite.tsx` | `web-21` (d'avant le 10 octobre) |
| 8 | 0:44 | L'emploi du temps du mois d'une classe | Un mois planifié, sans conflit. | `D1PlanSite.tsx` | `admin-04b` (13 octobre) |
| 9 | 0:49 | Les heures du mois par enseignant | Chaque heure faite est comptée. | `D1PlanSite.tsx` | `admin-05b` (13 octobre) |
| 10 | 0:54 | L'emblème, la promesse, l'action | Demandez une démonstration · planner.hestim.ma | `S9Fin.tsx` | animation |

**Écarts avec le script.**

- **Plan 9** : le script disait « Les heures faites, prêtes pour la paie. ». La capture du jour affiche « à vérifier » sur chaque ligne (aucun appel n'est validé dans la base de captures) : le titre dit donc seulement que les heures sont comptées.
- **Plans 2 et 4** : les textes sont ceux des scènes existantes, pas ceux du script.
- **Titres à 104 px**, et non 130 : à 130 px, un titre de six mots ne tient plus sous un écran qui occupe les deux tiers de l'image.
- **Pas de voix off, pas de plan réel de la salle, pas de doigt à l'image** sauf dans le quiz.
- **`planner.hestim.ma` est une adresse fictive**, à remplacer avant toute diffusion.
- **« En une minute » et « sans conflit » ne sont pas mesurés** : vrais sur le jeu de démonstration seulement.
- Sur les écrans du site, le menu de gauche est hors cadre ; le titre de la page est rogné en fin de zoom au plan 9.

## « Une journée à l'école » (lot V-1, septième montage du 13 octobre 2026)

Le script suivant, pour une vidéo plus courte et tournée vers un public à la fois, est `../script-video-vendeur.md` (lot V-2, pas encore monté).

La vidéo décrite dans `../script-video-motion-design.md` : une seule histoire, sans les devoirs, en douze scènes et 1 min 15, la durée décidée pour la salle. Les compositions ci-dessus ne changent pas ; celles-ci s'y ajoutent (`src/Matinee.tsx`). Les montages précédents sont gardés dans `out/old_videos/` (du deuxième au sixième).

| Fichier | Format | Commande |
| --- | --- | --- |
| `out/matinee-ecole.mp4` | 1920 × 1080, 1 min 15 (150 temps) | `npm run render:matinee` |
| `out/matinee-ecole-9x16.mp4` | 1080 × 1920, 40 s (80 temps), l'accroche d'abord | `npm run render:matinee-reseaux` |

| # | Début | Heure de l'histoire | Scène | Fichier | Images |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | | L'emblème, le nom, la promesse | `S1Intro.tsx` | animation |
| 2 | 0:05 | | Six outils éparpillés | `S2Outils.tsx` | animation |
| 3 | 0:11 | 13 h 32 | L'étudiante : le tableau du jour, le mois, le détail d'un cours | `M3Etudiante.tsx` | captures du 11 octobre (`app-*`) |
| 4 | 0:18 | 13 h 32 | Cours reporté | `S5Alerte.tsx` | capture du 11 octobre, bannière dessinée |
| 5 | 0:23 | 13 h 35 | L'appel projeté et le scanner | `M5Appel.tsx` | `prof-05`, `app-04` ; les noms sont découverts un à un, la vue de la caméra est redessinée |
| 6 | 0:32 | 14 h 10 | Le quiz en direct : la salle et le téléphone | `M6Quiz.tsx` | **maquette** de l'écran de la salle, téléphone redessiné |
| 7 | 0:42 | 14 h 10 | Un quiz, plusieurs formes : en direct, avec un schéma, avec un extrait vidéo | `M7Formes.tsx` | téléphone redessiné, deux **maquettes** |
| 8 | 0:47 | 14 h 30 | Les résultats : le classement de la classe, puis celui de l'étudiante | `M8Resultats.tsx` | `web-21`, `mobile-13` (d'avant le 10 octobre) |
| 9 | 0:52 | 14 h 45 | Une seule connexion : les supports d'un cours, puis le panneau des espaces | `M9Bibliotheque.tsx` | `mobile-39` (d'avant le 10 octobre), `app-07` (11 octobre) |
| 10 | 0:58 | 15 h 20 | Une bibliothèque de jeux pédagogiques | `M7Jeux.tsx` | `mobile-25` (Terminal Linux, d'avant le 10 octobre) |
| 11 | 1:03 | | L'administration : l'emploi du temps du mois, puis les heures faites | `M10Admin.tsx` | `admin-04b`, `admin-05b` (13 octobre) |
| 12 | 1:09 | | La promesse, web · iPhone · Android, l'action | `S9Fin.tsx` | animation |

**Corrections du 13 octobre** (après une relecture « marketing » du cinquième montage) :

- **Une seule promesse**, qui ouvre et ferme la vidéo : « Toute l'école à l'heure, dans une seule application. » (13 octobre au soir ; elle remplace celle de l'accueil du site, jugée trop étroite pour la vidéo : `../script-video-vendeur.md`, § 3).
- **Une action pour finir** : « Demandez une démonstration », suivie de `planner.hestim.ma` (`ACTION` et `ADRESSE` dans `src/Matinee.tsx`). **Cette adresse est fictive** : à remplacer par la vraie avant toute diffusion.
- **Captures du site refaites le 13 octobre** : l'appel projeté, les heures du mois et l'emploi du temps du mois d'une classe (`admin-04b`, à la place de `web-09`). Les captures de l'application, du quiz et de la Bibliothèque ne sont pas refaites (`../script-video-vendeur.md`, § 8).
- **Un vrai QR dans le viseur du scanner** : la scène factice de la caméra de l'émulateur est recouverte par le QR de l'appel projeté (`VueCamera`, `M5Appel.tsx`).
- **Plus de « CODE 482 913 »** sur l'écran de la salle : il contredisait « sans code à saisir ». Il est recouvert dans la scène ; la maquette (`../maquettes/`) le porte toujours.
- **Les téléphones sont à l'heure de l'histoire** : l'heure de la barre d'état est redessinée sur chaque capture (`Heure`, `components/Frames.tsx`), ainsi que « Mis à jour à » sur le tableau du jour. L'histoire commence à 13 h 32, le cours de 13 h 30 étant « en cours » sur les captures, et les scènes se suivent dans l'ordre des heures (la Bibliothèque avant la pause).

**Ce que ce montage n'est pas encore.**

- **Le quiz reste sur maquettes** (`../maquettes/`) : le moteur de quiz n'était pas branché pendant les captures.
- **La scène 7 montre deux formes qui n'existent pas encore** (décision du 12 octobre : le mot « Bientôt » est retiré). L'application n'affiche ni image ni vidéo dans une question ; à l'écran, rien ne les distingue plus du quiz en direct, qui existe.
- **La bibliothèque de jeux n'a qu'un jeu** (scène 8) : Terminal Linux. La scène annonce une bibliothèque « par module, inspirée des jeux qui existent déjà » ; c'est une décision du 12 octobre (`../../sessions/compte-rendu-2026-10-14.md`, § 6), pas encore un écran.
- **Quatre captures datent d'avant le 10 octobre** (`web-21`, `mobile-13`, `mobile-39`, `mobile-25`) : aucune n'affiche un ancien nom à l'image, mais elles sont à refaire après R-7. `web-21` est cadrée sur la fenêtre du classement, parce que le reste de la page s'appelle encore « Jeux ».
- **La scène 10 ne montre pas la séance du matin « faite »** : elle montre les heures faites par enseignant sur le mois.
- **Captures claires et sombres mêlées** : le tableau de l'étudiante est en thème clair, les supports, les jeux et le quiz en sombre. Les unifier demande de refaire les captures.
- **« Mis à jour à 13:48 »** reste lisible, en petit, derrière le panneau des espaces (scène 9, 14 h 45).
- **Pas de sous-titres anglais**, ni de durée annoncée avant la lecture. La barre de progression est en place.

`src/scenes/M4Site.tsx` (tableaux de l'enseignant et de l'administration du deuxième montage) n'est plus utilisé : à supprimer.

Les durées des deux montages sont dans `TEMPS_SALLE` et `TEMPS_RESEAUX` (`src/Matinee.tsx`) ; la bande-son les lit et produit `public/audio/matinee.wav` et `matinee-9x16.wav`.

## Commandes

```bash
npm install
npm run render            # copie les captures, compose la bande-son, puis rend out/hestim-planner.mp4
npm run musique           # seulement la bande-son : public/audio/*.wav (Python, numpy, scipy)
npm run render:vertical   # version 9:16
npm run studio            # aperçu interactif pour ajuster les timings
node scripts/verifier.mjs HestimPlanner 0 1 4 7.5 9.5 12 15 18.5 22 25 27 31 33 36.5 38 41.5   # images fixes dans out/stills/
```

`npm run render` équivaut à `npm run assets && npm run musique && npx remotion render HestimPlanner out/hestim-planner.mp4`.

## Rythme

- Pensé pour une musique à **120 BPM** : un temps = 15 images, et chaque coupe tombe sur un temps.
- 62 s = 124 temps.
- La bande-son lit ces durées et la liste `VERTICAL` dans `Root.tsx` : modifier un timing puis relancer `npm run render` suffit.
- Les durées des scènes sont des constantes en haut de `src/Root.tsx` (`TIMINGS`).

| # | Temps | Scène | Fichier |
| --- | --- | --- | --- |
| 1 | 0–5 s | Les 12 triangles de l'emblème s'assemblent, `HESTIM PLANNER` en volets, « Toute la vie de l'école, dans une seule application. » | `S1Intro.tsx` |
| 2 | 5–12 s | « Aujourd'hui, à l'école : » GMAIL · PDF · WHATSAPP · CLASSROOM · MOODLE · JEUX EXTERNES, barrés à 4 s : « 6 outils qui ne se parlent pas. » | `S2Outils.tsx` |
| 3 | 12–16 s | Les outils se fondent dans l'emblème, qui rejoint le téléphone : « Une seule application, pour toute l'école. » | `S3Convergence.tsx` |
| 4 | 16–23 s | Agenda du mois en thème Planner sombre, puis volet vers le thème StudyLib clair à 1,5 s (« Sombre ou clair, au choix. »), toucher, détail de la séance en clair : « Chaque cours : salle, heure, enseignant. » | `S4Agenda.tsx` |
| 5 | 23–29 s | Alerte « Cours reporté » (3 s à l'écran) : « Report, annulation, changement de salle. » | `S5Alerte.tsx` |
| 6 | 29–36 s | Supports d'un cours (thème StudyLib clair) : « Les supports de chaque cours, et les retours de stage des anciens. », puis PDF officiel du mois | `S6Supports.tsx` |
| 7 | 36–44 s | Résultats d'un quiz (web + mobile), puis devoir noté | `S7Resultats.tsx` |
| 8 | 44–50 s | `L'APPEL EN 5 SECONDES` en volets, QR projeté qui se renouvelle à 3 s, compteur `28` présents sur 30 : ce que l'école y gagne (animation typographique, pas de fausse capture) | `S8Appel.tsx` |
| 9 | 50–57 s | `90 S` · `1 COMPTE` · `0 PUBLICITÉ`, un toutes les 2 s | `S8Chiffres.tsx` |
| 10 | 57–62 s | Emblème, `HESTIM PLANNER`, « L'école, à l'heure. », `WEB · IPHONE · ANDROID` ; dernière seconde immobile | `S9Fin.tsx` |

Le teaser vertical reprend les scènes 1 à 5 puis 10 (34 s), avec des mises en page 9:16 propres.

## Bande-son

- La bande-son est originale : `scripts/composer-musique.py` la synthétise, sans aucun échantillon externe, donc sans question de licence.
- Elle est en do majeur, à 120 BPM, et suit les scènes :
  - intro douce ;
  - pulsation tendue sur les outils éparpillés ;
  - montée et « drop » à 12 s ;
  - boucle C – G – Am – F ;
  - allègement sur les chiffres ;
  - accord final tenu, puis fondu.
- Bruitages calés sur les animations :
  - une note par triangle du logo ;
  - cliquetis des volets ;
  - « zips » quand les outils sont barrés ;
  - souffle de convergence ;
  - toucher ;
  - carillon de la notification ;
  - impacts.
- Pour la changer :
  - modifier `composer()` dans `scripts/composer-musique.py` : la musique suit d'elle-même `TIMINGS` et `VERTICAL` de `src/Root.tsx`, une scène = une section ; puis relancer `npm run render` ;
  - ou remplacer `public/audio/hestim-planner.wav` par sa propre musique (même nom) et lancer seulement `npx remotion render HestimPlanner out/hestim-planner.mp4`.

## Notes

- **`Embleme`** (`src/components/Embleme.tsx`) reproduit l'animation de lancement de l'application (`mobile/src/intro/IntroLogo.jsx`).
  - Ce sont les mêmes 12 triangles, sur une grille de 3 × 3.
  - Chaque triangle arrive dans la direction de son centre, en tournant, avec un ressort amorti.
- **`FlapText`** (`src/components/Flap.tsx`) produit les tuiles à volets : la moitié haute tombe sur la charnière, la moitié basse se pose avec un léger rebond, après 2 à 4 lettres « fausses ».
- **Scène 5** : la bannière de notification est la seule incrustation dessinée.
  - Elle est agrandie 1,5 fois et déborde du téléphone, pour rester lisible au fond d'une salle.
  - Sa pastille orange est celle du statut « reporté ».
- **Scène 7** : les barres du défi par équipes sont celles des captures.
  - Un masque de la couleur du rail, mesuré au pixel, recouvre la partie pas encore remplie.
  - L'interface n'est pas redessinée.
- **Polices** : Barlow Condensed et Barlow, chargées par `@remotion/google-fonts`.
