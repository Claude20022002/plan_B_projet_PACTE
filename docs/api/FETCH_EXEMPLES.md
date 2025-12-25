# 🌐 Exemples API avec Fetch (JavaScript natif)

Cette documentation contient des exemples d'utilisation de l'API avec l'API Fetch native JavaScript (sans bibliothèque externe).

## 🔧 Configuration de base

```javascript
// Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Fonction helper pour faire des requêtes
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Vérifier si la réponse est OK
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }

        // Si la réponse est 204 (No Content), retourner null
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur API:", error);
        throw error;
    }
}

// Helpers pour chaque méthode HTTP
const api = {
    get: (endpoint) => apiRequest(endpoint, { method: "GET" }),
    post: (endpoint, data) =>
        apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    put: (endpoint, data) =>
        apiRequest(endpoint, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    patch: (endpoint, data) =>
        apiRequest(endpoint, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),
};
```

---

## 👥 Utilisateurs

### GET `/api/users` - Récupérer tous les utilisateurs

```javascript
async function getAllUsers() {
    try {
        const users = await api.get("/users");
        console.log("Utilisateurs:", users);
        return users;
    } catch (error) {
        if (error.status === 401) {
            console.error("Non autorisé - Token invalide");
            // Rediriger vers la page de connexion
        } else {
            console.error("Erreur:", error.data);
        }
    }
}

// Utilisation
getAllUsers();
```

---

### GET `/api/users/:id` - Récupérer un utilisateur par ID

```javascript
async function getUserById(userId) {
    try {
        const user = await api.get(`/users/${userId}`);
        console.log("Utilisateur:", user);
        return user;
    } catch (error) {
        if (error.status === 404) {
            console.error("Utilisateur non trouvé");
        } else {
            console.error("Erreur:", error.data);
        }
        return null;
    }
}

// Utilisation
const user = await getUserById(1);
```

---

### POST `/api/users` - Créer un utilisateur

```javascript
async function createUser(userData) {
    try {
        const newUser = await api.post("/users", userData);
        console.log("Utilisateur créé:", newUser);
        return newUser;
    } catch (error) {
        if (error.status === 400) {
            console.error("Données invalides:", error.data.errors);
            // Afficher les erreurs de validation
            error.data.errors.forEach((err) => {
                console.error(`- ${err.field}: ${err.message}`);
            });
        } else {
            console.error("Erreur:", error.data);
        }
        throw error;
    }
}

// Utilisation
const userData = {
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@hestim.ma",
    password_hash: "$2a$10$...",
    role: "enseignant",
};

const user = await createUser(userData);
```

---

### PUT `/api/users/:id` - Mettre à jour un utilisateur

```javascript
async function updateUser(userId, updatedData) {
    try {
        const updatedUser = await api.put(`/users/${userId}`, updatedData);
        console.log("Utilisateur mis à jour:", updatedUser);
        return updatedUser;
    } catch (error) {
        console.error("Erreur:", error.data);
        throw error;
    }
}

// Utilisation
await updateUser(1, { telephone: "0698765432" });
```

---

### DELETE `/api/users/:id` - Supprimer un utilisateur

```javascript
async function deleteUser(userId) {
    try {
        const result = await api.delete(`/users/${userId}`);
        console.log("Message:", result.message);
        return true;
    } catch (error) {
        console.error("Erreur:", error.data);
        return false;
    }
}

// Utilisation
await deleteUser(1);
```

---

## 📅 Affectations

### GET `/api/affectations` - Récupérer toutes les affectations

```javascript
async function getAllAffectations() {
    try {
        const affectations = await api.get("/affectations");
        console.log("Affectations:", affectations);

        // Filtrer par date
        const aujourdhui = new Date().toISOString().split("T")[0];
        const affectationsAujourdhui = affectations.filter(
            (aff) => aff.date_seance === aujourdhui
        );

        return affectations;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}
```

---

### GET `/api/affectations/enseignant/:id_enseignant` - Affectations d'un enseignant

```javascript
async function getAffectationsByEnseignant(enseignantId) {
    try {
        const affectations = await api.get(
            `/affectations/enseignant/${enseignantId}`
        );

        // Trier par date et heure
        const sorted = affectations.sort((a, b) => {
            if (a.date_seance !== b.date_seance) {
                return a.date_seance.localeCompare(b.date_seance);
            }
            return a.creneau.heure_debut.localeCompare(b.creneau.heure_debut);
        });

        return sorted;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}

// Utilisation
const emploiDuTemps = await getAffectationsByEnseignant(1);
```

---

### POST `/api/affectations` - Créer une affectation

