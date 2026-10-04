import crypto from "crypto";
import { Appartenir, Enseignant, Etudiant, PasswordResetToken } from "../models/index.js";
import { hashPassword } from "../utils/passwordHelper.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Comptes créés par l'administration (phase B) : plus aucun mot de passe par défaut connu.
 * Sans mot de passe fourni, le compte reçoit un mot de passe aléatoire jamais communiqué et un
 * lien d'invitation (le jeton de réinitialisation, valable 7 jours) pour choisir le sien.
 * Avec un mot de passe provisoire, il devra le changer à la première connexion.
 */

const DUREE_INVITATION_JOURS = 7;
const sha256 = (valeur) => crypto.createHash("sha256").update(valeur).digest("hex");

/** Empreinte d'un mot de passe aléatoire que personne ne connaît. */
export const empreinteInutilisable = () => hashPassword(`${crypto.randomBytes(32).toString("base64url")}aA1!`);

/** Crée (ou remplace) le jeton d'invitation d'un compte et renvoie le lien à ouvrir. */
export const creerLienInvitation = async (user, transaction) => {
    const jeton = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + DUREE_INVITATION_JOURS * 24 * 3600 * 1000);
    await PasswordResetToken.destroy({ where: { id_user: user.id_user, used: false }, transaction });
    await PasswordResetToken.create({ id_user: user.id_user, token: sha256(jeton), expires_at: expiration, used: false }, { transaction });
    return `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${jeton}&id=${user.id_user}&invitation=1`;
};

const echapper = (valeur = "") =>
    String(valeur).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Envoie le lien d'invitation ; renvoie vrai si l'envoi a abouti (sans jamais lever). */
export const envoyerInvitation = async (user, lien) => {
    try {
        const resultat = await sendEmail({
            to: user.email,
            subject: "Votre compte HESTIM Planner",
            text: `Bonjour ${user.prenom} ${user.nom},\n\nUn compte HESTIM Planner a été créé pour vous. Choisissez votre mot de passe en ouvrant ce lien (valable ${DUREE_INVITATION_JOURS} jours) :\n\n${lien}\n\nL'équipe HESTIM Planner`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
                <p>Bonjour ${echapper(user.prenom)} ${echapper(user.nom)},</p>
                <p>Un compte HESTIM Planner a été créé pour vous. Choisissez votre mot de passe :</p>
                <p><a href="${lien}" style="background:#001861;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Choisir mon mot de passe</a></p>
                <p style="color:#666;font-size:12px;">Ce lien est valable ${DUREE_INVITATION_JOURS} jours.</p>
            </div>`,
        });
        return resultat?.success !== false;
    } catch (error) {
        console.error(`Invitation non envoyée à ${user.email} :`, error.message);
        return false;
    }
};

/**
 * Fiche liée au rôle, créée dans la même transaction que le compte : enseignant (spécialité,
 * département, statut) ou étudiant (numéro, niveau, groupe facultatif).
 */
export const creerProfil = async (user, profil = {}, transaction) => {
    if (user.role === "enseignant") {
        await Enseignant.create(
            {
                id_user: user.id_user,
                specialite: profil.specialite?.trim() || "À préciser",
                departement: profil.departement?.trim() || "À préciser",
                grade: profil.grade || null,
                ...(["permanent", "vacataire"].includes(profil.statut) ? { statut: profil.statut } : {}),
            },
            { transaction }
        );
    }
    if (user.role === "etudiant") {
        await Etudiant.create(
            {
                id_user: user.id_user,
                numero_etudiant: profil.numero_etudiant?.trim() || `ETU-${user.id_user}`,
                niveau: profil.niveau?.trim() || "À préciser",
            },
            { transaction }
        );
        if (profil.id_groupe) await Appartenir.create({ id_user_etudiant: user.id_user, id_groupe: Number(profil.id_groupe) }, { transaction });
    }
};
