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

    // Filtres optionnels — uniquement les colonnes de la table Etudiants
    const where = {};
    if (req.query.niveau) {
        where.niveau = req.query.niveau;
    }

    // Filtre par groupe : via l'association Appartenir (not a direct column)
    const appartienIncludes = [];
    if (req.query.id_groupe) {
        appartienIncludes.push({
            model: Groupe,
            as: "groupe",
            where: { id_groupe: req.query.id_groupe },
            required: true,
            include: [{ model: Filiere, as: "filiere" }],
        });
    } else {
        appartienIncludes.push({
            model: Groupe,
            as: "groupe",
            required: false,
            include: [{ model: Filiere, as: "filiere" }],
        });
    }

    const { count, rows: etudiantsRaw } = await Etudiant.findAndCountAll({
        where,
        distinct: true,
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Appartenir,
                as: "appartenance",
                required: false,
                include: appartienIncludes,
            },
        ],
        limit,
        offset,
        order: [["numero_etudiant", "ASC"]],
    });

    // Aplatir groupe pour correspondre à la structure attendue par le frontend
    const etudiants = etudiantsRaw.map((e) => {
        const data = e.toJSON();
        data.groupe    = data.appartenance?.groupe || null;
        data.id_groupe = data.appartenance?.groupe?.id_groupe || null;
        return data;
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

    // Séparer id_groupe (table Appartenir) des champs Etudiant
    const { id_groupe, ...etudiantData } = req.body;

    const etudiant = await Etudiant.create(etudiantData);

    // Créer le lien Appartenir si un groupe est fourni
    if (id_groupe) {
        await Appartenir.findOrCreate({
            where: { id_user_etudiant: etudiant.id_user, id_groupe },
            defaults: { id_user_etudiant: etudiant.id_user, id_groupe },
        });
    }

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Appartenir,
                as: "appartenance",
                required: false,
                include: [{ model: Groupe, as: "groupe" }],
            },
        ],
    });

    const result = etudiantAvecUser.toJSON();
    result.groupe    = result.appartenance?.groupe || null;
    result.id_groupe = result.appartenance?.groupe?.id_groupe || null;

    res.status(201).json({
        message: "Étudiant créé avec succès",
        etudiant: result,
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

    // Séparer id_groupe (table Appartenir) des champs Etudiant
    const { id_groupe, ...updateData } = req.body;

    await etudiant.update(updateData);

    // Mettre à jour le groupe si fourni
    if (id_groupe !== undefined) {
        // Supprimer l'ancien lien puis créer le nouveau
        await Appartenir.destroy({ where: { id_user_etudiant: etudiant.id_user } });
        if (id_groupe) {
            await Appartenir.findOrCreate({
                where: { id_user_etudiant: etudiant.id_user, id_groupe },
                defaults: { id_user_etudiant: etudiant.id_user, id_groupe },
            });
        }
    }

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Appartenir,
                as: "appartenance",
                required: false,
                include: [{ model: Groupe, as: "groupe" }],
            },
        ],
    });

    const result = etudiantAvecUser.toJSON();
    result.groupe    = result.appartenance?.groupe || null;
    result.id_groupe = result.appartenance?.groupe?.id_groupe || null;

    res.json({
        message: "Étudiant mis à jour avec succès",
        etudiant: result,
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

            // Créer l'étudiant (sans id_groupe — champ Appartenir)
            const etudiant = await Etudiant.create({
                id_user: user.id_user,
                numero_etudiant: etudiantData.numero_etudiant,
                niveau: etudiantData.niveau,
                date_inscription: etudiantData.date_inscription || new Date(),
            });

            // Créer le lien groupe si fourni
            if (etudiantData.id_groupe) {
                await Appartenir.findOrCreate({
                    where: { id_user_etudiant: etudiant.id_user, id_groupe: etudiantData.id_groupe },
                    defaults: { id_user_etudiant: etudiant.id_user, id_groupe: etudiantData.id_groupe },
                });
            }

            const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
                include: [{ model: Users, as: "user", attributes: { exclude: ["password_hash"] } }],
            });

            results.success.push(etudiantAvecUser);
        } catch (error) {
            console.error(`Erreur lors de la création de l'étudiant ${etudiantData.email}:`, error);
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

// 🔧 Réparer les liens groupe manquants (Admin)
// Infer le groupe depuis le pattern du numero_etudiant "ETU-{nom_groupe}-{n}"
export const syncGroupesEtudiants = asyncHandler(async (req, res) => {
    const etudiants = await Etudiant.findAll({
        include: [{ model: Appartenir, as: "appartenance", required: false }],
    });

    const groupes = await Groupe.findAll();
    const groupesByNom = {};
    groupes.forEach((g) => { groupesByNom[g.nom_groupe] = g; });

    let created = 0;
    let skipped = 0;

    for (const etu of etudiants) {
        // Si Appartenir existe déjà, on skip
        if (etu.appartenance) { skipped++; continue; }

        // Pattern: "ETU-IIIA-3A-001" → groupe = "IIIA-3A"
        const match = etu.numero_etudiant?.match(/^ETU-(.+)-\d+$/);
        if (!match) { skipped++; continue; }

        const nomGroupe = match[1];
        const groupe = groupesByNom[nomGroupe];
        if (!groupe) { skipped++; continue; }

        await Appartenir.findOrCreate({
            where: { id_user_etudiant: etu.id_user, id_groupe: groupe.id_groupe },
            defaults: { id_user_etudiant: etu.id_user, id_groupe: groupe.id_groupe },
        });
        created++;
    }

    res.json({
        message: `Synchronisation terminée : ${created} lien(s) créé(s), ${skipped} ignoré(s)`,
        created,
        skipped,
    });
});
