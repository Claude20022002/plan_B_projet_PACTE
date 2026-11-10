# MOB · Application mobile

**Objet** : l'application Planner sur téléphone (Expo, `mobile/`). Elle sert aujourd'hui aux étudiants ; ensuite, elle servira aussi aux enseignants et aux parents.

**Hors module** : les routes du serveur, qui appartiennent au module de chaque fonction.

## Ce qui existe

- **Technique** : Expo `~57.0.27` avec Expo Router.
- **Écrans** :
  - onglets `index`, `semaine`, `scan`, `jeux`, `bibliotheque`, `compte` ;
  - écrans `connexion`, `alertes`, `annonce`, `cours`, `devoir`, `document`, `module`, `partie`, `quiz`, `quiz-direct`, `jeu-direct`, `resultats`, `scanner`, `telephone`, `terminal`, `stage/partager`.
- **Fonctions** : notifications par Expo (`services/push.js` côté serveur) ; marque de l'école (`marque.js`, `ecole.js`).
- **Rôles** : l'application **refuse tout rôle autre qu'étudiant** (`AuthContext.jsx`). La branche `b/v4-application` (enseignants) n'est pas fusionnée.
- **Adresse de l'API** : `EXPO_PUBLIC_API_URL` est **figée à la construction** (`mobile/eas.json`). L'application ne sert donc qu'une installation (canal I-12).
- **Pas encore fait** : l'essai sur un vrai téléphone (ME-11).

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| MOB-01 | Essai sur un vrai téléphone (Android d'entrée de gamme), noté dans la recette | ME-11 | libre | S | — | à faire |
| MOB-02 | Rôle enseignant : emploi du temps, appel, classes ; reprendre ou fermer `b/v4-application` | M-1 à M-3 | libre | L | — | à faire |
| MOB-03 | Thème neutre et thème de l'école ; **choisir le téléphone de référence** et mesurer l'ouverture (moins de 2 s, EP-3) | SN-1 (application) | 2 | M | UIX-01 | à faire |
| MOB-04 | Trouver son école : par adresse ou par code | ME-8 réduit | 5 | M | PLA-10, MOB-07 | reporté |
| MOB-05 | Espace parents : enfants, emploi du temps, absences, notes, frais ; notifications par plages et résumés (EP-7) | F-15 | 4 | L | ADM-05, VSC-03 | à faire |
| MOB-06 | Emploi du temps lisible hors ligne (EP-3) | F-15 | 4 | M | — | à faire |
| MOB-07 | Adresse de l'API qui n'est plus figée à la construction (une application pour toutes les installations) | I-12 | libre | M | — | à faire |

## Critères de « terminé »

- **MOB-01** : connexion, emploi du temps, scan d'appel, notification reçue ; captures dans la recette.
- **MOB-03** : la mesure de départ et la mesure après sont notées pour le téléphone de référence.
- **MOB-06** : en mode avion, la semaine en cours reste lisible, avec la date de la dernière mise à jour.
- **MOB-07** : la même construction se connecte à deux installations différentes.

## Exigences produit

EP-3, EP-7, EP-11.

## Références

- [mobile/README.md](../../../mobile/README.md)
- Archives : [espace enseignant, M-1 à M-3](../../archives/plans/espace-enseignant.md), [conception de V0, ME-11](../../archives/plans/planner-multi-etablissements/conception-v0-groupe-b.md)
