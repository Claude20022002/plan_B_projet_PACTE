# 3. Architecture

Les vues suivent le modèle C4 (contexte, conteneurs, composants) ; les échanges suivent les décisions D-14 et D-15.

## 3.1 Contexte : qui utilise quoi

```mermaid
flowchart LR
    ETU["Étudiant<br/>site et application"]
    ENS["Enseignant"]
    ADM["Administration<br/>d'un établissement"]
    EQP["Équipe Planner<br/>support et exploitation"]
    CRE["Créateur de jeux<br/>personne ou studio"]

    subgraph PL["Planner (la plateforme)"]
        SYS["Planner"]
    end

    MAIL["Serveur de courriel"]
    PUSH["Expo Push"]
    IA["Fournisseur d'IA"]
    IDP["Annuaire de l'école<br/>Entra ou Google (OIDC)"]
    BANQ["Banque<br/>virements aux créateurs"]

    ETU --> SYS
    ENS --> SYS
    ADM --> SYS
    EQP --> SYS
    CRE --> SYS
    SYS --> MAIL
    SYS --> PUSH
    SYS --> IA
    SYS --> IDP
    SYS --> BANQ
```

## 3.2 Conteneurs : les services et leurs bases

```mermaid
flowchart TB
    subgraph CLIENTS["Clients"]
        WEB["Site web (React)<br/>emsi.domaine, hestim.domaine"]
        MOB["Application mobile (Expo)<br/>une seule, toutes écoles"]
        CREA["Espace créateurs (web)<br/>createurs.domaine"]
    end

    CADDY["Caddy<br/>TLS automatique, domaines propres"]

    subgraph COEUR["Dépôt Planner"]
        API["Planner API (Node)<br/>monolithe modulaire"]
        PLAT["Plateforme (Node)<br/>registre, comptes, facturation"]
        SOLV["Solveur (Java, Timefold)<br/>sans état"]
    end

    subgraph AUTRES["Dépôts séparés"]
        SLIB["Bibliothèque (StudyLib, Laravel)"]
        JEUX["Service des jeux (planner-jeux)"]
    end

    subgraph DONNEES["Données"]
        DBP[("planner_plateforme")]
        DBE[("une base par établissement<br/>hestim_planner (existante), et_emsi, ...")]
        DBS[("studylib")]
        DBJ[("planner_jeux")]
        OBJ[("Stockage objet (MinIO)<br/>un préfixe par établissement")]
    end

    WEB --> CADDY
    MOB --> CADDY
    CREA --> CADDY
    CADDY --> API
    CADDY --> PLAT
    CADDY --> SLIB
    CADDY --> JEUX
    API --> SOLV
    API --> DBE
    API -- "registre (lecture, cache)" --> PLAT
    PLAT --> DBP
    SLIB --> DBS
    SLIB --> OBJ
    JEUX --> DBJ
    JEUX --> OBJ
    API -. "événements (boîte d'envoi)" .-> PLAT
    API -. "événements" .-> SLIB
    API -. "événements" .-> JEUX
    PLAT -. "événements" .-> JEUX
```

| Service | Dépôt | Base | Connaît les établissements par |
|---|---|---|---|
| Planner API | Planner | une par établissement | le contexte (D-03) |
| Plateforme | Planner (`plateforme/`) | `planner_plateforme` | sa table `Etablissement` (propriétaire) |
| Solveur | Planner (`solver/`) | aucune | rien : il reçoit un problème, rend une solution |
| Bibliothèque (StudyLib) | StudyLib | `studylib` | `etablissement_uid` sur chaque document, filière, module et utilisateur |
| Jeux | `planner-jeux` | `planner_jeux` | `etablissement_uid` sur sessions, usages, revenus, jeux de visibilité « établissement » |

**Pourquoi StudyLib et les jeux gardent une base commune** (et pas une par école) : pour les jeux, la valeur est justement le catalogue partagé entre écoles ; chaque élément propre à une école y porte son `etablissement_uid`, filtré par le jeton (revendication `tid`). Ce sont des données moins sensibles que la vie scolaire (aucune note, aucune présence).

