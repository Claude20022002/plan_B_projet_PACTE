import { Affectation, Cours, CoursComposante, Enseignement } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Composantes d'un module (CM, TD, TP, Projet) : volume, groupe visé, salle requise,
 * créneaux par séance, modalité et rythme dans le semestre.
 */

const COMPOSANTE_FIELDS = [
    "type",
    "volume_heures",
    "type_salle_requis",
    "equipements_requis",
    "niveau_groupe",
    "creneaux_par_seance",
    "modalite",
    "mention",
    "semaine_debut",
    "semaine_fin",
    "seances_par_semaine",
];

const introuvable = (res, id) =>
    res.status(404).json({ message: "Composante non trouvée", error: `Aucune composante avec l'ID ${id}` });

/** Cohérence du rythme et de la modalité. Retourne un message d'erreur ou null. */
const verifierComposante = (data) => {
    if (data.semaine_debut && data.semaine_fin && Number(data.semaine_fin) < Number(data.semaine_debut)) {
        return "La semaine de fin doit suivre la semaine de début";
    }
    if (data.modalite === "distanciel") {
        // Pas de salle pour une séance à distance
        data.type_salle_requis = null;
        data.equipements_requis = [];
    }
    return null;
};

// 🔍 Composantes d'un module
export const getComposantesDuCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findByPk(req.params.idCours);
    if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé", error: `Aucun cours avec l'ID ${req.params.idCours}` });
    }
    const composantes = await CoursComposante.findAll({ where: { id_cours: cours.id_cours }, order: [["type", "ASC"]] });
    res.json(composantes);
});

// ➕ Ajouter une composante à un module (une seule par type)
export const createComposante = asyncHandler(async (req, res) => {
    const cours = await Cours.findByPk(req.params.idCours);
    if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé", error: `Aucun cours avec l'ID ${req.params.idCours}` });
    }
    const data = { ...pick(req.body, COMPOSANTE_FIELDS), id_cours: cours.id_cours };
    const probleme = verifierComposante(data);
    if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });

    if (await CoursComposante.findOne({ where: { id_cours: cours.id_cours, type: data.type } })) {
        return res.status(409).json({
            message: "Composante déjà existante",
            error: `Le module ${cours.code_cours} a déjà une composante ${data.type}`,
        });
    }

    const composante = await CoursComposante.create(data);
    res.status(201).json({ message: "Composante ajoutée", composante });
});

// ✏️ Modifier une composante
export const updateComposante = asyncHandler(async (req, res) => {
    const composante = await CoursComposante.findByPk(req.params.id);
    if (!composante) return introuvable(res, req.params.id);

    const data = pick(req.body, COMPOSANTE_FIELDS);
    const probleme = verifierComposante({ ...composante.toJSON(), ...data });
    if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });
    if (data.modalite === "distanciel") {
        data.type_salle_requis = null;
        data.equipements_requis = [];
    }

    if (data.type && data.type !== composante.type) {
        const doublon = await CoursComposante.findOne({ where: { id_cours: composante.id_cours, type: data.type } });
        if (doublon) {
            return res.status(409).json({ message: "Composante déjà existante", error: `Ce module a déjà une composante ${data.type}` });
        }
    }

    await composante.update(data);
    res.json({ message: "Composante mise à jour", composante });
});

// 🗑️ Supprimer une composante (refusé si des séances sont déjà planifiées sur elle)
export const deleteComposante = asyncHandler(async (req, res) => {
    const composante = await CoursComposante.findByPk(req.params.id);
    if (!composante) return introuvable(res, req.params.id);

    const enseignements = await Enseignement.findAll({ where: { id_composante: composante.id_composante }, attributes: ["id_enseignement"] });
    const seances = enseignements.length
        ? await Affectation.count({ where: { id_enseignement: enseignements.map((e) => e.id_enseignement) } })
        : 0;
    if (seances > 0) {
        return res.status(409).json({
            message: "Composante utilisée",
            error: `${seances} séance(s) sont déjà planifiées sur cette composante`,
        });
    }

    await composante.destroy();
    res.json({ message: "Composante supprimée" });
});
