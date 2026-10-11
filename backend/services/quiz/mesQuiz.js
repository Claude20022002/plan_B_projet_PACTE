import { ErreurMetier } from "../planning/enseignements.js";
import { appelerClassQuiz, cheminSigne } from "./clientClassQuiz.js";

/**
 * Mes quiz (reste du lot IA-4) : l'enseignant relit puis modifie depuis Planner un quiz qu'il a
 * dans le service de quiz, sans l'ouvrir. La lecture et l'écriture passent par les routes signées
 * du fork ; c'est lui qui contrôle chaque question et vérifie que le quiz est bien à l'enseignant.
 * Les parties déjà lancées et les devoirs déjà donnés gardent leur copie des questions.
 */

// Types que Planner sait écrire (ceux de la génération par l'IA et de ses devoirs notés)
const TYPES_MODIFIABLES = new Set(["ABCD", "CHECK"]);
const ID_QUIZ = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const verifierDemande = (user, quizId) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    if (typeof quizId !== "string" || !ID_QUIZ.test(quizId)) throw new ErreurMetier("Quiz introuvable", 404);
};

/** Question au format d'écriture du fork : durée en nombre, réponses réduites au texte et au juste. */
const questionAEcrire = (q) => ({
    question: String(q?.question ?? ""),
    time: Number(q?.time),
    type: q?.type,
    answers: (Array.isArray(q?.answers) ? q.answers : []).map((r) => ({ answer: String(r?.answer ?? ""), right: r?.right === true })),
});

/**
 * Quiz de l'enseignant prêt à modifier : { id, titre, description, questions, modifiable }.
 * `modifiable` est faux quand le quiz contient une question que Planner ne sait pas écrire (créée
 * dans le service de quiz : texte libre, ordre, sondage…) : il se modifie alors là-bas.
 */
export const quizAModifier = async (user, quizId) => {
    verifierDemande(user, quizId);
    const quiz = await appelerClassQuiz(cheminSigne(`/api/v1/hestim/quiz/${quizId.toLowerCase()}`, { email: user.email }));
    if (!quiz) throw new ErreurMetier("Quiz introuvable dans vos quiz", 404);
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const modifiable = questions.every((q) => TYPES_MODIFIABLES.has(q?.type));
    return {
        id: quiz.id,
        titre: quiz.titre,
        description: quiz.description ?? "",
        questions: modifiable ? questions.map(questionAEcrire) : questions,
        modifiable,
    };
};

/**
 * Remplace le titre, la description et les questions d'un quiz de l'enseignant.
 * Rend { id, titre, nb_questions } ; une version refusée par le fork lève une erreur 422 qui dit pourquoi.
 */
export const modifierQuiz = async (user, quizId, { titre, description, questions } = {}) => {
    verifierDemande(user, quizId);
    if (typeof titre !== "string" || !titre.trim()) throw new ErreurMetier("Le titre est requis", 400);
    if (!Array.isArray(questions) || !questions.length) throw new ErreurMetier("Le quiz doit garder au moins une question", 400);
    if (questions.some((q) => !TYPES_MODIFIABLES.has(q?.type))) throw new ErreurMetier("Seuls les choix unique et multiple se modifient depuis Planner", 400);
    const modifie = await appelerClassQuiz(`/api/v1/hestim/quiz/${quizId.toLowerCase()}`, {
        email: user.email,
        titre: titre.trim(),
        description: typeof description === "string" ? description : "",
        questions: questions.map(questionAEcrire),
    });
    if (modifie?.id?.toLowerCase() !== quizId.toLowerCase()) throw new ErreurMetier("Réponse inattendue du service de quiz", 502);
    return modifie;
};