**StudyLib, point vérifié** : elle n'a aujourd'hui que deux visibilités, `school` (toute l'école) et `class` (`app/Enums/DocumentVisibility.php`), et ses documents viennent en partie du Drive de HESTIM (`ImportDriveDocuments`). Il n'y a donc **pas** de catalogue public : `school` veut dire « HESTIM ». Tous les documents existants reçoivent l'`etablissement_uid` de HESTIM et restent invisibles des autres écoles. Une future visibilité « toutes les écoles » demandera une revue des droits d'auteur, comme les jeux publics ; elle n'est pas dans ce plan. Lot ME-2e.

## 3.3 Les contextes métier de Planner (monolithe modulaire, D-17)

Chaque contexte a son dossier dans `backend/services/` et n'appelle les autres que par leurs fonctions exportées, jamais par leurs tables.

```mermaid
flowchart LR
    REF["Référentiel<br/>campus, salles, nomenclatures"]
    OFF["Offre de formation<br/>filières, groupes, modules"]
    CAL["Calendrier<br/>années, périodes, fériés"]
    PAR["Paramètres<br/>versions datées"]
    PLA["Planification<br/>génération, séances, conflits"]
    VIE["Vie de la séance<br/>appel, reports, imprévus"]
    PUB["Publication<br/>EDT du mois, agenda"]
    ACT["Activités<br/>Studio quiz, sessions de jeu"]
    IMP["Import<br/>zone de préparation"]
    PRS["Personnes<br/>enseignants, étudiants, rôles"]

    IMP --> REF
    IMP --> OFF
    IMP --> PRS
    IMP --> CAL
    REF --> PLA
    OFF --> PLA
    CAL --> PLA
    PAR --> PLA
    PRS --> PLA
    PLA --> VIE
    PLA --> PUB
    VIE --> PUB
    OFF --> ACT
    PRS --> ACT
```

Règle : une flèche va du fournisseur vers l'utilisateur. Pas de cycle. Un nouveau besoin qui créerait un cycle passe par un événement interne.

## 3.4 Une requête de bout en bout

```mermaid
sequenceDiagram
    autonumber
    participant N as Navigateur (emsi.domaine)
    participant C as Caddy
    participant A as Planner API
    participant R as Registre (cache local)
    participant P as Plateforme
    participant B as Base et_emsi

    N->>C: GET /api/seances (cookie, jeton avec tid=emsi)
    C->>A: même requête, en-tête Host conservé
    A->>A: vérifie la signature du jeton (JWKS)
    A->>R: établissement de l'hôte emsi.domaine
    alt absent du cache
        R->>P: GET /interne/etablissements/par-hote
        P-->>R: uid, statut, base (secret chiffré), version de schéma
    end
    R-->>A: établissement emsi (actif, schéma à jour)
    A->>A: hôte et tid identiques ? sinon 401
    A->>A: ouvre le contexte (pool emsi, modèles emsi)
    A->>B: SELECT ... (utilisateur MySQL de emsi seulement)
    B-->>A: lignes
    A-->>N: 200
```

Ce schéma est celui du site (adresse d'école). L'application passe par l'adresse neutre `api.<domaine>` : l'étape 7 n'a alors pas d'hôte à comparer, l'établissement est le `tid` du jeton (D-02).

Cas refusés, chacun couvert par un test d'isolation : jeton sans `tid` (401 ; seule exception, l'adresse de HESTIM pendant la transition décrite au § 9.4) ; `tid` différent de l'hôte (401) ; établissement suspendu (403, message à la marque de l'école) ; schéma hors de la plage acceptée par la version de Planner, ou migration en cours (503, page de maintenance de cet établissement seulement ; D-16).

## 3.5 Propriétaire de chaque donnée (D-15)

