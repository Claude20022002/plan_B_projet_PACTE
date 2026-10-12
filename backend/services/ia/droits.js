import { Cours, Groupe } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { mesClasses, peutViserClasse } from "../planning/mesClasses.js";
import { inscritsDuModule, peutProposerDansModule } from "../jeux/jeux.js";

/**
 * Droits d'un enseignant sur un quiz par l'IA : le module doit être l'un des siens (services ou
 * emploi du temps), et la classe, facultative, l'une de ses classes dans ce module. Sorti de
 * services/ia/quiz.js, trop long.
 */

/**
 * Un groupe convient s'il suit le module (rattaché par un enseignement), ou si l'enseignant a ce
 * module avec lui à son emploi du temps (décision du chef de projet, 11 octobre 2026 : une séance
 * sans enseignement, posée à la main, reste un vrai cours). Rend vrai ou faux.
 */
const groupeDuModule = async (cours, groupe, classes) =>
    (await inscritsDuModule(cours.id_cours)).groupes.includes(groupe.id_groupe) || classes.some((c) => c.id_cours === cours.id_cours && c.id_groupe === groupe.id_groupe);

/** Rend { cours, groupe } (groupe null sans classe) ; lève une erreur 403, 404 ou 400 sinon. */
export const contexteAutorise = async (user, idCours, idGroupe) => {
    if (user?.role !== "enseignant") throw new ErreurMetier("Réservé aux enseignants", 403);
    const cours = await Cours.findByPk(Number(idCours) || 0, { attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"] });
    if (!cours) throw new ErreurMetier("Module introuvable", 404);
    const classes = await mesClasses(user);
    if (!(await peutProposerDansModule(user, cours)) && !classes.some((c) => c.id_cours === cours.id_cours)) {
        throw new ErreurMetier("Vous ne pouvez générer un quiz que pour vos modules", 403);
    }
    let groupe = null;
    if (idGroupe !== undefined && idGroupe !== null && idGroupe !== "") {
        groupe = await Groupe.findByPk(Number(idGroupe) || 0);
        if (!groupe || !(await groupeDuModule(cours, groupe, classes))) throw new ErreurMetier("Ce groupe ne suit pas ce module", 400);
        if (!(await peutViserClasse(user, cours, groupe.id_groupe, { classes }))) throw new ErreurMetier("Ce groupe n'est pas l'une de vos classes dans ce module", 403);
    }
    return { cours, groupe };
};
