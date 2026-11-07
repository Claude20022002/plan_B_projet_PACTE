# Conception de ME-21 : la supervision

30 octobre 2026, groupe A. Lot du fichier 09 : « sonde extérieure, alertes par courriel et téléphone, journaux par école, suivi des erreurs, page d'état publique, mesures (temps de réponse, connexions MySQL, file du solveur, boîte d'envoi) ». Critère : **une panne simulée la nuit déclenche une alerte en moins de 5 minutes**. Origine : contre-expertise (fichier 12, « aucune supervision ») ; engagements de service du § 13.8 (bloquant pris en charge en 1 heure ; maintenance le dimanche de 06 h à 09 h annoncée sur la page d'état).

## 1. Décisions du chef de projet (30 octobre 2026)

| Question | Décision | Conséquence |
|---|---|---|
| Qui sonde depuis l'extérieur ? | **Un service hébergé** (Better Stack ou UptimeRobot, offre gratuite à vérifier à l'inscription) | Rien à maintenir ; page d'état incluse. La sonde ne lit que des codes HTTP et des mots-clés : aucune donnée d'élève ne sort |
| Comment l'alerte arrive-t-elle sur le téléphone ? | **Notification d'application** (celle du service, ou ntfy), en plus du courriel | Gratuit ; la personne d'astreinte autorise les notifications la nuit |
| Où vont les erreurs du serveur ? | **Nulle part hors du serveur** (loi 09-08, hébergement au Maroc, Q-23) | Journaux structurés par école sur le serveur ; la hausse des erreurs 500 est lue par la sonde comme un mot-clé |

## 2. Ce que fait Planner (dans le dépôt)

