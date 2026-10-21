import crypto from "crypto";
import { UniqueConstraintError } from "sequelize";
import { Affectation, MediaQuiz, QuestionQuiz, SessionQuiz, TentativeQuiz, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { mesClasses } from "../planning/mesClasses.js";
import { champCsv } from "../planning/suivi.js";
import { exigerEnseignant, questionnaireDe } from "./questionnaires.js";
import { lireReglages, lireTitre } from "./reglages.js";
import { noterQuestionAMain, rendreCopiesExpirees, rendreToutesLesCopies } from "./copies.js";
import { analyserQuestions, statistiques } from "./analyse.js";

/**
 * Passations du Studio quiz, côté enseignant. Ouvrir une passation fige une copie des questions :
 * l'enseignant peut ensuite retoucher son quiz sans changer ce que ses étudiants ont passé.
 * L'étudiant la rejoint par un code (comme une salle Kahoot ou un test Moodle à mot de passe).
 * Rattacher la passation à une séance ou à une classe est facultatif : c'est le lien que l'espace
 * de cours (docs/plans/espace-de-cours.md, lot E-8) utilise pour ranger les résultats.
 */

// Sans 0/O ni 1/I/L : un code dicté ou projeté ne se lit pas de travers
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const tirerCode = () => Array.from(crypto.randomBytes(6), (o) => ALPHABET[o % ALPHABET.length]).join("");

export const sessionDe = async (user, id) => {
    exigerEnseignant(user);
    const session = await SessionQuiz.findOne({ where: { id_session: Number(id) || 0, id_user: user.id_user } });
    if (!session) throw new ErreurMetier("Passation introuvable", 404);
    return session;
};

const lireDate = (brut, libelle) => {
    if (brut === undefined || brut === null || brut === "") return null;
    const date = new Date(brut);
    if (Number.isNaN(date.getTime())) throw new ErreurMetier(`${libelle} : date invalide`, 400);
    return date;
};

/** Le groupe visé doit être l'une des classes de l'enseignant (ou l'un de leurs sous-groupes). */
const verifierGroupe = async (user, idGroupe) => {
    if (idGroupe === undefined || idGroupe === null || idGroupe === "") return null;
    const id = Number(idGroupe);
    const classes = await mesClasses(user);
    if (!classes.some((c) => c.id_groupe === id)) throw new ErreurMetier("Ce groupe n'est pas l'une de vos classes", 403);
    return id;
};

const verifierSeance = async (user, idAffectation) => {
    if (idAffectation === undefined || idAffectation === null || idAffectation === "") return null;
    const seance = await Affectation.findOne({ where: { id_affectation: Number(idAffectation) || 0, id_user_enseignant: user.id_user }, attributes: ["id_affectation"] });
    if (!seance) throw new ErreurMetier("Cette séance n'est pas l'une des vôtres", 403);
    return seance.id_affectation;
};

export const vueSession = (s, compteurs = null) => ({
    id_session: s.id_session,
    id_questionnaire: s.id_questionnaire,
    code: s.code,
    titre: s.titre,
    statut: s.statut,
    essai: s.essai,
    reglages: s.reglages,
    ouverture: s.ouverture,
    fermeture: s.fermeture,
    id_groupe: s.id_groupe,
    id_affectation: s.id_affectation,
    nb_questions: (s.questions ?? []).length,
    cree_le: s.createdAt,
    ...(compteurs ?? {}),
});

/**
 * Ouvre une passation. Refusée tant qu'une question proposée par l'IA n'a pas été relue (sauf pour
 * l'aperçu de l'enseignant) : un quiz généré n'atteint jamais un étudiant sans relecture.
 */
export const ouvrirSession = async (user, idQuestionnaire, { titre, reglages, ouverture, fermeture, id_groupe, id_affectation, essai = false } = {}) => {
    const quiz = await questionnaireDe(user, idQuestionnaire);
    if (quiz.generation_statut === "en_cours") throw new ErreurMetier("L'IA écrit encore les questions de ce quiz", 409);
    const questions = await QuestionQuiz.findAll({ where: { id_questionnaire: quiz.id_questionnaire }, order: [["ordre", "ASC"], ["id_question", "ASC"]] });
    if (!questions.length) throw new ErreurMetier("Ajoutez au moins une question avant d'ouvrir le quiz", 400);
    const aRelire = questions.filter((q) => q.a_relire).length;
    if (aRelire && !essai) throw new ErreurMetier(`${aRelire} question${aRelire > 1 ? "s" : ""} proposée${aRelire > 1 ? "s" : ""} par l'IA ${aRelire > 1 ? "restent" : "reste"} à relire`, 409, "QUESTIONS_A_RELIRE");
    const debut = lireDate(ouverture, "Ouverture");
    const fin = lireDate(fermeture, "Fermeture");
    if (fin && fin <= (debut ?? new Date())) throw new ErreurMetier("La fermeture doit suivre l'ouverture", 400);
    const donnees = {
        id_questionnaire: quiz.id_questionnaire,
        id_user: user.id_user,
        titre: essai ? `Aperçu : ${quiz.titre}`.slice(0, 200) : lireTitre(titre, { requis: false }) || quiz.titre,
        questions: questions.map((q) => ({ id_question: q.id_question, type: q.type, enonce: q.enonce, points: q.points, explication: q.explication, id_media: q.id_media, extrait: q.extrait, duree_s: q.duree_s ?? null, donnees: q.donnees })),
        reglages: essai ? { ...lireReglages(reglages, quiz.reglages), tentatives_max: 0 } : lireReglages(reglages, quiz.reglages),
        ouverture: essai ? null : debut,
        fermeture: essai ? null : fin,
        essai: essai === true,
        id_groupe: essai ? null : await verifierGroupe(user, id_groupe),
        id_affectation: essai ? null : await verifierSeance(user, id_affectation),
    };
    for (let essaiCode = 0; essaiCode < 5; essaiCode += 1) {
        try {
            return vueSession(await SessionQuiz.create({ ...donnees, code: tirerCode() }));
        } catch (erreur) {
            if (!(erreur instanceof UniqueConstraintError)) throw erreur;
        }
    }
    throw new ErreurMetier("Impossible de tirer un code libre : réessayez", 503);
};

const compteursDe = (copies) => {
    const rendues = copies.filter((c) => c.statut === "rendue");
    return {
        copies_rendues: rendues.length,
        copies_en_cours: copies.length - rendues.length,
        moyenne: rendues.length ? Math.round((rendues.reduce((s, c) => s + (c.pourcentage ?? 0), 0) / rendues.length) * 10) / 10 : null,
    };
};

export const listerSessions = async (user, { id_questionnaire } = {}) => {
    exigerEnseignant(user);
    const where = { id_user: user.id_user, essai: false, ...(id_questionnaire ? { id_questionnaire: Number(id_questionnaire) || 0 } : {}) };
    const sessions = await SessionQuiz.findAll({ where, order: [["createdAt", "DESC"]], limit: 200 });
    const copies = sessions.length ? await TentativeQuiz.findAll({ where: { id_session: sessions.map((s) => s.id_session) }, attributes: ["id_session", "statut", "pourcentage"], raw: true }) : [];
    return sessions.map((s) => vueSession(s, compteursDe(copies.filter((c) => c.id_session === s.id_session))));
};

/** Fermer rend d'office les copies en cours ; rouvrir est possible tant que la date le permet. */
export const modifierSession = async (user, id, { statut, fermeture } = {}) => {
    const session = await sessionDe(user, id);
    const maj = {};
    if (fermeture !== undefined) {
        maj.fermeture = lireDate(fermeture, "Fermeture");
        if (maj.fermeture && maj.fermeture <= new Date()) throw new ErreurMetier("La fermeture doit être dans le futur", 400);
    }
    if (statut !== undefined) {
        if (!["ouverte", "fermee"].includes(statut)) throw new ErreurMetier("Statut : ouverte ou fermee", 400);
        maj.statut = statut;
    }
    await session.update(maj);
    if (session.statut === "fermee") await rendreToutesLesCopies(session);
    return vueSession(session);
};

export const supprimerSession = async (user, id) => {
    const session = await sessionDe(user, id);
    const copies = await TentativeQuiz.count({ where: { id_session: session.id_session } });
    if (copies && !session.essai) throw new ErreurMetier("Des étudiants ont passé ce quiz : fermez la passation plutôt", 409);
    await session.destroy();
};

const ETUDIANT = { model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom", "email"] };

const vueCopie = (c, seuil) => ({
    id_tentative: c.id_tentative,
    etudiant: c.etudiant ? { id_user: c.etudiant.id_user, nom: c.etudiant.nom, prenom: c.etudiant.prenom, email: c.etudiant.email } : null,
    numero: c.numero,
    statut: c.statut,
    debut: c.debut,
    rendue_le: c.rendue_le,
    duree_s: c.rendue_le ? Math.round((new Date(c.rendue_le) - new Date(c.debut)) / 1000) : null,
    points: c.points,
    max: c.max,
    pourcentage: c.pourcentage,
    complet: c.complet,
    reussi: c.statut === "rendue" && c.complet ? (c.pourcentage ?? 0) >= seuil : null,
    a_corriger: Object.values(c.corrections ?? {}).filter((x) => x.points === null).length,
});

/** Résultats : copies, statistiques sur la meilleure copie de chaque étudiant, analyse question par question. */
export const resultatsSession = async (user, id) => {
    const session = await sessionDe(user, id);
    await rendreCopiesExpirees(session);
    const copies = await TentativeQuiz.findAll({ where: { id_session: session.id_session }, include: [ETUDIANT], order: [["createdAt", "ASC"]] });
    const rendues = copies.filter((c) => c.statut === "rendue");
    const meilleures = [...rendues.reduce((m, c) => (!m.has(c.id_user) || (c.pourcentage ?? 0) > (m.get(c.id_user).pourcentage ?? 0) ? m.set(c.id_user, c) : m), new Map()).values()];
    return {
        session: vueSession(session, compteursDe(copies)),
        copies: copies.map((c) => vueCopie(c, session.reglages.seuil_reussite)),
        statistiques: statistiques(meilleures, session.reglages.seuil_reussite),
        questions: analyserQuestions(session, meilleures),
    };
};

export const resultatsCsv = async (user, id) => {
    const { session, copies } = await resultatsSession(user, id);
    const lignes = [["nom", "prenom", "email", "tentative", "statut", "points", "sur", "pourcentage", "reussi", "debut", "rendue_le", "duree_minutes"]];
    for (const c of copies) {
        lignes.push([c.etudiant?.nom, c.etudiant?.prenom, c.etudiant?.email, c.numero, c.statut, c.points ?? "", c.max ?? "", c.pourcentage ?? "", c.reussi === null ? "" : c.reussi ? "oui" : "non", c.debut?.toISOString?.() ?? "", c.rendue_le?.toISOString?.() ?? "", c.duree_s === null ? "" : Math.round(c.duree_s / 6) / 10]);
    }
    return { nom: `resultats-${session.code}.csv`, contenu: `${String.fromCharCode(0xfeff)}${lignes.map((l) => l.map(champCsv).join(";")).join("\r\n")}\r\n` };
};

const copieDe = async (user, idTentative) => {
    exigerEnseignant(user);
    const copie = await TentativeQuiz.findByPk(Number(idTentative) || 0, { include: [ETUDIANT, { model: SessionQuiz, as: "session" }] });
    if (!copie || copie.session.id_user !== user.id_user) throw new ErreurMetier("Copie introuvable", 404);
    return copie;
};

/** Copie détaillée : question par question, réponse donnée, bonne réponse, points. */
export const detailCopie = async (user, idTentative) => {
    const copie = await copieDe(user, idTentative);
    const questions = new Map(copie.session.questions.map((q) => [q.id_question, q]));
    const idsMedias = [...new Set(copie.session.questions.map((q) => q.id_media).filter(Boolean))];
    const medias = idsMedias.length ? await MediaQuiz.findAll({ where: { id_media: idsMedias }, attributes: ["id_media", "type", "type_mime", "description", "duree"] }) : [];
    return {
        ...vueCopie(copie, copie.session.reglages.seuil_reussite),
        id_session: copie.id_session,
        medias: Object.fromEntries(medias.map((m) => [m.id_media, { type: m.type, type_mime: m.type_mime, description: m.description, duree: m.duree }])),
        questions: copie.ordre.questions.map((idq) => ({ question: questions.get(idq), reponse: copie.reponses?.[idq] ?? null, correction: copie.corrections?.[idq] ?? null, marquee: copie.marquees.includes(idq) })).filter((x) => x.question),
    };
};

export const noterCopieAMain = async (user, idTentative, idQuestion, note) => {
    const copie = await copieDe(user, idTentative);
    await noterQuestionAMain(copie.session, copie, idQuestion, note);
    return detailCopie(user, idTentative);
};
