import { Enseignant, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { hashPassword } from "../utils/passwordHelper.js";

/**
 * Contrôleur pour les enseignants
 */

// 🔍 Récupérer tous les enseignants (avec pagination)
export const getAllEnseignants = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: enseignants } = await Enseignant.findAndCountAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        limit,
        offset,
        order: [["id_user", "ASC"]],
    });

    res.json(createPaginationResponse(enseignants, count, page, limit));
});

// 🔍 Récupérer un enseignant par ID
export const getEnseignantById = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(enseignant);
});

// ➕ Créer un enseignant
export const createEnseignant = asyncHandler(async (req, res) => {
    // Vérifier que l'utilisateur existe
    const user = await Users.findByPk(req.body.id_user);
    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.body.id_user}`,
        });
    }

    // Vérifier que l'utilisateur n'est pas déjà un enseignant
    const existingEnseignant = await Enseignant.findByPk(req.body.id_user);
    if (existingEnseignant) {
        return res.status(409).json({
            message: "Enseignant déjà existant",
            error: `L'utilisateur ${req.body.id_user} est déjà un enseignant`,
        });
    }

    const enseignant = await Enseignant.create(req.body);

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.status(201).json({
        message: "Enseignant créé avec succès",
        enseignant: enseignantAvecUser,
    });
});

// ✏️ Mettre à jour un enseignant
export const updateEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await enseignant.update(req.body);

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json({
        message: "Enseignant mis à jour avec succès",
        enseignant: enseignantAvecUser,
    });
});

// 🗑️ Supprimer un enseignant
export const deleteEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await enseignant.destroy();

    res.json({
        message: "Enseignant supprimé avec succès",
    });
});

// 📥 Importer des enseignants en masse
export const importEnseignants = asyncHandler(async (req, res) => {
    const { enseignants } = req.body;

    if (!Array.isArray(enseignants) || enseignants.length === 0) {
        return res.status(400).json({
            message: "Données invalides",
            error: "Un tableau d'enseignants est requis",
        });
    }

    const results = {
        success: [],
        errors: [],
    };

    for (const enseignantData of enseignants) {
        try {
            // Vérifier les champs requis
            if (!enseignantData.email || !enseignantData.nom || !enseignantData.prenom) {
                results.errors.push({
                    email: enseignantData.email || "N/A",
                    error: "Champs requis manquants (email, nom, prenom)",
                });
                continue;
            }

            // Vérifier si l'email existe déjà
            let user = await Users.findOne({ where: { email: enseignantData.email } });
            
            if (!user) {
                // Créer l'utilisateur
                const password = enseignantData.password || "password123";
                const password_hash = await hashPassword(password);

                user = await Users.create({
                    nom: enseignantData.nom,
                    prenom: enseignantData.prenom,
                    email: enseignantData.email,
                    role: "enseignant",
                    telephone: enseignantData.telephone || null,
                    actif: enseignantData.actif !== undefined ? enseignantData.actif : true,
                    password_hash: password_hash,
                });
            } else if (user.role !== "enseignant") {
                // Mettre à jour le rôle si nécessaire
                await user.update({ role: "enseignant" });
            }

            // Vérifier si l'enseignant existe déjà
            const existingEnseignant = await Enseignant.findByPk(user.id_user);
            if (existingEnseignant) {
                results.errors.push({
                    email: enseignantData.email,
                    error: "Enseignant déjà existant",
                });
                continue;
            }

            // Créer l'enseignant
            const enseignant = await Enseignant.create({
                id_user: user.id_user,
                specialite: enseignantData.specialite || null,
                departement: enseignantData.departement || null,
                grade: enseignantData.grade || null,
                bureau: enseignantData.bureau || null,
            });

            const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            });

            results.success.push(enseignantAvecUser);
        } catch (error) {
            console.error(`Erreur lors de la création de l'enseignant ${enseignantData.email}:`, error);
            results.errors.push({
                email: enseignantData.email || "N/A",
                error: error.message || "Erreur lors de la création",
            });
        }
    }

    res.status(201).json({
        message: `${results.success.length} enseignant(s) créé(s) avec succès`,
        success: results.success,
        errors: results.errors,
        total: enseignants.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
    });
});
