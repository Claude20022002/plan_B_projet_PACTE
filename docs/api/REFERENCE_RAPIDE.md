# ⚡ Référence Rapide - API HESTIM Planner

Ce document est une référence rapide pour l'équipe frontend. Pour plus de détails, consultez `EXEMPLES_API.md`.

## 🔗 Base URL

```
http://localhost:5000/api
```

## 🔑 Authentification

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📋 Routes principales

### Utilisateurs

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Enseignants

```
GET    /api/enseignants
GET    /api/enseignants/:id
POST   /api/enseignants
PUT    /api/enseignants/:id
DELETE /api/enseignants/:id
```

### Étudiants

```
GET    /api/etudiants
GET    /api/etudiants/:id
POST   /api/etudiants
PUT    /api/etudiants/:id
DELETE /api/etudiants/:id
```

### Filières

```
GET    /api/filieres
GET    /api/filieres/:id
POST   /api/filieres
PUT    /api/filieres/:id
DELETE /api/filieres/:id
```

### Groupes

```
GET    /api/groupes
GET    /api/groupes/:id
POST   /api/groupes
PUT    /api/groupes/:id
DELETE /api/groupes/:id
```

### Salles

```
GET    /api/salles
GET    /api/salles/:id
GET    /api/salles/disponibles/liste
POST   /api/salles
PUT    /api/salles/:id
DELETE /api/salles/:id
```

### Cours

```
GET    /api/cours
GET    /api/cours/:id
POST   /api/cours
PUT    /api/cours/:id
DELETE /api/cours/:id
```

### Créneaux

```
GET    /api/creneaux
GET    /api/creneaux/:id
POST   /api/creneaux
PUT    /api/creneaux/:id
DELETE /api/creneaux/:id
```

### Affectations

```
GET    /api/affectations
GET    /api/affectations/:id
GET    /api/affectations/enseignant/:id_enseignant
GET    /api/affectations/groupe/:id_groupe
POST   /api/affectations
PUT    /api/affectations/:id
DELETE /api/affectations/:id
```

### Demandes de Report

```
GET    /api/demandes-report
GET    /api/demandes-report/:id
GET    /api/demandes-report/enseignant/:id_enseignant
GET    /api/demandes-report/statut/:statut
POST   /api/demandes-report
PUT    /api/demandes-report/:id
DELETE /api/demandes-report/:id
```

### Conflits

```
GET    /api/conflits
GET    /api/conflits/non-resolus/liste
GET    /api/conflits/:id
POST   /api/conflits
POST   /api/conflits/:id_conflit/affectation/:id_affectation
PUT    /api/conflits/:id
DELETE /api/conflits/:id
DELETE /api/conflits/:id_conflit/affectation/:id_affectation
```

### Notifications

```
GET    /api/notifications
GET    /api/notifications/:id
GET    /api/notifications/user/:id_user
GET    /api/notifications/user/:id_user/non-lues
POST   /api/notifications
PUT    /api/notifications/:id
PATCH  /api/notifications/:id/lire
DELETE /api/notifications/:id
```

### Historique

```
GET    /api/historiques
GET    /api/historiques/:id
GET    /api/historiques/affectation/:id_affectation
GET    /api/historiques/user/:id_user
GET    /api/historiques/action/:action
POST   /api/historiques
```

### Disponibilités

```
GET    /api/disponibilites
GET    /api/disponibilites/:id
GET    /api/disponibilites/enseignant/:id_enseignant
GET    /api/disponibilites/enseignant/:id_enseignant/indisponibilites
POST   /api/disponibilites
PUT    /api/disponibilites/:id
DELETE /api/disponibilites/:id
```

### Appartenances

```
GET    /api/appartenances
GET    /api/appartenances/etudiant/:id_etudiant
GET    /api/appartenances/groupe/:id_groupe
POST   /api/appartenances
DELETE /api/appartenances/etudiant/:id_etudiant/groupe/:id_groupe
```

## 📊 Codes de statut

| Code | Description       |
| ---- | ----------------- |
| 200  | Succès            |
| 201  | Créé              |
| 400  | Données invalides |
| 401  | Non autorisé      |
| 403  | Interdit          |
| 404  | Non trouvé        |
| 409  | Conflit           |
| 429  | Trop de requêtes  |
| 500  | Erreur serveur    |

## 🎯 Exemples rapides

### Récupérer les affectations d'un enseignant

```javascript
const response = await api.get(`/affectations/enseignant/${enseignantId}`);
```

### Créer une affectation

```javascript
const affectation = await api.post("/affectations", {
    date_seance: "2024-12-15",
    id_cours: 1,
    id_groupe: 1,
    id_user_enseignant: 1,
    id_salle: 1,
    id_creneau: 1,
    id_user_admin: 1,
});
```

### Notifications non lues

```javascript
const notifications = await api.get(`/notifications/user/${userId}/non-lues`);
```

### Emploi du temps d'un groupe

```javascript
const affectations = await api.get(`/affectations/groupe/${groupeId}`);
```

---

Pour plus de détails et d'exemples, consultez `EXEMPLES_API.md`.
