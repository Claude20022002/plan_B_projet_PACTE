# Contrôle qualité de PactePromo (phase 4)

Premier rendu, 17 octobre 2026. Fichiers dans `out/` (ignorés par git, à refaire avec les commandes ci-dessous).

| Fichier | Format | Durée | Poids |
|---|---|---|---|
| `out/pacte-16x9.mp4` | 1920 × 1080, H.264, 30 i/s, AAC 48 kHz | 60,01 s | 19,2 Mo |
| `out/pacte-9x16.mp4` | 1080 × 1920 | 60,01 s | 19,7 Mo |
| `out/pacte-1x1.mp4` | 1080 × 1080 | 60,01 s | 13,4 Mo |
| `out/pacte-miniatures/` | 3 images clés (désordre, alerte, fin) | — | — |

## Liste de contrôle

- [x] **Durée = 60 s ± 1 s** : 60,01 s pour les trois formats (ffprobe).
- [x] **Aucune donnée personnelle visible** :
  - les noms des captures viennent du jeu de démonstration (`backend/seed.js` : « noms marocains fictifs ») ;
  - les avatars sont des personnages inventés ;
  - `finadmintech` n'apparaît nulle part ;
  - le compte `admin@hestim.ma`, visible en petit dans le menu des captures du site, est le compte de démonstration.
- [x] **Texte lisible sur mobile** : images fixes relues en 9:16 et 1:1 (titres de 52 à 104 px, sous-titres de 40 à 46 px, alerte agrandie hors du téléphone). Pas encore regardé sur un vrai téléphone.
- [x] **Aucune affirmation non prouvée** : chaque chiffre et chaque fonction renvoient à `AUDIT.md`. « 90 secondes » et « l'appel en une minute » ont été retirés.
- [x] **Voix et sous-titres synchronisés** : sous-titres calculés sur les temps de parole de chaque réplique (repères de mots de la synthèse), découpés en 7 mots au plus.
- [x] **Pas de coupure audio** : aucun écrêtage (crête à 0,60) ; voix autour de −21 dB efficaces. Le seul silence est voulu, à 11 s.
- [x] **Poids du MP4 < 80 Mo** : 19,2 Mo au plus.

## Points à regarder à l'écoute

- **Musique très discrète.** Elle suit la consigne (12 %, 6 % sous la voix) et tombe vers −44 dB dans les pauses sans voix (25 à 29 s, 37 à 39 s, 45 à 47 s). Si ces passages semblent vides en salle, monter la base à 20 % dans `volumeMusique` (`src/promo/voix.ts`).
- **Musique composée par script** (`scripts/musique-promo.py`). Une vraie piste sous licence, déposée sous `public/audio/promo/musique.mp3`, la remplace sans toucher au code.
- **Voix de synthèse.** Microsoft, voix neuronales, via `edge-tts`. Le texte du script a été envoyé à ce service pour la synthèse. Avant une diffusion publique, vérifier que les conditions d'utilisation du service le permettent, ou enregistrer de vraies voix aux mêmes temps.

## À fournir

| Élément | Pourquoi | Où le mettre |
|---|---|---|
| Adresse ou contact pour l'écran final | Aucune décidée ; `planner.hestim.ma` n'existe pas | `src/promo/scenes/Scene08Fin.tsx`, sous le bouton |
| Piste musicale sous licence (facultatif) | Finition | `public/audio/promo/musique.mp3` |
| Voix enregistrées (facultatif) | Diffusion publique | `public/audio/promo/rNN.mp3`, puis relancer l'analyse |
| Captures de l'assistant de créneaux, des conflits et des statistiques (facultatif) | Montreraient le report proposé par Planner au lieu d'un statut repeint | Session de captures dédiée (AUDIT.md) |
| Accord de l'école pour le nom et le logo HESTIM | Pour une publication sur les réseaux | — |

## Refaire la vidéo

```bash
cd docs/presentation/video
npm run assets                              # captures dans public/
python scripts/voix-promo.py                # voix, bouches des avatars, sous-titres (src/promo/voix.json)
python scripts/musique-promo.py             # musique
npx remotion studio                         # aperçu : compositions PactePromo, PactePromoVertical, PactePromoCarre
npx remotion render PactePromo out/pacte-16x9.mp4
npx remotion render PactePromoVertical out/pacte-9x16.mp4
npx remotion render PactePromoCarre out/pacte-1x1.mp4
node scripts/verifier.mjs PactePromo 2 10 22 37 44 51 58    # images fixes de contrôle dans out/stills/
```

Changer une réplique : modifier `src/promo/script.json` (`dit` pour la voix, `texte` pour le sous-titre, `debut` en secondes), puis relancer `voix-promo.py`. Le script signale toute réplique qui en chevauche une autre.
