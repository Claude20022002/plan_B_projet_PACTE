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
    ECOLES,
    CYCLES,
    TYPES_GROUPE,
    TYPES_COMPOSANTE,
    NIVEAUX_GROUPE,
    MODALITES,
    STATUTS_ENSEIGNANT,
    ROLES_SERVICE,
    TYPES_RESERVATION,
    ROLES_PARTICIPANT,
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
    // Facultatif : sans mot de passe, le compte reçoit un lien d'invitation
    body("password")
        .optional({ checkFalsy: true })
        .isString()
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
    body("role")
        .optional()
        .isIn(["admin", "enseignant", "etudiant"])
        .withMessage("Rôle invalide"),
    telephoneOptionnel(),
    body("profil").optional().isObject().withMessage("Fiche invalide"),
    body("profil.id_groupe").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Groupe invalide"),
    body("profil.statut").optional().isIn(["permanent", "vacataire"]).withMessage("Statut invalide"),
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

export const validateEnseignantUpdate = [
    body("specialite").optional().trim().notEmpty(),
    body("departement").optional().trim().notEmpty(),
    body("grade").optional({ nullable: true }).trim(),
    body("bureau").optional({ nullable: true }).trim(),
    body("statut").optional().isIn(STATUTS_ENSEIGNANT).withMessage("Statut : permanent ou vacataire"),
    body("service_annuel_heures").optional({ nullable: true }).isInt({ min: 0, max: 1000 }).withMessage("Service annuel : 0 à 1000 heures"),
    body("max_heures_semaine").optional({ nullable: true }).isInt({ min: 1, max: 60 }).withMessage("Maximum hebdomadaire : 1 à 60 heures"),
    body("id_campus_prefere").optional({ nullable: true }).isInt({ min: 1 }),
    body("entreprise").optional({ nullable: true }).isString().trim(),
    handleValidationErrors,
];

export const validateCompetences = [
    body("cours").isArray().withMessage("Liste de modules (ids) attendue"),
    body("cours.*").isInt({ min: 1 }),
    handleValidationErrors,
];

export const validateService = (requis) => [
    ...(requis ? [body("id_user").isInt({ min: 1 }).withMessage("Enseignant requis")] : []),
    body("role").optional().isIn(ROLES_SERVICE).withMessage("Rôle : principal ou co_enseignant"),
    body("heures").optional({ nullable: true }).isFloat({ min: 0.5, max: 500 }).withMessage("Heures : entre 0,5 et 500"),
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

// Champs de filière ajoutés en phase P2 (école, cycle, campus préféré, double diplôme)
const champsFiliereP2 = () => [
    body("description").optional({ nullable: true }).trim(),
    body("regime").optional().isIn(REGIMES).withMessage("Régime invalide"),
    body("ecole").optional().isIn(ECOLES).withMessage("École : engineering ou business"),
    body("cycle").optional({ nullable: true }).isIn(CYCLES).withMessage(`Cycle invalide (${CYCLES.join(", ")})`),
    body("intitule_cycle").optional({ nullable: true }).isString().trim(),
    body("premiere_annee_cycle").optional({ nullable: true }).isInt({ min: 1, max: 6 }).withMessage("Première année du cycle : 1 à 6"),
    body("id_campus_prefere").optional({ nullable: true }).isInt({ min: 1 }),
    body("partenaire").optional({ nullable: true }).isString().trim(),
    body("annees_a_hestim").optional({ nullable: true }).isInt({ min: 1, max: 6 }).withMessage("Années à HESTIM : 1 à 6"),
];

export const validateFiliereCreation = [
    body("code_filiere")
        .trim()
        .notEmpty()
        .withMessage("Le code de la filière est requis"),
    body("nom_filiere")
        .trim()
        .notEmpty()
        .withMessage("Le nom de la filière est requis"),
    ...champsFiliereP2(),
    handleValidationErrors,
];

export const validateFiliereUpdate = [
    body("code_filiere").optional().trim().notEmpty().withMessage("Le code de la filière ne peut pas être vide"),
    body("nom_filiere").optional().trim().notEmpty().withMessage("Le nom de la filière ne peut pas être vide"),
    ...champsFiliereP2(),
    handleValidationErrors,
];

// ==================== VALIDATIONS GROUPE ====================

const champsGroupeP2 = () => [
    body("type_groupe").optional().isIn(TYPES_GROUPE).withMessage("Type de groupe : promotion, td ou tp"),
    body("id_groupe_parent").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Groupe parent invalide"),
    body("annee").optional({ nullable: true }).isInt({ min: 1, max: 6 }).withMessage("Année d'études : 1 à 6"),
];

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
    ...champsGroupeP2(),
    handleValidationErrors,
];

