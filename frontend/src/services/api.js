/**
 * Service API centralisé pour communiquer avec le backend
 */

// Même origine que le frontend : proxy Vite en dev, nginx en production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CSRF_COOKIE = import.meta.env.PROD ? '__Host-csrf_token' : 'csrf_token';

function getCookie(name) {
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=');
}

// Une seule demande de jeton à la fois : deux requêtes simultanées obtiendraient sinon
// deux jetons différents, et le cookie ne garderait que le second (→ 403 CSRF).
let csrfRequest = null;

async function ensureCsrfToken() {
    let token = getCookie(CSRF_COOKIE);
    if (!token) {
        csrfRequest ??= fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' })
            .then((response) => response.json())
            .finally(() => {
                csrfRequest = null;
            });
        const data = await csrfRequest;
        token = getCookie(CSRF_COOKIE) || data.csrfToken;
    }
    return token ? decodeURIComponent(token) : null;
}

// Un jeton expiré, absent (cookie d'accès disparu) ou illisible (ex. signé avant le passage en
// RS256, phase C) justifie une tentative de renouvellement : elle exige le jeton de renouvellement
// valide. Une session révoquée ou un compte désactivé mènent à la connexion.
const REFRESH_CODES = new Set(['TOKEN_EXPIRED', 'TOKEN_MISSING', 'TOKEN_INVALID']);

const NO_REFRESH_ENDPOINTS = new Set([
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
]);

