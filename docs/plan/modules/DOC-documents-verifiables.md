# DOC · Documents et attestations vérifiables

**Objet** : les documents officiels que l'établissement délivre :
- certificats de scolarité, attestations, relevés ;
- diplômes.

Chacun porte un **code ou un QR de vérification** qui renvoie au registre de l'école. S'y ajoutent l'archivage et la signature.

L'inventaire relève de faux résultats et des diplômes non reconnus dans plusieurs pays.

**Hors module** :
- les notes et les bulletins (VSC-04) ;
- l'écriture de droite à gauche des PDF (UIX-04) ;
- les attestations de formation continue (FOR-02), qui utiliseront ce module pour leur code de vérification.

**Tables possédées** : documents délivrés, codes de vérification, archives (à concevoir).

**Origine** : inventaire du 11 novembre (besoins E et A), décision du 13 novembre.

## Ce qui existe

- **PDF de l'emploi du temps** au logo de l'école : export du site (`TimetableExportMenu`).
- **Absent** : aucun certificat, aucune attestation, aucune vérification.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| DOC-01 | Certificats de scolarité, attestations et relevés, avec un code de vérification ; modèles par école | — | 5 | M | VSC-02 | à faire |
| DOC-02 | Diplômes vérifiables : page publique de vérification (elle ne montre que ce que l'école autorise), archivage, révocation | — | 5 | M | DOC-01, VSC-04 | à faire |

## Critères de « terminé »

- **DOC-01** : un document modifié après sa délivrance est refusé à la vérification.
- **DOC-02** :
  - la page de vérification ne révèle aucune donnée au-delà de ce que le document imprimé montre déjà ;
  - un document révoqué apparaît comme révoqué.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoins E et A.
