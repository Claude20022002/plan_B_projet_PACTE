# 🧠 HESTIM Planner – Backend (Node.js + Express)

## 📋 Description

Ce dossier contient la partie **backend** du projet **HESTIM Planner**, une plateforme web intelligente de planification et réservation de salles pour l'école HESTIM.

L'API permet :

-   la planification automatique des cours
-   la gestion des salles et des réservations
-   la synchronisation des emplois du temps enseignants/étudiants
-   la détection automatique des conflits d'horaires
-   la gestion des utilisateurs (admin, enseignants, étudiants)
-   le système de notifications en temps réel
-   l'historique des modifications d'affectations

---

## 💾 Prérequis

-   Node.js (v16 ou supérieur recommandé)
-   npm ou yarn
-   MySQL (v8+ recommandé, accès à une base de données)
-   Git (pour cloner le dépôt)

---

## 🏗️ Structure du projet

```
/backend
│ ├── config/
│ │ └── db.js # Connexion à MySQL via Sequelize
│ │
│ ├── models/ # Modèles Sequelize (tables MySQL)
│ │ ├── index.js # Initialisation Sequelize et relations
│ │ ├── User.js
│ │ ├── Enseignant.js
│ │ ├── Etudiant.js
│ │ ├── Filiere.js
│ │ ├── Groupe.js
│ │ ├── Salle.js
│ │ ├── Cours.js
│ │ ├── Creneau.js
│ │ ├── Affectation.js
│ │ ├── DemandeReport.js
│ │ ├── Conflit.js
│ │ ├── Notification.js
│ │ ├── HistoriqueAffectation.js
│ │ ├── Disponibilite.js
│ │ ├── ConflitAffectation.js
│ │ └── Appartenir.js
│ │
│ ├── controllers/ # Logique métier
│ │ ├── index.js # Export centralisé
│ │ ├── userController.js
│ │ ├── enseignantController.js
│ │ ├── etudiantController.js
│ │ ├── filiereController.js
│ │ ├── groupeController.js
│ │ ├── salleController.js
│ │ ├── coursController.js
│ │ ├── creneauController.js
│ │ ├── affectationController.js
│ │ ├── demandeReportController.js
│ │ ├── conflitController.js
│ │ ├── notificationController.js
│ │ ├── historiqueAffectationController.js
│ │ ├── disponibiliteController.js
│ │ └── appartenirController.js
│ │
│ ├── routes/ # Routes Express
│ │ ├── userRoutes.js
│ │ ├── enseignantRoutes.js
│ │ ├── etudiantRoutes.js
│ │ ├── filiereRoutes.js
│ │ ├── groupeRoutes.js
│ │ ├── salleRoutes.js
│ │ ├── coursRoutes.js
│ │ ├── creneauRoutes.js
│ │ ├── affectationRoutes.js
│ │ ├── demandeReportRoutes.js
│ │ ├── conflitRoutes.js
│ │ ├── notificationRoutes.js
│ │ ├── historiqueAffectationRoutes.js
│ │ ├── disponibiliteRoutes.js
│ │ └── appartenirRoutes.js
│ │
│ ├── middleware/ # Middlewares
│ │ ├── index.js # Export centralisé
│ │ ├── authMiddleware.js # Authentification JWT
│ │ ├── roleMiddleware.js # Vérification des rôles
│ │ ├── errorHandler.js # Gestion des erreurs
│ │ ├── asyncHandler.js # Wrapper async/await
│ │ ├── validationMiddleware.js # Validation des données
│ │ ├── loggerMiddleware.js # Logging
│ │ ├── notFoundMiddleware.js # Routes 404
│ │ ├── rateLimiterMiddleware.js # Rate limiting
│ │ └── securityMiddleware.js # Sécurité (Helmet)
│ │
│ ├── utils/ # Fonctions utilitaires
│ │ ├── index.js # Export centralisé
│ │ ├── detectConflicts.js # Détection de conflits
│ │ ├── sendEmail.js # Envoi d'emails
│ │ ├── notificationHelper.js # Gestion des notifications
│ │ ├── dateHelper.js # Manipulation des dates
│ │ ├── passwordHelper.js # Gestion des mots de passe
│ │ └── validationHelper.js # Validations supplémentaires
│ │
│ ├── api/ # Documentation API pour le frontend
│ │ ├── README.md # Vue d'ensemble
│ │ ├── EXEMPLES_API.md # Exemples détaillés avec Axios
│ │ ├── FETCH_EXEMPLES.md # Exemples avec Fetch natif
│ │ ├── REFERENCE_RAPIDE.md # Liste rapide des routes
│ │ ├── TYPES.ts # Interfaces TypeScript
│ │ └── POSTMAN_COLLECTION.json # Collection Postman
│ │
│ ├── server.js # Lancement du serveur
│ ├── package.json
│ ├── .env # Variables d'environnement
│ └── README.md
```

