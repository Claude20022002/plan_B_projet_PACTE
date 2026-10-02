import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { AuthSession, Institution, InstitutionUser, Users, Enseignant, Etudiant, PasswordResetToken } from "../models/index.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/passwordHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
    ACCESS_TOKEN_TTL_SECONDS,
    clearAuthCookies,
    makeRefreshExpiry,
    randomToken,
    REFRESH_COOKIE,
    setAuthCookies,
    setCsrfCookie,
    sha256,
} from "../config/authCookies.js";
import { resolveTenantForUser } from "../utils/tenantHelper.js";

/**
 * Génère un token JWT pour un utilisateur
 */
const generateToken = (user, sessionId, familyId) => {
    return jwt.sign(
        {
            sub: String(user.id_user),
            userId: user.id_user,
            id_user: user.id_user,
            role: user.role,
            sid: sessionId,
            fid: familyId,
            jti: crypto.randomUUID(),
        },
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev_secret_temporaire_non_securise",
        {
            expiresIn: ACCESS_TOKEN_TTL_SECONDS,
            issuer: process.env.JWT_ISSUER || "hestim-planner-api",
            audience: process.env.JWT_AUDIENCE || "hestim-planner-spa",
            algorithm: "HS256",
        }
    );
};

// req.ip tient compte de "trust proxy" (app.js) ; X-Forwarded-For brut serait falsifiable par le client.
const getClientIp = (req) => req.ip;

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const sanitizeUser = (user, additionalInfo = {}) => {
    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    return {
        ...userResponse,
        ...additionalInfo,
    };
};

const getAdditionalInfo = async (user) => {
    if (user.role === "enseignant") {
        const enseignant = await Enseignant.findByPk(user.id_user);
        if (enseignant) {
            return {
                specialite: enseignant.specialite,
                departement: enseignant.departement,
                grade: enseignant.grade,
                bureau: enseignant.bureau,
            };
        }
    }

    if (user.role === "etudiant") {
        const etudiant = await Etudiant.findByPk(user.id_user);
        if (etudiant) {
            return {
                numero_etudiant: etudiant.numero_etudiant,
                niveau: etudiant.niveau,
                date_inscription: etudiant.date_inscription,
            };
        }
    }

    return {};
};

const createAuthSession = async (req, res, user, familyId = crypto.randomUUID()) => {
    const { institution } = await resolveTenantForUser(req, user);
    const sessionId = crypto.randomUUID();
    const refreshToken = randomToken();

    await AuthSession.create({
        id_institution: institution?.id_institution || null,
        id_user: user.id_user,
        session_id: sessionId,
        family_id: familyId,
        refresh_token_hash: sha256(refreshToken),
        user_agent: req.get("user-agent"),
        ip_address: getClientIp(req),
        expires_at: makeRefreshExpiry(),
    });

    const accessToken = generateToken(user, sessionId, familyId);
    setAuthCookies(res, { accessToken, refreshToken });
    setCsrfCookie(res, sessionId);

    return { sessionId, familyId, institution };
};

const getTenantPayload = async (user, currentInstitution = null) => {
    const memberships = await InstitutionUser.findAll({
        where: {
            id_user: user.id_user,
            statut: "active",
        },
        include: [{ model: Institution, as: "institution" }],
        order: [["createdAt", "ASC"]],
    });

    return {
        institutions: memberships.map((membership) => ({
            id_institution: membership.id_institution,
            slug: membership.institution?.slug,
            nom: membership.institution?.nom,
            statut: membership.institution?.statut,
            role: membership.role,
        })),
        currentInstitution: currentInstitution
            ? {
                  id_institution: currentInstitution.id_institution,
                  slug: currentInstitution.slug,
                  nom: currentInstitution.nom,
                  role: memberships.find((item) => item.id_institution === currentInstitution.id_institution)?.role,
              }
            : null,
    };
};

// Pas d'inscription publique : les comptes sont créés par l'administration (POST /api/users).

// Hash factice comparé quand l'email est inconnu : le temps de réponse ne révèle pas
// si un compte existe (calculé une seule fois, à la première tentative).
let dummyHashPromise = null;
const getDummyHash = () => {
    dummyHashPromise ??= hashPassword(randomToken(16));
    return dummyHashPromise;
};

const INVALID_CREDENTIALS = {
    message: "Identifiants invalides",
    error: "Email ou mot de passe incorrect",
};

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation des champs (types stricts : un tableau deviendrait une clause IN)
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return res.status(400).json({
            message: "Champs manquants",
            error: "L'email et le mot de passe sont requis",
        });
    }

    const user = await Users.scope("withPassword").findOne({ where: { email: email.trim() } });

    // Toujours exécuter bcrypt, même si l'utilisateur n'existe pas
    const isPasswordValid = await comparePassword(password, user?.password_hash || (await getDummyHash()));
    if (!user || !isPasswordValid) {
        return res.status(401).json(INVALID_CREDENTIALS);
    }

    // Le statut du compte n'est révélé qu'à quelqu'un qui connaît le mot de passe
    if (!user.actif) {
        return res.status(403).json({
            message: "Compte désactivé",
            error: "Votre compte a été désactivé. Contactez l'administrateur.",
        });
    }

    // Récupérer les informations complémentaires selon le rôle
    const additionalInfo = await getAdditionalInfo(user);
    const session = await createAuthSession(req, res, user);
    const tenantPayload = await getTenantPayload(user, session.institution);

    res.json({
        message: "Connexion réussie",
        user: sanitizeUser(user, additionalInfo),
        ...tenantPayload,
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
    const additionalInfo = await getAdditionalInfo(user);
    const tenantPayload = await getTenantPayload(user, req.tenant);

    res.json({
        user: sanitizeUser(user, additionalInfo),
        ...tenantPayload,
    });
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, le token est supprimé)
 * Cette route peut être utilisée pour logger la déconnexion
 */
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const where = {};

    if (refreshToken) {
        where.refresh_token_hash = sha256(refreshToken);
    } else if (req.auth?.sessionId) {
        where.session_id = req.auth.sessionId;
    }

    if (Object.keys(where).length) {
        await AuthSession.update(
            {
                revoked_at: new Date(),
                revoked_reason: "logout",
            },
            {
                where: {
                    ...where,
                    revoked_at: null,
                },
            }
        );
    }

    clearAuthCookies(res);
    res.json({
        message: "Déconnexion réussie",
    });
});

