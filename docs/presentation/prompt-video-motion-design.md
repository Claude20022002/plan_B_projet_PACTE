# Prompt — vidéo motion design « HESTIM Planner » (42 s)

> **Historique.** Ce prompt a produit la version de 42 s. La vidéo actuelle dure **62 s** (10 scènes, bande-son
> originale) et le teaser vertical **34 s** : la référence à jour est `video/README.md` (scènes, durées, commandes).

> À coller tel quel dans Claude Code (modèle Claude Opus 5.5), lancé dans le dossier
> `docs/presentation/` qui contient `captures/` et le projet Remotion `video/`.

---

Tu es motion designer et développeur Remotion. Mets à jour la vidéo de présentation de **HESTIM Planner** : elle passe de 36 à **42 secondes** et change de ton.

HESTIM Planner est l'application qui réunit toute la vie de l'école HESTIM (Maroc) : emploi du temps, alertes, cours, jeux et quiz. La vidéo ouvre une présentation de 3 minutes devant un public **non technique** : investisseurs, direction, jury. Elle suit le déroulé de `HESTIM-Planner-presentation.pptx` et de `discours-3-minutes.md`. Elle vend des **services rendus**, pas une technologie : aucun nom de logiciel, de langage ou de framework, aucun nombre de tests à l'écran. Elle doit impressionner dès la première seconde, rester lisible sur un vidéoprojecteur et ne montrer que des écrans réels de l'application.

## Livrable

- Le projet **Remotion existant** dans `video/` (React + TypeScript), mis à jour, et le rendu **`video/out/hestim-planner.mp4`** : 1920×1080, 30 i/s, H.264 (yuv420p), **42 s exactement (1260 images)**.
- Réutilise ce qui existe : `src/components/Flap.tsx` (volets), `Frames.tsx` (cadres navigateur et téléphone), `motion.ts`, `theme.ts`. Les scènes restent une par fichier dans `src/scenes/`.
  - Supprime la scène technique `S7Stack.tsx` (noms de logiciels, nombre de tests).
  - Remplace les scènes dont le contenu change.
  - Les timings restent des constantes en haut de `src/Root.tsx` (`TIMINGS`, en temps).
- Aucune musique intégrée : rythme visuel à **120 BPM** (un temps = 15 images), chaque coupe tombe sur un temps. 42 s = **84 temps**.
- Mets à jour :
  - `scripts/` : copie des captures dans `public/`, uniquement celles listées ci-dessous ;
  - `video/README.md` : durée, tableau des scènes, temps clés de vérification.
- Version **9:16 (1080×1920)** : scènes 1, 4 et 9 enchaînées (13 s), dans `out/hestim-planner-9x16.mp4`.

## Ressources (dossier `captures/`)

Écrans réels de l'application, dans leur version actuelle. Le domaine de démonstration (finadmintech) ne doit **jamais** apparaître dans la vidéo : il sert seulement à faire tourner l'application sur les appareils.


| Fichier | Contenu |
| --- | --- |
| `mobile-38-tableau.png` | accueil de l'app : prochaine séance (heure en volets, salle en grand), « Supports du cours (15) », changements récents |
| `mobile-37-mois.png` | agenda du mois : chaque jour avec ses cours en étiquettes de couleur (FDS, NIS2, IA…), bilan du mois (78 séances) |
| `mobile-36-fiche-verre.png` | détail d'une séance dans une feuille en verre dépoli : date, heures, salle, enseignant, groupe, bouton « Supports du cours » |
| `mobile-33-semaine-grille.png`, `mobile-32-semaine-liste.png` | semaine en grille horaire / en liste, barre de couleur par cours |
| `mobile-39-supports-module.png` | supports d'un cours (module IA) avec boutons « Ouvrir » |
| `mobile-35-espaces-verre.png` | feuille « Espaces » : Planner, Bibliothèque, Jeux, Quiz, chacun ouvrable sur le web sans se reconnecter |
| `mobile-13-resultats.png` | résultats d'un vrai quiz : score 2 945 pts, 1er sur 4, défi par équipes, podium, nuage de mots |
| `mobile-28-jeux-devoir.png` | onglet Jeux : le joueur (personnage), quiz en direct, devoir à rendre, derniers quiz |
| `mobile-30-quiz-rejoindre.png` | rejoindre un quiz avec un code, aux couleurs HESTIM |
| `web-04-tableau-enseignant.png` | tableau de l'enseignant (panneau des départs, bouton « Lancer un quiz ») |
| `web-09-edt-mensuel.png` | emploi du temps du mois au format officiel de l'école (le PDF reste disponible) |
| `web-21-resultats-enseignant.png`, `web-22-nuage-de-mots.png` | résultats côté enseignant : classement, équipes, nuage de mots |
| `web-26-devoir-notes.png` | devoir noté : copies corrigées, notes sur 20 |
| `../../frontend/public/logo-planner.png`, `video/public/logos/HESTIM.png` | logos |

