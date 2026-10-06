# Vidéo d'ouverture — HESTIM Planner (Remotion)

Vidéo motion design de **42 s** qui ouvre la présentation (voir `../discours-3-minutes.md` et
`../HESTIM-Planner-presentation.pptx`), réalisée d'après `../prompt-video-motion-design.md`.

- Public visé : non technique (investisseurs, direction, jury). On montre des services, pas des technologies.
- Images : uniquement de vraies captures de l'application (`../captures/`), dans leur version actuelle.

| Fichier | Format |
| --- | --- |
| `out/hestim-planner.mp4` | 1920 × 1080, 30 i/s, H.264 (yuv420p), 42 s, 1260 images, sans son |
| `out/hestim-planner-9x16.mp4` | 1080 × 1920, scènes 1, 4 et 9 enchaînées (13 s), pour les réseaux sociaux |

## Commandes

```bash
npm install
npm run render            # copie les captures dans public/ puis rend out/hestim-planner.mp4
npm run render:vertical   # version 9:16
npm run studio            # aperçu interactif pour ajuster les timings
node scripts/verifier.mjs HestimPlanner 0 1 4 7.5 9.5 12 15 18.5 22 25 27 31 33 36.5 38 41.5   # images fixes dans out/stills/
```

`npm run render` équivaut à `npm run assets && npx remotion render HestimPlanner out/hestim-planner.mp4`.

## Rythme

- Pensé pour une musique à **120 BPM** : un temps = 15 images, et chaque coupe tombe sur un temps.
- 42 s = 84 temps.
- Les durées des scènes sont des constantes en haut de `src/Root.tsx` (`TIMINGS`).

| # | Temps | Scène | Fichier |
| --- | --- | --- | --- |
| 1 | 0–4 s | Les 12 triangles de l'emblème s'assemblent sur la tuile blanche, puis `HESTIM PLANNER` en volets et « Toute la vie de l'école, dans une seule application. » | `S1Intro.tsx` |
| 2 | 4–9 s | GMAIL · PDF · WHATSAPP · CLASSROOM · MOODLE · JEUX EXTERNES, un par temps, puis barrés en orange : « 6 outils qui ne se parlent pas. » | `S2Outils.tsx` |
| 3 | 9–12 s | Les six outils convergent et se fondent dans l'emblème, qui rejoint le téléphone : « Une seule application. » | `S3Convergence.tsx` |
| 4 | 12–17 s | Agenda du mois, toucher sur un jour, détail de la séance (feuille en verre) | `S4Agenda.tsx` |
| 5 | 17–22 s | Accueil de l'app ; une alerte « Cours reporté » descend puis remonte | `S5Alerte.tsx` |
| 6 | 22–27 s | Supports d'un cours, puis PDF officiel du mois dans le navigateur | `S6Supports.tsx` |
| 7 | 27–33 s | Résultats d'un quiz (web + mobile, barres d'équipes), puis devoir noté | `S7Resultats.tsx` |
| 8 | 33–38 s | `90 S` · `1 COMPTE` · `0 PUBLICITÉ`, avec leur légende | `S8Chiffres.tsx` |
| 9 | 38–42 s | L'emblème se réassemble, `HESTIM PLANNER`, « L'école, à l'heure. », `PLANNER.FINADMINTECH.FR` ; dernière seconde immobile | `S9Fin.tsx` |

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
