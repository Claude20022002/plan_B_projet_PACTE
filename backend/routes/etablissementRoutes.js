import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { planification } from "../utils/erreursPlanning.js";
import { contexteDe, journaliser } from "../services/journalSecurite.js";
import { enregistrerLogo, identiteComplete, identitePublique, lireLogo, modifierIdentite, retirerLogo, TAILLE_LOGO_MAX } from "../services/etablissement/identite.js";

/**
 * Identité et marque de l'école (D-21, lots ME-1 et ME-11) :
 *   GET    /etablissement        public : nom, nom court, nom du produit, couleurs, version du logo
 *   GET    /etablissement/logo   public : l'image (PNG, JPEG ou WebP)
 *   GET    /etablissement/configuration   administration : tout ce que règle le panneau
 *   PUT    /etablissement        administration : nom, couleurs, expéditeur, modèle d'EDT
 *   PUT    /etablissement/logo   administration : corps = l'image, 512 Ko au plus
 *   DELETE /etablissement/logo   administration
 * Le public n'y lit que ce qu'affiche déjà la page de connexion.
 */
const router = express.Router();
const admin = [authenticateToken, requireAdmin];

router.get("/etablissement", planification(async (req, res) => {
    res.set("Cache-Control", "public, max-age=60").json(await identitePublique());
}));

router.get("/etablissement/logo", planification(async (req, res) => {
    const logo = await lireLogo();
    if (!logo) return res.status(404).json({ message: "Pas de logo", code: "SANS_LOGO" });
    // L'adresse porte ?v=<version> : l'image peut se garder une journée, elle change avec sa version
    res.set({ "Content-Type": logo.type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" });
    return res.send(logo.contenu);
}));

router.get("/etablissement/configuration", ...admin, planification(async (req, res) => {
    res.set("Cache-Control", "no-store").json(await identiteComplete());
}));

router.put("/etablissement", ...admin, planification(async (req, res) => {
    const resultat = await modifierIdentite(req.body ?? {});
    await journaliser(contexteDe(req), { evenement: "identite_ecole_modifiee", acteur: req.user, id_user: req.user.id_user, details: { champs: Object.keys(req.body ?? {}) } });
    res.json(resultat);
}));

router.put(
    "/etablissement/logo",
    ...admin,
    express.raw({ type: ["image/png", "image/jpeg", "image/webp", "application/octet-stream"], limit: TAILLE_LOGO_MAX + 1024 }),
    planification(async (req, res) => {
        const resultat = await enregistrerLogo(req.body);
        await journaliser(contexteDe(req), { evenement: "identite_ecole_modifiee", acteur: req.user, id_user: req.user.id_user, details: { champs: ["logo"] } });
        res.json(resultat);
    })
);

router.delete("/etablissement/logo", ...admin, planification(async (req, res) => {
    const resultat = await retirerLogo();
    await journaliser(contexteDe(req), { evenement: "identite_ecole_modifiee", acteur: req.user, id_user: req.user.id_user, details: { champs: ["logo"], retire: true } });
    res.json(resultat);
}));

export default router;
