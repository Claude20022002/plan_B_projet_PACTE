import { Op } from "sequelize";
import { Questionnaire, QuestionQuiz, UsageIaQuiz } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { journaliser } from "../journalSecurite.js";
import { estConfigure, genererJson } from "../ia/client.js";
import { extraireSupport } from "../ia/extraction.js";
import { lireSujet } from "../ia/consigne.js";
import { TYPES, validerQuestion } from "../../../shared/quiz/studio/types.js";
import { LANGUES, consigneStudio, depuisIa, difficulteConnue, messageStudio, transcriptionMinutee, typesDemandes } from "./iaConsigne.js";
import { genererImage, genererVoix, mediaDisponible, transcrire } from "./iaFournisseurs.js";
import { creerQuestionnaire, exigerEnseignant, insererQuestions, questionnaireDe, vueQuestion } from "./questionnaires.js";
import { detailMedia, enregistrerMedia, mediaDe } from "./medias.js";

/**
 * Génération par l'IA dans le Studio quiz. Les questions arrivent « à relire » dans l'éditeur :
 * le quiz ne s'ouvre aux étudiants qu'une fois chacune relue (sessions.js). Chaque appel est
 * compté par nature (quiz, question, image, voix, transcription), avec son quota sur 24 heures,
 * car une image ou une minute de voix coûte bien plus qu'une question en texte.
 */

export const NOMBRE_MAX = 30;
const QUOTAS = { quiz: ["STUDIO_IA_QUIZ_PAR_JOUR", 20], question: ["STUDIO_IA_QUESTIONS_PAR_JOUR", 100], image: ["STUDIO_IA_IMAGES_PAR_JOUR", 15], voix: ["STUDIO_IA_VOIX_PAR_JOUR", 15], transcription: ["STUDIO_IA_TRANSCRIPTIONS_PAR_JOUR", 10] };
const quota = (nature) => Math.max(1, Number(process.env[QUOTAS[nature][0]]) || QUOTAS[nature][1]);
const GENERATION_MAX_MS = 10 * 60 * 1000;
const SCRIPT_MAX = 4000;

const enCours = new Set();
/** Tests : attend la fin des générations lancées. */
export const attendreGenerationsStudio = () => Promise.all([...enCours]);
const enTache = (promesse) => {
    const tache = promesse.finally(() => enCours.delete(tache));
    enCours.add(tache);
};

const utilisees = (user, nature) => UsageIaQuiz.count({ where: { id_user: user.id_user, nature, statut: { [Op.ne]: "erreur" }, createdAt: { [Op.gte]: new Date(Date.now() - 24 * 3600 * 1000) } } });

const verifierQuota = async (user, nature) => {
    if ((await utilisees(user, nature)) >= quota(nature)) throw new ErreurMetier(`Limite de ${quota(nature)} par 24 heures atteinte pour cette fonction d'IA : réessayez plus tard`, 429);
};

/** Ce que l'écran peut proposer : fonctions configurées et appels restants sur 24 heures. */
export const disponibiliteIa = async (user) => {
    exigerEnseignant(user);
    const natures = Object.keys(QUOTAS);
    const comptes = await Promise.all(natures.map((n) => utilisees(user, n)));
    return {
        texte: estConfigure(),
        image: mediaDisponible("image"),
        voix: mediaDisponible("voix") && estConfigure(),
        transcription: mediaDisponible("transcription"),
        restantes: Object.fromEntries(natures.map((n, i) => [n, Math.max(0, quota(n) - comptes[i])])),
        nombre_max: NOMBRE_MAX,
    };
};

const lireReglagesIa = (brut = {}) => {
    const nombre = Number(brut.nombre ?? 10);
    if (!Number.isInteger(nombre) || nombre < 1 || nombre > NOMBRE_MAX) throw new ErreurMetier(`Nombre de questions : de 1 à ${NOMBRE_MAX}`, 400);
    const difficulte = brut.difficulte ?? "application";
    if (!difficulteConnue(difficulte)) throw new ErreurMetier("Difficulté : decouverte, application ou approfondissement", 400);
    const langue = brut.langue ?? "fr";
    if (!LANGUES[langue]) throw new ErreurMetier(`Langue : ${Object.keys(LANGUES).join(", ")}`, 400);
    return { nombre, difficulte, langue, types: typesDemandes(brut.types) };
};

