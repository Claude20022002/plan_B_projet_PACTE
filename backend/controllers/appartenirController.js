import { Appartenir, Etudiant, Groupe, Users } from "../models/index.js";

/**
 * Contrôleur pour les appartenances (étudiant-groupe)
 */

// 🔍 Récupérer toutes les appartenances
export const getAllAppartenances = async (req, res) => {
    const appartenances = await Appartenir.findAll({
        include: [
            {
                model: Etudiant,
                as: "etudiant",
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            },
            { model: Groupe, as: "groupe" },
        ],
    });

    res.json(appartenances);
};

// ➕ Ajouter un étudiant à un groupe
export const createAppartenance = async (req, res) => {
    const appartenance = await Appartenir.create(req.body);

    const appartenanceComplete = await Appartenir.findOne({
        where: {
            id_user_etudiant: appartenance.id_user_etudiant,
            id_groupe: appartenance.id_groupe,
        },
        include: [
            {
                model: Etudiant,
                as: "etudiant",
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            },
            { model: Groupe, as: "groupe" },
        ],
    });

    res.status(201).json(appartenanceComplete);
};

// 🗑️ Retirer un étudiant d'un groupe
export const deleteAppartenance = async (req, res) => {
    const appartenance = await Appartenir.findOne({
        where: {
            id_user_etudiant: req.params.id_etudiant,
            id_groupe: req.params.id_groupe,
        },
    });

    if (!appartenance) {
        return res.status(404).json({ message: "Appartenance non trouvée" });
    }

    await appartenance.destroy();

    res.json({ message: "Étudiant retiré du groupe avec succès" });
};

// 🔍 Récupérer le groupe d'un étudiant
export const getGroupeByEtudiant = async (req, res) => {
    const appartenance = await Appartenir.findOne({
        where: { id_user_etudiant: req.params.id_etudiant },
        include: [{ model: Groupe, as: "groupe" }],
    });

    if (!appartenance) {
        return res.status(404).json({
            message: "L'étudiant n'appartient à aucun groupe",
        });
    }

    res.json(appartenance);
};

// 🔍 Récupérer tous les étudiants d'un groupe
export const getEtudiantsByGroupe = async (req, res) => {
    const appartenances = await Appartenir.findAll({
        where: { id_groupe: req.params.id_groupe },
        include: [
            {
                model: Etudiant,
                as: "etudiant",
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            },
        ],
    });

    res.json(appartenances);
};
