import { HistoriqueAffectation, Affectation, Users } from "../models/index.js";

/**
 * Contrôleur pour l'historique des affectations
 */

// 🔍 Récupérer tout l'historique des affectations
export const getAllHistoriques = async (req, res) => {
    const historiques = await HistoriqueAffectation.findAll({
        include: [
            { model: Affectation, as: "affectation" },
            {
                model: Users,
                as: "user_modificateur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        order: [["date_action", "DESC"]],
    });

    res.json(historiques);
};

// 🔍 Récupérer un historique par ID
export const getHistoriqueById = async (req, res) => {
    const historique = await HistoriqueAffectation.findByPk(req.params.id, {
        include: [
            { model: Affectation, as: "affectation" },
            {
                model: Users,
                as: "user_modificateur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!historique) {
        return res.status(404).json({ message: "Historique non trouvé" });
    }

    res.json(historique);
};

// ➕ Créer un historique
export const createHistorique = async (req, res) => {
    const historique = await HistoriqueAffectation.create(req.body);

    const historiqueComplete = await HistoriqueAffectation.findByPk(
        historique.id_historique,
        {
            include: [
                { model: Affectation, as: "affectation" },
                {
                    model: Users,
                    as: "user_modificateur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
        }
    );

    res.status(201).json(historiqueComplete);
};

// 🔍 Récupérer l'historique d'une affectation
export const getHistoriqueByAffectation = async (req, res) => {
    const historiques = await HistoriqueAffectation.findAll({
        where: { id_affectation: req.params.id_affectation },
        include: [
            {
                model: Users,
                as: "user_modificateur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        order: [["date_action", "DESC"]],
    });

    res.json(historiques);
};

// 🔍 Récupérer l'historique par utilisateur
export const getHistoriqueByUser = async (req, res) => {
    const historiques = await HistoriqueAffectation.findAll({
        where: { id_user: req.params.id_user },
        include: [{ model: Affectation, as: "affectation" }],
        order: [["date_action", "DESC"]],
    });

    res.json(historiques);
};

// 🔍 Récupérer l'historique par action
export const getHistoriqueByAction = async (req, res) => {
    const historiques = await HistoriqueAffectation.findAll({
        where: { action: req.params.action },
        include: [
            { model: Affectation, as: "affectation" },
            {
                model: Users,
                as: "user_modificateur",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        order: [["date_action", "DESC"]],
    });

    res.json(historiques);
};
