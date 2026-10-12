# Format des erreurs de l'API

Lot A-5, octobre 2026. Toute réponse d'erreur de l'API a cette forme :

```json
{ "message": "Ce groupe ne suit pas ce module", "code": "REQUETE_INVALIDE" }
```

| Champ | Toujours là | Contenu |
|---|---|---|
| `message` | oui | Phrase en français, affichable telle quelle à l'utilisateur |
| `code` | oui | Identifiant stable en capitales : un écran réagit au code, jamais au texte du message |
| `violations` | non | Le détail, quand il y en a plusieurs : règles de planification enfreintes, champs invalides |

Le code d'état HTTP garde son sens habituel : 400 requête invalide, 401 non connecté, 403 interdit, 404 introuvable, 409 conflit, 422 refusé par un service, 429 trop de requêtes, 5xx erreur du serveur ou d'un service.

## Les codes

Sans code particulier, une erreur prend celui de son statut :

| Statut | Code |
|---|---|
| 400 | `REQUETE_INVALIDE` |
| 401 | `NON_AUTHENTIFIE` |
| 403 | `INTERDIT` |
| 404 | `INTROUVABLE` |
| 409 | `CONFLIT` |
| 413 | `TROP_VOLUMINEUX` |
| 422 | `REFUSE` |
| 429 | `TROP_DE_REQUETES` |
| 500 | `ERREUR_SERVEUR` |
| 502 | `SERVICE_EXTERNE` |
| 503 | `INDISPONIBLE` |
| 504 | `DELAI_DEPASSE` |

Codes particuliers :

| Code | Statut | Quand |
|---|---|---|
| `REGLES_ENFREINTES` | 409 | Une séance enfreint des règles de planification. `message` est la première règle bloquante ; `violations` les donne toutes : `[{ code, bloquant, message }]`, où `code` nomme la règle (en minuscules) |
| `VALIDATION` | 400 | Un champ ne respecte pas le modèle. `violations` : `[{ champ, message }]` |
| `DEJA_EXISTANT` | 409 | Une valeur qui doit être unique existe déjà. `violations` : `[{ champ, message }]` |
| `REFERENCE_INCONNUE` | 400 | La ressource référencée n'existe pas |
| `ERREUR_BASE` | 500 | Erreur de la base de données (le détail reste dans les journaux du serveur) |
| `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `SESSION_INVALID` | 401 | Session absente, invalide ou expirée : le site renouvelle la session sur `TOKEN_EXPIRED`, `TOKEN_MISSING` et `TOKEN_INVALID` |
| `DEVOIRS_FERMES` | 503 | Les devoirs sont fermés (lot D-2) |

## Exemples

Séance refusée :

```json
{
  "message": "La salle G-S01 est déjà occupée lundi 4 janvier de 9 h à 10 h 45",
  "code": "REGLES_ENFREINTES",
  "violations": [
    { "code": "salle", "bloquant": true, "message": "La salle G-S01 est déjà occupée lundi 4 janvier de 9 h à 10 h 45" },
    { "code": "trajet", "bloquant": false, "message": "Changement de campus en 15 minutes" }
  ]
}
```

Champ invalide :

```json
{ "message": "Erreur de validation", "code": "VALIDATION", "violations": [{ "champ": "email", "message": "Validation isEmail on email failed" }] }
```

## État de la migration

- **Au format** : le gestionnaire global (`backend/middleware/errorHandler.js`), toutes les routes écrites avec `planification()` (`backend/utils/erreursPlanning.js`), les erreurs métier (`ErreurMetier`, avec un code facultatif). Le format s'écrit avec `backend/utils/erreurs.js`.
- **Pas encore** : les anciens contrôleurs qui répondent eux-mêmes (`res.status(…).json({ message, error })`). Ils s'alignent au fil de A-6 ; leur champ `error` disparaîtra alors.
- **Retirés** des réponses au format : `error` (doublon de `message`), `errors` et `details` (remplacés par `violations`). Le site et l'application lisent `message`.
