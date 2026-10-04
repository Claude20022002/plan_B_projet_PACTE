import express from "express";
import { authenticateToken } from "../middleware/index.js";
import { enregistrer, supprimer } from "../controllers/pushTokenController.js";

/** Jetons push de l'application mobile (phase D3) : chacun ne gère que les siens. */
const router = express.Router();

router.post("/", authenticateToken, enregistrer);
router.delete("/:token", authenticateToken, supprimer);

export default router;
