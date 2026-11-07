# EDT · Emploi du temps, côté application

**Objet** : tout ce que les utilisateurs font avec l'emploi du temps :
- séances et affectations ;
- préparation, publication et envoi mensuel ;
- reports et imprévus ;
- disponibilités ;
- salles et campus ;
- examens et surveillances ;
- appel des séances ;
- calendrier ;
- PDF et agenda (ICS).

C'est le cœur du produit d'aujourd'hui, et il est mûr.

**Hors module** : le calcul lui-même (MOT).

**Tables possédées** : `Affectation`, `Creneau`, `Conflit`, `HistoriqueAffectation`, `DemandeReport`, `Disponibilite`, `Salle`, `Campus`, `TrajetCampus`, `Reservation`, `SessionExamen*`, `Surveillance`, `Evenement`, `EnvoiEdt`, `VisaSeance`, `AbonnementCalendrier`, `AppelSeance`, `Presence`, `SignalementPresence`, `AppareilEtudiant`, `DemandeTelephone`.

## Ce qui existe

- **Serveur** :
  - routes `affectation`, `creneau`, `conflit`, `emploiDuTemps`, `preparation`, `suivi`, `imprevu`, `demandeReport`, `disponibilite`, `service`, `salle`, `campus`, `reservation`, `examen`, `evenement`, `calendrier`, `agenda` ;
  - services `services/planning/*` (ramadan, visas, assistant), `services/calendrier/envoiEdt.js`.
- **Site** : `pages/gestion/*`, `pages/emploi-du-temps/*`, `EdtMensuel`, `MesAffectations`, `DemandesReport`, `Disponibilites`, `MesExamens`.
- **PDF** : produit dans le navigateur (`utils/exportEmploiDuTemps.js`). La grille suit les créneaux de l'école (ME-1, #149).
- **Décisions en vigueur** :
  - publication par l'administration ;
  - report proposé par le système puis validé (21 octobre) ;
  - Planner ne connaît pas les bâtiments (4 novembre).

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| EDT-01 | Changement structurel refusé une fois les séances générées (groupes, volumes), avec un message qui dit quoi faire | ME-2b réduit | 3 | S | MOT-01 | à faire |
| EDT-02 | Horaires saisonniers (ramadan, hiver, été) appliqués sans tout regénérer | F-11 | libre | M | MOT-01 | à faire |
| EDT-03 | Écran d'explication des conflits et des refus : la règle, le groupe, la solution proposée (EP-4) | — | 3 | M | MOT-03 | à faire |
| EDT-04 | Publication, PDF et courriels selon l'école : marque, langue, vocabulaire du profil, sans mot propre au supérieur pour une école scolaire | — | libre | M | UIX-02 | à faire |
| EDT-05 | Paramètres datés complets : un réglage change à une date, sans toucher le passé | ME-2b complet | 5 | L | MOT-01 | reporté |

## Critères de « terminé »

- **EDT-01** : tenter de modifier un groupe après une génération donne un refus clair et un test qui le fige.
- **EDT-02** : passer à l'horaire de ramadan sur une période donnée ne déplace que les séances de cette période. Un parcours le prouve.
- **EDT-03** : chaque refus du solveur, et chaque conflit, s'affiche avec ses trois éléments. Un parcours le prouve.
- **EDT-04** : le PDF d'une école fictive de collège ne contient ni « filière » ni « semestre ».

## Exigences produit

EP-4, EP-10 (pages de gestion en moins de 1 s).

## Références

- Archives : [remarques par profil](../../archives/plans/remarques-par-profil.md), [retours du 21 octobre](../../archives/plans/retours-2026-10-21.md), [conception de ME-1](../../archives/plans/planner-multi-etablissements/conception-me1-grille-pdf-groupe-b.md)
