# Résumé Complet des Associations - Projet HESTIM Planning

## 📊 Tableau Récapitulatif des Associations

| #   | Entité 1    | Card. | Association       | Card. | Entité 2                | Type        | Clé Étrangère                                                          | Contrainte |
| --- | ----------- | ----- | ----------------- | ----- | ----------------------- | ----------- | ---------------------------------------------------------------------- | ---------- |
| 1   | User        | 1     | "est un"          | 0..1  | Enseignant              | Héritage    | `enseignants.id_enseignant → users.id_user`                            | CASCADE    |
| 2   | User        | 1     | "est un"          | 0..1  | Etudiant                | Héritage    | `etudiants.id_etudiant → users.id_user`                                | CASCADE    |
| 3   | Filiere     | 1     | "contient"        | N     | Groupe                  | Composition | `groupes.id_filiere → filieres.id_filiere`                             | RESTRICT   |
| 4   | Filiere     | 1     | "propose"         | N     | Cours                   | Association | `cours.id_filiere → filieres.id_filiere`                               | RESTRICT   |
| 5   | Groupe      | 1     | "contient"        | N     | Etudiant                | Composition | `etudiants.id_groupe → groupes.id_groupe`                              | RESTRICT   |
| 6   | Cours       | 1     | "fait l'objet de" | N     | Reservation             | Association | `reservations.id_cours → cours.id_cours`                               | RESTRICT   |
| 7   | Enseignant  | 1     | "assure"          | N     | Reservation             | Association | `reservations.id_enseignant → enseignants.id_enseignant`               | RESTRICT   |
| 8   | Salle       | 1     | "accueille"       | N     | Reservation             | Association | `reservations.id_salle → salles.id_salle`                              | RESTRICT   |
| 9   | Groupe      | 1     | "assiste à"       | N     | Reservation             | Association | `reservations.id_groupe → groupes.id_groupe`                           | RESTRICT   |
| 10  | Creneau     | 1     | "se déroule dans" | N     | Reservation             | Association | `reservations.id_creneau → creneaux.id_creneau`                        | RESTRICT   |
| 11  | User        | 1     | "créé par"        | N     | Reservation             | Traçabilité | `reservations.created_by → users.id_user`                              | SET NULL   |
| 12  | Reservation | 1     | "est en conflit"  | N     | Conflit                 | Association | `conflits.id_reservation_1 → reservations.id_reservation`              | CASCADE    |
| 13  | Reservation | 1     | "est en conflit"  | N     | Conflit                 | Association | `conflits.id_reservation_2 → reservations.id_reservation`              | CASCADE    |
| 14  | User        | 1     | "résolu par"      | N     | Conflit                 | Traçabilité | `conflits.resolu_par → users.id_user`                                  | SET NULL   |
| 15  | Enseignant  | 1     | "définit"         | N     | DisponibiliteEnseignant | Composition | `disponibilites_enseignants.id_enseignant → enseignants.id_enseignant` | CASCADE    |
| 16  | Creneau     | 1     | "concerne"        | N     | DisponibiliteEnseignant | Association | `disponibilites_enseignants.id_creneau → creneaux.id_creneau`          | CASCADE    |
| 17  | User        | 1     | "reçoit"          | N     | Notification            | Association | `notifications.id_user → users.id_user`                                | CASCADE    |

## 🎯 Schéma Textuel des Relations

### USER (Utilisateur parent)

```
USER
  ├── [1:0..1] ──→ ENSEIGNANT (héritage)
  │                  ├── [1:N] ──→ RESERVATION (assure)
  │                  └── [1:N] ──→ DISPONIBILITE_ENSEIGNANT (définit)
  │
  ├── [1:0..1] ──→ ETUDIANT (héritage)
  │                  └── [N:1] ──→ GROUPE (appartient à - SA CLASSE)
  │
  ├── [1:N] ──→ RESERVATION (créé par - traçabilité)
  ├── [1:N] ──→ CONFLIT (résolu par - traçabilité)
  └── [1:N] ──→ NOTIFICATION (reçoit)
```

### FILIERE