| Donnée | Propriétaire | Copies de lecture chez | Mise à jour des copies |
|---|---|---|---|
| Établissement, domaines, statut, marque | Plateforme | Planner (cache), StudyLib, jeux | événement `etablissement.modifie` |
| Compte, appartenances | Plateforme | Planner (`Users.uid_compte`) | événement `appartenance.*` |
| Filières, modules, groupes | Planner (base de l'école) | StudyLib (le service des jeux n'en a pas besoin : il n'en reçoit pas, par minimisation des données) | événement `referentiel.*` (remplace le `planner:sync` par code) |
| Séances, appel, reports | Planner | aucune | — |
| Plages occupées d'un enseignant partagé | Planner de l'école où il enseigne | Planner des autres écoles du compte | événement `occupation.modifiee` relayé par la Plateforme |
| Documents | StudyLib | Planner (liens seulement) | appel synchrone |
| Jeux, versions, créateurs | Jeux | Planner (catalogue en cache) | événement `jeu.publie`, `jeu.retire` |
| Résultats d'un élève à un jeu | Planner (donnée pédagogique de l'école) | aucune ; les jeux n'ont qu'un pseudonyme | événement `partie.terminee` de jeux vers Planner |
| Comptes actifs du mois, factures | Plateforme | jeux (montant encaissé seulement) | événement `facture.encaissee` |

## 3.6 Jetons entre services

| Jeton | Émis par | Audience | Contient | Durée |
|---|---|---|---|---|
| Accès utilisateur | Planner puis Plateforme (D-05) | `planner`, `studylib`, `jeux` | `sub` (compte), `tid`, `role`, `sid` | 15 min, renouvelé |
| Service vers service | chaque service, sa propre clé | le service appelé | `iss`, `aud`, `tid` si l'appel concerne une école | 60 s |
| Joueur de jeu | Planner | `jeux` | pseudonyme du joueur, `tid`, session de jeu | durée de la session |

Toutes les clés publiques sont publiées en JWKS ; chaque service garde sa clé privée. Deux secrets partagés existent aujourd'hui et disparaissent : celui du webhook ClassQuiz (retiré avec lui) et le jeton d'intégration que StudyLib envoie pour lire le référentiel (`X-Integration-Token`, `PLANNER_INTEGRATION_TOKEN`), remplacé par les événements `referentiel.*` au lot ME-2d.

## 3.7 Déploiement visé (deux serveurs, extensible)

```mermaid
flowchart LR
    subgraph S1["Serveur d'application"]
        CAD["Caddy"]
        API1["Planner API x2"]
        PLA1["Plateforme"]
        SOL1["Solveur<br/>file de travaux par école"]
        SLB1["StudyLib + file"]
        JEU1["Jeux"]
        RED["Redis"]
    end
    subgraph S2["Serveur de données"]
        MY[("MySQL<br/>une base par école<br/>+ plateforme, jeux, studylib")]
        MIN[("MinIO")]
    end
    subgraph EXT["Hors des deux serveurs"]
        SAV[("Sauvegardes chiffrées<br/>par établissement")]
    end
    CAD --> API1
    CAD --> PLA1
    CAD --> SLB1
    CAD --> JEU1
    API1 --> MY
    API1 --> SOL1
    PLA1 --> MY
    JEU1 --> MY
    SLB1 --> MY
    SLB1 --> MIN
    JEU1 --> MIN
    MY --> SAV
    MIN --> SAV
```

Aujourd'hui tout tient sur un seul VPS : la séparation données / application est le premier pas de montée en charge, pas un préalable. Le solveur reçoit une **file de travaux** avec un tour par établissement, pour qu'une grosse génération ne bloque pas les autres écoles.

## 3.8 Pools de connexions

MySQL accepte 151 connexions par défaut. Règle : un pool par établissement **et par instance de l'API**, 3 connexions au plus, créé à la première requête et fermé après 10 minutes sans activité.

Le calcul, refait à la vérification : avec deux instances de l'API, une école active occupe jusqu'à 6 connexions ; il faut aussi compter la Plateforme, les migrations, StudyLib, le service des jeux et les tâches (environ 30). Avec 151 connexions, on sert donc environ **20 écoles actives en même temps**, et les écoles travaillent toutes aux mêmes heures. Pour tenir l'objectif de 50 établissements (EX-Q3), il faut **`max_connections` à 500** (une connexion MySQL inactive coûte peu de mémoire ; à mesurer au lot ME-5), puis ProxySQL au-delà. Le verrou des tâches périodiques (`GET_LOCK`, préfixé par le nom de la base) fonctionne déjà par établissement.
