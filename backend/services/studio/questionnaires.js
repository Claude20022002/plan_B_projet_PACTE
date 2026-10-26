import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import { MediaQuiz, Questionnaire, QuestionQuiz, SessionQuiz, TentativeQuiz } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { validerQuestion } from "../../../shared/quiz/studio/types.js";
import { lireDescription, lireEtiquettes, lireReglages, lireTitre } from "./reglages.js";

/**
 * Banque de quiz de l'enseignant (Studio quiz). Un quiz appartient à son auteur seul (décision du
 * 15 octobre 2026 : banque libre, sans classe ni module) ; un autre enseignant reçoit 404, jamais
 * 403, pour ne pas révéler qu'il existe.
 */

export const QUESTIONS_MAX = 200;
// Format figé (D-11) : l'import refuse tout autre format ; le changer rendrait illisibles les anciens exports
export const FORMAT_EXPORT = "hestim-studio-quiz";

export const exigerEnseignant = (user) => {
    if (user?.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
};

export const questionnaireDe = async (user, id, options = {}) => {
    exigerEnseignant(user);
    const quiz = await Questionnaire.findOne({ where: { id_questionnaire: Number(id) || 0, id_user: user.id_user }, ...options });
    if (!quiz) throw new ErreurMetier("Quiz introuvable", 404);
    return quiz;
};

const questionDe = async (user, idQuestion) => {
    exigerEnseignant(user);
    const question = await QuestionQuiz.findByPk(Number(idQuestion) || 0, { include: [{ model: Questionnaire, as: "questionnaire", attributes: ["id_user", "id_questionnaire"] }] });
    if (!question || question.questionnaire.id_user !== user.id_user) throw new ErreurMetier("Question introuvable", 404);
    return question;
};

/** Le média d'une question doit appartenir à l'enseignant (sinon il lirait celui d'un collègue). */
const verifierMedia = async (user, idMedia, typeAttendu = null) => {
    if (idMedia === null) return;
    const media = await MediaQuiz.findOne({ where: { id_media: idMedia, id_user: user.id_user }, attributes: ["id_media", "type"] });
    if (!media) throw new ErreurMetier("Média introuvable", 404);
    if (typeAttendu && media.type !== typeAttendu) throw new ErreurMetier("Cette question demande une image", 400);
};

const questionValide = async (user, brute, numero = null) => {
    const resultat = validerQuestion(brute);
    if (!resultat.ok) throw new ErreurMetier(numero ? `Question ${numero} : ${resultat.raison}` : resultat.raison, 400);
    await verifierMedia(user, resultat.question.id_media, resultat.question.type === "zone_image" ? "image" : null);
    return resultat.question;
};

export const vueQuestion = (q) => ({
    id_question: q.id_question,
    ordre: q.ordre,
    type: q.type,
    enonce: q.enonce,
    points: q.points,
    explication: q.explication,
    id_media: q.id_media,
    extrait: q.extrait,
    duree_s: q.duree_s ?? null,
    donnees: q.donnees,
    a_relire: q.a_relire,
    origine: q.origine,
    source: q.source,
});

const vueQuiz = (quiz) => ({
    id_questionnaire: quiz.id_questionnaire,
    titre: quiz.titre,
    description: quiz.description,
    etiquettes: quiz.etiquettes ?? [],
    reglages: lireReglages(quiz.reglages),
    generation: quiz.generation_statut ? { statut: quiz.generation_statut, erreur: quiz.generation_erreur } : null,
    archive: quiz.archive,
    cree_le: quiz.createdAt,
    modifie_le: quiz.updatedAt,
});

/** Liste de la banque, avec ce que la carte affiche : questions, à relire, passations ouvertes. */
export const listerQuestionnaires = async (user, { recherche, etiquette, archives } = {}) => {
    exigerEnseignant(user);
    const where = { id_user: user.id_user, archive: archives === "1" || archives === true };
    const texte = String(recherche ?? "").trim().slice(0, 100);
    if (texte) where.titre = { [Op.like]: `%${texte.replace(/[\\%_]/g, (c) => `\\${c}`)}%` };
    const quiz = await Questionnaire.findAll({ where, order: [["updatedAt", "DESC"]], limit: 500 });
    const ids = quiz.map((q) => q.id_questionnaire);
    const [questions, sessions] = ids.length
        ? await Promise.all([
              QuestionQuiz.findAll({ where: { id_questionnaire: ids }, attributes: ["id_questionnaire", "a_relire", "points"], raw: true }),
              SessionQuiz.findAll({ where: { id_questionnaire: ids, essai: false }, attributes: ["id_questionnaire", "statut", "createdAt"], raw: true }),
          ])
        : [[], []];
    const filtre = String(etiquette ?? "").trim().toLowerCase();
    return quiz
        .filter((q) => !filtre || (q.etiquettes ?? []).some((e) => e.toLowerCase() === filtre))
        .map((q) => {
            const siennes = questions.filter((x) => x.id_questionnaire === q.id_questionnaire);
            const passations = sessions.filter((s) => s.id_questionnaire === q.id_questionnaire);
            return {
                ...vueQuiz(q),
                nb_questions: siennes.length,
                a_relire: siennes.filter((x) => x.a_relire).length,
                points: Math.round(siennes.reduce((s, x) => s + x.points, 0) * 100) / 100,
                passations_ouvertes: passations.filter((s) => s.statut === "ouverte").length,
                derniere_passation: passations.map((s) => s.createdAt).sort().pop() ?? null,
            };
        });
};

export const creerQuestionnaire = async (user, { titre, description, etiquettes, reglages } = {}) => {
    exigerEnseignant(user);
    const quiz = await Questionnaire.create({ id_user: user.id_user, titre: lireTitre(titre), description: lireDescription(description), etiquettes: lireEtiquettes(etiquettes), reglages: lireReglages(reglages) });
    return { ...vueQuiz(quiz), questions: [] };
};

export const detailQuestionnaire = async (user, id) => {
    const quiz = await questionnaireDe(user, id);
    const questions = await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, order: [["ordre", "ASC"], ["id_question", "ASC"]] });
    return { ...vueQuiz(quiz), questions: questions.map(vueQuestion) };
};

