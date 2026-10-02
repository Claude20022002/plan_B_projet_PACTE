import { Appartenir } from "../models/index.js";

/**
 * Vérifie si un étudiant appartient à un groupe.
 * @param {number} idEtudiant
 * @param {number|string} idGroupe
 * @returns {Promise<boolean>}
 */
export const etudiantAppartientAuGroupe = async (idEtudiant, idGroupe) => {
    const appartenance = await Appartenir.findOne({
        where: { id_user_etudiant: idEtudiant, id_groupe: idGroupe },
        attributes: ["id_groupe"],
    });
    return Boolean(appartenance);
};

/**
 * Accès aux données d'un groupe (emploi du temps, séances) :
 * le personnel (enseignant, admin) voit tous les groupes, un étudiant uniquement le sien.
 * @param {string} idParam - Nom du paramètre d'URL contenant l'ID du groupe
 */
export const requireGroupAccess = (idParam = "id_groupe") => async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentification requise" });
        }
        if (req.user.role !== "etudiant") {
            return next();
        }
        if (await etudiantAppartientAuGroupe(req.user.id_user, req.params[idParam])) {
            return next();
        }
        return res.status(403).json({
            message: "Accès interdit",
            error: "Vous ne pouvez consulter que l'emploi du temps de votre groupe",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Accès à l'emploi du temps d'un étudiant : l'étudiant lui-même ou le personnel.
 * @param {string} idParam - Nom du paramètre d'URL contenant l'ID de l'étudiant
 */
export const requireSelfOrStaff = (idParam = "id") => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentification requise" });
    }
    const isStaff = ["admin", "enseignant"].includes(req.user.role);
    if (isStaff || Number(req.params[idParam]) === req.user.id_user) {
        return next();
    }
    return res.status(403).json({ message: "Accès interdit" });
};
