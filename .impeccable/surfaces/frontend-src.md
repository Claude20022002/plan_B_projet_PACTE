---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface brief — HESTIM Planner (application web complète)

## Scope and mode
Toute l'application authentifiée (étudiant, enseignant, admin) + connexion + accueil public. Mode **Operate**.

## Audience, task, constraints
- Étudiant (mobile, plein jour, couloirs Gandhi/Stendhal) : « où dois-je être, quand, et qu'est-ce qui a changé ? » en deux secondes.
- Enseignant (mobile) : confirmer ses séances, voir ses changements, demander un report.
- Admin / scolarité (PC, bureau éclairé, séances longues) : planifier, arbitrer conflits et reports, gérer les référentiels en tables denses.
- Contraintes : React + MUI + FullCalendar existants ; charte = couleurs du logo HESTIM ; FR + EN ; WCAG 2.2 AA ; projet PACTE démontré devant jury.

## Direction contract

THESIS: Chaque séance est une ligne vivante d'un panneau de départs : heure, cours, salle et bâtiment dans des colonnes qui ne bougent jamais, et un statut qui bascule (volets) quand la séance est confirmée, reportée, déplacée ou annulée. Refuse le dashboard SaaS de cartes KPI identiques et la grille hebdomadaire écrasée sur mobile.

OWN-WORLD: Cellules de volets noir mat (#0B0B0D) à lettres blanc cassé, cadre bleu marine HESTIM (remplace l'acier), filets d'un pixel entre colonnes. États : orange HESTIM = reporté / modifié, rouge HESTIM = annulé (texte rouge sombre sur la ligne), vert HESTIM = en cours / prochaine séance (lampe de ligne), blanc = à l'heure. Couleur de ligne par filière (palette logo dérivée), identique partout. Une seule famille : Barlow Condensed en capitales espacées pour les en-têtes de colonnes, horaires et codes de salle ; Barlow pour le texte courant ; chiffres tabulaires partout. Version « bureau » claire du même système pour l'admin : fond blanc, en-têtes de colonnes en capitales condensées, lignes réglées, statuts en pastilles-volets. Aucun dégradé, aucun verre, aucune carte imbriquée.

STORY: L'étudiant ouvre l'app et lit sa prochaine séance comme on lit un panneau en gare : salle en grand, bâtiment, heure ; un report saute aux yeux par la lampe orange et la bascule. L'enseignant confirme d'un geste. L'admin voit les départs du jour sur tout le campus, les conflits et reports en file, puis gère les référentiels dans des tables réglées sans friction. Le jury comprend chaque parcours sans explication.

FIRST VIEWPORT: Étudiant, mobile 390 px : bande de cadre bleu marine « HESTIM · MES SÉANCES · horloge » ; panneau noir pleine largeur, en-tête de colonnes HEURE | COURS | SALLE | STATUT en capitales condensées ; la prochaine séance en première ligne, allumée (lampe verte), dépliée en carte de détail : salle en monumental (ST-S06), bâtiment et étage, enseignant, compte à rebours ; lignes suivantes en dessous, une ligne reportée avec lampe orange et ancienne heure barrée ; barre d'onglets basse : Tableau · Semaine · Alertes · Compte. Admin, desktop 1440 : rail de navigation bleu marine à gauche (capitales condensées), panneau « Départs du jour » sur tout le campus à gauche du contenu, file « À traiter » (conflits, reports) à droite, accès direct aux tables de gestion. Action primaire admin : « Planifier une séance » en haut à droite.
Signature interaction : bascule des volets caractère par caractère (cascade décalée ~30 ms) quand un statut ou une salle change ; désactivée sous prefers-reduced-motion (mise à jour instantanée).

FORM: Panneau à volets de hall de gare à l'heure de pointe (challenger tiré en registre « bolder », premier distribué, choisi par l'utilisateur). Seed key 665998f2. Raises : couleur de ligne par filière (plan de transport), une seule couleur réservée à la séance active (orientation), échelle horaire identique pour toutes les semaines (folio botanique), une seule grotesque + grille en filets (annuel de design).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions
- Version SVG du logo HESTIM (PNG en attendant).
- Le dialogue de conflit 409 + forçage et la suggestion de créneaux libres attendent le service de règles (phase 3 backend).