```javascript
async function createAffectation(affectationData) {
    try {
        const affectation = await api.post("/affectations", affectationData);
        console.log("Affectation créée:", affectation);

        // Créer une notification pour l'enseignant
        await api.post("/notifications", {
            titre: "Nouvelle affectation",
            message: `Vous avez une nouvelle affectation le ${affectation.date_seance}`,
            type_notification: "info",
            id_user: affectation.id_user_enseignant,
        });

        return affectation;
    } catch (error) {
        if (error.status === 400) {
            console.error("Erreur de validation:", error.data.errors);
        } else {
            console.error("Erreur:", error.data);
        }
        throw error;
    }
}

// Utilisation
const newAffectation = {
    date_seance: "2024-12-15",
    statut: "planifie",
    id_cours: 1,
    id_groupe: 1,
    id_user_enseignant: 1,
    id_salle: 1,
    id_creneau: 1,
    id_user_admin: 1,
};

const affectation = await createAffectation(newAffectation);
```

---

## 🏢 Salles

### GET `/api/salles/disponibles/liste` - Salles disponibles

```javascript
async function getSallesDisponibles() {
    try {
        const salles = await api.get("/salles/disponibles/liste");
        console.log("Salles disponibles:", salles);

        // Filtrer par capacité minimale
        const sallesMinCapacite = (minCapacite) => {
            return salles.filter((salle) => salle.capacite >= minCapacite);
        };

        const grandesSalles = sallesMinCapacite(50);
        return grandesSalles;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}
```

---

## 🔔 Notifications

### GET `/api/notifications/user/:id_user/non-lues` - Notifications non lues

```javascript
async function getNotificationsNonLues(userId) {
    try {
        const notifications = await api.get(
            `/notifications/user/${userId}/non-lues`
        );
        console.log(`${notifications.length} notification(s) non lue(s)`);
        return notifications;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}

// Utilisation avec mise à jour du badge
const userId = 1;
const notifications = await getNotificationsNonLues(userId);
document.getElementById("notification-badge").textContent =
    notifications.length;
```

---

### PATCH `/api/notifications/:id/lire` - Marquer comme lue

```javascript
async function marquerNotificationLue(notificationId) {
    try {
        const notification = await api.patch(
            `/notifications/${notificationId}/lire`
        );
        console.log("Notification marquée comme lue");
        return notification;
    } catch (error) {
        console.error("Erreur:", error.data);
        throw error;
    }
}

// Utilisation avec gestion de l'UI
async function handleNotificationClick(notificationId) {
    await marquerNotificationLue(notificationId);
    // Mettre à jour l'interface pour retirer la notification de la liste
    document
        .getElementById(`notification-${notificationId}`)
        .classList.remove("unread");
}
```

---

## 📝 Demandes de Report

### POST `/api/demandes-report` - Créer une demande de report

```javascript
async function creerDemandeReport(demandeData) {
    try {
        const demande = await api.post("/demandes-report", demandeData);
        console.log("Demande créée:", demande);

        // Afficher un message de succès
        alert("Votre demande a été soumise avec succès");

        return demande;
    } catch (error) {
        console.error("Erreur:", error.data);
        alert("Erreur lors de la création de la demande");
        throw error;
    }
}

// Utilisation
const demande = {
    motif: "Maladie de l'enseignant",
    nouvelle_date: "2024-12-20",
    statut_demande: "en_attente",
    id_user_enseignant: 1,
    id_affectation: 1,
};

await creerDemandeReport(demande);
```

---

### GET `/api/demandes-report/statut/:statut` - Demandes par statut

```javascript
async function getDemandesParStatut(statut) {
    try {
        const demandes = await api.get(`/demandes-report/statut/${statut}`);
        console.log(`Demandes ${statut}:`, demandes);
        return demandes;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}

// Utilisation dans un tableau de bord admin
async function chargerTableauDeBordAdmin() {
    const [enAttente, approuvees, refusees] = await Promise.all([
        getDemandesParStatut("en_attente"),
        getDemandesParStatut("approuve"),
        getDemandesParStatut("refuse"),
    ]);

    return {
        enAttente,
        approuvees,
        refusees,
    };
}
```

---

## ⚠️ Conflits

### GET `/api/conflits/non-resolus/liste` - Conflits non résolus

