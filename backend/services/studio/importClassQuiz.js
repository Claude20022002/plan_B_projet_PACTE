import { Questionnaire, QuestionQuiz, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { appelerClassQuiz, cheminSigne } from "../quiz/clientClassQuiz.js";
import { validerQuestion } from "../../../shared/quiz/studio/types.js";
import { creerQuestionnaire, exigerEnseignant, insererQuestions, questionnaireDe, QUESTIONS_MAX } from "./questionnaires.js";

/**
 * Import des quiz de ClassQuiz dans le Studio quiz (docs/plans/sortie-classquiz.md, lot SC-2) : Planner
 * ne doit plus dépendre de ClassQuiz, et les quiz que les enseignants y ont créés doivent survivre
 * à son retrait. La lecture passe par les routes signées du fork (/api/v1/hestim/…). Aucun code du fork
 * n'est repris : seulement la forme de ses questions, correspondance ci-dessous.
 *
 *   ABCD, CHECK → choix unique (une bonne réponse) ou choix multiple (plusieurs)
 *   TEXT        → réponse courte (les réponses acceptées sont reprises)
 *   ORDER       → remise en ordre
 *   RANGE       → nombre (valeur centrale des bornes justes, tolérance = demi-écart)
 *   VOTING, SLIDE (sondage, diapositive), questions illisibles : ignorées, et dites dans le bilan
 *
 * Un quiz importé arrive en brouillon (questions « à relire ») : l'enseignant le relit avant de le
 * diffuser. L'identifiant ClassQuiz est gardé dans `source` de chaque question : relancer l'import
 * ne recrée rien. Les images ne sont pas reprises (le fork n'offre pas de route pour les lire).
 */

const PREFIXE = "classquiz:";
const ID_QUIZ = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ETIQUETTE = "ClassQuiz";

const options = (reponses) => (Array.isArray(reponses) ? reponses : []).map((r, i) => ({ id: `o${i + 1}`, texte: String(r?.answer ?? "") }));

/** Traduit une question du fork ; rend { question } ou { ignoree: raison }. La validation du Studio vient ensuite. */
export const convertirQuestion = (q) => {
    const enonce = String(q?.question ?? "");
    switch (q?.type) {
        case "ABCD":
        case "CHECK": {
            const reponses = Array.isArray(q.answers) ? q.answers : [];
            const bonnes = reponses.flatMap((r, i) => (r?.right === true ? [`o${i + 1}`] : []));
            if (!bonnes.length) return { ignoree: "aucune bonne réponse indiquée" };
            if (bonnes.length === 1) return { question: { type: "choix_unique", enonce, donnees: { options: options(reponses), bonne: bonnes[0] } } };
            return { question: { type: "choix_multiple", enonce, donnees: { options: options(reponses), bonnes } } };
        }
        case "TEXT": {
            const reponses = Array.isArray(q.answers) ? q.answers : [];
            return { question: { type: "reponse_courte", enonce, donnees: { acceptees: reponses.map((r) => String(r?.answer ?? "")), casse: reponses.some((r) => r?.case_sensitive === true) } } };
        }
        case "ORDER":
            return { question: { type: "ordre", enonce, donnees: { elements: options(q.answers) } } };
        case "RANGE": {
            const r = q.answers ?? {};
            const bas = Number(r.min_correct);
            const haut = Number(r.max_correct);
            if (!Number.isFinite(bas) || !Number.isFinite(haut) || haut < bas) return { ignoree: "bornes de la bonne réponse illisibles" };
            return { question: { type: "numerique", enonce, donnees: { valeur: (bas + haut) / 2, tolerance: (haut - bas) / 2 } } };
        }
        case "VOTING":
            return { ignoree: "sondage : sans bonne réponse, il n'a pas d'équivalent dans le Studio" };
        case "SLIDE":
            return { ignoree: "diapositive : ce n'est pas une question" };
        default:
            return { ignoree: `type « ${q?.type ?? "inconnu"} » non pris en charge` };
    }
};

const dejaImporte = async (user, idClassQuiz) =>
    QuestionQuiz.findOne({ where: { source: `${PREFIXE}${idClassQuiz}` }, include: [{ model: Questionnaire, as: "questionnaire", where: { id_user: user.id_user }, attributes: ["id_questionnaire"] }] });

/** Quiz de l'enseignant dans le fork : [{ id, titre, nb_questions }] (vide si le service n'en a pas ou n'est pas configuré). */
export const quizDuFork = async (user) => {
    const liste = await appelerClassQuiz(cheminSigne("/api/v1/hestim/quizzes", { email: user.email }));
    return (Array.isArray(liste) ? liste : []).filter((q) => ID_QUIZ.test(String(q?.id ?? "")));
};

/** Combien de quiz du fork l'enseignant n'a pas encore importés ; 0 si le service est absent. */
export const quizAImporter = async (user) => {
    exigerEnseignant(user);
    try {
        const restants = [];
        for (const q of await quizDuFork(user)) if (!(await dejaImporte(user, q.id))) restants.push({ id: q.id, titre: q.titre, nb_questions: q.nb_questions ?? null });
        return { quiz: restants, a_importer: restants.length };
    } catch (erreur) {
        if (erreur instanceof ErreurMetier) return { quiz: [], a_importer: 0 };
        throw erreur;
    }
};

/** Importe un quiz du fork pour `user` ; rend son bilan. */
export const importerQuiz = async (user, idClassQuiz) => {
    exigerEnseignant(user);
    if (!ID_QUIZ.test(String(idClassQuiz))) throw new ErreurMetier("Quiz introuvable", 404);
    const id = String(idClassQuiz).toLowerCase();
    const existant = await dejaImporte(user, id);
    if (existant) return { id, resultat: "deja_importe", id_questionnaire: existant.id_questionnaire, importees: 0, ignorees: [] };

    const quiz = await appelerClassQuiz(cheminSigne(`/api/v1/hestim/quiz/${id}`, { email: user.email }));
    if (!quiz) throw new ErreurMetier("Quiz introuvable dans vos quiz", 404);
    const brutes = Array.isArray(quiz.questions) ? quiz.questions : [];

    const valides = [];
    const ignorees = [];
    for (const [i, q] of brutes.entries()) {
        const traduite = convertirQuestion(q);
        const verifiee = traduite.question ? validerQuestion(traduite.question) : { ok: false, raison: traduite.ignoree };
        if (verifiee.ok) valides.push({ ...verifiee.question, source: `${PREFIXE}${id}` });
        else ignorees.push({ numero: i + 1, type: q?.type ?? null, raison: verifiee.raison });
    }
    if (valides.length > QUESTIONS_MAX) {
        for (const q of valides.splice(QUESTIONS_MAX)) ignorees.push({ numero: null, type: q.type, raison: `plus de ${QUESTIONS_MAX} questions` });
    }
    if (!valides.length) return { id, titre: quiz.titre, resultat: "vide", id_questionnaire: null, importees: 0, ignorees };

    const cree = await creerQuestionnaire(user, { titre: String(quiz.titre || "Quiz importé").slice(0, 200), description: quiz.description ?? "", etiquettes: [ETIQUETTE] });
    await insererQuestions(user, await questionnaireDe(user, cree.id_questionnaire), valides, { origine: "import", aRelire: true });
    return { id, titre: quiz.titre, resultat: "importe", id_questionnaire: cree.id_questionnaire, importees: valides.length, ignorees };
};

/** Importe tous les quiz du fork de l'enseignant qui ne le sont pas encore ; rend { quiz: [bilans], importes, deja_importes, erreurs }. */
export const importerMesQuiz = async (user) => {
    exigerEnseignant(user);
    const bilans = [];
    for (const q of await quizDuFork(user)) {
        try {
            bilans.push({ titre: q.titre, ...(await importerQuiz(user, q.id)) });
        } catch (erreur) {
            if (!(erreur instanceof ErreurMetier)) throw erreur;
            bilans.push({ id: q.id, titre: q.titre, resultat: "erreur", message: erreur.message, importees: 0, ignorees: [] });
        }
    }
    return {
        quiz: bilans,
        importes: bilans.filter((b) => b.resultat === "importe").length,
        deja_importes: bilans.filter((b) => b.resultat === "deja_importe").length,
        erreurs: bilans.filter((b) => b.resultat === "erreur").length,
    };
};

/**
 * Commande d'administration : importe les quiz de tous les enseignants actifs (compte Planner actif,
 * reconnu à son adresse e-mail), décision du 20 octobre 2026. Rend un bilan par enseignant.
 */
export const importerPourEnseignantsActifs = async () => {
    const enseignants = await Users.findAll({ where: { role: "enseignant", actif: true }, attributes: ["id_user", "email", "nom", "prenom", "role"], order: [["id_user", "ASC"]] });
    const bilans = [];
    for (const enseignant of enseignants) {
        if (!enseignant.email) continue;
        try {
            const bilan = await importerMesQuiz(enseignant);
            if (bilan.quiz.length) bilans.push({ enseignant: `${enseignant.prenom} ${enseignant.nom}`.trim(), email: enseignant.email, ...bilan });
        } catch (erreur) {
            if (!(erreur instanceof ErreurMetier)) throw erreur;
            bilans.push({ enseignant: `${enseignant.prenom} ${enseignant.nom}`.trim(), email: enseignant.email, quiz: [], importes: 0, deja_importes: 0, erreurs: 1, message: erreur.message });
        }
    }
    return bilans;
};
