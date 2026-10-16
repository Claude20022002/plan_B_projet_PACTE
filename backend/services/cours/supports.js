import { SectionCours, SupportCours } from "../../models/index.js";
import { journaliser } from "../journalSecurite.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { chargerClasse, classeAutorisee, groupesVisiblesPar } from "./droits.js";
import { ordreSuivant, sectionGeree, sectionGenerale, sectionsPubliees } from "./sections.js";
import { chercherDocuments, lienDocument, lireDocument, publierDocument, supprimerDocument, transmettreDepot } from "./studylib.js";

/**
 * Supports d'une classe : documents de StudyLib (déposés depuis la classe ou épinglés depuis la
 * Bibliothèque) et liens. Planner range et donne les droits ; StudyLib garde les fichiers.
 */

const TITRE_MAX = 200;
const titreOuDefaut = (titre, defaut) => String(titre ?? "").trim().slice(0, TITRE_MAX) || defaut;

/** Section visée par un ajout : celle donnée, ou « Général » de la classe. */
const sectionCible = async (user, { idSection, idCours, idGroupe }) => {
    if (idSection) return sectionGeree(user, idSection);
    const classe = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    return { ...classe, section: await sectionGenerale(user, classe.cours, classe.groupe) };
};

const creerSupport = async (user, section, champs) =>
    SupportCours.create({ ...champs, id_section: section.id_section, ordre: await ordreSuivant(SupportCours, { id_section: section.id_section }), id_user_auteur: user.id_user });

/**
 * Dépôt d'un fichier : le formulaire part tel quel vers StudyLib avec le jeton de l'enseignant.
 * Le module du document doit être celui de la classe (le navigateur pourrait en désigner un autre) :
 * sinon le document est aussitôt retiré de StudyLib et le dépôt refusé.
 */
export const deposerFichier = async (req, cible) => {
    const { section, cours } = await sectionCible(req.user, cible);
    const document = await transmettreDepot(req, { filiere: cours.filiere?.code_filiere, module: cours.code_cours });
    if (document.module?.code !== cours.code_cours) {
        await supprimerDocument(cible.jeton, document.id).catch(() => {});
        throw new ErreurMetier("Le document doit être déposé dans le module de la classe", 400);
    }
    return creerSupport(req.user, section, {
        type: "document",
        titre: titreOuDefaut(document.title, "Document"),
        id_document: document.id,
        type_mime: document.mime_type ?? null,
        taille: Number.isInteger(document.file_size) ? document.file_size : null,
    });
};

export const ajouterLien = async (user, cible, { titre, url } = {}) => {
    const { section } = await sectionCible(user, cible);
    let adresse;
    try {
        adresse = new URL(String(url ?? "").trim());
    } catch {
        throw new ErreurMetier("Adresse invalide", 400);
    }
    if (!["https:", "http:"].includes(adresse.protocol) || adresse.href.length > 2048) throw new ErreurMetier("Adresse invalide : http ou https seulement", 400);
    return creerSupport(user, section, { type: "lien", titre: titreOuDefaut(titre, adresse.hostname), url: adresse.href });
};

/**
 * Documents de la Bibliothèque à épingler dans une classe (lot E-9) : seulement pour qui gère la
 * classe, et la recherche part vers StudyLib après ce contrôle. 2 à 80 caractères, comme StudyLib.
 */
export const chercherBibliotheque = async (user, { idCours, idGroupe, jeton }, q) => {
    await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const texte = String(q ?? "").trim();
    if (texte.length < 2 || texte.length > 80) throw new ErreurMetier("Tapez de 2 à 80 caractères", 400);
    const documents = await chercherDocuments(jeton, texte);
    return documents.map((d) => ({ id: d.id, titre: d.title, type: d.type ?? null, type_mime: d.mime_type ?? null, module: d.module ?? null }));
};

/** Épingle un document publié de la Bibliothèque, sans copie (StudyLib vérifie que l'enseignant le voit). */
export const epinglerDocument = async (user, cible, { id_document, titre } = {}) => {
    const { section } = await sectionCible(user, cible);
    const document = await lireDocument(cible.jeton, String(id_document ?? ""));
    if (document.visibility !== "school") throw new ErreurMetier("Seul un document publié dans la Bibliothèque s'épingle", 400);
    return creerSupport(user, section, {
        type: "document",
        titre: titreOuDefaut(titre, document.title),
        id_document: document.id,
        type_mime: document.mime_type ?? null,
        taille: Number.isInteger(document.file_size) ? document.file_size : null,
        dans_bibliotheque: true,
    });
};

