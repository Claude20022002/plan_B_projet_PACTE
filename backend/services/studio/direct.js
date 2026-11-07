import { UniqueConstraintError } from "sequelize";
import { Appartenir, JoueurDirect, QuestionQuiz, ReponseDirect, SessionQuiz, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesANotifier } from "../planning/seances.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";
import { exigerEnseignant, questionnaireDe } from "./questionnaires.js";
import { lireReglages, lireTitre } from "./reglages.js";
import { tirerCode, verifierGroupe, verifierSeance } from "./sessions.js";
import { actualiser, changerEtape, diffusionDirect, dureeDe, equipes, infosMedia, maintenantMs, scores } from "./directEtat.js";
import { dureeQuestion, nuageDeMots, questionsHorsDirect, repartition } from "../../../shared/quiz/studio/direct.js";
import { bonneReponse } from "../../../shared/quiz/studio/correction.js";
import { vueEtudiant } from "../../../shared/quiz/studio/vueEtudiant.js";

/**
 * Quiz en direct du Studio, côté enseignant (docs/plans/sortie-classquiz.md, lot SC-1a) : lancer
 * une diffusion en direct, la faire avancer question par question, et l'écran à projeter.
 * L'écran projeté ne montre jamais la bonne réponse avant la correction.
 */

const sessionDirectDe = async (user, id) => {
    exigerEnseignant(user);
    const session = await diffusionDirect(id);
    if (session.id_user !== user.id_user) throw new ErreurMetier("Quiz en direct introuvable", 404);
    return session;
};

/** Prévient les étudiants de la classe visée (et de ses sous-groupes). Ne bloque jamais le lancement. */
const prevenirLaClasse = async (session, idGroupe) => {
    if (!idGroupe) return 0;
    try {
        const groupes = await groupesANotifier([idGroupe]);
        const ids = [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] })).map((a) => a.id_user_etudiant))];
        if (ids.length) {
            await creerNotificationsMultiples({ id_users: ids, titre: "Quiz en direct", message: `« ${session.titre} » commence : scannez le QR code ou saisissez le code ${session.code}.`, type_notification: "info", lien: `/quiz/code/${session.code}` });
        }
        return ids.length;
    } catch (erreur) {
        console.error("Quiz en direct : notification impossible :", erreur.message);
        return 0;
    }
};

/**
 * Lance un quiz en direct : copie figée des questions, code et QR code, étape « attente ».
 * Refusé si une question proposée par l'IA n'est pas relue, ou si une question ne se pose pas
 * en direct (réponse rédigée, zone sur image, association, texte à trous).
 */
export const lancerDirect = async (user, idQuestionnaire, { titre, id_groupe, id_affectation, duree_question_s } = {}) => {
    const quiz = await questionnaireDe(user, idQuestionnaire);
    if (quiz.generation_statut === "en_cours") throw new ErreurMetier("L'IA écrit encore les questions de ce quiz", 409);
    const questions = await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, order: [["ordre", "ASC"], ["id_question", "ASC"]] });
    if (!questions.length) throw new ErreurMetier("Ajoutez au moins une question avant de lancer le quiz", 400);
    const aRelire = questions.filter((q) => q.a_relire).length;
    if (aRelire) throw new ErreurMetier(`${aRelire} question${aRelire > 1 ? "s" : ""} proposée${aRelire > 1 ? "s" : ""} par l'IA ${aRelire > 1 ? "restent" : "reste"} à relire`, 409, "QUESTIONS_A_RELIRE");
    const hors = questionsHorsDirect(questions).length;
    if (hors) {
        throw new ErreurMetier(`${hors} question${hors > 1 ? "s" : ""} ne se ${hors > 1 ? "posent" : "pose"} pas en direct (réponse rédigée, zone sur image, association ou texte à trous) : diffusez ce quiz chacun à son rythme, ou retirez-les`, 409, "QUESTIONS_HORS_DIRECT");
    }
    const groupe = await verifierGroupe(user, id_groupe);
    const donnees = {
        id_questionnaire: quiz.id_questionnaire,
        id_user: user.id_user,
        titre: lireTitre(titre, { requis: false }) || quiz.titre,
        questions: questions.map((q) => ({ id_question: q.id_question, type: q.type, enonce: q.enonce, points: q.points, explication: q.explication, id_media: q.id_media, extrait: q.extrait, duree_s: q.duree_s ?? null, donnees: q.donnees })),
        reglages: { ...lireReglages({}, quiz.reglages), duree_question_s: dureeQuestion(duree_question_s) },
        id_groupe: groupe,
        id_affectation: await verifierSeance(user, id_affectation),
        mode: "direct",
        direct_etape: "attente",
    };
    for (let essai = 0; essai < 5; essai += 1) {
        try {
            const session = await SessionQuiz.create({ ...donnees, code: tirerCode() });
            const notifies = await prevenirLaClasse(session, groupe);
            return { ...(await vueEnseignant(user, session.id_session)), notifies };
        } catch (erreur) {
            if (!(erreur instanceof UniqueConstraintError)) throw erreur;
        }
    }
    throw new ErreurMetier("Impossible de tirer un code libre : réessayez", 503);
};