/**
 * Fonction utilitaire pour faire des requêtes HTTP
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    const csrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
        ? await ensureCsrfToken()
        : null;

    const config = {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
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
            // 401 : le jeton d'accès (15 min) a expiré → un seul renouvellement puis une seule
            // nouvelle tentative. Jamais pour les routes d'auth (un mauvais mot de passe au login
            // ne doit pas déclencher de refresh), ni pour une requête déjà rejouée (évite la boucle).
            if (response.status === 401 && REFRESH_CODES.has(data.code) && !NO_REFRESH_ENDPOINTS.has(endpoint) && !options._retried) {
                try {
                    await request('/auth/refresh', { method: 'POST' });
                    return request(endpoint, { ...options, _retried: true });
                } catch {
                    const error = new Error(data.message || data.error || 'Non autorisé');
                    error.status = 401;
                    error.response = { data };
                    throw error;
                }
            }

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
        // Gérer les erreurs de connexion réseau
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            const connectionError = new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
            connectionError.status = 0;
            connectionError.isConnectionError = true;
            // Ne pas logger en console pour éviter le spam si le serveur n'est pas démarré
            throw connectionError;
        }
        
        // Logger les autres erreurs
        if (error.status !== 0) {
            console.error('API Error:', {
                endpoint,
                method: config.method,
                status: error.status,
                message: error.message,
            });
        }
        throw error;
    }
}

// ==================== AUTHENTIFICATION ====================
export const authAPI = {
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (token, id_user, password) => request('/auth/reset-password', { method: 'POST', body: { token, id_user, password } }),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    changePassword: (current_password, password) => request('/auth/change-password', { method: 'POST', body: { current_password, password } }),
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
    // Phase P3 : charges, compétences, disponibilité calculée
    getCharges: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/enseignants/charges${query ? `?${query}` : ''}`);
    },
    getCharge: (id) => request(`/enseignants/${id}/charge`),
    getCompetences: (id) => request(`/enseignants/${id}/competences`),
    setCompetences: (id, cours) => request(`/enseignants/${id}/competences`, { method: 'PUT', body: { cours } }),
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
    syncGroupes: () => request('/etudiants/sync-groupes', { method: 'POST', body: {} }),
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
    getResponsables: (id) => request(`/filieres/${id}/responsables`),
    ajouterResponsable: (id, idUser) => request(`/filieres/${id}/responsables`, { method: 'POST', body: { id_user: idUser } }),
    retirerResponsable: (id, idUser) => request(`/filieres/${id}/responsables/${idUser}`, { method: 'DELETE' }),
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
    // Arbre promotions → TD → TP
    getArbre: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/groupes/arbre${query ? `?${query}` : ''}`);
    },
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
    // Listes fermées : types de salle, droits de réservation
    getReferentiel: () => request('/salles/referentiel'),
    // Import de l'inventaire, tout ou rien (erreurs listées par ligne)
    importBulk: (salles) => request('/salles/import', { method: 'POST', body: { salles } }),
};

// ==================== CAMPUS ====================
export const campusAPI = {
    getAll: () => request('/campus'),
    create: (data) => request('/campus', { method: 'POST', body: data }),
    update: (id, data) => request(`/campus/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/campus/${id}`, { method: 'DELETE' }),
    getTrajets: () => request('/campus/trajets'),
    saveTrajet: (data) => request('/campus/trajets', { method: 'PUT', body: data }),
};

// ==================== CALENDRIER ACADÉMIQUE ====================
export const calendrierAPI = {
    getAnnees: () => request('/calendrier/annees'),
    createAnnee: (data) => request('/calendrier/annees', { method: 'POST', body: data }),
    updateAnnee: (id, data) => request(`/calendrier/annees/${id}`, { method: 'PUT', body: data }),
    deleteAnnee: (id) => request(`/calendrier/annees/${id}`, { method: 'DELETE' }),
    genererFeries: (id) => request(`/calendrier/annees/${id}/feries`, { method: 'POST' }),
    createPeriode: (idAnnee, data) => request(`/calendrier/annees/${idAnnee}/periodes`, { method: 'POST', body: data }),
    updatePeriode: (id, data) => request(`/calendrier/periodes/${id}`, { method: 'PUT', body: data }),
    deletePeriode: (id) => request(`/calendrier/periodes/${id}`, { method: 'DELETE' }),
};

// ==================== ÉVÉNEMENTS DU CALENDRIER ====================
export const evenementAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/evenements${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/evenements', { method: 'POST', body: data }),
    update: (id, data) => request(`/evenements/${id}`, { method: 'PUT', body: data }),
    confirmer: (id, data = {}) => request(`/evenements/${id}/confirmer`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/evenements/${id}`, { method: 'DELETE' }),
};

// ==================== PARAMÈTRES DE PLANIFICATION ====================
export const parametrePlanningAPI = {
    getAll: () => request('/parametres-planning'),
    update: (cle, valeur) => request(`/parametres-planning/${cle}`, { method: 'PUT', body: { valeur } }),
    reset: (cle) => request(`/parametres-planning/${cle}`, { method: 'DELETE' }),
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
    // Composantes d'un module (CM, TD, TP, Projet)
    getComposantes: (idCours) => request(`/cours/${idCours}/composantes`),
    createComposante: (idCours, data) => request(`/cours/${idCours}/composantes`, { method: 'POST', body: data }),
};

// ==================== COMPOSANTES DE MODULE ====================
export const composanteAPI = {
    update: (id, data) => request(`/composantes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/composantes/${id}`, { method: 'DELETE' }),
};

// ==================== ENSEIGNEMENTS (composante × groupes) ====================
export const enseignementAPI = {
    getAll: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/enseignements${query ? `?${query}` : ''}`);
    },
    generer: (data) => request('/enseignements/generer', { method: 'POST', body: data }),
    fusionner: (ids) => request('/enseignements/fusionner', { method: 'POST', body: { ids } }),
    scinder: (id) => request(`/enseignements/${id}/scinder`, { method: 'POST' }),
    update: (id, data) => request(`/enseignements/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/enseignements/${id}`, { method: 'DELETE' }),
    // Équipe pédagogique d'un enseignement (principal, co-enseignants)
    getCandidats: (id) => request(`/enseignements/${id}/candidats`),
    ajouterEnseignant: (id, data) => request(`/enseignements/${id}/enseignants`, { method: 'POST', body: data }),
    modifierService: (id, idUser, data) => request(`/enseignements/${id}/enseignants/${idUser}`, { method: 'PUT', body: data }),
    retirerEnseignant: (id, idUser) => request(`/enseignements/${id}/enseignants/${idUser}`, { method: 'DELETE' }),
};

// ==================== SERVICES (espace enseignant) ====================
export const serviceAPI = {
    getMesServices: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/services/mes-services${query ? `?${query}` : ''}`);
    },
    repondre: (idEnseignement, data) => request(`/services/${idEnseignement}/reponse`, { method: 'PATCH', body: data }),
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
    confirmer: (id) => request(`/affectations/${id}/confirmer`, { method: 'PATCH' }),
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
    // Étudiant connecté : séances de ses groupes ET de leurs parents (CM de la promotion),
    // mutualisations comprises ; 62 jours au plus par appel (voir utils/mesSeances.js)
    getMoi: ({ du, au }) => request(`/emplois-du-temps/moi?du=${du}&au=${au}`),
    getByEnseignant: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/emplois-du-temps/enseignant/${id}${query ? `?${query}` : ''}`);
    },
    getByGroupe: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/emplois-du-temps/groupe/${id}${query ? `?${query}` : ''}`);
    },
    getByEtudiant: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/emplois-du-temps/etudiant/${id}${query ? `?${query}` : ''}`);
    },
    getBySalle: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/emplois-du-temps/salle/${id}${query ? `?${query}` : ''}`);
    },
    getConsolide: (params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/emplois-du-temps/consolide${query ? `?${query}` : ''}`);
    },
    generer: (data) => request('/emplois-du-temps/generer', { method: 'POST', body: data }),
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
    marquerToutesLues: (userId) => request(`/notifications/user/${userId}/tout-lire`, { method: 'PATCH' }),
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
    // extra : { forcer, justification } pour approuver un report malgré les règles (admin)
    traiter: (id, action, extra = {}) => request(`/demandes-report/${id}/traiter`, { method: 'PATCH', body: { action, ...extra } }),
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
    getStatistiquesGlobales: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/dashboard${query ? `?${query}` : ''}`);
    },
    getKPIs: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/kpis${query ? `?${query}` : ''}`);
    },
    getOccupationSalles: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/salles/occupation${query ? `?${query}` : ''}`);
    },
    getChargeEnseignants: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/enseignants/charge${query ? `?${query}` : ''}`);
    },
    getOccupationGroupes: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/groupes/occupation${query ? `?${query}` : ''}`);
    },
    getPicsActivite: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/statistiques/activite/pics${query ? `?${query}` : ''}`);
    },
};

// ==================== GÉNÉRATION AUTOMATIQUE ====================
export const generationAutomatiqueAPI = {
    // { id_periode, id_filieres?, duree_secondes? } → 202 { session } ; suivi par session(id)
    generer: (data) => request('/generation-automatique/generer', { method: 'POST', body: data }),
    sessions: () => request('/generation-automatique/sessions'),
    session: (id) => request(`/generation-automatique/sessions/${id}`),
    arreter: (id) => request(`/generation-automatique/sessions/${id}/arreter`, { method: 'POST' }),
    snapshots: (params) => {
        const query = new URLSearchParams(params || {}).toString();
        return request(`/generation-automatique/snapshots${query ? `?${query}` : ''}`);
    },
    snapshot: (id) => request(`/generation-automatique/snapshots/${id}`),
    activerSnapshot: (id) => request(`/generation-automatique/snapshots/${id}/activate`, { method: 'POST' }),
    rollbackSnapshot: (id) => request(`/generation-automatique/snapshots/${id}/rollback`, { method: 'POST' }),
};

const avecQuery = (chemin, params) => {
    const query = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))).toString();
    return `${chemin}${query ? `?${query}` : ''}`;
};

/** Télécharge un fichier servi par l'API (cookies de session compris), sous le nom donné. */
export async function telecharger(endpoint, nomFichier) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = new Error(data.error || data.message || `Erreur ${response.status}`);
        error.status = response.status;
        throw error;
    }
    const url = URL.createObjectURL(await response.blob());
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(url);
}

