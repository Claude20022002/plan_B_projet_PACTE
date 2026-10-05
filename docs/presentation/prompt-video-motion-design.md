# Prompt — vidéo motion design « HESTIM Planner » (36 s)

> À coller tel quel dans Claude Code (modèle Claude Opus 5.5), lancé dans le dossier
> `docs/presentation/` qui contient le dossier `captures/`.

---

Tu es motion designer et développeur Remotion. Réalise une vidéo de présentation de **36 secondes** pour **HESTIM Planner**, une plateforme de gestion des emplois du temps et de la vie pédagogique de l'école d'ingénieurs HESTIM (Maroc). Elle ouvre une présentation de 3 minutes devant le jury du concours de l'école : elle doit impressionner dès la première seconde, rester lisible sur un vidéoprojecteur et ne contenir que des écrans réels du projet.

## Livrable

- Un projet **Remotion** (React + TypeScript) dans `video/`, et le rendu **`video/out/hestim-planner.mp4`** : 1920×1080, 30 i/s, H.264, 36 s exactement.
- Composition unique `HestimPlanner` découpée en scènes (une par fichier) ; timings en constantes en haut de `Root.tsx` pour pouvoir les ajuster.
- Aucune musique intégrée (j'ajouterai la mienne) : prévois un rythme visuel à **120 BPM** (un temps = 15 images) pour que les coupes tombent sur les temps.
- Commande de rendu documentée dans `video/README.md` (`npx remotion render`).

## Ressources (dossier `captures/`)

Écrans réels de la plateforme en ligne (planner.finadmintech.fr) :

| Fichier | Contenu |
|---|---|
| `web-01-connexion.png` | page de connexion |
| `web-02-tableau-etudiant.png` + `video/web-tableau-etudiant.webm` | tableau de l'étudiant façon « panneau des départs » d'aéroport, volets qui tournent |
| `web-04-tableau-enseignant.png` | séance en vedette, bouton « Lancer un quiz » |
| `web-07-preparation.png` | assistant de préparation du semestre (8 étapes) |
| `web-08-generation.png` | génération automatique de l'emploi du temps (solveur Timefold) |
| `web-09-edt-mensuel.png` | emploi du temps mensuel au format officiel de l'école |
| `web-10-suivi.png` | suivi des heures réalisées |
| `web-13-bibliotheque.png` | bibliothèque de cours StudyLib |
| `web-14-classquiz-connexion.png` | jeux pédagogiques ClassQuiz, connexion « HESTIM Planner » |
| `mobile-01-tableau.png` … `mobile-04-jeux.png` + `video/mobile-tableau.mp4` | application mobile étudiant (Android) |
| `../../frontend/public/HESTIM.png`, `logo-planner.png` | logos |

Si un fichier manque, saute le plan correspondant plutôt que d'inventer un écran.

## Identité visuelle (obligatoire)

- Signature : le **panneau des départs à volets** (split-flap). Les titres s'affichent lettre par lettre sur des tuiles qui basculent (moitié haute qui tombe, charnière noire, léger rebond, 2 à 4 lettres « fausses » avant la bonne). Fais-en un composant `FlapText` réutilisable.
- Couleurs :
  - fond `#0B0B0D` ;
  - tuile `#212124`, charnière `#000000`, filet `#2C2C30` ;
  - lettres `#F2F1EC`, texte secondaire `#A6A6AC` ;
  - bleu marine HESTIM `#001861`, réservé au cadre ou à une barre de titre.
- Couleurs de statut : vert « à l'heure / en cours » `#3FCB74`, orange « reporté » `#F26322`, rouge « annulé » `#FF5A5F`. **Uniquement pour des statuts**, jamais pour décorer.
- Polices (Google Fonts, `@remotion/google-fonts`) : **Barlow Condensed** 600/700 en capitales espacées (0,06 à 0,16 em) pour les titres et chiffres, **Barlow** 400/600 pour les phrases.
- Les captures web sont montrées dans un **cadre de navigateur sobre** (barre sombre, URL `planner.finadmintech.fr`) ; les captures mobiles dans un **cadre de téléphone fin et sombre**. Coins arrondis 14 px, ombre douce, jamais de reflet ni de dégradé arc-en-ciel.
- Mouvement : courbes `spring` amorties (pas d'élastique), zooms lents de type Ken Burns (1,00 → 1,06) sur les captures, coupes franches sur les temps. Pas de transitions gadget (pas de cube, pas de tourbillon).

## Storyboard (30 i/s)

| # | Temps | Image | Texte à l'écran | Mouvement |
|---|---|---|---|---|
| 1 | 0,0–3,0 s | fond noir, rangée de tuiles vides | `HESTIM PLANNER` puis, dessous, « L'école, à l'heure. » | les tuiles basculent de gauche à droite jusqu'au titre ; le sous-titre apparaît en fondu à 2,2 s |
| 2 | 3,0–7,0 s | quatre tuiles-étiquettes | `EXCEL` · `PDF` · `WHATSAPP` · `KAHOOT`, puis « Tout est éparpillé. » | chaque mot arrive sur un temps ; à 5,5 s, un trait orange `#F26322` les barre l'un après l'autre (statut « reporté ») |
| 3 | 7,0–12,0 s | `web-08-generation.png` dans le navigateur | `242 ENSEIGNEMENTS · 60 S` (compteur qui défile en volets), « Le semestre se construit tout seul. » | zoom lent ; le compteur monte de 0 à 242 pendant que « 60 S » s'affiche |
| 4 | 12,0–17,0 s | `video/web-tableau-etudiant.webm` (ou le PNG en zoom) | « Chaque étudiant voit sa journée, en temps réel. » | la vidéo démarre sur le basculement des volets ; une pastille verte `#3FCB74` « EN COURS » pulse une fois |
| 5 | 17,0–22,0 s | téléphone : `mobile-01-tableau` → `mobile-04-jeux` | « Dans la poche. Notifiée au moindre changement. » | le téléphone entre par la droite ; à 19,5 s une bannière de notification « Quiz en cours » glisse du haut, puis l'écran passe à `mobile-04-jeux` |
| 6 | 22,0–27,0 s | écran partagé : `web-13-bibliotheque` / `web-14-classquiz-connexion` | « Cours, TD, quiz : une seule connexion. » | les deux navigateurs glissent l'un vers l'autre et s'arrêtent côte à côte |
| 7 | 27,0–32,0 s | mosaïque rapide (un temps chacune) : `web-09-edt-mensuel`, `web-07-preparation`, `web-10-suivi`, `web-04-tableau-enseignant` | puces en volets : `TIMEFOLD` · `LARAVEL` · `EXPO` · `OPENID CONNECT` · `DOCKER`, puis `442 TESTS` | coupe sur chaque temps ; les puces basculent en rafale |
| 8 | 32,0–36,0 s | fond noir, cadre marine fin | `PLANNER.FINADMINTECH.FR` en volets, logo HESTIM, « Projet PACTE — HESTIM 2026 » | le titre bascule, le logo apparaît en fondu ; dernière seconde immobile (fin propre pour enchaîner sur la présentation) |

## Contraintes de qualité

- Texte lisible au fond d'une salle : 64 px minimum pour les titres, 40 px pour les phrases ; contraste conforme WCAG AA ; jamais plus de 8 mots à l'écran en même temps.
- Les captures ne sont ni déformées ni recadrées au point de cacher l'interface ; utilise `objectFit: 'cover'` et un léger zoom seulement.
- Pas de flash : au plus 3 changements de luminosité forts par seconde.
- Vérifie le rendu image par image aux temps clés (0, 3, 7, 12, 17, 22, 27, 32, 35 s) avec `npx remotion still` avant le rendu final, et corrige tout débordement de texte.
- Fournis aussi une version **9:16 (1080×1920)** des scènes 1, 5 et 8 enchaînées (12 s) pour les réseaux sociaux, si le temps le permet.