/** Étapes depuis lesquelles chaque action est permise, et ce qu'elle fait. */
const ACTIONS = {
    suivante: { depuis: ["attente", "correction", "classement"], refus: "Fermez d'abord la question en cours" },
    fermer: { depuis: ["question"], refus: "Aucune question ouverte" },
    classement: { depuis: ["correction"], refus: "Le classement se montre après la correction" },
    terminer: { depuis: ["attente", "question", "correction", "classement"], refus: "Ce quiz en direct est déjà terminé" },
};

/**
 * Fait avancer la diffusion : « suivante » (ou la première question), « fermer » la question,
 * montrer le « classement », « terminer ». Après la dernière question, « suivante » termine.
 */
export const agirDirect = async (user, id, action) => {
    const regle = ACTIONS[action];
    if (!regle) throw new ErreurMetier("Action inconnue", 400);
    const session = await actualiser(await sessionDirectDe(user, id));
    if (!regle.depuis.includes(session.direct_etape)) throw new ErreurMetier(regle.refus, 409);
    if (action === "fermer") await changerEtape(session, { direct_etape: "correction" });
    if (action === "classement") await changerEtape(session, { direct_etape: "classement" });
    if (action === "terminer") await changerEtape(session, { direct_etape: "termine", statut: "fermee" });
    if (action === "suivante") {
        const index = (session.direct_index ?? -1) + 1;
        const fin = index >= session.questions.length;
        await changerEtape(session, fin ? { direct_etape: "termine", statut: "fermee" } : { direct_etape: "question", direct_index: index, direct_debut_ms: maintenantMs() });
    }
    return vueEnseignant(user, id);
};

/** Correction projetée : bonne réponse, répartition des choix, nuage des réponses courtes. */
const correctionDe = async (session, question) => {
    const reponses = await ReponseDirect.findAll({ where: { id_session: session.id_session, index_question: session.direct_index }, attributes: ["reponse", "statut"], raw: true });
    return {
        bonne_reponse: bonneReponse(question),
        explication: question.explication ?? null,
        repartition: repartition(question, reponses.map((r) => r.reponse)),
        nuage: question.type === "reponse_courte" ? nuageDeMots(reponses.map((r) => r.reponse).filter((r) => typeof r === "string")) : null,
        justes: reponses.filter((r) => r.statut === "juste").length,
    };
};

/** L'écran de l'enseignant, à projeter : étape, chrono, question, réponses reçues, correction, classement. */
export const vueEnseignant = async (user, id) => {
    const session = await actualiser(await sessionDirectDe(user, id));
    const etape = session.direct_etape;
    const question = session.direct_index !== null && session.direct_index >= 0 ? session.questions[session.direct_index] : null;
    const [nbJoueurs, recues] = await Promise.all([
        JoueurDirect.count({ where: { id_session: session.id_session } }),
        question ? ReponseDirect.count({ where: { id_session: session.id_session, index_question: session.direct_index } }) : 0,
    ]);
    const vue = {
        id_session: session.id_session,
        id_questionnaire: session.id_questionnaire,
        code: session.code,
        titre: session.titre,
        etape,
        index: session.direct_index,
        total: session.questions.length,
        version: session.direct_version,
        duree_s: dureeDe(session),
        debut_ms: session.direct_debut_ms === null ? null : Number(session.direct_debut_ms),
        maintenant_ms: maintenantMs(),
        id_groupe: session.id_groupe,
        id_affectation: session.id_affectation,
        joueurs: nbJoueurs,
        reponses_recues: recues,
    };
    if (etape === "attente") {
        const joueurs = await JoueurDirect.findAll({ where: { id_session: session.id_session }, include: [{ model: Users, as: "etudiant", attributes: ["prenom", "nom"] }], order: [["createdAt", "ASC"]] });
        vue.arrivees = joueurs.map((j) => `${j.etudiant?.prenom ?? ""} ${j.etudiant?.nom ?? ""}`.trim());
    }
    if (question) {
        vue.question = vueEtudiant(question);
        vue.media = await infosMedia(question);
    }
    if (question && etape !== "question") vue.correction = await correctionDe(session, question);
    if (etape === "classement" || etape === "termine") {
        vue.classement = await scores(session);
        vue.equipes = await equipes(session, vue.classement);
    }
    return vue;
};
