import { UniqueConstraintError } from "sequelize";
import { JoueurDirect, ReponseDirect } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { groupesDeLEtudiant } from "../jeux/jeux.js";
import { actualiser, diffusionDirect, dureeDe, finQuestionMs, maintenantMs, scores } from "./directEtat.js";
import { MARGE_MS, pointsDirect } from "../../../shared/quiz/studio/direct.js";
import { bonneReponse, corriger } from "../../../shared/quiz/studio/correction.js";
import { vueEtudiant } from "../../../shared/quiz/studio/vueEtudiant.js";

/**
 * Quiz en direct du Studio, côté étudiant (lot SC-1a) : rejoindre, répondre pendant le chrono,
 * suivre l'écran. Le serveur corrige, chronomètre et compte les points ; le téléphone n'envoie
 * que sa réponse. La bonne réponse n'est jamais envoyée avant la correction.
 */

const REPONSE_MAX_OCTETS = 2000;

/** Réservé aux étudiants, et à ceux de la classe visée quand le quiz en a une. */
const verifierAcces = async (user, session) => {
    if (user?.role !== "etudiant") throw new ErreurMetier("Ce quiz est réservé aux étudiants", 403);
    if (session.id_groupe && !(await groupesDeLEtudiant(user.id_user)).includes(session.id_groupe)) throw new ErreurMetier("Ce quiz est réservé à une autre classe", 403);
};

const joueurDe = async (user, session) => {
    const joueur = await JoueurDirect.findOne({ where: { id_session: session.id_session, id_user: user?.id_user ?? 0 } });
    if (!joueur) throw new ErreurMetier("Rejoignez d'abord ce quiz avec son code", 403, "PAS_REJOINT");
    return joueur;
};

/** Rejoindre un quiz en direct, avant ou pendant la partie. */
export const rejoindreDirect = async (user, id) => {
    const session = await diffusionDirect(id);
    await verifierAcces(user, session);
    if (session.direct_etape === "termine") throw new ErreurMetier("Ce quiz en direct est terminé", 409, "DIRECT_TERMINE");
    try {
        await JoueurDirect.findOrCreate({ where: { id_session: session.id_session, id_user: user.id_user } });
    } catch (erreur) {
        // Deux appuis simultanés : le second trouve le joueur déjà créé
        if (!(erreur instanceof UniqueConstraintError)) throw erreur;
    }
    return vueJoueur(user, id);
};

/**
 * Enregistre la réponse à la question projetée : une seule par question, pendant le chrono
 * (avec une marge réseau). Rend seulement qu'elle est arrivée : le résultat vient à la correction.
 */
export const repondreDirect = async (user, id, { index, reponse } = {}) => {
    const session = await diffusionDirect(id);
    await joueurDe(user, session);
    await actualiser(session);
    if (session.direct_etape !== "question" || Number(index) !== session.direct_index) throw new ErreurMetier("Trop tard : la question est fermée", 409, "QUESTION_FERMEE");
    const delai = maintenantMs() - Number(session.direct_debut_ms);
    if (maintenantMs() > finQuestionMs(session) + MARGE_MS) throw new ErreurMetier("Trop tard : le temps est écoulé", 409, "QUESTION_FERMEE");
    if (reponse === undefined || reponse === null || reponse === "") throw new ErreurMetier("Choisissez une réponse", 400);
    if (JSON.stringify(reponse).length > REPONSE_MAX_OCTETS) throw new ErreurMetier("Réponse trop longue", 400);
    const question = session.questions[session.direct_index];
    const correction = corriger(question, reponse, { partiel: session.reglages.notation_partielle });
    const part = correction.max ? (correction.points ?? 0) / correction.max : 0;
    try {
        await ReponseDirect.create({
            id_session: session.id_session,
            id_user: user.id_user,
            index_question: session.direct_index,
            reponse,
            statut: correction.statut === "sans_reponse" ? "faux" : correction.statut,
            part,
            points: pointsDirect({ part, delaiMs: Math.max(0, delai), dureeS: dureeDe(session), poids: question.points }),
            delai_ms: Math.max(0, delai),
        });
    } catch (erreur) {
        if (erreur instanceof UniqueConstraintError) throw new ErreurMetier("Vous avez déjà répondu à cette question", 409, "DEJA_REPONDU");
        throw erreur;
    }
    // Le dernier joueur à répondre ferme la question pour tout le monde
    await actualiser(session);
    return { envoyee: true };
};

/**
 * L'écran du téléphone. Avec `depuis` égal à la version courante, rend seulement { inchange } :
 * un téléphone qui relit chaque seconde ne recharge l'écran qu'à un changement d'étape.
 */
export const vueJoueur = async (user, id, { depuis } = {}) => {
    const session = await diffusionDirect(id);
    await joueurDe(user, session);
    await actualiser(session);
    if (depuis !== undefined && Number(depuis) === session.direct_version) return { inchange: true, version: session.direct_version, maintenant_ms: maintenantMs() };
    const etape = session.direct_etape;
    const question = session.direct_index !== null && session.direct_index >= 0 ? session.questions[session.direct_index] : null;
    const vue = {
        id_session: session.id_session,
        titre: session.titre,
        etape,
        index: session.direct_index,
        total: session.questions.length,
        version: session.direct_version,
        duree_s: dureeDe(session),
        debut_ms: session.direct_debut_ms === null ? null : Number(session.direct_debut_ms),
        maintenant_ms: maintenantMs(),
    };
    if (!question) return vue;
    vue.question = vueEtudiant(question);
    const mienne = await ReponseDirect.findOne({ where: { id_session: session.id_session, id_user: user.id_user, index_question: session.direct_index } });
    if (etape === "question") return { ...vue, repondu: Boolean(mienne) };
    const classement = await scores(session);
    const moi = classement.find((j) => j.id_user === user.id_user);
    return {
        ...vue,
        bonne_reponse: bonneReponse(question),
        explication: question.explication ?? null,
        ma_reponse: mienne ? { reponse: mienne.reponse, statut: mienne.statut, points: mienne.points } : null,
        mon_total: moi?.points ?? 0,
        mon_rang: moi?.rang ?? null,
        joueurs: classement.length,
        ...(etape === "termine" ? { podium: classement.filter((j) => j.rang <= 3).map(({ prenom, nom, points, rang }) => ({ prenom, nom, points, rang })) } : {}),
    };
};