---

## 🚀 Installation et démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/claude20022002/Projet_Pacte_3IIIA.git
cd Projet_Pacte_3IIIA/backend
```

### 2. Installer les dépendances

```bash
npm install
```

_ou avec yarn :_

```bash
yarn install
```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine du dossier backend selon l'exemple suivant :

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hestim_planner
DB_DIALECT=mysql
DB_PORT=3306

# JWT
JWT_SECRET=unSecretSuperSecretChangezCeci

# Serveur
PORT=5000
NODE_ENV=development

# Email (optionnel - pour l'envoi d'emails)
EMAIL_SERVICE=gmail
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application
EMAIL_FROM=noreply@hestim.ma

# Ou configuration SMTP générique
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe
```

> 💡 **Remarque :** Changez les valeurs selon votre configuration. En production, utilisez des secrets forts pour `JWT_SECRET`.

### 4. Lancer le serveur

**En développement :**

```bash
npm run dev
```

**En production :**

```bash
npm start
```

Le serveur sera disponible sur `http://localhost:5000` (ou le port spécifié dans votre `.env`).

---

## 📚 Documentation de l'API

### Base URL

```
http://localhost:5000/api
```

### Authentification

La plupart des routes nécessitent une authentification via JWT. Ajoutez le token dans l'en-tête `Authorization` :

```
Authorization: Bearer <votre_token_jwt>
```

### Format des réponses

**Succès (200/201) :**

```json
{
  "id": 1,
  "nom": "Dupont",
  ...
}
```

**Erreur (4xx/5xx) :**

```json
{
    "message": "Description de l'erreur",
    "error": "Détails de l'erreur",
    "errors": [
        {
            "field": "champ",
            "message": "Message d'erreur"
        }
    ]
}
```

---

## 🔌 Endpoints de l'API

### 1. Utilisateurs (`/api/users`)

