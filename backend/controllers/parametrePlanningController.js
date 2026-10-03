import { ParametrePlanning } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { PARAMETRES_PLANNING, estParametreConnu } from "../config/parametresPlanning.js";
import { lireParametres } from "../services/planning/referentiel.js";

// 🔍 Tous les paramètres : valeur en vigueur, valeur par défaut, description
export const getParametresPlanning = asyncHandler(async (req, res) => {
    res.json(await lireParametres());
});

// ✏️ Modifier un paramètre (validation selon son type)
export const updateParametrePlanning = asyncHandler(async (req, res) => {
    const { cle } = req.params;
    if (!estParametreConnu(cle)) {
        return res.status(404).json({ message: "Paramètre inconnu", error: `Aucun paramètre « ${cle} »` });
    }
    const { valeur } = req.body;
    if (!PARAMETRES_PLANNING[cle].valider(valeur)) {
        return res.status(400).json({ message: "Erreur de validation", error: `Valeur invalide pour « ${cle} »` });
    }

    await ParametrePlanning.upsert({ cle, valeur });
    res.json({ message: "Paramètre enregistré", cle, valeur });
});

// ↩️ Revenir à la valeur par défaut
export const resetParametrePlanning = asyncHandler(async (req, res) => {
    const { cle } = req.params;
    if (!estParametreConnu(cle)) {
        return res.status(404).json({ message: "Paramètre inconnu", error: `Aucun paramètre « ${cle} »` });
    }
    await ParametrePlanning.destroy({ where: { cle } });
    res.json({ message: "Valeur par défaut rétablie", cle, valeur: PARAMETRES_PLANNING[cle].defaut });
});
