import { Etudiant, Users, Groupe, Appartenir, Filiere } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { hashPassword } from "../utils/passwordHelper.js";

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
            {
                model: Appartenir,
                as: "appartenance",
                include: [
                    {
                        model: Groupe,
                        as: "groupe",
                        include: [
                            {
                                model: Filiere,
                                as: "filiere",
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!etudiant) {
        return res.status(404).json({
            message: "Étudiant non trouvé",
            error: `Aucun étudiant trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Transformer la réponse pour avoir la structure attendue par le frontend
    const etudiantData = etudiant.toJSON();
    if (etudiantData.appartenance?.groupe) {
        etudiantData.groupe = etudiantData.appartenance.groupe;
        etudiantData.id_groupe = etudiantData.appartenance.groupe.id_groupe;
    } else {
        etudiantData.groupe = null;
        etudiantData.id_groupe = null;
    }

    res.json(etudiantData);
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

// 📥 Importer des étudiants en masse
export const importEtudiants = asyncHandler(async (req, res) => {
    const { etudiants } = req.body;

    if (!Array.isArray(etudiants) || etudiants.length === 0) {
        return res.status(400).json({
            message: "Données invalides",
            error: "Un tableau d'étudiants est requis",
        });
    }

    const results = {
        success: [],
        errors: [],
    };

    for (const etudiantData of etudiants) {
        try {
            // Vérifier les champs requis
            if (!etudiantData.email || !etudiantData.nom || !etudiantData.prenom || !etudiantData.numero_etudiant || !etudiantData.niveau) {
                results.errors.push({
                    email: etudiantData.email || "N/A",
                    error: "Champs requis manquants (email, nom, prenom, numero_etudiant, niveau)",
                });
                continue;
            }

            // Vérifier si l'email existe déjà
            let user = await Users.findOne({ where: { email: etudiantData.email } });
            
            if (!user) {
                // Créer l'utilisateur
                const password = etudiantData.password || "password123";
                const password_hash = await hashPassword(password);

                user = await Users.create({
                    nom: etudiantData.nom,
                    prenom: etudiantData.prenom,
                    email: etudiantData.email,
                    role: "etudiant",
                    telephone: etudiantData.telephone || null,
                    actif: etudiantData.actif !== undefined ? etudiantData.actif : true,
                    password_hash: password_hash,
                });
            } else if (user.role !== "etudiant") {
                // Mettre à jour le rôle si nécessaire
                await user.update({ role: "etudiant" });
            }

            // Vérifier si l'étudiant existe déjà
            const existingEtudiant = await Etudiant.findByPk(user.id_user);
            if (existingEtudiant) {
                results.errors.push({
                    email: etudiantData.email,
                    error: "Étudiant déjà existant",
                });
                continue;
            }

            // Vérifier l'unicité du numéro étudiant
            const existingNumero = await Etudiant.findOne({
                where: { numero_etudiant: etudiantData.numero_etudiant },
            });
            if (existingNumero) {
                results.errors.push({
                    email: etudiantData.email,
                    error: `Numéro étudiant "${etudiantData.numero_etudiant}" déjà utilisé`,
                });
                continue;
            }

            // Créer l'étudiant
            const etudiant = await Etudiant.create({
                id_user: user.id_user,
                numero_etudiant: etudiantData.numero_etudiant,
                niveau: etudiantData.niveau,
                id_groupe: etudiantData.id_groupe || null,
                date_inscription: etudiantData.date_inscription || new Date(),
            });

            const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            });

            results.success.push(etudiantAvecUser);
        } catch (error) {
            results.errors.push({
                email: etudiantData.email || "N/A",
                error: error.message || "Erreur lors de la création",
            });
        }
    }

    res.status(201).json({
        message: `${results.success.length} étudiant(s) créé(s) avec succès`,
        success: results.success,
        errors: results.errors,
        total: etudiants.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
    });
});