| Méthode | Route            | Description                     | Authentification | Rôle requis |
| ------- | ---------------- | ------------------------------- | ---------------- | ----------- |
| GET     | `/api/users`     | Récupérer tous les utilisateurs | ✅               | Admin       |
| GET     | `/api/users/:id` | Récupérer un utilisateur par ID | ✅               | Admin       |
| POST    | `/api/users`     | Créer un utilisateur            | ✅               | Admin       |
| PUT     | `/api/users/:id` | Mettre à jour un utilisateur    | ✅               | Admin       |
| DELETE  | `/api/users/:id` | Supprimer un utilisateur        | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@hestim.ma",
    "password_hash": "hash_du_mot_de_passe",
    "role": "enseignant",
    "telephone": "0612345678",
    "actif": true,
    "avatar_url": "https://example.com/avatar.jpg"
}
```

**Rôle valides :** `admin`, `enseignant`, `etudiant`

---

### 2. Enseignants (`/api/enseignants`)

| Méthode | Route                  | Description                    | Authentification | Rôle requis      |
| ------- | ---------------------- | ------------------------------ | ---------------- | ---------------- |
| GET     | `/api/enseignants`     | Récupérer tous les enseignants | ✅               | Admin            |
| GET     | `/api/enseignants/:id` | Récupérer un enseignant par ID | ✅               | Admin/Enseignant |
| POST    | `/api/enseignants`     | Créer un enseignant            | ✅               | Admin            |
| PUT     | `/api/enseignants/:id` | Mettre à jour un enseignant    | ✅               | Admin            |
| DELETE  | `/api/enseignants/:id` | Supprimer un enseignant        | ✅               | Admin            |

**Body pour POST/PUT :**

```json
{
    "id_user": 1,
    "specialite": "Informatique",
    "departement": "Département Informatique",
    "grade": "Professeur",
    "bureau": "Bureau 101"
}
```

---

### 3. Étudiants (`/api/etudiants`)

| Méthode | Route                | Description                  | Authentification | Rôle requis    |
| ------- | -------------------- | ---------------------------- | ---------------- | -------------- |
| GET     | `/api/etudiants`     | Récupérer tous les étudiants | ✅               | Admin          |
| GET     | `/api/etudiants/:id` | Récupérer un étudiant par ID | ✅               | Admin/Étudiant |
| POST    | `/api/etudiants`     | Créer un étudiant            | ✅               | Admin          |
| PUT     | `/api/etudiants/:id` | Mettre à jour un étudiant    | ✅               | Admin          |
| DELETE  | `/api/etudiants/:id` | Supprimer un étudiant        | ✅               | Admin          |

**Body pour POST/PUT :**

```json
{
    "id_user": 2,
    "numero_etudiant": "ETU2024001",
    "niveau": "L3",
    "date_inscription": "2024-09-01"
}
```

---

### 4. Filières (`/api/filieres`)

| Méthode | Route               | Description                   | Authentification | Rôle requis |
| ------- | ------------------- | ----------------------------- | ---------------- | ----------- |
| GET     | `/api/filieres`     | Récupérer toutes les filières | ❌               | -           |
| GET     | `/api/filieres/:id` | Récupérer une filière par ID  | ❌               | -           |
| POST    | `/api/filieres`     | Créer une filière             | ✅               | Admin       |
| PUT     | `/api/filieres/:id` | Mettre à jour une filière     | ✅               | Admin       |
| DELETE  | `/api/filieres/:id` | Supprimer une filière         | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "code_filiere": "INF",
    "nom_filiere": "Informatique",
    "description": "Filière en informatique"
}
```

---

### 5. Groupes (`/api/groupes`)

| Méthode | Route              | Description                | Authentification | Rôle requis |
| ------- | ------------------ | -------------------------- | ---------------- | ----------- |
| GET     | `/api/groupes`     | Récupérer tous les groupes | ❌               | -           |
| GET     | `/api/groupes/:id` | Récupérer un groupe par ID | ❌               | -           |
| POST    | `/api/groupes`     | Créer un groupe            | ✅               | Admin       |
| PUT     | `/api/groupes/:id` | Mettre à jour un groupe    | ✅               | Admin       |
| DELETE  | `/api/groupes/:id` | Supprimer un groupe        | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "nom_groupe": "Groupe A",
    "niveau": "L3",
    "effectif": 30,
    "annee_scolaire": "2024-2025",
    "id_filiere": 1
}
```

---

### 6. Salles (`/api/salles`)

| Méthode | Route                           | Description                      | Authentification | Rôle requis |
| ------- | ------------------------------- | -------------------------------- | ---------------- | ----------- |
| GET     | `/api/salles`                   | Récupérer toutes les salles      | ❌               | -           |
| GET     | `/api/salles/:id`               | Récupérer une salle par ID       | ❌               | -           |
| GET     | `/api/salles/disponibles/liste` | Récupérer les salles disponibles | ❌               | -           |
| POST    | `/api/salles`                   | Créer une salle                  | ✅               | Admin       |
| PUT     | `/api/salles/:id`               | Mettre à jour une salle          | ✅               | Admin       |
| DELETE  | `/api/salles/:id`               | Supprimer une salle              | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "nom_salle": "Salle 101",
    "type_salle": "Amphithéâtre",
    "capacite": 100,
    "batiment": "Bâtiment A",
    "etage": 1,
    "equipements": "Vidéoprojecteur, Tableau interactif",
    "disponible": true
}
```

