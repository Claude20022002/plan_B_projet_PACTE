---
name: HESTIM Planner
description: Planification des cours et réservation des salles de HESTIM, lue comme un panneau des départs de gare.
colors:
  hestim-navy: "#001861"
  hestim-navy-deep: "#000E3D"
  hestim-navy-soft: "#E8ECF7"
  hestim-orange: "#F26322"
  hestim-green: "#137D3F"
  board-ground: "#0B0B0D"
  board-cell: "#212124"
  board-hinge: "#000000"
  board-seam: "#2C2C30"
  board-letter: "#F2F1EC"
  board-letter-dim: "#A6A6AC"
  lamp-live: "#3FCB74"
  lamp-cancelled: "#FF5A5F"
  bureau-app: "#F3F4F7"
  bureau-surface: "#FFFFFF"
  bureau-subtle: "#EEF0F5"
  bureau-head: "#F6F7FA"
  ink: "#0D1326"
  ink-secondary: "#3F4759"
  ink-muted: "#5F6778"
  rule: "#DADDE5"
  rule-strong: "#B9BECB"
  success-bg: "#E7F4EC"
  warning-text: "#B4410C"
  warning-bg: "#FDEFE7"
  danger-text: "#B5161C"
  danger-bg: "#FCE8E9"
  night-primary: "#8FA6F0"
  line-1: "#3B63E0"
  line-2: "#1592C9"
  line-3: "#0F8A7E"
  line-4: "#7048C9"
  line-5: "#B03A8C"
  line-6: "#46508F"
  line-unknown: "#6B6B72"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2rem, 9vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.01em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.02em"
  board-row:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontFeature: "tnum"
  body:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "0.14em"
  button:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
spacing:
  unit: "8px"
  frame: "8px"
  frame-phone: "6px"
  cell: "12px"
  cell-phone: "10px 8px"
components:
  button-primary:
    backgroundColor: "{colors.hestim-navy}"
    textColor: "{colors.bureau-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.hestim-navy-deep}"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.hestim-navy}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  status-pill:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-text}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "24px"
  board-frame:
    backgroundColor: "{colors.hestim-navy}"
    rounded: "{rounded.lg}"
    padding: "{spacing.frame}"
  board-ground:
    backgroundColor: "{colors.board-ground}"
    textColor: "{colors.board-letter}"
    rounded: "{rounded.md}"
  flap-tile:
    backgroundColor: "{colors.board-cell}"
    textColor: "{colors.board-letter}"
    typography: "{typography.board-row}"
    rounded: "{rounded.xs}"
    height: "1.32em"
  input:
    backgroundColor: "{colors.bureau-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "40px"
  nav-rail:
    backgroundColor: "{colors.hestim-navy}"
    textColor: "{colors.bureau-surface}"
    width: "248px"
---

# Design System: HESTIM Planner

## Overview

**Creative North Star: "Le Hall des Départs"**

Chaque séance est une ligne d'un panneau de départs de gare : heure, cours, salle, statut, dans des colonnes qui ne bougent jamais. Le panneau est noir mat, encadré du bleu marine HESTIM, ses lettres blanc cassé posées sur des volets à charnière. Quand une séance est reportée, déplacée ou annulée, son statut ou sa salle bascule caractère par caractère, et la lampe de ligne change de couleur. Le reste du produit se tait pour que ce changement se voie.

Le système a deux sols pour une seule grammaire. Le **panneau** (sombre) porte le direct : tableau de l'étudiant et de l'enseignant sur téléphone, accueil public, connexion, cellules de la grille hebdomadaire. Le **bureau** (clair) porte la gestion dense de l'administration : fond gris très clair, tables réglées, en-têtes de colonnes en capitales condensées, statuts en pastilles-volets. Les deux partagent la même famille (Barlow), les mêmes couleurs d'état et la même couleur de ligne par filière. Un mode nuit réutilise les matières du panneau pour les écrans de gestion.

La densité est celle d'un horaire : beaucoup d'information, alignée sur des chiffres tabulaires, séparée par des filets d'un pixel plutôt que par des cartes. Les photos réelles du campus (hestim.ma) sont étalonnées vers la nuit du hall et légendées comme des panneaux de quai.

