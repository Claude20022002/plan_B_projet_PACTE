# FOR · Formation continue et financeurs

**Objet** : ce qu'un organisme de formation, un CFA ou une école « hybride » doit prouver pour être payé :
- sessions et cohortes, conventions, convocations ;
- émargement signé et attestations ;
- dossiers par financeur et facturation à plusieurs payeurs ;
- preuves qualité.

Dans ces structures, **la preuve conditionne le paiement** : une feuille de présence incomplète bloque le remboursement.

**Hors module** :
- la planification des séances (MOT, EDT) ;
- les heures et la paie des formateurs (RHP) ;
- les frais et les reçus (FIN) ;
- les stages et l'alternance (STA).

**Tables possédées** : sessions, conventions, émargements signés, attestations, dossiers de financement, preuves qualité (à concevoir).

**Origine** : inventaire du 11 novembre (besoin M), décision du 13 novembre.

## Ce qui existe

- **Appel par QR code** : `services/presences/` (appel, rappel d'appel, statuts), modèles `Presence` et `AppelSeance`.
- **Profil « formation » du moteur** : catalogue des profils, `docs/conception/moteur-planification/catalogue/profils.md`.
- **Absent** :
  - la session n'existe pas : tout est rangé par année et par période ;
  - ni convention, ni émargement signé, ni attestation, ni financeur.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| FOR-01 | Sessions et cohortes (une session n'est pas une année), conventions, convocations | — | 5 | L | MOT-05 | à faire |
| FOR-02 | Émargement signé par demi-journée, avec contrôle de complétude ; attestations et certificats de réalisation | — | 5 | M | FOR-01 | à faire |
| FOR-03 | Dossiers par financeur (CSF et GIAC, FDFP, 3FPT, OPCO, CPF…) et facturation à plusieurs payeurs (entreprise, financeur, apprenant) | — | 5 | L | FOR-02, FIN-01 | à faire |
| FOR-04 | Preuves qualité rangées par indicateur (Qualiopi ou référentiel du pays) | — | 5 | M | FOR-02 | à faire |

## Critères de « terminé »

- **FOR-02** : une demi-journée sans signature est signalée avant la clôture de la session ; une attestation reprend exactement les heures émargées.
- **FOR-03** : le dossier d'un financeur se produit en un seul export, sans ressaisie ; une facture ne dépasse jamais les heures émargées.
- **FOR-04** : chaque indicateur affiche ses preuves, ou dit ce qui manque.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin M ; notes `centres_formation.md`.
