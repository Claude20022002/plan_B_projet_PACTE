import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { AnneeUniversitaire, Periode, Evenement } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { evenementsCalendrierMaroc } from "../utils/feriesMaroc.js";

const ANNEE_FIELDS = ["libelle", "date_debut", "date_fin", "active"];
const PERIODE_FIELDS = ["code", "libelle", "date_debut", "date_fin", "nb_semaines"];

const introuvable = (res, quoi, id) =>
    res.status(404).json({ message: `${quoi} non trouvée`, error: `Aucune ${quoi.toLowerCase()} avec l'ID ${id}` });

const invalide = (res, error) => res.status(400).json({ message: "Erreur de validation", error });

/** Une seule année active à la fois. */
const activerSeulement = (idAnnee, transaction) =>
    AnneeUniversitaire.update({ active: false }, { where: { id_annee: { [Op.ne]: idAnnee } }, transaction });

// ==================== ANNÉES UNIVERSITAIRES ====================

export const getAnnees = asyncHandler(async (req, res) => {
    const annees = await AnneeUniversitaire.findAll({
        include: [{ model: Periode, as: "periodes" }],
        order: [["date_debut", "DESC"], [{ model: Periode, as: "periodes" }, "date_debut", "ASC"]],
    });
    res.json(annees);
});

export const createAnnee = asyncHandler(async (req, res) => {
    const data = pick(req.body, ANNEE_FIELDS);
    if (data.date_fin <= data.date_debut) return invalide(res, "La date de fin doit suivre la date de début");
    if (await AnneeUniversitaire.findOne({ where: { libelle: data.libelle } })) {
        return res.status(409).json({ message: "Année déjà existante", error: `L'année « ${data.libelle} » existe déjà` });
    }

    const annee = await sequelize.transaction(async (transaction) => {
        const creee = await AnneeUniversitaire.create(data, { transaction });
        if (creee.active) await activerSeulement(creee.id_annee, transaction);
        return creee;
    });
    res.status(201).json({ message: "Année universitaire créée", annee });
});

export const updateAnnee = asyncHandler(async (req, res) => {
    const annee = await AnneeUniversitaire.findByPk(req.params.id, { include: [{ model: Periode, as: "periodes" }] });
    if (!annee) return introuvable(res, "Année", req.params.id);

    const data = pick(req.body, ANNEE_FIELDS);
    const debut = data.date_debut ?? annee.date_debut;
    const fin = data.date_fin ?? annee.date_fin;
    if (fin <= debut) return invalide(res, "La date de fin doit suivre la date de début");
    if (annee.periodes.some((p) => p.date_debut < debut || p.date_fin > fin)) {
        return invalide(res, "Les semestres de l'année doivent rester compris dans ses dates");
    }

    await sequelize.transaction(async (transaction) => {
        await annee.update(data, { transaction });
        if (annee.active) await activerSeulement(annee.id_annee, transaction);
    });
    res.json({ message: "Année universitaire mise à jour", annee });
});

export const deleteAnnee = asyncHandler(async (req, res) => {
    const annee = await AnneeUniversitaire.findByPk(req.params.id);
    if (!annee) return introuvable(res, "Année", req.params.id);
    await annee.destroy();
    res.json({ message: "Année universitaire supprimée" });
});

// ==================== PÉRIODES (SEMESTRES) ====================

/** Bornes dans l'année et pas de chevauchement avec l'autre semestre. */
const verifierPeriode = async (annee, data, idPeriodeExclue = null) => {
    if (data.date_fin <= data.date_debut) return "La date de fin doit suivre la date de début";
    if (data.date_debut < annee.date_debut || data.date_fin > annee.date_fin) {
        return `Le semestre doit être compris dans l'année ${annee.libelle} (${annee.date_debut} → ${annee.date_fin})`;
    }
    const autres = await Periode.findAll({ where: { id_annee: annee.id_annee } });
    for (const autre of autres) {
        if (autre.id_periode === idPeriodeExclue) continue;
        if (autre.code === data.code) return `Le semestre ${data.code} existe déjà pour ${annee.libelle}`;
        if (data.date_debut <= autre.date_fin && data.date_fin >= autre.date_debut) {
            return `Le semestre chevauche ${autre.code} (${autre.date_debut} → ${autre.date_fin})`;
        }
    }
    return null;
};

export const createPeriode = asyncHandler(async (req, res) => {
    const annee = await AnneeUniversitaire.findByPk(req.params.idAnnee);
    if (!annee) return introuvable(res, "Année", req.params.idAnnee);

    const data = { ...pick(req.body, PERIODE_FIELDS), id_annee: annee.id_annee };
    const probleme = await verifierPeriode(annee, data);
    if (probleme) return invalide(res, probleme);

    const periode = await Periode.create(data);
    res.status(201).json({ message: "Semestre créé", periode });
});

export const updatePeriode = asyncHandler(async (req, res) => {
    const periode = await Periode.findByPk(req.params.id, { include: [{ model: AnneeUniversitaire, as: "annee" }] });
    if (!periode) return introuvable(res, "Période", req.params.id);

    const data = { ...periode.toJSON(), ...pick(req.body, PERIODE_FIELDS) };
    const probleme = await verifierPeriode(periode.annee, data, periode.id_periode);
    if (probleme) return invalide(res, probleme);

    await periode.update(pick(req.body, PERIODE_FIELDS));
    res.json({ message: "Semestre mis à jour", periode });
});

export const deletePeriode = asyncHandler(async (req, res) => {
    const periode = await Periode.findByPk(req.params.id);
    if (!periode) return introuvable(res, "Période", req.params.id);
    await periode.destroy();
    res.json({ message: "Semestre supprimé" });
});

// ==================== JOURS FÉRIÉS DU MAROC ====================

/**
 * Pré-remplit le calendrier de l'année : fériés civils (confirmés), fêtes religieuses
 * et Ramadan (dates estimées, à confirmer). Sans doublon si on relance.
 */
export const genererFeries = asyncHandler(async (req, res) => {
    const annee = await AnneeUniversitaire.findByPk(req.params.id);
    if (!annee) return introuvable(res, "Année", req.params.id);

    const candidats = evenementsCalendrierMaroc(annee.date_debut, annee.date_fin);
    const crees = [];
    await sequelize.transaction(async (transaction) => {
        for (const evenement of candidats) {
            const existe = await Evenement.findOne({
                where: { titre: evenement.titre, type_evenement: evenement.type_evenement, date_debut: evenement.date_debut },
                transaction,
            });
            if (!existe) {
                crees.push(await Evenement.create({ ...evenement, id_user_createur: req.user.id_user }, { transaction }));
            }
        }
    });

    res.status(201).json({
        message: `${crees.length} événement(s) ajouté(s) au calendrier ${annee.libelle}`,
        crees: crees.length,
        a_confirmer: crees.filter((e) => !e.date_confirmee).length,
        evenements: crees,
    });
});
