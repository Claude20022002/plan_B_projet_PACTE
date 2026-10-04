import { asyncHandler } from "../middleware/asyncHandler.js";
import { JetonPushInvalide, enregistrerJeton, supprimerJeton } from "../services/push.js";

/** POST /api/push-tokens { token, plateforme } — l'appareil s'inscrit pour le compte connecté. */
export const enregistrer = asyncHandler(async (req, res) => {
    try {
        await enregistrerJeton(req.user.id_user, req.body?.token, req.body?.plateforme ?? "android");
        res.status(201).json({ message: "Appareil inscrit aux notifications" });
    } catch (error) {
        if (error instanceof JetonPushInvalide) return res.status(400).json({ message: error.message, error: error.message });
        throw error;
    }
});

/** DELETE /api/push-tokens/:token — désinscription (déconnexion de l'application). */
export const supprimer = asyncHandler(async (req, res) => {
    await supprimerJeton(req.user.id_user, req.params.token);
    res.status(204).end();
});
