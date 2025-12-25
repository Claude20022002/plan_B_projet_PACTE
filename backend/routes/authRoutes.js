import express from "express";
import {
    register,
    login,
    logout,
    getMe,
    refreshToken,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// 🔐 POST /api/auth/register - Inscription
router.post("/register", asyncHandler(register));

// 🔐 POST /api/auth/login - Connexion
router.post("/login", asyncHandler(login));

// 🔐 POST /api/auth/logout - Déconnexion
router.post("/logout", authenticateToken, asyncHandler(logout));

// 🔐 GET /api/auth/me - Profil utilisateur connecté
router.get("/me", authenticateToken, asyncHandler(getMe));

// 🔐 POST /api/auth/refresh - Rafraîchir le token
router.post("/refresh", authenticateToken, asyncHandler(refreshToken));

export default router;