**Key Characteristics:**
- Panneau noir mat dans un cadre bleu marine, filets d'un pixel entre lignes.
- Barlow Condensed en capitales espacées pour tout ce qu'on lit en colonne ; Barlow pour les phrases.
- Chiffres tabulaires partout.
- Une couleur par état (vert en cours, orange reporté, rouge annulé), une couleur par filière, jamais mélangées.
- Une seule animation signature : la bascule des volets, réservée aux changements d'état.
- Surfaces plates ; la profondeur vient du cadre et du contraste noir/blanc, pas des ombres.

## Colors

Une palette de signalétique : le bleu marine et l'orange du logo HESTIM sur du noir de panneau ou du blanc de bureau, plus six couleurs de ligne pour les filières.

### Primary
- **Bleu Marine HESTIM** (hestim-navy) : cadre du panneau, rail de navigation, bandeau supérieur sur téléphone, bouton d'action primaire, sélection de texte, `theme-color` du navigateur. Contraste 15:1 sur blanc.
- **Marine Profond** (hestim-navy-deep) : survol du bouton primaire.
- **Marine Voilé** (hestim-navy-soft) : élément sélectionné sur le bureau, fond des avis d'information.
- **Bleu Pervenche de Nuit** (night-primary) : remplace le marine comme couleur primaire en mode nuit, où le marine pur ne se lirait pas sur le noir.

### Secondary
- **Orange HESTIM** (hestim-orange) : l'état « reporté / modifié » sur le panneau, le titre « Changements récents », l'icône de la rubrique active dans le rail, l'anneau de focus clavier et le curseur de saisie. Sur le bureau, l'orange se lit en **Orange Brûlé** (warning-text) sur **Pêche Pâle** (warning-bg) pour tenir le contraste.

