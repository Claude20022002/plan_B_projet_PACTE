# RHP · Personnel, vacataires et paie

**Objet** : le **personnel enseignant**, et d'abord les vacataires :
- le dossier de l'intervenant, son contrat et son statut ;
- l'autorisation de cumul et le plafond d'heures ;
- la chaîne « heure prévue, faite, visée, payée » ;
- l'état mensuel signé et l'export vers la paie.

L'inventaire montre que cette chaîne casse partout : vacataires payés de 6 à 12 mois en retard au Sénégal et en France, employés fictifs sur la paie, changements de compte bancaire frauduleux.

**Hors module** :
- le calcul de la paie elle-même : s'intégrer au logiciel de paie de l'école ;
- les disponibilités et la planification (MOT, EDT) ;
- les enseignants partagés entre plusieurs écoles (ADM-07).

**Tables possédées** : dossiers des intervenants, contrats, autorisations de cumul, états mensuels et leurs signatures (à concevoir). Le visa des séances (`VisaSeance`) reste dans EDT ; RHP le lit.

**Origine** : inventaire du 11 novembre (besoin G), décision du 13 novembre.

## Ce qui existe

- **Visa des séances** par l'administration : `VisaSeance`, migration 0039.
- **« Mon service »** de l'enseignant : `serviceRoutes`.
- **Statut de l'enseignant** (`Enseignant.statut`) :
  - heures dues sur l'année pour un permanent ;
  - pour un vacataire payé à l'heure : aucune heure due, et l'entreprise d'origine s'il vient de l'industrie.
- **Disponibilités** des enseignants : `Disponibilite`.
- **Règle déjà posée** : un appel validé est un indice, pas une preuve. Le visa est exigé avant tout export pour la paie.
- **Absent** : relevé mensuel, contrat, autorisation de cumul, état signé.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| RHP-01 | Relevé mensuel des heures des vacataires, à partir des séances visées ; export pour la paie | FIN-03, remarques § 8, F-21 | libre | M | — | à faire |
| RHP-02 | Dossier de l'intervenant : contrat, statut, autorisation de cumul et plafond d'heures (public et privé, formation professionnelle), déclaration mensuelle à l'AREF | VSC-06 (plafond de cumul), F-22 | 5 | M | RHP-01 | à faire |
| RHP-03 | Chaîne « prévu, fait, visé, payé » : état mensuel signé, historique des sommes dues qu'on ne peut pas effacer, double validation de la création d'un intervenant et de tout changement de compte bancaire, export vers le logiciel de paie | — | 5 | L | RHP-01, RHP-02 | à faire |

## Critères de « terminé »

- **RHP-01** : le relevé d'un mois ne compte que les séances visées ; il est identique s'il est refait.
- **RHP-02** : une affectation qui dépasserait le plafond d'heures autorisé est signalée avant d'être validée.
- **RHP-03** :
  - un changement de compte bancaire n'est actif qu'après une seconde validation par une autre personne ;
  - une somme due n'est jamais effacée : elle est annulée par une écriture inverse ;
  - l'export est accepté par le logiciel de paie d'une école ou par son comptable.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin G.
- Anciennes places : FIN-03 dans [FIN](FIN-finance-ecole.md), plafond de cumul dans VSC-06 ([VSC](VSC-vie-scolaire.md)).
