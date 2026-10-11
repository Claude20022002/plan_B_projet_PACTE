import { Affectation, AppelSeance, VisaSeance } from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";

/**
 * Visa de l'administration sur les séances réalisées, avant l'export de la paie des vacataires
 * (docs/plans/remarques-par-profil.md, lot R-11).
 *
 * Une séance passée devient réalisée d'office : rien ne dit que le cours a eu lieu. L'appel validé
 * (fermé par l'enseignant) est un indice, pas une preuve (décision du 11 octobre 2026). Une séance
 * sans appel validé est donc « à vérifier » : l'administration la confirme ou l'écarte. Sa décision
 * l'emporte toujours sur l'appel, dans un sens comme dans l'autre.
 */

/** États d'une séance réalisée pour la paie ; `compte` : ses heures entrent dans les heures du mois. */
export const ETATS = {
    appel_valide: { libelle: "appel validé", compte: true },
    a_verifier: { libelle: "à vérifier (pas d'appel validé)", compte: true },
    confirmee: { libelle: "confirmée par l'administration", compte: true },
    ecartee: { libelle: "écartée par l'administration", compte: false },
};
const DECISIONS = ["confirmee", "ecartee"];

/** Rappel renvoyé avec les listes, pour que l'écran ne présente pas l'appel comme une preuve. */
export const NOTE_APPEL = "Un appel validé est un indice que le cours a eu lieu, pas une preuve. Les séances sans appel validé sont à confirmer ou à écarter avant l'export.";

/**
 * Rend l'état d'une séance pour la paie, `{ etat, libelle, compte, appel_ouvert, motif, decide_le }`,
 * d'après son appel et son visa (chacun absent ou null). `appel_ouvert` : un appel a été lancé sans
 * être validé. Sans lecture en base : les listes chargent appel et visa avec leurs séances.
 */
export const etatDeLaSeance = (appel, visa) => {
    // Une décision inconnue (ligne modifiée à la main) ne vaut pas décision
    const decision = DECISIONS.includes(visa?.decision) ? visa.decision : null;
    const etat = decision ?? (appel?.ferme_le ? "appel_valide" : "a_verifier");
    return { etat, ...ETATS[etat], appel_ouvert: Boolean(appel && !appel.ferme_le), motif: decision ? visa.motif : null, decide_le: decision ? visa.updatedAt : null };
};

/** Rend l'état pour la paie de chaque séance demandée, dans une Map indexée par id_affectation. */
export const etatsDesSeances = async (ids) => {
    if (!ids.length) return new Map();
    const [appels, visas] = await Promise.all([
        AppelSeance.findAll({ where: { id_affectation: ids }, attributes: ["id_affectation", "ferme_le"], raw: true }),
        VisaSeance.findAll({ where: { id_affectation: ids }, raw: true }),
    ]);
    const appelDe = new Map(appels.map((a) => [a.id_affectation, a]));
    const visaDe = new Map(visas.map((v) => [v.id_affectation, v]));
    return new Map(ids.map((id) => [id, etatDeLaSeance(appelDe.get(id), visaDe.get(id))]));
};

/**
 * Enregistre la décision de l'administration sur une séance réalisée et rend son nouvel état.
 * `decision` : « confirmee », « ecartee », ou null pour revenir sur une décision.
 */
export const viserSeance = async (admin, idAffectation, { decision = null, motif = null } = {}) => {
    if (decision !== null && !DECISIONS.includes(decision)) throw new ErreurMetier("Décision attendue : confirmee, ecartee, ou null pour l'annuler", 400);
    const seance = await Affectation.findByPk(idAffectation, { attributes: ["id_affectation", "statut"] });
    if (!seance) throw new ErreurMetier("Séance introuvable", 404);
    // Une séance à venir, annulée ou reportée n'entre pas dans les heures : il n'y a rien à viser
    if (seance.statut !== "realise") throw new ErreurMetier("Seule une séance réalisée peut être confirmée ou écartée", 409);
    if (decision) {
        await VisaSeance.upsert({ id_affectation: seance.id_affectation, decision, motif: String(motif ?? "").trim().slice(0, 255) || null, id_user_admin: admin.id_user });
    } else {
        await VisaSeance.destroy({ where: { id_affectation: seance.id_affectation } });
    }
    return { id_affectation: seance.id_affectation, ...(await etatsDesSeances([seance.id_affectation])).get(seance.id_affectation) };
};
