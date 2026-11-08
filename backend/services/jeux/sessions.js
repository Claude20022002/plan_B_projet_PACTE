import crypto from "crypto";
import { Op, UniqueConstraintError } from "sequelize";
import { Cours, JeuModule, JeuProfil, JeuProgression, ParticipationJeu, PropositionJeu, SessionJeu, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { defiDuJeu, jeuParCode, modesDuJeu } from "../../../shared/jeux/catalogue.js";
import { avatarDe } from "../../../shared/jeux/avatars.js";
import { COMMANDES_MAX, LONGUEUR_COMMANDE_MAX, rejouerDefi } from "../../../shared/terminal/jeu.js";
import { JOUEUR_CLASSE } from "../../../shared/terminal/tableau.js";
import { peutProposerDansModule } from "./jeux.js";

/**
 * Sessions de jeu, côté enseignant. Les jeux sont faits pour les étudiants : l'enseignant ne joue
 * pas pour lui, il lance une session pour un module et projette un QR code et un code.
 *  - individuel : chaque étudiant joue sur son téléphone ; l'enseignant voit qui a rejoint et
 *    les défis réussis depuis le lancement ;
 *  - collectif : le jeu est projeté, les étudiants envoient leurs réponses depuis leur téléphone
 *    et l'enseignant choisit celle qui est jouée au tableau (le terminal Linux : une commande).
 * Le serveur garde les commandes jouées et rejoue la partie pour savoir si l'objectif est atteint.
 */

// Sans 0/O ni 1/I/L : un code dicté ou projeté ne se lit pas de travers (comme le Studio quiz)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const tirerCode = () => Array.from(crypto.randomBytes(6), (o) => ALPHABET[o % ALPHABET.length]).join("");

const exigerEnseignant = (user) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
};

/** Ligne de commande envoyée : texte non vide, borné ; renvoie la ligne sans espaces autour. */
export const ligneOuErreur = (texte, max = LONGUEUR_COMMANDE_MAX) => {
    const ligne = typeof texte === "string" ? texte.trim() : "";
    if (!ligne || ligne.length > max) throw new ErreurMetier(`La réponse doit faire de 1 à ${max} caractères`, 400);
    return ligne;
};

const vueModule = (c) => (c ? { id_cours: c.id_cours, code: c.code_cours, nom: c.nom_cours } : null);

/** Ce que l'enseignant et les étudiants voient d'une session (sans les participants). */
export const vueSession = (s) => ({
    id_session_jeu: s.id_session_jeu,
    code_jeu: s.code_jeu,
    mode: s.mode,
    code: s.code,
    statut: s.statut,
    module: vueModule(s.cours),
    id_defi: s.id_defi,
    commandes: s.commandes ?? [],
    reussi: s.reussi,
    lancee_le: s.createdAt,
});

const avecModule = { include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }] };

/** Session de l'enseignant connecté, ou 404 (une session d'un autre enseignant n'existe pas pour lui). */
export const sessionDe = async (user, id) => {
    exigerEnseignant(user);
    const session = await SessionJeu.findOne({ where: { id_session_jeu: Number(id) || 0, id_user: user.id_user }, ...avecModule });
    if (!session) throw new ErreurMetier("Session introuvable", 404);
    return session;
};

const exigerOuverte = (session) => {
    if (session.statut !== "ouverte") throw new ErreurMetier("Cette session est terminée", 409);
};

const exigerCollectif = (session) => {
    if (session.mode !== "collectif") throw new ErreurMetier("Réservé aux sessions jouées avec la classe", 409);
};

/**
 * Lance une session : le jeu doit exister et se jouer dans ce mode, le module doit être l'un de
 * ceux de l'enseignant. Le jeu est proposé dans le module s'il ne l'était pas encore : c'est ce
 * qui ouvre le jeu aux étudiants du module.
 */
