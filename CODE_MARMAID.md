# 📊 Codes Mermaid Complets pour Export

Copiez ces codes dans https://mermaid.live/ pour générer les images.

---

```markdown
### 🗺️ Légende

-   🔹 **PK** : clé primaire
-   🔸 **FK** : clé étrangère
-   🧩 Les relations 1–N sont indiquées par `||--o{`
-   📚 Généré avec [Mermaid ER Diagram](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)
```

## 1️⃣ MCD - Modèle Conceptuel de Données

```mermaid
erDiagram
    USER ||--o{ ENSEIGNANT : "est un"
    USER ||--o{ ETUDIANT : "est un"

    FILIERE ||--o{ GROUPE : "contient"
    FILIERE ||--o{ COURS : "propose"

    GROUPE ||--o{ ETUDIANT : "appartient à"

    COURS ||--o{ RESERVATION : "fait l'objet de"
    ENSEIGNANT ||--o{ RESERVATION : "assure"
    SALLE ||--o{ RESERVATION : "accueille"
    GROUPE ||--o{ RESERVATION : "assiste à"
    CRENEAU ||--o{ RESERVATION : "se déroule dans"

    RESERVATION ||--o{ CONFLIT : "est en conflit"

    USER ||--o{ NOTIFICATION : "reçoit"

    ENSEIGNANT ||--o{ DISPONIBILITE_ENSEIGNANT : "définit"
    CRENEAU ||--o{ DISPONIBILITE_ENSEIGNANT : "concerne"

    USER {
        int id_user PK
        string nom
        string prenom
        string email UK
        string password_hash
        enum role
        string telephone
        string avatar_url
        boolean actif
        datetime created_at
        datetime updated_at
    }

    ENSEIGNANT {
        int id_enseignant PK,FK
        string specialite
        string departement
        enum grade
        string bureau
    }

    ETUDIANT {
        int id_etudiant PK,FK
        string numero_etudiant UK
        int id_groupe FK
        enum niveau
        date date_inscription
    }

    FILIERE {
        int id_filiere PK
        string nom_filiere
        string code_filiere UK
        text description
    }

    GROUPE {
        int id_groupe PK
        string nom_groupe
        enum niveau
        int effectif
        int id_filiere FK
        string annee_scolaire
    }

    SALLE {
        int id_salle PK
        string nom_salle UK
        enum type_salle
        int capacite
        string batiment
        int etage
        json equipements
        boolean disponible
    }

    COURS {
        int id_cours PK
        string nom_cours
        string code_cours UK
        int id_filiere FK
        enum niveau
        int volume_horaire
        enum type_cours
        enum semestre
        int coefficient
    }

    CRENEAU {
        int id_creneau PK
        enum jour_semaine
        time heure_debut
        time heure_fin
        enum periode
        int duree_minutes
    }

    RESERVATION {
        int id_reservation PK
        int id_cours FK
        int id_enseignant FK
        int id_salle FK
        int id_groupe FK
        int id_creneau FK
        date date_seance
        enum statut
        text commentaire
        datetime created_at
        datetime updated_at
        int created_by FK
    }

    CONFLIT {
        int id_conflit PK
        int id_reservation_1 FK
        int id_reservation_2 FK
        enum type_conflit
        text description
        datetime date_detection
        boolean resolu
        datetime date_resolution
        int resolu_par FK
    }

    DISPONIBILITE_ENSEIGNANT {
        int id_disponibilite PK
        int id_enseignant FK
        int id_creneau FK
        boolean disponible
        string raison_indisponibilite
        date date_debut
        date date_fin
    }

    NOTIFICATION {
        int id_notification PK
        int id_user FK
        string titre
        text message
        enum type_notification
        boolean lue
        datetime date_envoi
    }
```

**Fichier à créer** : `docs/database/MCD.png`

---

## 2️⃣ MLD - Modèle Logique de Données

```mermaid
graph TB
    subgraph "TABLE: users"
        U1["🔑 id_user PK<br/>nom, prenom<br/>📧 email UK<br/>password_hash<br/>role ENUM<br/>telephone, avatar_url<br/>actif BOOL<br/>created_at, updated_at"]
    end

    subgraph "TABLE: enseignants"
        E1["🔑 id_enseignant PK, FK→users<br/>specialite<br/>departement<br/>grade ENUM<br/>bureau"]
    end

    subgraph "TABLE: etudiants"
        ET1["🔑 id_etudiant PK, FK→users<br/>📧 numero_etudiant UK<br/>🔗 id_groupe FK→groupes<br/>niveau ENUM<br/>date_inscription"]
    end

    subgraph "TABLE: filieres"
        F1["🔑 id_filiere PK<br/>nom_filiere<br/>📧 code_filiere UK<br/>description"]
    end

    subgraph "TABLE: groupes"
        G1["🔑 id_groupe PK<br/>nom_groupe<br/>niveau ENUM<br/>effectif<br/>🔗 id_filiere FK→filieres<br/>annee_scolaire"]
    end

    subgraph "TABLE: salles"
        S1["🔑 id_salle PK<br/>📧 nom_salle UK<br/>type_salle ENUM<br/>capacite<br/>batiment, etage<br/>equipements JSON<br/>disponible BOOL"]
    end

    subgraph "TABLE: cours"
        C1["🔑 id_cours PK<br/>nom_cours<br/>📧 code_cours UK<br/>🔗 id_filiere FK→filieres<br/>niveau ENUM<br/>volume_horaire<br/>type_cours ENUM<br/>semestre ENUM<br/>coefficient"]
    end

    subgraph "TABLE: creneaux"
        CR1["🔑 id_creneau PK<br/>jour_semaine ENUM<br/>heure_debut TIME<br/>heure_fin TIME<br/>periode ENUM<br/>duree_minutes"]
    end

    subgraph "TABLE: reservations"
        R1["🔑 id_reservation PK<br/>🔗 id_cours FK→cours<br/>🔗 id_enseignant FK→enseignants<br/>🔗 id_salle FK→salles<br/>🔗 id_groupe FK→groupes<br/>🔗 id_creneau FK→creneaux<br/>date_seance<br/>statut ENUM<br/>commentaire<br/>created_at, updated_at<br/>🔗 created_by FK→users"]
    end

    subgraph "TABLE: conflits"
        CF1["🔑 id_conflit PK<br/>🔗 id_reservation_1 FK→reservations<br/>🔗 id_reservation_2 FK→reservations<br/>type_conflit ENUM<br/>description<br/>date_detection<br/>resolu BOOL<br/>date_resolution<br/>🔗 resolu_par FK→users"]
    end

    subgraph "TABLE: disponibilites_enseignants"
        D1["🔑 id_disponibilite PK<br/>🔗 id_enseignant FK→enseignants<br/>🔗 id_creneau FK→creneaux<br/>disponible BOOL<br/>raison_indisponibilite<br/>date_debut, date_fin"]
    end

    subgraph "TABLE: notifications"
        N1["🔑 id_notification PK<br/>🔗 id_user FK→users<br/>titre, message<br/>type_notification ENUM<br/>lue BOOL<br/>date_envoi"]
    end

    U1 -.->|1:1| E1
    U1 -.->|1:1| ET1
    F1 -->|1:N| G1
    F1 -->|1:N| C1
    G1 -->|1:N| ET1

    C1 -->|1:N| R1
    E1 -->|1:N| R1
    S1 -->|1:N| R1
    G1 -->|1:N| R1
    CR1 -->|1:N| R1
    U1 -->|1:N| R1

    R1 -->|1:N| CF1
    U1 -->|1:N| CF1

    E1 -->|1:N| D1
    CR1 -->|1:N| D1

    U1 -->|1:N| N1

    style U1 fill:#e1f5ff
    style E1 fill:#fff9c4
    style ET1 fill:#fff9c4
    style F1 fill:#f3e5f5
    style G1 fill:#f3e5f5
    style S1 fill:#e8f5e9
    style C1 fill:#fce4ec
    style CR1 fill:#fff3e0
    style R1 fill:#ffebee
    style CF1 fill:#ffcdd2
    style D1 fill:#e0f2f1
    style N1 fill:#e0e0e0
```

**Fichier à créer** : `docs/database/MLD.svg`

---

## 3️⃣ Diagramme de Cas d'Usage

(Utilisez le diagramme déjà créé dans l'artifact `uml_use_case`)

**Fichier à créer** : `docs/uml/use_case.png`

---

## 4️⃣ Diagramme de Classes

(Utilisez le diagramme déjà créé dans l'artifact `uml_class`)

**Fichier à créer** : `docs/uml/class_diagram.png`

---

## 5️⃣ Diagramme de Séquence - Création Réservation

(Code complet dans l'artifact `uml_sequence_reservation`)

**Fichier à créer** : `docs/uml/sequence_reservation.png`

---

## 6️⃣ Diagramme d'Activité - Détection Conflits

(Code complet dans l'artifact `uml_activity_conflict`)

**Fichier à créer** : `docs/uml/activity_conflict.png`

---

## 📝 Instructions Rapides

1. Aller sur **https://mermaid.live/**
2. Copier le code d'un diagramme ci-dessus
3. Coller dans l'éditeur
4. Cliquer sur **Actions** → **PNG**
5. Télécharger et renommer selon le nom de fichier indiqué
6. Placer dans le dossier approprié de votre projet

---

## 🎨 Paramètres d'Export Recommandés

-   **Format** : PNG
-   **Largeur** : 1920px (ou laisser automatique)
-   **Fond** : Transparent ou blanc
-   **Qualité** : Maximum

---

**Tous vos diagrammes seront prêts pour le README et les rapports ! 📊**
