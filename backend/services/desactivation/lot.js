import { Appartenir, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { avecDescendants } from "../planning/groupes.js";
import { annulerProgrammation, desactiver, reactiver } from "./desactivation.js";
import { dateEffet, motifValide, seancesFutures } from "./regles.js";

/**
 * Actions sur plusieurs comptes à la fois (lot ME-17) : une sélection (`ids`), ou tous les
 * étudiants d'un groupe et de ses sous-groupes (`id_groupe`, « désactiver la promotion »).
 *  - l'aperçu dit, avant d'appliquer, qui sera désactivé et qui sera refusé, et pourquoi ;
 *  - la désactivation traite chaque compte seul : un refus ne bloque pas les autres ;
 *  - le rétablissement défait une erreur de lot : il réactive les comptes désactivés et annule les
 *    désactivations programmées, sans avoir à reprendre les comptes un par un.
 */

/** Identifiants des comptes visés, sans doublon ; 400 si aucun. */
export const ciblesDuLot = async ({ ids = [], id_groupe = null } = {}) => {
    const liste = Array.isArray(ids) ? ids : String(ids).split(",");
    const cibles = new Set(liste.map(Number).filter((n) => Number.isInteger(n) && n > 0));
    if (id_groupe) {
        const groupes = await avecDescendants([Number(id_groupe)]);
        (await Appartenir.findAll({ where: { id_groupe: [...groupes] }, attributes: ["id_user_etudiant"] })).forEach((a) => cibles.add(a.id_user_etudiant));
    }
    if (!cibles.size) throw new ErreurMetier("Aucun compte visé", 400);
    return [...cibles];
};

/** Ce qui arrivera à un compte si le lot est appliqué à cette date (mêmes règles que desactiver). */
const sortPrevu = async (acteur, compte, depuis) => {
    if (compte.anonymise_le) return { prevu: "anonymise" };
    if (!compte.actif) return { prevu: "deja_desactive" };
    if (acteur?.id_user === compte.id_user) return { prevu: "soi_meme" };
    if (compte.role === "enseignant") {
        const seances = (await seancesFutures(compte.id_user, depuis)).length;
        if (seances) return { prevu: "seances_a_traiter", seances };
    }
    return { prevu: "a_desactiver" };
};

/**
 * Aperçu d'un lot, à montrer avant « Désactiver » : chaque compte visé avec son sort prévu
 * (a_desactiver, deja_desactive, anonymise, soi_meme, seances_a_traiter). Rien n'est modifié.
 * Le dernier administrateur ne peut pas manquer : celui qui agit reste actif (soi_meme).
 */
export const apercuLot = async (acteur, { ids, id_groupe, date } = {}) => {
    const depuis = dateEffet(date);
    const cibles = await ciblesDuLot({ ids, id_groupe });
    const comptes = await Users.findAll({
        where: { id_user: cibles },
        attributes: ["id_user", "nom", "prenom", "role", "actif", "desactivation_prevue_le", "anonymise_le"],
        order: [["nom", "ASC"], ["prenom", "ASC"]],
    });
    const lignes = [];
    for (const c of comptes) {
        lignes.push({ id_user: c.id_user, nom: c.nom, prenom: c.prenom, role: c.role, desactivation_prevue_le: c.desactivation_prevue_le, ...(await sortPrevu(acteur, c, depuis)) });
    }
    const aDesactiver = lignes.filter((l) => l.prevu === "a_desactiver").length;
    return { date_effet: depuis, comptes: lignes, a_desactiver: aDesactiver, refuses: lignes.length - aDesactiver };
};

/** Compte chaque statut d'un bilan. */
const totaux = (bilan) => bilan.reduce((t, b) => ({ ...t, [b.statut]: (t[b.statut] ?? 0) + 1 }), {});

/**
 * Désactivation en lot. Chaque compte est traité seul : un refus (séances à traiter, déjà
 * désactivé) ne bloque pas les autres ; le bilan dit, pour chacun, ce qui s'est passé.
 */
export const desactiverEnLot = async (acteur, { ids = [], id_groupe = null, motif, date, preavis = true } = {}, contexte = null) => {
    motifValide(motif);
    dateEffet(date);
    const bilan = [];
    for (const id of await ciblesDuLot({ ids, id_groupe })) {
        try {
            bilan.push({ id_user: id, ...(await desactiver(acteur, id, { motif, date, preavis }, contexte)) });
        } catch (erreur) {
            if (!(erreur instanceof ErreurMetier)) throw erreur;
            bilan.push({ id_user: id, statut: "refuse", code: erreur.code ?? null, message: erreur.message });
        }
    }
    const t = totaux(bilan);
    return { bilan, desactives: t.desactive ?? 0, programmes: t.programmee ?? 0, refuses: t.refuse ?? 0 };
};

/**
 * Rétablissement en lot (défaire une désactivation de lot faite par erreur) : un compte désactivé
 * est réactivé, une désactivation programmée est annulée, un compte déjà actif sans programmation
 * est laissé tel quel (« inchange »). Un compte anonymisé est refusé : il ne se rétablit pas.
 */
export const retablirEnLot = async (acteur, { ids = [], id_groupe = null } = {}, contexte = null) => {
    const cibles = await ciblesDuLot({ ids, id_groupe });
    const comptes = new Map((await Users.findAll({ where: { id_user: cibles }, attributes: ["id_user", "actif", "desactivation_prevue_le"] })).map((u) => [u.id_user, u]));
    const bilan = [];
    for (const id of cibles) {
        const compte = comptes.get(id);
        try {
            if (compte?.actif && compte.desactivation_prevue_le) {
                await annulerProgrammation(acteur, id, contexte);
                bilan.push({ id_user: id, statut: "programmation_annulee" });
            } else if (compte?.actif) {
                bilan.push({ id_user: id, statut: "inchange" });
            } else {
                await reactiver(acteur, id, contexte);
                bilan.push({ id_user: id, statut: "reactive" });
            }
        } catch (erreur) {
            if (!(erreur instanceof ErreurMetier)) throw erreur;
            bilan.push({ id_user: id, statut: "refuse", code: erreur.code ?? null, message: erreur.message });
        }
    }
    const t = totaux(bilan);
    return { bilan, reactives: t.reactive ?? 0, programmations_annulees: t.programmation_annulee ?? 0, inchanges: t.inchange ?? 0, refuses: t.refuse ?? 0 };
};
