# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Administration / scolarité (rôle `admin`)** : planifie les cours, gère salles, groupes, filières, enseignants et étudiants, arbitre les conflits et les demandes de report. Travaille sur **ordinateur**, en séances longues, avec beaucoup de données à parcourir.
- **Enseignants (rôle `enseignant`)** : consultent leur emploi du temps, confirment leurs séances, déclarent leurs disponibilités, demandent des reports. Surtout sur **mobile**, entre deux cours.
- **Étudiants (rôle `etudiant`)** : consultent l'emploi du temps de leur groupe et sont prévenus des changements (report, annulation, changement de salle). Presque exclusivement sur **mobile**.
- **Jury PACTE** : le produit est un projet étudiant évalué (séances Go/NoGo, mi-parcours, soutenance finale). La démonstration doit montrer chaque parcours de bout en bout.

## Product Purpose

HESTIM Planner est la plateforme de planification des cours et de réservation des salles de HESTIM Engineering & Business School. Elle centralise les données pédagogiques, empêche les conflits d'horaire (salle, enseignant, groupe), génère automatiquement les emplois du temps sous contraintes, et synchronise les plannings entre administration, enseignants et étudiants.

Réussite (cahier des charges PACTE, `docs/rapports/Descriptif du projet PACTE - 3A-IIIA.pdf`) : application complète et déployée ; emploi du temps dynamique et synchronisé ; tableau de bord analytique (taux d'occupation des salles, fréquence d'utilisation, heures creuses / pics d'activité) ; démonstration d'un report de cours automatique ; notifications lors des modifications de planning ; interface « claire et intuitive conforme aux principes UX/UI ».

## Positioning

Contrairement aux suites génériques (Pronote, Hyperplanning, WebUntis, Celcat), HESTIM Planner est taillé pour la structure réelle de HESTIM : deux bâtiments (Gandhi, Stendhal), cycles Prépa / Ingénieur / Management, groupes par filière et niveau, créneaux propres à l'école, et un circuit de report demandé par l'enseignant puis validé par la scolarité avec notification automatique des étudiants concernés.

## Operating Context

- Format réel de l'emploi du temps HESTIM (`docs/exemple_emploi_du_temp - 3A IIIA (Du 30 Mars Au 26 Avril 2026).pdf`) : document de période (environ 4 semaines) par groupe, en-tête « 1ère année du cycle Ingénieur d'État en Ingénierie Informatique et Intelligence Artificielle — 3A | IIA (S6) » ; lignes par jour du lundi au samedi ; pour chaque séance trois informations : **Matière**, **Enseignant**, **Salle** (ex. « HESTIM-STENDHAL : Étage 3 - Amphi C »).
- Créneaux observés : matin 09:00–10:45 et 11:00–12:30 ; après-midi 13:30–15:15 et 15:30–17:00 ; vendredi après-midi 14:30–16:15 et 16:30–18:00.
- Marqueurs métier présents dans les plannings réels : (P.S) première séance, (D.S) dernière séance, « + Évaluation », séances « En distanciel » / « Blended learning », événements (« Journée culturelle », ateliers), séances d'encadrement de projet (« Projet PACTE »), cours dédoublés par groupe (Groupe 1 / Groupe 2).
- Usage administratif : préparation de la période, puis ajustements au fil de l'eau (reports, salles indisponibles). Usage étudiant/enseignant : coup d'œil rapide à la journée et à la semaine, réaction aux changements.

## Capabilities and Constraints

- Stack existante : React 19 + Vite + MUI 7 + FullCalendar 6 + Recharts ; API Node/Express/Sequelize/MySQL ; déploiement Docker + nginx en HTTPS sur une seule origine.
- Fonctions : gestion des utilisateurs, enseignants, étudiants, filières, groupes, cours, salles, créneaux ; affectations (séances) ; détection et résolution des conflits ; génération automatique avec versions (snapshots) ; disponibilités des enseignants ; demandes de report ; notifications in-app et email ; statistiques ; exports PDF / Excel / CSV / iCal.
- Comptes créés uniquement par l'administration (pas d'inscription publique).
- Règle de conflit : une séance en conflit est refusée ; l'admin peut forcer avec une justification tracée (côté API en cours d'implémentation).
- Langues : **français et anglais** (interface bilingue, français par défaut).
- Décisions ouvertes : version SVG du logo non fournie (PNG disponible) ; pas d'application mobile native (web responsive).

## Brand Commitments

- Nom : HESTIM Planner ; école : HESTIM Engineering & Business School (hestim.ma).
- Logo officiel : `frontend/public/HESTIM.png` (symbole en triangles + logotype). Les couleurs de l'interface proviennent du logo (décision validée par l'utilisateur).
- Ton éditorial de l'école : professionnel, accessible, orienté action (« S'engager. Créer. Partager. »).

## Evidence on Hand

- Cahier des charges PACTE : `docs/rapports/Descriptif du projet PACTE - 3A-IIIA.pdf`.
- Emploi du temps réel : `docs/exemple_emploi_du_temp - 3A IIIA (Du 30 Mars Au 26 Avril 2026).pdf` et `docs/exemple_emploi_du_temps_donnee.yaml`.
- Maquettes d'origine : `docs/maquettes/img/`.
- Données de démonstration : `backend/seed.js` (structure HESTIM : bâtiments, filières, groupes, cours, environ 90 enseignants et 400 étudiants fictifs).
- Aucun témoignage, chiffre d'adoption ou client réel : ne pas en inventer.

## Product Principles

1. **L'information qui change d'abord.** Une séance reportée, annulée ou déplacée doit sauter aux yeux avant tout le reste, pour chaque rôle.
2. **Prévenir plutôt que réparer.** Les conflits se voient au moment de la saisie, avec des alternatives, pas après coup dans une liste.
3. **Le bon écran pour le bon rôle.** L'admin a besoin de densité et de contrôle sur grand écran ; l'étudiant et l'enseignant ont besoin d'une réponse en deux secondes sur téléphone.
4. **Fidèle au planning HESTIM.** Matière, enseignant, salle, bâtiment et marqueurs (P.S, D.S, évaluation, distanciel) se lisent comme dans les plannings que l'école diffuse déjà.
5. **Chaque parcours se démontre.** Toute fonction exigée par le cahier des charges PACTE doit être atteignable et compréhensible en démonstration, sans explication orale.

## Accessibility & Inclusion

- Cible WCAG 2.2 AA : contrastes, navigation clavier complète côté admin, cibles tactiles d'au moins 44 px sur mobile, libellés explicites.
- Interface bilingue français / anglais (`lang` correct, aucune chaîne en dur non traduite dans les nouveaux écrans).
