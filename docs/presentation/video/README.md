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
