# PIL · Pilotage

**Objet** : les tableaux de bord de la direction, **tirés de données vérifiées et traçables** :
- trésorerie : encaissé, attendu, en retard par classe et par mois, prévision ;
- présence des enseignants ;
- avancement de la saisie des notes ;
- somme due aux vacataires.

Un tableau de bord ne vaut que ce que vaut la saisie : PIL ne montre que des chiffres dont la source est tracée.

**Hors module** : les statistiques de l'emploi du temps (occupation des salles, charge des enseignants), qui restent dans EDT.

**Tables possédées** : aucune ; PIL lit les autres modules par leurs services.

**Origine** : inventaire du 11 novembre (besoin R), décision du 13 novembre.

## Ce qui existe

- **Statistiques de l'emploi du temps** : écran « Statistiques » (occupation des salles, charge des enseignants) ; `services/statistiques/usage.js`.
- **Absent** : trésorerie, présence des enseignants, avancement des notes.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| PIL-01 | Trésorerie : encaissé, attendu, en retard par classe et par mois ; prévision | — | 5 | M | FIN-02, PAI-01 | reporté |
| PIL-02 | Personnes : présence des enseignants, avancement de la saisie des notes, somme due aux vacataires | — | 5 | M | RHP-03, VSC-04 | reporté |

## Critères de « terminé »

- **PIL-01 et PIL-02** : chaque chiffre affiché mène, en un clic, aux lignes qui le composent.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin R.
