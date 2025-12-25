# 🚀 Guide de Démarrage Rapide - Frontend

Ce guide vous aidera à démarrer rapidement avec l'API HESTIM Planner.

## 📋 Étape 1 : Configuration de base

### Installer Axios (recommandé)

```bash
npm install axios
```

### Créer un fichier de configuration API

Créez un fichier `api/config.js` dans votre projet frontend :

```javascript
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, // 10 secondes
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        // Formater l'erreur de manière cohérente
        const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Une erreur est survenue";
        const errors = error.response?.data?.errors || [];

        return Promise.reject({
            message: errorMessage,
            errors: errors,
            status: error.response?.status,
            data: error.response?.data,
        });
    }
);

export default api;
```

---

## 📋 Étape 2 : Créer des services API

### Service Utilisateurs

Créez `services/userService.js` :

```javascript
import api from "../api/config";

export const userService = {
    // Récupérer tous les utilisateurs
    getAll: async () => {
        const response = await api.get("/users");
        return response.data;
    },

    // Récupérer un utilisateur par ID
    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    // Créer un utilisateur
    create: async (userData) => {
        const response = await api.post("/users", userData);
        return response.data;
    },

    // Mettre à jour un utilisateur
    update: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    // Supprimer un utilisateur
    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};
```

### Service Affectations

Créez `services/affectationService.js` :

```javascript
import api from "../api/config";

export const affectationService = {
    // Récupérer toutes les affectations
    getAll: async () => {
        const response = await api.get("/affectations");
        return response.data;
    },

    // Récupérer une affectation par ID
    getById: async (id) => {
        const response = await api.get(`/affectations/${id}`);
        return response.data;
    },

    // Récupérer les affectations d'un enseignant
    getByEnseignant: async (enseignantId) => {
        const response = await api.get(
            `/affectations/enseignant/${enseignantId}`
        );
        return response.data;
    },

    // Récupérer les affectations d'un groupe (emploi du temps)
    getByGroupe: async (groupeId) => {
        const response = await api.get(`/affectations/groupe/${groupeId}`);
        return response.data;
    },

    // Créer une affectation
    create: async (affectationData) => {
        const response = await api.post("/affectations", affectationData);
        return response.data;
    },

    // Mettre à jour une affectation
    update: async (id, affectationData) => {
        const response = await api.put(`/affectations/${id}`, affectationData);
        return response.data;
    },

    // Supprimer une affectation
    delete: async (id) => {
        const response = await api.delete(`/affectations/${id}`);
        return response.data;
    },
};
```

---

## 📋 Étape 3 : Utilisation dans les composants

### Exemple avec React

```javascript
import { useState, useEffect } from "react";
import { affectationService } from "../services/affectationService";

function EmploiDuTemps({ groupeId }) {
    const [affectations, setAffectations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchEmploiDuTemps() {
            try {
                setLoading(true);
                const data = await affectationService.getByGroupe(groupeId);
                setAffectations(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error("Erreur:", err.errors);
            } finally {
                setLoading(false);
            }
        }

        if (groupeId) {
            fetchEmploiDuTemps();
        }
    }, [groupeId]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <div>
            <h2>Emploi du temps</h2>
            {affectations.map((aff) => (
                <div key={aff.id_affectation}>
                    <h3>{aff.cours?.nom_cours}</h3>
                    <p>Date: {aff.date_seance}</p>
                    <p>Salle: {aff.salle?.nom_salle}</p>
                    <p>
                        Heure: {aff.creneau?.heure_debut} -{" "}
                        {aff.creneau?.heure_fin}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default EmploiDuTemps;
```

---

## 📋 Étape 4 : Gestion des notifications

### Hook personnalisé pour les notifications