/** Valide les questions du modèle ; les invalides sont écartées sans bruit (comme pour les QCM). */
const questionsValides = (brutes, { duree = null, deja = [] } = {}) => {
    const valides = [];
    for (const brute of Array.isArray(brutes) ? brutes : []) {
        const convertie = depuisIa(brute);
        if (!convertie) continue;
        // Un extrait hors du média est retiré (le modèle a inventé l'horodatage)
        if (convertie.extrait && duree && !(Number(convertie.extrait.debut) < duree)) convertie.extrait = null;
        const r = validerQuestion({ ...convertie, id_media: null });
        // `deja` : énoncés des questions déjà dans le quiz ; une question en double est écartée
        const enonce = r.ok ? r.question.enonce.toLowerCase() : null;
        if (r.ok && !deja.some((d) => d.toLowerCase() === enonce) && !valides.some((v) => v.enonce.toLowerCase() === enonce)) valides.push({ ...r.question, source: convertie.source?.slice(0, 50) ?? null });
    }
    return valides;
};

const terminerUsage = (usage, champs) => usage.update({ ...champs, duree_ms: Date.now() - new Date(usage.createdAt).getTime() });

/** Prépare la source : texte du support, transcription d'un média (faite au besoin), ou sujet. */
const preparerSource = async (user, { fichier, plage, id_media, sujet, ecoute }) => {
    if (ecoute) {
        if (!sujet) throw new ErreurMetier("Donnez le sujet de l'écoute", 400);
        if (!mediaDisponible("voix")) throw new ErreurMetier("La voix de synthèse n'est pas configurée sur ce serveur", 503);
        await verifierQuota(user, "voix");
        return { source: "ecoute", sujet };
    }
    if (id_media) {
        const media = await mediaDe(user, id_media);
        if (media.type === "image") throw new ErreurMetier("Choisissez un audio ou une vidéo", 400);
        return { source: "media", media, sujet };
    }
    if (fichier?.contenu?.length) {
        const support = await extraireSupport(fichier, { plage });
        return { source: "fichier", support: support.unites.map((u) => `[${u.repere}]\n${u.texte}`).join("\n\n"), sujet, nom: fichier.nom };
    }
    if (sujet) return { source: "sujet", sujet };
    throw new ErreurMetier("Donnez un sujet, un support ou un média", 400);
};

/** Transcrit un média (et garde la transcription sur le média pour les fois suivantes). */
export const transcrireMedia = async (user, idMedia, { langue } = {}, contexte = null) => {
    const media = await mediaDe(user, idMedia, { contenu: true });
    if (media.type === "image") throw new ErreurMetier("Seuls un audio ou une vidéo se transcrivent", 400);
    if (!mediaDisponible("transcription")) throw new ErreurMetier("La transcription n'est pas configurée sur ce serveur", 503);
    await verifierQuota(user, "transcription");
    const usage = await UsageIaQuiz.create({ id_user: user.id_user, nature: "transcription", reglages: { id_media: media.id_media } });
    try {
        const t = await transcrire({ contenu: media.contenu, type: media.type_mime, nom: media.nom, langue: LANGUES[langue] ? langue : undefined });
        if (!t.texte) throw new ErreurMetier("Aucune parole reconnue dans ce média", 422);
        await media.update({ transcription: { texte: t.texte.slice(0, 20000), segments: t.segments.slice(0, 2000) }, ...(t.duree && !media.duree ? { duree: Math.round(t.duree * 10) / 10 } : {}) });
        await terminerUsage(usage, { statut: "pret", modele: t.modele ?? null });
    } catch (erreur) {
        await terminerUsage(usage, { statut: "erreur", erreur: String(erreur.message).slice(0, 500) });
        throw erreur;
    }
    await journaliser(contexte, { evenement: "quiz_ia_genere", id_user: user.id_user, details: { studio: true, nature: "transcription", id_media: media.id_media } });
    return detailMedia(user, media.id_media);
};

