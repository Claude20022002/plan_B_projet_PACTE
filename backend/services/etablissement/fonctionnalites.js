import { identite } from "./identite.js";
import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Fonctionnalités de l'établissement (plan multi-établissements, D-04). Pour l'instant ClassQuiz
 * seul (lot ME-0c) : lu sur la ligne de l'école (ConfigurationEtablissement.classquiz_actif), donc
 * propre à chaque base. Éteint, ClassQuiz est traité comme s'il n'était pas configuré : ni partie,
 * ni webhook, ni connexion par OpenID Connect, et /api/quiz/config répond « actif: false », ce
 * qui masque déjà « Lancer un quiz » dans le site.
 */

/** ClassQuiz est-il ouvert pour cette école ? */
export const classQuizActif = async () => (await identite()).classquiz_actif === true;

export const MESSAGE_CLASSQUIZ_FERME = "ClassQuiz n'est pas ouvert pour cet établissement";

/** Lève une erreur 503 si ClassQuiz est éteint pour cette école. */
export const exigerClassQuiz = async () => {
    if (!(await classQuizActif())) throw new ErreurMetier(MESSAGE_CLASSQUIZ_FERME, 503);
};
