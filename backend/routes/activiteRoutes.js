import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { activitesDe } from "../services/activites/activites.js";

/**
 * Espace « Activités » (quiz, jeux et devoirs choisis par les enseignants, regroupés par module) :
 *  - GET /api/activites   étudiant : ce qui est proposé dans ses modules ; enseignant : ses modules
 */
const router = express.Router();
router.use(authenticateToken);

router.get("/", planification(async (req, res) => {
    res.json(await activitesDe(req.user));
}));

export default router;