// ==================== RÉSERVATIONS ET EXAMENS (phase P5) ====================
export const reservationAPI = {
    getAll: (params) => request(avecQuery('/reservations', params)),
    getById: (id) => request(`/reservations/${id}`),
    verifier: (data) => request('/reservations/verifier', { method: 'POST', body: data }),
    create: (data) => request('/reservations', { method: 'POST', body: data }),
    valider: (id, extra = {}) => request(`/reservations/${id}/valider`, { method: 'PATCH', body: extra }),
    refuser: (id, motif) => request(`/reservations/${id}/refuser`, { method: 'PATCH', body: { motif } }),
    annuler: (id) => request(`/reservations/${id}/annuler`, { method: 'PATCH' }),
};

export const examenAPI = {
    getAll: (params) => request(avecQuery('/examens', params)),
    getMesSurveillances: () => request('/examens/mes-surveillances'),
    getMesExamens: () => request('/examens/mes-examens'),
    getChargeSurveillances: (params) => request(avecQuery('/examens/surveillances/charge', params)),
    create: (data) => request('/examens', { method: 'POST', body: data }),
    update: (id, data) => request(`/examens/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/examens/${id}`, { method: 'DELETE' }),
    autoSurveillants: (id) => request(`/examens/${id}/surveillants/auto`, { method: 'POST' }),
    setSurveillants: (id, surveillances, extra = {}) => request(`/examens/${id}/surveillants`, { method: 'PUT', body: { surveillances, ...extra } }),
    publier: (id) => request(`/examens/${id}/publier`, { method: 'PATCH' }),
};

