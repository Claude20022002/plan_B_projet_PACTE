# STK · Stocks et achats

**Objet** :
- l'inventaire des manuels, des uniformes et du matériel prêté ;
- les bons de commande, avec validation ;
- le lien entre une vente et son reçu.

L'inventaire voit dans les stocks un point d'entrée de la fraude.

**Hors module** :
- la comptabilité générale de l'école : s'intégrer de préférence à un ERP général ;
- la Bibliothèque des documents de cours (BIB).

**Tables possédées** : articles, mouvements de stock, bons de commande (à concevoir).

**Origine** : inventaire du 11 novembre (besoin Q), décision du 13 novembre.

## Ce qui existe

**Rien.**

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| STK-01 | Inventaire (manuels, uniformes, matériel prêté), bons de commande validés par une seconde personne, lien entre la vente et le reçu de FIN-01 | — | 5 | M | FIN-01 | reporté |

## Critères de « terminé »

- **STK-01** : un mouvement de stock n'est jamais modifié, il s'annule par un mouvement inverse ; une sortie sans bon ni vente est signalée.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin Q.
