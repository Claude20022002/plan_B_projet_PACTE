/**
 * Interfaces TypeScript pour l'API HESTIM Planner
 * Utilisez ces interfaces dans votre projet frontend pour une meilleure autocomplétion
 */

// ==================== UTILISATEUR ====================

export interface User {
    id_user: number;
    nom: string;
    prenom: string;
    email: string;
    password_hash?: string; // Exclu dans les réponses GET
    role: "admin" | "enseignant" | "etudiant";
    telephone?: string;
    actif: boolean;
    avatar_url?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserDTO {
    nom: string;
    prenom: string;
    email: string;
    password_hash: string;
    role?: "admin" | "enseignant" | "etudiant";
    telephone?: string;
    actif?: boolean;
    avatar_url?: string;
}

export interface UpdateUserDTO {
    nom?: string;
    prenom?: string;
    email?: string;
    role?: "admin" | "enseignant" | "etudiant";
    telephone?: string;
    actif?: boolean;
    avatar_url?: string;
}

// ==================== ENSEIGNANT ====================

export interface Enseignant {
    id_user: number;
    specialite: string;
    departement: string;
    grade?: string;
    bureau?: string;
    user?: User;
}

export interface CreateEnseignantDTO {
    id_user: number;
    specialite: string;
    departement: string;
    grade?: string;
    bureau?: string;
}

// ==================== ÉTUDIANT ====================

export interface Etudiant {
    id_user: number;
    numero_etudiant: string;
    niveau: string;
    date_inscription: string;
    user?: User;
}

export interface CreateEtudiantDTO {
    id_user: number;
    numero_etudiant: string;
    niveau: string;
    date_inscription?: string;
}

// ==================== FILIÈRE ====================

export interface Filiere {
    id_filiere: number;
    code_filiere: string;
    nom_filiere: string;
    description?: string;
}

export interface CreateFiliereDTO {
    code_filiere: string;
    nom_filiere: string;
    description?: string;
}

// ==================== GROUPE ====================

export interface Groupe {
    id_groupe: number;
    nom_groupe: string;
    niveau: string;
    effectif: number;
    annee_scolaire: string;
    id_filiere: number;
    filiere?: Filiere;
}

export interface CreateGroupeDTO {
    nom_groupe: string;
    niveau: string;
    effectif?: number;
    annee_scolaire: string;
    id_filiere: number;
}

// ==================== SALLE ====================

export interface Salle {
    id_salle: number;
    nom_salle: string;
    type_salle: string;
    capacite: number;
    batiment: string;
    etage?: number;
    equipements?: string;
    disponible: boolean;
}

export interface CreateSalleDTO {
    nom_salle: string;
    type_salle: string;
    capacite: number;
    batiment: string;
    etage?: number;
    equipements?: string;
    disponible?: boolean;
}

// ==================== COURS ====================

export interface Cours {
    id_cours: number;
    code_cours: string;
    nom_cours: string;
    niveau: string;
    volume_horaire: number;
    type_cours: string;
    semestre: string;
    coefficient: number;
    id_filiere: number;
    filiere?: Filiere;
}

export interface CreateCoursDTO {
    code_cours: string;
    nom_cours: string;
    niveau: string;
    volume_horaire: number;
    type_cours: string;
    semestre: string;
    coefficient?: number;
    id_filiere: number;
}

// ==================== CRÉNEAU ====================

export interface Creneau {
    id_creneau: number;
    jour_semaine:
        | "lundi"
        | "mardi"
        | "mercredi"
        | "jeudi"
        | "vendredi"
        | "samedi"
        | "dimanche";
    heure_debut: string; // Format HH:MM
    heure_fin: string; // Format HH:MM
    periode?: string;
    duree_minutes: number;
}

export interface CreateCreneauDTO {
    jour_semaine:
        | "lundi"
        | "mardi"
        | "mercredi"
        | "jeudi"
        | "vendredi"
        | "samedi"
        | "dimanche";
    heure_debut: string;
    heure_fin: string;
    periode?: string;
    duree_minutes: number;
}

// ==================== AFFECTATION ====================

export interface Affectation {
    id_affectation: number;
    date_seance: string; // Format YYYY-MM-DD
    statut: "planifie" | "confirme" | "annule" | "reporte";
    commentaire?: string;
    id_cours: number;
    id_groupe: number;
    id_user_enseignant: number;
    id_salle: number;
    id_creneau: number;
    id_user_admin: number;
    cours?: Cours;
    groupe?: Groupe;
    enseignant?: User;
    salle?: Salle;
    creneau?: Creneau;
    admin_createur?: User;
}

export interface CreateAffectationDTO {
    date_seance: string;
    statut?: "planifie" | "confirme" | "annule" | "reporte";
    commentaire?: string;
    id_cours: number;
    id_groupe: number;
    id_user_enseignant: number;
    id_salle: number;
    id_creneau: number;
    id_user_admin: number;
}

// ==================== DEMANDE DE REPORT ====================

export interface DemandeReport {
    id_demande: number;
    date_demande: string;
    motif: string;
    nouvelle_date: string;
    statut_demande: "en_attente" | "approuve" | "refuse";
    id_user_enseignant: number;
    id_affectation: number;
    enseignant?: User;
    affectation?: Affectation;
}

export interface CreateDemandeReportDTO {
    motif: string;
    nouvelle_date: string;
    statut_demande?: "en_attente" | "approuve" | "refuse";
    id_user_enseignant: number;
    id_affectation: number;
}

// ==================== CONFLIT ====================

export interface Conflit {
    id_conflit: number;
    type_conflit: "salle" | "enseignant" | "groupe";
    description: string;
    date_detection: string;
    resolu: boolean;
    date_resolution?: string;
    affectations?: Affectation[];
}

export interface CreateConflitDTO {
    type_conflit: "salle" | "enseignant" | "groupe";
    description: string;
    resolu?: boolean;
}

// ==================== NOTIFICATION ====================

export interface Notification {
    id_notification: number;
    titre: string;
    message: string;
    type_notification: "info" | "warning" | "error" | "success";
    lue: boolean;
    date_envoi: string;
    id_user: number;
    user?: User;
}

export interface CreateNotificationDTO {
    titre: string;
    message: string;
    type_notification?: "info" | "warning" | "error" | "success";
    id_user: number;
}

// ==================== HISTORIQUE ====================

export interface HistoriqueAffectation {
    id_historique: number;
    action: "creation" | "modification" | "suppression" | "annulation";
    date_action: string;
    anciens_donnees?: any; // JSON
    nouveaux_donnees?: any; // JSON
    commentaire?: string;
    id_affectation: number;
    id_user?: number;
    affectation?: Affectation;
    user_modificateur?: User;
}

export interface CreateHistoriqueDTO {
    action: "creation" | "modification" | "suppression" | "annulation";
    anciens_donnees?: any;
    nouveaux_donnees?: any;
    commentaire?: string;
    id_affectation: number;
    id_user?: number;
}

// ==================== DISPONIBILITÉ ====================

export interface Disponibilite {
    id_disponibilite: number;
    disponible: boolean;
    raison_indisponibilite?: string;
    date_debut: string;
    date_fin: string;
    id_user_enseignant: number;
    id_creneau: number;
    enseignant?: User;
    creneau?: Creneau;
}

export interface CreateDisponibiliteDTO {
    disponible?: boolean;
    raison_indisponibilite?: string;
    date_debut: string;
    date_fin: string;
    id_user_enseignant: number;
    id_creneau: number;
}

// ==================== APPARTENIR ====================

export interface Appartenir {
    id_user_etudiant: number;
    id_groupe: number;
    etudiant?: Etudiant;
    groupe?: Groupe;
}

export interface CreateAppartenirDTO {
    id_user_etudiant: number;
    id_groupe: number;
}

// ==================== RÉPONSES D'ERREUR ====================

export interface ApiError {
    message: string;
    error?: string;
    errors?: ValidationError[];
    details?: any;
}

export interface ValidationError {
    field: string;
    message: string;
    location?: "body" | "params" | "query";
    value?: any;
}

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: ApiError;
}

// ==================== PAGINATION (pour future implémentation) ====================

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==================== FILTRES ET RECHERCHE ====================

export interface FilterOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    search?: string;
}

export interface AffectationFilters extends FilterOptions {
    date_seance?: string;
    id_user_enseignant?: number;
    id_groupe?: number;
    id_salle?: number;
    statut?: "planifie" | "confirme" | "annule" | "reporte";
}
