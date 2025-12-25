import jwt from "jsonwebtoken";
import { Users, Enseignant, Etudiant } from "../models/index.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/passwordHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Génère un token JWT pour un utilisateur
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId, id_user: userId },
        process.env.JWT_SECRET || "secret_key_default",
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
export const register = asyncHandler(async (req, res) => {
    const { nom, prenom, email, password, role, telephone } = req.body;

    // Validation des champs requis
    if (!nom || !prenom || !email || !password) {
        return res.status(400).json({
            message: "Champs manquants",
            error: "Les champs nom, prenom, email et password sont requis",
        });
    }

    // Validation du mot de passe
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({
            message: "Mot de passe invalide",
            errors: passwordValidation.errors,
        });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await Users.findOne({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            message: "Email déjà utilisé",
            error: "Un compte avec cet email existe déjà",
        });
    }

    // Hasher le mot de passe
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const user = await Users.create({
        nom,
        prenom,
        email,
        password_hash,
        role: role || "etudiant",
        telephone: telephone || null,
        actif: true,
    });

    // Générer le token
    const token = generateToken(user.id_user);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({
        message: "Inscription réussie",
        user: userResponse,
        token,
    });
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
        return res.status(400).json({
            message: "Champs manquants",
            error: "L'email et le mot de passe sont requis",
        });
    }

    // Trouver l'utilisateur par email
    const user = await Users.findOne({ where: { email } });
    if (!user) {
        return res.status(401).json({
            message: "Identifiants invalides",
            error: "Email ou mot de passe incorrect",
        });
    }

    // Vérifier que le compte est actif
    if (!user.actif) {
        return res.status(403).json({
            message: "Compte désactivé",
            error: "Votre compte a été désactivé. Contactez l'administrateur.",
        });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Identifiants invalides",
            error: "Email ou mot de passe incorrect",
        });
    }

    // Générer le token
    const token = generateToken(user.id_user);

    // Récupérer les informations complémentaires selon le rôle
    let additionalInfo = {};
    if (user.role === "enseignant") {
        const enseignant = await Enseignant.findByPk(user.id_user);
        if (enseignant) {
            additionalInfo = {
                specialite: enseignant.specialite,
                departement: enseignant.departement,
                grade: enseignant.grade,
                bureau: enseignant.bureau,
            };
        }
    } else if (user.role === "etudiant") {
        const etudiant = await Etudiant.findByPk(user.id_user);
        if (etudiant) {
            additionalInfo = {
                numero_etudiant: etudiant.numero_etudiant,
                niveau: etudiant.niveau,
                date_inscription: etudiant.date_inscription,
            };
        }
    }

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
        message: "Connexion réussie",
        user: {
            ...userResponse,
            ...additionalInfo,
        },
        token,
    });
});

/**
 * GET /api/auth/me
 * Récupérer le profil de l'utilisateur connecté
 */
export const getMe = asyncHandler(async (req, res) => {
    // L'utilisateur est déjà dans req.user grâce au middleware authenticateToken
    const user = req.user;

    // Récupérer les informations complémentaires selon le rôle
    let additionalInfo = {};
    if (user.role === "enseignant") {
        const enseignant = await Enseignant.findByPk(user.id_user);
        if (enseignant) {
            additionalInfo = {
                specialite: enseignant.specialite,
                departement: enseignant.departement,
                grade: enseignant.grade,
                bureau: enseignant.bureau,
            };
        }
    } else if (user.role === "etudiant") {
        const etudiant = await Etudiant.findByPk(user.id_user);
        if (etudiant) {
            additionalInfo = {
                numero_etudiant: etudiant.numero_etudiant,
                niveau: etudiant.niveau,
                date_inscription: etudiant.date_inscription,
            };
        }
    }

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
        user: {
            ...userResponse,
            ...additionalInfo,
        },
    });
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, le token est supprimé)
 * Cette route peut être utilisée pour logger la déconnexion
 */
export const logout = asyncHandler(async (req, res) => {
    // En JWT stateless, la déconnexion se fait côté client en supprimant le token
    // On peut logger la déconnexion ici si nécessaire
    res.json({
        message: "Déconnexion réussie",
    });
});

/**
 * POST /api/auth/refresh
 * Rafraîchir le token (optionnel)
 */
export const refreshToken = asyncHandler(async (req, res) => {
    // L'utilisateur est déjà dans req.user grâce au middleware authenticateToken
    const user = req.user;

    // Vérifier que le compte est actif
    if (!user.actif) {
        return res.status(403).json({
            message: "Compte désactivé",
            error: "Votre compte a été désactivé",
        });
    }

    // Générer un nouveau token
    const token = generateToken(user.id_user);

    res.json({
        message: "Token rafraîchi",
        token,
    });
});

