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

## « Une journée à l'école » (lot V-1, troisième montage du 12 octobre 2026)

La vidéo décrite dans `../script-video-motion-design.md` : une seule histoire, sans les devoirs, en onze scènes. Les compositions ci-dessus ne changent pas ; celles-ci s'y ajoutent (`src/Matinee.tsx`). Le deuxième montage (11 octobre, 1 min 35, dix scènes) est gardé dans `out/old_videos/`.

| Fichier | Format | Commande |
| --- | --- | --- |
| `out/matinee-ecole.mp4` | 1920 × 1080, 1 min 54 (228 temps) | `npm run render:matinee` |
| `out/matinee-ecole-9x16.mp4` | 1080 × 1920, 45 s (90 temps), l'accroche d'abord | `npm run render:matinee-reseaux` |

| # | Début | Scène | Fichier | Images |
| --- | --- | --- | --- | --- |
| 1 | 0:00 | L'emblème, le nom, la promesse | `S1Intro.tsx` | animation |
| 2 | 0:06 | Six outils éparpillés | `S2Outils.tsx` | animation |
| 3 | 0:14 | L'étudiante : le tableau du jour, le mois, le détail d'un cours | `M3Etudiante.tsx` | captures du 11 octobre (`app-*`) |
| 4 | 0:26 | Cours reporté | `S5Alerte.tsx` | capture du 11 octobre, bannière dessinée |
| 5 | 0:34 | L'appel projeté et le scanner | `M5Appel.tsx` | captures du 11 octobre (`prof-05`, `app-04`) ; les noms sont découverts un à un |
| 6 | 0:50 | Le quiz : la salle et le téléphone | `M6Quiz.tsx` | **maquette** de l'écran de la salle, téléphone redessiné |
| 7 | 1:10 | « Bientôt » : le schéma et l'extrait vidéo sur le téléphone | `M7Bientot.tsx` | **maquettes** |
| 8 | 1:22 | Les résultats : le classement de la classe, puis celui de l'étudiante | `M8Resultats.tsx` | `web-21`, `mobile-13` (d'avant le 10 octobre) |
| 9 | 1:30 | Une seule connexion : les supports d'un cours, puis le panneau des espaces | `M9Bibliotheque.tsx` | `mobile-39` (d'avant le 10 octobre), `app-07` (11 octobre) |
| 10 | 1:38 | L'administration : l'emploi du temps du mois, puis les heures faites | `M10Admin.tsx` | `web-09`, `admin-05b` (11 octobre) |
| 11 | 1:48 | La promesse, web · iPhone · Android | `S9Fin.tsx` | animation |

Les captures du 11 octobre viennent de la plateforme de démonstration, un lundi à 13 h 40 : l'histoire se passe donc l'après-midi (13 h 20, 13 h 35, 14 h 10, 14 h 30), et non le matin comme dans le script.

**Ce que ce montage n'est pas encore.**

- **Le quiz reste sur maquettes** (`../maquettes/`) : le moteur de quiz n'était pas branché pendant les captures. La scène 7 l'annonce à l'écran (« Bientôt ») ; la scène 6 ne le dit pas.
- **Trois captures datent d'avant le 10 octobre** (`web-21`, `mobile-13`, `mobile-39`) : aucune n'affiche un ancien nom à l'image, mais elles sont à refaire après R-7. `web-21` est cadrée sur la fenêtre du classement, parce que le reste de la page s'appelle encore « Jeux ».
- **La scène 10 ne montre pas la séance du matin « faite »** : elle montre les heures faites par enseignant sur le mois.
- **Les heures des téléphones ne se suivent pas** (2:03, 10:10, 10:34, 1:48) : ce sont celles des captures.
- **Le scanner** montre la scène factice de la caméra de l'émulateur, pas un QR.
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
