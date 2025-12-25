# Explication détaillée du MLD — HESTIM Planning

## 🎯 1. Rôle du MLD

Le **Modèle Logique de Données (MLD)** traduit le MCD (Modèle Conceptuel de Données) en un modèle relationnel exploitable par un Système de Gestion de Base de Données (SGBD), ici MySQL.

Il définit les tables, leurs clés primaires (PK), clés étrangères (FK), contraintes uniques (UK), et relations entre les tables.

Ce modèle sert de base à la création physique de la base via des scripts SQL ou un ORM comme Sequelize.

## 🧱 2. Description des tables principales

### 2.1 users

**But :** table de base regroupant tous les comptes utilisateurs (administrateurs, enseignants, étudiants).

**Champs principaux :**

-   `id_user` (PK) : identifiant unique
-   `email` (UK) : adresse email unique, utilisée pour la connexion
-   `password_hash` : mot de passe haché (jamais en clair)
-   `role` (ENUM) : rôle dans le système (admin, enseignant, etudiant)
-   Autres : `nom`, `prenom`, `telephone`, `avatar_url`, `actif`, `created_at`, `updated_at`

**Remarques :**

-   C'est la table parent de toutes les autres entités utilisateur
-   Sert de point central pour l'authentification et les notifications

### 2.2 enseignants

**But :** informations spécifiques aux enseignants.

**Champs :**

-   `id_enseignant` (PK, FK) : identique à `users.id_user` → relation 1:1 (héritage)
-   `specialite`, `departement`, `grade` (Professeur, Maître-assistant, etc.), `bureau`

**Remarque :** Un enseignant est obligatoirement un utilisateur existant.

### 2.3 etudiants

**But :** informations propres aux étudiants.

**Champs :**

-   `id_etudiant` (PK, FK) : correspond à `users.id_user`
-   `numero_etudiant` (UK) : numéro unique
-   `id_groupe` (FK) : relie l'étudiant à un groupe
-   `niveau`, `date_inscription`

**Remarque :**

-   L'attribut `id_groupe` est obligatoire (un étudiant appartient toujours à un groupe)
-   Relation 1:N avec groupes

### 2.4 filieres

