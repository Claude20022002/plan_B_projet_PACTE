# 🧪 Guide Complet de Test des Routes API

Ce guide fournit des données fictives et des instructions détaillées pour tester toutes les routes de l'API HESTIM Planner.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration](#configuration)
3. [Authentification](#authentification)
4. [Données fictives](#données-fictives)
5. [Tests des routes par module](#tests-des-routes-par-module)
6. [Scénarios de test complets](#scénarios-de-test-complets)

---

## 🔧 Prérequis

-   Serveur backend démarré (`npm start` ou `nodemon server.js`)
-   Base de données MySQL configurée
-   Outil de test API (Postman, Insomnia, cURL, ou votre application frontend)
-   Token JWT pour l'authentification

### Variables d'environnement

Assurez-vous que votre `.env` contient :

```env
PORT=5000
DB_NAME=votre_base_de_donnees
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
JWT_SECRET=votre_secret_jwt
```

---

## ⚙️ Configuration

### URL de base

```
http://localhost:5000/api
```

### Headers requis pour les routes protégées

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer VOTRE_TOKEN_JWT"
}
```

---

## 🔐 Authentification

### 1. Créer un utilisateur admin (premier utilisateur)

**Route :** `POST /api/users`

**Body :**

```json
{
    "nom": "Admin",
    "prenom": "System",
    "email": "admin@hestim.ma",
    "password_hash": "$2b$10$VotreHashMotDePasse",
    "role": "admin",
    "telephone": "+212612345678",
    "actif": true
}
```

**Note :** Pour obtenir le hash du mot de passe, utilisez `bcrypt` :

```javascript
const bcrypt = require("bcryptjs");
const hash = await bcrypt.hash("MotDePasse123", 10);
```

### 2. Login (si vous avez un endpoint de login)

Une fois connecté, vous recevrez un token JWT à utiliser pour toutes les autres requêtes.

---

## 📊 Données fictives

### Données de base pour tester

#### Utilisateurs

```json
{
    "utilisateurs": [
        {
            "nom": "Alami",
            "prenom": "Ahmed",
            "email": "ahmed.alami@hestim.ma",
            "password_hash": "$2b$10$exemplehash1",
            "role": "enseignant",
            "telephone": "+212612345679",
            "actif": true
        },
        {
            "nom": "Bennani",
            "prenom": "Fatima",
            "email": "fatima.bennani@hestim.ma",
            "password_hash": "$2b$10$exemplehash2",
            "role": "enseignant",
            "telephone": "+212612345680",
            "actif": true
        },
        {
            "nom": "Chraibi",
            "prenom": "Youssef",
            "email": "youssef.chraibi@hestim.ma",
            "password_hash": "$2b$10$exemplehash3",
            "role": "etudiant",
            "telephone": "+212612345681",
            "actif": true
        },
        {
            "nom": "Dari",
            "prenom": "Sara",
            "email": "sara.dari@hestim.ma",
            "password_hash": "$2b$10$exemplehash4",
            "role": "etudiant",
            "telephone": "+212612345682",
            "actif": true
        }
    ]
}
```

#### Filières

```json
{
    "filieres": [
        {
            "code_filiere": "GI",
            "nom_filiere": "Génie Informatique",
            "description": "Formation en ingénierie informatique avec spécialisation en développement logiciel et systèmes d'information"
        },
        {
            "code_filiere": "GC",
            "nom_filiere": "Génie Civil",
            "description": "Formation en ingénierie civile avec spécialisation en construction et infrastructure"
        },
        {
            "code_filiere": "GEM",
            "nom_filiere": "Génie Électromécanique",
            "description": "Formation en ingénierie électromécanique"
        }
    ]
}
```

#### Groupes

```json
{
    "groupes": [
        {
            "nom_groupe": "GI-3A",
            "niveau": "3ème année",
            "effectif": 45,
            "annee_scolaire": "2024-2025",
            "id_filiere": 1
        },
        {
            "nom_groupe": "GI-3B",
            "niveau": "3ème année",
            "effectif": 42,
            "annee_scolaire": "2024-2025",
            "id_filiere": 1
        },
        {
            "nom_groupe": "GC-2A",
            "niveau": "2ème année",
            "effectif": 38,
            "annee_scolaire": "2024-2025",
            "id_filiere": 2
        }
    ]
}
```

#### Salles

```json
{
    "salles": [
        {
            "nom_salle": "A101",
            "type_salle": "Amphithéâtre",
            "capacite": 150,
            "batiment": "Bâtiment A",
            "etage": 1,
            "equipements": "Vidéoprojecteur, Tableau numérique, Système audio",
            "disponible": true
        },
        {
            "nom_salle": "B205",
            "type_salle": "Salle de cours",
            "capacite": 50,
            "batiment": "Bâtiment B",
            "etage": 2,
            "equipements": "Vidéoprojecteur, Tableau blanc",
            "disponible": true
        },
        {
            "nom_salle": "LAB-301",
            "type_salle": "Laboratoire",
            "capacite": 30,
            "batiment": "Bâtiment Lab",
            "etage": 3,
            "equipements": "Ordinateurs, Équipements techniques",
            "disponible": true
        },
        {
            "nom_salle": "A102",
            "type_salle": "Salle de TD",
            "capacite": 35,
            "batiment": "Bâtiment A",
            "etage": 1,
            "equipements": "Tableau blanc",
            "disponible": false
        }
    ]
}
```

#### Cours

```json
{
    "cours": [
        {
            "code_cours": "GI301",
            "nom_cours": "Architecture des systèmes",
            "niveau": "3ème année",
            "volume_horaire": 60,
            "type_cours": "Cours magistral",
            "semestre": "S1",
            "coefficient": 4.5,
            "id_filiere": 1
        },
        {
            "code_cours": "GI302",
            "nom_cours": "Développement web avancé",
            "niveau": "3ème année",
            "volume_horaire": 80,
            "type_cours": "TP",
            "semestre": "S1",
            "coefficient": 5.0,
            "id_filiere": 1
        },
        {
            "code_cours": "GI303",
            "nom_cours": "Base de données avancées",
            "niveau": "3ème année",
            "volume_horaire": 60,
            "type_cours": "Cours magistral",
            "semestre": "S1",
            "coefficient": 4.0,
            "id_filiere": 1
        },
        {
            "code_cours": "GC201",
            "nom_cours": "Résistance des matériaux",
            "niveau": "2ème année",
            "volume_horaire": 70,
            "type_cours": "Cours magistral",
            "semestre": "S1",
            "coefficient": 6.0,
            "id_filiere": 2
        }
    ]
}
```

#### Créneaux horaires

```json
{
    "creneaux": [
        {
            "jour_semaine": "lundi",
            "heure_debut": "08:00:00",
            "heure_fin": "10:00:00",
            "periode": "Matin",
            "duree_minutes": 120
        },
        {
            "jour_semaine": "lundi",
            "heure_debut": "10:15:00",
            "heure_fin": "12:15:00",
            "periode": "Matin",
            "duree_minutes": 120
        },
        {
            "jour_semaine": "lundi",
            "heure_debut": "14:00:00",
            "heure_fin": "16:00:00",
            "periode": "Après-midi",
            "duree_minutes": 120
        },
        {
            "jour_semaine": "mardi",
            "heure_debut": "08:00:00",
            "heure_fin": "10:00:00",
            "periode": "Matin",
            "duree_minutes": 120
        },
        {
            "jour_semaine": "mercredi",
            "heure_debut": "08:00:00",
            "heure_fin": "12:00:00",
            "periode": "Matin",
            "duree_minutes": 240
        }
    ]
}
```

#### Enseignants

```json
{
    "enseignants": [
        {
            "id_user": 2,
            "specialite": "Informatique",
            "departement": "Département Informatique",
            "grade": "Professeur",
            "bureau": "B201"
        },
        {
            "id_user": 3,
            "specialite": "Génie Civil",
            "departement": "Département Génie Civil",
            "grade": "Maître de Conférences",
            "bureau": "A305"
        }
    ]
}
```

#### Étudiants

```json
{
    "etudiants": [
        {
            "id_user": 4,
            "numero_etudiant": "GI2024-001",
            "niveau": "3ème année",
            "date_inscription": "2024-09-01"
        },
        {
            "id_user": 5,
            "numero_etudiant": "GI2024-002",
            "niveau": "3ème année",
            "date_inscription": "2024-09-01"
        }
    ]
}
```

#### Affectations

```json
{
    "affectations": [
        {
            "date_seance": "2024-10-15",
            "statut": "planifie",
            "commentaire": "Premier cours du semestre",
            "id_cours": 1,
            "id_groupe": 1,
            "id_user_enseignant": 2,
            "id_salle": 1,
            "id_creneau": 1,
            "id_user_admin": 1
        },
        {
            "date_seance": "2024-10-15",
            "statut": "planifie",
            "commentaire": null,
            "id_cours": 2,
            "id_groupe": 1,
            "id_user_enseignant": 2,
            "id_salle": 2,
            "id_creneau": 2,
            "id_user_admin": 1
        },
        {
            "date_seance": "2024-10-16",
            "statut": "planifie",
            "commentaire": "TP en laboratoire",
            "id_cours": 2,
            "id_groupe": 2,
            "id_user_enseignant": 2,
            "id_salle": 3,
            "id_creneau": 3,
            "id_user_admin": 1
        }
    ]
}
```

---

## 🧪 Tests des routes par module

### 1. 🔵 Routes Utilisateurs (`/api/users`)

#### GET `/api/users`

**Description :** Récupère tous les utilisateurs  
**Accès :** Admin uniquement  
**Headers :** `Authorization: Bearer TOKEN`

**Test :**

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**

```json
[
    {
        "id_user": 1,
        "nom": "Admin",
        "prenom": "System",
        "email": "admin@hestim.ma",
        "role": "admin",
        "telephone": "+212612345678",
        "actif": true,
        "avatar_url": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
]
```

#### GET `/api/users/:id`

**Description :** Récupère un utilisateur par ID  
**Accès :** Admin ou propriétaire  
**Test :**

```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### POST `/api/users`

**Description :** Crée un nouvel utilisateur  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "nom": "Test",
    "prenom": "User",
    "email": "test.user@hestim.ma",
    "password_hash": "$2b$10$exemplehash",
    "role": "etudiant",
    "telephone": "+212612345683",
    "actif": true
}
```

**Test :**

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "email": "test.user@hestim.ma",
    "password_hash": "$2b$10$exemplehash",
    "role": "etudiant",
    "telephone": "+212612345683",
    "actif": true
  }'
```

#### PUT `/api/users/:id`

**Description :** Met à jour un utilisateur  
**Accès :** Admin ou propriétaire  
**Body :**

```json
{
    "telephone": "+212698765432",
    "actif": true
}
```

#### DELETE `/api/users/:id`

**Description :** Supprime un utilisateur  
**Accès :** Admin uniquement

---

### 2. 🎓 Routes Enseignants (`/api/enseignants`)

#### GET `/api/enseignants`

**Description :** Récupère tous les enseignants avec leurs informations utilisateur  
**Accès :** Admin ou Enseignant  
**Réponse :** Liste d'enseignants avec relation `user` incluse

#### POST `/api/enseignants`

**Description :** Crée un nouvel enseignant  
**Accès :** Admin uniquement  
**Prérequis :** L'utilisateur doit exister avec `role: "enseignant"`  
**Body :**

```json
{
    "id_user": 2,
    "specialite": "Informatique",
    "departement": "Département Informatique",
    "grade": "Professeur",
    "bureau": "B201"
}
```

**Ordre de création :**

1. Créer d'abord l'utilisateur avec `role: "enseignant"`
2. Ensuite créer l'enseignant avec `id_user` correspondant

---

### 3. 👨‍🎓 Routes Étudiants (`/api/etudiants`)

#### GET `/api/etudiants`

**Description :** Récupère tous les étudiants avec leurs informations utilisateur  
**Accès :** Admin ou Enseignant

#### POST `/api/etudiants`

**Description :** Crée un nouvel étudiant  
**Accès :** Admin uniquement  
**Prérequis :** L'utilisateur doit exister avec `role: "etudiant"`  
**Body :**

```json
{
    "id_user": 4,
    "numero_etudiant": "GI2024-001",
    "niveau": "3ème année",
    "date_inscription": "2024-09-01"
}
```

---

### 4. 📚 Routes Filières (`/api/filieres`)

#### GET `/api/filieres`

**Description :** Récupère toutes les filières  
**Accès :** Tous les utilisateurs authentifiés

**Test :**

```bash
curl -X GET http://localhost:5000/api/filieres \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### POST `/api/filieres`

**Description :** Crée une nouvelle filière  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "code_filiere": "GI",
    "nom_filiere": "Génie Informatique",
    "description": "Formation en ingénierie informatique"
}
```

#### PUT `/api/filieres/:id`

**Description :** Met à jour une filière  
**Accès :** Admin uniquement

#### DELETE `/api/filieres/:id`

**Description :** Supprime une filière  
**Accès :** Admin uniquement

---

### 5. 👥 Routes Groupes (`/api/groupes`)

#### GET `/api/groupes`

**Description :** Récupère tous les groupes avec leur filière  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/groupes`

**Description :** Crée un nouveau groupe  
**Accès :** Admin uniquement  
**Prérequis :** La filière doit exister  
**Body :**

```json
{
    "nom_groupe": "GI-3A",
    "niveau": "3ème année",
    "effectif": 45,
    "annee_scolaire": "2024-2025",
    "id_filiere": 1
}
```

---

### 6. 🏫 Routes Salles (`/api/salles`)

#### GET `/api/salles`

**Description :** Récupère toutes les salles  
**Accès :** Tous les utilisateurs authentifiés

#### GET `/api/salles/disponibles/liste`

**Description :** Récupère uniquement les salles disponibles  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/salles`

**Description :** Crée une nouvelle salle  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "nom_salle": "A101",
    "type_salle": "Amphithéâtre",
    "capacite": 150,
    "batiment": "Bâtiment A",
    "etage": 1,
    "equipements": "Vidéoprojecteur, Tableau numérique",
    "disponible": true
}
```

---

### 7. 📖 Routes Cours (`/api/cours`)

#### GET `/api/cours`

**Description :** Récupère tous les cours avec leur filière  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/cours`

**Description :** Crée un nouveau cours  
**Accès :** Admin uniquement  
**Prérequis :** La filière doit exister  
**Body :**

```json
{
    "code_cours": "GI301",
    "nom_cours": "Architecture des systèmes",
    "niveau": "3ème année",
    "volume_horaire": 60,
    "type_cours": "Cours magistral",
    "semestre": "S1",
    "coefficient": 4.5,
    "id_filiere": 1
}
```

---

### 8. ⏰ Routes Créneaux (`/api/creneaux`)

#### GET `/api/creneaux`

**Description :** Récupère tous les créneaux horaires  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/creneaux`

**Description :** Crée un nouveau créneau  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "jour_semaine": "lundi",
    "heure_debut": "08:00:00",
    "heure_fin": "10:00:00",
    "periode": "Matin",
    "duree_minutes": 120
}
```

**Note :** `jour_semaine` doit être un des : `lundi`, `mardi`, `mercredi`, `jeudi`, `vendredi`, `samedi`, `dimanche`

---

### 9. 📅 Routes Affectations (`/api/affectations`)

#### GET `/api/affectations`

**Description :** Récupère toutes les affectations avec toutes les relations  
**Accès :** Tous les utilisateurs authentifiés  
**Réponse :** Inclut cours, groupe, enseignant, salle, créneau, admin créateur

#### POST `/api/affectations`

**Description :** Crée une nouvelle affectation (planification de cours)  
**Accès :** Admin uniquement  
**Prérequis :** Tous les IDs référencés doivent exister  
**Body :**

```json
{
    "date_seance": "2024-10-15",
    "statut": "planifie",
    "commentaire": "Premier cours du semestre",
    "id_cours": 1,
    "id_groupe": 1,
    "id_user_enseignant": 2,
    "id_salle": 1,
    "id_creneau": 1,
    "id_user_admin": 1
}
```

**Statuts possibles :** `planifie`, `confirme`, `annule`, `reporte`

#### GET `/api/affectations/enseignant/:id_enseignant`

**Description :** Récupère les affectations d'un enseignant spécifique  
**Accès :** Enseignant propriétaire ou Admin

#### GET `/api/affectations/groupe/:id_groupe`

**Description :** Récupère les affectations d'un groupe spécifique  
**Accès :** Tous les utilisateurs authentifiés

---

### 10. 📋 Routes Demandes de Report (`/api/demandes-report`)

#### GET `/api/demandes-report`

**Description :** Récupère toutes les demandes de report  
**Accès :** Admin

#### POST `/api/demandes-report`

**Description :** Crée une demande de report d'une affectation  
**Accès :** Enseignant (pour ses propres affectations)  
**Body :**

```json
{
    "motif": "Indisponibilité pour raison personnelle",
    "nouvelle_date": "2024-10-22",
    "id_user_enseignant": 2,
    "id_affectation": 1
}
```

**Statuts possibles :** `en_attente`, `approuve`, `refuse`

#### GET `/api/demandes-report/enseignant/:id_enseignant`

**Description :** Récupère les demandes d'un enseignant  
**Accès :** Enseignant propriétaire ou Admin

#### GET `/api/demandes-report/statut/:statut`

**Description :** Récupère les demandes par statut  
**Accès :** Admin

---

### 11. ⚠️ Routes Conflits (`/api/conflits`)

#### GET `/api/conflits`

**Description :** Récupère tous les conflits de planning  
**Accès :** Admin ou Enseignant

#### POST `/api/conflits`

**Description :** Crée un conflit (détection automatique ou manuelle)  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "type_conflit": "salle",
    "description": "Deux cours planifiés dans la même salle au même créneau",
    "resolu": false
}
```

**Types possibles :** `salle`, `enseignant`, `groupe`

#### GET `/api/conflits/non-resolus/liste`

**Description :** Récupère uniquement les conflits non résolus  
**Accès :** Admin ou Enseignant

#### POST `/api/conflits/:id_conflit/affectation/:id_affectation`

**Description :** Associe une affectation à un conflit  
**Accès :** Admin uniquement

---

### 12. 🔔 Routes Notifications (`/api/notifications`)

#### GET `/api/notifications`

**Description :** Récupère toutes les notifications  
**Accès :** Admin

#### POST `/api/notifications`

**Description :** Crée une notification  
**Accès :** Admin uniquement  
**Body :**

```json
{
    "titre": "Nouvelle affectation",
    "message": "Vous avez une nouvelle séance planifiée pour le 15 octobre",
    "type_notification": "info",
    "id_user": 2
}
```

**Types possibles :** `info`, `warning`, `error`, `success`

#### GET `/api/notifications/user/:id_user`

**Description :** Récupère les notifications d'un utilisateur  
**Accès :** Utilisateur propriétaire ou Admin

#### GET `/api/notifications/user/:id_user/non-lues`

**Description :** Récupère les notifications non lues d'un utilisateur  
**Accès :** Utilisateur propriétaire ou Admin

#### PATCH `/api/notifications/:id/lire`

**Description :** Marque une notification comme lue  
**Accès :** Utilisateur propriétaire ou Admin

---

### 13. 📜 Routes Historique Affectations (`/api/historiques`)

#### GET `/api/historiques`

**Description :** Récupère tout l'historique des modifications d'affectations  
**Accès :** Admin uniquement

#### GET `/api/historiques/affectation/:id_affectation`

**Description :** Récupère l'historique d'une affectation spécifique  
**Accès :** Admin uniquement

#### GET `/api/historiques/user/:id_user`

**Description :** Récupère l'historique des modifications par utilisateur  
**Accès :** Admin uniquement

#### GET `/api/historiques/action/:action`

**Description :** Récupère l'historique par type d'action  
**Accès :** Admin uniquement  
**Actions possibles :** `creation`, `modification`, `suppression`, `annulation`

---

### 14. 📆 Routes Disponibilités (`/api/disponibilites`)

#### GET `/api/disponibilites`

**Description :** Récupère toutes les disponibilités des enseignants  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/disponibilites`

**Description :** Crée une disponibilité (ou indisponibilité)  
**Accès :** Enseignant propriétaire ou Admin  
**Body :**

```json
{
    "disponible": true,
    "date_debut": "2024-10-01",
    "date_fin": "2024-12-31",
    "id_user_enseignant": 2,
    "id_creneau": 1
}
```

#### GET `/api/disponibilites/enseignant/:id_enseignant`

**Description :** Récupère les disponibilités d'un enseignant  
**Accès :** Tous les utilisateurs authentifiés

#### GET `/api/disponibilites/enseignant/:id_enseignant/indisponibilites`

**Description :** Récupère les indisponibilités d'un enseignant  
**Accès :** Tous les utilisateurs authentifiés

---

### 15. 👥 Routes Appartenances (`/api/appartenances`)

#### GET `/api/appartenances`

**Description :** Récupère toutes les appartenances étudiant-groupe  
**Accès :** Tous les utilisateurs authentifiés

#### POST `/api/appartenances`

**Description :** Ajoute un étudiant à un groupe  
**Accès :** Admin uniquement  
**Prérequis :** L'étudiant et le groupe doivent exister  
**Body :**

```json
{
    "id_user_etudiant": 4,
    "id_groupe": 1
}
```

#### DELETE `/api/appartenances/etudiant/:id_etudiant/groupe/:id_groupe`

**Description :** Retire un étudiant d'un groupe  
**Accès :** Admin uniquement

#### GET `/api/appartenances/etudiant/:id_etudiant`

**Description :** Récupère le groupe d'un étudiant  
**Accès :** Tous les utilisateurs authentifiés

#### GET `/api/appartenances/groupe/:id_groupe`

**Description :** Récupère tous les étudiants d'un groupe  
**Accès :** Tous les utilisateurs authentifiés

---

## 🎯 Scénarios de test complets

### Scénario 1 : Création complète d'une planification

**Ordre d'exécution :**

1. Créer des utilisateurs (admin, enseignant, étudiant)
2. Créer une filière
3. Créer un groupe
4. Créer des salles
5. Créer des cours
6. Créer des créneaux
7. Créer des enseignants/étudiants
8. Créer une affectation
9. Créer une appartenance étudiant-groupe

**Script de test complet :**

```bash
# 1. Créer Admin
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Admin","prenom":"System","email":"admin@hestim.ma","password_hash":"$2b$10$hash","role":"admin","telephone":"+212612345678","actif":true}'

# 2. Créer Enseignant User
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Alami","prenom":"Ahmed","email":"ahmed@hestim.ma","password_hash":"$2b$10$hash","role":"enseignant","telephone":"+212612345679","actif":true}'

# 3. Créer Filière
curl -X POST http://localhost:5000/api/filieres \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code_filiere":"GI","nom_filiere":"Génie Informatique","description":"Formation en ingénierie informatique"}'

# 4. Créer Groupe
curl -X POST http://localhost:5000/api/groupes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom_groupe":"GI-3A","niveau":"3ème année","effectif":45,"annee_scolaire":"2024-2025","id_filiere":1}'

# 5. Créer Salle
curl -X POST http://localhost:5000/api/salles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom_salle":"A101","type_salle":"Amphithéâtre","capacite":150,"batiment":"Bâtiment A","etage":1,"equipements":"Vidéoprojecteur","disponible":true}'

# 6. Créer Cours
curl -X POST http://localhost:5000/api/cours \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code_cours":"GI301","nom_cours":"Architecture des systèmes","niveau":"3ème année","volume_horaire":60,"type_cours":"Cours magistral","semestre":"S1","coefficient":4.5,"id_filiere":1}'

# 7. Créer Créneau
curl -X POST http://localhost:5000/api/creneaux \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jour_semaine":"lundi","heure_debut":"08:00:00","heure_fin":"10:00:00","periode":"Matin","duree_minutes":120}'

# 8. Créer Enseignant
curl -X POST http://localhost:5000/api/enseignants \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_user":2,"specialite":"Informatique","departement":"Département Informatique","grade":"Professeur","bureau":"B201"}'

# 9. Créer Affectation
curl -X POST http://localhost:5000/api/affectations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date_seance":"2024-10-15","statut":"planifie","id_cours":1,"id_groupe":1,"id_user_enseignant":2,"id_salle":1,"id_creneau":1,"id_user_admin":1}'
```

---

### Scénario 2 : Demande de report par un enseignant

1. Créer une affectation
2. L'enseignant crée une demande de report
3. L'admin approuve ou refuse la demande

---

### Scénario 3 : Détection et résolution de conflits

1. Créer deux affectations au même créneau et même salle (conflit de salle)
2. Créer un conflit manuellement ou détecté automatiquement
3. Résoudre le conflit

---

## 📝 Codes de statut HTTP

-   `200 OK` : Requête réussie
-   `201 Created` : Ressource créée avec succès
-   `400 Bad Request` : Données invalides
-   `401 Unauthorized` : Token manquant ou invalide
-   `403 Forbidden` : Accès refusé (mauvais rôle)
-   `404 Not Found` : Ressource non trouvée
-   `500 Internal Server Error` : Erreur serveur

---

## 🔍 Vérification des réponses

### Réponse réussie

```json
{
  "id": 1,
  "nom": "Test",
  ...
}
```

### Réponse d'erreur

```json
{
    "message": "Description de l'erreur",
    "error": "Détails techniques"
}
```

---

## 💡 Astuces de test

1. **Ordre de création :** Respectez l'ordre des dépendances (Users → Filiere → Groupe/Cours → Affectations)
2. **IDs :** Notez les IDs retournés lors des créations pour les utiliser dans les relations
3. **Tokens :** Utilisez des tokens valides pour chaque requête protégée
4. **Validation :** Testez les cas limites (données invalides, IDs inexistants, etc.)
5. **Permissions :** Testez avec différents rôles pour vérifier les restrictions d'accès

---

## 🛠️ Outils recommandés

-   **Postman** : Collection disponible dans `POSTMAN_COLLECTION.json`
-   **Insomnia** : Import du fichier Postman
-   **cURL** : Commandes directes dans le terminal
-   **Thunder Client** : Extension VS Code
-   **HTTPie** : Alternative à cURL avec syntaxe simplifiée

---

## 📚 Ressources supplémentaires

-   [EXEMPLES_API.md](./EXEMPLES_API.md) : Exemples détaillés avec Axios
-   [FETCH_EXEMPLES.md](./FETCH_EXEMPLES.md) : Exemples avec Fetch API
-   [REFERENCE_RAPIDE.md](./REFERENCE_RAPIDE.md) : Liste rapide de toutes les routes
-   [TYPES.ts](./TYPES.ts) : Interfaces TypeScript

---

**Bon test ! 🚀**