```
FILIERE
  ├── [1:N] ──→ GROUPE (contient)
  │              ├── [1:N] ──→ ETUDIANT (contient)
  │              └── [1:N] ──→ RESERVATION (assiste à)
  │
  └── [1:N] ──→ COURS (propose)
                 └── [1:N] ──→ RESERVATION (fait l'objet de)
```

### SALLE

```
SALLE
  └── [1:N] ──→ RESERVATION (accueille)
```

### CRENEAU

```
CRENEAU
  ├── [1:N] ──→ RESERVATION (se déroule dans)
  └── [1:N] ──→ DISPONIBILITE_ENSEIGNANT (concerne)
```

### RESERVATION (TABLE CENTRALE - 5 FK)

```
RESERVATION (TABLE CENTRALE)
  ├── [N:1] ──→ COURS
  ├── [N:1] ──→ ENSEIGNANT
  ├── [N:1] ──→ SALLE
  ├── [N:1] ──→ GROUPE
  ├── [N:1] ──→ CRENEAU
  ├── [N:1] ──→ USER (created_by)
  └── [1:N] ──→ CONFLIT (peut générer des conflits)
```

### CONFLIT

```
CONFLIT
  ├── [N:1] ──→ RESERVATION (réservation 1)
  ├── [N:1] ──→ RESERVATION (réservation 2)
  └── [N:1] ──→ USER (resolu_par)
```

## 📝 Description Détaillée des Associations

### 🔵 GROUPE 1 : Héritage User

#### Association 1 : User ↔ Enseignant

-   **TYPE :** Héritage (Is-A)
-   **LECTURE :** Un User EST UN Enseignant
-   **CARDINALITÉ :** 1 User → 0..1 Enseignant
-   **CLÉ ÉTRANGÈRE :** `enseignants.id_enseignant REFERENCES users.id_user`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Chaque enseignant est d'abord un utilisateur
-   Un utilisateur peut être (ou non) un enseignant
-   Si le user est supprimé, l'enseignant l'est aussi

#### Association 2 : User ↔ Etudiant

-   **TYPE :** Héritage (Is-A)
-   **LECTURE :** Un User EST UN Étudiant
-   **CARDINALITÉ :** 1 User → 0..1 Etudiant
-   **CLÉ ÉTRANGÈRE :** `etudiants.id_etudiant REFERENCES users.id_user`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Chaque étudiant est d'abord un utilisateur
-   Un utilisateur peut être (ou non) un étudiant
-   Si le user est supprimé, l'étudiant l'est aussi

### 🟢 GROUPE 2 : Organisation Académique

#### Association 3 : Filiere ↔ Groupe

-   **TYPE :** Composition (Has-A)
-   **LECTURE :** Une Filière CONTIENT plusieurs Groupes
-   **CARDINALITÉ :** 1 Filiere → N Groupes
-   **CLÉ ÉTRANGÈRE :** `groupes.id_filiere REFERENCES filieres.id_filiere`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Une filière peut avoir plusieurs groupes/classes
-   Un groupe appartient à UNE SEULE filière
-   On ne peut pas supprimer une filière si elle a des groupes

**EXEMPLE :**

```
Filière "IIIA" contient:
  - Groupe "1A-IIIA"
  - Groupe "3A-IIIA"
  - Groupe "4A-IIIA"
```

#### Association 4 : Filiere ↔ Cours

-   **TYPE :** Association simple
-   **LECTURE :** Une Filière PROPOSE plusieurs Cours
-   **CARDINALITÉ :** 1 Filiere → N Cours
-   **CLÉ ÉTRANGÈRE :** `cours.id_filiere REFERENCES filieres.id_filiere`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Une filière propose plusieurs cours
-   Un cours appartient à UNE SEULE filière
-   On ne peut pas supprimer une filière si elle a des cours

**EXEMPLE :**

```
Filière "IIIA" propose:
  - "Intelligence Artificielle"
  - "Base de données avancées"
  - "Développement Web"
```

#### Association 5 : Groupe ↔ Etudiant ⭐ IMPORTANT

-   **TYPE :** Composition (Has-A)
-   **LECTURE :**
    -   Un Groupe CONTIENT plusieurs Étudiants
    -   Un Étudiant APPARTIENT à UN Groupe (SA CLASSE)
