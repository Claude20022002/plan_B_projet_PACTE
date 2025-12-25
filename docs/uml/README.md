# 📘 Modélisation UML du Projet HESTIM Planning

## 🏫 Projet : Plateforme Web Intelligente — HESTIM Planning

**Objectif :** Optimisation de la planification des cours, des réservations de salles et de la synchronisation des emplois du temps (enseignants / étudiants).

## 🔶 1. Introduction à la Modélisation UML

La modélisation **UML (Unified Modeling Language)** permet de représenter la structure et le comportement du système avant son implémentation.

Elle facilite :

-   La compréhension des besoins
-   La conception de l'architecture logicielle
-   La communication entre les membres de l'équipe (développeurs, encadrants, administrateurs)

Dans ce projet, UML a été utilisé pour modéliser les interactions, les classes métier, les processus de réservation et le cycle de vie des réservations.

## 🧩 2. Diagramme de Cas d'Utilisation

![Diagramme de Cas d'Utilisation](diagramme_cas_usage.png)

### 🎯 Rôle

Ce diagramme montre les fonctionnalités principales offertes par la plateforme ainsi que les acteurs qui interagissent avec le système :

-   **Administrateur**
-   **Enseignant**
-   **Étudiant**

### 🧠 Description

Il regroupe les cas d'usage par domaine :

-   **Gestion des données** : utilisateurs, salles, cours, groupes
-   **Réservation** : création, modification, annulation, recherche
-   **Planification** : détection et résolution des conflits, planification automatique
-   **Consultation** : affichage et exportation des emplois du temps
-   **Disponibilités** : définition et consultation des disponibilités des enseignants
-   **Notifications** : réception et consultation des alertes
-   **Statistiques** : taux d'occupation et génération de rapports

Les relations **include**, **extend** et les généralisations montrent la réutilisation fonctionnelle :

-   Créer une réservation **inclut** Détecter les conflits
-   Modifier et Annuler **héritent** de Créer une réservation

### 💡 Intérêt

Ce diagramme aide à identifier toutes les interactions utilisateur-système, à définir le périmètre fonctionnel et à préparer la phase de conception des interfaces.

## 🧱 3. Diagramme de Classes

![Diagramme de Classes](diagramme_classes.png)

### 🎯 Rôle

Ce diagramme structure les entités métier de l'application et leurs relations. Il traduit les concepts du MLD/MCD en classes orientées objet qui seront utilisées dans le backend (via Sequelize + Express).

### 🧠 Description

**Principales classes :**

-   **User** (classe mère) : gère l'authentification et les rôles (admin, enseignant, étudiant)
-   **Enseignant** et **Étudiant** héritent de User
-   **Filiere**, **Groupe**, **Cours**, **Salle**, **Creneau** définissent la structure académique
-   **Reservation** : classe centrale reliant les 5 entités principales
-   **Conflit**, **DisponibiliteEnseignant**, **Notification** assurent la gestion avancée du système

Les méthodes ajoutées (`verifierConflits()`, `notifierParticipants()`, etc.) modélisent les comportements applicatifs.

### 💡 Intérêt

Ce diagramme est essentiel pour :

-   Construire le modèle de données Sequelize
-   Générer les relations (`hasMany`, `belongsTo`...)
-   Organiser le code backend (controllers, services, etc.)

## 🔄 4. Diagramme de Séquence — Création d'une Réservation

![Diagramme de Séquence](diagramme_sequence.png)

### 🎯 Rôle

Ce diagramme illustre le scénario dynamique de création d'une réservation depuis l'interface jusqu'à la base de données.

### 🧠 Étapes clés

1. L'administrateur remplit et valide le formulaire React (Formik + Yup)
2. L'API Express reçoit la requête et vérifie le token JWT (middleware Auth)
3. Le controller envoie la demande au service de détection de conflits
4. Le **ConflictService** interroge la base MySQL pour vérifier :
    - Disponibilité de la salle
    - Disponibilité de l'enseignant
    - Disponibilité du groupe
5. **En cas de conflit** → erreur 409 affichée
6. **Sinon :**
    - Insertion en base (`reservations`, `notifications`)
    - Envoi d'emails et mise à jour du calendrier

### 💡 Intérêt

Ce diagramme met en évidence :

-   Les interactions entre couches (frontend, API, services, BDD)
-   La séquence logique d'une opération complète
-   Les mécanismes de validation et de notification

## ⚙️ 5. Diagramme d'Activité — Détection et Résolution de Conflits

![Diagramme d'Activité](diagramme_activite.png)

### 🎯 Rôle

Ce diagramme décrit le processus décisionnel et automatisé lors de la détection d'un conflit de réservation.

### 🧠 Description

**Les étapes principales :**

1. Validation des données saisies par l'administrateur
2. Vérification parallèle de la disponibilité :
    - Salle
    - Enseignant
    - Groupe
3. **Si un conflit est détecté :**
    - Création d'une entrée dans la table `conflits`
    - Notification de l'administrateur
    - Possibilité de modifier, forcer ou annuler la réservation
4. **En absence de conflit :**
    - Vérification de la capacité de la salle
    - Création de la réservation et notifications associées

### 💡 Intérêt

Ce diagramme montre :

-   Le flux de contrôle conditionnel du système
-   La gestion des exceptions
-   La logique métier de la planification et de la résolution des conflits

## 🔁 6. Diagramme d'État — Cycle de Vie d'une Réservation

![Diagramme d'État](diagramme_etat.png)

### 🎯 Rôle

Ce diagramme représente le cycle de vie complet d'une réservation, depuis sa création jusqu'à son archivage.

### 🧠 Description

**États principaux :**

-   **Brouillon** → saisie et validation initiale
-   **En attente** → vérification des conflits ou approbation
-   **Confirmée** → active et visible dans l'emploi du temps
-   **Modifiée**, **Reportée** → changement nécessitant revalidation
-   **Annulée** → suppression ou désactivation
-   **Terminée** / **Archivée** → séance passée, conservée pour l'historique

**Les transitions modélisent :**

-   Les actions de l'administrateur (valider, modifier, annuler)
-   Les résultats du moteur de planification (détection, validation, résolution)

### 💡 Intérêt

Ce diagramme est indispensable pour :

-   Gérer les statuts dynamiques dans la base de données (`statut` ENUM)
-   Piloter les notifications et les affichages selon l'état de la réservation
-   Garantir la cohérence du cycle de vie d'un enregistrement

## 🧠 7. Synthèse et Cohérence Globale

| Diagramme         | Type           | Objectif Principal                                  |
| ----------------- | -------------- | --------------------------------------------------- |
| Cas d'utilisation | Fonctionnel    | Définir les besoins utilisateurs                    |
| Classes           | Structurel     | Concevoir le modèle de données et les objets métier |
| Séquence          | Dynamique      | Décrire les échanges entre composants               |
| Activité          | Comportemental | Montrer la logique interne d'un processus           |
| État              | Dynamique      | Suivre l'évolution d'un objet dans le temps         |

### 💬 Complémentarité

-   Les **cas d'utilisation** définissent les fonctionnalités à implémenter
-   Le **diagramme de classes** traduit ces fonctionnalités en objets concrets
-   Les **diagrammes de séquence et d'activité** illustrent leur exécution
-   Le **diagramme d'état** assure le suivi cohérent du cycle de vie

Ensemble, ces diagrammes forment la base conceptuelle solide du système HESTIM Planning, garantissant une architecture claire, évolutive et maintenable.

## 🧾 8. Auteurs et Collaboration

### 👨‍💻 Équipe de projet (4 membres)

Projet réalisé dans le cadre du **PACTE 3A IIIA – HESTIM Casablanca**  
Sous la supervision du corps enseignant.

### 📂 Répertoire UML

```
HESTIM-Planning/
│
├── backend/
├── frontend/
├── docs/
│   ├── uml/
│   │   ├── diagramme_cas_usage.png
│   │   ├── diagramme_classes.png
│   │   ├── diagramme_sequence.png
│   │   ├── diagramme_activite.png
│   │   └── diagramme_etat.png
│   └── README.md
└── README.md
```