// ==================== IMPRÉVUS ET ASSISTANT DE CRÉNEAUX (phase P6, I8) ====================
export const imprevuAPI = {
    creneauxSeance: (data) => request('/imprevus/assistant/seances', { method: 'POST', body: data }),
    creneauxReservation: (data) => request('/imprevus/assistant/reservations', { method: 'POST', body: data }),
    declarerAbsence: (data) => request('/imprevus/absences', { method: 'POST', body: data }),
    remplacants: (idAffectation) => request(`/imprevus/seances/${idAffectation}/remplacants`),
    remplacer: (idAffectation, data) => request(`/imprevus/seances/${idAffectation}/remplacer`, { method: 'POST', body: data }),
    reloger: (idSalle, data) => request(`/imprevus/salles/${idSalle}/reloger`, { method: 'POST', body: data }),
    jour: (date, params) => request(avecQuery(`/imprevus/jour/${date}`, params)),
    annulerJour: (date, data) => request(`/imprevus/jour/${date}/annuler`, { method: 'POST', body: data }),
};

// ==================== SUIVI DU RÉALISÉ ET RETOURS (phase P7, I7) ====================
export const suiviAPI = {
    realiser: (idAffectation) => request(`/suivi/seances/${idAffectation}/realiser`, { method: 'PATCH' }),
    actualiser: () => request('/suivi/actualiser', { method: 'POST' }),
    modules: (params) => request(avecQuery('/suivi/modules', params)),
    enseignants: (mois) => request(avecQuery('/suivi/enseignants', { mois })),
    exportVacataires: (mois) => telecharger(`/suivi/vacataires.csv?mois=${mois}`, `heures-vacataires-${mois}.csv`),
    retoursADonner: () => request('/suivi/retours/a-donner'),
    deposerRetour: (idAffectation, data) => request(`/suivi/retours/seances/${idAffectation}`, { method: 'POST', body: data }),
    mesRetours: () => request('/suivi/retours/mes-modules'),
};

// ==================== PRÉPARATION DU SEMESTRE ET EDT MENSUEL (phase P4) ====================
export const preparationAPI = {
    etat: (idPeriode) => request(avecQuery('/preparation', { id_periode: idPeriode })),
    relancer: (data) => request('/preparation/relancer', { method: 'POST', body: data }),
    edtMensuel: (idGroupe, mois) => request(avecQuery(`/emplois-du-temps/groupe/${idGroupe}/mensuel`, { mois })),
};

// ==================== APPARTENANCES (groupe d'un étudiant) ====================
export const appartenanceAPI = {
    getByEtudiant: (idEtudiant) => request(`/appartenances/etudiant/${idEtudiant}`),
};

// ==================== JEUX (ClassQuiz, phase Q) ====================
export const quizAPI = {
    // { actif, url, peutLancer } : où envoyer l'enseignant pour lancer une partie
    getConfig: () => request('/quiz/config'),
    getPartiesEnCours: () => request('/quiz/parties/en-cours'),
};