-   **CARDINALITÉ :** 1 Groupe → N Etudiants
-   **CLÉ ÉTRANGÈRE :** `etudiants.id_groupe REFERENCES groupes.id_groupe`
-   **CONTRAINTE :** `ON DELETE RESTRICT`, `NOT NULL`

**EXPLICATION :**

-   Cette association représente la CLASSE de l'étudiant
-   Chaque étudiant DOIT appartenir à un groupe (obligatoire)
-   Un groupe peut avoir plusieurs étudiants
-   On ne peut pas supprimer un groupe s'il a des étudiants

**EXEMPLE :**

```
Groupe "3A-IIIA-G1" contient:
  - Youssef El Idrissi (id_groupe = 1)
  - Sara Mouhib (id_groupe = 1)
  - Ahmed Bennani (id_groupe = 1)
```

> **⚠️ NOTE IMPORTANTE :**  
> C'est grâce à cet attribut qu'on peut générer l'emploi du temps d'un étudiant en filtrant les réservations de son groupe.

### 🟣 GROUPE 3 : Réservations (Associations vers RESERVATION)

#### Association 6 : Cours ↔ Reservation

-   **TYPE :** Association simple
-   **LECTURE :** Un Cours FAIT L'OBJET DE plusieurs Réservations
-   **CARDINALITÉ :** 1 Cours → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.id_cours REFERENCES cours.id_cours`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Un cours peut être réservé plusieurs fois (différentes dates/groupes)
-   Chaque réservation concerne UN SEUL cours
-   On ne peut pas supprimer un cours s'il a des réservations

**EXEMPLE :**

```
Cours "Intelligence Artificielle":
  - Réservation 1: Lundi 8h30, Salle A101, Groupe 3A-IIIA-G1
  - Réservation 2: Mardi 10h45, Salle A101, Groupe 3A-IIIA-G2
```

#### Association 7 : Enseignant ↔ Reservation

-   **TYPE :** Association simple
-   **LECTURE :** Un Enseignant ASSURE plusieurs Réservations
-   **CARDINALITÉ :** 1 Enseignant → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.id_enseignant REFERENCES enseignants.id_enseignant`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Un enseignant peut donner plusieurs cours
-   Chaque réservation est assurée par UN SEUL enseignant
-   On ne peut pas supprimer un enseignant s'il a des réservations

**CONTRAINTE MÉTIER :**

-   Un enseignant ne peut pas avoir 2 réservations en même temps (même date + même créneau)

#### Association 8 : Salle ↔ Reservation

-   **TYPE :** Association simple
-   **LECTURE :** Une Salle ACCUEILLE plusieurs Réservations
-   **CARDINALITÉ :** 1 Salle → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.id_salle REFERENCES salles.id_salle`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Une salle peut être réservée plusieurs fois
-   Chaque réservation se déroule dans UNE SEULE salle
-   On ne peut pas supprimer une salle si elle a des réservations

**CONTRAINTE MÉTIER :**

-   Une salle ne peut pas avoir 2 réservations en même temps (même date + même créneau)
-   Capacité salle >= Effectif groupe

#### Association 9 : Groupe ↔ Reservation

-   **TYPE :** Association simple
-   **LECTURE :** Un Groupe ASSISTE À plusieurs Réservations
-   **CARDINALITÉ :** 1 Groupe → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.id_groupe REFERENCES groupes.id_groupe`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Un groupe assiste à plusieurs cours
-   Chaque réservation concerne UN SEUL groupe
-   On ne peut pas supprimer un groupe s'il a des réservations

**CONTRAINTE MÉTIER :**

-   Un groupe ne peut pas avoir 2 réservations en même temps (même date + même créneau)

#### Association 10 : Creneau ↔ Reservation

