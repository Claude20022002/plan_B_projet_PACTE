import express from "express";
import {
    register,
    login,
    logout,
    logoutAllDevices,
    listSessions,
    revokeSession,
    getMe,
    refreshToken,
    forgotPassword,
    resetPassword,
} from "../controllers/authController.js";
import { authenticateToken, optionalAuth } from "../middleware/authMiddleware.js";
import { issueCsrfToken } from "../middleware/csrfMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// 🔐 POST /api/auth/register - Inscription
router.post("/register", asyncHandler(register));

// 🔐 GET /api/auth/csrf-token - Jeton CSRF SPA
router.get("/csrf-token", issueCsrfToken);

// 🔐 POST /api/auth/login - Connexion
router.post("/login", asyncHandler(login));

// 🔐 POST /api/auth/logout - Déconnexion
router.post("/logout", optionalAuth, asyncHandler(logout));

// 🔐 POST /api/auth/logout-all - Déconnexion de tous les appareils
router.post("/logout-all", authenticateToken, asyncHandler(logoutAllDevices));

// 🔐 GET /api/auth/me - Profil utilisateur connecté
router.get("/me", authenticateToken, asyncHandler(getMe));

// 🔐 POST /api/auth/refresh - Rafraîchir le token
router.post("/refresh", asyncHandler(refreshToken));

// 🔐 GET /api/auth/sessions - Sessions actives
router.get("/sessions", authenticateToken, asyncHandler(listSessions));

// 🔐 DELETE /api/auth/sessions/:sessionId - Révoquer un appareil
router.delete("/sessions/:sessionId", authenticateToken, asyncHandler(revokeSession));

// 🔐 POST /api/auth/forgot-password - Demande de réinitialisation
router.post("/forgot-password", asyncHandler(forgotPassword));

// 🔐 POST /api/auth/reset-password - Réinitialisation avec token
router.post("/reset-password", asyncHandler(resetPassword));

export default router;

