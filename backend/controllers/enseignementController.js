import { Affectation, Cours, CoursComposante, Enseignement, EnseignementGroupe, Filiere, Groupe, Periode } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import sequelize from "../config/db.js";
import {
    ErreurMetier,
    effectifEnseignement,
    fusionnerEnseignements,
    genererEnseignements,
    scinderEnseignement,
} from "../services/planning/enseignements.js";
import { contientParentEtEnfant } from "../services/planning/groupes.js";

/**
 * Enseignements : ce qui sera réellement planifié (composante × groupes, sur une période).
 * Générés depuis la maquette, puis mutualisés ou découpés par le responsable.
 */

const INCLUDES = [
    {
        model: CoursComposante,
        as: "composante",
        include: [{ model: Cours, as: "cours", include: [{ model: Filiere, as: "filiere", attributes: ["id_filiere", "code_filiere", "nom_filiere"] }] }],
    },
    { model: Groupe, as: "groupes", attributes: ["id_groupe", "nom_groupe", "type_groupe", "effectif", "id_filiere", "annee"], through: { attributes: [] } },
    { model: Periode, as: "periode", attributes: ["id_periode", "code", "id_annee"] },
];

const serialiser = (enseignement, seancesParId = new Map()) => ({
    ...enseignement.toJSON(),
    effectif: effectifEnseignement(enseignement),
    nb_seances: seancesParId.get(enseignement.id_enseignement) || 0,
});

const repondreErreur = (res, error) => {
    if (error instanceof ErreurMetier) {
        return res.status(error.status).json({ message: "Opération impossible", error: error.message });
    }
    throw error;
};

// 🔍 Liste, filtrable par période, filière et groupe
export const getEnseignements = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.id_periode) where.id_periode = req.query.id_periode;

    let enseignements = await Enseignement.findAll({ where, include: INCLUDES, order: [["id_enseignement", "ASC"]] });
    if (req.query.id_filiere) {
        const idFiliere = Number(req.query.id_filiere);
        enseignements = enseignements.filter(
            (e) => e.composante.cours.id_filiere === idFiliere || e.groupes.some((g) => g.id_filiere === idFiliere)
        );
    }
    if (req.query.id_groupe) {
        const idGroupe = Number(req.query.id_groupe);
        enseignements = enseignements.filter((e) => e.groupes.some((g) => g.id_groupe === idGroupe));
    }

    const comptes = enseignements.length
        ? await Affectation.count({
              where: { id_enseignement: enseignements.map((e) => e.id_enseignement) },
              group: ["id_enseignement"],
          })
        : [];
    const seancesParId = new Map(comptes.map((ligne) => [ligne.id_enseignement, ligne.count]));

    res.json(enseignements.map((e) => serialiser(e, seancesParId)));
});

// ⚙️ Générer les enseignements manquants d'une période à partir de la maquette
export const genererDepuisMaquette = asyncHandler(async (req, res) => {
    try {
        const rapport = await genererEnseignements({ id_periode: req.body.id_periode, id_filiere: req.body.id_filiere || null });
        res.status(rapport.crees ? 201 : 200).json({ message: `${rapport.crees} enseignement(s) créé(s)`, ...rapport });
    } catch (error) {
        repondreErreur(res, error);
    }
});

// 🔗 Mutualiser plusieurs enseignements en un seul
export const fusionner = asyncHandler(async (req, res) => {
    try {
        const id = await fusionnerEnseignements(req.body.ids || []);
        const enseignement = await Enseignement.findByPk(id, { include: INCLUDES });
        res.json({ message: "Enseignements mutualisés", enseignement: serialiser(enseignement) });
    } catch (error) {
        repondreErreur(res, error);
    }
});

// ✂️ Défaire une mutualisation : un enseignement par groupe
export const scinder = asyncHandler(async (req, res) => {
    try {
        const ids = await scinderEnseignement(Number(req.params.id));
        res.json({ message: `${ids.length} enseignements après découpage`, ids });
    } catch (error) {
        repondreErreur(res, error);
    }
});

// ✏️ Modifier le volume prévu, le libellé ou les groupes d'un enseignement
export const updateEnseignement = asyncHandler(async (req, res) => {
    const enseignement = await Enseignement.findByPk(req.params.id);
    if (!enseignement) {
        return res.status(404).json({ message: "Enseignement non trouvé", error: `Aucun enseignement avec l'ID ${req.params.id}` });
    }

    const data = {};
    if (req.body.heures_prevues !== undefined) data.heures_prevues = req.body.heures_prevues;
    if (req.body.libelle !== undefined) data.libelle = req.body.libelle || null;
    if (req.body.id_periode !== undefined) data.id_periode = req.body.id_periode;

    if (Array.isArray(req.body.groupes)) {
        const ids = [...new Set(req.body.groupes.map(Number))];
        if (ids.length === 0) {
            return res.status(400).json({ message: "Erreur de validation", error: "Un enseignement concerne au moins un groupe" });
        }
        const groupes = await Groupe.findAll({ where: { id_groupe: ids } });
        if (groupes.length !== ids.length) {
            return res.status(400).json({ message: "Erreur de validation", error: "Groupe introuvable" });
        }
        const tous = await Groupe.findAll({ where: { id_filiere: [...new Set(groupes.map((g) => g.id_filiere))] } });
        if (contientParentEtEnfant(groupes, tous)) {
            return res.status(400).json({
                message: "Erreur de validation",
                error: "Un groupe et l'un de ses sous-groupes ne peuvent pas suivre le même enseignement",
            });
        }
        await sequelize.transaction(async (transaction) => {
            await EnseignementGroupe.destroy({ where: { id_enseignement: enseignement.id_enseignement }, transaction });
            await EnseignementGroupe.bulkCreate(
                ids.map((id_groupe) => ({ id_enseignement: enseignement.id_enseignement, id_groupe })),
                { transaction }
            );
            await enseignement.update(data, { transaction });
        });
    } else {
        await enseignement.update(data);
    }

    const aJour = await Enseignement.findByPk(enseignement.id_enseignement, { include: INCLUDES });
    res.json({ message: "Enseignement mis à jour", enseignement: serialiser(aJour) });
});

// 🗑️ Supprimer un enseignement (refusé si des séances sont déjà planifiées)
export const deleteEnseignement = asyncHandler(async (req, res) => {
    const enseignement = await Enseignement.findByPk(req.params.id);
    if (!enseignement) {
        return res.status(404).json({ message: "Enseignement non trouvé", error: `Aucun enseignement avec l'ID ${req.params.id}` });
    }
    const seances = await Affectation.count({ where: { id_enseignement: enseignement.id_enseignement } });
    if (seances > 0) {
        return res.status(409).json({ message: "Enseignement planifié", error: `${seances} séance(s) sont déjà planifiées` });
    }
    await enseignement.destroy();
    res.json({ message: "Enseignement supprimé" });
});