---

### 7. Cours (`/api/cours`)

| Méthode | Route            | Description               | Authentification | Rôle requis |
| ------- | ---------------- | ------------------------- | ---------------- | ----------- |
| GET     | `/api/cours`     | Récupérer tous les cours  | ❌               | -           |
| GET     | `/api/cours/:id` | Récupérer un cours par ID | ❌               | -           |
| POST    | `/api/cours`     | Créer un cours            | ✅               | Admin       |
| PUT     | `/api/cours/:id` | Mettre à jour un cours    | ✅               | Admin       |
| DELETE  | `/api/cours/:id` | Supprimer un cours        | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "code_cours": "INF301",
    "nom_cours": "Base de données",
    "niveau": "L3",
    "volume_horaire": 45,
    "type_cours": "Cours magistral",
    "semestre": "S5",
    "coefficient": 3.0,
    "id_filiere": 1
}
```

---

### 8. Créneaux (`/api/creneaux`)

| Méthode | Route               | Description                 | Authentification | Rôle requis |
| ------- | ------------------- | --------------------------- | ---------------- | ----------- |
| GET     | `/api/creneaux`     | Récupérer tous les créneaux | ❌               | -           |
| GET     | `/api/creneaux/:id` | Récupérer un créneau par ID | ❌               | -           |
| POST    | `/api/creneaux`     | Créer un créneau            | ✅               | Admin       |
| PUT     | `/api/creneaux/:id` | Mettre à jour un créneau    | ✅               | Admin       |
| DELETE  | `/api/creneaux/:id` | Supprimer un créneau        | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "jour_semaine": "lundi",
    "heure_debut": "08:00",
    "heure_fin": "10:00",
    "periode": "Semestre 1",
    "duree_minutes": 120
}
```

**Jours valides :** `lundi`, `mardi`, `mercredi`, `jeudi`, `vendredi`, `samedi`, `dimanche`

---

### 9. Affectations (`/api/affectations`)

| Méthode | Route                                         | Description                       | Authentification | Rôle requis |
| ------- | --------------------------------------------- | --------------------------------- | ---------------- | ----------- |
| GET     | `/api/affectations`                           | Récupérer toutes les affectations | ❌               | -           |
| GET     | `/api/affectations/:id`                       | Récupérer une affectation par ID  | ❌               | -           |
| GET     | `/api/affectations/enseignant/:id_enseignant` | Affectations par enseignant       | ❌               | -           |
| GET     | `/api/affectations/groupe/:id_groupe`         | Affectations par groupe           | ❌               | -           |
| POST    | `/api/affectations`                           | Créer une affectation             | ✅               | Admin       |
| PUT     | `/api/affectations/:id`                       | Mettre à jour une affectation     | ✅               | Admin       |
| DELETE  | `/api/affectations/:id`                       | Supprimer une affectation         | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "date_seance": "2024-12-15",
    "statut": "planifie",
    "commentaire": "Première séance",
    "id_cours": 1,
    "id_groupe": 1,
    "id_user_enseignant": 1,
    "id_salle": 1,
    "id_creneau": 1,
    "id_user_admin": 1
}
```

**Statuts valides :** `planifie`, `confirme`, `annule`, `reporte`

---

### 10. Demandes de Report (`/api/demandes-report`)

| Méthode | Route                                            | Description                   | Authentification | Rôle requis      |
| ------- | ------------------------------------------------ | ----------------------------- | ---------------- | ---------------- |
| GET     | `/api/demandes-report`                           | Récupérer toutes les demandes | ✅               | Admin            |
| GET     | `/api/demandes-report/:id`                       | Récupérer une demande par ID  | ✅               | Admin/Enseignant |
| GET     | `/api/demandes-report/enseignant/:id_enseignant` | Demandes par enseignant       | ✅               | Enseignant       |
| GET     | `/api/demandes-report/statut/:statut`            | Demandes par statut           | ✅               | Admin            |
| POST    | `/api/demandes-report`                           | Créer une demande             | ✅               | Enseignant       |
| PUT     | `/api/demandes-report/:id`                       | Mettre à jour une demande     | ✅               | Admin            |
| DELETE  | `/api/demandes-report/:id`                       | Supprimer une demande         | ✅               | Admin            |

**Body pour POST/PUT :**

```json
{
    "motif": "Maladie",
    "nouvelle_date": "2024-12-20",
    "statut_demande": "en_attente",
    "id_user_enseignant": 1,
    "id_affectation": 1
}
```

**Statuts valides :** `en_attente`, `approuve`, `refuse`

---

### 11. Conflits (`/api/conflits`)

| Méthode | Route                                                   | Description                 | Authentification | Rôle requis |
| ------- | ------------------------------------------------------- | --------------------------- | ---------------- | ----------- |
| GET     | `/api/conflits`                                         | Récupérer tous les conflits | ✅               | Admin       |
| GET     | `/api/conflits/non-resolus/liste`                       | Conflits non résolus        | ✅               | Admin       |
| GET     | `/api/conflits/:id`                                     | Récupérer un conflit par ID | ✅               | Admin       |
| POST    | `/api/conflits`                                         | Créer un conflit            | ✅               | Admin       |
| POST    | `/api/conflits/:id_conflit/affectation/:id_affectation` | Associer une affectation    | ✅               | Admin       |
| PUT     | `/api/conflits/:id`                                     | Mettre à jour un conflit    | ✅               | Admin       |
| DELETE  | `/api/conflits/:id`                                     | Supprimer un conflit        | ✅               | Admin       |
| DELETE  | `/api/conflits/:id_conflit/affectation/:id_affectation` | Dissocier une affectation   | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "type_conflit": "salle",
    "description": "Conflit de salle détecté",
    "resolu": false
}
```