export const modifierQuestionnaire = async (user, id, champs = {}) => {
    const quiz = await questionnaireDe(user, id);
    const maj = {};
    if (champs.titre !== undefined) maj.titre = lireTitre(champs.titre);
    if (champs.description !== undefined) maj.description = lireDescription(champs.description);
    if (champs.etiquettes !== undefined) maj.etiquettes = lireEtiquettes(champs.etiquettes);
    if (champs.reglages !== undefined) maj.reglages = lireReglages(champs.reglages, quiz.reglages);
    if (champs.archive !== undefined) maj.archive = champs.archive === true;
    await quiz.update(maj);
    return detailQuestionnaire(user, id);
};

/** Supprime un quiz ; refusé s'il a déjà des copies d'étudiants (l'archiver garde leurs résultats). */
export const supprimerQuestionnaire = async (user, id) => {
    const quiz = await questionnaireDe(user, id);
    const copies = await TentativeQuiz.count({ include: [{ model: SessionQuiz, as: "session", where: { id_questionnaire: quiz.id_questionnaire, essai: false }, required: true }] });
    if (copies) throw new ErreurMetier("Des étudiants ont déjà passé ce quiz : archivez-le plutôt, pour garder leurs résultats", 409, "QUIZ_DEJA_PASSE");
    await quiz.destroy();
};

const prochainOrdre = async (idQuestionnaire, transaction) => ((await QuestionQuiz.max("ordre", { where: { id_questionnaire: idQuestionnaire }, transaction })) ?? -1) + 1;

const verifierPlace = async (idQuestionnaire, ajout = 1) => {
    const n = await QuestionQuiz.count({ where: { id_questionnaire: idQuestionnaire } });
    if (n + ajout > QUESTIONS_MAX) throw new ErreurMetier(`Un quiz compte ${QUESTIONS_MAX} questions au plus`, 400);
};

/** Ajoute des questions validées (éditeur, IA, import) à la fin du quiz. */
export const insererQuestions = async (user, quiz, brutes, { origine = "manuel", aRelire = false } = {}) => {
    await verifierPlace(quiz.id_questionnaire, brutes.length);
    const valides = [];
    for (const [i, brute] of brutes.entries()) valides.push({ ...(await questionValide(user, brute, brutes.length > 1 ? i + 1 : null)), source: brute.source ? String(brute.source).slice(0, 50) : null });
    return sequelize.transaction(async (transaction) => {
        let ordre = await prochainOrdre(quiz.id_questionnaire, transaction);
        const creees = [];
        for (const q of valides) creees.push(await QuestionQuiz.create({ ...q, id_questionnaire: quiz.id_questionnaire, ordre: ordre++, origine, a_relire: aRelire }, { transaction }));
        await quiz.changed("updatedAt", true);
        await quiz.save({ transaction });
        return creees.map(vueQuestion);
    });
};