```javascript
import { useState, useEffect } from "react";
import api from "../api/config";

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [nonLues, setNonLues] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const [all, nonLuesData] = await Promise.all([
                    api.get(`/notifications/user/${userId}`),
                    api.get(`/notifications/user/${userId}/non-lues`),
                ]);

                setNotifications(all.data);
                setNonLues(nonLuesData.data.length);
            } catch (error) {
                console.error("Erreur:", error);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchNotifications();
            // Actualiser toutes les 30 secondes
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const marquerCommeLue = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/lire`);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id_notification === notificationId
                        ? { ...n, lue: true }
                        : n
                )
            );
            setNonLues((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    return { notifications, nonLues, loading, marquerCommeLue };
}
```

---

## 📋 Étape 5 : Créer un formulaire de création d'affectation

```javascript
import { useState } from "react";
import { affectationService } from "../services/affectationService";

function CreateAffectationForm() {
    const [formData, setFormData] = useState({
        date_seance: "",
        id_cours: "",
        id_groupe: "",
        id_user_enseignant: "",
        id_salle: "",
        id_creneau: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Récupérer l'ID de l'admin depuis le contexte/auth
            const adminId = 1; // À récupérer depuis votre système d'auth

            const affectationData = {
                ...formData,
                statut: "planifie",
                id_user_admin: adminId,
            };

            const newAffectation = await affectationService.create(
                affectationData
            );

            setSuccess(true);
            console.log("Affectation créée:", newAffectation);

            // Réinitialiser le formulaire
            setFormData({
                date_seance: "",
                id_cours: "",
                id_groupe: "",
                id_user_enseignant: "",
                id_salle: "",
                id_creneau: "",
            });
        } catch (err) {
            setError(err.message);
            if (err.errors) {
                console.error("Erreurs de validation:", err.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="error">{error}</div>}
            {success && (
                <div className="success">Affectation créée avec succès !</div>
            )}

            <input
                type="date"
                value={formData.date_seance}
                onChange={(e) =>
                    setFormData({ ...formData, date_seance: e.target.value })
                }
                required
            />

            <select
                value={formData.id_cours}
                onChange={(e) =>
                    setFormData({ ...formData, id_cours: e.target.value })
                }
                required
            >
                <option value="">Sélectionner un cours</option>
                {/* Charger les cours depuis l'API */}
            </select>

            {/* Autres champs... */}

            <button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'affectation"}
            </button>
        </form>
    );
}
```

---

## 📋 Étape 6 : Gestion des erreurs

### Composant d'affichage d'erreurs

```javascript
function ErrorDisplay({ error }) {
    if (!error) return null;

    return (
        <div className="error-container">
            <h3>Erreur</h3>
            <p>{error.message}</p>

            {error.errors && error.errors.length > 0 && (
                <ul>
                    {error.errors.map((err, index) => (
                        <li key={index}>
                            <strong>{err.field}</strong>: {err.message}
                        </li>
                    ))}
                </ul>
            )}

            {error.status === 429 && (
                <p>
                    ⚠️ Trop de requêtes. Veuillez patienter avant de réessayer.
                </p>
            )}

            {error.status === 401 && (
                <p>
                    🔒 Vous devez être connecté pour accéder à cette ressource.
                </p>
            )}
        </div>
    );
}
```

---

## 🎯 Cas d'usage complets

### Dashboard Enseignant

```javascript
import { useState, useEffect } from "react";
import { affectationService } from "../services/affectationService";
import { demandeReportService } from "../services/demandeReportService";
import { useNotifications } from "../hooks/useNotifications";

function DashboardEnseignant({ enseignantId }) {
    const [affectations, setAffectations] = useState([]);
    const [demandes, setDemandes] = useState([]);
    const { notifications, nonLues, marquerCommeLue } =
        useNotifications(enseignantId);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [affs, dems] = await Promise.all([
                    affectationService.getByEnseignant(enseignantId),
                    demandeReportService.getByEnseignant(enseignantId),
                ]);

                setAffectations(affs);
                setDemandes(dems);
            } catch (error) {
                console.error("Erreur:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [enseignantId]);

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <h1>Dashboard Enseignant</h1>

            <div>
                <h2>Notifications ({nonLues} non lues)</h2>
                {notifications.slice(0, 5).map((notif) => (
                    <div
                        key={notif.id_notification}
                        onClick={() => marquerCommeLue(notif.id_notification)}
                    >
                        <h3>{notif.titre}</h3>
                        <p>{notif.message}</p>
                    </div>
                ))}
            </div>

            <div>
                <h2>Mes affectations</h2>
                {affectations.map((aff) => (
                    <div key={aff.id_affectation}>
                        <h3>{aff.cours?.nom_cours}</h3>
                        <p>
                            {aff.date_seance} - {aff.salle?.nom_salle}
                        </p>
                    </div>
                ))}
            </div>

            <div>
                <h2>Mes demandes de report</h2>
                {demandes.map((dem) => (
                    <div key={dem.id_demande}>
                        <p>Statut: {dem.statut_demande}</p>
                        <p>Nouvelle date: {dem.nouvelle_date}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

## 🔄 Exemple : Charger les données nécessaires pour un formulaire

```javascript
import { useState, useEffect } from "react";
import api from "../api/config";

function AffectationForm() {
    const [cours, setCours] = useState([]);
    const [groupes, setGroupes] = useState([]);
    const [salles, setSalles] = useState([]);
    const [creneaux, setCreneaux] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFormData() {
            try {
                const [
                    coursRes,
                    groupesRes,
                    sallesRes,
                    creneauxRes,
                    enseignantsRes,
                ] = await Promise.all([
                    api.get("/cours"),
                    api.get("/groupes"),
                    api.get("/salles"),
                    api.get("/creneaux"),
                    api.get("/enseignants"),
                ]);

                setCours(coursRes.data);
                setGroupes(groupesRes.data);
                setSalles(sallesRes.data);
                setCreneaux(creneauxRes.data);
                setEnseignants(enseignantsRes.data);
            } catch (error) {
                console.error("Erreur lors du chargement:", error);
            } finally {
                setLoading(false);
            }
        }

        loadFormData();
    }, []);

    if (loading) return <div>Chargement des données...</div>;

    return (
        <form>
            {/* Remplir les select avec les données chargées */}
            <select>
                {cours.map((c) => (
                    <option key={c.id_cours} value={c.id_cours}>
                        {c.code_cours} - {c.nom_cours}
                    </option>
                ))}
            </select>
            {/* ... autres champs */}
        </form>
    );
}
```

---

## 📝 Checklist pour le frontend

-   [ ] Configuration Axios avec intercepteurs
-   [ ] Gestion globale des erreurs
-   [ ] Services API pour chaque module
-   [ ] Hooks React personnalisés (si applicable)
-   [ ] Gestion du token JWT
-   [ ] Gestion des notifications
-   [ ] Loading states
-   [ ] Gestion des erreurs 401 (redirection login)
-   [ ] Gestion des erreurs 429 (rate limiting)
-   [ ] Types TypeScript (si applicable)

---

## 🔗 Liens utiles

-   **Documentation complète** : [`EXEMPLES_API.md`](./EXEMPLES_API.md)
-   **Exemples Fetch natif** : [`FETCH_EXEMPLES.md`](./FETCH_EXEMPLES.md)
-   **Référence rapide** : [`REFERENCE_RAPIDE.md`](./REFERENCE_RAPIDE.md)
-   **Types TypeScript** : [`TYPES.ts`](./TYPES.ts)

---

Bon développement ! 🚀
