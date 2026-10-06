import crypto from "crypto";
import { Op } from "sequelize";
import { Appartenir, AuthSession, Users, Enseignant, Etudiant, Filiere, Groupe, PasserelleWeb, PasswordResetToken } from "../models/index.js";
import { signerJetonAcces } from "../utils/jetons.js";
import { filieresDuResponsable } from "../services/planning/droits.js";
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

/**
 * Identité transmise aux services de la plateforme (connexion unique, phase C) : StudyLib ouvre
 * le compte à la première visite avec ces informations. Pour un étudiant : sa filière (code),
 * son niveau et son groupe le plus fin.
 */
const identiteSso = async (user) => {
    const identite = { role: user.role, email: user.email, nom: user.nom, prenom: user.prenom };
    if (user.role !== "etudiant") return identite;
    const [etudiant, appartenances] = await Promise.all([
        Etudiant.findByPk(user.id_user, { attributes: ["niveau"] }),
        Appartenir.findAll({
            where: { id_user_etudiant: user.id_user },
            include: [{ model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "annee", "id_groupe_parent"], include: [{ model: Filiere, as: "filiere", attributes: ["code_filiere"] }] }],
        }),
    ]);
    // Le groupe le plus fin : celui qui n'est le parent d'aucun autre groupe de l'étudiant
    const groupes = appartenances.map((a) => a.groupe).filter(Boolean);
    const parents = new Set(groupes.map((g) => g.id_groupe_parent).filter(Boolean));
    const groupe = groupes.find((g) => !parents.has(g.id_groupe)) ?? groupes[0];
    return { ...identite, filiere: groupe?.filiere?.code_filiere ?? null, niveau: etudiant?.niveau ?? null, annee: groupe?.annee ?? null, groupe: groupe?.nom_groupe ?? null };
};

/** Jeton d'accès RS256 (utils/jetons.js), rattaché à la session serveur (sid) et à sa famille (fid). */
const generateToken = async (user, sessionId, familyId) =>
    signerJetonAcces({ sub: String(user.id_user), sid: sessionId, fid: familyId, ...(await identiteSso(user)) }, ACCESS_TOKEN_TTL_SECONDS);

/**
 * Client mobile (application Expo) : en-tête X-Client: mobile. Les jetons voyagent dans le corps
 * (stockés par l'application dans le trousseau sécurisé), jamais en cookies. Un navigateur envoie
 * toujours l'en-tête Origin sur un POST : il ne peut pas se faire passer pour l'application et
 * obtenir un jeton de renouvellement lisible par du JavaScript.
 */
const modeMobile = (req) => req.get("X-Client") === "mobile";
const refuserMobileDepuisNavigateur = (req, res) => {
    if (modeMobile(req) && req.get("origin")) {
        res.status(400).json({ message: "Client mobile invalide", code: "CLIENT_INVALIDE" });
        return true;
    }
    return false;
};
const jetonsMobile = ({ accessToken, refreshToken }) => ({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
});

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
                statut: enseignant.statut,
                // Filières dont il est responsable : ouvre la préparation du semestre côté frontend
                responsabilites: await filieresDuResponsable(user.id_user),
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
    const sessionId = crypto.randomUUID();
    const refreshToken = randomToken();
    const mobile = modeMobile(req);

    await AuthSession.create({
        id_user: user.id_user,
        session_id: sessionId,
        family_id: familyId,
        refresh_token_hash: sha256(refreshToken),
        user_agent: req.get("user-agent"),
        ip_address: getClientIp(req),
        expires_at: makeRefreshExpiry(),
    });

    const accessToken = await generateToken(user, sessionId, familyId);
    if (!mobile) {
        setAuthCookies(res, { accessToken, refreshToken });
        setCsrfCookie(res, sessionId);
    }

    return { sessionId, familyId, accessToken, refreshToken };
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
    if (refuserMobileDepuisNavigateur(req, res)) return;
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

    res.json({
        message: "Connexion réussie",
        user: sanitizeUser(user, additionalInfo),
        ...(modeMobile(req) ? jetonsMobile(session) : {}),
    });
});

// ── Passerelle de l'application mobile vers les sites web ──────────────────
// L'application ouvre Planner, StudyLib (/biblio/) ou les jeux dans le navigateur du téléphone,
// déjà connectée : elle demande un code à usage unique (60 s), le navigateur l'échange contre
// une session web puis suit le chemin choisi. Le code ne vaut que pour un chemin de la
// plateforme (relatif, jamais vers un autre site) ; seule son empreinte est enregistrée.

