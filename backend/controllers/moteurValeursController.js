import { asyncHandler } from "../middleware/asyncHandler.js";
import { valeursEnVigueur } from "../services/moteur/valeurs/lecture.js";
import { abandonnerVersion, annulerVersion, appliquerVersion, creerVersion, ErreurReglages, listerVersions } from "../services/moteur/valeurs/versions.js";
import { corpsErreur } from "../utils/erreurs.js";

/**
 * Réglages du moteur de planification (lot MP-1). Ces routes sont réservées à l'administration, qui
 * écrit au niveau « établissement ». Le niveau « plateforme » (force d'une règle, règles d'un pays)
 * n'a pas de route : il attend la Plateforme (ME-4).
 */

const AUTEUR = "etablissement";
const PORTEES_DE_CIBLE = ["cycle", "niveau", "filiere", "groupe", "matiere", "enseignant", "salle"];

// Les refus détaillés suivent le format commun de l'API : { message, code, violations }
const avecRefus = (travail) =>
    asyncHandler(async (req, res) => {
        try {
            await travail(req, res);
        } catch (err) {
            if (!(err instanceof ErreurReglages)) throw err;
            res.status(err.status).json(corpsErreur(err.status, err.message, { code: err.code, violations: err.violations }));
        }
    });

// 🔍 Valeurs en vigueur pour une cible, à une date
export const getValeursMoteur = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json(corpsErreur(400, "La date s'écrit AAAA-MM-JJ", { code: "DATE_INVALIDE" }));
    }
    const cible = Object.fromEntries(PORTEES_DE_CIBLE.filter((p) => req.query[p] !== undefined).map((p) => [p, req.query[p]]));
    const r = await valeursEnVigueur({ date, cible });
    res.json({
        date: r.date,
        profil: r.profil,
        valeurs: [...r.resultats.values()].map(({ id, force, poids, origine }) => ({ id, valeur: r.valeurs.get(id), force, poids, origine })),
        actives: r.actives,
        alertes: r.alertes,
    });
});

// 🔍 Historique des versions
export const getVersionsMoteur = asyncHandler(async (req, res) => {
    res.json(await listerVersions());
});

// ➕ Préparer un brouillon : aucun effet tant qu'il n'est pas appliqué
export const postVersionMoteur = avecRefus(async (req, res) => {
    const { libelle, date_effet, lignes } = req.body;
    const version = await creerVersion({ libelle, date_effet, lignes, id_auteur: req.user.id_user, auteur: AUTEUR });
    res.status(201).json(version);
});

// ✅ Appliquer un brouillon
export const appliquerVersionMoteur = avecRefus(async (req, res) => {
    res.json(await appliquerVersion(req.params.id, { auteur: AUTEUR }));
});

// 🗑️ Abandonner un brouillon
export const abandonnerVersionMoteur = asyncHandler(async (req, res) => {
    res.json(await abandonnerVersion(req.params.id));
});

// ↩️ Annuler une version appliquée : crée sa version inverse
export const annulerVersionMoteur = asyncHandler(async (req, res) => {
    res.status(201).json(await annulerVersion(req.params.id, { id_auteur: req.user.id_user, auteur: AUTEUR }));
});
