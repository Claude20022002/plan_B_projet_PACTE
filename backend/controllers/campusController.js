import { Campus, Salle, TrajetCampus } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { paireCampus, lireParametre } from "../services/planning/referentiel.js";

const CAMPUS_FIELDS = ["code", "nom", "adresse", "actif"];

const campusIntrouvable = (res, id) =>
    res.status(404).json({ message: "Campus non trouvé", error: `Aucun campus trouvé avec l'ID ${id}` });

// 🔍 Liste des campus, avec le nombre de salles de chacun
export const getAllCampus = asyncHandler(async (req, res) => {
    const campus = await Campus.findAll({ order: [["code", "ASC"]] });
    const comptes = await Salle.unscoped().count({ group: ["id_campus"] });
    const parCampus = new Map(comptes.map((ligne) => [ligne.id_campus, ligne.count]));
    res.json(campus.map((c) => ({ ...c.toJSON(), nb_salles: parCampus.get(c.id_campus) || 0 })));
});

// ➕ Créer un campus
export const createCampus = asyncHandler(async (req, res) => {
    const data = pick(req.body, CAMPUS_FIELDS);
    data.code = String(data.code).trim().toUpperCase();
    if (await Campus.findOne({ where: { code: data.code } })) {
        return res.status(409).json({ message: "Campus déjà existant", error: `Le code « ${data.code} » est déjà utilisé` });
    }
    const campus = await Campus.create(data);
    res.status(201).json({ message: "Campus créé avec succès", campus });
});

// ✏️ Modifier un campus
export const updateCampus = asyncHandler(async (req, res) => {
    const campus = await Campus.findByPk(req.params.id);
    if (!campus) return campusIntrouvable(res, req.params.id);

    const data = pick(req.body, CAMPUS_FIELDS);
    if (data.code) {
        data.code = String(data.code).trim().toUpperCase();
        const doublon = await Campus.findOne({ where: { code: data.code } });
        if (doublon && doublon.id_campus !== campus.id_campus) {
            return res.status(409).json({ message: "Code déjà utilisé", error: `Le code « ${data.code} » est déjà utilisé` });
        }
    }
    await campus.update(data);
    res.json({ message: "Campus mis à jour avec succès", campus });
});

// 🗑️ Supprimer un campus vide
export const deleteCampus = asyncHandler(async (req, res) => {
    const campus = await Campus.findByPk(req.params.id);
    if (!campus) return campusIntrouvable(res, req.params.id);

    const nbSalles = await Salle.unscoped().count({ where: { id_campus: campus.id_campus } });
    if (nbSalles > 0) {
        return res.status(409).json({
            message: "Campus non vide",
            error: `${nbSalles} salle(s) sont rattachées à ce campus : déplacez-les ou supprimez-les d'abord`,
        });
    }
    await campus.destroy();
    res.json({ message: "Campus supprimé avec succès" });
});

// 🔍 Temps de trajet entre campus (paires renseignées + valeur par défaut)
export const getTrajets = asyncHandler(async (req, res) => {
    const trajets = await TrajetCampus.findAll({
        include: [
            { model: Campus, as: "campus_a", attributes: ["id_campus", "code", "nom"] },
            { model: Campus, as: "campus_b", attributes: ["id_campus", "code", "nom"] },
        ],
        order: [["id_campus_a", "ASC"], ["id_campus_b", "ASC"]],
    });
    res.json({ defaut_minutes: await lireParametre("trajet_inter_campus_defaut_minutes"), trajets });
});

// ✏️ Renseigner le temps de trajet entre deux campus (création ou mise à jour)
export const upsertTrajet = asyncHandler(async (req, res) => {
    const { id_campus_a, id_campus_b, minutes } = req.body;
    if (Number(id_campus_a) === Number(id_campus_b)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Choisissez deux campus différents" });
    }
    const existants = await Campus.count({ where: { id_campus: [id_campus_a, id_campus_b] } });
    if (existants !== 2) {
        return res.status(404).json({ message: "Campus non trouvé", error: "L'un des deux campus n'existe pas" });
    }

    const paire = paireCampus(id_campus_a, id_campus_b);
    const [trajet, cree] = await TrajetCampus.findOrCreate({ where: paire, defaults: { ...paire, minutes } });
    if (!cree) await trajet.update({ minutes });
    res.status(cree ? 201 : 200).json({ message: "Temps de trajet enregistré", trajet });
});
