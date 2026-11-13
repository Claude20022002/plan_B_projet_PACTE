# FIN · Finance de l'école

**Objet** : l'argent **de l'école** :
- frais de scolarité et échéanciers ;
- caisse et reçus ;
- relances et impayés ;
- export comptable.

C'est ce qu'une école privée demande le plus après les notes. L'argent **de Planner** (abonnements, factures), lui, est dans VEN.

**Hors module** (décision du 13 novembre) :
- le relevé des heures des vacataires et la paie : [RHP](RHP-personnel-paie.md) (FIN-03 y est devenue RHP-01) ;
- l'encaissement en ligne et le rapprochement des paiements : [PAI](PAI-paiements.md) ;
- cantine, transport, internat : [SER](SER-services-annexes.md).

**Tables possédées** : les tables de frais, d'échéances, de paiements et de reçus, à concevoir dans VSC-01.

## Ce qui existe

- **Rien pour les frais.**
- Ce qui existe pour les heures (visa des séances, « Mon service ») est décrit dans [RHP](RHP-personnel-paie.md).

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| FIN-01 | Frais, échéanciers, caisse, reçus bilingues numérotés sans trou ; paiement par élève ou par famille ; colonne `devise` dès le départ | F-14 | 4 | XL | VSC-02, VEN-02 | à faire |
| FIN-02 | Relances, impayés, export comptable (EP-5) | F-14 | 4 | L | FIN-01 | à faire |

FIN-03 est devenue **RHP-01** le 13 novembre ([RHP](RHP-personnel-paie.md)) ; son numéro ne resservira pas.

## Critères de « terminé »

- **FIN-01** :
  - un paiement ou un reçu n'est **jamais modifié** : on annule par une écriture inverse ;
  - les reçus sont numérotés sans trou ;
  - la règle est confirmée par un expert-comptable ;
  - une fratrie paie en un seul reçu.
- **FIN-02** : l'export est accepté par le logiciel comptable d'une école, ou par l'expert-comptable.

## Exigences produit

EP-5.

## Références

- [Conception C-5, partie « Finance »](../../conception/vie-scolaire/conception-c5-modele-donnees-scolaire.md)
- Archives : [plan par fonctionnalités, F-14](../../archives/plans/plan-produit/03-plan-par-fonctionnalites.md), [remarques par profil, § 8](../../archives/plans/remarques-par-profil.md)
