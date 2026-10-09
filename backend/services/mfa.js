import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { AuthSession, MfaCodeSecours, MfaDefi, Users } from "../models/index.js";
import { ErreurMetier } from "./planning/enseignements.js";
import { adresseOtpauth, nouveauSecret, verifierCode } from "../utils/totp.js";
import { compterRecents, journaliser } from "./journalSecurite.js";

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
// Codes faux tolérés par compte (tous défis confondus : un mot de passe connu ne suffit pas à
// essayer des codes sans fin) ; au-delà, même le bon code est refusé jusqu'à la fin de la fenêtre
export const ECHECS_MAX = 10;
export const FENETRE_ECHECS_MS = 15 * 60 * 1000;
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
 * dernier pas utilisé : un même code ne sert qu'une fois. Les vérifications d'un même compte
 * passent l'une après l'autre (verrou sur sa ligne) : des requêtes simultanées ne dépassent pas
 * la limite de codes faux. Chaque code faux est journalisé ; au-delà de ECHECS_MAX dans la
 * fenêtre, erreur 429 (même avec le bon code).
 */
export const verifierCodeUtilisateur = async (idUser, code, { maintenant = new Date(), contexte = null } = {}) => {
    const resultat = await sequelize.transaction(async (transaction) => {
        const user = await Users.scope("withMfa").findByPk(idUser, { transaction, lock: transaction.LOCK.UPDATE });
        if (!user?.mfa_active || !user.mfa_secret) return { ok: false };
        const echecs = await compterRecents(idUser, "mfa_echec", new Date(maintenant.getTime() - FENETRE_ECHECS_MS), { transaction });
        if (echecs >= ECHECS_MAX) return { bloque: true, user };

        const saisi = String(code ?? "").trim();
        let ok = false;
        let secours = false;
        // 6 chiffres : code de l'application ; sinon, code de secours (8 caractères, tiret facultatif)
        if (/^\d{6}$/.test(saisi.replace(/\s/g, ""))) {
            const pas = verifierCode(dechiffrer(user.mfa_secret), saisi, { maintenant, dernierPas: user.mfa_dernier_pas });
            if (pas !== null) {
                // Mise à jour conditionnelle : un même code ne passe pas deux fois
                const [nb] = await Users.update({ mfa_dernier_pas: pas }, { where: { id_user: idUser, [Op.or]: [{ mfa_dernier_pas: null }, { mfa_dernier_pas: { [Op.lt]: pas } }] }, transaction });
                ok = nb === 1;
            }
        } else if (normaliserSecours(saisi).length === 8) {
            const empreinte = sha256(normaliserSecours(saisi));
            const [nb] = await MfaCodeSecours.update({ utilise_le: maintenant }, { where: { id_user: idUser, code_hash: empreinte, utilise_le: null }, transaction });
            ok = nb === 1;
            secours = ok;
        }
        if (!ok) await journaliser(contexte, { evenement: "mfa_echec", user }, { transaction });
        else if (secours) await journaliser(contexte, { evenement: "mfa_code_secours_utilise", user }, { transaction });
        return { ok, user, secours };
    });
    if (resultat.bloque) {
        await journaliser(contexte, { evenement: "mfa_bloque", user: resultat.user });
        throw new ErreurMetier(`Trop de codes incorrects : réessayez dans ${FENETRE_ECHECS_MS / 60000} minutes`, 429);
    }
    return resultat.ok;
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
export const confirmerInscription = async (user, code, { maintenant = new Date(), contexte = null } = {}) => {
    const avecSecret = await chargerAvecSecret(user.id_user);
    if (avecSecret.mfa_active) throw new ErreurMetier("La double authentification est déjà active", 409);
    if (!avecSecret.mfa_secret) throw new ErreurMetier("Commencez par scanner le QR code", 400);
    const pas = verifierCode(dechiffrer(avecSecret.mfa_secret), code, { maintenant });
    if (pas === null) throw new ErreurMetier("Code incorrect : vérifiez l'heure du téléphone et saisissez le code affiché", 400);
    const resultat = await sequelize.transaction(async (transaction) => {
        await Users.update({ mfa_active: true, mfa_dernier_pas: pas }, { where: { id_user: user.id_user }, transaction });
        return { codes_secours: await nouveauxCodesSecours(user.id_user, transaction) };
    });
    await journaliser(contexte, { evenement: "mfa_activee", user });
    return resultat;
};

/** Nouveaux codes de secours (les anciens ne valent plus), sur présentation d'un code. */
export const regenererCodesSecours = async (user, code, contexte = null) => {
    if (!(await verifierCodeUtilisateur(user.id_user, code, { contexte }))) throw new ErreurMetier("Code incorrect", 400);
    const codes = await nouveauxCodesSecours(user.id_user);
    await journaliser(contexte, { evenement: "mfa_codes_regeneres", user });
    return { codes_secours: codes };
};

const retirer = async (idUser) => {
    await sequelize.transaction(async (transaction) => {
        await Users.update({ mfa_secret: null, mfa_active: false, mfa_dernier_pas: null }, { where: { id_user: idUser }, transaction });
        await MfaCodeSecours.destroy({ where: { id_user: idUser }, transaction });
        await MfaDefi.destroy({ where: { id_user: idUser }, transaction });
    });
};

/** Désactiver sa double authentification (enseignant) : mot de passe vérifié par l'appelant, code exigé. */
export const desactiver = async (user, code, contexte = null) => {
    if (mfaObligatoire(user)) throw new ErreurMetier("La double authentification est obligatoire pour l'administration", 403);
    if (!(await verifierCodeUtilisateur(user.id_user, code, { contexte }))) throw new ErreurMetier("Code incorrect", 400);
    await retirer(user.id_user);
    await journaliser(contexte, { evenement: "mfa_desactivee", user });
    return { active: false };
};

/**
 * Réinitialisation par un administrateur (téléphone perdu, plus de codes de secours) : la
 * double authentification est retirée et toutes les sessions du compte fermées ; s'il s'agit
 * d'un administrateur, il devra la reconfigurer à sa prochaine connexion.
 */
export const reinitialiser = async (admin, idUser, contexte = null) => {
    if (admin.role !== "admin") throw new ErreurMetier("Réservé à l'administration", 403);
    if (Number(idUser) === admin.id_user) throw new ErreurMetier("Demandez à un autre administrateur de réinitialiser la vôtre", 403);
    const cible = await Users.findByPk(Number(idUser) || 0);
    if (!cible) throw new ErreurMetier("Utilisateur introuvable", 404);
    await retirer(cible.id_user);
    await AuthSession.update({ revoked_at: new Date(), revoked_reason: "mfa_reset" }, { where: { id_user: cible.id_user, revoked_at: null } });
    await journaliser(contexte, { evenement: "mfa_reinitialisee", user: cible, acteur: admin });
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

/**
 * Présente le code d'un défi : renvoie l'utilisateur (défi consommé) ou lève une erreur. Un
 * essai est réservé avant la vérification (mise à jour conditionnelle) : des requêtes simultanées
 * sur un même défi n'en obtiennent pas plus de DEFI_ESSAIS.
 */
export const resoudreDefi = async (defi, code, contexte = null) => {
    const expiree = () => new ErreurMetier("Connexion expirée : recommencez", 401);
    if (typeof defi !== "string" || defi.length > 100) throw expiree();
    const defiHash = sha256(defi);
    const [reserve] = await MfaDefi.update(
        { essais: sequelize.literal("essais + 1") },
        { where: { defi_hash: defiHash, essais: { [Op.lt]: DEFI_ESSAIS }, expire_le: { [Op.gt]: new Date() } } }
    );
    if (!reserve) {
        await MfaDefi.destroy({ where: { defi_hash: defiHash } });
        throw expiree();
    }
    const enCours = await MfaDefi.findByPk(defiHash);
    if (!enCours) throw expiree();
    let juste;
    try {
        juste = await verifierCodeUtilisateur(enCours.id_user, code, { contexte });
    } catch (erreur) {
        // Compte bloqué (trop de codes faux) : la connexion est à recommencer après l'attente
        if (erreur instanceof ErreurMetier) await enCours.destroy();
        throw erreur;
    }
    if (!juste) {
        if (enCours.essais >= DEFI_ESSAIS) {
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