### Tertiary
- **Vert Lampe** (lamp-live) : lampe de la séance en cours ou prochaine, statut « confirmée » sur le panneau, compte à rebours de la séance en vedette. C'est le vert du logo (hestim-green) éclairci pour tenir 4.5:1 sur le noir ; sur le bureau, le vert du logo s'emploie tel quel sur success-bg.
- **Rouge Signal** (lamp-cancelled) : séance annulée sur le panneau (texte et trait de barré). Rouge du logo (#DB1F26) éclairci ; sur le bureau, **Rouge Sombre** (danger-text) sur danger-bg. Le rouge du logo lui-même n'est pas posé tel quel sur l'interface.

### Neutral
- **Noir de Panneau** (board-ground) : fond du panneau, cellules de la grille hebdomadaire, fond des infobulles, légendes photo.
- **Face de Volet** (board-cell) : face d'une tuile de volet, nettement détachée du fond ; squelettes de chargement sur le panneau.
- **Charnière** (board-hinge) : filet horizontal d'un pixel au milieu de chaque tuile, peint derrière le caractère.
- **Filet de Colonne** (board-seam) : filets entre lignes et colonnes du panneau, bordures en mode nuit.
- **Blanc Cassé** (board-letter) : lettres du panneau, statut « planifiée / à l'heure ».
- **Gris Quai** (board-letter-dim) : en-têtes de colonnes, bâtiment, enseignant, textes secondaires sur le panneau (≥ 7:1).
- **Fond Bureau** (bureau-app), **Papier** (bureau-surface), **Gris Réglé** (bureau-subtle, bureau-head) : sol, surfaces et bandeaux de jour / en-têtes de table du bureau.
- **Encre** (ink), **Encre Seconde** (ink-secondary), **Encre Effacée** (ink-muted) : les trois niveaux de texte du bureau.
- **Filet** (rule) et **Filet Appuyé** (rule-strong) : lignes de table et bordures ; le filet appuyé souligne les en-têtes de colonnes et borde les boutons secondaires.

### Couleurs de ligne (filières)
- **Six lignes** (line-1 à line-6 : bleu, azur, sarcelle, violet, prune, ardoise) : une filière reçoit une couleur stable calculée depuis son identifiant (`lineColor`), identique sur le panneau, la grille hebdomadaire et les graphiques de Statistiques. Elle s'affiche en petit carré de 8 à 10 px avant le nom du cours, ou en remplissage de graphique.
- **Gris Inconnu** (line-unknown) : filière absente ; jamais attribué à une vraie filière.

### Named Rules
**The One Signal Per State Rule.** Vert = en cours / prochaine / confirmée, orange = reportée / modifiée, rouge = annulée, blanc = à l'heure. Ces trois teintes ne servent jamais à autre chose qu'un état (exception unique : l'orange signale aussi le focus clavier et la rubrique active, qui sont des états d'interface).

**The Line Is Not A Status Rule.** Les couleurs de ligne restent hors de l'orange, du rouge et du vert. Une filière ne doit jamais pouvoir être lue comme un report ou une annulation.

**The Two Grounds Rule.** Chaque teinte d'état a une valeur « panneau » (éclaircie, lisible sur le noir) et une valeur « bureau » (assombrie, lisible sur le blanc), tirées de `ds.status`. Ne jamais poser la valeur d'un sol sur l'autre.

## Typography

**Display Font:** Barlow Condensed (avec Arial Narrow, sans-serif)
**Body Font:** Barlow (avec Segoe UI, system-ui, sans-serif)

**Character:** Une seule grotesque de signalétique, déclinée en deux chasses. La condensée en capitales espacées est la voix du panneau (ce qu'on lit en colonne, d'un coup d'œil) ; la Barlow normale est la voix des phrases. Les deux sont auto-hébergées (graisses 400 à 700 pour Barlow, 500 à 700 pour la condensée).

### Hierarchy
- **Display** (600, clamp(2rem, 9vw, 2.75rem), 1) : le code de salle de la séance en vedette, posé sur des tuiles de volet comme un numéro de quai. Variante accueil : « PLANNER » en tuiles orange (clamp(2.25rem, 4.4vw, 3.75rem)).
- **Headline** (700, 1.75rem, 1.15) : titre de page (h1), titre de la connexion (2 à 2.25rem).
- **Title** (600, 1.125rem, 1.25) : titres de section ; le titre d'un panneau passe en capitales 700 à 0.12em (1 à 1.125rem).
- **Board row** (600, 1.05rem desktop / 0.875rem téléphone, capitales, 0.04em / 0.02em) : heure, nom du cours, code de salle dans une ligne du panneau.
- **Body** (400, 0.9375rem, 1.55) : texte courant, avis de changement ; secondaire à 0.875rem / 1.5, légende à 0.8125rem. Sur l'accueil, les paragraphes tiennent en 34 à 46ch.
- **Label** (600, 0.75rem, capitales, 0.14em) : en-têtes de colonnes du panneau ; 0.1em pour les en-têtes de tables MUI et les pastilles d'état ; 0.8125rem pour les bandeaux de jour.
- **Button** (600, 0.9375rem, capitales, 0.06em) : boutons et onglets (0.875rem), en condensée.

### Named Rules
**The Tabular Everywhere Rule.** `font-variant-numeric: tabular-nums` est posé sur le corps et sur chaque cellule de table : horaires, dates et codes de salle s'alignent en colonnes. Ne jamais l'annuler localement.

**The Condensed Caps Rule.** Tout ce qu'on lit en colonne (en-têtes, horaires, codes de salle, statuts, boutons, onglets, rubriques du rail) est en Barlow Condensed capitales espacées. Les phrases (messages, descriptions, noms de personnes) restent en Barlow casse normale.

## Layout

Le panneau est un vrai tableau HTML à disposition fixe : une colonne de lampe (26 px, 18 px sur téléphone) puis HEURE (84 / 54 px), COURS (souple), SALLE (120 / 68 px), STATUT (132 / 62 px, aligné à droite) ; GROUPE (110 px) et ENSEIGNANT (190 px) s'ajoutent sur grand écran. Sous 600 px, groupe et enseignant passent sous le nom du cours (retrait de 18 px, aligné après le carré de ligne) et le nom du cours tient sur trois lignes au plus, mots entiers. Les séances sont groupées par jour sous un bandeau pleine largeur ; « Aujourd'hui » s'y écrit en blanc (panneau) ou en marine (bureau).

La séance en vedette se déplie sous sa propre ligne, dans le panneau : salle monumentale à gauche, quand / quoi / avec qui à droite (une colonne sur téléphone). Les avis de changement s'insèrent juste dessous sur téléphone, ou à côté du tableau sur le bureau.

Coquille : à partir de 900 px, rail de navigation bleu marine fixe à gauche (248 px), contenu limité à 1480 px. En dessous, bandeau marine en haut, rail en tiroir, et barre d'onglets basse (Tableau · Semaine · Alertes · Compte) pour étudiants et enseignants. La grille hebdomadaire garde une échelle horaire identique pour toutes les semaines (créneaux de 1.6rem).

Rythme : base 8 px (MUI). Cellules du panneau 12 px (10 × 8 px sur téléphone), cadre de 8 px (6 px sur téléphone) autour du noir. Cibles tactiles de 40 px minimum, 48 à 52 px pour les actions principales de connexion et d'accueil.

## Elevation & Depth

Le système est plat. Papiers et cartes sont à élévation 0, sans ombre, bordés d'un filet ; aucune image de fond ni dégradé sur les surfaces MUI. La profondeur vient de trois choses seulement : le cadre bleu marine qui enchâsse le noir du panneau, la face de volet plus claire que le fond, et la charnière qui coupe chaque tuile. Seuls les calques flottants (dialogues, menus, infobulles du graphique) gardent l'ombre par défaut de MUI.

### Named Rules
**The Frame Not Shadow Rule.** Un élément se détache par son cadre ou par un filet, jamais par une ombre. Les jetons `ds.shadow` existent mais ne sont pas employés ; ne pas les introduire sur des surfaces au repos.

**The No Nested Cards Rule.** Une ligne de panneau ou de table n'est jamais une carte, et une carte ne contient jamais une autre carte.

## Shapes

Des angles presque droits, comme du métal de panneau : 2 px pour les tuiles de volet, pastilles d'état, carrés de ligne et squelettes ; 3 px pour boutons, champs, rubriques du rail, alertes et infobulles ; 4 px pour cartes, tables et le noir intérieur du panneau ; 6 px pour le cadre du panneau, les figures photo et les dialogues. Seules les lampes de ligne et les puces d'avis sont rondes (8 px) : ce sont des voyants. Les filets font toujours 1 px.

## Components

### Buttons
Sobres et signalétiques : ils parlent en capitales condensées.
- **Shape :** angles quasi droits (3 px), hauteur minimale 40 px, 32 px en petite taille (0.8125rem, marge latérale 10 px).
- **Primary :** fond bleu marine, texte blanc, sans élévation ; en mode nuit, fond pervenche et texte noir de panneau.
- **Hover / Focus :** le fond passe au marine profond (pervenche plus claire la nuit) ; focus clavier par un contour orange de 2 px décalé de 2 px.
- **Outlined :** bordure filet appuyé (filet de colonne la nuit), texte marine ; utilisé pour la navigation de semaine, le téléchargement, les bascules de vue.
- **Sur le panneau :** les boutons texte prennent la couleur blanc cassé.

### Chips / Pastilles d'état
- **Style :** petit volet clair, 24 à 26 px de haut, angles de 2 px, capitales condensées 0.75rem à 0.1em, fond et texte tirés de la valeur « bureau » de l'état.
- **State :** planifiée (encre seconde sur gris réglé), confirmée (vert logo sur success-bg), reportée (orange brûlé sur pêche), annulée (rouge sombre sur danger-bg). Le libellé bascule en volets quand l'état change.

### Cards / Containers
- **Corner Style :** 4 px (6 px pour le panneau d'avis et le cadre).
- **Background :** papier sur le bureau, face de volet en mode nuit.
- **Shadow Strategy :** aucune (voir Elevation & Depth).
- **Border :** filet de 1 px.
- **Internal Padding :** 16 px horizontal, 12 px vertical pour les en-têtes et les avis.

### Inputs / Fields
- **Style :** champs MUI contourés en petite taille, angles de 3 px, filet de bordure.
- **Focus :** bordure primaire MUI, curseur de saisie orange, anneau orange global au clavier.
- **Error / Disabled :** couleurs d'erreur et de désactivation MUI, alimentées par danger-text.

### Navigation
- **Rail (desktop, 248 px) :** fond bleu marine ; logo sur une plaque blanche à 4 px ; « PLANNER » et le rôle dessous. Groupes de rubriques titrés en capitales condensées (#8D9BCF) : Planning, Scolarité, Personnes. Rubriques en Barlow 40 px de haut, texte #D3DAF1 ; survol voile blanc 7 % ; active en blanc sur voile 12 % avec icône orange. Pied : avatar, bascule FR / EN, mode nuit, déconnexion.
- **Téléphone :** bandeau marine en capitales condensées, rail en tiroir, barre d'onglets basse en libellés condensés ; onglet actif en couleur primaire.
- **Bascules de vue (Par groupe / Par enseignant / Tout le campus, Grille / Liste) :** groupes de boutons en capitales condensées, sélection sur gris réglé.

### Panneau des départs (signature)
Le cœur du système (`DepartureBoard`). Variante **panneau** : cadre marine de 8 px, titre en capitales blanches et horloge en volets dans le cadre, noir intérieur à 4 px, lampe de ligne, heure sur tuiles de volet, carré de filière avant le cours, salle et bâtiment, statut coloré à droite. Variante **bureau** : même tableau sur papier, bordé d'un filet, tuiles gris réglé, pastilles d'état. Ligne en vedette : voile vert à 7 % (panneau) ou #EEF6F1 (bureau). Séance annulée : ligne grisée, nom du cours barré de rouge signal. Les données se rafraîchissent en silence toutes les 60 s et au retour sur l'onglet (`useLiveRefresh`), ce qui fait basculer les volets sans recharger la page.

### Volets (signature)
`FlapTiles` pose chaque caractère sur une tuile (face de volet, charnière d'un pixel peinte derrière le glyphe, 0.72 em de large, 1.32 em de haut, séparateurs sans tuile) ; `FlapText` fait basculer du texte nu. Au changement de valeur, chaque position pivote sur l'axe horizontal (220 ms, cubic-bezier(0.16, 1, 0.3, 1)), décalée de 28 ms par caractère. Le texte complet est exposé une seule fois aux lecteurs d'écran ; sous `prefers-reduced-motion`, la mise à jour est instantanée.

### Séance en vedette
`SessionSpotlight` : libellé SALLE en capitales grises, salle en tuiles monumentales, bâtiment et étage ; à droite, « En cours · fin dans… » ou le compte à rebours en vert lampe capitales, nom du cours en Barlow 600, horaire · durée · enseignant · groupe en gris, actions (confirmer) dessous.

### Grille hebdomadaire
Sur fond bureau, chaque séance est une cellule de panneau : noir de panneau, carré de filière, nom du cours en capitales condensées sur deux lignes, « heure · salle » en gris quai, statut en volet seulement si la séance est reportée ou annulée (annulée : nom barré, gris).

### Photos et légendes de quai
Photos réelles du campus encadrées comme le panneau (cadre marine 6 px, image à 4 px), étalonnées vers la nuit du hall (`saturate(0.72) brightness(0.78) contrast(1.06)`), légendées par une plaque noir de panneau en bas à gauche, capitales condensées blanc cassé à 0.12em.

### Écart connu (non construit)
L'ancienne heure barrée d'une séance reportée (« Prévu … » en `del`, sous l'heure et dans la séance en vedette) est câblée mais n'affiche rien tant que le backend ne conserve pas la date initiale. Le dialogue de conflit 409 avec forçage administrateur n'existe pas encore. Les écrans de gestion autres que Séances et Statistiques héritent seulement du thème (tables, boutons, pastilles) sans composition propre.

## Do's and Don'ts

### Do:
- **Do** afficher toute liste de séances comme une ligne de panneau à colonnes fixes (lampe | heure | cours | salle | statut), dans un tableau sémantique.
- **Do** tirer chaque couleur d'état de `ds.status` avec la valeur du sol courant (board ou bureau).
- **Do** marquer chaque filière par sa couleur `lineColor(id)` en carré de 8 à 10 px, à l'identique sur le panneau, la grille et les graphiques.
- **Do** faire basculer en volets (28 ms par caractère) un statut, une salle ou une horloge qui change, et rien d'autre.
- **Do** écrire en-têtes, horaires, codes de salle, statuts et boutons en Barlow Condensed capitales espacées, et garder les phrases en Barlow.
- **Do** séparer par des filets de 1 px et détacher par le cadre marine, avec des angles de 2 à 6 px.
- **Do** étalonner les photos du campus vers le ton du panneau et les légender d'une plaque noire en capitales.

### Don't:
- **Don't** construire un tableau de bord SaaS de cartes KPI identiques, ni écraser la grille hebdomadaire sur téléphone : sur téléphone, c'est le panneau.
- **Don't** utiliser l'orange, le rouge ou le vert pour une filière, une décoration ou un graphique sans signification d'état.
- **Don't** poser de dégradé décoratif, d'effet de verre ou de carte imbriquée sur une surface ; la seule exception native est la charnière d'un pixel des tuiles de volet.
- **Don't** ajouter d'ombre à une surface au repos.
- **Don't** animer pour décorer : pas d'autre mouvement que la bascule des volets et les transitions d'état MUI, et aucun mouvement sous `prefers-reduced-motion`.
- **Don't** ajouter de surtitre au-dessus d'un titre de page : le titre porte seul la hiérarchie.
