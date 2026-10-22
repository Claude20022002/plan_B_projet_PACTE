# Dossier de production : vidéo promo PACTE (école)

Format : vidéo publicitaire de 60 s, minimaliste et fluide, réalisée avec Claude Code (Opus 5.5) + Remotion.

> **À lire d'abord.** Je n'ai pas pu lire votre dépôt GitHub (erreur 404 : il est probablement privé ou l'URL est inexacte), ni visionner vos 4 vidéos YouTube de référence. Je n'invente donc aucune fonctionnalité : tout ce qui est entre `[crochets]` est à confirmer. Le prompt maître ci-dessous demande à Claude Code de **lire lui-même le dépôt en local** (phase 0) avant de produire quoi que ce soit, puis de réécrire le script avec les vraies fonctionnalités.

---

## 1. Prompt maître (à coller dans Claude Code, à la racine du dépôt)

````
RÔLE
Tu es à la fois directeur artistique motion design, copywriter publicitaire B2B (secteur éducation) et développeur créatif expert de Remotion (React + TypeScript). Tu réalises seul une vidéo publicitaire de 60 secondes pour le produit présent dans ce dépôt.

OBJECTIF
Faire vendre l'application à des décideurs d'établissements scolaires (directeurs, directions pédagogiques, responsables administratifs, DSI d'école). La vidéo doit faire comprendre en 10 secondes quel problème le produit résout, puis prouver la valeur en 3 fonctionnalités, puis déclencher une démo.

PHASE 0 : AUDIT (ne produis rien avant d'avoir terminé et résumé)
1. Lis README, package.json / requirements, structure des dossiers, routes/pages, modèles de données, captures présentes dans le dépôt.
2. Écris AUDIT.md : nom du produit, promesse en une phrase, utilisateurs (rôles), problème résolu, 3 fonctionnalités les plus vendeuses (avec le fichier/page qui les prouve), points de preuve chiffrables. Si une information manque, écris "À CONFIRMER" : n'invente JAMAIS une fonctionnalité, un chiffre ou un témoignage.
3. Liste les écrans que tu peux capturer toi-même (lance l'app en local, utilise Playwright pour capturer en 1920x1080 avec des données de démonstration fictives et propres : aucun vrai nom d'élève, aucune donnée personnelle).
4. Pose-moi au maximum 5 questions bloquantes, puis attends ma réponse.

PHASE 1 : DIRECTION ARTISTIQUE (écris DA.md)
- Style : minimaliste, fluide, beaucoup d'espace vide, une seule idée par plan.
- Palette : fond clair cassé (#F7F7F5) ou sombre (#0E0F12), 1 couleur d'accent tirée de l'identité du produit (sinon propose-en une), texte à fort contraste. Maximum 3 couleurs.
- Typo : une seule famille sans-serif (Inter ou Manrope via @remotion/google-fonts), 2 graisses maximum, titres 72 à 110 px, jamais plus de 7 mots par écran.
- Mouvement : ressorts doux (spring, damping élevé), easing Easing.bezier(0.22, 1, 0.36, 1), aucune coupe sèche : chaque scène entre et sort par fondu + translation de 24 à 40 px. Zooms lents (1.00 → 1.06) sur les captures. Les mockups d'interface flottent dans un cadre arrondi avec ombre douce.
- Rythme : une scène dure 4 à 12 s, pas de plan inférieur à 3 s.
- Interdits : stock footage générique, emojis, clipart, effets de glitch, texte long, plus de 3 animations simultanées.

PHASE 2 : STORYBOARD + SCRIPT
- Reprends le storyboard et le script de voix off ci-dessous (fichier STORYBOARD.md), mais RÉÉCRIS les textes avec les vraies fonctionnalités issues de AUDIT.md en gardant la même durée par scène et un maximum de 130 mots de voix off au total (rythme ~2,2 mots/seconde, avec des respirations).
- Ton : clair, rassurant, concret, vouvoiement, zéro jargon technique, bénéfices avant fonctionnalités.

PHASE 3 : PRODUCTION
- Initialise un projet Remotion dans /video (npx create-video@latest, template vide TypeScript).
- Une composition principale "PactePromo" 1920x1080, 30 fps, 1800 frames, plus des composants par scène (Scene01Hook ... Scene08CTA) pilotés par <Sequence> et un fichier timing.ts central (durées en secondes, converties en frames).
- Les captures vont dans /video/public/captures, la voix off dans /video/public/audio/voix.mp3, la musique dans /video/public/audio/musique.mp3.
- Sous-titres français incrustés (bas centré, 44 px, fond semi-transparent), synchronisés avec la voix off.
- Musique : volume 12 % sous la voix, ducking automatique (baisse à 6 % quand la voix parle), fondu d'entrée 1 s et de sortie 2 s.
- Vérifie le rendu : après chaque scène, lance npx remotion still pour sortir une image clé, regarde-la, corrige les débordements, alignements et lisibilité avant de continuer.
- Exports : MP4 H.264 1080p (16:9) pour la présentation, puis une variante 1080x1920 (9:16) et 1080x1080 (1:1) pour les réseaux, via des compositions dérivées.

PHASE 4 : CONTRÔLE QUALITÉ
Avant de me rendre la vidéo, vérifie et coche dans QA.md : durée = 60 s ± 1 s ; aucune donnée personnelle visible ; texte lisible sur mobile ; aucune affirmation non prouvée par AUDIT.md ; voix et sous-titres synchronisés ; pas de coupure audio ; poids du MP4 < 80 Mo.

RÈGLES DE TRAVAIL
- Procède phase par phase et attends mon feu vert à la fin des phases 0, 2 et 3 (premier rendu).
- Si un asset manque (capture, logo, voix), génère un placeholder propre et signale-le clairement dans la liste "À fournir".
- Réponds en français. Commits Git réguliers sur une branche video/promo.
````

---

## 2. Storyboard (60 s, 16:9)

| # | Temps | Plan (visuel) | Texte à l'écran | Mouvement / transition | Son |
|---|-------|---------------|-----------------|------------------------|-----|
| 1 | 0:00 à 0:04 | Fond uni, un seul élément du quotidien scolaire qui déborde (pile de feuilles ou grille d'emploi du temps surchargée, dessinée en formes simples) | « [Problème principal de l'école] » | Les éléments apparaissent un à un, légère montée de tension visuelle | Musique douce, une note grave |
| 2 | 0:04 à 0:12 | Le désordre se multiplie (3 à 4 formes qui se chevauchent), puis tout se fige | « Trop de temps perdu. » | Chevauchement puis arrêt net, fondu vers blanc | Silence bref à 0:11 |
| 3 | 0:12 à 0:18 | Fond clair, le logo [PACTE] se dessine au centre, tagline dessous | « [PACTE] » + « [Promesse en une phrase] » | Tracé du logo, ressort doux, léger zoom arrière | Entrée de la musique principale |
| 4 | 0:18 à 0:30 | Capture écran n°1 dans un cadre arrondi, flottante. Un halo met en valeur la zone clé | « [Fonctionnalité 1] » | Zoom lent 1.00 → 1.06, surbrillance qui glisse sur l'élément important | Voix off |
| 5 | 0:30 à 0:40 | Capture n°2 qui remplace la première par glissement latéral fluide | « [Fonctionnalité 2] » | Glissement 40 px + fondu, curseur animé qui clique | Voix off |
| 6 | 0:40 à 0:48 | Capture n°3 (ou vue mobile), trois pastilles de bénéfices apparaissent en cascade | « [Fonctionnalité 3] » | Cascade décalée de 6 frames par pastille | Voix off |
| 7 | 0:48 à 0:55 | Fond uni, 3 chiffres ou preuves, un par ligne (uniquement des chiffres vérifiés) | « [Chiffre 1] · [Chiffre 2] · [Chiffre 3] » | Compteurs qui montent, puis fondu | Musique qui s'élève |
| 8 | 0:55 à 1:00 | Logo centré, bouton « Demander une démo » et URL | « Demandez votre démo » + [url / contact] | Logo qui revient, bouton qui pulse une seule fois, fondu au blanc | Fin de musique (fade 2 s) |

---

## 3. Script de voix off (≈ 125 mots, ton posé et chaleureux)

Les passages entre crochets sont à remplacer après l'audit du dépôt.

**[0:00 à 0:12]**
« Chaque semaine, vos équipes perdent des heures sur [la tâche chronophage de l'école]. Des fichiers dispersés, des erreurs, des relances sans fin. Et pendant ce temps, l'essentiel passe après. »

**[0:12 à 0:18]**
« Voici [PACTE] : [promesse en une phrase]. »

**[0:18 à 0:30]**
« [Fonctionnalité 1 formulée en bénéfice]. En quelques clics, [résultat concret pour la direction ou les enseignants]. »

**[0:30 à 0:40]**
« [Fonctionnalité 2 formulée en bénéfice]. Tout le monde voit la même information, au même moment. »

**[0:40 à 0:48]**
« Et [Fonctionnalité 3 formulée en bénéfice], sur ordinateur comme sur mobile. »

**[0:48 à 0:55]**
« Résultat : [bénéfice mesurable vérifié]. Plus de clarté pour vos équipes, plus de temps pour vos élèves. »

**[0:55 à 1:00]**
« [PACTE]. Demandez votre démo dès aujourd'hui. »

Conseil : si vous n'avez aucun chiffre vérifié, remplacez la scène 7 par trois bénéfices qualitatifs. N'affichez jamais un chiffre que vous ne pouvez pas justifier devant un directeur d'école.

---

## 4. Plan technique de production

**Pourquoi Remotion.** La vidéo est du code React : chaque scène est un composant, les animations sont reproductibles, et Claude Code peut écrire, relancer le rendu et corriger lui-même. C'est le chemin le plus direct pour obtenir un rendu minimaliste et fluide sans logiciel de montage.

**Pipeline**

1. **Audit** du dépôt (AUDIT.md) puis validation par vous.
2. **Captures** : Playwright en 1920x1080, thème propre, données fictives. À défaut, vos propres captures dans `video/public/captures/` (PNG, 2x si possible).
3. **Voix off** : générez le MP3 avec une voix neuronale française (ElevenLabs, Azure Neural ou équivalent) à partir du script final, rythme légèrement lent. Ou enregistrez la vôtre au micro dans une pièce calme.
4. **Musique** : instrumental doux, 90 à 110 BPM, libre de droits avec licence commerciale vérifiée (bibliothèque audio YouTube, Pixabay, Artlist, etc.). Gardez la preuve de licence.
5. **Build Remotion** : composition 1920x1080 à 30 fps, scènes en `<Sequence>`, animations avec `spring` et `interpolate`, sous-titres synchronisés, ducking de la musique.
6. **Rendu** : `npx remotion render PactePromo out/pacte-16x9.mp4`, puis variantes 9:16 et 1:1.
7. **QA** : revue image par image des moments clés, test sur téléphone, vérification des droits et des données visibles.

**Arborescence proposée**

```
video/
  public/
    captures/  (ecran-01.png, ecran-02.png, ecran-03.png)
    audio/     (voix.mp3, musique.mp3)
    logo.svg
  src/
    Root.tsx
    timing.ts
    theme.ts        (couleurs, typo, easing)
    scenes/         (Scene01Hook.tsx ... Scene08CTA.tsx)
    components/     (DeviceFrame.tsx, Subtitle.tsx, Counter.tsx)
  AUDIT.md  DA.md  STORYBOARD.md  QA.md
```

**Réglages de référence**

- Résolution 1920x1080, 30 fps (60 fps possible si vos captures contiennent beaucoup de défilement).
- Export MP4 H.264, débit 8 à 12 Mbit/s, audio AAC 192 kbit/s.
- Marge de sécurité de 120 px autour du texte pour les formats verticaux.
- Contraste texte/fond d'au moins 4,5:1.

**Livrables attendus de Claude Code**

- `out/pacte-16x9.mp4` (principal), `out/pacte-9x16.mp4`, `out/pacte-1x1.mp4`
- Les 3 images clés pour la miniature
- La liste « À fournir » (assets manquants) et QA.md rempli

---

## 5. Pour aller plus loin

- **Prochaine étape recommandée** : ouvrez Claude Code dans le dossier du dépôt, collez le prompt maître, et répondez à ses 5 questions de la phase 0.
- Si votre dépôt est bien privé, aucune action de ma part n'est nécessaire : Claude Code le lit en local. Si l'URL était fausse, envoyez-moi la bonne et je personnalise le script tout de suite.
- Pour coller au style de vos 4 références, notez 3 choses précises sur chacune (rythme des plans, type de transitions, couleur dominante) et ajoutez-les dans la phase 1 du prompt : c'est ce qui rapproche le plus le résultat de ce que vous avez en tête.
