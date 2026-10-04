---
version: 1
slug: "mobile"
primary_target: "mobile/src"
related_targets: ["shared"]
---

# Surface brief — HESTIM Planner mobile (application étudiant, Expo)

## Scope and mode
Application Android (puis iOS) des étudiants : Tableau, Semaine, Bibliothèque, Compte, Alertes, documents d'un module, « Partager mon stage ». Mode **Operate**.

## Audience, task, constraints
- Étudiant, téléphone, dehors ou dans le tram, souvent sans réseau : « où dois-je être, quand, et qu'est-ce qui a changé ? » en deux secondes, puis les supports du cours.
- Contraintes : Expo SDK 54 + expo-router 6, JavaScript ; jetons, logique des séances et traductions partagés avec le web (`shared/`) ; FR + EN ; TalkBack ; zones tactiles ≥ 48 dp ; police agrandie jusqu'à ×1,4 sur les cellules du panneau.

## Direction contract (dérivé de frontend-src : « panneau intégral épuré »)

THESIS: Le panneau des départs, en entier et sans décor : chaque séance est une ligne aux colonnes fixes (heure · carré de filière · cours et type · salle et campus · statut), la prochaine séance dépliée avec sa salle en monumental. Refuse les cartes arrondies empilées, les illustrations et les tableaux de bord.

OWN-WORLD: Sombre seul. Fond #0B0B0D, cellules #212124, filets #2C2C30, lettres #F2F1EC / #A6A6AC. Le marine #001861 seulement pour la barre de titre (et le cadre). Couleurs de statut seulement pour les statuts : vert #3FCB74 en cours / prochaine, orange #F26322 reporté (et rien d'autre), rouge #FF5A5F annulé. Petit carré à la couleur de la filière (`lineColor`). Barlow Condensed en capitales pour heure, cours, salle, statut ; Barlow pour le texte ; chiffres tabulaires. Aucune photo, aucun dégradé, aucune ombre, aucune carte imbriquée, une icône par onglet et c'est tout.

STORY: L'étudiant ouvre l'app : barre marine « MES SÉANCES », lampe verte « PROCHAINE · dans 20 minutes », l'heure sur les volets, la salle en très grand, le bâtiment, l'étage, l'enseignant ; « Supports du cours (3) » ouvre les documents du module. En dessous, aujourd'hui puis le prochain jour de cours, une ligne reportée avec l'ancienne date barrée. Sans réseau, le dernier tableau s'affiche avec « Hors ligne · mis à jour à 08:12 ».

FIRST VIEWPORT: 360–412 dp : barre marine (titre + cloche), mention de mise à jour discrète, carte de la séance en vedette (volets de l'heure, salle 56 sp), section AUJOURD'HUI en lignes de 56 dp, barre d'onglets basse sur fond panneau avec filet supérieur, onglet actif en couleur lettre surmonté d'une barre de 2 px.
Signature interaction : volets seulement sur l'heure de la prochaine séance, cascade de 28 ms par caractère, uniquement quand la valeur change ; rien ne bouge si « réduire les animations » est activé (`useReducedMotion`).

FORM: Même panneau de hall de gare que le web (seed 665998f2), en version « intégrale » : le sol clair « bureau » n'existe pas sur mobile.
