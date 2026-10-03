import sequelize from "../config/db.js";
import { Cours, CoursComposante, Filiere, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";
import { normaliserTypeComposante, periodeDuSemestre } from "../config/referentiel.js";

/**
 * Contrôleur pour les cours (modules de la maquette). Chaque module porte ses composantes
 * (CM, TD, TP, Projet) ; à la création, une composante est déduite de type_cours et
 * volume_horaire si aucune n'est fournie.
 */

const COURS_FIELDS = [
    "code_cours",
    "nom_cours",
    "niveau",
    "volume_horaire",
    "type_cours",
    "semestre",
    "coefficient",
    "id_filiere",
    "ects",
    "id_responsable",
];

const INCLUDES = [
    { model: Filiere, as: "filiere" },
    { model: CoursComposante, as: "composantes" },
    { model: Users, as: "responsable", attributes: ["id_user", "nom", "prenom"] },
];

const ORDRE_COMPOSANTES = [[{ model: CoursComposante, as: "composantes" }, "type", "ASC"]];

const SEMESTRES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);

const responsableInvalide = async (data) => {
    if (data.id_responsable === undefined || data.id_responsable === null) return false;
    const user = await Users.findByPk(data.id_responsable);
    return !user || user.role !== "enseignant";
};

// 🔍 Récupérer tous les cours (avec pagination)
export const getAllCours = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    for (const filtre of ["id_filiere", "niveau", "semestre"]) {
        if (req.query[filtre]) where[filtre] = req.query[filtre];
    }
    // ?periode=S1 : modules des semestres impairs (S1, S3… S9) ; S2 : semestres pairs
    if (req.query.periode && !req.query.semestre) {
        where.semestre = SEMESTRES.filter((s) => periodeDuSemestre(s) === req.query.periode);
    }

    const { count, rows: cours } = await Cours.findAndCountAll({
        where,
        include: INCLUDES,
        distinct: true,
        limit,
        offset,
        order: [["code_cours", "ASC"], ...ORDRE_COMPOSANTES],
    });

    res.json(createPaginationResponse(cours, count, page, limit));
});

// 🔍 Récupérer un cours par ID
export const getCoursById = asyncHandler(async (req, res) => {
    const cours = await Cours.findOne({
        where: { id_cours: req.params.id },
        include: INCLUDES,
        order: ORDRE_COMPOSANTES,
    });

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(cours);
});

// ➕ Créer un cours
export const createCours = asyncHandler(async (req, res) => {
    const data = pick(req.body, COURS_FIELDS);

    if (await Cours.findOne({ where: { code_cours: data.code_cours } })) {
        return res.status(409).json({
            message: "Code cours déjà utilisé",
            error: `Un cours avec le code "${data.code_cours}" existe déjà`,
        });
    }
    if (await responsableInvalide(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Le responsable doit être un enseignant" });
    }

    const id = await sequelize.transaction(async (transaction) => {
        const cours = await Cours.create(data, { transaction });
        // Composante initiale déduite de l'ancien couple type_cours / volume_horaire
        await CoursComposante.create(
            {
                id_cours: cours.id_cours,
                type: normaliserTypeComposante(data.type_cours),
                volume_heures: data.volume_horaire,
            },
            { transaction }
        );
        return cours.id_cours;
    });

    const coursAvecComposantes = await Cours.findByPk(id, { include: INCLUDES, order: ORDRE_COMPOSANTES });

    res.status(201).json({
        message: "Cours créé avec succès",
        cours: coursAvecComposantes,
    });
});

// ✏️ Mettre à jour un cours
export const updateCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findOne({ where: { id_cours: req.params.id } });

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    const data = pick(req.body, COURS_FIELDS);

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (data.code_cours && data.code_cours !== cours.code_cours) {
        if (await Cours.findOne({ where: { code_cours: data.code_cours } })) {
            return res.status(409).json({
                message: "Code cours déjà utilisé",
                error: `Un cours avec le code "${data.code_cours}" existe déjà`,
            });
        }
    }
    if (await responsableInvalide(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Le responsable doit être un enseignant" });
    }

    await cours.update(data);

    const coursAvecComposantes = await Cours.findByPk(cours.id_cours, { include: INCLUDES, order: ORDRE_COMPOSANTES });

    res.json({
        message: "Cours mis à jour avec succès",
        cours: coursAvecComposantes,
    });
});

// 🗑️ Supprimer un cours
export const deleteCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findOne({ where: { id_cours: req.params.id } });

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    await cours.destroy();

    res.json({
        message: "Cours supprimé avec succès",
    });
});
