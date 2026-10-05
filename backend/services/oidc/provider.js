import crypto from "crypto";
import Provider from "oidc-provider";
import { Users } from "../../models/index.js";
import { clePriveeJwk } from "../../utils/jetons.js";
import SequelizeAdapter from "./adapter.js";

/**
 * Planner fournisseur OpenID Connect (phase Q) : les enseignants se connectent à ClassQuiz
 * (quiz.<domaine>) avec leur compte Planner, sans nouveau mot de passe. Les étudiants n'ont
 * pas de compte ClassQuiz : ils rejoignent les parties par code PIN.
 *
 * Particularités de ClassQuiz (classquiz/oauth/custom.py) dont tient compte la configuration :
 *  - il lit l'identité dans l'ID token, sans appeler userinfo → revendications dans l'ID token ;
 *  - `sub` doit être un UUID → identifiant de compte UUID réversible (voir idCompte) ;
 *  - il exige un refresh token → émis pour tout client qui a le droit refresh_token ;
 *  - `preferred_username` doit être unique → partie locale de l'adresse (unique à HESTIM).
 */

export const MONTAGE = "/api/oidc";
export const ROLES_AUTORISES = ["enseignant", "admin"];

// UUID réversible portant l'identifiant Planner : « 4e57110b-0000-4000-8000-<id en hexadécimal> »
const PREFIXE_COMPTE = "4e57110b-0000-4000-8000-";
export const idCompte = (idUser) => `${PREFIXE_COMPTE}${Number(idUser).toString(16).padStart(12, "0")}`;
export const idUserDe = (accountId) => {
    if (typeof accountId !== "string" || !accountId.startsWith(PREFIXE_COMPTE)) return null;
    const hex = accountId.slice(PREFIXE_COMPTE.length);
    return /^[0-9a-f]{12}$/.test(hex) ? parseInt(hex, 16) : null;
};

const emetteur = () => process.env.OIDC_ISSUER || `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}${MONTAGE}`;

/** Clients déclarés par l'environnement ; aucun client = fournisseur désactivé. */
const clients = () => {
    const secret = process.env.CLASSQUIZ_OIDC_CLIENT_SECRET;
    const urlQuiz = process.env.QUIZ_URL?.replace(/\/$/, "");
    if (!secret || !urlQuiz) return [];
    if (secret.length < 32) throw new Error("CLASSQUIZ_OIDC_CLIENT_SECRET doit compter 32 caractères au moins");
    return [{
        client_id: "classquiz",
        client_secret: secret,
        client_name: "ClassQuiz HESTIM",
        redirect_uris: [`${urlQuiz}/api/v1/users/oauth/custom/auth`],
        post_logout_redirect_uris: [urlQuiz],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_basic",
    }];
};

/** Clés des cookies signés du fournisseur ; en production elles doivent venir de l'environnement. */
const clesCookies = () => {
    const fournies = (process.env.OIDC_COOKIE_KEYS || "").split(",").map((c) => c.trim()).filter((c) => c.length >= 32);
    if (fournies.length) return fournies;
    if (process.env.NODE_ENV === "production") throw new Error("OIDC_COOKIE_KEYS requis en production (32 caractères au moins)");
    return [crypto.randomBytes(32).toString("hex")];
};

const trouverCompte = async (ctx, accountId) => {
    const idUser = idUserDe(accountId);
    const user = idUser ? await Users.findByPk(idUser) : null;
    // Un compte désactivé ou devenu étudiant ne peut plus obtenir de jeton
    if (!user || !user.actif || !ROLES_AUTORISES.includes(user.role)) return undefined;
    return {
        accountId,
        claims: async () => ({
            sub: accountId,
            email: user.email,
            email_verified: true,
            preferred_username: user.email.split("@")[0].slice(0, 100),
            name: `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || user.email,
        }),
    };
};

let instance = null;

/** Fournisseur unique du processus, ou null si aucun client n'est configuré. */
export const fournisseur = () => {
    if (instance !== null) return instance || null;
    const liste = clients();
    if (!liste.length) {
        instance = false;
        return null;
    }

    const provider = new Provider(emetteur(), {
        adapter: SequelizeAdapter,
        clients: liste,
        jwks: { keys: [clePriveeJwk()] },
        cookies: { keys: clesCookies() },
        findAccount: trouverCompte,
        claims: { openid: ["sub"], email: ["email", "email_verified"], profile: ["name", "preferred_username"] },
        // ClassQuiz lit l'identité dans l'ID token (authlib), pas sur userinfo
        conformIdTokenClaims: false,
        interactions: { url: (ctx, interaction) => `${MONTAGE}/interaction/${interaction.uid}` },
        issueRefreshToken: async (ctx, client) => client.grantTypeAllowed("refresh_token"),
        // PKCE obligatoire pour un client public seulement ; ClassQuiz est confidentiel (secret)
        pkce: { required: (ctx, client) => client.tokenEndpointAuthMethod === "none" },
        features: { devInteractions: { enabled: false }, revocation: { enabled: true }, rpInitiatedLogout: { enabled: true } },
        ttl: {
            AuthorizationCode: 60,
            AccessToken: 3600,
            IdToken: 3600,
            RefreshToken: 14 * 24 * 3600,
            Interaction: 600,
            Session: 8 * 3600,
            Grant: 14 * 24 * 3600,
        },
        renderError: async (ctx, out) => {
            ctx.type = "json";
            ctx.body = { error: out.error, error_description: out.error_description };
        },
    });
    // Derrière Caddy et nginx : protocole et hôte publics depuis X-Forwarded-*
    provider.proxy = true;
    instance = provider;
    return provider;
};

/** Pour les tests : oublie le fournisseur (l'environnement a changé). */
export const reinitialiserFournisseur = () => {
    instance = null;
};