**Types valides :** `salle`, `enseignant`, `groupe`

---

### 12. Notifications (`/api/notifications`)

| Méthode | Route                                       | Description                        | Authentification | Rôle requis |
| ------- | ------------------------------------------- | ---------------------------------- | ---------------- | ----------- |
| GET     | `/api/notifications`                        | Récupérer toutes les notifications | ✅               | Admin       |
| GET     | `/api/notifications/:id`                    | Récupérer une notification par ID  | ✅               | User        |
| GET     | `/api/notifications/user/:id_user`          | Notifications d'un utilisateur     | ✅               | User        |
| GET     | `/api/notifications/user/:id_user/non-lues` | Notifications non lues             | ✅               | User        |
| POST    | `/api/notifications`                        | Créer une notification             | ✅               | Admin       |
| PUT     | `/api/notifications/:id`                    | Mettre à jour une notification     | ✅               | Admin       |
| PATCH   | `/api/notifications/:id/lire`               | Marquer comme lue                  | ✅               | User        |
| DELETE  | `/api/notifications/:id`                    | Supprimer une notification         | ✅               | Admin       |

**Body pour POST/PUT :**

```json
{
    "titre": "Nouvelle affectation",
    "message": "Vous avez une nouvelle affectation",
    "type_notification": "info",
    "id_user": 1
}
```

**Types valides :** `info`, `warning`, `error`, `success`

---

### 13. Historique des Affectations (`/api/historiques`)

| Méthode | Route                                          | Description                    | Authentification | Rôle requis |
| ------- | ---------------------------------------------- | ------------------------------ | ---------------- | ----------- |
| GET     | `/api/historiques`                             | Récupérer tout l'historique    | ✅               | Admin       |
| GET     | `/api/historiques/:id`                         | Récupérer un historique par ID | ✅               | Admin       |
| GET     | `/api/historiques/affectation/:id_affectation` | Historique d'une affectation   | ✅               | Admin       |
| GET     | `/api/historiques/user/:id_user`               | Historique par utilisateur     | ✅               | Admin       |
| GET     | `/api/historiques/action/:action`              | Historique par action          | ✅               | Admin       |
| POST    | `/api/historiques`                             | Créer un historique            | ✅               | Admin       |

