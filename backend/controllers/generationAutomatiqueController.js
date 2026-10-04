import { asyncHandler } from "../middleware/asyncHandler.js";
import { GenerationSession } from "../models/index.js";
import { SnapshotService } from "../services/generation/SnapshotService.js";
import { arreterGeneration, lancerGeneration, progressionEnMemoire } from "../services/generation/timefold/generation.js";
import { SolveurIndisponible } from "../services/generation/timefold/solveurClient.js";
import { planification } from "../utils/erreursPlanning.js";
import { ErreurMetier } from "../services/planning/enseignements.js";

/**
 * Génération automatique (phase E) : la semaine type est calculée par le service Timefold,
 * puis déployée sur le semestre sous les règles de planification. Chaque génération crée une
 * version (snapshot) que l'on peut réactiver pour revenir en arrière.
 */

/**
 * POST /api/generation-automatique/generer
 * { id_periode, id_filieres?: number[], duree_secondes?: 10–600 } → 202 { session }
 */
export const genererAffectations = planification(async (req, res) => {
    const idPeriode = Number(req.body.id_periode);
    if (!idPeriode) throw new ErreurMetier("Période requise", 400);
    const idFilieres = Array.isArray(req.body.id_filieres) ? [...new Set(req.body.id_filieres.map(Number).filter(Boolean))] : [];
    const duree = Math.min(600, Math.max(10, Number(req.body.duree_secondes) || 60));
    try {
        const session = await lancerGeneration({ id_periode: idPeriode, id_filieres: idFilieres, dureeSecondes: duree, user: req.user });
        res.status(202).json({ message: "Génération lancée", session });
    } catch (error) {
        if (error instanceof SolveurIndisponible) return res.status(503).json({ message: error.message, error: error.message });
        throw error;
    }
});

/** GET /api/generation-automatique/sessions — dernières générations */
export const listerSessions = asyncHandler(async (req, res) => {
    res.json(await GenerationSession.findAll({ order: [["id_generation_session", "DESC"]], limit: 20 }));
});

/** GET /api/generation-automatique/sessions/:id — avancement et rapport */
export const getSession = asyncHandler(async (req, res) => {
    const session = await GenerationSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: "Génération introuvable", error: "Génération introuvable" });
    const progression = session.status === "running" ? progressionEnMemoire(session.id_generation_session) : null;
    res.json({ ...session.toJSON(), ...(progression ?? {}) });
});

/** POST /api/generation-automatique/sessions/:id/arreter — garde la meilleure solution connue */
export const arreterSession = planification(async (req, res) => {
    await arreterGeneration(req.params.id);
    res.json({ message: "Arrêt demandé : la meilleure solution trouvée va être déployée" });
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
 * Réactive une version : ses séances générées reprennent, celles des autres versions pour les
 * mêmes enseignements sont annulées.
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