export const ajouterQuestion = async (user, id, brute) => (await insererQuestions(user, await questionnaireDe(user, id), [brute]))[0];

/** Enregistrer une question vaut relecture : elle n'est plus « à relire ». */
export const modifierQuestion = async (user, idQuestion, brute) => {
    const question = await questionDe(user, idQuestion);
    const valide = await questionValide(user, brute);
    await question.update({ ...valide, a_relire: false });
    return vueQuestion(question);
};

export const marquerRelue = async (user, idQuestion) => {
    const question = await questionDe(user, idQuestion);
    await question.update({ a_relire: false });
    return vueQuestion(question);
};

export const supprimerQuestion = async (user, idQuestion) => {
    const question = await questionDe(user, idQuestion);
    await question.destroy();
};

export const dupliquerQuestion = async (user, idQuestion) => {
    const question = await questionDe(user, idQuestion);
    const quiz = await questionnaireDe(user, question.id_questionnaire);
    return (await insererQuestions(user, quiz, [vueQuestion(question)], { origine: question.origine }))[0];
};

/** Nouvel ordre : la liste complète des identifiants des questions du quiz. */
export const reordonnerQuestions = async (user, id, ids) => {
    const quiz = await questionnaireDe(user, id);
    const existantes = await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, attributes: ["id_question"] });
    const attendu = new Set(existantes.map((q) => q.id_question));
    if (!Array.isArray(ids) || ids.length !== attendu.size || new Set(ids).size !== ids.length || !ids.every((x) => attendu.has(Number(x)))) {
        throw new ErreurMetier("Donnez l'ordre de toutes les questions du quiz", 400);
    }
    await sequelize.transaction(async (transaction) => {
        for (const [ordre, idQuestion] of ids.entries()) await QuestionQuiz.update({ ordre }, { where: { id_question: Number(idQuestion) }, transaction });
    });
    return detailQuestionnaire(user, id);
};

export const dupliquerQuestionnaire = async (user, id) => {
    const source = await detailQuestionnaire(user, id);
    const copie = await creerQuestionnaire(user, { titre: `${source.titre} (copie)`.slice(0, 200), description: source.description, etiquettes: source.etiquettes, reglages: source.reglages });
    const quiz = await questionnaireDe(user, copie.id_questionnaire);
    if (source.questions.length) await insererQuestions(user, quiz, source.questions, { origine: "manuel" });
    return detailQuestionnaire(user, copie.id_questionnaire);
};

/** Export en JSON (sans les médias, qui restent sur le serveur) : sauvegarde ou partage entre collègues. */
export const exporterQuestionnaire = async (user, id) => {
    const quiz = await detailQuestionnaire(user, id);
    return {
        format: FORMAT_EXPORT,
        version: 1,
        titre: quiz.titre,
        description: quiz.description,
        etiquettes: quiz.etiquettes,
        reglages: quiz.reglages,
        questions: quiz.questions.map(({ type, enonce, points, explication, extrait, donnees }) => ({ type, enonce, points, explication, extrait, donnees })),
    };
};

export const importerQuestionnaire = async (user, donnees) => {
    exigerEnseignant(user);
    if (donnees?.format !== FORMAT_EXPORT || donnees.version !== 1 || !Array.isArray(donnees.questions)) throw new ErreurMetier("Ce fichier n'est pas un export du Studio quiz", 400);
    if (donnees.questions.length > QUESTIONS_MAX) throw new ErreurMetier(`Un quiz compte ${QUESTIONS_MAX} questions au plus`, 400);
    // Toutes les questions sont vérifiées avant de créer quoi que ce soit
    const questions = donnees.questions.map((q) => ({ ...q, id_media: null }));
    for (const [i, q] of questions.entries()) {
        const r = validerQuestion(q);
        if (!r.ok) throw new ErreurMetier(`Question ${i + 1} : ${r.raison}`, 400);
    }
    const cree = await creerQuestionnaire(user, { titre: donnees.titre, description: donnees.description, etiquettes: donnees.etiquettes, reglages: donnees.reglages });
    const quiz = await questionnaireDe(user, cree.id_questionnaire);
    if (questions.length) await insererQuestions(user, quiz, questions, { origine: "import" });
    return detailQuestionnaire(user, cree.id_questionnaire);
};