**Actions valides :** `creation`, `modification`, `suppression`, `annulation`

---

### 14. Disponibilités (`/api/disponibilites`)

| Méthode | Route                                                            | Description                         | Authentification | Rôle requis |
| ------- | ---------------------------------------------------------------- | ----------------------------------- | ---------------- | ----------- |
| GET     | `/api/disponibilites`                                            | Récupérer toutes les disponibilités | ✅               | Admin       |
| GET     | `/api/disponibilites/:id`                                        | Récupérer une disponibilité par ID  | ✅               | Admin       |
| GET     | `/api/disponibilites/enseignant/:id_enseignant`                  | Disponibilités d'un enseignant      | ✅               | Enseignant  |
| GET     | `/api/disponibilites/enseignant/:id_enseignant/indisponibilites` | Indisponibilités                    | ✅               | Enseignant  |
| POST    | `/api/disponibilites`                                            | Créer une disponibilité             | ✅               | Enseignant  |
| PUT     | `/api/disponibilites/:id`                                        | Mettre à jour une disponibilité     | ✅               | Enseignant  |
| DELETE  | `/api/disponibilites/:id`                                        | Supprimer une disponibilité         | ✅               | Enseignant  |

**Body pour POST/PUT :**

```json
{
    "disponible": false,
    "raison_indisponibilite": "Formation",
    "date_debut": "2024-12-20",
    "date_fin": "2024-12-25",
    "id_user_enseignant": 1,
    "id_creneau": 1
}
```

---

### 15. Appartenances (`/api/appartenances`)

| Méthode | Route                                                        | Description                        | Authentification | Rôle requis |
| ------- | ------------------------------------------------------------ | ---------------------------------- | ---------------- | ----------- |
| GET     | `/api/appartenances`                                         | Récupérer toutes les appartenances | ✅               | Admin       |
| GET     | `/api/appartenances/etudiant/:id_etudiant`                   | Groupe d'un étudiant               | ✅               | Étudiant    |
| GET     | `/api/appartenances/groupe/:id_groupe`                       | Étudiants d'un groupe              | ✅               | Admin       |
| POST    | `/api/appartenances`                                         | Ajouter un étudiant à un groupe    | ✅               | Admin       |
| DELETE  | `/api/appartenances/etudiant/:id_etudiant/groupe/:id_groupe` | Retirer un étudiant                | ✅               | Admin       |

**Body pour POST :**

```json
{
    "id_user_etudiant": 1,
    "id_groupe": 1
}
```

---

## 🔐 Codes de statut HTTP

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | Succès - Requête réussie                  |
| 201  | Créé - Ressource créée avec succès        |
| 400  | Mauvaise requête - Données invalides      |
| 401  | Non autorisé - Token manquant ou invalide |
| 403  | Interdit - Permissions insuffisantes      |
| 404  | Non trouvé - Ressource introuvable        |
| 409  | Conflit - Ressource déjà existante        |
| 429  | Trop de requêtes - Rate limit dépassé     |
| 500  | Erreur serveur - Erreur interne           |

---

## 🛠️ Scripts utiles

-   `npm start` : Lancer le serveur Express
-   `npm run dev` : Lancer en mode développement (avec nodemon)
-   `npm test` : Lancer les tests (si disponible)

---

## 🔒 Sécurité

### Rate Limiting

-   **API globale :** 100 requêtes / 15 minutes par IP
-   **Authentification :** 5 tentatives / 15 minutes par IP

### Headers de sécurité

Le serveur utilise Helmet pour configurer automatiquement les en-têtes de sécurité HTTP.

### Validation des données

Toutes les entrées utilisateur sont validées via `express-validator` avant traitement.

---

## 📊 Fonctionnalités avancées

### Détection automatique de conflits

Lors de la création/modification d'une affectation, le système détecte automatiquement :

-   **Conflits de salle** : Même salle au même créneau horaire
-   **Conflits d'enseignant** : Même enseignant au même créneau horaire
-   **Conflits de groupe** : Même groupe au même créneau horaire

