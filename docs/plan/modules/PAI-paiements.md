# PAI · Paiements en ligne et rapprochement

**Objet** : faire arriver l'argent sur le bon élève :
- une référence unique par élève ;
- l'encaissement en ligne (carte, CMI, puis argent mobile) ;
- l'import des relevés bancaires et des opérateurs ;
- le rapprochement automatique avec les reçus ;
- une alerte pour tout paiement non imputé.

L'inventaire le dit : le vrai problème est d'**imputer chaque paiement au bon élève**, pas le choix du moyen de paiement.

**Hors module** :
- frais, échéanciers, caisse et reçus (FIN-01) ;
- relances et export comptable (FIN-02) ;
- l'argent de Planner, c'est-à-dire abonnements et factures (VEN).

**Tables possédées** : moyens de paiement, transactions reçues, relevés importés et rapprochements (à concevoir).

**Origine** : inventaire du 11 novembre (besoin F), décision du 13 novembre.

## Ce qui existe

**Rien.** Planner n'encaisse rien aujourd'hui. FIN-01 (reçus numérotés sans trou, annulation par écriture inverse) est prévu, mais pas codé.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| PAI-01 | Rapprochement : référence unique par élève, import des relevés (banque, CMI), rapprochement automatique avec les reçus de FIN-01, alerte de paiement non imputé, double validation d'un rapprochement manuel | — | 4 | L | FIN-01, VEN-02 | à faire |
| PAI-02 | Paiement en ligne par carte et CMI : la commission et qui la paie sont affichées sur le reçu | — | 4 | M | PAI-01 | à faire |
| PAI-03 | Argent mobile par des agrégateurs (Wave, Orange Money, MTN, M-Pesa…), plusieurs devises, quand l'Afrique subsaharienne est visée | — | 5 | L | PAI-01, PLA-13 | reporté |

## Critères de « terminé »

- **PAI-01** :
  - un paiement importé deux fois n'est compté qu'une fois ;
  - un paiement sans élève reconnu reste dans une file « non imputé » visible, jamais perdu ;
  - un rapprochement ne modifie jamais un reçu : il s'y relie.
- **PAI-02** :
  - un paiement refusé ou abandonné ne crée aucun reçu ;
  - la commission figure sur le reçu ;
  - le prestataire choisi est validé par le chef de projet (contrat, conformité).

## Exigences produit

EP-5. Règles proposées par l'inventaire :
- jamais de blocage d'un document scolaire pour impayé (illégal dans plusieurs pays) ;
- la commission est dite par écrit.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin F, garantie 8 (paiements traçables), consommables (paiement).
