import { Conflit, ConflitAffectation, Affectation } from "../models/index.js";

/**
 * Contrôleur pour les conflits
 */

// 🔍 Récupérer tous les conflits
export const getAllConflits = async (req, res) => {
    const conflits = await Conflit.findAll({
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.json(conflits);
};

// 🔍 Récupérer un conflit par ID
export const getConflitById = async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    if (!conflit) {
        return res.status(404).json({ message: "Conflit non trouvé" });
    }

    res.json(conflit);
};

// ➕ Créer un conflit
export const createConflit = async (req, res) => {
    const conflit = await Conflit.create(req.body);

    const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.status(201).json(conflitComplete);
};

// ✏️ Mettre à jour un conflit
export const updateConflit = async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id);

    if (!conflit) {
        return res.status(404).json({ message: "Conflit non trouvé" });
    }

    await conflit.update(req.body);

    const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.json(conflitComplete);
};

// 🗑️ Supprimer un conflit
export const deleteConflit = async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id);

    if (!conflit) {
        return res.status(404).json({ message: "Conflit non trouvé" });
    }

    await conflit.destroy();

    res.json({ message: "Conflit supprimé avec succès" });
};

// ➕ Associer une affectation à un conflit
export const associerAffectationAuConflit = async (req, res) => {
    const conflitAffectation = await ConflitAffectation.create({
        id_conflit: req.params.id_conflit,
        id_affectation: req.params.id_affectation,
    });

    res.status(201).json(conflitAffectation);
};

// 🗑️ Dissocier une affectation d'un conflit
export const dissocierAffectationDuConflit = async (req, res) => {
    const conflitAffectation = await ConflitAffectation.findOne({
        where: {
            id_conflit: req.params.id_conflit,
            id_affectation: req.params.id_affectation,
        },
    });

    if (!conflitAffectation) {
        return res.status(404).json({ message: "Association non trouvée" });
    }

    await conflitAffectation.destroy();

    res.json({ message: "Association supprimée avec succès" });
};

// 🔍 Récupérer les conflits non résolus
export const getConflitsNonResolus = async (req, res) => {
    const conflits = await Conflit.findAll({
        where: { resolu: false },
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.json(conflits);
};
