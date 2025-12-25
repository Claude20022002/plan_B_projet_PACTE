import { Etudiant, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les étudiants
 */

// 🔍 Récupérer tous les étudiants (avec pagination)
export const getAllEtudiants = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.id_groupe) {
        where.id_groupe = req.query.id_groupe;
    }
    if (req.query.niveau) {
        where.niveau = req.query.niveau;
    }

    const { count, rows: etudiants } = await Etudiant.findAndCountAll({
        where,
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        limit,
        offset,
        order: [["numero_etudiant", "ASC"]],
    });

    res.json(createPaginationResponse(etudiants, count, page, limit));
});

// 🔍 Récupérer un étudiant par ID
export const getEtudiantById = asyncHandler(async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!etudiant) {
        return res.status(404).json({
            message: "Étudiant non trouvé",
            error: `Aucun étudiant trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(etudiant);
});

// ➕ Créer un étudiant
export const createEtudiant = asyncHandler(async (req, res) => {
    // Vérifier que l'utilisateur existe
    const user = await Users.findByPk(req.body.id_user);
    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.body.id_user}`,
        });
    }

    // Vérifier que l'utilisateur n'est pas déjà un étudiant
    const existingEtudiant = await Etudiant.findByPk(req.body.id_user);
    if (existingEtudiant) {
        return res.status(409).json({
            message: "Étudiant déjà existant",
            error: `L'utilisateur ${req.body.id_user} est déjà un étudiant`,
        });
    }

    // Vérifier l'unicité du numéro étudiant
    if (req.body.numero_etudiant) {
        const existingNumero = await Etudiant.findOne({
            where: { numero_etudiant: req.body.numero_etudiant },
        });
        if (existingNumero) {
            return res.status(409).json({
                message: "Numéro étudiant déjà utilisé",
                error: `Le numéro étudiant "${req.body.numero_etudiant}" est déjà utilisé`,
            });
        }
    }

    const etudiant = await Etudiant.create(req.body);

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.status(201).json({
        message: "Étudiant créé avec succès",
        etudiant: etudiantAvecUser,
    });
});

// ✏️ Mettre à jour un étudiant
export const updateEtudiant = asyncHandler(async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id);

    if (!etudiant) {
        return res.status(404).json({
            message: "Étudiant non trouvé",
            error: `Aucun étudiant trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Vérifier l'unicité du numéro étudiant si modifié
    if (req.body.numero_etudiant && req.body.numero_etudiant !== etudiant.numero_etudiant) {
        const existingNumero = await Etudiant.findOne({
            where: { numero_etudiant: req.body.numero_etudiant },
        });
        if (existingNumero) {
            return res.status(409).json({
                message: "Numéro étudiant déjà utilisé",
                error: `Le numéro étudiant "${req.body.numero_etudiant}" est déjà utilisé`,
            });
        }
    }

    await etudiant.update(req.body);

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json({
        message: "Étudiant mis à jour avec succès",
        etudiant: etudiantAvecUser,
    });
});

// 🗑️ Supprimer un étudiant
export const deleteEtudiant = asyncHandler(async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id);

    if (!etudiant) {
        return res.status(404).json({
            message: "Étudiant non trouvé",
            error: `Aucun étudiant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await etudiant.destroy();

    res.json({
        message: "Étudiant supprimé avec succès",
    });
});