**But :** représente les filières (ou départements d'enseignement).

**Champs :**

-   `id_filiere` (PK), `nom_filiere`, `code_filiere` (UK), `description`, `created_at`

**Relations :**

-   1:N avec groupes (une filière contient plusieurs groupes)
-   1:N avec cours (une filière propose plusieurs cours)

### 2.5 groupes

**But :** représente une classe ou un groupe d'étudiants.

**Champs :**

-   `id_groupe` (PK), `nom_groupe`, `niveau`, `effectif`, `id_filiere` (FK), `annee_scolaire`

**Contrainte :** unique (`nom_groupe`, `annee_scolaire`) pour éviter les doublons d'une année à l'autre.

**Remarque :** Relation avec etudiants (1 groupe contient plusieurs étudiants).

### 2.6 salles

**But :** gère les informations sur les salles disponibles.

**Champs :**

-   `id_salle` (PK), `nom_salle` (UK), `type_salle` (ENUM : amphi, labo, etc.), `capacite`, `batiment`, `etage`, `equipements` (JSON), `disponible`, `created_at`

**Remarque :** `equipements` permet de stocker des informations structurées (ex : `{"projecteur": true, "pc": 20}`).

### 2.7 cours

**But :** représente les matières ou unités d'enseignement.

**Champs :**

-   `id_cours` (PK), `nom_cours`, `code_cours` (UK), `id_filiere` (FK), `niveau`, `volume_horaire`, `type_cours` (CM, TD, TP...), `semestre`, `coefficient`, `created_at`

**Relation :** 1:N avec reservations (un cours peut être réservé plusieurs fois).

### 2.8 creneaux

**But :** décrit les plages horaires.

**Champs :**

-   `id_creneau` (PK), `jour_semaine`, `heure_debut`, `heure_fin`, `periode`, `duree_minutes`

**Contrainte :** UNIQUE (`jour_semaine`, `heure_debut`, `heure_fin`) pour éviter les doublons.

**Remarque :** `duree_minutes` peut être calculé automatiquement.

### 2.9 reservations (table pivot)

**But :** table centrale qui relie cours, enseignant, salle, groupe, et créneau.

**Champs :**

-   `id_reservation` (PK), `id_cours`, `id_enseignant`, `id_salle`, `id_groupe`, `id_creneau`, `date_seance`, `statut` (ENUM), `commentaire`, `created_at`, `updated_at`, `created_by`

**Relations :**

-   `id_cours` → `cours.id_cours`
-   `id_enseignant` → `enseignants.id_enseignant`
-   `id_salle` → `salles.id_salle`
-   `id_groupe` → `groupes.id_groupe`
-   `id_creneau` → `creneaux.id_creneau`
-   `created_by` → `users.id_user`

**Remarque :** Cette table gère toutes les séances planifiées et constitue le cœur du système.

### 2.10 conflits

**But :** enregistre les conflits détectés entre réservations.

**Champs :**

-   `id_conflit` (PK), `id_reservation_1`, `id_reservation_2` (FK), `type_conflit` (salle, enseignant, groupe, multiple), `description`, `date_detection`, `resolu`, `date_resolution`, `resolu_par`

**Relations :**

-   `id_reservation_1` / `id_reservation_2` → `reservations.id_reservation`
-   `resolu_par` → `users.id_user`

**Remarque :** Sert d'historique pour la détection et résolution automatique ou manuelle des chevauchements.

### 2.11 disponibilites_enseignants

**But :** gère les disponibilités hebdomadaires des enseignants.

**Champs :**

-   `id_disponibilite` (PK), `id_enseignant`, `id_creneau`, `disponible`, `raison_indisponibilite`, `date_debut`, `date_fin`

**Contrainte :** UNIQUE (`id_enseignant`, `id_creneau`, `date_debut`) pour éviter la redondance.

**Relations :**

-   `id_enseignant` → `enseignants.id_enseignant`
-   `id_creneau` → `creneaux.id_creneau`

### 2.12 notifications

**But :** messages et alertes destinés aux utilisateurs.

**Champs :**

-   `id_notification` (PK), `id_user` (FK), `titre`, `message`, `type_notification`, `lue`, `date_envoi`

**Relations :**

-   `id_user` → `users.id_user`

**Types possibles :** modification, annulation, nouveau_cours, conflit, rappel.

## 🔗 3. Relations et intégrité référentielle

| Relation                                                                 | Type | Détails                                                     |
| ------------------------------------------------------------------------ | ---- | ----------------------------------------------------------- |
| `users` ↔ `enseignants`                                                  | 1–1  | Un enseignant est un utilisateur                            |
| `users` ↔ `etudiants`                                                    | 1–1  | Un étudiant est un utilisateur                              |
| `filieres` ↔ `groupes`                                                   | 1–N  | Une filière contient plusieurs groupes                      |
| `filieres` ↔ `cours`                                                     | 1–N  | Une filière propose plusieurs cours                         |
| `groupes` ↔ `etudiants`                                                  | 1–N  | Un groupe regroupe plusieurs étudiants                      |
| `cours`, `enseignants`, `salles`, `groupes`, `creneaux` ↔ `reservations` | 1–N  | Chaque entité peut être reliée à plusieurs réservations     |
| `reservations` ↔ `conflits`                                              | 1–N  | Une réservation peut être impliquée dans plusieurs conflits |
| `enseignants` ↔ `disponibilites_enseignants`                             | 1–N  | Un enseignant peut avoir plusieurs créneaux définis         |
| `users` ↔ `notifications`                                                | 1–N  | Un utilisateur peut recevoir plusieurs notifications        |

## ⚙️ 4. Contraintes et intégrité

### 4.1 Types de clés

-   **PK (Primary Key)** : identifiant unique pour chaque table
-   **FK (Foreign Key)** : assure la cohérence des liens entre les tables
-   **UK (Unique Key)** : garantit l'unicité sur certains attributs (`email`, `code_filiere`, `nom_salle`, etc.)

### 4.2 Contraintes métier

-   Un étudiant appartient toujours à un seul groupe
-   Une réservation doit obligatoirement être liée à un cours, un enseignant, un groupe, une salle et un créneau
-   Pas de chevauchement de réservation pour la même salle / enseignant / groupe au même créneau
-   Les disponibilités enseignants doivent être respectées lors de la création d'une réservation

## 🔍 5. Logique métier et automatisation

### 5.1 ✅ Détection automatique de conflits

Implémentée via triggers SQL ou vérifications dans le backend Express/Sequelize :

1. Lorsqu'une nouvelle réservation est créée ou modifiée
2. Le système recherche d'autres réservations au même créneau/date
3. Si un conflit est détecté :
    - Enregistrement dans `conflits`
    - Notification envoyée via la table `notifications`

### 5.2 📅 Disponibilités

-   Les enseignants peuvent définir leurs créneaux disponibles ou non disponibles
-   Le système empêche la création d'une réservation si `disponible = false` sur cette plage horaire

## 🧠 6. Passage du MLD au MPD (implémentation physique)

### 6.1 Script SQL

Le MLD est directement convertible en script SQL :

```sql
CREATE TABLE users (...);
CREATE TABLE enseignants (...);
CREATE TABLE etudiants (...);
...
```

### 6.2 Modèles Sequelize

Avec Sequelize, chaque table correspondra à un modèle JS :

```javascript
const User = sequelize.define('User', { ... });
const Enseignant = sequelize.define('Enseignant', { ... });
User.hasOne(Enseignant, { foreignKey: 'id_enseignant' });
```

**Remarque :** Le MLD facilite donc la génération automatique du schéma avec les relations bien définies.

## 🧾 7. Résumé synthétique

Le **MLD HESTIM Planning** traduit le MCD en structures SQL prêtes à l'emploi pour MySQL.

Il comprend **12 tables interconnectées** centrées autour de `reservations`.

Chaque entité joue un rôle précis :

-   **Gestion des utilisateurs** : `users`, `enseignants`, `etudiants`
-   **Structure académique** : `filieres`, `groupes`, `cours`
-   **Logistique** : `salles`, `creneaux`
-   **Fonctionnalités avancées** : `conflits`, `disponibilites_enseignants`, `notifications`

L'ensemble garantit la cohérence, la traçabilité et la flexibilité d'un système complet de gestion de planning universitaire.
