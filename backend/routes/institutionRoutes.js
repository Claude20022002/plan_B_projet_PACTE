import express from "express";
import {
    getCurrentInstitution,
    getMyInstitutions,
    listMembers,
    removeMember,
    updateMember,
} from "../controllers/institutionController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/mine", asyncHandler(getMyInstitutions));
router.get("/current", asyncHandler(getCurrentInstitution));
router.get("/current/members", requireAdmin, asyncHandler(listMembers));
router.patch("/current/members/:id", requireAdmin, asyncHandler(updateMember));
router.delete("/current/members/:id", requireAdmin, asyncHandler(removeMember));

export default router;
