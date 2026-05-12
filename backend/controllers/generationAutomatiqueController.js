import { Op } from "sequelize";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { genererAffectationsAutomatiques } from "../utils/generateAffectations.js";
import { verifierEtCreerConflits } from "../utils/detectConflicts.js";
import { Affectation } from "../models/index.js";
import { SnapshotService } from "../services/generation/SnapshotService.js";

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
        //les nouveaux paramètres que j'ai ajoutés
        maxSessionHours,
        maxHoursPerDayGroup,
        maxHoursPerDayCourse,
        allowSameCourseTwicePerDay,
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

    const optionsValidation = [
        { key: "maxSessionHours", value: maxSessionHours, min: 1, max: 8 },
        { key: "maxHoursPerDayGroup", value: maxHoursPerDayGroup, min: 1, max: 12 },
        { key: "maxHoursPerDayCourse", value: maxHoursPerDayCourse, min: 1, max: 8 },
    ];

    for (const option of optionsValidation) {
        if (option.value !== undefined) {
            const nombre = Number(option.value);
            if (Number.isNaN(nombre) || nombre < option.min || nombre > option.max) {
                return res.status(400).json({
                    message: "Paramètres invalides",
                    error: `${option.key} doit être compris entre ${option.min} et ${option.max}`,
                });
            }
        }
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
            //les nouveaux paramètres que j'ai ajoutés
            maxSessionHours,
            maxHoursPerDayGroup,
            maxHoursPerDayCourse,
            allowSameCourseTwicePerDay,
            idInstitution: req.tenant?.id_institution,
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

/**
 * GET /api/generation-automatique/snapshots
 * Liste les snapshots de planning disponibles.
 */
export const listerSnapshots = asyncHandler(async (req, res) => {
    const snapshotService = new SnapshotService();
    const snapshots = await snapshotService.listSnapshots(req.query);

    res.json({
        snapshots,
        total: snapshots.length,
    });
});

/**
 * GET /api/generation-automatique/snapshots/:id
 * Recupere le detail d'un snapshot avec ses affectations.
 */
export const getSnapshot = asyncHandler(async (req, res) => {
    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.getSnapshotResult(req.params.id);

    res.json({ snapshot });
});

/**
 * POST /api/generation-automatique/snapshots/:id/activate
 * Active un snapshot et desactive les autres snapshots de la meme periode.
 */
export const activerSnapshot = asyncHandler(async (req, res) => {
    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.activateSnapshot(req.params.id);

    res.json({
        message: "Snapshot active avec succes",
        snapshot,
    });
});

/**
 * POST /api/generation-automatique/snapshots/:id/rollback
 * Alias metier de activate : rollback vers un snapshot precedent.
 */
export const rollbackSnapshot = asyncHandler(async (req, res) => {
    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.activateSnapshot(req.params.id);

    res.json({
        message: "Rollback effectue avec succes",
        snapshot,
    });
});