const PASSERELLE_TTL_MS = 60 * 1000;
const CHEMIN_PLATEFORME = /^\/(?![/\\])[A-Za-z0-9\-._~/?=&%#]{0,299}$/;

/**
 * POST /api/auth/passerelle (application mobile, jeton Bearer) — { suite: "/biblio/" }
 * → { code, expire_dans }
 */
export const creerPasserelle = asyncHandler(async (req, res) => {
    // Réservé à l'application : un navigateur a déjà sa session web
    if (!modeMobile(req) || req.get("origin") || !req.get("authorization")?.startsWith("Bearer ")) {
        return res.status(403).json({ message: "Réservé à l'application mobile", code: "CLIENT_INVALIDE" });
    }
    const suite = req.body?.suite ?? "/";
    if (typeof suite !== "string" || !CHEMIN_PLATEFORME.test(suite)) {
        return res.status(400).json({ message: "suite doit être un chemin de la plateforme (ex. /biblio/)" });
    }
    const maintenant = new Date();
    // Ménage des codes expirés depuis plus d'un jour
    await PasserelleWeb.destroy({ where: { expire_le: { [Op.lt]: new Date(maintenant.getTime() - 24 * 3600 * 1000) } } });
    const code = randomToken(32);
    await PasserelleWeb.create({ code_hash: sha256(code), id_user: req.user.id_user, suite, expire_le: new Date(maintenant.getTime() + PASSERELLE_TTL_MS) });
    res.status(201).json({ code, expire_dans: PASSERELLE_TTL_MS / 1000 });
});

/**
 * GET /api/auth/passerelle?code=… (navigateur du téléphone) : ouvre une session web et redirige
 * vers le chemin demandé. Code inconnu, expiré ou déjà utilisé : retour à l'accueil du site.
 */
export const suivrePasserelle = asyncHandler(async (req, res) => {
    // Le code figure dans l'adresse : ni cache, ni référent
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code || code.length > 100) return res.redirect(303, "/");

    const maintenant = new Date();
    const codeHash = sha256(code);
    // Usage unique : seule la requête qui marque le code comme utilisé continue
    const [marques] = await PasserelleWeb.update({ utilise_le: maintenant }, { where: { code_hash: codeHash, utilise_le: null, expire_le: { [Op.gt]: maintenant } } });
    if (marques !== 1) return res.redirect(303, "/");

    const passerelle = await PasserelleWeb.findOne({ where: { code_hash: codeHash } });
    const user = await Users.findByPk(passerelle.id_user);
    if (!user?.actif || !CHEMIN_PLATEFORME.test(passerelle.suite)) return res.redirect(303, "/");

    await createAuthSession(req, res, user);
    // Pas de redirection HTTP : le navigateur, ouvert depuis l'application, traite cette navigation
    // comme intersite et n'enverrait pas les cookies SameSite=Strict à la page suivante (StudyLib,
    // rendue par le serveur, s'afficherait déconnectée). Une page de la plateforme qui se redirige
    // elle-même rend la navigation suivante interne au site.
    const suite = passerelle.suite.replace(/&/g, "&amp;");
    res.status(200).type("html").send(
        `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
            `<meta http-equiv="refresh" content="0;url=${suite}"><title>HESTIM</title></head>` +
            `<body style="background:#0b0b0d;color:#f2efe9;font-family:system-ui,sans-serif;padding:24px">` +
            `<a href="${suite}" style="color:#f2efe9">Continuer</a></body></html>`
    );
});

/**
 * POST /api/auth/change-password
 * Changer son mot de passe (obligatoire à la première connexion d'un compte créé par
 * l'administration) : l'actuel est exigé ; les autres sessions sont fermées.
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { current_password: actuel, password } = req.body;
    if (typeof actuel !== "string" || typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Champs manquants", error: "Le mot de passe actuel et le nouveau sont requis" });
    }
    const user = await Users.scope("withPassword").findByPk(req.user.id_user);
    if (!(await comparePassword(actuel, user.password_hash))) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect", error: "Saisissez votre mot de passe actuel" });
    }
    if (await comparePassword(password, user.password_hash)) {
        return res.status(400).json({ message: "Mot de passe inchangé", error: "Choisissez un mot de passe différent de l'actuel" });
    }
    const verification = validatePasswordStrength(password);
    if (!verification.valid) {
        return res.status(400).json({ message: "Mot de passe invalide", errors: verification.errors, error: verification.errors[0] });
    }
    await user.update({ password_hash: await hashPassword(password), must_change_password: false });
    await AuthSession.update(
        { revoked_at: new Date(), revoked_reason: "password_change" },
        { where: { id_user: user.id_user, revoked_at: null, session_id: { [Op.ne]: req.auth?.sessionId ?? "" } } }
    );
    res.json({ message: "Mot de passe modifié" });
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

    res.json({
        user: sanitizeUser(user, additionalInfo),
    });
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, le token est supprimé)
 * Cette route peut être utilisée pour logger la déconnexion
 */
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = modeMobile(req) && typeof req.body?.refresh_token === "string" ? req.body.refresh_token : req.cookies?.[REFRESH_COOKIE];
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
    if (refuserMobileDepuisNavigateur(req, res)) return;
    const mobile = modeMobile(req);
    // Mobile : le jeton de renouvellement arrive dans le corps ; navigateur : dans son cookie
    const oldRefreshToken = mobile ? (typeof req.body?.refresh_token === "string" ? req.body.refresh_token : null) : req.cookies?.[REFRESH_COOKIE];
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

    const accessToken = await generateToken(user, newSessionId, tokenRecord.family_id);
    if (mobile) {
        return res.json({ message: "Token rafraîchi", ...jetonsMobile({ accessToken, refreshToken: newRefreshToken }) });
    }
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
    await user.update({ password_hash, must_change_password: false });

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
