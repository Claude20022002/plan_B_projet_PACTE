import { Appartenir, Cours, Filiere, Groupe } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { avecDescendants } from "../planning/groupes.js";
import { peutViserClasse } from "../planning/mesClasses.js";

/**
 * Droits sur l'espace de cours d'une classe (module, groupe). Deux questions seulement, testées à
 * part (docs/plans/espace-de-cours.md, § 8) :
 *  - gérer : l'administration, ou un enseignant dont c'est la classe (ou un sous-groupe de sa
 *    classe, ou la filière dont il est responsable) ;
 *  - voir : qui gère, ou un étudiant du groupe ou de l'un de ses sous-groupes (un étudiant de TP
 *    voit les supports du CM de sa promotion).
 * Hors de ses classes, la réponse est 404 : on ne révèle pas qu'une classe existe.
 */

const introuvable = () => new ErreurMetier("Classe introuvable", 404);

/** Rend { cours, groupe } ; le cours porte le code de sa filière (correspondance avec StudyLib). */
export const chargerClasse = async (idCours, idGroupe) => {
    const [cours, groupe] = await Promise.all([
        Cours.findByPk(Number(idCours) || 0, { attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"], include: [{ model: Filiere, as: "filiere", attributes: ["code_filiere"] }] }),
        Groupe.findByPk(Number(idGroupe) || 0, { attributes: ["id_groupe", "nom_groupe", "id_groupe_parent", "id_filiere"] }),
    ]);
    if (!cours || !groupe) throw introuvable();
    return { cours, groupe };
};

export const peutGererClasse = async (user, cours, idGroupe) =>
    user?.role === "admin" || (user?.role === "enseignant" && (await peutViserClasse(user, cours, idGroupe)));

export const peutVoirClasse = async (user, cours, idGroupe) => {
    if (await peutGererClasse(user, cours, idGroupe)) return true;
    if (user?.role !== "etudiant") return false;
    const groupes = await avecDescendants([Number(idGroupe)]);
    return (await Appartenir.count({ where: { id_user_etudiant: user.id_user, id_groupe: groupes } })) > 0;
};

/** Charge la classe et vérifie le droit demandé ; rend { cours, groupe, gere }. */
export const classeAutorisee = async (user, idCours, idGroupe, { gerer = false } = {}) => {
    const { cours, groupe } = await chargerClasse(idCours, idGroupe);
    const gere = await peutGererClasse(user, cours, groupe.id_groupe);
    if (gerer ? !gere : !(gere || (await peutVoirClasse(user, cours, groupe.id_groupe)))) throw introuvable();
    return { cours, groupe, gere };
};

/**
 * Groupes dont un étudiant voit les classes : les siens et leurs ancêtres (promotion d'un TD,
 * TD d'un TP). Rend une liste d'identifiants.
 */
export const groupesVisiblesPar = async (user) => {
    const siens = (await Appartenir.findAll({ where: { id_user_etudiant: user.id_user }, attributes: ["id_groupe"], raw: true })).map((a) => a.id_groupe);
    const vus = new Set(siens);
    let aRemonter = siens;
    while (aRemonter.length) {
        const parents = (await Groupe.findAll({ where: { id_groupe: aRemonter }, attributes: ["id_groupe_parent"], raw: true }))
            .map((g) => g.id_groupe_parent)
            .filter((id) => id && !vus.has(id));
        parents.forEach((id) => vus.add(id));
        aRemonter = parents;
    }
    return [...vus];
};