const executer = async (user, quiz, usage, preparee, reglages, contexte) => {
    const jetons = { entree: 0, sortie: 0 };
    let ajoutees = 0;
    try {
        let transcription = null;
        if (preparee.source === "media") {
            const media = preparee.media.transcription?.texte ? preparee.media : await transcrireMedia(user, preparee.media.id_media, { langue: reglages.langue }, contexte);
            transcription = transcriptionMinutee(media.transcription);
            await usage.update({ contexte: transcription });
        }
        const deja = (await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, attributes: ["enonce"] })).map((q) => q.enonce);
        const reponse = await genererJson({
            systeme: consigneStudio({ ...reglages, source: preparee.source }),
            utilisateur: messageStudio({ nombre: reglages.nombre, sujet: preparee.sujet, support: preparee.support, transcription, eviter: deja.slice(0, 50), etiquettes: quiz.etiquettes ?? [] }),
            maxJetons: Math.min(12000, 1200 + reglages.nombre * 450),
        });
        jetons.entree += reponse.jetons.entree;
        jetons.sortie += reponse.jetons.sortie;
        const valides = questionsValides(reponse.donnees?.questions, { duree: preparee.media?.duree, deja }).slice(0, reglages.nombre);
        if (!valides.length) throw new ErreurMetier("L'IA n'a proposé aucune question valide : réessayez ou précisez la demande", 502);
        let idMedia = preparee.media?.id_media ?? null;
        if (preparee.source === "ecoute") {
            const script = String(reponse.donnees?.script ?? "").replace(/<[^>]*>/g, "").trim().slice(0, SCRIPT_MAX);
            if (!script) throw new ErreurMetier("L'IA n'a pas écrit de script d'écoute : réessayez", 502);
            idMedia = (await creerVoix(user, { texte: script, nom: `ecoute-${quiz.id_questionnaire}.mp3` }, contexte)).id_media;
        }
        await insererQuestions(user, quiz, valides.map((q) => ({ ...q, id_media: idMedia, extrait: preparee.source === "media" ? q.extrait : null })), { origine: "ia", aRelire: true });
        ajoutees = valides.length;
        await quiz.update({ generation_statut: null, generation_erreur: null });
        await terminerUsage(usage, { statut: "pret", modele: reponse.modele, jetons_entree: jetons.entree, jetons_sortie: jetons.sortie });
    } catch (erreur) {
        if (!(erreur instanceof ErreurMetier)) console.error("Studio quiz, génération :", erreur.message);
        const message = erreur instanceof ErreurMetier ? erreur.message.slice(0, 500) : "Erreur inattendue pendant la génération";
        await quiz.update({ generation_statut: "erreur", generation_erreur: message });
        await terminerUsage(usage, { statut: "erreur", erreur: message, jetons_entree: jetons.entree, jetons_sortie: jetons.sortie });
    }
    await journaliser(contexte, { evenement: "quiz_ia_genere", id_user: user.id_user, details: { studio: true, nature: "quiz", id_questionnaire: quiz.id_questionnaire, source: preparee.source, questions: ajoutees, jetons: jetons.entree + jetons.sortie } });
};

/**
 * Lance une génération : dans un nouveau quiz, ou à la suite d'un quiz existant (`id_questionnaire`).
 * Les erreurs de source (fichier, média, quota) sont rendues tout de suite ; l'écriture se fait en tâche.
 */
