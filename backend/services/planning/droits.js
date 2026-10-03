import { ResponsableFiliere } from "../../models/index.js";

/**
 * Droits de préparation du semestre : l'administration a la main sur tout, un responsable
 * de filière seulement sur les filières dont il a la charge.
 */

export const filieresDuResponsable = async (idUser) =>
    (await ResponsableFiliere.findAll({ where: { id_user: idUser }, attributes: ["id_filiere"] })).map((r) => r.id_filiere);

export const peutGererFiliere = async (user, idFiliere) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role !== "enseignant" || !idFiliere) return false;
    return Boolean(await ResponsableFiliere.findOne({ where: { id_user: user.id_user, id_filiere: idFiliere } }));
};

/** Admin, ou enseignant responsable d'au moins une filière. */
export const requireAdminOuResponsable = async (req, res, next) => {
    if (req.user?.role === "admin") return next();
    if (req.user?.role === "enseignant" && (await filieresDuResponsable(req.user.id_user)).length > 0) return next();
    return res.status(403).json({ message: "Accès interdit", error: "Réservé à l'administration et aux responsables de filière" });
};

/**
 * Middleware : `resoudreFiliere(req)` retourne l'id (ou la liste d'ids) des filières concernées
 * par la requête (lues dans le corps ou sur l'objet ciblé), ou `undefined` si l'objet n'existe
 * pas (le 404 est laissé au contrôleur). Toutes les filières doivent être gérées par l'utilisateur.
 */
export const autoriserFiliere = (resoudreFiliere) => async (req, res, next) => {
    if (req.user?.role === "admin") return next();
    try {
        const resultat = await resoudreFiliere(req);
        if (resultat === undefined) return next();
        const ids = [...new Set([resultat].flat().filter((id) => id !== null && id !== undefined))];
        const autorise = ids.length > 0 && (await Promise.all(ids.map((id) => peutGererFiliere(req.user, id)))).every(Boolean);
        if (autorise) return next();
        return res.status(403).json({ message: "Accès interdit", error: "Vous n'êtes pas responsable de cette filière" });
    } catch (error) {
        return next(error);
    }
};

// ── Résolveurs : de l'objet ciblé à sa filière ─────────────────────────────

export const filiereDuCorps = (req) => (req.body?.id_filiere ? Number(req.body.id_filiere) : null);