| N° | Élément | Où |
|---|---|---|
| S-1 | **Santé publique** `GET /api/supervision/sante` : `{ etat, base, solveur, erreurs }`. 200 si la base répond ; 503 sinon. « erreurs » passe à « elevees » au-delà de `SUPERVISION_SEUIL_ERREURS` erreurs 500 sur 15 minutes (20 par défaut) | `routes/supervisionRoutes.js`, `services/supervision/etat.js` |
| S-2 | **Mesures** `GET /api/supervision/mesures`, en-tête `X-Supervision-Jeton` = `SUPERVISION_TOKEN` : requêtes, temps de réponse (médiane, 95e centile), erreurs 500, courriels en échec, générations en cours, connexions MySQL ouvertes et plafond, sur 15 minutes. 404 sans jeton configuré | mêmes fichiers |
| S-3 | **Compteurs en mémoire**, minute par minute sur une heure, sans chemin ni compte | `services/supervision/compteurs.js`, `middleware/mesureMiddleware.js` (en tout premier) |
| S-4 | **Courriels en échec** comptés à chaque refus du serveur d'envoi (la « boîte d'envoi » du lot : l'envoi est direct, sans file) | `utils/sendEmail.js` |
| S-5 | **Journaux par école** : `etablissement=<nom>` sur chaque ligne de requête et dans chaque erreur (`ETABLISSEMENT_NOM` aujourd'hui, `req.etablissement` avec ME-3a) | `middleware/loggerMiddleware.js` |
| S-6 | **Battements des sauvegardes** : `sauvegarder.sh` et `sauvegarder-journaux.sh` appellent l'adresse de battement de la sonde quand tout est fait et sorti du serveur ; la sonde alerte si le battement manque | `deploy/vps/sauvegarde-commun.sh` (`BATTEMENT`, `BATTEMENT_JOURNAUX`) |

**La « file du solveur »** du lot : le solveur ne garde pas de file (une génération à la fois, refus 409 sinon) ; on mesure donc les générations en cours et la joignabilité du solveur.

**Écarté** : un tableau de bord de mesures (Prometheus, Grafana) : lourd pour un serveur partagé, sans besoin avant plusieurs écoles (à revoir avec ME-5) ; un outil de suivi des erreurs (décision 3).

## 3. Ce que configure le chef de projet (dans le service de sonde)

| Moniteur | Vérifie | Intervalle visé | Alerte |
|---|---|---|---|
| Site | `https://<SITE_ADDRESS>/` répond 200 | le plus court de l'offre (3 min au plus) | courriel + téléphone |
| API et base | `https://<SITE_ADDRESS>/api/supervision/sante` répond 200 | idem | courriel + téléphone |
| Solveur | même adresse, contient `"solveur":"ok"` | 5 min | courriel |
| Erreurs 500 | même adresse, contient `"erreurs":"ok"` | 5 min | courriel + téléphone |
| Bibliothèque | `https://<SITE_ADDRESS>/biblio/` répond (StudyLib) | 5 min | courriel |
| Sauvegarde de nuit | battement attendu chaque jour vers 02:15, marge 1 h | — | courriel |
| Journaux binaires | battement attendu toutes les 15 min, marge 15 min | — | courriel |

Page d'état publique : les trois premiers moniteurs ; la maintenance du dimanche (06 h à 09 h) y est annoncée 48 heures avant (§ 13.8). Le détail pas à pas est dans `DEPLOIEMENT.md`, « Supervision ».

## 4. Diagrammes UML

### 4.1 Composants

```mermaid
flowchart LR
    subgraph EXT["Service de sonde (hébergé)"]
        SONDE["Moniteurs HTTP<br/>et mots-clés"]
        BAT["Battements attendus"]
        PAGE["Page d'état publique"]
        ALERTE["Alertes"]
    end
    TEL["Téléphone d'astreinte<br/>(notification)"]
    MAIL["Courriel"]

    subgraph VPS["Serveur"]
        CADDY["Caddy"]
        subgraph API["Planner (backend)"]
            MES["mesureMiddleware"]
            CPT["compteurs<br/>(mémoire, 1 h)"]
            ROUTE["supervisionRoutes<br/>/sante, /mesures"]
            ETAT["etat.js"]
            LOG["journaux<br/>etablissement=…"]
        end
        DB[("MySQL")]
        SOLV["Solveur"]
        SAUV["sauvegarder.sh<br/>sauvegarder-journaux.sh"]
    end

    SONDE -- "HTTPS toutes les 3 min" --> CADDY --> ROUTE
    MES --> CPT
    ROUTE --> ETAT
    ETAT --> CPT
    ETAT -- "lecture minuscule" --> DB
    ETAT -- "/health" --> SOLV
    SAUV -- "battement si réussi" --> BAT
    SONDE & BAT --> ALERTE --> TEL & MAIL
    SONDE --> PAGE
```

### 4.2 Séquence : une panne la nuit

```mermaid
sequenceDiagram
    participant S as Sonde
    participant P as Planner (/api/supervision/sante)
    participant DB as MySQL
    participant A as Alertes
    actor AS as Astreinte

    loop toutes les 3 minutes
        S->>P: GET /api/supervision/sante
        P->>DB: lecture (délai 3 s)
        DB-->>P: réponse
        P-->>S: 200 {"etat":"ok",...}
    end
    Note over DB: 03:12 la base s'arrête
    S->>P: GET /api/supervision/sante
    P->>DB: lecture
    DB--xP: pas de réponse en 3 s
    P-->>S: 503 {"base":"injoignable"}
    S->>S: confirmation (second essai, autre région)
    S->>A: incident ouvert
    A->>AS: notification sur le téléphone + courriel (avant 03:17)
    AS->>S: acquitte l'incident
    Note over AS: diagnostic : DEPLOIEMENT.md, procédures du § 13.9
```

### 4.3 États d'un incident

```mermaid
stateDiagram-v2
    [*] --> Sain
    Sain --> Suspect: un échec de sonde
    Suspect --> Sain: l'essai de confirmation passe
    Suspect --> Incident: confirmé (alerte envoyée)
    Incident --> Acquitte: l'astreinte prend la main
    Incident --> Resolu: le service revient seul
    Acquitte --> Resolu: corrigé ou contourné
    Resolu --> Sain: page d'état mise à jour
    Sain --> Maintenance: fenêtre du dimanche annoncée
    Maintenance --> Sain: fin de fenêtre (aucune alerte pendant)
```

### 4.4 Activité : l'essai de panne de nuit (critère du lot)

```mermaid
flowchart TD
    A([dimanche, fenêtre de maintenance<br/>NON déclarée dans la sonde]) --> B[noter l'heure H0]
    B --> C["docker pause hestim_backend"]
    C --> D{notification reçue<br/>sur le téléphone ?}
    D -- "oui, à H1" --> E["docker unpause hestim_backend"]
    D -- "pas après 10 min" --> F["docker unpause ; régler la sonde<br/>(intervalle, confirmation, notifications)"]:::ko
    F --> A
    E --> G{H1 - H0 &lt; 5 min ?}
    G -- oui --> H([critère tenu : noter H0, H1<br/>dans docs/recette/essais-supervision.md])
    G -- non --> F
    classDef ko fill:#fde2e2,stroke:#b42318
```

## 5. Vérification

1. **Tests automatiques** : compteurs (fenêtre, centiles, purge d'une heure) ; route de santé (tout va bien, solveur arrêté, trop d'erreurs 500, base injoignable : 503) ; mesures (404 sans jeton configuré, 401 sans jeton ou avec un autre, champs attendus et rien d'autre). Le seuil d'erreurs a été faussé exprès : un test l'a signalé.
2. **Essai de panne de nuit** (§ 4.4), par le chef de projet, une fois la sonde configurée : c'est le critère du lot.
3. **Battements** : lancer `sauvegarder.sh` à la main une fois, vérifier que la sonde a reçu le battement.

## 6. Limites assumées

- Les compteurs sont en mémoire : un redémarrage du serveur les remet à zéro (une heure d'historique au plus) ; c'est la sonde qui garde l'historique des pannes.
- Avec plusieurs instances ou plusieurs écoles, les compteurs seront rangés par établissement (audit d'isolation, I-10) et la page d'état aura une ligne par école.
