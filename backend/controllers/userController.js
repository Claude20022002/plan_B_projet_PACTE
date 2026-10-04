import { Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/passwordHelper.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Contrôleur pour les utilisateurs
 */

// Champs modifiables par l'utilisateur sur son propre profil
const SELF_EDITABLE_FIELDS = ["nom", "prenom", "telephone", "avatar_url"];
// Champs modifiables par un administrateur
const ADMIN_EDITABLE_FIELDS = [...SELF_EDITABLE_FIELDS, "email", "role", "actif"];

// 🔍 Récupérer tous les utilisateurs (avec pagination)
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtre facultatif par rôle (ex. comptes enseignants sans fiche, page Enseignants)
    const where = ["admin", "enseignant", "etudiant"].includes(req.query.role) ? { role: req.query.role } : {};
    const { count, rows: users } = await Users.findAndCountAll({
        where,
        attributes: { exclude: ["password_hash"] },
        limit,
        offset,
        order: [["id_user", "DESC"]],
    });

    res.json(createPaginationResponse(users, count, page, limit));
});

// 🔍 Récupérer un utilisateur par ID
export const getUserById = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id, {
        attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(user);
});

// ➕ Créer un utilisateur
export const createUser = asyncHandler(async (req, res) => {
    // Vérifier si l'email existe déjà
    const existingUser = await Users.findOne({ where: { email: req.body.email } });
    if (existingUser) {
        return res.status(409).json({
            message: "Email déjà utilisé",
            error: "Un utilisateur avec cet email existe déjà",
        });
    }

    const passwordValidation = validatePasswordStrength(req.body.password);
    if (!passwordValidation.valid) {
        return res.status(400).json({
            message: "Mot de passe invalide",
            errors: passwordValidation.errors,
        });
    }

    // Seuls les champs connus sont acceptés ; le mot de passe est toujours haché ici
    const user = await Users.create({
        ...pick(req.body, ["nom", "prenom", "email", "role", "telephone", "actif"]),
        password_hash: await hashPassword(req.body.password),
    });

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: userResponse,
    });
});

// ✏️ Mettre à jour un utilisateur
export const updateUser = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Liste blanche selon le rôle : un utilisateur ne peut jamais modifier
    // son propre rôle, son statut actif ou son email (identifiant de connexion).
    const isAdmin = req.user.role === "admin";
    const updateData = pick(req.body, isAdmin ? ADMIN_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS);

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await Users.findOne({ where: { email: updateData.email } });
        if (existingUser) {
            return res.status(409).json({
                message: "Email déjà utilisé",
                error: "Un utilisateur avec cet email existe déjà",
            });
        }
    }

    if (req.body.password) {
        const passwordValidation = validatePasswordStrength(String(req.body.password));
        if (!passwordValidation.valid) {
            return res.status(400).json({
                message: "Mot de passe invalide",
                errors: passwordValidation.errors,
            });
        }

        // Changer son propre mot de passe exige l'actuel (session volée ≠ compte volé).
        // L'administrateur qui réinitialise le mot de passe d'un autre compte n'en a pas besoin.
        const isOwnAccount = user.id_user === req.user.id_user;
        if (isOwnAccount) {
            const withHash = await Users.scope("withPassword").findByPk(user.id_user);
            const currentOk =
                typeof req.body.current_password === "string" &&
                (await comparePassword(req.body.current_password, withHash.password_hash));
            if (!currentOk) {
                return res.status(400).json({
                    message: "Mot de passe actuel incorrect",
                    error: "Saisissez votre mot de passe actuel pour en définir un nouveau",
                });
            }
        }

        updateData.password_hash = await hashPassword(String(req.body.password));
    }

    await user.update(updateData);
    
    // Recharger l'utilisateur pour obtenir les données à jour
    await user.reload();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
        message: "Utilisateur mis à jour avec succès",
        user: userResponse,
    });
});

// 🗑️ Supprimer un utilisateur
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    await user.destroy();

    res.json({
        message: "Utilisateur supprimé avec succès",
    });
});

// 📥 Importer des utilisateurs en masse
export const importUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
            message: "Données invalides",
            error: "Un tableau d'utilisateurs est requis",
        });
    }

    const results = {
        success: [],
        errors: [],
    };

    for (const userData of users) {
        try {
            // Vérifier si l'email existe déjà
            const existingUser = await Users.findOne({ where: { email: userData.email } });
            if (existingUser) {
                results.errors.push({
                    email: userData.email,
                    error: "Email déjà utilisé",
                });
                continue;
            }

            // Préparer les données pour la création
            const userCreateData = {
                nom: userData.nom,
                prenom: userData.prenom,
                email: userData.email,
                role: userData.role || 'etudiant',
                telephone: userData.telephone || null,
                actif: userData.actif !== undefined ? userData.actif : true,
            };

            // Hasher le mot de passe si fourni, sinon utiliser le mot de passe par défaut
            const password = userData.password || 'password123';
            userCreateData.password_hash = await hashPassword(password);

            const user = await Users.create(userCreateData);
            const userResponse = user.toJSON();
            delete userResponse.password_hash;
            results.success.push(userResponse);
        } catch (error) {
            console.error(`Erreur lors de la création de l'utilisateur ${userData.email}:`, error);
            results.errors.push({
                email: userData.email || "N/A",
                error: error.message || "Erreur lors de la création",
            });
        }
    }

    res.status(201).json({
        message: `${results.success.length} utilisateur(s) créé(s) avec succès`,
        success: results.success,
        errors: results.errors,
        total: users.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
    });
});
