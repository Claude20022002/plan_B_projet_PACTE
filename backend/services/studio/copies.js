import { Op } from "sequelize";
import { TentativeQuiz } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { corriger, totaliser } from "../../../shared/quiz/studio/correction.js";

/**
 * Correction des copies du Studio quiz, commune au parcours de l'étudiant (rendre) et à celui de
 * l'enseignant (résultats, note posée à la main). Une copie dont le temps est écoulé est rendue
 * d'office avec les réponses déjà enregistrées : l'enregistrement se fait à chaque réponse.
 */

// Marge laissée au dernier enregistrement parti juste avant la fin du temps (réseau lent)
export const GRACE_MS = 30 * 1000;

export const questionsDeLaSession = (session) => new Map((session.questions ?? []).map((q) => [q.id_question, q]));

/** Le temps de la copie est-il écoulé (marge comprise) ? */
export const estExpiree = (tentative, maintenant = new Date()) => Boolean(tentative.echeance) && maintenant.getTime() > new Date(tentative.echeance).getTime() + GRACE_MS;

/**
 * Corrige toute la copie. Une note posée à la main par l'enseignant (`main`) est gardée telle quelle.
 * @returns {{ corrections: object, points: number, max: number, pourcentage: number, complet: boolean }}
 */
export const noterCopie = (session, tentative) => {
    const questions = questionsDeLaSession(session);
    const precedentes = tentative.corrections ?? {};
    const corrections = {};
    for (const id of tentative.ordre.questions) {
        const question = questions.get(id);
        if (!question) continue;
        const main = precedentes[id]?.main ? precedentes[id] : null;
        corrections[id] = main ?? corriger(question, tentative.reponses?.[id], { partiel: session.reglages.notation_partielle });
    }
    return { corrections, ...totaliser(Object.values(corrections)) };
};

/** Rend la copie : correction, score, date. Sans effet sur une copie déjà rendue. */
export const rendreCopie = async (session, tentative, maintenant = new Date()) => {
    if (tentative.statut !== "en_cours") return tentative;
    const note = noterCopie(session, tentative);
    // Rendue d'office : datée de la fin du temps, pas du moment où quelqu'un l'a remarqué
    const rendue = tentative.echeance && maintenant > new Date(tentative.echeance) ? new Date(tentative.echeance) : maintenant;
    // Deux rendus simultanés (bouton et fin du temps) : le premier gagne, le second relit sa copie
    await TentativeQuiz.update(
        { statut: "rendue", rendue_le: rendue, corrections: note.corrections, points: note.points, max: note.max, pourcentage: note.pourcentage, complet: note.complet },
        { where: { id_tentative: tentative.id_tentative, statut: "en_cours" } }
    );
    return tentative.reload();
};

/** Rend d'office les copies d'une session dont le temps est écoulé (lu par les résultats). */
export const rendreCopiesExpirees = async (session, maintenant = new Date()) => {
    const enRetard = await TentativeQuiz.findAll({
        where: { id_session: session.id_session, statut: "en_cours", echeance: { [Op.lt]: new Date(maintenant.getTime() - GRACE_MS) } },
    });
    for (const tentative of enRetard) await rendreCopie(session, tentative, maintenant);
    return enRetard.length;
};

/** Rend toutes les copies en cours (session fermée par l'enseignant). */
export const rendreToutesLesCopies = async (session, maintenant = new Date()) => {
    const enCours = await TentativeQuiz.findAll({ where: { id_session: session.id_session, statut: "en_cours" } });
    for (const tentative of enCours) await rendreCopie(session, tentative, maintenant);
    return enCours.length;
};

/**
 * Note posée par l'enseignant sur une question (réponse rédigée, ou réponse juste que la
 * correction automatique n'a pas reconnue). Le total est recalculé.
 */
export const noterQuestionAMain = async (session, tentative, idQuestion, { points, commentaire } = {}) => {
    if (tentative.statut !== "rendue") throw new ErreurMetier("Cette copie n'est pas encore rendue", 409);
    const question = questionsDeLaSession(session).get(Number(idQuestion));
    if (!question || !tentative.ordre.questions.includes(question.id_question)) throw new ErreurMetier("Question introuvable dans cette copie", 404);
    const note = Number(points);
    if (!Number.isFinite(note) || note < 0 || note > question.points) throw new ErreurMetier(`Points : de 0 à ${question.points}`, 400);
    const remarque = commentaire ? String(commentaire).replace(/<[^>]*>/g, "").trim().slice(0, 1000) : null;
    const arrondie = Math.round(note * 100) / 100;
    const corrections = {
        ...(tentative.corrections ?? {}),
        [question.id_question]: { points: arrondie, max: question.points, statut: arrondie >= question.points ? "juste" : arrondie > 0 ? "partiel" : "faux", main: true, commentaire: remarque },
    };
    const total = totaliser(Object.values(corrections));
    await tentative.update({ corrections, points: total.points, max: total.max, pourcentage: total.pourcentage, complet: total.complet });
    return tentative;
};
