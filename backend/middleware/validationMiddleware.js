import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware pour gérer les résultats de validation
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Erreur de validation",
            errors: errors.array().map((err) => ({
                field: err.path || err.param,
                location: err.location,
                message: err.msg,
                value: err.value,
            })),
        });
    }
    next();
};

// ==================== VALIDATIONS USER ====================

export const validateUserCreation = [
    body("nom").trim().notEmpty().withMessage("Le nom est requis"),
    body("prenom").trim().notEmpty().withMessage("Le prénom est requis"),
    body("email").isEmail().withMessage("L'email doit être valide"),
    body("password_hash")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
    body("role")
        .optional()
        .isIn(["admin", "enseignant", "etudiant"])
        .withMessage("Rôle invalide"),
    body("telephone")
        .optional()
        .isMobilePhone()
        .withMessage("Numéro de téléphone invalide"),
    handleValidationErrors,
];

export const validateUserUpdate = [
    body("nom")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Le nom ne peut pas être vide"),
    body("prenom")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Le prénom ne peut pas être vide"),
    body("email").optional().isEmail().withMessage("L'email doit être valide"),
    body("role")
        .optional()
        .isIn(["admin", "enseignant", "etudiant"])
        .withMessage("Rôle invalide"),
    body("telephone")
        .optional()
        .isMobilePhone()
        .withMessage("Numéro de téléphone invalide"),
    body("actif")
        .optional()
        .isBoolean()
        .withMessage("Le champ actif doit être un booléen"),
    handleValidationErrors,
];

export const validateIdParam = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("L'ID doit être un entier positif"),
    handleValidationErrors,
];

// ==================== VALIDATIONS ENSEIGNANT ====================

export const validateEnseignantCreation = [
    body("id_user").isInt({ min: 1 }).withMessage("ID utilisateur invalide"),
    body("specialite")
        .trim()
        .notEmpty()
        .withMessage("La spécialité est requise"),
    body("departement")
        .trim()
        .notEmpty()
        .withMessage("Le département est requis"),
    body("grade").optional().trim(),
    body("bureau").optional().trim(),
    handleValidationErrors,
];

// ==================== VALIDATIONS ETUDIANT ====================

export const validateEtudiantCreation = [
    body("id_user").isInt({ min: 1 }).withMessage("ID utilisateur invalide"),
    body("numero_etudiant")
        .trim()
        .notEmpty()
        .withMessage("Le numéro d'étudiant est requis"),
    body("niveau").trim().notEmpty().withMessage("Le niveau est requis"),
    handleValidationErrors,
];

// ==================== VALIDATIONS FILIERE ====================

export const validateFiliereCreation = [
    body("code_filiere")
        .trim()
        .notEmpty()
        .withMessage("Le code de la filière est requis"),
    body("nom_filiere")
        .trim()
        .notEmpty()
        .withMessage("Le nom de la filière est requis"),
    body("description").optional().trim(),
    handleValidationErrors,
];

// ==================== VALIDATIONS GROUPE ====================