-   **TYPE :** Association simple
-   **LECTURE :** Un Créneau est utilisé pour plusieurs Réservations
-   **CARDINALITÉ :** 1 Creneau → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.id_creneau REFERENCES creneaux.id_creneau`
-   **CONTRAINTE :** `ON DELETE RESTRICT`

**EXPLICATION :**

-   Un créneau (ex: Lundi 8h30-10h30) est réutilisable chaque semaine
-   Chaque réservation se déroule dans UN SEUL créneau
-   On ne peut pas supprimer un créneau s'il a des réservations

#### Association 11 : User ↔ Reservation (Traçabilité)

-   **TYPE :** Association de traçabilité
-   **LECTURE :** Un Utilisateur CRÉE plusieurs Réservations
-   **CARDINALITÉ :** 1 User → N Reservations
-   **CLÉ ÉTRANGÈRE :** `reservations.created_by REFERENCES users.id_user`
-   **CONTRAINTE :** `ON DELETE SET NULL`

**EXPLICATION :**

-   Permet de tracer qui a créé chaque réservation
-   Si l'utilisateur est supprimé, `created_by` devient NULL
-   L'historique de la réservation est conservé

### 🔴 GROUPE 4 : Gestion des Conflits

#### Association 12-13 : Reservation ↔ Conflit

-   **TYPE :** Association N:M (via table Conflit)
-   **LECTURE :** Une Réservation peut être EN CONFLIT avec d'autres Réservations
-   **CARDINALITÉ :** 1 Reservation → N Conflits
-   **CLÉ ÉTRANGÈRE :**
    -   `conflits.id_reservation_1 REFERENCES reservations.id_reservation`
    -   `conflits.id_reservation_2 REFERENCES reservations.id_reservation`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Une réservation peut générer plusieurs conflits
-   Un conflit relie TOUJOURS exactement 2 réservations
-   Si une réservation est supprimée, ses conflits le sont aussi
-   Création automatique via trigger SQL

**TYPES DE CONFLITS :**

-   `'salle'` : Même salle, même date, même créneau
-   `'enseignant'` : Même enseignant, même date, même créneau
-   `'groupe'` : Même groupe, même date, même créneau
-   `'multiple'` : Plusieurs types de conflits simultanés

#### Association 14 : User ↔ Conflit (Résolution)

-   **TYPE :** Association de traçabilité
-   **LECTURE :** Un Utilisateur RÉSOUT plusieurs Conflits
-   **CARDINALITÉ :** 1 User → N Conflits
-   **CLÉ ÉTRANGÈRE :** `conflits.resolu_par REFERENCES users.id_user`
-   **CONTRAINTE :** `ON DELETE SET NULL`

**EXPLICATION :**

-   Permet de tracer qui a résolu chaque conflit
-   Un administrateur résout les conflits
-   Si l'utilisateur est supprimé, `resolu_par` devient NULL

### 🟡 GROUPE 5 : Disponibilités

#### Association 15 : Enseignant ↔ DisponibiliteEnseignant

-   **TYPE :** Composition (Owns-A)
-   **LECTURE :** Un Enseignant DÉFINIT ses Disponibilités
-   **CARDINALITÉ :** 1 Enseignant → N DisponibiliteEnseignant
-   **CLÉ ÉTRANGÈRE :** `disponibilites_enseignants.id_enseignant REFERENCES enseignants.id_enseignant`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Un enseignant déclare ses disponibilités par créneau
-   Si l'enseignant est supprimé, ses disponibilités le sont aussi
-   Utile pour la planification automatique (Semestre 2)

**EXEMPLE :**

```
Prof. Alami:
  - Lundi 8h30-10h30: disponible
  - Lundi 10h45-12h45: non disponible (réunion)
  - Mardi 8h30-10h30: disponible