export const validateGroupeUpdate = [
    body("nom_groupe").optional().trim().notEmpty().withMessage("Le nom du groupe ne peut pas être vide"),
    body("niveau").optional().trim().notEmpty(),
    body("effectif").optional().isInt({ min: 0 }).withMessage("L'effectif doit être un entier positif"),
    body("annee_scolaire").optional().trim().notEmpty(),
    body("id_filiere").optional().isInt({ min: 1 }).withMessage("ID filière invalide"),
    ...champsGroupeP2(),
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
const HEURE = /^([01]\d|2[0-3]):[0-5]\d(:00)?$/;

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
    body("heure_debut").optional({ nullable: true, values: "falsy" }).matches(HEURE).withMessage("Heure de début HH:MM"),
    body("heure_fin").optional({ nullable: true, values: "falsy" }).matches(HEURE).withMessage("Heure de fin HH:MM"),
    handleValidationErrors,
];

export const validateConfirmationEvenement = [
    body("date_debut").optional().matches(DATE_ISO).withMessage("Date de début AAAA-MM-JJ"),
    body("date_fin").optional().matches(DATE_ISO).withMessage("Date de fin AAAA-MM-JJ"),
    handleValidationErrors,
];

// ==================== VALIDATIONS COURS ====================

const champsCoursP2 = () => [
    body("ects").optional({ nullable: true }).isFloat({ min: 0, max: 60 }).withMessage("ECTS : entre 0 et 60"),
    body("id_responsable").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Responsable invalide"),
];

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
    ...champsCoursP2(),
    handleValidationErrors,
];

export const validateCoursUpdate = [
    body("code_cours").optional().trim().notEmpty(),
    body("nom_cours").optional().trim().notEmpty(),
    body("niveau").optional().trim().notEmpty(),
    body("volume_horaire").optional().isInt({ min: 1 }),
    body("type_cours").optional().trim().notEmpty(),
    body("semestre").optional().matches(/^S([1-9]|10)$/).withMessage("Semestre : S1 à S10"),
    body("coefficient").optional().isFloat({ min: 0 }),
    body("id_filiere").optional().isInt({ min: 1 }),
    ...champsCoursP2(),
    handleValidationErrors,
];

// ==================== VALIDATIONS COMPOSANTE (phase P2) ====================

export const validateComposante = (requis) => [
    (requis ? body("type") : body("type").optional()).isIn(TYPES_COMPOSANTE).withMessage("Type : CM, TD, TP ou Projet"),
    (requis ? body("volume_heures") : body("volume_heures").optional())
        .isFloat({ min: 0.5, max: 500 })
        .withMessage("Volume horaire : entre 0,5 et 500 heures"),
    body("type_salle_requis")
        .optional({ nullable: true, values: "falsy" })
        .isIn(TYPES_SALLE)
        .withMessage("Type de salle requis inconnu"),
    body("equipements_requis")
        .optional({ nullable: true })
        .custom((v) => Array.isArray(v) && v.every((item) => typeof item === "string"))
        .withMessage("Équipements requis : liste de libellés"),
    body("niveau_groupe").optional().isIn(NIVEAUX_GROUPE).withMessage("Groupe visé : promotion, td ou tp"),
    body("creneaux_par_seance").optional().isInt({ min: 1, max: 4 }).withMessage("Créneaux par séance : 1 à 4"),
    body("modalite").optional().isIn(MODALITES).withMessage("Modalité : presentiel, distanciel ou hybride"),
    body("mention").optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
    body("semaine_debut").optional({ nullable: true }).isInt({ min: 1, max: 30 }).withMessage("Semaine de début : 1 à 30"),
    body("semaine_fin").optional({ nullable: true }).isInt({ min: 1, max: 30 }).withMessage("Semaine de fin : 1 à 30"),
    body("seances_par_semaine").optional({ nullable: true }).isInt({ min: 1, max: 20 }).withMessage("Séances par semaine : 1 à 20"),
    handleValidationErrors,
];

// ==================== VALIDATIONS ENSEIGNEMENT (phase P2) ====================

export const validateGenerationEnseignements = [
    body("id_periode").isInt({ min: 1 }).withMessage("Période requise"),
    body("id_filiere").optional({ nullable: true }).isInt({ min: 1 }),
    handleValidationErrors,
];

export const validateFusionEnseignements = [
    body("ids").isArray({ min: 2 }).withMessage("Sélectionnez au moins deux enseignements"),
    body("ids.*").isInt({ min: 1 }),
    handleValidationErrors,
];

