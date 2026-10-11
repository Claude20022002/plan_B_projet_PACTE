import { Affectation, Cours, Creneau } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { appelerClassQuiz } from "./clientClassQuiz.js";
import { enregistrerPartie, seanceEnCours } from "./parties.js";

/**
 * Partie en direct lancée depuis Planner (docs/plans/quiz-ia.md, lot CQ-1). L'enseignant ne passe
 * plus par le site du quiz : Planner demande au fork de créer la partie (route signée), la rattache
 * à la séance, prévient les étudiants, puis remet à l'enseignant de quoi animer la partie.
 *
 * Le fork donne la main à qui présente le code et l'identifiant de la partie (événement
 * « register_as_admin » de son WebSocket). L'identifiant est donc le jeton d'administration : il
 * n'est rendu qu'ici, à l'enseignant qui lance, et ne figure dans aucune liste de parties.
 */

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATUTS_TENUS = ["planifie", "confirme", "realise"];
// Relais du WebSocket du fork sur l'adresse de Planner (deploy/Caddyfile) : même origine pour l'écran
const CHEMIN_SOCKET = "/socket.io/";

/**
 * Séance à laquelle rattacher la partie : celle que l'enseignant désigne, si c'est l'une des
 * siennes aujourd'hui ; sinon celle qu'il donne en ce moment, ou aucune.
 */
const seanceDeLaPartie = async (user, idAffectation) => {
    if (idAffectation === null || idAffectation === undefined || idAffectation === "") return seanceEnCours(user.id_user);
    const seance = await Affectation.findByPk(Number(idAffectation) || 0, {
        include: [{ model: Creneau, as: "creneau" }, { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }],
    });
    if (!seance || seance.id_user_enseignant !== user.id_user) throw new ErreurMetier("Séance introuvable", 404);
    // Les étudiants sont prévenus « quiz en cours » : la séance doit être celle du jour, et tenue
    if (String(seance.date_seance).slice(0, 10) !== aujourdhui() || !STATUTS_TENUS.includes(seance.statut)) {
        throw new ErreurMetier("Un quiz en direct ne se lance que pour une séance d'aujourd'hui", 409);
    }
    return seance;
};

/**
 * Lance une partie en direct d'un quiz de l'enseignant et rend de quoi l'animer :
 * { id_quiz_partie, id_affectation, titre, nb_questions, notifies, animation: { game_pin, game_id, socket } }.
 */
export const lancerPartie = async (user, { id_quiz, id_affectation = null } = {}) => {
    if (user.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    if (!UUID.test(String(id_quiz ?? ""))) throw new ErreurMetier("Quiz attendu (id_quiz)", 400);
    // Avant d'appeler le fork : une séance refusée ne doit pas laisser une partie ouverte chez lui
    const seance = await seanceDeLaPartie(user, id_affectation);

    const creee = await appelerClassQuiz("/api/v1/hestim/parties", { email: user.email, quiz_id: String(id_quiz).toLowerCase() });
    if (!UUID.test(String(creee?.game_id ?? "")) || !/^\d{4,12}$/.test(String(creee?.game_pin ?? ""))) throw new ErreurMetier("Réponse inattendue du service de quiz", 502);

    // La route signée n'envoie pas le webhook « game.started » : Planner enregistre lui-même la
    // partie, avec la séance choisie (le webhook aurait pu arriver avant, sans la connaître)
    const { partie, notifies } = await enregistrerPartie(
        { game_id: creee.game_id, game_pin: creee.game_pin, quiz_title: creee.titre, game_mode: creee.game_mode, user_email: user.email },
        seance
    );
    return {
        id_quiz_partie: partie.id_quiz_partie,
        id_affectation: partie.id_affectation,
        titre: partie.titre,
        nb_questions: Number(creee.nb_questions) || null,
        notifies,
        animation: { game_pin: partie.pin, game_id: partie.game_id, socket: CHEMIN_SOCKET },
    };
};
