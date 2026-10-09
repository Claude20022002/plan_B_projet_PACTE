import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { AuthSession, MfaCodeSecours, MfaDefi, Users } from "../models/index.js";
import { ErreurMetier } from "./planning/enseignements.js";
import { adresseOtpauth, nouveauSecret, verifierCode } from "../utils/totp.js";

/**
 * Double authentification (TOTP) : obligatoire pour l'administration (variable
 * MFA_ADMINS_OBLIGATOIRE, « true » par défaut), possible pour les enseignants.
 *
 * Inscription : un secret est créé (chiffré en base), l'utilisateur le scanne dans son application
 * d'authentification puis confirme avec un premier code ; il reçoit alors 10 codes de secours à
 * usage unique, montrés une seule fois. Connexion : après le mot de passe, un défi de 5 minutes
 * (5 essais) attend le code ou un code de secours ; la session n'est ouverte qu'avec lui.
 */

const ROLES_POSSIBLES = ["admin", "enseignant"];
const NB_CODES_SECOURS = 10;
const DEFI_MS = 5 * 60 * 1000;
const DEFI_ESSAIS = 5;
const ALPHABET_SECOURS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const sha256 = (v) => crypto.createHash("sha256").update(v).digest("hex");

export const mfaObligatoire = (user) => user?.role === "admin" && process.env.MFA_ADMINS_OBLIGATOIRE !== "false";
export const mfaAConfigurer = (user) => mfaObligatoire(user) && !user.mfa_active;

// ── Chiffrement du secret (AES-256-GCM) ─────────────────────────────────
// Clé dérivée (HKDF) d'un secret du serveur : MFA_KEY s'il existe, sinon CSRF_SECRET.
const cle = () => {
    const base = process.env.MFA_KEY || process.env.CSRF_SECRET || process.env.JWT_SECRET;
    if (!base) {
        if (process.env.NODE_ENV === "production") throw new Error("MFA_KEY ou CSRF_SECRET requis");
        return crypto.createHash("sha256").update("hestim-mfa-dev").digest();
    }
    return Buffer.from(crypto.hkdfSync("sha256", base, "hestim-planner", "secret-totp", 32));
};

export const chiffrer = (texte) => {
    const iv = crypto.randomBytes(12);
    const chiffreur = crypto.createCipheriv("aes-256-gcm", cle(), iv);
    const donnees = Buffer.concat([chiffreur.update(texte, "utf8"), chiffreur.final()]);
    return [iv, chiffreur.getAuthTag(), donnees].map((b) => b.toString("base64url")).join(".");
};

export const dechiffrer = (valeur) => {
    const [iv, etiquette, donnees] = String(valeur).split(".").map((b) => Buffer.from(b, "base64url"));
    const dechiffreur = crypto.createDecipheriv("aes-256-gcm", cle(), iv);
    dechiffreur.setAuthTag(etiquette);
    return Buffer.concat([dechiffreur.update(donnees), dechiffreur.final()]).toString("utf8");
};

