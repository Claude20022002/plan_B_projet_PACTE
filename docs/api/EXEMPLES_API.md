# 📚 Exemples d'utilisation de l'API HESTIM Planner

Cette documentation contient des exemples détaillés pour chaque endpoint de l'API afin d'aider l'équipe frontend à intégrer le backend.

## 📋 Table des matières

1. [Configuration](#configuration)
2. [Authentification](#authentification)
3. [Utilisateurs](#utilisateurs)
4. [Enseignants](#enseignants)
5. [Étudiants](#étudiants)
6. [Filières](#filières)
7. [Groupes](#groupes)
8. [Salles](#salles)
9. [Cours](#cours)
10. [Créneaux](#créneaux)
11. [Affectations](#affectations)
12. [Demandes de Report](#demandes-de-report)
13. [Conflits](#conflits)
14. [Notifications](#notifications)
15. [Historique](#historique)
16. [Disponibilités](#disponibilités)
17. [Appartenances](#appartenances)

---

## 🔧 Configuration

### Base URL

```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

### Configuration Axios (exemple)

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

### Gestion des erreurs

```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
```

---

## 🔐 Authentification

> **Note:** L'authentification JWT doit être implémentée. Pour l'instant, utilisez un token de test ou un système d'authentification.

### En-tête d'authentification

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 👥 Utilisateurs

### GET `/api/users` - Récupérer tous les utilisateurs

**Requête Axios:**

```javascript
try {
    const response = await api.get("/users");
    console.log("Utilisateurs:", response.data);
    // response.data est un tableau d'utilisateurs
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_user": 1,
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@hestim.ma",
        "role": "admin",
        "telephone": "0612345678",
        "actif": true,
        "avatar_url": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
    }
]
```

---

### GET `/api/users/:id` - Récupérer un utilisateur par ID

**Requête Axios:**

```javascript
const userId = 1;
try {
    const response = await api.get(`/users/${userId}`);
    console.log("Utilisateur:", response.data);
} catch (error) {
    if (error.response?.status === 404) {
        console.log("Utilisateur non trouvé");
    }
}
```

**Réponse:**

```json
{
    "id_user": 1,
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@hestim.ma",
    "role": "admin",
    "telephone": "0612345678",
    "actif": true,
    "avatar_url": null
}
```

---

### POST `/api/users` - Créer un utilisateur

**Requête Axios:**

```javascript
const newUser = {
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@hestim.ma",
    password_hash: "$2a$10$hashedPasswordHere", // Doit être hashé côté serveur
    role: "enseignant",
    telephone: "0623456789",
    actif: true,
    avatar_url: "https://example.com/avatar.jpg",
};

try {
    const response = await api.post("/users", newUser);
    console.log("Utilisateur créé:", response.data);
    // response.status === 201
} catch (error) {
    if (error.response?.status === 400) {
        console.error("Données invalides:", error.response.data.errors);
    }
}
```

**Réponse (201):**

```json
{
    "id_user": 2,
    "nom": "Martin",
    "prenom": "Sophie",
    "email": "sophie.martin@hestim.ma",
    "role": "enseignant",
    "telephone": "0623456789",
    "actif": true,
    "avatar_url": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
}
```

---

### PUT `/api/users/:id` - Mettre à jour un utilisateur

**Requête Axios:**

```javascript
const userId = 1;
const updatedData = {
    telephone: "0698765432",
    actif: false,
};

try {
    const response = await api.put(`/users/${userId}`, updatedData);
    console.log("Utilisateur mis à jour:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### DELETE `/api/users/:id` - Supprimer un utilisateur

**Requête Axios:**

```javascript
const userId = 1;

try {
    const response = await api.delete(`/users/${userId}`);
    console.log("Message:", response.data.message);
    // response.data.message === "Utilisateur supprimé avec succès"
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
{
    "message": "Utilisateur supprimé avec succès"
}
```

---

## 👨‍🏫 Enseignants

### GET `/api/enseignants` - Récupérer tous les enseignants

**Requête Axios:**

```javascript
try {
    const response = await api.get("/enseignants");
    console.log("Enseignants:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_user": 1,
        "specialite": "Informatique",
        "departement": "Département Informatique",
        "grade": "Professeur",
        "bureau": "Bureau 101",
        "user": {
            "id_user": 1,
            "nom": "Dupont",
            "prenom": "Jean",
            "email": "jean.dupont@hestim.ma",
            "role": "enseignant"
        }
    }
]
```

---

### GET `/api/enseignants/:id` - Récupérer un enseignant par ID

**Requête Axios:**

```javascript
const enseignantId = 1;

try {
    const response = await api.get(`/enseignants/${enseignantId}`);
    console.log("Enseignant:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/enseignants` - Créer un enseignant

**Requête Axios:**

```javascript
const newEnseignant = {
    id_user: 2, // L'utilisateur doit déjà exister
    specialite: "Mathématiques",
    departement: "Département Mathématiques",
    grade: "Maître de conférences",
    bureau: "Bureau 205",
};

try {
    const response = await api.post("/enseignants", newEnseignant);
    console.log("Enseignant créé:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 👨‍🎓 Étudiants

### GET `/api/etudiants` - Récupérer tous les étudiants

**Requête Axios:**

```javascript
try {
    const response = await api.get("/etudiants");
    console.log("Étudiants:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_user": 3,
        "numero_etudiant": "ETU2024001",
        "niveau": "L3",
        "date_inscription": "2024-09-01",
        "user": {
            "id_user": 3,
            "nom": "Bernard",
            "prenom": "Pierre",
            "email": "pierre.bernard@hestim.ma",
            "role": "etudiant"
        }
    }
]
```

---

### POST `/api/etudiants` - Créer un étudiant

**Requête Axios:**

```javascript
const newEtudiant = {
    id_user: 4, // L'utilisateur doit déjà exister
    numero_etudiant: "ETU2024002",
    niveau: "L2",
    date_inscription: "2024-09-01",
};

try {
    const response = await api.post("/etudiants", newEtudiant);
    console.log("Étudiant créé:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 🎓 Filières

### GET `/api/filieres` - Récupérer toutes les filières

**Requête Axios:**

```javascript
try {
    const response = await api.get("/filieres");
    console.log("Filières:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_filiere": 1,
        "code_filiere": "INF",
        "nom_filiere": "Informatique",
        "description": "Filière en informatique",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
    }
]
```

---

### POST `/api/filieres` - Créer une filière

**Requête Axios:**

```javascript
const newFiliere = {
    code_filiere: "GES",
    nom_filiere: "Gestion",
    description: "Filière en gestion d'entreprise",
};

try {
    const response = await api.post("/filieres", newFiliere);
    console.log("Filière créée:", response.data);
} catch (error) {
    if (error.response?.status === 409) {
        console.error("Une filière avec ce code existe déjà");
    }
}
```

---

## 👥 Groupes

### GET `/api/groupes` - Récupérer tous les groupes

**Requête Axios:**

```javascript
try {
    const response = await api.get("/groupes");
    console.log("Groupes:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_groupe": 1,
        "nom_groupe": "Groupe A",
        "niveau": "L3",
        "effectif": 30,
        "annee_scolaire": "2024-2025",
        "id_filiere": 1,
        "filiere": {
            "id_filiere": 1,
            "code_filiere": "INF",
            "nom_filiere": "Informatique"
        }
    }
]
```

---

### POST `/api/groupes` - Créer un groupe

**Requête Axios:**

```javascript
const newGroupe = {
    nom_groupe: "Groupe B",
    niveau: "L2",
    effectif: 25,
    annee_scolaire: "2024-2025",
    id_filiere: 1,
};

try {
    const response = await api.post("/groupes", newGroupe);
    console.log("Groupe créé:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 🏢 Salles

### GET `/api/salles` - Récupérer toutes les salles

**Requête Axios:**

```javascript
try {
    const response = await api.get("/salles");
    console.log("Salles:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/salles/disponibles/liste` - Récupérer les salles disponibles

**Requête Axios:**

```javascript
try {
    const response = await api.get("/salles/disponibles/liste");
    console.log("Salles disponibles:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_salle": 1,
        "nom_salle": "Salle 101",
        "type_salle": "Amphithéâtre",
        "capacite": 100,
        "batiment": "Bâtiment A",
        "etage": 1,
        "equipements": "Vidéoprojecteur, Tableau interactif",
        "disponible": true
    }
]
```

---

### POST `/api/salles` - Créer une salle

**Requête Axios:**

```javascript
const newSalle = {
    nom_salle: "Salle 102",
    type_salle: "Laboratoire",
    capacite: 30,
    batiment: "Bâtiment A",
    etage: 1,
    equipements: "Ordinateurs, Tableau interactif",
    disponible: true,
};

try {
    const response = await api.post("/salles", newSalle);
    console.log("Salle créée:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 📚 Cours

### GET `/api/cours` - Récupérer tous les cours

**Requête Axios:**

```javascript
try {
    const response = await api.get("/cours");
    console.log("Cours:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_cours": 1,
        "code_cours": "INF301",
        "nom_cours": "Base de données",
        "niveau": "L3",
        "volume_horaire": 45,
        "type_cours": "Cours magistral",
        "semestre": "S5",
        "coefficient": 3.0,
        "id_filiere": 1,
        "filiere": {
            "id_filiere": 1,
            "code_filiere": "INF",
            "nom_filiere": "Informatique"
        }
    }
]
```

---

### POST `/api/cours` - Créer un cours

**Requête Axios:**

```javascript
const newCours = {
    code_cours: "INF302",
    nom_cours: "Développement Web",
    niveau: "L3",
    volume_horaire: 60,
    type_cours: "Cours magistral + TP",
    semestre: "S5",
    coefficient: 4.0,
    id_filiere: 1,
};

try {
    const response = await api.post("/cours", newCours);
    console.log("Cours créé:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## ⏰ Créneaux

### GET `/api/creneaux` - Récupérer tous les créneaux

**Requête Axios:**

```javascript
try {
    const response = await api.get("/creneaux");
    console.log("Créneaux:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_creneau": 1,
        "jour_semaine": "lundi",
        "heure_debut": "08:00",
        "heure_fin": "10:00",
        "periode": "Semestre 1",
        "duree_minutes": 120
    }
]
```

---

### POST `/api/creneaux` - Créer un créneau

**Requête Axios:**

```javascript
const newCreneau = {
    jour_semaine: "mardi",
    heure_debut: "14:00",
    heure_fin: "16:00",
    periode: "Semestre 1",
    duree_minutes: 120,
};

try {
    const response = await api.post("/creneaux", newCreneau);
    console.log("Créneau créé:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 📅 Affectations

### GET `/api/affectations` - Récupérer toutes les affectations

**Requête Axios:**

```javascript
try {
    const response = await api.get("/affectations");
    console.log("Affectations:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse complète avec relations:**

```json
[
    {
        "id_affectation": 1,
        "date_seance": "2024-12-15",
        "statut": "planifie",
        "commentaire": null,
        "id_cours": 1,
        "id_groupe": 1,
        "id_user_enseignant": 1,
        "id_salle": 1,
        "id_creneau": 1,
        "id_user_admin": 1,
        "cours": {
            "id_cours": 1,
            "code_cours": "INF301",
            "nom_cours": "Base de données"
        },
        "groupe": {
            "id_groupe": 1,
            "nom_groupe": "Groupe A"
        },
        "enseignant": {
            "id_user": 1,
            "nom": "Dupont",
            "prenom": "Jean",
            "email": "jean.dupont@hestim.ma"
        },
        "salle": {
            "id_salle": 1,
            "nom_salle": "Salle 101"
        },
        "creneau": {
            "id_creneau": 1,
            "jour_semaine": "lundi",
            "heure_debut": "08:00",
            "heure_fin": "10:00"
        },
        "admin_createur": {
            "id_user": 1,
            "nom": "Admin",
            "prenom": "Admin"
        }
    }
]
```

---

### GET `/api/affectations/enseignant/:id_enseignant` - Affectations d'un enseignant

**Requête Axios:**

```javascript
const enseignantId = 1;

try {
    const response = await api.get(`/affectations/enseignant/${enseignantId}`);
    console.log("Affectations de l'enseignant:", response.data);

    // Filtrer par date si nécessaire
    const affectationsAujourdhui = response.data.filter(
        (aff) => aff.date_seance === new Date().toISOString().split("T")[0]
    );
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/affectations/groupe/:id_groupe` - Affectations d'un groupe

**Requête Axios:**

```javascript
const groupeId = 1;

try {
    const response = await api.get(`/affectations/groupe/${groupeId}`);
    console.log("Emploi du temps du groupe:", response.data);

    // Trier par date et heure
    const sorted = response.data.sort((a, b) => {
        if (a.date_seance !== b.date_seance) {
            return a.date_seance.localeCompare(b.date_seance);
        }
        return a.creneau.heure_debut.localeCompare(b.creneau.heure_debut);
    });
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/affectations` - Créer une affectation

**Requête Axios:**

```javascript
const newAffectation = {
    date_seance: "2024-12-15",
    statut: "planifie",
    commentaire: "Première séance du cours",
    id_cours: 1,
    id_groupe: 1,
    id_user_enseignant: 1,
    id_salle: 1,
    id_creneau: 1,
    id_user_admin: 1, // ID de l'admin qui crée l'affectation
};

try {
    const response = await api.post("/affectations", newAffectation);
    console.log("Affectation créée:", response.data);

    // Vérifier s'il y a des conflits détectés (à implémenter côté backend)
    // if (response.data.conflits && response.data.conflits.length > 0) {
    //   console.warn('⚠️ Conflits détectés:', response.data.conflits);
    // }
} catch (error) {
    if (error.response?.status === 400) {
        console.error("Données invalides:", error.response.data.errors);
    }
}
```

---

### PUT `/api/affectations/:id` - Mettre à jour une affectation

**Requête Axios:**

```javascript
const affectationId = 1;
const updatedData = {
    statut: "confirme",
    commentaire: "Séance confirmée par l'enseignant",
};

try {
    const response = await api.put(
        `/affectations/${affectationId}`,
        updatedData
    );
    console.log("Affectation mise à jour:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 📝 Demandes de Report

### GET `/api/demandes-report` - Récupérer toutes les demandes

**Requête Axios:**

```javascript
try {
    const response = await api.get("/demandes-report");
    console.log("Demandes de report:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/demandes-report/enseignant/:id_enseignant` - Demandes d'un enseignant

**Requête Axios:**

```javascript
const enseignantId = 1;

try {
    const response = await api.get(
        `/demandes-report/enseignant/${enseignantId}`
    );
    console.log("Mes demandes:", response.data);

    // Filtrer par statut
    const enAttente = response.data.filter(
        (d) => d.statut_demande === "en_attente"
    );
    const approuvees = response.data.filter(
        (d) => d.statut_demande === "approuve"
    );
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/demandes-report/statut/:statut` - Demandes par statut

**Requête Axios:**

```javascript
const statut = "en_attente"; // 'en_attente', 'approuve', 'refuse'

try {
    const response = await api.get(`/demandes-report/statut/${statut}`);
    console.log(`Demandes ${statut}:`, response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/demandes-report` - Créer une demande de report

**Requête Axios:**

```javascript
const newDemande = {
    motif: "Maladie de l'enseignant",
    nouvelle_date: "2024-12-20",
    statut_demande: "en_attente",
    id_user_enseignant: 1,
    id_affectation: 1,
};

try {
    const response = await api.post("/demandes-report", newDemande);
    console.log("Demande créée:", response.data);

    // La demande sera automatiquement notifiée aux admins
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### PUT `/api/demandes-report/:id` - Traiter une demande (Admin)

**Requête Axios:**

```javascript
const demandeId = 1;
const decision = {
    statut_demande: "approuve", // ou "refuse"
};

try {
    const response = await api.put(`/demandes-report/${demandeId}`, decision);
    console.log("Demande traitée:", response.data);

    if (decision.statut_demande === "approuve") {
        // Mettre à jour l'affectation avec la nouvelle date
        // (à implémenter selon votre logique métier)
    }
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## ⚠️ Conflits

### GET `/api/conflits` - Récupérer tous les conflits

**Requête Axios:**

```javascript
try {
    const response = await api.get("/conflits");
    console.log("Conflits:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/conflits/non-resolus/liste` - Conflits non résolus

**Requête Axios:**

```javascript
try {
    const response = await api.get("/conflits/non-resolus/liste");
    console.log("Conflits non résolus:", response.data);

    // Grouper par type de conflit
    const conflitsParType = {
        salle: response.data.filter((c) => c.type_conflit === "salle"),
        enseignant: response.data.filter(
            (c) => c.type_conflit === "enseignant"
        ),
        groupe: response.data.filter((c) => c.type_conflit === "groupe"),
    };
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_conflit": 1,
        "type_conflit": "salle",
        "description": "Conflit de salle : la salle est déjà occupée à ce créneau horaire",
        "date_detection": "2024-12-10T10:00:00.000Z",
        "resolu": false,
        "date_resolution": null,
        "affectations": [
            {
                "id_affectation": 1,
                "date_seance": "2024-12-15"
            },
            {
                "id_affectation": 2,
                "date_seance": "2024-12-15"
            }
        ]
    }
]
```

---

### PUT `/api/conflits/:id` - Marquer un conflit comme résolu

**Requête Axios:**

```javascript
const conflitId = 1;
const update = {
    resolu: true,
    date_resolution: new Date().toISOString(),
};

try {
    const response = await api.put(`/conflits/${conflitId}`, update);
    console.log("Conflit résolu:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 🔔 Notifications

### GET `/api/notifications/user/:id_user` - Notifications d'un utilisateur

**Requête Axios:**

```javascript
const userId = 1;

try {
    const response = await api.get(`/notifications/user/${userId}`);
    console.log("Notifications:", response.data);

    // Les notifications sont déjà triées par date (DESC)
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/notifications/user/:id_user/non-lues` - Notifications non lues

**Requête Axios:**

```javascript
const userId = 1;

try {
    const response = await api.get(`/notifications/user/${userId}/non-lues`);
    console.log("Notifications non lues:", response.data);

    // Afficher un badge avec le nombre de notifications non lues
    const nombreNonLues = response.data.length;
    console.log(`${nombreNonLues} notification(s) non lue(s)`);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### PATCH `/api/notifications/:id/lire` - Marquer comme lue

**Requête Axios:**

```javascript
const notificationId = 1;

try {
    const response = await api.patch(`/notifications/${notificationId}/lire`);
    console.log("Notification marquée comme lue:", response.data);

    // Mettre à jour l'état local
    // notification.lue = true;
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/notifications` - Créer une notification (Admin)

**Requête Axios:**

```javascript
const newNotification = {
    titre: "Nouvelle affectation",
    message: "Vous avez une nouvelle affectation le 15 décembre 2024",
    type_notification: "info", // 'info', 'warning', 'error', 'success'
    id_user: 1,
};

try {
    const response = await api.post("/notifications", newNotification);
    console.log("Notification créée:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 📜 Historique

### GET `/api/historiques/affectation/:id_affectation` - Historique d'une affectation

**Requête Axios:**

```javascript
const affectationId = 1;

try {
    const response = await api.get(`/historiques/affectation/${affectationId}`);
    console.log("Historique:", response.data);

    // Afficher un timeline des modifications
    response.data.forEach((historique, index) => {
        console.log(
            `${index + 1}. ${historique.action} le ${historique.date_action}`
        );
    });
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

**Réponse:**

```json
[
    {
        "id_historique": 1,
        "action": "creation",
        "date_action": "2024-12-10T10:00:00.000Z",
        "anciens_donnees": null,
        "nouveaux_donnees": {
            "date_seance": "2024-12-15",
            "statut": "planifie"
        },
        "commentaire": null,
        "user_modificateur": {
            "id_user": 1,
            "nom": "Admin",
            "prenom": "Admin"
        }
    }
]
```

---

## 📅 Disponibilités

### GET `/api/disponibilites/enseignant/:id_enseignant` - Disponibilités d'un enseignant

**Requête Axios:**

```javascript
const enseignantId = 1;

try {
    const response = await api.get(
        `/disponibilites/enseignant/${enseignantId}`
    );
    console.log("Disponibilités:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### GET `/api/disponibilites/enseignant/:id_enseignant/indisponibilites` - Indisponibilités

**Requête Axios:**

```javascript
const enseignantId = 1;

try {
    const response = await api.get(
        `/disponibilites/enseignant/${enseignantId}/indisponibilites`
    );
    console.log("Indisponibilités:", response.data);

    // Vérifier si l'enseignant est disponible à une date donnée
    const dateVerification = "2024-12-20";
    const indisponible = response.data.some((disp) => {
        return (
            dateVerification >= disp.date_debut &&
            dateVerification <= disp.date_fin
        );
    });

    if (indisponible) {
        console.log("⚠️ Enseignant indisponible à cette date");
    }
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/disponibilites` - Déclarer une indisponibilité

**Requête Axios:**

```javascript
const newDisponibilite = {
    disponible: false,
    raison_indisponibilite: "Formation à l'extérieur",
    date_debut: "2024-12-20",
    date_fin: "2024-12-25",
    id_user_enseignant: 1,
    id_creneau: 1,
};

try {
    const response = await api.post("/disponibilites", newDisponibilite);
    console.log("Indisponibilité déclarée:", response.data);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 🔗 Appartenances

### GET `/api/appartenances/etudiant/:id_etudiant` - Groupe d'un étudiant

**Requête Axios:**

```javascript
const etudiantId = 3; // id_user de l'étudiant

try {
    const response = await api.get(`/appartenances/etudiant/${etudiantId}`);
    console.log("Groupe de l'étudiant:", response.data);

    if (response.data) {
        console.log(
            `L'étudiant appartient au groupe: ${response.data.groupe.nom_groupe}`
        );
    } else {
        console.log("L'étudiant n'appartient à aucun groupe");
    }
} catch (error) {
    if (error.response?.status === 404) {
        console.log("L'étudiant n'appartient à aucun groupe");
    } else {
        console.error("Erreur:", error.response?.data);
    }
}
```

---

### GET `/api/appartenances/groupe/:id_groupe` - Étudiants d'un groupe

**Requête Axios:**

```javascript
const groupeId = 1;

try {
    const response = await api.get(`/appartenances/groupe/${groupeId}`);
    console.log("Étudiants du groupe:", response.data);

    const etudiants = response.data.map((app) => app.etudiant);
    console.log(`Nombre d'étudiants: ${etudiants.length}`);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

### POST `/api/appartenances` - Ajouter un étudiant à un groupe

**Requête Axios:**

```javascript
const newAppartenance = {
    id_user_etudiant: 3,
    id_groupe: 1,
};

try {
    const response = await api.post("/appartenances", newAppartenance);
    console.log("Étudiant ajouté au groupe:", response.data);
} catch (error) {
    if (error.response?.status === 409) {
        console.error("L'étudiant appartient déjà à ce groupe");
    } else {
        console.error("Erreur:", error.response?.data);
    }
}
```

---

### DELETE `/api/appartenances/etudiant/:id_etudiant/groupe/:id_groupe` - Retirer un étudiant

**Requête Axios:**

```javascript
const etudiantId = 3;
const groupeId = 1;

try {
    const response = await api.delete(
        `/appartenances/etudiant/${etudiantId}/groupe/${groupeId}`
    );
    console.log("Message:", response.data.message);
} catch (error) {
    console.error("Erreur:", error.response?.data);
}
```

---

## 🎯 Exemples d'utilisation combinée

### Exemple 1 : Afficher l'emploi du temps d'un groupe

```javascript
const afficherEmploiDuTempsGroupe = async (groupeId) => {
    try {
        // 1. Récupérer le groupe
        const groupeResponse = await api.get(`/groupes/${groupeId}`);
        const groupe = groupeResponse.data;

        // 2. Récupérer les affectations du groupe
        const affectationsResponse = await api.get(
            `/affectations/groupe/${groupeId}`
        );
        const affectations = affectationsResponse.data;

        // 3. Trier par date et heure
        const emploiDuTemps = affectations.sort((a, b) => {
            if (a.date_seance !== b.date_seance) {
                return a.date_seance.localeCompare(b.date_seance);
            }
            return a.creneau.heure_debut.localeCompare(b.creneau.heure_debut);
        });

        // 4. Grouper par jour de la semaine
        const parJour = {};
        emploiDuTemps.forEach((aff) => {
            const jour = aff.creneau.jour_semaine;
            if (!parJour[jour]) {
                parJour[jour] = [];
            }
            parJour[jour].push(aff);
        });

        console.log(`Emploi du temps - ${groupe.nom_groupe}`);
        console.log(parJour);

        return parJour;
    } catch (error) {
        console.error("Erreur:", error);
    }
};
```

### Exemple 2 : Créer une affectation complète avec vérification de conflits

```javascript
const creerAffectationAvecVerification = async (affectationData) => {
    try {
        // 1. Créer l'affectation
        const response = await api.post("/affectations", affectationData);
        const affectation = response.data;

        // 2. Vérifier les conflits (à implémenter côté backend)
        // const conflitsResponse = await api.get(`/conflits/affectation/${affectation.id_affectation}`);

        // 3. Créer une notification pour l'enseignant
        await api.post("/notifications", {
            titre: "Nouvelle affectation",
            message: `Vous avez une nouvelle affectation le ${affectation.date_seance}`,
            type_notification: "info",
            id_user: affectation.id_user_enseignant,
        });

        console.log("Affectation créée avec succès");
        return affectation;
    } catch (error) {
        console.error("Erreur lors de la création:", error.response?.data);
        throw error;
    }
};
```

### Exemple 3 : Dashboard pour un enseignant

```javascript
const chargerDashboardEnseignant = async (enseignantId) => {
    try {
        // Récupérer toutes les données en parallèle
        const [affectations, demandes, notifications, indisponibilites] =
            await Promise.all([
                api.get(`/affectations/enseignant/${enseignantId}`),
                api.get(`/demandes-report/enseignant/${enseignantId}`),
                api.get(`/notifications/user/${enseignantId}/non-lues`),
                api.get(
                    `/disponibilites/enseignant/${enseignantId}/indisponibilites`
                ),
            ]);

        return {
            affectations: affectations.data,
            demandes: demandes.data,
            notificationsNonLues: notifications.data.length,
            indisponibilites: indisponibilites.data,
        };
    } catch (error) {
        console.error("Erreur:", error);
        throw error;
    }
};
```

---

## 📝 Notes importantes

1. **Authentification** : Toutes les routes marquées avec ✅ nécessitent un token JWT dans l'en-tête `Authorization: Bearer <token>`

2. **Gestion des erreurs** : Toujours gérer les erreurs et vérifier `error.response?.status` pour adapter le comportement

3. **Validation** : Les données sont validées côté serveur. En cas d'erreur 400, vérifier `error.response.data.errors` pour les détails

4. **Pagination** : Pour l'instant, toutes les données sont retournées d'un coup. La pagination sera implémentée dans une version future si nécessaire

5. **Rate Limiting** : L'API limite à 100 requêtes par 15 minutes. Surveiller les erreurs 429

---

## 🚀 Bon développement !

Pour toute question, consultez le [README.md](../README.md) principal ou contactez l'équipe backend.
