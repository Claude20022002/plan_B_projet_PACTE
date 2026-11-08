# ADM · Administration selon les rôles

**Objet** : qui peut faire quoi, et les outils de l'administration de l'école. Cela couvre :
- comptes, rôles et droits ;
- configuration de l'école ;
- import des données ;
- assistant de démarrage ;
- années et passage d'année ;
- statistiques et journal de sécurité.

**Hors module** :
- l'élève et sa famille comme personnes : VSC ;
- l'équipe Planner qui gère les écoles : PLA.

**Tables possédées** : `Users`, `AuthSession`, `MfaDefi`, `MfaCodeSecours`, `PasswordResetToken`, `JournalSecurite`, `Desactivation`, `AnneeUniversitaire`, `Periode`, `ResponsableFiliere`.

## Les rôles

| Rôle | Aujourd'hui | Ce qui change |
|---|---|---|
| **Équipe Planner** | n'existe pas dans l'application ; les commandes sont lancées sur le serveur | PLA-05, puis la console PLA-08 |
| **Administration de l'école** (scolarité, direction) | rôle `admin` : tout le référentiel, la planification, les comptes, l'identité, les statistiques ; double authentification | habilitations à portée (ADM-01) ; configuration et import (ADM-02 à ADM-04) |
| **Responsable** (filière, niveau, cycle) | un enseignant inscrit dans `ResponsableFiliere`, avec des droits sur ses filières | portée par niveau ou par cycle pour le scolaire (ADM-01) |
| **Enseignant** | rôle `enseignant` : ses séances, l'appel, ses classes, l'espace de cours, le Studio quiz, ses disponibilités, ses reports | saisie déléguée et notes (VSC), rien de nouveau sans retirer une tâche (EP-6) |
| **Élève ou étudiant** | rôle `etudiant` : emploi du temps, appel par QR, cours, quiz, jeux, bibliothèque | compte de l'élève créé par l'établissement, connexion sans adresse électronique (VSC-01, Q-20) |
| **Parent** | **n'existe pas** | ADM-05 avec VSC-02 et MOB-05 |

## Ce qui existe

- **Serveur** : `authRoutes`, `userRoutes`, `services/comptes.js`, `services/mfa.js`, `services/desactivation/*` (ME-17), `services/annees` (ME-18), `journalSecuriteRoutes`, `statistiquesRoutes`, `etablissementRoutes`.
- **Fournisseur d'identité** : Planner fournit l'identité à ClassQuiz (OIDC) et à StudyLib (JWKS).
- **Site** : `gestion/Utilisateurs`, `gestion/JournalSecurite`, `gestion/IdentiteEcole`, `Statistiques`, et l'import CSV (`components/common/ImportCsvDialog.jsx`) sur cinq pages.
- **Modèles d'import fictifs** : `docs/modeles/`.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| ADM-01 | Habilitations à portée : un droit vaut pour une filière, un niveau, un cycle ou toute l'école | ME-12 | 5 | M | VSC-01 | à faire |
| ADM-02 | Panneau de configuration de l'école : réglages du moteur montrés à l'école (le reste reste au profil), aperçu puis appliquer | ME-2c | 3 | L | MOT-01, Q-04 | à faire |
| ADM-03 | Import : zone de préparation, contrôles, tout ou rien, classeur unique, clés naturelles | ME-9 | 3 | L | VSC-01 | à faire |
| ADM-04 | Assistant de démarrage avec un modèle par type d'école (EP-1) | ME-10 | 3 | L | ADM-02, ADM-03, UIX-01 | à faire |
| ADM-05 | Rôle parent : compte facultatif, lien prouvé avec l'enfant, droits par enfant | — | 4 | M | VSC-02, PLA-11 | à faire |
| ADM-06 | Clôture d'une année (lecture seule) et préparation de la suivante : passage des élèves, groupes reconduits (EP-8) | ME-19, ME-20 | 5 | L + M | VSC-02 | à faire |
| ADM-07 | Enseignants partagés entre écoles : heures « occupé » fédérées | ME-13 | 5 | M | PLA-11 | à faire |
| ADM-08 | Annuaire de l'école | ME-8b | — | M | — | reporté |
| ADM-09 | Échanges OneRoster | ME-9b | — | M | ADM-03 | reporté |

## Critères de « terminé »

- **ADM-01** : un responsable de niveau ne voit ni ne modifie rien hors de son niveau. Un test par route touchée.
- **ADM-03** : un fichier de 300 élèves avec dix erreurs volontaires est refusé avec dix messages lisibles ; corrigé, il passe en entier ou pas du tout.
- **ADM-04** : la mesure EP-1 est faite par une personne extérieure et notée.
- **ADM-05** : le lien parent-enfant ne se crée que par l'école ; deux parents séparés ont chacun leurs droits. Les règles sont validées avec le juriste (revue A-6).
- **ADM-06** : une école de démonstration passe d'une année à l'autre en moins d'une demi-journée, et l'année close reste lisible.

## Exigences produit

EP-1, EP-2, EP-6, EP-8.

## Références

- Archives : [comptes et années](../../archives/plans/planner-multi-etablissements/11-comptes-et-annees.md), [configuration et import](../../archives/plans/planner-multi-etablissements/05-configuration-import.md)
