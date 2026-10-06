# Vidéo d'ouverture — HESTIM Planner (Remotion)

Vidéo motion design de 36 s qui ouvre la présentation de 3 minutes (voir `../discours-3-minutes.md`),
réalisée d'après `../prompt-video-motion-design.md`. Elle n'utilise que de vraies captures de la plateforme (`../captures/`).

| Fichier | Format |
|---|---|
| `out/hestim-planner.mp4` | 1920 × 1080, 30 i/s, H.264 (yuv420p), 36 s, 1080 images, sans son |
| `out/hestim-planner-9x16.mp4` | 1080 × 1920, scènes 1, 5 et 8 enchaînées (12 s), pour les réseaux sociaux |

## Commandes

```bash
npm install
npm run render            # copie les captures dans public/ puis rend out/hestim-planner.mp4
npm run render:vertical   # version 9:16
npm run studio            # aperçu interactif pour ajuster les timings
node scripts/verifier.mjs HestimPlanner 0 3 7 12 17 22 27 32 35   # images fixes dans out/stills/
```

`npm run render` équivaut à `npm run assets && npx remotion render HestimPlanner out/hestim-planner.mp4`.

## Rythme

Pensé pour une musique à **120 BPM** : un temps = 15 images ; chaque coupe tombe sur un temps.
Les durées des scènes sont des constantes en haut de `src/Root.tsx` (`TIMINGS`).

| # | Temps | Scène | Fichier |
|---|---|---|---|
| 1 | 0–3 s | `HESTIM PLANNER` en volets, « L'école, à l'heure. » | `S1Title.tsx` |
| 2 | 3–7 s | EXCEL · PDF · WHATSAPP · KAHOOT, barrés en orange | `S2Scattered.tsx` |
| 3 | 7–12 s | Génération automatique, compteur 2620 séances · 90 s | `S3Generation.tsx` |
| 4 | 12–17 s | Tableau étudiant (vidéo), pastille « EN COURS » | `S4Board.tsx` |
| 5 | 17–22 s | Téléphone : thème Planner sombre → StudyLib clair → notification → terminal réussi | `S5Mobile.tsx` |
| 6 | 22–27 s | Résultats du quiz web + mobile, barres d'équipes qui se remplissent | `S6Results.tsx` |
| 7 | 27–32 s | Mosaïque (un temps par capture), technologies, nombre de tests | `S7Stack.tsx` |
| 8 | 32–36 s | `PLANNER.FINADMINTECH.FR`, logo, « Projet PACTE — HESTIM 2026 » ; dernière seconde immobile | `S8End.tsx` |

## Notes

- Le composant `FlapText` (`src/components/Flap.tsx`) produit les tuiles à volets : la moitié haute tombe sur la
  charnière, la moitié basse se pose avec un léger rebond, avec 2 à 4 lettres « fausses » avant la bonne.
  `FlapCounter` fait défiler les chiffres.
- Scène 6 : les barres du défi par équipes sont celles des captures ; un masque couleur du rail, mesuré au pixel,
  recouvre la partie pas encore remplie. L'interface n'est pas redessinée.
- Scène 5 : la notification « Quiz en cours » reprend le texte de l'application.
- Le nombre de tests affiché (`561 TESTS`) est la constante `TESTS_LABEL` dans `S7Stack.tsx`.
- Polices Barlow Condensed et Barlow, chargées par `@remotion/google-fonts`.