/** Support que l'utilisateur peut modifier : sa classe, et son propre support (ou l'administration). */
const supportModifiable = async (user, idSupport) => {
    const support = await SupportCours.findByPk(Number(idSupport) || 0, { include: [{ model: SectionCours, as: "section" }] });
    if (!support) throw new ErreurMetier("Support introuvable", 404);
    await classeAutorisee(user, support.section.id_cours, support.section.id_groupe, { gerer: true });
    if (user.role !== "admin" && support.id_user_auteur !== user.id_user) throw new ErreurMetier("Seul l'auteur de ce support peut le modifier", 403);
    return support;
};

export const modifierSupport = async (user, idSupport, { titre, visible, id_section, ordre } = {}) => {
    const support = await supportModifiable(user, idSupport);
    const changements = {};
    if (titre !== undefined) changements.titre = titreOuDefaut(titre, support.titre);
    if (visible !== undefined) changements.visible = Boolean(visible);
    if (ordre !== undefined && Number.isInteger(Number(ordre))) changements.ordre = Number(ordre);
    if (id_section !== undefined && Number(id_section) !== support.id_section) {
        const { section } = await sectionGeree(user, id_section);
        // Un support ne change pas de classe
        if (section.id_cours !== support.section.id_cours || section.id_groupe !== support.section.id_groupe) throw new ErreurMetier("Section introuvable", 404);
        changements.id_section = section.id_section;
        changements.ordre = await ordreSuivant(SupportCours, { id_section: section.id_section });
    }
    return support.update(changements);
};

/** Retire un support ; un document de classe disparaît aussi de StudyLib, jamais un document de la Bibliothèque. */
export const retirerSupport = async (user, jeton, idSupport, contexte) => {
    const support = await supportModifiable(user, idSupport);
    if (support.type === "document" && !support.dans_bibliotheque) await supprimerDocument(jeton, support.id_document);
    await support.destroy();
    await journaliser(contexte, { evenement: "support_retire", user, details: { id_support: support.id_support, titre: support.titre, id_cours: support.section.id_cours, id_groupe: support.section.id_groupe } });
};

/** Publie un document de classe dans la Bibliothèque : le même document, pour toute l'école. */
export const publierSupport = async (user, jeton, idSupport, contexte) => {
    const support = await supportModifiable(user, idSupport);
    if (support.type !== "document" || support.dans_bibliotheque) throw new ErreurMetier("Ce support est déjà dans la Bibliothèque", 409);
    await publierDocument(jeton, support.id_document);
    await support.update({ dans_bibliotheque: true });
    await journaliser(contexte, { evenement: "support_publie_bibliotheque", user, details: { id_support: support.id_support, id_document: support.id_document } });
    return support;
};

/** Adresse à ouvrir : le lien, ou un lien signé de StudyLib de 5 minutes. */
export const ouvrirSupport = async (user, idSupport) => {
    const support = await SupportCours.findByPk(Number(idSupport) || 0, { include: [{ model: SectionCours, as: "section" }] });
    if (!support) throw new ErreurMetier("Support introuvable", 404);
    const { gere } = await classeAutorisee(user, support.section.id_cours, support.section.id_groupe);
    if (!gere && !(support.visible && support.section.visible)) throw new ErreurMetier("Support introuvable", 404);
    return support.type === "lien" ? support.url : lienDocument(support.id_document, user.id_user);
};

/** « Mes cours » d'un étudiant : ses classes qui ont au moins un support publié. */
export const mesCours = async (user) => {
    if (user?.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
    const sections = await sectionsPubliees(await groupesVisiblesPar(user));
    const cles = [...new Map(sections.map((s) => [`${s.id_cours}:${s.id_groupe}`, s])).values()];
    const classes = await Promise.all(cles.map((s) => chargerClasse(s.id_cours, s.id_groupe)));
    return classes
        .map(({ cours, groupe }) => ({ id_cours: cours.id_cours, code_cours: cours.code_cours, nom_cours: cours.nom_cours, id_groupe: groupe.id_groupe, nom_groupe: groupe.nom_groupe }))
        .sort((a, b) => a.nom_cours.localeCompare(b.nom_cours, "fr"));
};