export const lancerGenerationStudio = async (user, { id_questionnaire, titre, etiquettes, reglages: brut, fichier, plage, id_media, sujet: sujetBrut, ecoute } = {}, contexte = null) => {
    exigerEnseignant(user);
    if (!estConfigure()) throw new ErreurMetier("La génération par IA n'est pas configurée sur ce serveur", 503);
    const reglages = lireReglagesIa(brut);
    let sujet;
    try {
        sujet = lireSujet(sujetBrut);
    } catch (erreur) {
        throw new ErreurMetier(erreur.message, 400);
    }
    await verifierQuota(user, "quiz");
    const enCoursUser = await Questionnaire.findOne({ where: { id_user: user.id_user, generation_statut: "en_cours", updatedAt: { [Op.gte]: new Date(Date.now() - GENERATION_MAX_MS) } } });
    if (enCoursUser) throw new ErreurMetier("Une génération est déjà en cours : attendez qu'elle se termine", 409);
    const preparee = await preparerSource(user, { fichier, plage, id_media, sujet, ecoute: ecoute === true || ecoute === "1" || ecoute === "true" });
    const quiz = id_questionnaire
        ? await questionnaireDe(user, id_questionnaire)
        : await questionnaireDe(user, (await creerQuestionnaire(user, { titre: titre || sujet || preparee.nom?.replace(/\.[a-z0-9]{1,5}$/i, "") || preparee.media?.nom || "Quiz généré", etiquettes })).id_questionnaire);
    const usage = await UsageIaQuiz.create({ id_user: user.id_user, nature: "quiz", id_questionnaire: quiz.id_questionnaire, reglages: { ...reglages, source: preparee.source, sujet: sujet ?? null, id_media: preparee.media?.id_media ?? null }, contexte: preparee.support ?? null });
    await quiz.update({ generation_statut: "en_cours", generation_erreur: null, id_usage_ia: usage.id_usage });
    enTache(executer(user, quiz, usage, preparee, reglages, contexte));
    return { id_questionnaire: quiz.id_questionnaire, generation: { statut: "en_cours" } };
};

/** Remplace une question par une autre du même type, tirée de la même source (support, transcription, sujet). */
export const regenererQuestion = async (user, idQuestion, contexte = null) => {
    exigerEnseignant(user);
    const question = await QuestionQuiz.findByPk(Number(idQuestion) || 0);
    const quiz = question ? await questionnaireDe(user, question.id_questionnaire) : null;
    if (!question || !quiz) throw new ErreurMetier("Question introuvable", 404);
    if (!estConfigure()) throw new ErreurMetier("La génération par IA n'est pas configurée sur ce serveur", 503);
    await verifierQuota(user, "question");
    const origine = quiz.id_usage_ia ? await UsageIaQuiz.findByPk(quiz.id_usage_ia) : null;
    const r = origine?.reglages ?? { langue: "fr", difficulte: "application" };
    const source = r.source === "fichier" && origine?.contexte ? "fichier" : r.source === "media" && origine?.contexte ? "media" : "sujet";
    const sujet = r.sujet || (source === "sujet" ? `${quiz.titre}${quiz.etiquettes?.length ? ` (${quiz.etiquettes.join(", ")})` : ""}` : null);
    const type = TYPES[question.type]?.ia ? question.type : "choix_unique";
    const usage = await UsageIaQuiz.create({ id_user: user.id_user, nature: "question", id_questionnaire: quiz.id_questionnaire });
    try {
        const autres = (await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, attributes: ["enonce"] })).map((q) => q.enonce);
        const reponse = await genererJson({
            systeme: consigneStudio({ types: [type], difficulte: r.difficulte ?? "application", langue: r.langue ?? "fr", source }),
            utilisateur: messageStudio({ nombre: 1, sujet, support: source === "fichier" ? origine.contexte : null, transcription: source === "media" ? origine.contexte : null, eviter: autres.slice(0, 50) }),
            maxJetons: 1500,
        });
        const [nouvelle] = questionsValides(reponse.donnees?.questions, { deja: autres });
        if (!nouvelle) throw new ErreurMetier("L'IA n'a pas proposé de question valide : réessayez", 502);
        await question.update({ ...nouvelle, id_media: question.id_media, extrait: source === "media" ? nouvelle.extrait : question.extrait, points: question.points, a_relire: true, origine: "ia" });
        await terminerUsage(usage, { statut: "pret", modele: reponse.modele, jetons_entree: reponse.jetons.entree, jetons_sortie: reponse.jetons.sortie });
    } catch (erreur) {
        await terminerUsage(usage, { statut: "erreur", erreur: String(erreur.message).slice(0, 500) });
        throw erreur;
    }
    await journaliser(contexte, { evenement: "quiz_ia_genere", id_user: user.id_user, details: { studio: true, nature: "question", id_question: question.id_question } });
    return vueQuestion(question);
};

