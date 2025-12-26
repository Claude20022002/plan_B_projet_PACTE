/**
 * Service API centralisé pour communiquer avec le backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fonction utilitaire pour faire des requêtes HTTP
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    // Ajouter le body si présent
    if (options.body) {
        if (typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        } else {
            config.body = options.body;
        }
    }

    try {
        const response = await fetch(url, config);
        
        // Gérer les réponses sans contenu JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text || `Erreur ${response.status}` };
        }

        if (!response.ok) {
            // Si erreur 401 (non autorisé), ne pas rediriger automatiquement
            // Laisser le composant gérer la redirection
            if (response.status === 401) {
                const error = new Error(data.message || data.error || 'Non autorisé');
                error.status = 401;
                error.response = { data };
                throw error;
            }
            // Si erreur 403 (interdit), c'est un problème de permissions
            if (response.status === 403) {
                const error = new Error(data.message || data.error || 'Accès interdit');
                error.status = 403;
                error.response = { data };
                throw error;
            }
            const error = new Error(data.message || data.error || `Erreur ${response.status}`);
            error.status = response.status;
            error.response = { data };
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API Error:', {
            endpoint,
            method: config.method,
            status: error.status,
            message: error.message,
        });
        throw error;
    }
}

// ==================== AUTHENTIFICATION ====================
export const authAPI = {
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    refreshToken: () => request('/auth/refresh', { method: 'POST' }),
};

// ==================== UTILISATEURS ====================
export const userAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/users${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/users/${id}`),
    create: (data) => request('/users', { method: 'POST', body: data }),
    update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
    importBulk: (data) => request('/users/import', { method: 'POST', body: data }),
};

// ==================== ENSEIGNANTS ====================
export const enseignantAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/enseignants${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/enseignants/${id}`),
    create: (data) => request('/enseignants', { method: 'POST', body: data }),
    update: (id, data) => request(`/enseignants/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/enseignants/${id}`, { method: 'DELETE' }),
    importEnseignants: (data) => request('/enseignants/import', { method: 'POST', body: { enseignants: data } }),
};

// ==================== ÉTUDIANTS ====================
export const etudiantAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/etudiants${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/etudiants/${id}`),
    create: (data) => request('/etudiants', { method: 'POST', body: data }),
    update: (id, data) => request(`/etudiants/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/etudiants/${id}`, { method: 'DELETE' }),
    importEtudiants: (data) => request('/etudiants/import', { method: 'POST', body: { etudiants: data } }),
};

// ==================== FILIÈRES ====================
export const filiereAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/filieres${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/filieres/${id}`),
    create: (data) => request('/filieres', { method: 'POST', body: data }),
    update: (id, data) => request(`/filieres/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/filieres/${id}`, { method: 'DELETE' }),
};

// ==================== GROUPES ====================
export const groupeAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/groupes${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/groupes/${id}`),
    create: (data) => request('/groupes', { method: 'POST', body: data }),
    update: (id, data) => request(`/groupes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/groupes/${id}`, { method: 'DELETE' }),
};

// ==================== SALLES ====================
export const salleAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/salles${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/salles/${id}`),
    getDisponibles: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/salles/disponibles/liste${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/salles', { method: 'POST', body: data }),
    update: (id, data) => request(`/salles/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/salles/${id}`, { method: 'DELETE' }),
};

// ==================== COURS ====================
export const coursAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/cours${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/cours/${id}`),
    create: (data) => request('/cours', { method: 'POST', body: data }),
    update: (id, data) => request(`/cours/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/cours/${id}`, { method: 'DELETE' }),
};

// ==================== CRÉNEAUX ====================
export const creneauAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/creneaux${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/creneaux/${id}`),
    create: (data) => request('/creneaux', { method: 'POST', body: data }),
    update: (id, data) => request(`/creneaux/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/creneaux/${id}`, { method: 'DELETE' }),
};

// ==================== AFFECTATIONS ====================
export const affectationAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/affectations${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/affectations/${id}`),
    getByEnseignant: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/affectations/enseignant/${id}${query ? `?${query}` : ''}`);
    },
    getByGroupe: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/affectations/groupe/${id}${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/affectations', { method: 'POST', body: data }),
    update: (id, data) => request(`/affectations/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/affectations/${id}`, { method: 'DELETE' }),
};

// ==================== CONFLITS ====================
export const conflitAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/conflits${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/conflits/${id}`),
    getNonResolus: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/conflits/non-resolus/liste${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/conflits', { method: 'POST', body: data }),
    update: (id, data) => request(`/conflits/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/conflits/${id}`, { method: 'DELETE' }),
    associerAffectation: (idConflit, idAffectation) =>
        request(`/conflits/${idConflit}/affectation/${idAffectation}`, { method: 'POST' }),
    dissocierAffectation: (idConflit, idAffectation) =>
        request(`/conflits/${idConflit}/affectation/${idAffectation}`, { method: 'DELETE' }),
};

// ==================== EMPLOIS DU TEMPS ====================
export const emploiDuTempsAPI = {
    getByEnseignant: (id) => request(`/emplois-du-temps/enseignant/${id}`),
    getByGroupe: (id) => request(`/emplois-du-temps/groupe/${id}`),
    getBySalle: (id) => request(`/emplois-du-temps/salle/${id}`),
};

// ==================== NOTIFICATIONS ====================
export const notificationAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/notifications${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/notifications/${id}`),
    getByUser: (userId) => request(`/notifications/user/${userId}`),
    getNonLues: (userId) => request(`/notifications/user/${userId}/non-lues`),
    create: (data) => request('/notifications', { method: 'POST', body: data }),
    update: (id, data) => request(`/notifications/${id}`, { method: 'PUT', body: data }),
    marquerCommeLue: (id) => request(`/notifications/${id}/lire`, { method: 'PATCH' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ==================== DEMANDES DE REPORT ====================
export const demandeReportAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/demandes-report${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/demandes-report/${id}`),
    getByEnseignant: (id) => request(`/demandes-report/enseignant/${id}`),
    getByStatut: (statut) => request(`/demandes-report/statut/${statut}`),
    create: (data) => request('/demandes-report', { method: 'POST', body: data }),
    update: (id, data) => request(`/demandes-report/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/demandes-report/${id}`, { method: 'DELETE' }),
};

// ==================== DISPONIBILITÉS ====================
export const disponibiliteAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/disponibilites${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/disponibilites/${id}`),
    getByEnseignant: (id) => request(`/disponibilites/enseignant/${id}`),
    getIndisponibilites: (id) => request(`/disponibilites/enseignant/${id}/indisponibilites`),
    create: (data) => request('/disponibilites', { method: 'POST', body: data }),
    update: (id, data) => request(`/disponibilites/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/disponibilites/${id}`, { method: 'DELETE' }),
};

// ==================== STATISTIQUES ====================
export const statistiquesAPI = {
    getOccupationSalles: () => request('/statistiques/occupation-salles'),
    getChargeEnseignants: () => request('/statistiques/charge-enseignants'),
    getStatistiquesGlobales: () => request('/statistiques/dashboard'),
};

