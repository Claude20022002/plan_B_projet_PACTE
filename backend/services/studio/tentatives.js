import sequelize from "../../config/db.js";
import { MediaQuiz, SessionQuiz, TentativeQuiz } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesDeLEtudiant } from "../jeux/jeux.js";
import { melanger, tirerOrdre, vueEtudiant } from "../../../shared/quiz/studio/vueEtudiant.js";
import { bonneReponse, corriger } from "../../../shared/quiz/studio/correction.js";
import { estExpiree, questionsDeLaSession, rendreCopie } from "./copies.js";

/**
 * Épreuve de l'étudiant (Studio quiz), sur le modèle de l'examen Cisco : une question à la fois,
 * navigation libre avec marques « à revoir », temps total, vue d'ensemble avant de rendre.
 * Chaque réponse est enregistrée aussitôt (une coupure ne perd rien) ; le temps est tenu par le
 * serveur, jamais par le navigateur. L'enseignant passe son propre quiz en aperçu (session d'essai).
 */

const REPONSE_MAX_OCTETS = 12000;

const maintenant = () => new Date();

const sessionParCode = async (code) => {
    const propre = String(code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (propre.length < 4 || propre.length > 8) throw new ErreurMetier("Code invalide", 400);
    const session = await SessionQuiz.findOne({ where: { code: propre } });
    if (!session) throw new ErreurMetier("Aucun quiz ne porte ce code", 404);
    return session;
};

/** L'utilisateur peut-il passer cette session ? Lève une erreur explicite sinon. */
const verifierAcces = async (user, session, { pourCommencer = false } = {}) => {
    if (session.essai) {
        if (session.id_user !== user?.id_user) throw new ErreurMetier("Aucun quiz ne porte ce code", 404);
        return;
    }
    if (user?.role !== "etudiant") throw new ErreurMetier("Ce quiz est réservé aux étudiants", 403);
    if (session.id_groupe && !(await groupesDeLEtudiant(user.id_user)).includes(session.id_groupe)) throw new ErreurMetier("Ce quiz est réservé à une autre classe", 403);
    if (!pourCommencer) return;
    const t = maintenant();
    if (session.statut !== "ouverte") throw new ErreurMetier("Ce quiz est fermé", 409, "QUIZ_FERME");
    if (session.ouverture && new Date(session.ouverture) > t) throw new ErreurMetier("Ce quiz n'est pas encore ouvert", 409, "QUIZ_PAS_OUVERT");
    if (session.fermeture && new Date(session.fermeture) <= t) throw new ErreurMetier("Ce quiz est fermé", 409, "QUIZ_FERME");
};

const mesCopies = (user, session) => TentativeQuiz.findAll({ where: { id_session: session.id_session, id_user: user.id_user }, order: [["numero", "ASC"]] });

const restantes = (session, copies) => (session.reglages.tentatives_max ? Math.max(0, session.reglages.tentatives_max - copies.length) : null);

const resumeSession = (session, copies) => ({
    id_session: session.id_session,
    // « direct » : l'écran rejoint le quiz en direct (services/studio/directJoueur.js)
    mode: session.mode ?? "rythme",
    titre: session.titre,
    essai: session.essai,
    nb_questions: session.questions.length,
    points: Math.round(session.questions.reduce((s, q) => s + q.points, 0) * 100) / 100,
    duree_min: session.reglages.duree_min,
    navigation: session.reglages.navigation,
    correction: session.reglages.correction,
    seuil_reussite: session.reglages.seuil_reussite,
    tentatives_max: session.reglages.tentatives_max,
    tentatives_restantes: restantes(session, copies),
    ouverture: session.ouverture,
    fermeture: session.fermeture,
    ouverte: session.statut === "ouverte" && (!session.ouverture || new Date(session.ouverture) <= maintenant()) && (!session.fermeture || new Date(session.fermeture) > maintenant()),
    en_cours: copies.find((c) => c.statut === "en_cours")?.id_tentative ?? null,
});

/** Écran d'accueil d'un quiz rejoint par son code : consignes, temps, tentatives restantes. */
export const rejoindre = async (user, code) => {
    const session = await sessionParCode(code);
    await verifierAcces(user, session);
    return resumeSession(session, await mesCopies(user, session));
};

/** Commence une tentative, ou reprend celle qui est en cours (même ordre, mêmes réponses). */
export const commencer = async (user, idSession) => {
    const session = await SessionQuiz.findByPk(Number(idSession) || 0);
    if (!session) throw new ErreurMetier("Quiz introuvable", 404);
    if (session.mode === "direct") throw new ErreurMetier("Ce quiz se joue en direct : rejoignez-le avec son code", 409, "QUIZ_EN_DIRECT");
    await verifierAcces(user, session, { pourCommencer: true });
    let copies = await mesCopies(user, session);
    const enCours = copies.find((c) => c.statut === "en_cours");
    if (enCours && !estExpiree(enCours)) return { id_tentative: enCours.id_tentative, reprise: true };
    if (enCours) {
        await rendreCopie(session, enCours);
        copies = await mesCopies(user, session);
    }
    if (restantes(session, copies) === 0) throw new ErreurMetier("Vous avez utilisé toutes vos tentatives", 409, "TENTATIVES_EPUISEES");
    const debut = maintenant();
    const finDuTemps = session.reglages.duree_min ? new Date(debut.getTime() + session.reglages.duree_min * 60000) : null;
    const fermeture = session.fermeture ? new Date(session.fermeture) : null;
    const echeance = finDuTemps && fermeture ? new Date(Math.min(finDuTemps, fermeture)) : finDuTemps ?? fermeture;
    const ids = session.questions.map((q) => q.id_question);
    const ordre = {
        questions: session.reglages.melanger_questions ? melanger(ids) : ids,
        options: Object.fromEntries(session.questions.map((q) => [q.id_question, tirerOrdre(q, { melangerOptions: session.reglages.melanger_options })])),
    };
    const tentative = await TentativeQuiz.create({ id_session: session.id_session, id_user: user.id_user, numero: copies.length + 1, debut, echeance, ordre, reponses: {}, marquees: [], verrouillees: [] });
    return { id_tentative: tentative.id_tentative, reprise: false };
};

const tentativeDe = async (user, id, options = {}) => {
    const tentative = await TentativeQuiz.findOne({ where: { id_tentative: Number(id) || 0, id_user: user?.id_user ?? 0 }, include: [{ model: SessionQuiz, as: "session" }], ...options });
    if (!tentative) throw new ErreurMetier("Tentative introuvable", 404);
    return tentative;
};

/** Correction d'une question à montrer : points, statut, bonne réponse, explication. */
const retour = (question, correction) => ({ ...correction, bonne_reponse: bonneReponse(question), explication: question.explication ?? null });

const resultat = (session, tentative, copies) => {
    const mode = session.reglages.correction;
    if (mode === "jamais") return { mode };
    const score = { mode, points: tentative.points, max: tentative.max, pourcentage: tentative.pourcentage, complet: tentative.complet, reussi: tentative.complet ? tentative.pourcentage >= session.reglages.seuil_reussite : null };
    if (mode === "score") return score;
    // Corrigé détaillé ; les bonnes réponses attendent la dernière tentative (ou la fermeture),
    // pour qu'une nouvelle tentative ne soit pas un simple recopiage
    const reponsesVisibles = mode === "immediate" || session.statut === "fermee" || restantes(session, copies) === 0;
    const questions = questionsDeLaSession(session);
    return {
        ...score,
        reponses_visibles: reponsesVisibles,
        detail: tentative.ordre.questions.map((id) => {
            const q = questions.get(id);
            const c = tentative.corrections?.[id] ?? null;
            return q ? { id_question: id, ...(reponsesVisibles ? retour(q, c) : c), commentaire: c?.commentaire ?? null } : null;
        }).filter(Boolean),
    };
};

/** Métadonnées des médias de la copie (texte de remplacement, durée), sans leur contenu. */
const mediasDe = async (session, { avecTranscription = false } = {}) => {
    const ids = [...new Set(session.questions.map((q) => q.id_media).filter(Boolean))];
    if (!ids.length) return {};
    const medias = await MediaQuiz.findAll({ where: { id_media: ids }, attributes: ["id_media", "type", "type_mime", "description", "duree", "transcription"] });
    return Object.fromEntries(medias.map((m) => [m.id_media, { type: m.type, type_mime: m.type_mime, description: m.description, duree: m.duree, ...(avecTranscription && m.transcription?.texte ? { transcription: m.transcription.texte } : {}) }]));
};

/** La copie telle que le joueur l'affiche ; une copie dont le temps est écoulé est rendue d'office. */
export const vueTentative = async (user, id) => {
    let tentative = await tentativeDe(user, id);
    const session = tentative.session;
    if (tentative.statut === "en_cours" && (estExpiree(tentative) || (session.statut === "fermee" && !session.essai))) tentative = await rendreCopie(session, tentative);
    const questions = questionsDeLaSession(session);
    const rendue = tentative.statut === "rendue";
    const immediate = session.reglages.correction === "immediate";
    const copies = await mesCopies(user, session);
    return {
        id_tentative: tentative.id_tentative,
        numero: tentative.numero,
        statut: tentative.statut,
        session: resumeSession(session, copies),
        debut: tentative.debut,
        echeance: tentative.echeance,
        maintenant: maintenant(),
        position: tentative.position,
        questions: tentative.ordre.questions.map((idq) => (questions.get(idq) ? vueEtudiant(questions.get(idq), tentative.ordre.options[idq]) : null)).filter(Boolean),
        medias: await mediasDe(session, { avecTranscription: rendue }),
        reponses: tentative.reponses,
        marquees: tentative.marquees,
        verrouillees: tentative.verrouillees,
        // Entraînement : la correction de chaque question validée reste visible
        retours: immediate && !rendue ? Object.fromEntries(tentative.verrouillees.map((idq) => [idq, retour(questions.get(idq), corriger(questions.get(idq), tentative.reponses[idq], { partiel: session.reglages.notation_partielle }))])) : {},
        resultat: rendue ? resultat(session, tentative, copies) : null,
    };
};

const verifierForme = (question, reponse) => {
    if (reponse === null || reponse === undefined) return null;
    if (JSON.stringify(reponse).length > REPONSE_MAX_OCTETS) throw new ErreurMetier("Réponse trop longue", 413);
    const objet = typeof reponse === "object" && !Array.isArray(reponse);
    const ok = {
        choix_unique: typeof reponse === "string",
        choix_multiple: Array.isArray(reponse) && reponse.every((r) => typeof r === "string"),
        vrai_faux: typeof reponse === "boolean",
        reponse_courte: typeof reponse === "string",
        numerique: typeof reponse === "string" || typeof reponse === "number",
        texte_trous: objet && Object.values(reponse).every((v) => typeof v === "string"),
        association: objet && Object.values(reponse).every((v) => typeof v === "string"),
        ordre: Array.isArray(reponse) && reponse.every((r) => typeof r === "string"),
        zone_image: objet && Number.isFinite(Number(reponse.x)) && Number.isFinite(Number(reponse.y)),
        reponse_libre: typeof reponse === "string" && reponse.length <= (question.donnees.longueur_max ?? 5000),
    }[question.type];
    if (!ok) throw new ErreurMetier("Réponse illisible pour ce type de question", 400);
    return reponse;
};

/**
 * Enregistre la réponse à une question (et sa marque « à revoir »). `valider` verrouille la question
 * (navigation linéaire, ou entraînement : la correction est rendue aussitôt).
 */
export const enregistrerReponse = async (user, id, idQuestion, { reponse, marquee, valider = false } = {}) => {
    const idq = Number(idQuestion);
    const sortie = await sequelize.transaction(async (transaction) => {
        const tentative = await tentativeDe(user, id, { transaction, lock: transaction.LOCK.UPDATE });
        const session = tentative.session;
        if (tentative.statut !== "en_cours") throw new ErreurMetier("Cette copie est déjà rendue", 409, "COPIE_RENDUE");
        if (estExpiree(tentative)) return { expiree: true };
        const index = tentative.ordre.questions.indexOf(idq);
        const question = questionsDeLaSession(session).get(idq);
        if (index < 0 || !question) throw new ErreurMetier("Question introuvable dans cette copie", 404);
        if (tentative.verrouillees.includes(idq)) throw new ErreurMetier("Cette question est déjà validée", 409, "QUESTION_VALIDEE");
        const lineaire = session.reglages.navigation === "lineaire";
        if (lineaire && index < tentative.position) throw new ErreurMetier("Navigation linéaire : impossible de revenir sur une question passée", 409, "NAVIGATION_LINEAIRE");
        const maj = {};
        if (reponse !== undefined) {
            const propre = verifierForme(question, reponse);
            const reponses = { ...tentative.reponses };
            if (propre === null) delete reponses[idq];
            else reponses[idq] = propre;
            maj.reponses = reponses;
        }
        if (marquee !== undefined) maj.marquees = marquee ? [...new Set([...tentative.marquees, idq])] : tentative.marquees.filter((x) => x !== idq);
        // En navigation linéaire, « Suivant » valide la question : le joueur envoie valider
        const verrouiller = valider === true;
        if (verrouiller) maj.verrouillees = [...tentative.verrouillees, idq];
        if (lineaire) maj.position = Math.max(tentative.position, index + (verrouiller ? 1 : 0));
        await tentative.update(maj, { transaction });
        const retourQuestion = verrouiller && session.reglages.correction === "immediate" ? retour(question, corriger(question, tentative.reponses[idq], { partiel: session.reglages.notation_partielle })) : null;
        return { enregistre: true, marquees: tentative.marquees, position: tentative.position, retour: retourQuestion };
    });
    // Temps écoulé : la copie est rendue avec ce qui était déjà enregistré
    if (sortie.expiree) {
        await vueTentative(user, id);
        throw new ErreurMetier("Le temps est écoulé : votre copie a été rendue", 409, "TEMPS_ECOULE");
    }
    return sortie;
};

export const rendre = async (user, id) => {
    const tentative = await tentativeDe(user, id);
    if (tentative.statut === "en_cours") await rendreCopie(tentative.session, tentative);
    return vueTentative(user, id);
};

/** Historique de l'étudiant : ses copies, avec le score quand le mode de correction le permet. */
export const mesTentatives = async (user) => {
    const copies = await TentativeQuiz.findAll({ where: { id_user: user.id_user }, include: [{ model: SessionQuiz, as: "session", attributes: ["id_session", "titre", "reglages", "essai", "code"] }], order: [["createdAt", "DESC"]], limit: 100 });
    return copies
        .filter((c) => !c.session.essai)
        .map((c) => ({
            id_tentative: c.id_tentative,
            id_session: c.id_session,
            titre: c.session.titre,
            code: c.session.code,
            numero: c.numero,
            statut: c.statut,
            debut: c.debut,
            rendue_le: c.rendue_le,
            ...(c.statut === "rendue" && c.session.reglages.correction !== "jamais" ? { pourcentage: c.pourcentage, complet: c.complet, reussi: c.complet ? c.pourcentage >= c.session.reglages.seuil_reussite : null } : {}),
        }));
};

/** Contenu d'un média, pour l'auteur d'une copie dont une question l'utilise. */
export const mediaDeTentative = async (user, idTentative, idMedia) => {
    const tentative = await tentativeDe(user, idTentative);
    const id = Number(idMedia);
    if (!tentative.session.questions.some((q) => q.id_media === id)) throw new ErreurMetier("Média introuvable", 404);
    const media = await MediaQuiz.findByPk(id);
    if (!media) throw new ErreurMetier("Média introuvable", 404);
    return media;
};
