import { col, fn, literal } from "sequelize";
import { Affectation, Appartenir, Groupe, JoueurDirect, MediaQuiz, ReponseDirect, SessionQuiz, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { MARGE_MS, classer, classerEquipes, dureeQuestion } from "../../../shared/quiz/studio/direct.js";

/**
 * Quiz en direct du Studio (lot SC-1a) : état d'une diffusion, commun aux vues de l'enseignant
 * (direct.js) et de l'étudiant (directJoueur.js). L'heure qui compte est celle du serveur ;
 * chaque changement d'étape incrémente une version, que les téléphones comparent pour ne
 * relire que ce qui a changé.
 */

/** Heure du serveur, en millisecondes. */
export const maintenantMs = () => Date.now();

/**
 * Durée de réponse de la question projetée, en secondes : la sienne si elle en a une (reprise de
 * ClassQuiz, ou réglée dans l'éditeur), sinon celle choisie pour la diffusion.
 */
export const dureeDe = (session) => dureeQuestion(session.questions?.[session.direct_index]?.duree_s ?? session.reglages?.duree_question_s);

/** Fin du chrono de la question projetée, en millisecondes. */
export const finQuestionMs = (session) => Number(session.direct_debut_ms) + dureeDe(session) * 1000;

/** Diffusion en direct, quel qu'en soit l'auteur (les droits sont vérifiés par l'appelant). */
export const diffusionDirect = async (id) => {
    const session = await SessionQuiz.findByPk(Number(id) || 0);
    if (!session || session.mode !== "direct") throw new ErreurMetier("Quiz en direct introuvable", 404);
    return session;
};

/**
 * Change d'étape si la diffusion est toujours là où l'appelant l'a lue : deux requêtes
 * simultanées (deux onglets, un téléphone qui ferme la question) ne la font pas avancer deux fois.
 * @returns {Promise<boolean>} vrai si ce changement-ci a été appliqué
 */
export const changerEtape = async (session, maj) => {
    const [lignes] = await SessionQuiz.update(
        { ...maj, direct_version: literal("direct_version + 1") },
        { where: { id_session: session.id_session, direct_etape: session.direct_etape, direct_version: session.direct_version } }
    );
    await session.reload();
    return lignes > 0;
};

/**
 * Ferme d'office la question projetée quand son temps est écoulé ou que tous les joueurs ont
 * répondu : l'écran passe à la correction sans attendre l'enseignant.
 */
export const actualiser = async (session) => {
    if (session.direct_etape !== "question") return session;
    let fini = maintenantMs() > finQuestionMs(session) + MARGE_MS;
    if (!fini) {
        const [joueurs, reponses] = await Promise.all([
            JoueurDirect.count({ where: { id_session: session.id_session } }),
            ReponseDirect.count({ where: { id_session: session.id_session, index_question: session.direct_index } }),
        ]);
        fini = joueurs > 0 && reponses >= joueurs;
    }
    if (fini) await changerEtape(session, { direct_etape: "correction" });
    return session;
};

/** Ce qu'il faut à l'écran pour afficher le média d'une question (son contenu passe par sa route). */
export const infosMedia = async (question) => {
    if (!question?.id_media) return null;
    const media = await MediaQuiz.findByPk(question.id_media, { attributes: ["id_media", "type", "type_mime", "description", "duree"] });
    return media ? { id_media: media.id_media, type: media.type, type_mime: media.type_mime, description: media.description, duree: media.duree } : null;
};

/** Joueurs avec leurs points et leurs bonnes réponses, classés (égalité : même rang). */
export const scores = async (session) => {
    const [joueurs, sommes] = await Promise.all([
        JoueurDirect.findAll({ where: { id_session: session.id_session }, include: [{ model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom"] }] }),
        ReponseDirect.findAll({
            where: { id_session: session.id_session },
            attributes: ["id_user", [fn("SUM", col("points")), "points"], [fn("SUM", literal("statut = 'juste'")), "justes"]],
            group: ["id_user"],
            raw: true,
        }),
    ]);
    const parUser = new Map(sommes.map((s) => [s.id_user, s]));
    return classer(
        joueurs.map((j) => ({
            id_user: j.id_user,
            nom: j.etudiant?.nom ?? "",
            prenom: j.etudiant?.prenom ?? "",
            points: Number(parUser.get(j.id_user)?.points ?? 0),
            justes: Number(parUser.get(j.id_user)?.justes ?? 0),
        }))
    );
};

/** Classe de la diffusion : celle choisie au lancement, sinon le groupe de la séance. */
const classeDe = async (session) => {
    if (session.id_groupe) return session.id_groupe;
    if (!session.id_affectation) return null;
    return (await Affectation.findByPk(session.id_affectation, { attributes: ["id_groupe"] }))?.id_groupe ?? null;
};

/**
 * Défi par équipes : les groupes de TP de la classe s'affrontent (moyenne des points). Rend null
 * sans classe ou si la classe n'a pas de sous-groupes.
 */
export const equipes = async (session, classement) => {
    const classe = await classeDe(session);
    if (!classe || !classement.length) return null;
    const sousGroupes = await Groupe.findAll({ where: { id_groupe_parent: classe }, attributes: ["id_groupe", "nom_groupe"] });
    if (!sousGroupes.length) return null;
    const noms = new Map(sousGroupes.map((g) => [g.id_groupe, g.nom_groupe]));
    const appartenances = await Appartenir.findAll({ where: { id_groupe: [...noms.keys()], id_user_etudiant: classement.map((j) => j.id_user) }, attributes: ["id_user_etudiant", "id_groupe"] });
    const equipeDe = new Map(appartenances.map((a) => [a.id_user_etudiant, { id: a.id_groupe, nom: noms.get(a.id_groupe) }]));
    return classerEquipes(classement, equipeDe);
};