```javascript
async function getConflitsNonResolus() {
    try {
        const conflits = await api.get("/conflits/non-resolus/liste");

        // Grouper par type
        const conflitsParType = {
            salle: conflits.filter((c) => c.type_conflit === "salle"),
            enseignant: conflits.filter((c) => c.type_conflit === "enseignant"),
            groupe: conflits.filter((c) => c.type_conflit === "groupe"),
        };

        console.log("Conflits par type:", conflitsParType);
        return conflitsParType;
    } catch (error) {
        console.error("Erreur:", error.data);
        return { salle: [], enseignant: [], groupe: [] };
    }
}
```

---

## 📅 Disponibilités

### GET `/api/disponibilites/enseignant/:id_enseignant/indisponibilites` - Indisponibilités

```javascript
async function getIndisponibilitesEnseignant(enseignantId) {
    try {
        const indisponibilites = await api.get(
            `/disponibilites/enseignant/${enseignantId}/indisponibilites`
        );

        // Vérifier si l'enseignant est indisponible à une date donnée
        const estIndisponible = (date) => {
            return indisponibilites.some((indispo) => {
                return date >= indispo.date_debut && date <= indispo.date_fin;
            });
        };

        const dateVerification = "2024-12-20";
        if (estIndisponible(dateVerification)) {
            console.log("⚠️ Enseignant indisponible à cette date");
        }

        return indisponibilites;
    } catch (error) {
        console.error("Erreur:", error.data);
        return [];
    }
}
```

---

## 🎯 Exemple complet : Dashboard étudiant

```javascript
async function chargerDashboardEtudiant(etudiantId) {
    try {
        // 1. Récupérer les infos de l'étudiant
        const etudiant = await api.get(`/etudiants/${etudiantId}`);

        // 2. Récupérer le groupe de l'étudiant
        const appartenance = await api.get(
            `/appartenances/etudiant/${etudiantId}`
        );

        if (!appartenance) {
            return { error: "Étudiant sans groupe" };
        }

        const groupeId = appartenance.id_groupe;

        // 3. Récupérer l'emploi du temps du groupe
        const affectations = await api.get(`/affectations/groupe/${groupeId}`);

        // 4. Récupérer les notifications
        const notifications = await api.get(
            `/notifications/user/${etudiantId}/non-lues`
        );

        // 5. Trier les affectations par date et heure
        const emploiDuTemps = affectations.sort((a, b) => {
            if (a.date_seance !== b.date_seance) {
                return a.date_seance.localeCompare(b.date_seance);
            }
            return a.creneau.heure_debut.localeCompare(b.creneau.heure_debut);
        });

        // 6. Grouper par jour de la semaine
        const emploiDuTempsParJour = {};
        emploiDuTemps.forEach((aff) => {
            const jour = aff.creneau.jour_semaine;
            if (!emploiDuTempsParJour[jour]) {
                emploiDuTempsParJour[jour] = [];
            }
            emploiDuTempsParJour[jour].push(aff);
        });

        return {
            etudiant: etudiant,
            groupe: appartenance.groupe,
            emploiDuTemps: emploiDuTempsParJour,
            notificationsNonLues: notifications.length,
        };
    } catch (error) {
        console.error("Erreur:", error);
        throw error;
    }
}

// Utilisation
const dashboard = await chargerDashboardEtudiant(3);
console.log("Dashboard:", dashboard);
```

---

## 🔄 Exemple avec React Hooks

```javascript
import { useState, useEffect } from "react";

function useAffectations(enseignantId) {
    const [affectations, setAffectations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAffectations() {
            try {
                setLoading(true);
                const data = await api.get(
                    `/affectations/enseignant/${enseignantId}`
                );
                setAffectations(data);
                setError(null);
            } catch (err) {
                setError(err.data || err.message);
            } finally {
                setLoading(false);
            }
        }

        if (enseignantId) {
            fetchAffectations();
        }
    }, [enseignantId]);

    return { affectations, loading, error };
}

// Utilisation dans un composant
function EmploiDuTemps({ enseignantId }) {
    const { affectations, loading, error } = useAffectations(enseignantId);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur: {error.message}</div>;

    return (
        <div>
            {affectations.map((aff) => (
                <div key={aff.id_affectation}>
                    <h3>{aff.cours.nom_cours}</h3>
                    <p>Date: {aff.date_seance}</p>
                    <p>Salle: {aff.salle.nom_salle}</p>
                </div>
            ))}
        </div>
    );
}
```

---

## 📝 Notes

-   Utilisez `async/await` pour un code plus lisible
-   Gérer toujours les erreurs avec `try/catch`
-   Vérifier le statut HTTP pour adapter le comportement
-   Les erreurs 401 indiquent un problème d'authentification
-   Les erreurs 400 contiennent les détails de validation

---

Pour plus d'exemples avec Axios, consultez `EXEMPLES_API.md`.
