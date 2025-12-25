import {
    Affectation,
    Cours,
    Groupe,
    Salle,
    Creneau,
    Users,
} from "../models/index.js";

/**
 * Contrôleur pour les affectations
 */

// 🔍 Récupérer toutes les affectations
export const getAllAffectations = async (req, res) => {
    const affectations = await Affectation.findAll({
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            {
                model: Users,
                as: "admin_createur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json(affectations);
};

// 🔍 Récupérer une affectation par ID
export const getAffectationById = async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id, {
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            {
                model: Users,
                as: "admin_createur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    res.json(affectation);
};

// ➕ Créer une affectation
export const createAffectation = async (req, res) => {
    const affectation = await Affectation.create(req.body);

    const affectationComplete = await Affectation.findByPk(
        affectation.id_affectation,
        {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.status(201).json(affectationComplete);
};

// ✏️ Mettre à jour une affectation
export const updateAffectation = async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id);

    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    await affectation.update(req.body);

    const affectationComplete = await Affectation.findByPk(
        affectation.id_affectation,
        {
            include: [
                { model: Cours, as: "cours" },
                { model: Groupe, as: "groupe" },
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.json(affectationComplete);
};

// 🗑️ Supprimer une affectation
export const deleteAffectation = async (req, res) => {
    const affectation = await Affectation.findByPk(req.params.id);

    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    await affectation.destroy();

    res.json({ message: "Affectation supprimée avec succès" });
};

// 🔍 Récupérer les affectations par enseignant
export const getAffectationsByEnseignant = async (req, res) => {
    const affectations = await Affectation.findAll({
        where: { id_user_enseignant: req.params.id_enseignant },
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
    });

    res.json(affectations);
};

// 🔍 Récupérer les affectations par groupe
export const getAffectationsByGroupe = async (req, res) => {
    const affectations = await Affectation.findAll({
        where: { id_groupe: req.params.id_groupe },
        include: [
            { model: Cours, as: "cours" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
    });

    res.json(affectations);
};