**À ne plus utiliser** :

- `mobile-01-*`, `mobile-10-*`, `mobile-21-*` : anciennes versions où chaque cours affichait « PLANIFIÉE » ;
- `web-08-generation.png` : écran trop technique ;
- `web-15-*` : interface d'origine de ClassQuiz.

Si un fichier manque, saute le plan correspondant plutôt que d'inventer un écran.

## Identité visuelle (obligatoire)

- **L'emblème HESTIM en 12 triangles**, comme l'animation de lancement de l'application (`mobile/src/intro/IntroLogo.jsx`). Grille de 3 × 3 cases, chaque pièce est un demi-carré. Sommets en unités de case, x vers la droite, y vers le bas :
  - marine `#001861` : (0,0)(1,0)(1,1) · (1,0)(1,1)(2,1) · (3,0)(3,1)(2,1) · (2,1)(3,1)(2,2) · (0,2)(1,2)(0,3) · (1,1)(1,2)(0,2)
  - rouge `#DB1F26` : (0,0)(0,1)(1,1) · (1,2)(2,2)(2,3)
  - orange `#F26322` : (2,0)(3,0)(2,1) · (2,2)(2,3)(3,3)
  - vert `#137D3F` : (2,2)(3,2)(3,3) · (1,2)(1,3)(0,3)
  - La case centrale reste vide. L'emblème est posé sur une **tuile blanche aux coins arrondis** : sur fond sombre, le marine disparaîtrait sans elle.
  - Fais-en un composant `Embleme` (SVG) qui sait s'assembler : chaque triangle arrive de l'extérieur, dans la direction de son centre par rapport au centre du logo, en tournant de 120° à 200°. Il apparaît en fondu, avec un ressort amorti et 50 ms de décalage d'une pièce à l'autre.
- **Le panneau des départs à volets** (split-flap, composant `Flap` existant) pour les titres et les chiffres : moitié haute qui tombe, charnière noire, léger rebond, 2 à 4 lettres « fausses » avant la bonne.
- Couleurs :
  - fond `#0B0B0D` ; tuile `#212124`, charnière `#000000`, filet `#2C2C30` ;
  - lettres `#F2F1EC`, texte secondaire `#A6A6AC` ;
  - marine HESTIM `#001861` pour un cadre ou une barre de titre.
  - Les couleurs du logo n'apparaissent que dans l'emblème.
- Couleurs de statut, **uniquement pour des statuts** :
  - vert « en cours » `#3FCB74` ;
  - orange « reporté » `#F26322` ;
  - rouge « annulé » `#FF5A5F`.
- Polices (`@remotion/google-fonts`) :
  - **Barlow Condensed** 600/700, en capitales espacées (0,06 à 0,16 em), pour les titres et les chiffres ;
  - **Barlow** 400/600 pour les phrases.
- Cadres :
  - captures web dans un cadre de navigateur sobre (barre sombre avec le nom « HESTIM Planner », sans adresse) ;
  - captures mobiles dans un cadre de téléphone fin et sombre ;
  - coins arrondis de 14 px, ombre douce, jamais de reflet ni de dégradé arc-en-ciel.