/**
 * POST /api/auth/refresh
 * Rafraîchir le token (optionnel)
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!oldRefreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({
            message: "Refresh token manquant",
            code: "REFRESH_MISSING",
        });
    }

    const tokenHash = sha256(oldRefreshToken);
    const tokenRecord = await AuthSession.findOne({
        where: { refresh_token_hash: tokenHash },
    });

    if (!tokenRecord) {
        clearAuthCookies(res);
        return res.status(403).json({
            message: "Refresh token invalide",
            code: "REFRESH_INVALID",
        });
    }

    if (tokenRecord.revoked_at) {
        await AuthSession.update(
            {
                revoked_at: new Date(),
                revoked_reason: "refresh_reuse_detected",
            },
            {
                where: {
                    family_id: tokenRecord.family_id,
                    revoked_at: null,
                },
            }
        );

        clearAuthCookies(res);
        return res.status(403).json({
            message: "Alerte de sécurité: session révoquée, veuillez vous reconnecter",
            code: "REFRESH_REUSE_DETECTED",
        });
    }

    if (new Date(tokenRecord.expires_at) <= new Date()) {
        await tokenRecord.update({
            revoked_at: new Date(),
            revoked_reason: "expired",
        });
        clearAuthCookies(res);
        return res.status(403).json({
            message: "Session expirée",
            code: "REFRESH_EXPIRED",
        });
    }

    const user = await Users.findByPk(tokenRecord.id_user);
    if (!user || !user.actif) {
        await AuthSession.update(
            {
                revoked_at: new Date(),
                revoked_reason: "user_inactive",
            },
            { where: { family_id: tokenRecord.family_id, revoked_at: null } }
        );
        clearAuthCookies(res);
        return res.status(403).json({
            message: "Compte désactivé",
            error: "Votre compte a été désactivé",
        });
    }

    const newRefreshToken = randomToken();
    const newSessionId = crypto.randomUUID();
    const newRecord = await AuthSession.create({
        id_institution: tokenRecord.id_institution,
        id_user: user.id_user,
        session_id: newSessionId,
        family_id: tokenRecord.family_id,
        refresh_token_hash: sha256(newRefreshToken),
        user_agent: req.get("user-agent"),
        ip_address: getClientIp(req),
        expires_at: makeRefreshExpiry(),
        last_used_at: new Date(),
    });

    await tokenRecord.update({
        revoked_at: new Date(),
        revoked_reason: "rotated",
        last_used_at: new Date(),
        replaced_by_token_id: newRecord.id_auth_session,
    });

    const accessToken = generateToken(user, newSessionId, tokenRecord.family_id);
    setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });
    setCsrfCookie(res, newSessionId);

    res.json({
        message: "Token rafraîchi",
    });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
    await AuthSession.update(
        {
            revoked_at: new Date(),
            revoked_reason: "logout_all",
        },
        {
            where: {
                id_user: req.user.id_user,
                revoked_at: null,
            },
        }
    );

    clearAuthCookies(res);
    res.json({ message: "Déconnexion de tous les appareils réussie" });
});

export const listSessions = asyncHandler(async (req, res) => {
    const sessions = await AuthSession.findAll({
        where: {
            id_user: req.user.id_user,
            revoked_at: null,
            expires_at: { [Op.gt]: new Date() },
        },
        attributes: [
            "session_id",
            "family_id",
            "user_agent",
            "ip_address",
            "createdAt",
            "last_used_at",
            "expires_at",
        ],
        order: [["createdAt", "DESC"]],
    });

    res.json({ sessions });
});

export const revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    await AuthSession.update(
        {
            revoked_at: new Date(),
            revoked_reason: "manual_revoke",
        },
        {
            where: {
                id_user: req.user.id_user,
                family_id: sessionId,
                revoked_at: null,
            },
        }
    );

    if (req.auth?.familyId === sessionId) {
        clearAuthCookies(res);
    }

    res.json({ message: "Session révoquée" });
});

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
            message: "Email requis",
            error: "Veuillez fournir votre adresse email",
        });
    }

    const genericResponse = {
        message: "Si cet email existe, un lien de réinitialisation a été envoyé",
    };

    // Même réponse pour un email inconnu ou un compte désactivé :
    // on ne révèle ni l'existence ni le statut d'un compte.
    const user = await Users.findOne({ where: { email: email.trim() } });
    if (!user || !user.actif) {
        return res.json(genericResponse);
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
                    <p>Bonjour ${escapeHtml(user.prenom)} ${escapeHtml(user.nom)},</p>
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

    if (typeof token !== "string" || !token || !id_user || typeof password !== "string" || !password) {
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

    // Un mot de passe réinitialisé invalide toutes les sessions ouvertes
    // (cas typique : compte compromis dont le propriétaire reprend le contrôle).
    await AuthSession.update(
        { revoked_at: new Date(), revoked_reason: "password_reset" },
        { where: { id_user: user.id_user, revoked_at: null } }
    );

    res.json({
        message: "Mot de passe réinitialisé avec succès",
    });
});