export const lancerSession = async (user, { code_jeu, id_cours, mode } = {}) => {
    exigerEnseignant(user);
    const jeu = jeuParCode(code_jeu);
    if (!jeu) throw new ErreurMetier("Jeu inconnu", 404);
    if (!modesDuJeu(jeu).includes(mode)) throw new ErreurMetier(`mode doit être l'un de : ${modesDuJeu(jeu).join(", ")}`, 400);
    const idCours = Number(id_cours);
    const cours = Number.isInteger(idCours) && idCours > 0 ? await Cours.findByPk(idCours, { attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"] }) : null;
    if (!cours) throw new ErreurMetier("Module introuvable", 404);
    if (!(await peutProposerDansModule(user, cours))) throw new ErreurMetier("Vous ne pouvez lancer un jeu que dans vos modules", 403);

    await JeuModule.findOrCreate({ where: { code_jeu: jeu.code, id_cours: cours.id_cours }, defaults: { id_user_auteur: user.id_user } });
    const collectif = mode === "collectif";
    for (let essai = 0; essai < 5; essai += 1) {
        try {
            const session = await SessionJeu.create({
                code_jeu: jeu.code,
                mode,
                id_user: user.id_user,
                id_cours: cours.id_cours,
                code: tirerCode(),
                id_defi: collectif ? jeu.defis[0].id : null,
                commandes: collectif ? [] : null,
            });
            session.cours = cours;
            return vueSession(session);
        } catch (e) {
            if (!(e instanceof UniqueConstraintError)) throw e;
        }
    }
    throw new ErreurMetier("Impossible de tirer un code libre : réessayez", 503);
};

/** Sessions encore ouvertes de l'enseignant, la plus récente d'abord. */
export const sessionsOuvertes = async (user) => {
    exigerEnseignant(user);
    const sessions = await SessionJeu.findAll({ where: { id_user: user.id_user, statut: "ouverte" }, ...avecModule, order: [["createdAt", "DESC"]], limit: 20 });
    return sessions.map(vueSession);
};

/**
 * Tableau de bord d'une session : les étudiants qui l'ont rejointe (et, en mode individuel, les
 * défis réussis depuis son lancement) et, en mode collectif, les réponses en attente du défi projeté.
 */
export const suiviSession = async (user, id) => {
    const session = await sessionDe(user, id);
    const participations = await ParticipationJeu.findAll({
        where: { id_session_jeu: session.id_session_jeu },
        include: [{ model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom"] }],
        order: [["createdAt", "ASC"]],
    });
    const ids = participations.map((p) => p.id_user);
    const [lignes, profils, propositions] = await Promise.all([
        session.mode === "individuel" && ids.length
            ? JeuProgression.findAll({ where: { id_user: ids, code_jeu: session.code_jeu, reussi_le: { [Op.gte]: session.createdAt } }, attributes: ["id_user", "points"] })
            : [],
        ids.length ? JeuProfil.findAll({ where: { id_user: ids } }) : [],
        session.mode === "collectif"
            ? PropositionJeu.findAll({
                  where: { id_session_jeu: session.id_session_jeu, id_defi: session.id_defi, statut: "attente" },
                  include: [{ model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom"] }],
                  order: [["updatedAt", "ASC"]],
              })
            : [],
    ]);
    const avatars = new Map(profils.map((p) => [p.id_user, p.avatar]));
    const participants = participations.map((p) => {
        const siennes = lignes.filter((l) => l.id_user === p.id_user);
        return {
            id_user: p.id_user,
            prenom: p.etudiant?.prenom ?? "",
            nom: p.etudiant?.nom ?? "",
            avatar: avatarDe(p.id_user, avatars.get(p.id_user)),
            rejoint_le: p.createdAt,
            defis: siennes.length,
            points: siennes.reduce((t, l) => t + l.points, 0),
        };
    });
    if (session.mode === "individuel") participants.sort((a, b) => b.points - a.points || a.nom.localeCompare(b.nom));
    return {
        ...vueSession(session),
        participants,
        propositions: propositions.map((p) => ({ id_proposition: p.id_proposition, texte: p.texte, prenom: p.etudiant?.prenom ?? "", nom: p.etudiant?.nom ?? "", envoyee_le: p.updatedAt })),
    };
};

/** Les réponses en attente ne servent plus (défi changé, session terminée) */
const ecarterEnAttente = (session) => PropositionJeu.update({ statut: "ecartee" }, { where: { id_session_jeu: session.id_session_jeu, statut: "attente" } });

export const terminerSession = async (user, id) => {
    const session = await sessionDe(user, id);
    if (session.statut !== "fermee") {
        await session.update({ statut: "fermee" });
        await ecarterEnAttente(session);
    }
    return vueSession(session);
};

/** Mode collectif : passer à un autre défi (ou recommencer le même), terminal remis à zéro. */
export const changerDefi = async (user, id, idDefi) => {
    const session = await sessionDe(user, id);
    exigerCollectif(session);
    exigerOuverte(session);
    const defi = defiDuJeu(jeuParCode(session.code_jeu), String(idDefi ?? ""));
    if (!defi) throw new ErreurMetier("Défi inconnu", 404);
    await session.update({ id_defi: defi.id, commandes: [], reussi: false });
    await ecarterEnAttente(session);
    return vueSession(session);
};

/**
 * Mode collectif : jouer une commande au tableau, celle d'un étudiant (`id_proposition`) ou
 * celle que l'enseignant tape lui-même (`texte`). Le serveur rejoue toute la partie du défi
 * pour savoir si l'objectif est atteint.
 */
export const jouerCommande = async (user, id, { texte, id_proposition } = {}) => {
    const session = await sessionDe(user, id);
    exigerCollectif(session);
    exigerOuverte(session);
    let ligne;
    let proposition = null;
    if (id_proposition !== undefined && id_proposition !== null) {
        proposition = await PropositionJeu.findOne({ where: { id_proposition: Number(id_proposition) || 0, id_session_jeu: session.id_session_jeu, id_defi: session.id_defi, statut: "attente" } });
        if (!proposition) throw new ErreurMetier("Réponse introuvable ou déjà traitée", 404);
        ligne = proposition.texte;
    } else {
        ligne = ligneOuErreur(texte);
    }
    const commandes = [...(session.commandes ?? []), ligne];
    if (commandes.length > COMMANDES_MAX) throw new ErreurMetier(`Plus de ${COMMANDES_MAX} commandes : recommencez le défi`, 409);
    const reussi = rejouerDefi(session.id_defi, commandes, { joueur: JOUEUR_CLASSE });
    await session.update({ commandes, reussi });
    if (proposition) await proposition.update({ statut: "choisie" });
    return vueSession(session);
};

/** Mode collectif : écarter une réponse sans la jouer. */
export const ecarterProposition = async (user, id, idProposition) => {
    const session = await sessionDe(user, id);
    const retirees = await PropositionJeu.update({ statut: "ecartee" }, { where: { id_proposition: Number(idProposition) || 0, id_session_jeu: session.id_session_jeu, statut: "attente" } });
    if (!retirees[0]) throw new ErreurMetier("Réponse introuvable ou déjà traitée", 404);
    return { ecartee: true };
};