- Mouvement :
  - ressorts amortis (pas d'élastique) ;
  - zooms lents de type Ken Burns (1,00 → 1,06) sur les captures ;
  - coupes franches sur les temps ;
  - pas de transition gadget (cube, tourbillon).
- Une seule incrustation dessinée est permise : la **bannière de notification** de la scène 5, au style d'une notification de téléphone (fond sombre translucide, coins arrondis, petite tuile du logo). Tout le reste vient des captures.

## Storyboard (30 i/s, 120 BPM)

| # | Temps | Temps musicaux | Image | Texte à l'écran | Mouvement |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,0–4,0 s | 8 | fond noir | `HESTIM PLANNER`, puis « Toute la vie de l'école, dans une seule application. » | la tuile blanche apparaît (0,0–0,3 s) ; les 12 triangles s'assemblent dessus (0,3–1,6 s) ; le titre bascule en volets à droite de l'emblème (1,6–2,8 s) ; la phrase apparaît en fondu à 3,0 s |
| 2 | 4,0–9,0 s | 10 | six tuiles-étiquettes dispersées sur l'écran | `GMAIL` · `PDF` · `WHATSAPP` · `CLASSROOM` · `MOODLE` · `JEUX EXTERNES`, puis « 6 outils qui ne se parlent pas. » | une étiquette par temps (4,0–7,0 s), chacune à une place et une inclinaison différentes ; à 7,0 s elles s'écartent légèrement et un trait orange `#F26322` les barre l'une après l'autre ; la phrase apparaît à 7,5 s |
| 3 | 9,0–12,0 s | 6 | les six étiquettes, puis l'emblème, puis le téléphone | « Une seule application. » | les six étiquettes convergent vers le centre et se fondent dans l'emblème (9,0–10,0 s) ; l'emblème rétrécit et devient l'icône d'un téléphone qui entre de bas en haut avec `mobile-38-tableau` (10,0–12,0 s) |
| 4 | 12,0–17,0 s | 10 | téléphone : `mobile-37-mois` puis `mobile-36-fiche-verre` | « Un emploi du temps toujours à jour. » | zoom lent sur le mois ; à 14,5 s, un rond de toucher apparaît sur le jour sélectionné, puis la capture passe au détail de la séance par un glissement vertical court (la feuille monte) |
| 5 | 17,0–22,0 s | 10 | téléphone : `mobile-38-tableau` | « Prévenu à la seconde, sur son téléphone. » | à 18,0 s, la bannière descend du haut de l'écran du téléphone : pastille orange `#F26322`, « COURS REPORTÉ », puis « Analyse 1 · jeudi 13:30 · salle G-AMPHI2 » ; elle reste 2 s puis remonte |
| 6 | 22,0–27,0 s | 10 | téléphone `mobile-39-supports-module`, à côté de `web-09-edt-mensuel` dans le navigateur | « Les supports de chaque cours, à un geste. » puis « Le PDF officiel, toujours disponible. » | le téléphone à gauche, le navigateur entre par la droite à 24,5 s et s'arrête à côté ; la deuxième phrase remplace la première sur ce temps |
| 7 | 27,0–33,0 s | 12 | `mobile-13-resultats` dans le téléphone et `web-21-resultats-enseignant` dans le navigateur, puis `web-26-devoir-notes` | « Quiz, défis, devoirs notés. » puis « Les résultats restent à l'école. » | les deux écrans glissent l'un vers l'autre et s'arrêtent côte à côte ; la barre de l'équipe gagnante se remplit ; à 30,5 s, coupe sur le devoir noté (zoom lent) |
| 8 | 33,0–38,0 s | 10 | fond noir, trois chiffres en volets | `90 S` · « pour planifier tout un semestre » ; `1 COMPTE` · « au lieu de six outils » ; `0 PUBLICITÉ` · « pour les jeux et les quiz » | un chiffre par groupe de 3 temps (33,0 / 34,5 / 36,0 s) ; chaque chiffre bascule en volets, la légende apparaît en fondu dessous ; les trois restent alignés jusqu'à 38,0 s |
| 9 | 38,0–42,0 s | 8 | fond noir, cadre marine fin | emblème sur sa tuile, `HESTIM PLANNER`, « L'école, à l'heure. », `WEB · IPHONE · ANDROID` | l'emblème se réassemble en accéléré (0,8 s) ; le titre et l'adresse basculent en volets ; dernière seconde immobile, pour enchaîner sur la slide 1 |

## Contraintes de qualité

- Texte lisible au fond d'une salle :
  - 64 px minimum pour les titres, 40 px pour les phrases ;
  - contraste conforme WCAG AA ;
  - jamais plus de 8 mots à l'écran en même temps (hors captures).
- Vocabulaire : jamais de nom de technologie, de langage, de framework, de serveur ni de nombre de tests. On parle d'école, de cours, d'étudiants et d'enseignants.
- Captures : ni déformées, ni recadrées au point de cacher l'interface (`objectFit: 'cover'` et léger zoom seulement). Aucune capture où l'on lit « PLANIFIÉE ».
- Pas de flash : au plus 3 changements de luminosité forts par seconde.
- Avant le rendu final, vérifie les images aux temps clés avec `node scripts/verifier.mjs HestimPlanner 0 1 4 7.5 9.5 12 15 18.5 22 25 27 31 33 36.5 38 41.5`, regarde chaque image et corrige tout débordement ou chevauchement de texte.
- Mets à jour `video/README.md` : durée (42 s, 1260 images), tableau des 9 scènes avec leurs fichiers, commandes de vérification.
