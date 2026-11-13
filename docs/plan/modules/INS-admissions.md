# INS · Admissions et prospects

**Objet** : ce qui se passe **avant** l'inscription :
- formulaire public de candidature, pièces, suivi des candidats ;
- liste d'attente, acompte ;
- contrat annuel généré et signé ;
- réinscription en un clic ;
- état d'accréditation de chaque filière, affiché.

L'inventaire n'a trouvé aucun outil qui suive les prospects dans les écoles marocaines et africaines.

**Hors module** :
- l'élève inscrit, sa famille et son inscription d'une année (VSC-02) ;
- les frais et les reçus (FIN) ;
- l'encaissement de l'acompte (PAI).

**Tables possédées** : candidatures, pièces, listes d'attente, contrats (à concevoir).

**Origine** : inventaire du 11 novembre (besoin A), décision du 13 novembre.

## Ce qui existe

- **Import des étudiants** depuis Excel ou CSV, page par page.
- **Règle** (décision du 8 novembre) : un élève a un compte, créé par son établissement, jamais par une inscription libre. Un candidat n'est donc pas un compte : c'est une fiche.
- **Absent** : aucun formulaire public, aucun suivi de candidat.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| INS-01 | Formulaire public de candidature, pièces jointes, suivi des candidats, liste d'attente ; un candidat accepté devient un élève de VSC-02, sans ressaisie | — | 5 | L | VSC-02 | à faire |
| INS-02 | Acompte, contrat annuel école-famille généré et signé, réinscription en un clic | — | 5 | M | INS-01, FIN-01 | à faire |
| INS-03 | État d'accréditation de chaque filière, affiché au candidat | — | 5 | S | INS-01 | à faire |

## Critères de « terminé »

- **INS-01** :
  - un candidat ne reçoit aucun compte avant d'être accepté ;
  - les pièces sont limitées en taille et en type, avec la même revue de sécurité que COU-02 ;
  - un candidat accepté devient élève sans une seule ressaisie.
- **INS-02** : un contrat signé ne se modifie plus ; un avenant crée un nouveau contrat.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin A.
