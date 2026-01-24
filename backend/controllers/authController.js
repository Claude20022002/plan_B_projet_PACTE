import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Users, Enseignant, Etudiant, PasswordResetToken } from "../models/index.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/passwordHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

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
    // Recharger l'utilisateur depuis la base de données pour avoir les données à jour
    const user = await Users.findByPk(req.user.id_user, {
        attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: "L'utilisateur n'existe plus",
        });
    }

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

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email requis",
            error: "Veuillez fournir votre adresse email",
        });
    }

    // Trouver l'utilisateur
    const user = await Users.findOne({ where: { email } });
    
    // Pour la sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
        // Retourner un succès même si l'utilisateur n'existe pas (sécurité)
        return res.json({
            message: "Si cet email existe, un lien de réinitialisation a été envoyé",
        });
    }

    // Vérifier que le compte est actif
    if (!user.actif) {
        return res.status(403).json({
            message: "Compte désactivé",
            error: "Votre compte a été désactivé. Contactez l'administrateur.",
        });
    }

    // Générer un token unique
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Expiration dans 1 heure
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await PasswordResetToken.destroy({
        where: {
            id_user: user.id_user,
            used: false,
        },
    });

    // Créer le nouveau token
    await PasswordResetToken.create({
        id_user: user.id_user,
        token: hashedToken,
        expires_at: expiresAt,
        used: false,
    });

    // URL de réinitialisation (à adapter selon votre frontend)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}&id=${user.id_user}`;

    // Envoyer l'email
    try {
        await sendEmail({
            to: user.email,
            subject: "Réinitialisation de votre mot de passe - HESTIM Planner",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1976d2;">Réinitialisation de mot de passe</h2>
                    <p>Bonjour ${user.prenom} ${user.nom},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>
                    <p style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ou copiez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                    <p style="color: #d32f2f; font-size: 12px;">
                        ⚠️ Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Cordialement,<br>
                        L'équipe HESTIM Planner
                    </p>
                </div>
            `,
            text: `
Réinitialisation de mot de passe

Bonjour ${user.prenom} ${user.nom},

Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien suivant :

${resetUrl}

Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe HESTIM Planner
            `,
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        // Ne pas révéler l'erreur à l'utilisateur
    }

    res.json({
        message: "Si cet email existe, un lien de réinitialisation a été envoyé",
    });
});

/**
 * POST /api/auth/reset-password
 * Réinitialisation du mot de passe avec token
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, id_user, password } = req.body;

    if (!token || !id_user || !password) {
        return res.status(400).json({
            message: "Champs manquants",
            error: "Le token, l'ID utilisateur et le nouveau mot de passe sont requis",
        });
    }

    // Hasher le token pour la comparaison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Trouver le token de réinitialisation
    const resetToken = await PasswordResetToken.findOne({
        where: {
            token: hashedToken,
            id_user: id_user,
            used: false,
        },
        include: [
            {
                model: Users,
                as: "user",
            },
        ],
    });

    if (!resetToken) {
        return res.status(400).json({
            message: "Token invalide",
            error: "Le lien de réinitialisation est invalide ou a déjà été utilisé",
        });
    }

    // Vérifier l'expiration
    if (new Date() > resetToken.expires_at) {
        await resetToken.update({ used: true });
        return res.status(400).json({
            message: "Token expiré",
            error: "Le lien de réinitialisation a expiré. Veuillez faire une nouvelle demande",
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

    // Mettre à jour le mot de passe
    const user = resetToken.user;
    const password_hash = await hashPassword(password);
    await user.update({ password_hash });

    // Marquer le token comme utilisé
    await resetToken.update({ used: true });

    res.json({
        message: "Mot de passe réinitialisé avec succès",
    });
});
