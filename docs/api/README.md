# 📚 Documentation API - HESTIM Planner

Ce dossier contient la documentation détaillée et les exemples d'utilisation de l'API backend pour l'équipe frontend.

## 📁 Fichiers disponibles

### 📖 Documentation principale

-   **`GUIDE_TEST_ROUTES.md`** : Guide complet pour tester toutes les routes

    -   Descriptions détaillées de toutes les routes
    -   Données fictives pour tester
    -   Instructions étape par étape
    -   Exemples de requêtes complètes
    -   Scénarios de test complets
    -   Codes de statut HTTP et réponses attendues

-   **`DONNEES_FICTIVES.md`** : Données fictives prêtes à l'emploi

    -   Toutes les données de test organisées par module
    -   Ordre de création recommandé
    -   Données JSON prêtes à copier-coller
    -   Exemples d'utilisation

-   **`EXEMPLES_API.md`** : Exemples détaillés avec Axios pour tous les endpoints
    -   Configuration Axios
    -   Intercepteurs
    -   Exemples pour chaque route
    -   Gestion des erreurs
    -   Cas d'utilisation combinés

### 🌐 Exemples avec Fetch natif

-   **`FETCH_EXEMPLES.md`** : Exemples utilisant l'API Fetch native JavaScript
    -   Configuration sans bibliothèque externe
    -   Helper functions
    -   Exemples React Hooks
    -   Gestion d'erreurs

### ⚡ Référence rapide

-   **`REFERENCE_RAPIDE.md`** : Liste rapide de toutes les routes
    -   Toutes les routes organisées par module
    -   Codes de statut HTTP
    -   Exemples rapides

### 📦 Types TypeScript

-   **`TYPES.ts`** : Interfaces TypeScript pour le frontend
    -   Toutes les interfaces des modèles
    -   DTOs (Data Transfer Objects)
    -   Types d'erreurs
    -   Réponses API

### 🧪 Collection Postman

-   **`POSTMAN_COLLECTION.json`** : Collection Postman importable
    -   Routes principales
    -   Variables d'environnement
    -   Authentification configurée

---

## 🚀 Quick Start

### 🧪 Tester les routes

1. **Lisez le [GUIDE_TEST_ROUTES.md](./GUIDE_TEST_ROUTES.md)** pour les instructions complètes
2. **Utilisez les [DONNEES_FICTIVES.md](./DONNEES_FICTIVES.md)** pour les données de test
3. **Commencez par créer un utilisateur admin**, puis suivez l'ordre de création recommandé

### Configuration de base avec Axios

```javascript
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

### Exemple simple

```javascript
// Récupérer toutes les salles
const response = await api.get("/salles");
console.log(response.data);
```

---

## 📋 Structure de la documentation

La documentation `EXEMPLES_API.md` est organisée par modules :

1. **Configuration** : Setup Axios, intercepteurs, gestion d'erreurs
2. **Utilisateurs** : CRUD utilisateurs
3. **Enseignants** : Gestion des enseignants
4. **Étudiants** : Gestion des étudiants
5. **Filières** : Gestion des filières
6. **Groupes** : Gestion des groupes
7. **Salles** : Gestion des salles et disponibilités
8. **Cours** : Gestion des cours
9. **Créneaux** : Gestion des créneaux horaires
10. **Affectations** : Création et gestion des affectations de cours
11. **Demandes de Report** : Système de demandes de report
12. **Conflits** : Détection et gestion des conflits
13. **Notifications** : Système de notifications
14. **Historique** : Historique des modifications
15. **Disponibilités** : Gestion des disponibilités enseignants
16. **Appartenances** : Relations étudiant-groupe

---

## 🔑 Authentification

Toutes les routes marquées avec ✅ nécessitent un token JWT dans l'en-tête :

```
Authorization: Bearer <votre_token_jwt>
```

---

## 📊 Format des réponses

### Succès (200/201)

```json
{
  "id": 1,
  "nom": "Dupont",
  ...
}
```

### Erreur (4xx/5xx)

```json
{
    "message": "Description de l'erreur",
    "error": "Détails",
    "errors": [
        {
            "field": "email",
            "message": "L'email doit être valide"
        }
    ]
}
```

---

## 🎯 Codes de statut HTTP

| Code | Description                   |
| ---- | ----------------------------- |
| 200  | Succès                        |
| 201  | Créé                          |
| 400  | Données invalides             |
| 401  | Non autorisé                  |
| 403  | Interdit                      |
| 404  | Non trouvé                    |
| 409  | Conflit (ressource existante) |
| 429  | Trop de requêtes              |
| 500  | Erreur serveur                |

---

## 💡 Bonnes pratiques

1. **Toujours gérer les erreurs** : Utiliser try/catch ou .catch()
2. **Vérifier le statut** : Vérifier `response.status` ou `error.response?.status`
3. **Valider les données** : Les erreurs 400 contiennent les détails de validation
4. **Utiliser les intercepteurs** : Pour automatiser l'ajout du token JWT
5. **Gérer le rate limiting** : Surveiller les erreurs 429
6. **Utiliser TypeScript** : Importer les types depuis `TYPES.ts` pour l'autocomplétion

---

## 🧪 Tester avec Postman

1. Importez `POSTMAN_COLLECTION.json` dans Postman
2. Configurez la variable `base_url` : `http://localhost:5000/api`
3. Ajoutez votre token JWT dans la variable `jwt_token`
4. Testez les routes !

---

## 📞 Support

Pour toute question :

-   Consultez le [README.md principal](../README.md)
-   Voir les exemples détaillés dans `EXEMPLES_API.md`
-   Contactez l'équipe backend

---

## 🎓 Exemples d'utilisation

### Cas d'usage 1 : Emploi du temps d'un groupe

```javascript
// 1. Récupérer le groupe
const groupe = await api.get(`/groupes/${groupeId}`);

// 2. Récupérer les affectations
const affectations = await api.get(`/affectations/groupe/${groupeId}`);

// 3. Trier et afficher
const emploiDuTemps = affectations.data.sort(/* ... */);
```

### Cas d'usage 2 : Dashboard enseignant

```javascript
const [affectations, demandes, notifications] = await Promise.all([
    api.get(`/affectations/enseignant/${enseignantId}`),
    api.get(`/demandes-report/enseignant/${enseignantId}`),
    api.get(`/notifications/user/${enseignantId}/non-lues`),
]);
```

---

Bon développement ! 🚀
