import { Disponibilite, Users, Creneau } from "../models/index.js";

/**
 * Contrôleur pour les disponibilités
 */

// 🔍 Récupérer toutes les disponibilités
export const getAllDisponibilites = async (req, res) => {
    const disponibilites = await Disponibilite.findAll({
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Creneau, as: "creneau" },
        ],
    });

    res.json(disponibilites);
};

// 🔍 Récupérer une disponibilité par ID
export const getDisponibiliteById = async (req, res) => {
    const disponibilite = await Disponibilite.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Creneau, as: "creneau" },
        ],
    });

    if (!disponibilite) {
        return res.status(404).json({ message: "Disponibilité non trouvée" });
    }

    res.json(disponibilite);
};

// ➕ Créer une disponibilité
export const createDisponibilite = async (req, res) => {
    const disponibilite = await Disponibilite.create(req.body);

    const disponibiliteComplete = await Disponibilite.findByPk(
        disponibilite.id_disponibilite,
        {
            include: [
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Creneau, as: "creneau" },
            ],
        }
    );

    res.status(201).json(disponibiliteComplete);
};

// ✏️ Mettre à jour une disponibilité
export const updateDisponibilite = async (req, res) => {
    const disponibilite = await Disponibilite.findByPk(req.params.id);

    if (!disponibilite) {
        return res.status(404).json({ message: "Disponibilité non trouvée" });
    }

    await disponibilite.update(req.body);

    const disponibiliteComplete = await Disponibilite.findByPk(
        disponibilite.id_disponibilite,
        {
            include: [
                {
                    model: Users,
                    as: "enseignant",
                    attributes: { exclude: ["password_hash"] },
                },
                { model: Creneau, as: "creneau" },
            ],
        }
    );

    res.json(disponibiliteComplete);
};

// 🗑️ Supprimer une disponibilité
export const deleteDisponibilite = async (req, res) => {
    const disponibilite = await Disponibilite.findByPk(req.params.id);

    if (!disponibilite) {
        return res.status(404).json({ message: "Disponibilité non trouvée" });
    }

    await disponibilite.destroy();

    res.json({ message: "Disponibilité supprimée avec succès" });
};

// 🔍 Récupérer les disponibilités d'un enseignant
export const getDisponibilitesByEnseignant = async (req, res) => {
    const disponibilites = await Disponibilite.findAll({
        where: { id_user_enseignant: req.params.id_enseignant },
        include: [{ model: Creneau, as: "creneau" }],
    });

    res.json(disponibilites);
};

// 🔍 Récupérer les indisponibilités d'un enseignant
export const getIndisponibilitesByEnseignant = async (req, res) => {
    const indisponibilites = await Disponibilite.findAll({
        where: {
            id_user_enseignant: req.params.id_enseignant,
            disponible: false,
        },
        include: [{ model: Creneau, as: "creneau" }],
    });

    res.json(indisponibilites);
};