// ── Codes de secours ────────────────────────────────────────────────────
const codeSecours = () => {
    const octets = crypto.randomBytes(8);
    const lettres = [...octets].map((o) => ALPHABET_SECOURS[o % ALPHABET_SECOURS.length]).join("");
    return `${lettres.slice(0, 4)}-${lettres.slice(4)}`;
};
const normaliserSecours = (code) => String(code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const nouveauxCodesSecours = async (idUser, transaction) => {
    const codes = Array.from({ length: NB_CODES_SECOURS }, codeSecours);
    await MfaCodeSecours.destroy({ where: { id_user: idUser }, transaction });
    await MfaCodeSecours.bulkCreate(codes.map((c) => ({ id_user: idUser, code_hash: sha256(normaliserSecours(c)) })), { transaction });
    return codes;
};

const chargerAvecSecret = (idUser) => Users.scope("withMfa").findByPk(idUser);

/**
 * Vérifie un code de l'application (6 chiffres) ou un code de secours (consommé). Met à jour le
 * dernier pas utilisé : un même code ne sert qu'une fois.
 */
export const verifierCodeUtilisateur = async (idUser, code, maintenant = new Date()) => {
    const user = await chargerAvecSecret(idUser);
    if (!user?.mfa_active || !user.mfa_secret) return false;
    const saisi = String(code ?? "").trim();
    // 6 chiffres : code de l'application ; sinon, code de secours (8 caractères, tiret facultatif)
    if (/^\d{6}$/.test(saisi.replace(/\s/g, ""))) {
        const pas = verifierCode(dechiffrer(user.mfa_secret), saisi, { maintenant, dernierPas: user.mfa_dernier_pas });
        if (pas === null) return false;
        // Mise à jour conditionnelle : deux requêtes simultanées ne passent pas avec le même code
        const [nb] = await Users.update({ mfa_dernier_pas: pas }, { where: { id_user: idUser, [Op.or]: [{ mfa_dernier_pas: null }, { mfa_dernier_pas: { [Op.lt]: pas } }] } });
        return nb === 1;
    }
    const empreinte = sha256(normaliserSecours(saisi));
    if (normaliserSecours(saisi).length !== 8) return false;
    const [nb] = await MfaCodeSecours.update({ utilise_le: maintenant }, { where: { id_user: idUser, code_hash: empreinte, utilise_le: null } });
    return nb === 1;
};

// ── Inscription ─────────────────────────────────────────────────────────

/** État pour l'écran « Sécurité » : active, obligatoire, codes de secours restants. */
export const etatMfa = async (user) => ({
    active: Boolean(user.mfa_active),
    obligatoire: mfaObligatoire(user),
    possible: ROLES_POSSIBLES.includes(user.role),
    codes_restants: user.mfa_active ? await MfaCodeSecours.count({ where: { id_user: user.id_user, utilise_le: null } }) : 0,
});

/** Étape 1 : nouveau secret (non actif tant qu'un premier code n'est pas confirmé). */
export const demarrerInscription = async (user) => {
    if (!ROLES_POSSIBLES.includes(user.role)) throw new ErreurMetier("Double authentification réservée au personnel", 403);
    if (user.mfa_active) throw new ErreurMetier("La double authentification est déjà active", 409);
    const secret = nouveauSecret();
    await Users.update({ mfa_secret: chiffrer(secret), mfa_dernier_pas: null }, { where: { id_user: user.id_user } });
    return { secret, adresse: adresseOtpauth({ secret, compte: user.email }) };
};

/** Étape 2 : premier code juste → active, codes de secours (montrés une seule fois). */
export const confirmerInscription = async (user, code, maintenant = new Date()) => {
    const avecSecret = await chargerAvecSecret(user.id_user);
    if (avecSecret.mfa_active) throw new ErreurMetier("La double authentification est déjà active", 409);
    if (!avecSecret.mfa_secret) throw new ErreurMetier("Commencez par scanner le QR code", 400);
    const pas = verifierCode(dechiffrer(avecSecret.mfa_secret), code, { maintenant });
    if (pas === null) throw new ErreurMetier("Code incorrect : vérifiez l'heure du téléphone et saisissez le code affiché", 400);
    return sequelize.transaction(async (transaction) => {
        await Users.update({ mfa_active: true, mfa_dernier_pas: pas }, { where: { id_user: user.id_user }, transaction });
        return { codes_secours: await nouveauxCodesSecours(user.id_user, transaction) };
    });
};

/** Nouveaux codes de secours (les anciens ne valent plus), sur présentation d'un code. */
export const regenererCodesSecours = async (user, code) => {
    if (!(await verifierCodeUtilisateur(user.id_user, code))) throw new ErreurMetier("Code incorrect", 400);
    return { codes_secours: await nouveauxCodesSecours(user.id_user) };
};

const retirer = async (idUser) => {
    await sequelize.transaction(async (transaction) => {
        await Users.update({ mfa_secret: null, mfa_active: false, mfa_dernier_pas: null }, { where: { id_user: idUser }, transaction });
        await MfaCodeSecours.destroy({ where: { id_user: idUser }, transaction });
        await MfaDefi.destroy({ where: { id_user: idUser }, transaction });
    });
};

/** Désactiver sa double authentification (enseignant) : mot de passe vérifié par l'appelant, code exigé. */
export const desactiver = async (user, code) => {
    if (mfaObligatoire(user)) throw new ErreurMetier("La double authentification est obligatoire pour l'administration", 403);
    if (!(await verifierCodeUtilisateur(user.id_user, code))) throw new ErreurMetier("Code incorrect", 400);
    await retirer(user.id_user);
    return { active: false };
};

/**
 * Réinitialisation par un administrateur (téléphone perdu, plus de codes de secours) : la
 * double authentification est retirée et toutes les sessions du compte fermées ; s'il s'agit
 * d'un administrateur, il devra la reconfigurer à sa prochaine connexion.
 */
export const reinitialiser = async (admin, idUser) => {
    if (admin.role !== "admin") throw new ErreurMetier("Réservé à l'administration", 403);
    if (Number(idUser) === admin.id_user) throw new ErreurMetier("Demandez à un autre administrateur de réinitialiser la vôtre", 403);
    const cible = await Users.findByPk(Number(idUser) || 0);
    if (!cible) throw new ErreurMetier("Utilisateur introuvable", 404);
    await retirer(cible.id_user);
    await AuthSession.update({ revoked_at: new Date(), revoked_reason: "mfa_reset" }, { where: { id_user: cible.id_user, revoked_at: null } });
    return { reinitialisee: true };
};

// ── Connexion en deux temps ─────────────────────────────────────────────

/** Après un mot de passe juste : défi à présenter avec le code (seule son empreinte est gardée). */
export const creerDefi = async (user, { mobile = false } = {}) => {
    const defi = crypto.randomBytes(32).toString("base64url");
    await MfaDefi.destroy({ where: { expire_le: { [Op.lt]: new Date() } } });
    await MfaDefi.create({ defi_hash: sha256(defi), id_user: user.id_user, mobile, expire_le: new Date(Date.now() + DEFI_MS) });
    return defi;
};

/** Présente le code d'un défi : renvoie l'utilisateur (défi consommé) ou lève une erreur. */
export const resoudreDefi = async (defi, code) => {
    if (typeof defi !== "string" || defi.length > 100) throw new ErreurMetier("Connexion expirée : recommencez", 401);
    const enCours = await MfaDefi.findByPk(sha256(defi));
    if (!enCours || new Date(enCours.expire_le) <= new Date()) {
        if (enCours) await enCours.destroy();
        throw new ErreurMetier("Connexion expirée : recommencez", 401);
    }
    if (!(await verifierCodeUtilisateur(enCours.id_user, code))) {
        await enCours.increment("essais");
        if (enCours.essais + 1 >= DEFI_ESSAIS) {
            await enCours.destroy();
            throw new ErreurMetier("Trop d'essais : recommencez la connexion", 401);
        }
        throw new ErreurMetier("Code incorrect", 401);
    }
    await enCours.destroy();
    const user = await Users.findByPk(enCours.id_user);
    if (!user?.actif) throw new ErreurMetier("Compte désactivé", 403);
    return { user, mobile: enCours.mobile };
};
