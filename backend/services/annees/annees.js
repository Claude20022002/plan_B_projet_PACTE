import { Op } from "sequelize";
import { AnneeUniversitaire, Appartenir, Groupe } from "../../models/index.js";
import { ancetres } from "../planning/groupes.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { normaliserAnnee } from "../../config/referentiel.js";

/**
 * L'année, cadre de ce que voit un étudiant (plan multi-établissements, D-19, lot ME-18). Une
 * seule règle pour « les groupes d'un étudiant » : ses groupes **de l'année voulue** et leurs
 * parents (TP → TD → promotion). Elle remplace les trois copies qui prenaient tous ses groupes,
 * toutes années confondues (espace de cours, jeux et quiz, emploi du temps).
 *
 * Un groupe dont l'année est inconnue (id_annee vide : texte illisible à la migration) reste
 * visible, comme avant : on ne cache rien par erreur. Sans année en cours définie, aucun filtre.
 */

/** Libellé d'année ramené à une forme unique (définition dans config/referentiel.js). */
export const normaliserLibelle = normaliserAnnee;

/** L'année en cours : celle marquée active, sinon celle qui contient aujourd'hui, sinon null. */
export const anneeCourante = async ({ transaction } = {}) =>
    (await AnneeUniversitaire.findOne({ where: { active: true }, transaction })) ??
    (await AnneeUniversitaire.findOne({ where: { date_debut: { [Op.lte]: aujourdhui() }, date_fin: { [Op.gte]: aujourdhui() } }, transaction }));

/** Identifiant de l'année dont le libellé correspond au texte, ou null. */
export const idAnneeDuTexte = async (texte, { transaction } = {}) => {
    const libelle = normaliserLibelle(texte);
    if (!libelle) return null;
    const annees = await AnneeUniversitaire.findAll({ attributes: ["id_annee", "libelle"], transaction });
    return annees.find((a) => normaliserLibelle(a.libelle) === libelle)?.id_annee ?? null;
};

/**
 * Années retenues : `annee` (un identifiant) ; ou les années qui recouvrent `du`-`au` (pour un
 * emploi du temps, qui peut regarder en arrière) ; sinon l'année en cours. null = pas de filtre.
 */
const anneesRetenues = async ({ annee, du, au, transaction }) => {
    if (annee) return new Set([Number(annee)]);
    if (du && au) {
        const recouvrent = await AnneeUniversitaire.findAll({ where: { date_debut: { [Op.lte]: au }, date_fin: { [Op.gte]: du } }, attributes: ["id_annee"], transaction });
        return recouvrent.length ? new Set(recouvrent.map((a) => a.id_annee)) : null;
    }
    const courante = await anneeCourante({ transaction });
    return courante ? new Set([courante.id_annee]) : null;
};

/** Garde les groupes des années retenues, et ceux dont l'année est inconnue. */
export const filtrerParAnnee = async (groupes, options = {}) => {
    const retenues = await anneesRetenues(options);
    return retenues ? groupes.filter((g) => g.id_annee == null || retenues.has(g.id_annee)) : groupes;
};

/**
 * Groupes d'un étudiant pour une année (l'année en cours par défaut), avec leurs parents.
 * Options : `annee` (identifiant d'une année, pour les archives), `du` et `au` (dates AAAA-MM-JJ).
 * Rend une liste d'identifiants sans doublon.
 */
export const groupesDeLAnnee = async (idUser, options = {}) => {
    const { transaction } = options;
    const directs = (await Appartenir.findAll({ where: { id_user_etudiant: idUser }, include: [{ model: Groupe, as: "groupe" }], transaction }))
        .map((a) => a.groupe)
        .filter(Boolean);
    const retenus = await filtrerParAnnee(directs, options);
    if (!retenus.length) return [];
    const tous = await Groupe.findAll({ where: { id_filiere: [...new Set(retenus.map((g) => g.id_filiere))] }, transaction });
    const parId = new Map(tous.map((g) => [g.id_groupe, g]));
    return [...new Set(retenus.flatMap((g) => [g.id_groupe, ...ancetres(g, parId).map((a) => a.id_groupe)]))];
};