### Système de notifications

-   Notifications automatiques lors de nouvelles affectations
-   Notifications de conflits détectés
-   Notifications de demandes de report

### Historique des modifications

Toutes les modifications d'affectations sont enregistrées dans l'historique avec :

-   Type d'action (création, modification, suppression, annulation)
-   Date et heure
-   Anciennes et nouvelles données
-   Utilisateur ayant effectué la modification

---

## 📚 Documentation détaillée pour le Frontend

Pour une documentation complète avec des exemples détaillés, consultez le dossier **`/api`** :

### 📁 Fichiers disponibles dans `/api` :

-   **`README.md`** : Vue d'ensemble de la documentation API
-   **`EXEMPLES_API.md`** : Exemples détaillés avec Axios pour tous les endpoints
-   **`FETCH_EXEMPLES.md`** : Exemples avec l'API Fetch native JavaScript
-   **`REFERENCE_RAPIDE.md`** : Liste rapide de toutes les routes
-   **`TYPES.ts`** : Interfaces TypeScript pour le frontend
-   **`POSTMAN_COLLECTION.json`** : Collection Postman importable

### 🚀 Quick Start Frontend

```javascript
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Utilisation
const affectations = await api.get("/affectations/enseignant/1");
```

**Pour plus de détails, voir : [`/api/EXEMPLES_API.md`](./api/EXEMPLES_API.md)**

---

## 🧪 Exemples d'utilisation rapides

### Exemple 1 : Créer un utilisateur

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@hestim.ma",
    "password_hash": "$2a$10$...",
    "role": "enseignant"
  }'
```

### Exemple 2 : Récupérer les affectations d'un enseignant

```bash
curl -X GET http://localhost:5000/api/affectations/enseignant/1 \
  -H "Authorization: Bearer <token>"
```

### Exemple 3 : Créer une affectation

```bash
curl -X POST http://localhost:5000/api/affectations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "date_seance": "2024-12-15",
    "statut": "planifie",
    "id_cours": 1,
    "id_groupe": 1,
    "id_user_enseignant": 1,
    "id_salle": 1,
    "id_creneau": 1,
    "id_user_admin": 1
  }'
```

### Exemple 4 : Récupérer les notifications non lues

```bash
curl -X GET http://localhost:5000/api/notifications/user/1/non-lues \
  -H "Authorization: Bearer <token>"
```

> 💡 **Note :** Pour des exemples plus détaillés avec Axios, Fetch, React Hooks, etc., consultez le dossier [`/api`](./api/).

---

## 🐛 Gestion des erreurs

### Format d'erreur standard

```json
{
    "message": "Erreur de validation",
    "error": "Détails de l'erreur",
    "errors": [
        {
            "field": "email",
            "message": "L'email doit être valide",
            "location": "body",
            "value": "email_invalide"
        }
    ]
}
```

### Types d'erreurs

1. **Erreur de validation (400)** : Données invalides
2. **Erreur d'authentification (401)** : Token manquant ou invalide
3. **Erreur de permissions (403)** : Rôle insuffisant
4. **Erreur non trouvée (404)** : Ressource introuvable
5. **Erreur de conflit (409)** : Ressource déjà existante
6. **Erreur serveur (500)** : Erreur interne

---

## 📞 Contact

Pour toute question ou problème, contactez :

-   **Claudia KIMFUTA** – clusamote@gmail.com

---

## 📝 Notes importantes

1. **En développement**, les emails sont logués dans la console au lieu d'être envoyés (si nodemailer n'est pas installé).
2. **Les mots de passe** doivent être hashés avant d'être stockés dans la base de données. Utilisez `bcryptjs` pour cela.
3. **Les tokens JWT** doivent être générés lors de l'authentification (non implémenté dans cette version).
4. **La synchronisation des modèles** utilise `alter: true` en développement. En production, utilisez des migrations Sequelize.

---

_Merci d'utiliser HESTIM Planner !_ 🚀
