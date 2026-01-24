import { Op } from "sequelize";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { genererAffectationsAutomatiques } from "../utils/generateAffectations.js";
import { verifierEtCreerConflits } from "../utils/detectConflicts.js";
import { Affectation } from "../models/index.js";

/**
 * POST /api/generation-automatique/generer
 * Génère automatiquement les affectations pour un semestre
 */
export const genererAffectations = asyncHandler(async (req, res) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id_user) {
        return res.status(401).json({
            message: "Authentification requise",
            error: "Vous devez être connecté pour accéder à cette ressource",
        });
    }

    const {
        dateDebut,
        dateFin,
        coursIds = [],
        groupeIds = [],
        ecraserAffectations = false,
    } = req.body;

    const idUserAdmin = req.user.id_user;

    // Validation
    if (!dateDebut || !dateFin) {
        return res.status(400).json({
            message: "Paramètres manquants",
            error: "Les dates de début et de fin sont requises",
        });
    }

    // Validation des dates
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (debut >= fin) {
        return res.status(400).json({
            message: "Dates invalides",
            error: "La date de début doit être antérieure à la date de fin",
        });
    }

    try {
        // Générer les affectations
        const resultat = await genererAffectationsAutomatiques({
            dateDebut,
            dateFin,
            coursIds,
            groupeIds,
            idUserAdmin,
            ecraserAffectations,
        });

        // Vérifier les conflits pour les nouvelles affectations
        if (resultat.affectationsCreees.length > 0) {
            const nouvellesAffectations = await Affectation.findAll({
                where: {
                    id_affectation: {
                        [Op.in]: resultat.affectationsCreees.map((a) => a.id),
                    },
                },
            });

            let conflitsTotal = 0;
            for (const affectation of nouvellesAffectations) {
                const conflits = await verifierEtCreerConflits(affectation);
                conflitsTotal += conflits.length;
            }
            resultat.statistiques.conflitsDetectes = conflitsTotal;
        }

        res.status(200).json({
            message: "Génération automatique terminée",
            resultat,
        });
    } catch (error) {
        console.error("Erreur lors de la génération automatique:", error);
        res.status(500).json({
            message: "Erreur lors de la génération automatique",
            error: error.message,
        });
    }
});