export const validateEnseignementUpdate = [
    body("heures_prevues").optional().isFloat({ min: 0.5, max: 500 }).withMessage("Volume prévu : entre 0,5 et 500 heures"),
    body("libelle").optional({ nullable: true }).isString().trim().isLength({ max: 150 }),
    body("id_periode").optional({ nullable: true }).isInt({ min: 1 }),
    body("groupes").optional().isArray({ min: 1 }).withMessage("Au moins un groupe"),
    body("groupes.*").optional().isInt({ min: 1 }),
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

// Champs communs à la création, la modification et la vérification d'une séance
const champsSeance = (requis) => {
    const champ = (nom) => (requis ? body(nom) : body(nom).optional());
    return [
        champ("date_seance").isISO8601({ strict: true }).withMessage("Format de date invalide (AAAA-MM-JJ)"),
        body("statut").optional().isIn(["planifie", "confirme", "annule", "reporte", "realise"]).withMessage("Statut invalide"),
        body("commentaire").optional({ nullable: true }).trim(),
        champ("id_cours").isInt({ min: 1 }).withMessage("ID cours invalide"),
        champ("id_groupe").isInt({ min: 1 }).withMessage("ID groupe invalide"),
        champ("id_user_enseignant").isInt({ min: 1 }).withMessage("ID enseignant invalide"),
        // Facultative : une séance en distanciel n'a pas de salle
        body("id_salle").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage("ID salle invalide"),
        champ("id_creneau").isInt({ min: 1 }).withMessage("ID créneau invalide"),
        body("id_enseignement").optional({ nullable: true }).isInt({ min: 1 }).withMessage("ID enseignement invalide"),
        // Forçage d'une séance qui enfreint des règles : réservé à l'admin, justification obligatoire
        body("forcer").optional().isBoolean({ strict: true }).withMessage("forcer doit être un booléen"),
        body("justification").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
    ];
};

export const validateAffectationCreation = [
    ...champsSeance(true),
    // id_user_admin n'est plus attendu du client : il est pris dans la session
    handleValidationErrors,
];

export const validateAffectationUpdate = [...champsSeance(false), handleValidationErrors];

// ==================== VALIDATIONS RÉSERVATION (phase P5) ====================
const HEURE_RESA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
export const validateReservation = [
    body("type").isIn(TYPES_RESERVATION).withMessage("Type de réservation invalide"),
    body("titre").trim().notEmpty().isLength({ max: 255 }).withMessage("Le titre est requis"),
    body("description").optional({ nullable: true }).isString().trim(),
    body("id_salle").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage("Salle invalide"),
    body("date").isISO8601({ strict: true }).withMessage("Date invalide (AAAA-MM-JJ)"),
    body("heure_debut").matches(HEURE_RESA).withMessage("Heure de début invalide (HH:MM)"),
    body("heure_fin").matches(HEURE_RESA).withMessage("Heure de fin invalide (HH:MM)"),
    body("id_affectation_origine").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Séance d'origine invalide"),
    body("participants").optional().isArray({ max: 200 }).withMessage("Participants invalides"),
    body("participants.*.id_user").optional({ nullable: true }).isInt({ min: 1 }),
    body("participants.*.id_groupe").optional({ nullable: true }).isInt({ min: 1 }),
    body("participants.*.role").optional().isIn(ROLES_PARTICIPANT).withMessage("Rôle de participant invalide"),
    body("forcer").optional().isBoolean({ strict: true }),
    body("justification").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
    handleValidationErrors,
];

// Épreuve d'examen : tout est requis à la création, facultatif en modification
export const validateExamen = (requis) => {
    const champ = (nom) => (requis ? body(nom) : body(nom).optional());
    return [
        champ("titre").trim().notEmpty().isLength({ max: 255 }).withMessage("Le titre est requis"),
        champ("id_cours").isInt({ min: 1 }).withMessage("Module invalide"),
        body("id_periode").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Période invalide"),
        body("nature").optional().isIn(["examen", "controle"]).withMessage("Nature invalide (examen ou controle)"),
        champ("date").isISO8601({ strict: true }).withMessage("Date invalide (AAAA-MM-JJ)"),
        champ("heure_debut").matches(HEURE_RESA).withMessage("Heure de début invalide (HH:MM)"),
        champ("heure_fin").matches(HEURE_RESA).withMessage("Heure de fin invalide (HH:MM)"),
        champ("groupes").isArray({ min: 1, max: 50 }).withMessage("Choisissez au moins un groupe"),
        body("groupes.*").optional().isInt({ min: 1 }),
        champ("salles").isArray({ min: 1, max: 30 }).withMessage("Choisissez au moins une salle"),
        body("salles.*.id_salle").optional().isInt({ min: 1 }),
        body("salles.*.effectif").optional({ nullable: true }).isInt({ min: 0 }),
        body("forcer").optional().isBoolean({ strict: true }),
        body("justification").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
        handleValidationErrors,
    ];
};

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
    // Ignoré : l'enseignant est celui de la séance (décidé par le serveur)
    body("id_user_enseignant").optional().isInt({ min: 1 }).withMessage("ID enseignant invalide"),
    body("id_affectation")
        .isInt({ min: 1 })
        .withMessage("ID affectation invalide"),
    body("id_creneau_nouveau").optional({ nullable: true }).isInt({ min: 1 }).withMessage("ID créneau invalide"),
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
