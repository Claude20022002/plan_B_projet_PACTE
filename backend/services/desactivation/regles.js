import { Op } from "sequelize";
import {
    Affectation,
    Annonce,
    AuthSession,
    DemandeReport,
    JeuProgression,
    Presence,
    Questionnaire,
    SupportCours,
    TentativeQuiz,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { aujourdhui, STATUTS_ACTIFS } from "../planning/affectationRules.js";

/**
 * Règles communes à la désactivation des comptes (plan multi-établissements, fichier 11, § 11.2) :
 * motifs permis, date d'effet, comptes qu'on ne peut pas désactiver, séances futures d'un
 * enseignant, et ce qui fait qu'un compte a un historique (il ne se supprime plus, il se désactive).
 */

export const MOTIFS = ["depart", "fin_contrat", "diplome", "exclusion", "autre"];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Date d'effet lue et vérifiée : aujourd'hui par défaut, jamais dans le passé. */
export const dateEffet = (valeur) => {
    const jour = aujourdhui();
    if (valeur === undefined || valeur === null || valeur === "") return jour;
    if (!DATE.test(String(valeur)) || Number.isNaN(Date.parse(valeur))) throw new ErreurMetier("Date d'effet invalide (AAAA-MM-JJ)", 400);
    if (valeur < jour) throw new ErreurMetier("La date d'effet ne peut pas être passée", 400);
    return valeur;
};

/** Motif vérifié contre la liste fermée. */
export const motifValide = (motif) => {
    if (!MOTIFS.includes(motif)) throw new ErreurMetier(`Motif inconnu : choisissez parmi ${MOTIFS.join(", ")}`, 400);
    return motif;
};

/** Compte chargé, ou 404. */
export const compteOuErreur = async (idUser, options = {}) => {
    const user = await Users.findByPk(idUser, options);
    if (!user) throw new ErreurMetier("Utilisateur non trouvé", 404);
    return user;
};

/**
 * Refuse ce qui laisserait l'établissement sans administration : désactiver son propre compte, ou
 * le dernier administrateur actif.
 */
export const verifierCible = async (acteur, user, { transaction } = {}) => {
    if (acteur && acteur.id_user === user.id_user) throw new ErreurMetier("Vous ne pouvez pas désactiver votre propre compte", 409, "SOI_MEME");
    if (user.role !== "admin") return;
    const autres = await Users.count({ where: { role: "admin", actif: true, id_user: { [Op.ne]: user.id_user } }, transaction });
    if (autres === 0) throw new ErreurMetier("Il doit rester au moins un administrateur actif", 409, "DERNIER_ADMIN");
};

/** Séances encore à faire d'un enseignant à partir d'une date (incluse). */
export const seancesFutures = (idUser, depuis, { transaction, include } = {}) =>
    Affectation.findAll({
        where: { id_user_enseignant: idUser, statut: STATUTS_ACTIFS.filter((s) => s !== "realise"), date_seance: { [Op.gte]: depuis } },
        include,
        order: [["date_seance", "ASC"]],
        transaction,
    });

/**
 * Un compte a un historique s'il s'est déjà connecté ou s'il a laissé une trace pédagogique :
 * séance donnée ou créée, présence, quiz passé ou créé, jeu, demande de report, support, annonce.
 */
export const aUnHistorique = async (idUser) => {
    const traces = [
        () => AuthSession.count({ where: { id_user: idUser } }),
        () => Affectation.count({ where: { [Op.or]: [{ id_user_enseignant: idUser }, { id_user_admin: idUser }] } }),
        () => Presence.count({ where: { id_user: idUser } }),
        () => TentativeQuiz.count({ where: { id_user: idUser } }),
        () => Questionnaire.count({ where: { id_user: idUser } }),
        () => JeuProgression.count({ where: { id_user: idUser } }),
        () => DemandeReport.count({ where: { id_user_enseignant: idUser } }),
        () => SupportCours.count({ where: { id_user_auteur: idUser } }),
        () => Annonce.count({ where: { id_user_auteur: idUser } }),
    ];
    for (const compter of traces) if ((await compter()) > 0) return true;
    return false;
};
