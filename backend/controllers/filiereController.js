import { Campus, Filiere, ResponsableFiliere, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Contrôleur pour les filières
 */

const FILIERE_FIELDS = [
    "code_filiere",
    "nom_filiere",
    "description",
    "regime",
    "ecole",
    "cycle",
    "intitule_cycle",
    "premiere_annee_cycle",
    "id_campus_prefere",
    "partenaire",
    "annees_a_hestim",
];

const INCLUDE_CAMPUS = [{ model: Campus, as: "campus_prefere", attributes: ["id_campus", "code", "nom"] }];

const campusInconnu = async (data) =>
    data.id_campus_prefere !== undefined && data.id_campus_prefere !== null && !(await Campus.findByPk(data.id_campus_prefere));

// 🔍 Récupérer toutes les filières (avec pagination)
export const getAllFilieres = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = {};
    if (req.query.ecole) where.ecole = req.query.ecole;

    const { count, rows: filieres } = await Filiere.findAndCountAll({
        where,
        include: INCLUDE_CAMPUS,
        limit,
        offset,
        order: [["code_filiere", "ASC"]],
    });

    res.json(createPaginationResponse(filieres, count, page, limit));
});

// 🔍 Récupérer une filière par ID
export const getFiliereById = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id }, include: INCLUDE_CAMPUS });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    res.json(filiere);
});

// ➕ Créer une filière
export const createFiliere = asyncHandler(async (req, res) => {
    const data = pick(req.body, FILIERE_FIELDS);

    if (await Filiere.findOne({ where: { code_filiere: data.code_filiere } })) {
        return res.status(409).json({
            message: "Code filière déjà utilisé",
            error: `Une filière avec le code "${data.code_filiere}" existe déjà`,
        });
    }
    if (await campusInconnu(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus préféré inconnu" });
    }

    const { id_filiere } = await Filiere.create(data);
    const filiere = await Filiere.findByPk(id_filiere, { include: INCLUDE_CAMPUS });

    res.status(201).json({
        message: "Filière créée avec succès",
        filiere,
    });
});

// ✏️ Mettre à jour une filière
export const updateFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id } });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    const data = pick(req.body, FILIERE_FIELDS);

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (data.code_filiere && data.code_filiere !== filiere.code_filiere) {
        if (await Filiere.findOne({ where: { code_filiere: data.code_filiere } })) {
            return res.status(409).json({
                message: "Code filière déjà utilisé",
                error: `Une filière avec le code "${data.code_filiere}" existe déjà`,
            });
        }
    }
    if (await campusInconnu(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus préféré inconnu" });
    }

    await filiere.update(data);
    await filiere.reload({ include: INCLUDE_CAMPUS });

    res.json({
        message: "Filière mise à jour avec succès",
        filiere,
    });
});

// 👤 Responsables d'une filière
export const getResponsables = asyncHandler(async (req, res) => {
    const responsables = await ResponsableFiliere.findAll({
        where: { id_filiere: req.params.id },
        include: [{ model: Users, as: "user", attributes: ["id_user", "nom", "prenom", "email"] }],
    });
    res.json(responsables.map((r) => r.user));
});

// ➕ Nommer un enseignant responsable d'une filière (administration)
export const ajouterResponsable = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);
    if (!filiere) {
        return res.status(404).json({ message: "Filière non trouvée", error: `Aucune filière avec l'ID ${req.params.id}` });
    }
    const user = await Users.findByPk(req.body.id_user);
    if (!user || user.role !== "enseignant") {
        return res.status(400).json({ message: "Erreur de validation", error: "Le responsable doit être un enseignant" });
    }
    const [, cree] = await ResponsableFiliere.findOrCreate({ where: { id_user: user.id_user, id_filiere: filiere.id_filiere } });
    res.status(cree ? 201 : 200).json({ message: `${user.prenom} ${user.nom} est responsable de ${filiere.code_filiere}` });
});

// 🗑️ Retirer un responsable
export const retirerResponsable = asyncHandler(async (req, res) => {
    const supprimes = await ResponsableFiliere.destroy({ where: { id_filiere: req.params.id, id_user: req.params.idUser } });
    if (!supprimes) return res.status(404).json({ message: "Responsable non trouvé", error: "Cet enseignant n'est pas responsable de la filière" });
    res.json({ message: "Responsable retiré" });
});

// 🗑️ Supprimer une filière
export const deleteFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id } });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    await filiere.destroy();

    res.json({
        message: "Filière supprimée avec succès",
    });
});
