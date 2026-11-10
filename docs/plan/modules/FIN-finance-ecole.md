# FIN · Finance de l'école

**Objet** : l'argent **de l'école** :
- frais de scolarité et échéanciers ;
- caisse et reçus ;
- relances et impayés ;
- export comptable ;
- relevé des heures des vacataires pour la paie.

C'est ce qu'une école privée demande le plus après les notes. L'argent **de Planner** (abonnements, factures), lui, est dans VEN.

**Tables possédées** : les tables de frais, d'échéances, de paiements et de reçus, à concevoir dans VSC-01.

## Ce qui existe

- **Rien pour les frais.**
- **Pour les heures** :
  - le visa des séances par l'administration (`VisaSeance`, migration 0039) ;
  - le service des enseignants (`serviceRoutes`, « Mon service »).
- **Règle déjà posée** : un appel validé est un indice, pas une preuve. Le visa de l'administration est demandé avant tout export pour la paie.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| FIN-01 | Frais, échéanciers, caisse, reçus bilingues numérotés sans trou ; paiement par élève ou par famille ; colonne `devise` dès le départ | F-14 | 4 | XL | VSC-02, VEN-02 | à faire |
| FIN-02 | Relances, impayés, export comptable (EP-5) | F-14 | 4 | L | FIN-01 | à faire |
| FIN-03 | Relevé mensuel des heures des vacataires, à partir des séances visées ; export pour la paie | remarques § 8, F-21 | libre | M | — | à faire |

## Critères de « terminé »

- **FIN-01** :
  - un paiement ou un reçu n'est **jamais modifié** : on annule par une écriture inverse ;
  - les reçus sont numérotés sans trou ;
  - la règle est confirmée par un expert-comptable ;
  - une fratrie paie en un seul reçu.
- **FIN-02** : l'export est accepté par le logiciel comptable d'une école, ou par l'expert-comptable.
- **FIN-03** : le relevé d'un mois ne compte que les séances visées ; il est identique s'il est refait.

## Exigences produit

EP-5.

## Références

- [Conception C-5, partie « Finance »](../../conception/vie-scolaire/conception-c5-modele-donnees-scolaire.md)
- Archives : [plan par fonctionnalités, F-14](../../archives/plans/plan-produit/03-plan-par-fonctionnalites.md), [remarques par profil, § 8](../../archives/plans/remarques-par-profil.md)
