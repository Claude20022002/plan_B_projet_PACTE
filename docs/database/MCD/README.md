# 📊 Modèle Conceptuel de Données (MCD) - HESTIM Planning

## 📋 Table des Matières

-   [Vue d'Ensemble](#-vue-densemble)
-   [Qu'est-ce qu'un MCD ?](#-quest-ce-quun-mcd-)
-   [Diagramme MCD](#-diagramme-mcd)
-   [Entités du Système](#-entités-du-système)
-   [Associations](#-associations)
-   [Règles de Gestion](#-règles-de-gestion)
-   [Notation et Légende](#notation-et-légende)
-   [Passage au MLD](#passage-au-mld)
-   [Ressources](#ressources)

---

## 🎯 Vue d'Ensemble

Le Modèle Conceptuel de Données (MCD) de la plateforme HESTIM Planning représente de manière abstraite et indépendante de toute technologie la structure des données du système. Il met l'accent sur **ce que le système doit gérer** plutôt que **comment il le fait**.

### Objectifs du MCD

-   🎓 Modéliser le domaine métier de la gestion académique
-   📐 Identifier les entités principales et leurs propriétés
-   🔗 Définir les relations entre les entités
-   ✅ Valider la cohérence avec les besoins fonctionnels
-   🗣️ Faciliter la communication entre équipe technique et métier

### Caractéristiques Principales

| Aspect                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| **Entités**              | 12 entités principales                         |
| **Associations**         | 10 associations métier                         |
| **Héritage**             | Pattern Single Table Inheritance (User)        |
| **Notation**             | UML avec extensions MCD (bulles d'association) |
| **Niveau d'abstraction** | Conceptuel (pas de types SQL)                  |

---

## 📚 Qu'est-ce qu'un MCD ?

### Définition

Le Modèle Conceptuel de Données est une représentation abstraite et normalisée des données d'un système d'information. Il se concentre sur la **sémantique métier** sans considération technique.

### Différences MCD vs MLD

| Aspect               | MCD (Conceptuel)    | MLD (Logique)             |
| -------------------- | ------------------- | ------------------------- |
| **Objectif**         | Modéliser le métier | Préparer l'implémentation |
| **Clés étrangères**  | ❌ Absentes         | ✅ Présentes              |
| **Types de données** | ❌ Absents          | ✅ SQL (VARCHAR, INT...)  |
| **Associations**     | ✅ Bulles/Liens     | ✅ Traduites en FK        |
| **Notation**         | UML/Merise          | Diagramme relationnel     |
| **Public**           | Métier + Technique  | Technique uniquement      |

### Pourquoi PAS de Clés Étrangères dans le MCD ?

Les clés étrangères (FK) sont des détails d'implémentation qui n'ont pas leur place au niveau conceptuel :

**❌ MAUVAISE PRATIQUE (MCD avec FK) :**

```
┌──────────────┐
│  Etudiant    │
├──────────────┤
│ id_etudiant  │
│ id_groupe ←FK│  ← FK n'a pas sa place ici !
│ niveau       │
└──────────────┘
```

**✅ BONNE PRATIQUE (MCD sans FK) :**

```
┌──────────────┐                Association
│  Etudiant    │                APPARTENIR
├──────────────┤     ───────────→  Groupe
│ id_etudiant  │         1,1     1,n
│ niveau       │
└──────────────┘
```

Les FK apparaîtront dans le MLD lors de la traduction.

---

## 📊 Diagramme MCD

![Diagramme MCD](MCD.png)

### Vue Simplifiée

```
                     ┌─────────────┐
                     │    USER     │
                     │ (Utilisateur)│
                     └──────┬──────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │ ENSEIGNANT  │        │  ETUDIANT   │
         └─────────────┘        └──────┬──────┘
                │                      │
                │                      │ APPARTENIR
                │                      ▼
                │               ┌─────────────┐
                │               │   GROUPE    │
                │               └──────┬──────┘
                │                      │ CONTENIR
                │                      │
         ┌──────▼──────┐        ┌──────▼──────┐
         │ DISPONIBILITÉ│       │   FILIERE   │
         └─────────────┘        └──────┬──────┘
                                       │ PROPOSER
                                       ▼
                                ┌─────────────┐
                                │    COURS    │
                                └──────┬──────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │                             │
                 ┌──────▼──────┐              ┌──────▼──────┐
                 │ RESERVATION │──CONFLIT──→  │   CONFLIT   │
                 └──────┬──────┘              └─────────────┘
                        │
                 ┌──────┴──────┐
                 │ HISTORIQUE  │
                 └─────────────┘
```

---

## 🏢 Entités du Système

### 1. USER (Utilisateur) 👤

**Description** : Entité racine représentant tous les utilisateurs du système.

**Attributs** :

-   `id_user` : Identifiant unique (clé technique)
-   `nom` : Nom de famille
-   `prenom` : Prénom
-   `email` : Adresse email (clé métier unique)
-   `password_hash` : Mot de passe hashé
-   `role` : Type d'utilisateur (admin, enseignant, etudiant)
-   `telephone` : Numéro de téléphone
-   `actif` : Compte actif/désactivé
-   `avatar_url` : URL de la photo de profil

**Rôle dans le système** :

-   Base commune pour tous les utilisateurs
-   Gestion de l'authentification
-   Point central pour les notifications

**Particularités** :

-   Pattern Single Table Inheritance
-   `email` = identifiant unique de connexion
-   `role` détermine les permissions

---

### 2. ENSEIGNANT 👨‍🏫

**Description** : Spécialisation de User pour les enseignants.

**Attributs supplémentaires** :

-   `specialite` : Domaine d'expertise
-   `departement` : Département d'affectation
-   `grade` : Grade académique (Professeur, Maître-Assistant, etc.)
-   `bureau` : Numéro de bureau

**Rôle dans le système** :

-   Enseigne des cours
-   Définit ses disponibilités
-   Crée des réservations

**Relations** :

-   EST UN User (héritage)
-   ENSEIGNE plusieurs Reservation
-   A plusieurs DISPONIBILITE

---

### 3. ETUDIANT 👨‍🎓

**Description** : Spécialisation de User pour les étudiants.

**Attributs supplémentaires** :

-   `numero_etudiant` : Matricule unique
-   `niveau` : Année d'études (1A, 2A, 3A, 4A, 5A)
-   `date_inscription` : Date d'inscription

**Rôle dans le système** :

-   Appartient à un groupe (classe)
-   Consulte son emploi du temps
-   Reçoit des notifications

**Relations** :

-   EST UN User (héritage)
-   APPARTIENT À un Groupe (obligatoire, 1,1)

**Note importante** :

L'association APPARTENIR traduit le fait qu'un étudiant est rattaché à une classe. Dans le MLD, cela se matérialisera par un attribut `id_groupe` (FK) dans la table `etudiants`.

---

### 4. FILIERE 🎓

**Description** : Programme d'études proposé par l'école.

**Attributs** :

-   `id_filiere` : Identifiant unique
-   `code_filiere` : Code abrégé (ex: IIIA, GC)
-   `nom_filiere` : Nom complet
-   `description` : Description détaillée

**Rôle dans le système** :

-   Structure l'organisation académique
-   Regroupe les groupes (classes)
-   Propose des cours

**Relations** :

-   CONTIENT plusieurs Groupe (1,n)
-   PROPOSE plusieurs Cours (1,n)

**Exemples** :

```
Filière "IIIA" (Ingénierie Informatique et IA)
├── Contient : Groupe "3A-IIIA-G1", "3A-IIIA-G2", "4A-IIIA-G1"
└── Propose : Cours "IA301", "BDA302", "WEB303"
```

---

### 5. GROUPE (Classe) 👥

**Description** : Classe ou promotion d'étudiants.

**Attributs** :

-   `id_groupe` : Identifiant unique
-   `nom_groupe` : Nom de la classe (ex: 3A-IIIA-G1)
-   `niveau` : Année (1A à 5A)
-   `effectif` : Nombre d'étudiants
-   `annee_scolaire` : Année scolaire (ex: 2025-2026)

**Rôle dans le système** :

-   Regroupe les étudiants d'une même promotion
-   Unité de base pour la planification
-   Assiste collectivement aux cours

**Relations** :

-   EST CONTENU DANS une Filiere (1,1)
-   CONTIENT plusieurs Etudiant (1,n)
-   ASSISTE À plusieurs Reservation (0,n)

**Règle métier** :

Un groupe doit avoir au moins 1 étudiant (1,n). Si vous souhaitez permettre des groupes vides temporairement, la cardinalité peut être changée en (0,n).

---

### 6. SALLE 🏢

**Description** : Ressource matérielle pour l'enseignement.

**Attributs** :

-   `id_salle` : Identifiant unique
-   `nom_salle` : Nom/code de la salle (ex: A101, Lab Info 2)
-   `type_salle` : Type (amphi, informatique, standard, labo, atelier)
-   `capacite` : Nombre de places
-   `batiment` : Bâtiment
-   `etage` : Étage
-   `equipements` : Liste des équipements disponibles
-   `disponible` : Salle en service ou non

**Rôle dans le système** :

-   Ressource centrale de la planification
-   Contrainte de capacité pour les réservations
-   Détection de conflits d'occupation

**Relations** :

-   SE DÉROULE DANS plusieurs Reservation (0,n)

**Contraintes métier** :

-   `capacite ≥ effectif` du groupe pour une réservation
-   `type_salle` compatible avec `type_cours` (ex: TP informatique → salle informatique)

---

### 7. COURS 📚

**Description** : Module d'enseignement.

**Attributs** :

-   `id_cours` : Identifiant unique
-   `code_cours` : Code du cours (ex: IA301)
-   `nom_cours` : Nom complet (ex: Intelligence Artificielle)
-   `niveau` : Année concernée
-   `volume_horaire` : Nombre d'heures total
-   `type_cours` : Type (CM, TD, TP, Projet)
-   `semestre` : Semestre (S1, S2)
-   `coefficient` : Coefficient du cours

**Rôle dans le système** :

-   Unité pédagogique à planifier
-   Lien entre enseignement et emploi du temps

**Relations** :

-   EST PROPOSÉ PAR une Filiere (1,1)
-   FAIT L'OBJET DE plusieurs Reservation (0,n)

---

### 8. CRENEAU ⏰

**Description** : Plage horaire standardisée.

**Attributs** :

-   `id_creneau` : Identifiant unique
-   `jour_semaine` : Jour (Lundi, Mardi, etc.)
-   `heure_debut` : Heure de début (ex: 08:30)
-   `heure_fin` : Heure de fin (ex: 10:30)
-   `periode` : Période (matin, après-midi, soir)
-   `duree_minutes` : Durée en minutes

**Rôle dans le système** :

-   Définit les plages horaires disponibles
-   Réutilisable chaque semaine
-   Base pour la détection de conflits

**Relations** :

-   UTILISÉ DANS plusieurs Reservation (0,n)
-   CONCERNÉ PAR plusieurs DISPONIBILITE (0,n)

**Exemples** :

-   Lundi 08:30-10:30 (matin, 120 minutes)
-   Lundi 10:45-12:45 (matin, 120 minutes)
-   Lundi 14:00-16:00 (après-midi, 120 minutes)

---

### 9. RESERVATION 📅

**Description** : Entité centrale représentant une séance de cours planifiée.

**Attributs** :

-   `id_reservation` : Identifiant unique
-   `date_seance` : Date de la séance
-   `statut` : État de la réservation (confirmee, en_attente, annulee, reportee)
-   `commentaire` : Notes ou remarques

**Rôle dans le système** :

-   Table centrale du système
-   Résultat de l'association 5-aire RESERVER
-   Point de convergence de tous les éléments d'une séance

**Relations** :

-   GÉNÉRÉE PAR l'association RESERVER (5-aire)
-   CRÉÉE PAR un User (0,n)
-   PEUT GÉNÉRER des Conflit (0,n)
-   EST HISTORISÉE dans HistoriqueReservation (0,n)

**Particularité** :

La réservation est le résultat d'une association 5-aire (quinaire) qui relie :

1. **1 Cours**
2. **1 Enseignant**
3. **1 Salle**
4. **1 Groupe**
5. **1 Créneau**

Dans le MLD, ces liens se traduiront par 5 clés étrangères.

---

### 10. CONFLIT ⚠️

**Description** : Détection de chevauchements entre réservations.

**Attributs** :

-   `id_conflit` : Identifiant unique
-   `type_conflit` : Type (salle, enseignant, groupe, multiple)
-   `description` : Détails du conflit
-   `date_detection` : Date de détection
-   `resolu` : Conflit résolu (booléen)
-   `date_resolution` : Date de résolution

**Rôle dans le système** :

-   Détection automatique via trigger SQL
-   Alertes pour l'administrateur
-   Traçabilité des problèmes de planification

**Relations** :

-   GÉNÉRÉ PAR l'association CONFLIT_ENTRE (réflexive sur Reservation)
-   RÉSOLU PAR un User (0,1)

**Types de conflits** :

1. **Conflit de SALLE** :

    - Même salle + même date + même créneau

2. **Conflit d'ENSEIGNANT** :

    - Même enseignant + même date + même créneau

3. **Conflit de GROUPE** :

    - Même groupe + même date + même créneau

4. **Conflit MULTIPLE** :
    - Combinaison de plusieurs types

---

### 11. NOTIFICATION 🔔

**Description** : Messages système envoyés aux utilisateurs.

**Attributs** :

-   `id_notification` : Identifiant unique
-   `titre` : Titre court
-   `message` : Contenu du message
-   `type_notification` : Type (modification, annulation, nouveau_cours, conflit, rappel)
-   `lue` : Message lu (booléen)
-   `date_envoi` : Date/heure d'envoi

**Rôle dans le système** :

-   Communication automatique avec les utilisateurs
-   Alertes temps réel
-   Historique des notifications

**Relations** :

-   REÇUE PAR un User (1,1)

**Déclencheurs** :

-   Création d'une réservation
-   Modification d'emploi du temps
-   Annulation de cours
-   Détection de conflit
-   Rappels automatiques

---

### 12. HISTORIQUE_RESERVATION 📝

**Description** : Traçabilité complète des modifications sur les réservations.

**Attributs** :

-   `id_historique` : Identifiant unique
-   `action` : Type d'action (creation, modification, suppression)
-   `date_action` : Date/heure de l'action
-   `anciens_donnees` : État avant modification
-   `nouveaux_donnees` : État après modification
-   `commentaire_action` : Raison/contexte de l'action

**Rôle dans le système** :

-   Audit trail complet
-   Traçabilité des modifications
-   Conformité réglementaire
-   Analyse et reporting

**Relations** :

-   HISTORISE une Reservation (1,1)
-   MODIFIÉE PAR un User (0,1)

**Utilité** :

Permet de répondre aux questions :

-   Qui a modifié cette réservation ?
-   Quand a-t-elle été annulée ?
-   Quelles étaient les données avant modification ?
-   Pourquoi ce changement a-t-il été fait ?

---

## 🔗 Associations

### 1. EST UN (Héritage)

**Type** : Relation d'héritage (IS-A)

**Notation** :

```
User <|-- Enseignant
User <|-- Etudiant
```

**Signification** :

-   Enseignant EST UN User
-   Etudiant EST UN User
-   Héritage des attributs et relations

**Traduction en MLD** :

```sql
-- Table enseignants
id_enseignant INT PRIMARY KEY
FOREIGN KEY (id_enseignant) REFERENCES users(id_user)

-- Table etudiants
id_etudiant INT PRIMARY KEY
FOREIGN KEY (id_etudiant) REFERENCES users(id_user)
```

---

### 2. APPARTENIR

**Entités liées** : Etudiant → Groupe

**Cardinalités** : 1,1 (Etudiant) → 1,n (Groupe)

**Lecture** :

-   Un Étudiant APPARTIENT À un et un seul Groupe (obligatoire)
-   Un Groupe CONTIENT au moins un Étudiant (1 à plusieurs)

**Signification métier** :

Chaque étudiant est rattaché à une classe (son groupe). Cette association est obligatoire et permanente pour la durée de l'année scolaire.

**Traduction en MLD** :

```sql
-- La table etudiants aura :
id_groupe INT NOT NULL
FOREIGN KEY (id_groupe) REFERENCES groupes(id_groupe)
```

---

### 3. CONTENIR

**Entités liées** : Filiere → Groupe

**Cardinalités** : 1,1 (Filiere) → 1,n (Groupe)

**Lecture** :

-   Une Filière CONTIENT au moins un Groupe
-   Un Groupe EST CONTENU DANS une et une seule Filière

**Signification métier** :

Organisation hiérarchique : une filière regroupe plusieurs classes.

**Exemple** :

```
Filière "IIIA"
├── 3A-IIIA-G1 (35 étudiants)
├── 3A-IIIA-G2 (32 étudiants)
└── 4A-IIIA-G1 (30 étudiants)
```

---

### 4. PROPOSER

**Entités liées** : Filiere → Cours

**Cardinalités** : 1,1 (Filiere) → 1,n (Cours)

**Lecture** :

-   Une Filière PROPOSE au moins un Cours
-   Un Cours EST PROPOSÉ PAR une et une seule Filière

**Signification métier** :

Chaque cours appartient à un programme d'études spécifique.

---

### 5. RESERVER (Association 5-aire) ⭐

**Type** : Association n-aire (quintuplée)

**Entités liées** :

-   Cours (0,n)
-   Enseignant (0,n)
-   Salle (0,n)
-   Groupe (0,n)
-   Créneau (0,n)

**Génère** : Reservation (1,1)

**Signification** :

Une réservation est la combinaison de 5 éléments :

-   **QUEL** cours ?
-   **QUI** enseigne ?
-   **OÙ** (quelle salle) ?
-   **À QUI** (quel groupe) ?
-   **QUAND** (quel créneau) ?

**Particularité** :

Les attributs métier (`date_seance`, `statut`, `commentaire`) sont portés par l'entité Reservation et non par l'association RESERVER.

**Traduction en MLD** :

```sql
CREATE TABLE reservations (
    id_reservation INT PRIMARY KEY,
    id_cours INT NOT NULL,       -- FK 1
    id_enseignant INT NOT NULL,  -- FK 2
    id_salle INT NOT NULL,       -- FK 3
    id_groupe INT NOT NULL,      -- FK 4
    id_creneau INT NOT NULL,     -- FK 5
    date_seance DATE,
    statut ENUM(...),
    commentaire TEXT
);
```

---

### 6. CREER

**Entités liées** : User → Reservation

**Cardinalités** : 1,1 (User) → 0,n (Reservation)

**Lecture** :

-   Un User CRÉE zéro à plusieurs Réservations
-   Une Réservation EST CRÉÉE PAR un et un seul User

**Signification métier** :

Traçabilité : qui a créé la réservation (généralement un admin ou un enseignant).

---

### 7. CONFLIT_ENTRE (Association réflexive)

**Type** : Association réflexive sur Reservation

**Cardinalités** : 0,n (Reservation1) ↔ 0,n (Reservation2)

**Génère** : Conflit (0,n)

**Signification** :

Deux réservations peuvent entrer en conflit si elles partagent une ressource commune au même moment (salle, enseignant ou groupe).

**Exemple** :

```
Conflit détecté :
- Réservation 1 : IA301, Prof. Alami, Salle A101, 3A-IIIA-G1, Lundi 08:30
- Réservation 2 : BDA302, Prof. Benani, Salle A101, 3A-IIIA-G2, Lundi 08:30
                                           └─────┘
                                        Même salle !
```

---

### 8. RESOUDRE

**Entités liées** : User → Conflit

**Cardinalités** : 0,1 (User) → 0,n (Conflit)

**Lecture** :

-   Un User RÉSOUT zéro à plusieurs Conflits
-   Un Conflit EST RÉSOLU PAR zéro ou un User (peut rester non résolu)

**Signification métier** :

Traçabilité de la résolution des conflits (généralement un administrateur).

---

### 9. DISPONIBILITE (Association avec attributs)

**Type** : Association binaire avec attributs

**Entités liées** : Enseignant ↔ Creneau

**Cardinalités** : 1,1 (Enseignant) → 0,n (Creneau)

**Attributs de l'association** :

-   `disponible` : Enseignant disponible ou non
-   `raison_indisponibilite` : Motif si indisponible
-   `date_debut` : Début de la période
-   `date_fin` : Fin de la période

**Signification** :

Gestion des contraintes de disponibilité des enseignants (congés, réunions, etc.).

**Exemple** :

```
Prof. Alami :
- Lundi 08:30-10:30 : Disponible
- Lundi 10:45-12:45 : Indisponible (raison : "Réunion pédagogique")
- Mardi 08:30-10:30 : Disponible
```

**Traduction en MLD** :

```sql
CREATE TABLE disponibilites_enseignants (
    id_disponibilite INT PRIMARY KEY,
    id_enseignant INT NOT NULL,
    id_creneau INT NOT NULL,
    disponible BOOLEAN,
    raison_indisponibilite VARCHAR(255),
    date_debut DATE,
    date_fin DATE
);
```

---

### 10. RECEVOIR

**Entités liées** : User → Notification

**Cardinalités** : 1,1 (User) → 0,n (Notification)

**Lecture** :

-   Un User REÇOIT zéro à plusieurs Notifications
-   Une Notification EST REÇUE PAR un et un seul User

---

### 11. HISTORISER

**Entités liées** : Reservation → HistoriqueReservation + User

**Cardinalités** :

-   1,1 (Reservation) → 0,n (Historique)
-   0,1 (User) → 0,n (Historique)

**Signification** :

Chaque action sur une réservation génère une entrée dans l'historique, avec traçabilité de l'auteur de l'action.

---

## 📐 Règles de Gestion

### Règles d'Intégrité

| #        | Règle                                                                                            | Entité/Association |
| -------- | ------------------------------------------------------------------------------------------------ | ------------------ |
| **RG1**  | Un étudiant appartient à un et un seul groupe                                                    | APPARTENIR         |
| **RG2**  | Un groupe contient au moins un étudiant                                                          | APPARTENIR         |
| **RG3**  | Une filière propose au moins un cours                                                            | PROPOSER           |
| **RG4**  | Un cours est proposé par une seule filière                                                       | PROPOSER           |
| **RG5**  | Une réservation est unique pour la combinaison (cours, enseignant, salle, groupe, créneau, date) | RESERVER           |
| **RG6**  | Une salle ne peut avoir qu'une seule réservation active par créneau et par date                  | Reservation        |
| **RG7**  | Un enseignant ne peut avoir qu'une seule réservation par créneau et par date                     | Reservation        |
| **RG8**  | Un groupe ne peut avoir qu'une seule réservation par créneau et par date                         | Reservation        |
| **RG9**  | La capacité de la salle doit être ≥ effectif du groupe                                           | Salle, Groupe      |
| **RG10** | Un conflit implique exactement deux réservations                                                 | CONFLIT_ENTRE      |

### Règles Métier

#### Gestion des Utilisateurs

-   **RG-U1** : Un email ne peut être utilisé que par un seul utilisateur
-   **RG-U2** : Un utilisateur peut être soit admin, soit enseignant, soit étudiant (rôle unique)
-   **RG-U3** : Un compte désactivé (`actif = false`) ne peut pas se connecter

#### Gestion des Réservations

-   **RG-R1** : Une réservation ne peut être créée que par un admin ou un enseignant
-   **RG-R2** : Une réservation confirmée ne peut être modifiée que par un admin
-   **RG-R3** : L'annulation d'une réservation génère automatiquement des notifications
-   **RG-R4** : Toute modification de réservation est tracée dans l'historique

#### Gestion des Conflits

-   **RG-C1** : Un conflit est détecté automatiquement à la création d'une réservation
-   **RG-C2** : Un conflit non résolu bloque la confirmation de la réservation
-   **RG-C3** : Seul un admin peut marquer un conflit comme résolu

#### Gestion des Disponibilités

-   **RG-D1** : Un enseignant indisponible ne peut pas avoir de réservation sur ce créneau
-   **RG-D2** : La disponibilité est définie par période (`date_debut → date_fin`)

---

## Notation et Légende

_Section à compléter selon les conventions de notation utilisées dans le diagramme._

---

## Passage au MLD

_Section à compléter avec les détails de la traduction du MCD vers le MLD._

---

## Ressources

_Section à compléter avec les liens et références utiles._
