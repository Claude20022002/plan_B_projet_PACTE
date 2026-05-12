import { Groupe, Filiere } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { tenantWhere, withTenant } from "../utils/tenantHelper.js";

/**
 * Contrôleur pour les groupes
 */

// 🔍 Récupérer tous les groupes (avec pagination)
export const getAllGroupes = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = tenantWhere(req);
    if (req.query.id_filiere) {
        where.id_filiere = req.query.id_filiere;
    }
    if (req.query.niveau) {
        where.niveau = req.query.niveau;
    }
    if (req.query.annee_scolaire) {
        where.annee_scolaire = req.query.annee_scolaire;
    }

    const { count, rows: groupes } = await Groupe.findAndCountAll({
        where,
        include: [{ model: Filiere, as: "filiere" }],
        limit,
        offset,
        order: [["nom_groupe", "ASC"]],
    });

    res.json(createPaginationResponse(groupes, count, page, limit));
});

// 🔍 Récupérer un groupe par ID
export const getGroupeById = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({
        where: tenantWhere(req, { id_groupe: req.params.id }),
        include: [{ model: Filiere, as: "filiere" }],
    });

    if (!groupe) {
        return res.status(404).json({
            message: "Groupe non trouvé",
            error: `Aucun groupe trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(groupe);
});

// ➕ Créer un groupe
export const createGroupe = asyncHandler(async (req, res) => {
    // Vérifier si le nom de groupe existe déjà pour cette année
    if (req.body.nom_groupe && req.body.annee_scolaire) {
        const existingGroupe = await Groupe.findOne({
            where: {
                nom_groupe: req.body.nom_groupe,
                annee_scolaire: req.body.annee_scolaire,
                id_institution: req.tenant.id_institution,
            },
        });
        if (existingGroupe) {
            return res.status(409).json({
                message: "Groupe déjà existant",
                error: `Un groupe avec le nom "${req.body.nom_groupe}" existe déjà pour l'année ${req.body.annee_scolaire}`,
            });
        }
    }

    const groupe = await Groupe.create(withTenant(req, req.body));

    const groupeAvecFiliere = await Groupe.findByPk(groupe.id_groupe, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.status(201).json({
        message: "Groupe créé avec succès",
        groupe: groupeAvecFiliere,
    });
});

// ✏️ Mettre à jour un groupe
export const updateGroupe = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({ where: tenantWhere(req, { id_groupe: req.params.id }) });

    if (!groupe) {
        return res.status(404).json({
            message: "Groupe non trouvé",
            error: `Aucun groupe trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Vérifier l'unicité si nom ou année changent
    if (
        (req.body.nom_groupe || req.body.annee_scolaire) &&
        (req.body.nom_groupe !== groupe.nom_groupe ||
            req.body.annee_scolaire !== groupe.annee_scolaire)
    ) {
        const existingGroupe = await Groupe.findOne({
            where: {
                nom_groupe: req.body.nom_groupe || groupe.nom_groupe,
                annee_scolaire: req.body.annee_scolaire || groupe.annee_scolaire,
                id_institution: req.tenant.id_institution,
            },
        });
        if (existingGroupe && existingGroupe.id_groupe !== groupe.id_groupe) {
            return res.status(409).json({
                message: "Groupe déjà existant",
                error: `Un groupe avec ces caractéristiques existe déjà`,
            });
        }
    }

    await groupe.update(withTenant(req, req.body));

    const groupeAvecFiliere = await Groupe.findByPk(groupe.id_groupe, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json({
        message: "Groupe mis à jour avec succès",
        groupe: groupeAvecFiliere,
    });
});

// 🗑️ Supprimer un groupe
export const deleteGroupe = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({ where: tenantWhere(req, { id_groupe: req.params.id }) });

    if (!groupe) {
        return res.status(404).json({
            message: "Groupe non trouvé",
            error: `Aucun groupe trouvé avec l'ID ${req.params.id}`,
        });
    }

    await groupe.destroy();

    res.json({
        message: "Groupe supprimé avec succès",
    });
});
