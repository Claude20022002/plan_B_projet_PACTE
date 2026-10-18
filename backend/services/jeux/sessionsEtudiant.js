import { Cours, ParticipationJeu, PropositionJeu, SessionJeu } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { modulesDuJoueur } from "./jeux.js";
import { ligneOuErreur, vueSession } from "./sessions.js";

/**
 * Sessions de jeu, côté étudiant : rejoindre par le QR code projeté (/jeux/session/<code>) ou par
 * le code, puis, en mode collectif, suivre le tableau et envoyer sa réponse. Seuls les étudiants
 * du module de la session y entrent.
 */

// Une réponse d'étudiant reste courte : c'est une ligne de commande, pas un texte
export const LONGUEUR_PROPOSITION_MAX = 300;

const exigerEtudiant = (user) => {
    if (user.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
};

const avecModule = { include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }] };

/** Code saisi ou lu dans le QR : six caractères, sans espaces ni tirets, en capitales. */
const normaliserCode = (code) => (typeof code === "string" ? code.replace(/[\s-]/g, "").toUpperCase() : "");

/** Rejoindre une session ouverte d'un de ses modules ; rejoindre deux fois ne change rien. */
export const rejoindreSession = async (user, code) => {
    exigerEtudiant(user);
    const valeur = normaliserCode(code);
    const session = /^[A-Z0-9]{6}$/.test(valeur) ? await SessionJeu.findOne({ where: { code: valeur }, ...avecModule }) : null;
    if (!session) throw new ErreurMetier("Aucune session de jeu ne porte ce code", 404);
    if (session.statut !== "ouverte") throw new ErreurMetier("Cette session de jeu est terminée", 409);
    if (!(await modulesDuJoueur(user)).includes(session.id_cours)) throw new ErreurMetier("Cette session est lancée pour un module que vous ne suivez pas", 403);
    await ParticipationJeu.findOrCreate({ where: { id_session_jeu: session.id_session_jeu, id_user: user.id_user } });
    return vueSession(session);
};

/** Session rejointe par l'étudiant connecté, ou 404. */
const maSession = async (user, id) => {
    exigerEtudiant(user);
    const session = await SessionJeu.findOne({ where: { id_session_jeu: Number(id) || 0 }, ...avecModule });
    const inscrit = session && (await ParticipationJeu.count({ where: { id_session_jeu: session.id_session_jeu, id_user: user.id_user } }));
    if (!inscrit) throw new ErreurMetier("Session introuvable", 404);
    return session;
};

/** Le tableau tel que la classe le voit, et ma réponse au défi projeté. */
export const vueEtudiant = async (user, id) => {
    const session = await maSession(user, id);
    const derniere = session.mode === "collectif"
        ? await PropositionJeu.findOne({ where: { id_session_jeu: session.id_session_jeu, id_user: user.id_user, id_defi: session.id_defi }, order: [["updatedAt", "DESC"]] })
        : null;
    // Le code reste pour l'enseignant : un étudiant n'a pas à le redonner
    const vue = vueSession(session);
    delete vue.code;
    return { ...vue, ma_proposition: derniere ? { texte: derniere.texte, statut: derniere.statut } : null };
};

/**
 * Mode collectif : envoyer sa réponse au défi projeté. Une seule réponse en attente par étudiant :
 * en renvoyer une remplace la précédente.
 */
export const proposer = async (user, id, texte) => {
    const session = await maSession(user, id);
    if (session.mode !== "collectif") throw new ErreurMetier("Dans cette session, chacun joue sur son téléphone", 409);
    if (session.statut !== "ouverte") throw new ErreurMetier("Cette session de jeu est terminée", 409);
    const ligne = ligneOuErreur(texte, LONGUEUR_PROPOSITION_MAX);
    const enAttente = await PropositionJeu.findOne({ where: { id_session_jeu: session.id_session_jeu, id_user: user.id_user, id_defi: session.id_defi, statut: "attente" } });
    if (enAttente) await enAttente.update({ texte: ligne });
    else await PropositionJeu.create({ id_session_jeu: session.id_session_jeu, id_user: user.id_user, id_defi: session.id_defi, texte: ligne });
    return vueEtudiant(user, id);
};
