import { Cours, CoursComposante, Enseignement, Groupe } from "../../models/index.js";

/**
 * Résolveurs utilisés avec autoriserFiliere : retrouvent la filière d'un objet ciblé par
 * la requête. `undefined` = objet introuvable (le contrôleur répondra 404).
 */

const avecChangement = (actuelle, req) => {
    const nouvelle = req.body?.id_filiere ? Number(req.body.id_filiere) : null;
    return nouvelle && nouvelle !== actuelle ? [actuelle, nouvelle] : actuelle;
};

export const filiereDuCours = async (req) => {
    const cours = await Cours.findByPk(req.params.idCours ?? req.params.id, { attributes: ["id_filiere"] });
    return cours ? avecChangement(cours.id_filiere, req) : undefined;
};

export const filiereDeLaComposante = async (req) => {
    const composante = await CoursComposante.findByPk(req.params.id, {
        include: [{ model: Cours, as: "cours", attributes: ["id_filiere"] }],
    });
    return composante ? composante.cours.id_filiere : undefined;
};

export const filiereDuGroupe = async (req) => {
    const groupe = await Groupe.findByPk(req.params.id, { attributes: ["id_filiere"] });
    return groupe ? avecChangement(groupe.id_filiere, req) : undefined;
};

const filieresDesEnseignements = async (ids) => {
    const enseignements = await Enseignement.findAll({
        where: { id_enseignement: ids },
        include: [{ model: CoursComposante, as: "composante", include: [{ model: Cours, as: "cours", attributes: ["id_filiere"] }] }],
    });
    if (enseignements.length === 0) return undefined;
    return enseignements.map((e) => e.composante.cours.id_filiere);
};

export const filiereDeLEnseignement = (req) => filieresDesEnseignements([req.params.id]);

export const filieresDeLaFusion = (req) => filieresDesEnseignements(Array.isArray(req.body?.ids) ? req.body.ids : []);
