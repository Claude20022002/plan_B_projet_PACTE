import { body, param, query, validationResult } from "express-validator";
import {
    TYPES_SALLE,
    RESERVABLE_PAR,
    REGIMES,
    VARIANTES_GRILLE,
    JOURS_SEMAINE,
    TYPES_EVENEMENT,
    PORTEES_EVENEMENT,
    CODES_PERIODE,
    normaliserTypeSalle,
} from "../config/referentiel.js";

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

// Téléphone facultatif : vide accepté, sinon chiffres et séparateurs usuels (+212 522 000 001)
const telephoneOptionnel = () =>
    body("telephone")
        .optional({ values: "falsy" })
        .isString()
        .matches(/^[\d\s\-+()]{6,20}$/)
        .withMessage("Numéro de téléphone invalide");

export const validateUserCreation = [
    body("nom").trim().notEmpty().withMessage("Le nom est requis"),
    body("prenom").trim().notEmpty().withMessage("Le prénom est requis"),
    body("email").isEmail().withMessage("L'email doit être valide"),
    body("password")
        .isString()
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
    body("role")
        .optional()
        .isIn(["admin", "enseignant", "etudiant"])
        .withMessage("Rôle invalide"),
    telephoneOptionnel(),
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
    telephoneOptionnel(),
    body("avatar_url")
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 10000000 }) // Limite de ~10MB pour les images base64
        .withMessage("L'avatar doit être une chaîne de caractères valide"),
    body("password")
        .optional({ values: "falsy" })
        .isString()
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
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

// Champs communs création / modification ; `requis` rend obligatoires ceux d'une création
const champsSalle = (requis) => {
    const champ = (nom) => (requis ? body(nom) : body(nom).optional());
    return [
        champ("nom_salle").isString().trim().notEmpty().withMessage("Le nom de la salle est requis"),
        champ("type_salle")
            .customSanitizer(normaliserTypeSalle)
            .isIn(TYPES_SALLE)
            .withMessage(`Type de salle invalide (${TYPES_SALLE.join(", ")})`),
        champ("capacite").isInt({ min: 1 }).withMessage("La capacité doit être un entier positif"),
        champ("id_campus").isInt({ min: 1 }).withMessage("Le campus est requis"),
        body("capacite_examen")
            .optional({ nullable: true })
            .isInt({ min: 0 })
            .withMessage("La capacité d'examen doit être un entier positif"),
        body("etage").optional({ nullable: true }).isInt().withMessage("L'étage doit être un entier"),
        body("equipements")
            .optional({ nullable: true })
            .custom((v) => typeof v === "string" || (Array.isArray(v) && v.every((item) => typeof item === "string")))
            .withMessage("Les équipements sont une liste de libellés"),
        body("reservable_par").optional().isIn(RESERVABLE_PAR).withMessage("reservable_par : admin ou enseignants"),
        body("disponible").optional().isBoolean().withMessage("Le champ disponible doit être un booléen"),
        handleValidationErrors,
    ];
};

export const validateSalleCreation = champsSalle(true);
export const validateSalleUpdate = champsSalle(false);

// ==================== VALIDATIONS RÉFÉRENTIEL (phase P1) ====================

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const validateCampus = (requis) => [
    (requis ? body("code") : body("code").optional())
        .isString()
        .trim()
        .matches(/^[A-Za-z0-9]{1,10}$/)
        .withMessage("Code campus : 1 à 10 lettres ou chiffres"),
    (requis ? body("nom") : body("nom").optional()).isString().trim().notEmpty().withMessage("Le nom du campus est requis"),
    body("adresse").optional({ nullable: true }).isString().trim(),
    body("actif").optional().isBoolean(),
    handleValidationErrors,
];

export const validateTrajet = [
    body("id_campus_a").isInt({ min: 1 }).withMessage("Premier campus requis"),
    body("id_campus_b").isInt({ min: 1 }).withMessage("Second campus requis"),
    body("minutes").isInt({ min: 0, max: 240 }).withMessage("Minutes : entier entre 0 et 240"),
    handleValidationErrors,
];

