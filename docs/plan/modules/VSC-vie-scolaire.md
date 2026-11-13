# VSC · Vie scolaire

**Objet** : ce qu'une école privée achète d'abord, et que Planner n'a pas encore :
- élèves et familles ;
- inscriptions ;
- absences prévenues aux parents ;
- notes, bulletins et conseil de classe ;
- Massar.

**Hors module** :
- l'appel lui-même : il existe déjà, son module propriétaire est EDT pour la séance ; VSC-03 s'appuie dessus ;
- les frais : FIN ;
- l'espace parents dans l'application : MOB-05.

**Tables possédées** (après VSC-01) : `Etudiant`, `Appartenir`, et les tables nouvelles du scolaire (responsable légal, inscription, évaluation, note, période de notes, bulletin). La présence (`AppelSeance`, `Presence`, `SignalementPresence`) reste à EDT.

## Ce qui existe

- **Appel** :
  - par QR code et à trois statuts (présent, en retard, absent) ;
  - signalements, téléphone de l'étudiant, projection ;
  - fichiers : `presenceRoutes`, `services/presences/*` ; écrans `Appel`, `AppelProjection`, `Presence` ; dans l'application mobile, `scan` et `scanner`.
- **`Etudiant` dépend de `Users`** : la clé est `id_user`, et `Users.email` et `password_hash` sont obligatoires. **Un élève ne peut donc pas exister sans compte.** Décision du 8 novembre : un élève a un compte, créé par son établissement ; reste à savoir avec quoi se connecte un enfant sans adresse (Q-20).
- **Champs obligatoires propres au supérieur** : `Cours.semestre`, `Cours.volume_horaire`, `Cours.type_cours`, `Groupe.id_filiere`.
- **Conception C-5** : le plan du document et 14 questions, dans [conception-c5](../../conception/vie-scolaire/conception-c5-modele-donnees-scolaire.md). Le plan attend la validation du chef de projet avant d'être rempli.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| VSC-01 | **Modèle de données du scolaire** (conception seule, avec diagrammes) : entités, correspondance avec le supérieur, profils, plusieurs écoles, plan de migrations, propriétaires des tables. Réponse à Q-20 (compte de l'élève) | C-5 | 1 | L | — | plan du document à valider |
| VSC-02 | Élèves et familles : responsables légaux, inscription d'une année, réinscription, fratries | F-10 | 4 | L | VSC-01, PLA-01 | à faire |
| VSC-03 | Absences prévenues aux parents (envoi par COM), justificatifs, saisie déléguée (EP-6) | F-12 | 4 | M | VSC-02, COM-01 | à faire |
| VSC-04 | Notes et bulletins : périodes, évaluations, coefficients, note absente distincte de zéro, verrouillage par période, tableau d'avancement de la saisie, conseil de classe ; comprend le carnet de notes officiel et les grilles d'évaluation | F-13, EC-3, EC-4 | 4 | XL | VSC-02, Q-06, Q-16 | à faire |
| VSC-06 | Formation professionnelle : profil, assiduité pour les bourses | F-20 | 5 | M | MOT-05 | à faire |

Décisions du 13 novembre : VSC-05 (Massar) est devenue **ETA-02** ([ETA](ETA-echanges-etat.md)) ; le plafond de cumul de VSC-06 (F-22) est passé dans **RHP-02** ([RHP](RHP-personnel-paie.md)). Le numéro VSC-05 ne resservira pas.

## Critères de « terminé »

- **VSC-01** :
  - les 14 questions sont tranchées et écrites dans [decisions.md](../decisions.md) ;
  - l'étude d'impact de Q-20 couvre chaque fichier qui lit `Users.email` ;
  - les numéros 0062 à 0079 sont réservés dans [suivi.md](../suivi.md) ;
  - le document est relu par les deux groupes.
- **VSC-02** : une fratrie de trois enfants est inscrite par un seul responsable légal ; un enfant sans compte apparaît dans l'emploi du temps de sa classe.
- **VSC-04** :
  - le bulletin d'une classe s'imprime en un clic ;
  - une absence à une évaluation ne change pas la moyenne ;
  - une note modifiée après verrouillage garde son historique.

## Condition légale

**Aucune donnée réelle de mineur** avant :
- le contrat de sous-traitance ;
- le dossier CNDP de l'école ;
- le test d'intrusion (EXP-08).

Ni CIN obligatoire ni donnée de santé dans le socle : selon la loi 09-08, elles imposent une autorisation préalable de la CNDP.

## Exigences produit

EP-5, EP-6, EP-7, EP-8.

## Références

- Archives : [plan par fonctionnalités, F-10 à F-22](../../archives/plans/plan-produit/03-plan-par-fonctionnalites.md), [revue d'architecte, B-2 et A-5](../../archives/plans/plan-produit/06-revue-architecte.md)
