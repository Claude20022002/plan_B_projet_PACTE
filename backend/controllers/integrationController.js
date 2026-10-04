import crypto from "crypto";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Cours, Filiere } from "../models/index.js";
import { jeuDeCles } from "../utils/jetons.js";

/**
 * Intégration avec les autres services de la plateforme (phase C).
 *
 * - JWKS public : clés de vérification des jetons d'accès (StudyLib, application mobile).
 * - Référentiel : filières et modules lus par la synchronisation de StudyLib. Pas de compte
 *   utilisateur : un jeton de service dédié (INTEGRATION_TOKEN, 32 caractères au moins), en
 *   lecture seule, limité à ces données publiques de la maquette.
 */

/** GET /api/.well-known/jwks.json */
export const jwks = (req, res) => {
    res.set("Cache-Control", "public, max-age=600");
    res.json(jeuDeCles());
};

/** Comparaison en temps constant (empreintes de même longueur, quelle que soit l'entrée). */
const egal = (a, b) => crypto.timingSafeEqual(crypto.createHash("sha256").update(a).digest(), crypto.createHash("sha256").update(b).digest());

export const exigerJetonIntegration = (req, res, next) => {
    const attendu = process.env.INTEGRATION_TOKEN || "";
    if (attendu.length < 32) {
        return res.status(503).json({ message: "Intégration désactivée", error: "INTEGRATION_TOKEN absent ou trop court (32 caractères au moins)" });
    }
    const recu = req.get("X-Integration-Token") || "";
    if (!egal(recu, attendu)) {
        return res.status(401).json({ message: "Jeton d'intégration invalide" });
    }
    next();
};

const numeroSemestre = (semestre) => {
    const n = Number(String(semestre ?? "").replace(/\D/g, ""));
    return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
};

/** GET /api/integration/referentiel — { filieres: [{ code, nom, ecole, cycle }], modules: [{ code, nom, semestre, filiere, ects }] } */
export const referentiel = asyncHandler(async (req, res) => {
    const [filieres, cours] = await Promise.all([
        Filiere.findAll({ attributes: ["id_filiere", "code_filiere", "nom_filiere", "ecole", "cycle"], order: [["code_filiere", "ASC"]] }),
        Cours.findAll({ attributes: ["code_cours", "nom_cours", "semestre", "ects", "id_filiere"], order: [["code_cours", "ASC"]] }),
    ]);
    const codeFiliere = new Map(filieres.map((f) => [f.id_filiere, f.code_filiere]));
    res.set("Cache-Control", "no-store");
    res.json({
        filieres: filieres.map((f) => ({ code: f.code_filiere, nom: f.nom_filiere, ecole: f.ecole ?? null, cycle: f.cycle ?? null })),
        modules: cours
            .filter((c) => codeFiliere.has(c.id_filiere) && numeroSemestre(c.semestre))
            .map((c) => ({ code: c.code_cours, nom: c.nom_cours, semestre: numeroSemestre(c.semestre), filiere: codeFiliere.get(c.id_filiere), ects: c.ects ?? null })),
    });
});