```

#### Association 16 : Creneau ↔ DisponibiliteEnseignant

-   **TYPE :** Association simple
-   **LECTURE :** Un Créneau CONCERNE plusieurs Disponibilités
-   **CARDINALITÉ :** 1 Creneau → N DisponibiliteEnseignant
-   **CLÉ ÉTRANGÈRE :** `disponibilites_enseignants.id_creneau REFERENCES creneaux.id_creneau`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Chaque disponibilité est définie pour un créneau spécifique
-   Un créneau peut être utilisé par plusieurs enseignants

### 🟠 GROUPE 6 : Notifications

#### Association 17 : User ↔ Notification

-   **TYPE :** Association simple
-   **LECTURE :** Un Utilisateur REÇOIT plusieurs Notifications
-   **CARDINALITÉ :** 1 User → N Notifications
-   **CLÉ ÉTRANGÈRE :** `notifications.id_user REFERENCES users.id_user`
-   **CONTRAINTE :** `ON DELETE CASCADE`

**EXPLICATION :**

-   Chaque utilisateur peut recevoir plusieurs notifications
-   Si l'utilisateur est supprimé, ses notifications le sont aussi
-   Notifications créées automatiquement lors de :
    -   Création d'une réservation
    -   Modification d'une réservation
    -   Annulation d'un cours
    -   Détection d'un conflit

## 🎯 Contraintes d'intégrité critique

### Contraintes d'Unicité

1. **`UNIQUE(users.email)`**

    - Un email = un seul compte

2. **`UNIQUE(etudiants.numero_etudiant)`**

    - Un numéro étudiant unique

3. **`UNIQUE(filieres.code_filiere)`**

    - Ex: "IIIA" unique

4. **`UNIQUE(salles.nom_salle)`**

    - Ex: "A101" unique

5. **`UNIQUE(cours.code_cours)`**

    - Ex: "IA301" unique

6. **`UNIQUE(groupes.nom_groupe, groupes.annee_scolaire)`**

    - "3A-IIIA-G1" unique pour 2025-2026

7. **`UNIQUE(creneaux.jour_semaine, creneaux.heure_debut, creneaux.heure_fin)`**

    - Un créneau unique par plage horaire

8. **`UNIQUE(disponibilites_enseignants.id_enseignant, id_creneau, date_debut)`**
    - Pas de doublon de disponibilité

### Contraintes de Non-Conflit (Logique Métier)

#### RÈGLE 1 : Conflit de SALLE

```sql
SELECT COUNT(*) FROM reservations
WHERE id_salle = ?
  AND date_seance = ?
  AND id_creneau = ?
  AND statut != 'annulee'
HAVING COUNT(*) > 1
-- → CONFLIT si résultat > 0
```

#### RÈGLE 2 : Conflit d'ENSEIGNANT

```sql
SELECT COUNT(*) FROM reservations
WHERE id_enseignant = ?
  AND date_seance = ?
  AND id_creneau = ?
  AND statut != 'annulee'
HAVING COUNT(*) > 1
-- → CONFLIT si résultat > 0
```

#### RÈGLE 3 : Conflit de GROUPE

```sql
SELECT COUNT(*) FROM reservations
WHERE id_groupe = ?
  AND date_seance = ?
  AND id_creneau = ?
  AND statut != 'annulee'
HAVING COUNT(*) > 1
-- → CONFLIT si résultat > 0
```

#### RÈGLE 4 : Capacité de la SALLE

```sql
SELECT s.capacite, g.effectif
FROM salles s, groupes g, reservations r
WHERE r.id_salle = s.id_salle
  AND r.id_groupe = g.id_groupe
HAVING s.capacite < g.effectif
-- → AVERTISSEMENT si vrai
```

## 📚 Résumé Exécutif

### Entités Principales : 12

1. **User** (parent)
2. **Enseignant** (héritage)
3. **Etudiant** (héritage avec `id_groupe`)
4. **Filiere**
5. **Groupe** (classe)
6. **Salle**
7. **Cours**
8. **Creneau**
9. **Reservation** (centrale - 5 FK)
10. **Conflit**
11. **DisponibiliteEnseignant**
12. **Notification**

### Associations Totales : 17

-   **Héritage :** 2 (User → Enseignant, User → Etudiant)
-   **Composition :** 3 (Filiere → Groupe, Groupe → Etudiant, Enseignant → Disponibilité)
-   **Association simple :** 10
-   **Traçabilité :** 2 (`created_by`, `resolu_par`)

### ⭐ Point Clé

**L'attribut `etudiants.id_groupe` est ESSENTIEL car :**

-   Représente la **CLASSE** de l'étudiant
-   Permet de générer l'emploi du temps étudiant
-   Obligatoire (`NOT NULL`)
-   Clé étrangère vers `groupes`

---

> **📌 Note :** Ce document contient **TOUTES** les informations nécessaires pour créer vos MCD, MLD et diagrammes UML.
