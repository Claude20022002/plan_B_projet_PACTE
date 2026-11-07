import { Op } from "sequelize";
import { SectionCours, SupportCours, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { classeAutorisee } from "./droits.js";
import { changementsOuverture, conditionOuverte } from "./ouverture.js";

/**
 * Sections de l'espace de cours d'une classe, et la vue de l'espace entier (sections et supports).
 * L'enseignant voit tout, masqué compris ; l'étudiant ne voit que ce qui est publié.
 */

export const TITRE_GENERAL = "Général";
const TITRE_MAX = 120;

const titreValide = (titre) => {
    const propre = String(titre ?? "").trim().slice(0, TITRE_MAX);
    if (!propre) throw new ErreurMetier("Donnez un titre à la section", 400);
    return propre;
};

const ordreSuivant = async (Modele, where) => ((await Modele.max("ordre", { where })) ?? -1) + 1;

const versSupport = (s, user) => ({
    id_support: s.id_support,
    type: s.type,
    titre: s.titre,
    url: s.type === "lien" ? s.url : null,
    type_mime: s.type_mime,
    taille: s.taille,
    dans_bibliotheque: s.dans_bibliotheque,
    ordre: s.ordre,
    visible: s.visible,
    visible_du: s.visible_du,
    visible_jusqu_au: s.visible_jusqu_au,
    auteur: s.auteur ? { id_user: s.auteur.id_user, nom: s.auteur.nom, prenom: s.auteur.prenom } : null,
    modifiable: user.role === "admin" || s.id_user_auteur === user.id_user,
    createdAt: s.createdAt,
});

/** Espace d'une classe : { classe, gere, sections: [{ …, supports }] }. */
export const lireEspace = async (user, idCours, idGroupe) => {
    const { cours, groupe, gere } = await classeAutorisee(user, idCours, idGroupe);
    const sections = await SectionCours.findAll({
        // L'étudiant ne voit que ce qui est publié et ouvert aujourd'hui (interrupteur et dates, lot EC-1)
        where: { id_cours: cours.id_cours, id_groupe: groupe.id_groupe, ...(gere ? {} : conditionOuverte()) },
        include: [{ model: SupportCours, as: "supports", required: false, ...(gere ? {} : { where: conditionOuverte() }), include: [{ model: Users, as: "auteur", attributes: ["id_user", "nom", "prenom"] }] }],
        order: [["ordre", "ASC"], ["id_section", "ASC"], [{ model: SupportCours, as: "supports" }, "ordre", "ASC"], [{ model: SupportCours, as: "supports" }, "id_support", "ASC"]],
    });
    return {
        classe: { id_cours: cours.id_cours, code_cours: cours.code_cours, nom_cours: cours.nom_cours, id_groupe: groupe.id_groupe, nom_groupe: groupe.nom_groupe },
        gere,
        sections: sections
            // L'étudiant ne voit pas une section vide
            .filter((s) => gere || s.supports.length > 0)
            .map((s) => ({ id_section: s.id_section, titre: s.titre, ordre: s.ordre, visible: s.visible, visible_du: s.visible_du, visible_jusqu_au: s.visible_jusqu_au, supports: s.supports.map((x) => versSupport(x, user)) })),
    };
};

export const creerSection = async (user, idCours, idGroupe, { titre } = {}) => {
    const { cours, groupe } = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const where = { id_cours: cours.id_cours, id_groupe: groupe.id_groupe };
    return SectionCours.create({ ...where, titre: titreValide(titre), ordre: await ordreSuivant(SectionCours, where), id_user_auteur: user.id_user });
};

/** Section que l'utilisateur gère (404 sinon), avec sa classe. */
export const sectionGeree = async (user, idSection) => {
    const section = await SectionCours.findByPk(Number(idSection) || 0);
    if (!section) throw new ErreurMetier("Section introuvable", 404);
    const classe = await classeAutorisee(user, section.id_cours, section.id_groupe, { gerer: true });
    return { section, ...classe };
};

export const modifierSection = async (user, idSection, { titre, visible, visible_du, visible_jusqu_au } = {}) => {
    const { section } = await sectionGeree(user, idSection);
    const changements = changementsOuverture({ visible_du, visible_jusqu_au }, section);
    if (titre !== undefined) changements.titre = titreValide(titre);
    if (visible !== undefined) changements.visible = Boolean(visible);
    return section.update(changements);
};

/** Une section se supprime vide : on ne fait pas disparaître d'un geste les supports d'un collègue. */
export const supprimerSection = async (user, idSection) => {
    const { section } = await sectionGeree(user, idSection);
    if (await SupportCours.count({ where: { id_section: section.id_section } })) {
        throw new ErreurMetier("Retirez ou déplacez d'abord les supports de cette section", 409);
    }
    await section.destroy();
};

/** Nouvel ordre des sections d'une classe : la liste complète de leurs identifiants. */
export const ordonnerSections = async (user, idCours, idGroupe, ids) => {
    const { cours, groupe } = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const where = { id_cours: cours.id_cours, id_groupe: groupe.id_groupe };
    const existantes = (await SectionCours.findAll({ where, attributes: ["id_section"], raw: true })).map((s) => s.id_section);
    const demandees = (Array.isArray(ids) ? ids : []).map(Number);
    if (demandees.length !== existantes.length || !existantes.every((id) => demandees.includes(id))) {
        throw new ErreurMetier("L'ordre doit citer chaque section de la classe une fois", 400);
    }
    await Promise.all(demandees.map((id, ordre) => SectionCours.update({ ordre }, { where: { ...where, id_section: id } })));
};

/** Section « Général » de la classe, créée au premier ajout. */
export const sectionGenerale = async (user, cours, groupe) => {
    const where = { id_cours: cours.id_cours, id_groupe: groupe.id_groupe };
    const premiere = await SectionCours.findOne({ where, order: [["ordre", "ASC"]] });
    return premiere ?? SectionCours.create({ ...where, titre: TITRE_GENERAL, ordre: 0, id_user_auteur: user.id_user });
};

/** Classes d'un étudiant qui ont au moins un support publié (pour « Mes cours »). */
export const sectionsPubliees = (groupes) =>
    SectionCours.findAll({
        where: { id_groupe: { [Op.in]: groupes }, ...conditionOuverte() },
        include: [{ model: SupportCours, as: "supports", where: conditionOuverte(), required: true, attributes: ["id_support"] }],
        attributes: ["id_cours", "id_groupe"],
    });

export { ordreSuivant };
