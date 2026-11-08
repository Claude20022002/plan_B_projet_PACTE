# QUA · Qualité du code, tests et documentation

**Objet** : ce qui garde le projet sain, quel que soit le module :
- règles de code ;
- tests et CI ;
- choix de la pile ;
- documentation d'entrée ;
- branches mortes ;
- données à ne pas versionner.

## Ce qui existe

- **Règles de code** : dans [README du plan, § 5](../README.md). La règle `max-lines` de `backend/eslint.config.js` signale les fichiers trop longs, en avertissement. La règle R-2 (#137) limite l'accès à la base à `models/`.
- **Tests** :
  - unitaires du serveur, plus de 270 ;
  - intégration du serveur sur MySQL 8.4, plus de 500 ;
  - site ;
  - application mobile ;
  - solveur ;
  - parcours de démonstration (Playwright) dans la CI ;
  - le modèle des tests locaux est dans `DEPLOIEMENT.md`.
- **CI** : `.github/workflows/ci-cd.yml`. **`main` n'est pas protégée** : on a déjà fusionné une PR rouge (#127).
- **Documentation d'entrée périmée** :
  - `README.md` : nombres de tests anciens ; « retrait du multi-tenant », contraire au plan ; devoirs pour les étudiants ;
  - `PRODUCT.md` : « jury PACTE » ; « pas d'application mobile » ; deux bâtiments d'HESTIM.
- **Contrôleurs trop longs** : `authController` (759 lignes), `statistiques` et `emploiDuTemps` (512 chacun), `etudiant` (443).
- **Données personnelles** : `docs/users.xlsx` (noms, adresses, mots de passe) a été retiré de l'arbre le 7 novembre, mais **il reste dans l'historique d'un dépôt public**.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| QUA-01 | `README.md` et `PRODUCT.md` à jour : produit pour toute école, modules, tests, installation | R-4, I-1 de la revue | libre | M | — | à faire |
| QUA-02 | Découper les contrôleurs trop longs, sans changer leur comportement, chacun couvert par ses tests | A-6 | libre | M par contrôleur | — | à faire |
| QUA-03 | Clore l'étude de la pile : une page de critères, la décision du 4 novembre (rien ne change) confirmée ou rouverte | A-4 de la revue | 1 | S | — | à faire |
| QUA-04 | Reste des dates : plus aucun `toISOString().slice(0,10)` (dans `exportEmploiDuTemps.js`) | B-2 | libre | S | — | à faire |
| QUA-05 | Supprimer les branches et les dossiers de travail morts, après vérification de leur contenu ; fermer #40 | C-1, P-57 | libre | S | — | à faire |
| QUA-06 | `docs/users.xlsx` : si les personnes sont réelles, prévenir l'école, changer les mots de passe des comptes concernés s'ils existent encore, puis décider de la réécriture de l'historique (Q-14) | 0-1, A-1 | 0 | S | — | fait : personnes fictives, décision du 8 nov. |
| QUA-07 | Protéger `main` : CI verte exigée avant de fusionner (Q-15) | — | 0 | S | — | à faire |

## Critères de « terminé »

- **QUA-01** : une personne nouvelle installe le projet en local avec le seul `README.md`.
- **QUA-02** : aucun contrôleur ne dépasse 200 lignes ; la suite complète passe sans changer un seul test.
- **QUA-05** : `git branch -a --no-merged main` ne liste que des branches en cours, chacune avec sa ligne dans [suivi.md](../suivi.md).
- **QUA-07** : une PR rouge ne peut plus être fusionnée.

## Références

- Archives : [assainissement](../../archives/plans/assainissement.md), [revue d'architecte](../../archives/plans/plan-produit/06-revue-architecte.md), [état des lieux des branches](../../archives/plans/plan-produit/01-etat-des-lieux.md)