export const validateGroupeCreation = [
    body("nom_groupe")
        .trim()
        .notEmpty()
        .withMessage("Le nom du groupe est requis"),
    body("niveau").trim().notEmpty().withMessage("Le niveau est requis"),
    body("effectif")
        .optional()
        .isInt({ min: 0 })
        .withMessage("L'effectif doit être un entier positif"),
    body("annee_scolaire")
        .trim()
        .notEmpty()
        .withMessage("L'année scolaire est requise"),
    body("id_filiere").isInt({ min: 1 }).withMessage("ID filière invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS SALLE ====================

export const validateSalleCreation = [
    body("nom_salle")
        .trim()
        .notEmpty()
        .withMessage("Le nom de la salle est requis"),
    body("type_salle")
        .trim()
        .notEmpty()
        .withMessage("Le type de salle est requis"),
    body("capacite")
        .isInt({ min: 1 })
        .withMessage("La capacité doit être un entier positif"),
    body("batiment").trim().notEmpty().withMessage("Le bâtiment est requis"),
    body("etage").optional().isInt().withMessage("L'étage doit être un entier"),
    body("equipements").optional().trim(),
    body("disponible")
        .optional()
        .isBoolean()
        .withMessage("Le champ disponible doit être un booléen"),
    handleValidationErrors,
];

// ==================== VALIDATIONS COURS ====================

export const validateCoursCreation = [
    body("code_cours")
        .trim()
        .notEmpty()
        .withMessage("Le code du cours est requis"),
    body("nom_cours")
        .trim()
        .notEmpty()
        .withMessage("Le nom du cours est requis"),
    body("niveau").trim().notEmpty().withMessage("Le niveau est requis"),
    body("volume_horaire")
        .isInt({ min: 1 })
        .withMessage("Le volume horaire doit être un entier positif"),
    body("type_cours")
        .trim()
        .notEmpty()
        .withMessage("Le type de cours est requis"),
    body("semestre").trim().notEmpty().withMessage("Le semestre est requis"),
    body("coefficient")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Le coefficient doit être un nombre positif"),
    body("id_filiere").isInt({ min: 1 }).withMessage("ID filière invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS CRENEAU ====================

export const validateCreneauCreation = [
    body("jour_semaine")
        .isIn([
            "lundi",
            "mardi",
            "mercredi",
            "jeudi",
            "vendredi",
            "samedi",
            "dimanche",
        ])
        .withMessage("Jour de la semaine invalide"),
    body("heure_debut")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("Format d'heure de début invalide (HH:MM)"),
    body("heure_fin")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("Format d'heure de fin invalide (HH:MM)"),
    body("periode").optional().trim(),
    body("duree_minutes")
        .isInt({ min: 1 })
        .withMessage("La durée doit être un entier positif"),
    handleValidationErrors,
];

// ==================== VALIDATIONS AFFECTATION ====================

export const validateAffectationCreation = [
    body("date_seance")
        .isISO8601()
        .toDate()
        .withMessage("Format de date invalide (ISO 8601)"),
    body("statut")
        .optional()
        .isIn(["planifie", "confirme", "annule", "reporte"])
        .withMessage("Statut invalide"),
    body("commentaire").optional().trim(),
    body("id_cours").isInt({ min: 1 }).withMessage("ID cours invalide"),
    body("id_groupe").isInt({ min: 1 }).withMessage("ID groupe invalide"),
    body("id_user_enseignant")
        .isInt({ min: 1 })
        .withMessage("ID enseignant invalide"),
    body("id_salle").isInt({ min: 1 }).withMessage("ID salle invalide"),
    body("id_creneau").isInt({ min: 1 }).withMessage("ID créneau invalide"),
    body("id_user_admin")
        .isInt({ min: 1 })
        .withMessage("ID administrateur invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS DEMANDE REPORT ====================

export const validateDemandeReportCreation = [
    body("motif").trim().notEmpty().withMessage("Le motif est requis"),
    body("nouvelle_date")
        .isISO8601()
        .toDate()
        .withMessage("Format de date invalide (ISO 8601)"),
    body("statut_demande")
        .optional()
        .isIn(["en_attente", "approuve", "refuse"])
        .withMessage("Statut de demande invalide"),
    body("id_user_enseignant")
        .isInt({ min: 1 })
        .withMessage("ID enseignant invalide"),
    body("id_affectation")
        .isInt({ min: 1 })
        .withMessage("ID affectation invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS CONFLIT ====================

export const validateConflitCreation = [
    body("type_conflit")
        .isIn(["salle", "enseignant", "groupe"])
        .withMessage("Type de conflit invalide"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("La description est requise"),
    body("resolu")
        .optional()
        .isBoolean()
        .withMessage("Le champ resolu doit être un booléen"),
    handleValidationErrors,
];

// ==================== VALIDATIONS NOTIFICATION ====================

export const validateNotificationCreation = [
    body("titre").trim().notEmpty().withMessage("Le titre est requis"),
    body("message").trim().notEmpty().withMessage("Le message est requis"),
    body("type_notification")
        .optional()
        .isIn(["info", "warning", "error", "success"])
        .withMessage("Type de notification invalide"),
    body("id_user").isInt({ min: 1 }).withMessage("ID utilisateur invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS DISPONIBILITE ====================

export const validateDisponibiliteCreation = [
    body("disponible")
        .optional()
        .isBoolean()
        .withMessage("Le champ disponible doit être un booléen"),
    body("raison_indisponibilite").optional().trim(),
    body("date_debut")
        .isISO8601()
        .toDate()
        .withMessage("Format de date de début invalide (ISO 8601)"),
    body("date_fin")
        .isISO8601()
        .toDate()
        .withMessage("Format de date de fin invalide (ISO 8601)"),
    body("id_user_enseignant")
        .isInt({ min: 1 })
        .withMessage("ID enseignant invalide"),
    body("id_creneau").isInt({ min: 1 }).withMessage("ID créneau invalide"),
    handleValidationErrors,
];

// ==================== VALIDATIONS APPARTENIR ====================

export const validateAppartenirCreation = [
    body("id_user_etudiant")
        .isInt({ min: 1 })
        .withMessage("ID étudiant invalide"),
    body("id_groupe").isInt({ min: 1 }).withMessage("ID groupe invalide"),
    handleValidationErrors,
];