/** Voix de synthèse : un texte lu, rangé parmi les médias (transcription = le texte lu). */
export const creerVoix = async (user, { texte, voix, nom } = {}, contexte = null) => {
    exigerEnseignant(user);
    const propre = String(texte ?? "").replace(/<[^>]*>/g, "").trim();
    if (propre.length < 2 || propre.length > SCRIPT_MAX) throw new ErreurMetier(`Texte à lire : de 2 à ${SCRIPT_MAX} caractères`, 400);
    if (!mediaDisponible("voix")) throw new ErreurMetier("La voix de synthèse n'est pas configurée sur ce serveur", 503);
    await verifierQuota(user, "voix");
    const usage = await UsageIaQuiz.create({ id_user: user.id_user, nature: "voix", reglages: { caracteres: propre.length } });
    try {
        const audio = await genererVoix({ texte: propre, voix: /^[a-z]{2,20}$/i.test(voix ?? "") ? voix : undefined });
        const media = await enregistrerMedia(user, { contenu: audio.contenu, type: audio.type, nom: nom || "voix.mp3", description: propre.slice(0, 200), transcription: { texte: propre, segments: [] } }, { origine: "ia_voix" });
        await terminerUsage(usage, { statut: "pret", modele: audio.modele ?? null });
        await journaliser(contexte, { evenement: "quiz_ia_genere", id_user: user.id_user, details: { studio: true, nature: "voix", id_media: media.id_media } });
        return media;
    } catch (erreur) {
        await terminerUsage(usage, { statut: "erreur", erreur: String(erreur.message).slice(0, 500) });
        throw erreur;
    }
};

/**
 * Illustre une question par une image générée. Les modèles d'image écrivent mal le texte : la
 * consigne demande une image sans texte. L'image arrive « à relire » (une image fausse est pire
 * qu'aucune image).
 */
export const illustrerQuestion = async (user, idQuestion, { consigne } = {}, contexte = null) => {
    exigerEnseignant(user);
    const question = await QuestionQuiz.findByPk(Number(idQuestion) || 0);
    if (!question || !(await questionnaireDe(user, question.id_questionnaire))) throw new ErreurMetier("Question introuvable", 404);
    if (!mediaDisponible("image")) throw new ErreurMetier("La génération d'images n'est pas configurée sur ce serveur", 503);
    await verifierQuota(user, "image");
    const demande = String(consigne ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 600);
    const prompt = `Illustration pédagogique claire et sobre, style schéma ou photo réaliste, sans aucun texte ni lettre ni chiffre, pour accompagner cette question d'examen : « ${question.enonce.slice(0, 500)} ».${demande ? ` Précision de l'enseignant : ${demande}` : ""} Ne montre pas la réponse.`;
    const usage = await UsageIaQuiz.create({ id_user: user.id_user, nature: "image", id_questionnaire: question.id_questionnaire });
    try {
        const image = await genererImage({ prompt });
        const media = await enregistrerMedia(user, { contenu: image.contenu, type: image.type, nom: `illustration-${question.id_question}.png`, description: demande || `Illustration : ${question.enonce.slice(0, 180)}` }, { origine: "ia_image" });
        // Une zone à cliquer dépend de l'image : on n'y remplace pas l'image sans le dire
        if (question.type !== "zone_image") await question.update({ id_media: media.id_media, extrait: null, a_relire: true });
        await terminerUsage(usage, { statut: "pret", modele: image.modele ?? null });
        await journaliser(contexte, { evenement: "quiz_ia_genere", id_user: user.id_user, details: { studio: true, nature: "image", id_question: question.id_question } });
        return { media, question: vueQuestion(question) };
    } catch (erreur) {
        await terminerUsage(usage, { statut: "erreur", erreur: String(erreur.message).slice(0, 500) });
        throw erreur;
    }
};

/** Tâche quotidienne : générations interrompues en erreur ; textes des supports effacés après 30 jours. */
export const purgerStudio = async (maintenant = new Date()) => {
    await Questionnaire.update({ generation_statut: "erreur", generation_erreur: "La génération a été interrompue : relancez-la" }, { where: { generation_statut: "en_cours", updatedAt: { [Op.lt]: new Date(maintenant.getTime() - GENERATION_MAX_MS) } } });
    const [effaces] = await UsageIaQuiz.update({ contexte: null }, { where: { contexte: { [Op.ne]: null }, createdAt: { [Op.lt]: new Date(maintenant.getTime() - 30 * 24 * 3600 * 1000) } } });
    return effaces;
};