export const validateAnnee = (requis) => [
    (requis ? body("libelle") : body("libelle").optional())
        .matches(/^\d{4}-\d{4}$/)
        .withMessage("Libellé au format 2026-2027"),
    (requis ? body("date_debut") : body("date_debut").optional()).matches(DATE_ISO).withMessage("Date de début AAAA-MM-JJ"),
    (requis ? body("date_fin") : body("date_fin").optional()).matches(DATE_ISO).withMessage("Date de fin AAAA-MM-JJ"),
    body("active").optional().isBoolean(),
    handleValidationErrors,
];

export const validatePeriode = (requis) => [
    (requis ? body("code") : body("code").optional()).isIn(CODES_PERIODE).withMessage("Code de semestre : S1 ou S2"),
    body("libelle").optional({ nullable: true }).isString().trim(),
    (requis ? body("date_debut") : body("date_debut").optional()).matches(DATE_ISO).withMessage("Date de début AAAA-MM-JJ"),
    (requis ? body("date_fin") : body("date_fin").optional()).matches(DATE_ISO).withMessage("Date de fin AAAA-MM-JJ"),
    (requis ? body("nb_semaines") : body("nb_semaines").optional())
        .isInt({ min: 1, max: 30 })
        .withMessage("Nombre de semaines : entre 1 et 30"),
    handleValidationErrors,
];

export const validateEvenement = (requis) => [
    (requis ? body("titre") : body("titre").optional()).isString().trim().notEmpty().withMessage("Le titre est requis"),
    body("description").optional({ nullable: true }).isString(),
    (requis ? body("date_debut") : body("date_debut").optional()).matches(DATE_ISO).withMessage("Date de début AAAA-MM-JJ"),
    (requis ? body("date_fin") : body("date_fin").optional()).matches(DATE_ISO).withMessage("Date de fin AAAA-MM-JJ"),
    body("type_evenement").optional().isIn(TYPES_EVENEMENT).withMessage("Type d'événement invalide"),
    body("bloque_affectations").optional().isBoolean(),
    body("portee").optional().isIn(PORTEES_EVENEMENT).withMessage("Portée invalide"),
    body("id_cible").optional({ nullable: true }).isInt({ min: 1 }),
    body("niveau").optional({ nullable: true }).isString().trim(),
    body("date_confirmee").optional().isBoolean(),
    handleValidationErrors,
];

export const validateConfirmationEvenement = [
    body("date_debut").optional().matches(DATE_ISO).withMessage("Date de début AAAA-MM-JJ"),
    body("date_fin").optional().matches(DATE_ISO).withMessage("Date de fin AAAA-MM-JJ"),
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
    // Calculée à partir des heures si elle est absente
    body("duree_minutes")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La durée doit être un entier positif"),
    body("regime").optional().isIn(REGIMES).withMessage(`Régime invalide (${REGIMES.join(", ")})`),
    body("variante").optional().isIn(VARIANTES_GRILLE).withMessage("Variante : normale ou ramadan"),
    handleValidationErrors,
];

export const validateCreneauUpdate = [
    body("jour_semaine").optional().isIn(JOURS_SEMAINE).withMessage("Jour de la semaine invalide"),
    body("heure_debut")
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/)
        .withMessage("Format d'heure de début invalide (HH:MM)"),
    body("heure_fin")
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/)
        .withMessage("Format d'heure de fin invalide (HH:MM)"),
    body("duree_minutes").optional().isInt({ min: 1 }),
    body("regime").optional().isIn(REGIMES).withMessage("Régime invalide"),
    body("variante").optional().isIn(VARIANTES_GRILLE).withMessage("Variante : normale ou ramadan"),
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
    // id_user_admin n'est plus attendu du client : il est pris dans la session
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
