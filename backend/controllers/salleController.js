import sequelize from "../config/db.js";
import { Campus, Salle } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";
import { TYPES_SALLE, RESERVABLE_PAR, normaliserTypeSalle } from "../config/referentiel.js";
import { lireParametre } from "../services/planning/referentiel.js";

/**
 * Contrôleur pour les salles (rattachées à un campus : Gandhi, Stendhal…)
 */

const SALLE_FIELDS = [
    "nom_salle",
    "type_salle",
    "capacite",
    "capacite_examen",
    "id_campus",
    "etage",
    "equipements",
    "reservable_par",
    "disponible",
];

const salleIntrouvable = (res, id) =>
    res.status(404).json({ message: "Salle non trouvée", error: `Aucune salle trouvée avec l'ID ${id}` });

/** Liste d'équipements à partir d'un tableau ou d'un texte « a, b ; c ». */
const normaliserEquipements = (valeur) => {
    if (valeur === undefined) return undefined;
    if (valeur === null || valeur === "") return [];
    const liste = Array.isArray(valeur) ? valeur : String(valeur).split(/[,;]/);
    return [...new Set(liste.map((item) => String(item).trim()).filter(Boolean))];
};

/** Capacité d'examen par défaut : part réglable de la capacité. */
const capaciteExamenParDefaut = async (capacite) =>
    Math.floor(Number(capacite) * (await lireParametre("ratio_capacite_examen")));

const preparerSalle = (body) => {
    const data = pick(body, SALLE_FIELDS);
    if (data.type_salle !== undefined) data.type_salle = normaliserTypeSalle(data.type_salle);
    if (data.equipements !== undefined) data.equipements = normaliserEquipements(data.equipements);
    if (typeof data.nom_salle === "string") data.nom_salle = data.nom_salle.trim();
    return data;
};

const nomDejaPris = async (nom, idSalleExclue = null) => {
    const existante = await Salle.unscoped().findOne({ where: { nom_salle: nom } });
    return existante && existante.id_salle !== idSalleExclue;
};

// 🔍 Récupérer toutes les salles (avec pagination)
export const getAllSalles = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = {};
    if (req.query.type_salle) where.type_salle = req.query.type_salle;
    if (req.query.id_campus) where.id_campus = req.query.id_campus;
    if (req.query.disponible !== undefined) where.disponible = req.query.disponible === "true";

    // Filtre par code campus (?campus=G) ou, pour compatibilité, par nom (?batiment=Gandhi)
    const campusFiltre = req.query.campus || req.query.batiment;
    if (campusFiltre) {
        const campus = await Campus.findOne({
            where: req.query.campus ? { code: String(campusFiltre).toUpperCase() } : { nom: campusFiltre },
        });
        if (!campus) return res.json(createPaginationResponse([], 0, page, limit));
        where.id_campus = campus.id_campus;
    }

    const { count, rows: salles } = await Salle.findAndCountAll({
        where,
        limit,
        offset,
        distinct: true,
        order: [["nom_salle", "ASC"]],
    });

    res.json(createPaginationResponse(salles, count, page, limit));
});

// 🔍 Listes fermées utiles aux formulaires (types de salle, droits de réservation)
export const getReferentielSalles = asyncHandler(async (req, res) => {
    res.json({ types_salle: TYPES_SALLE, reservable_par: RESERVABLE_PAR });
});

// 🔍 Récupérer une salle par ID
export const getSalleById = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);
    if (!salle) return salleIntrouvable(res, req.params.id);
    res.json(salle);
});

// ➕ Créer une salle
export const createSalle = asyncHandler(async (req, res) => {
    const data = preparerSalle(req.body);

    if (await nomDejaPris(data.nom_salle)) {
        return res.status(409).json({
            message: "Salle déjà existante",
            error: `Une salle avec le nom "${data.nom_salle}" existe déjà`,
        });
    }
    if (!(await Campus.findByPk(data.id_campus))) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus inconnu" });
    }
    data.capacite_examen ??= await capaciteExamenParDefaut(data.capacite);

    const { id_salle } = await Salle.create(data);
    const salle = await Salle.findByPk(id_salle);

    res.status(201).json({ message: "Salle créée avec succès", salle });
});

// ✏️ Mettre à jour une salle
export const updateSalle = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);
    if (!salle) return salleIntrouvable(res, req.params.id);

    const data = preparerSalle(req.body);

    if (data.nom_salle && data.nom_salle !== salle.nom_salle && (await nomDejaPris(data.nom_salle, salle.id_salle))) {
        return res.status(409).json({
            message: "Nom de salle déjà utilisé",
            error: `Une salle avec le nom "${data.nom_salle}" existe déjà`,
        });
    }
    if (data.id_campus !== undefined && !(await Campus.findByPk(data.id_campus))) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus inconnu" });
    }

    await salle.update(data);
    await salle.reload();

    res.json({ message: "Salle mise à jour avec succès", salle });
});

// 🗑️ Supprimer une salle
export const deleteSalle = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);
    if (!salle) return salleIntrouvable(res, req.params.id);

    await salle.destroy();
    res.json({ message: "Salle supprimée avec succès" });
});

// 🔍 Récupérer les salles disponibles
export const getSallesDisponibles = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: salles } = await Salle.findAndCountAll({
        where: { disponible: true },
        limit,
        offset,
        distinct: true,
        order: [["nom_salle", "ASC"]],
    });

    res.json(createPaginationResponse(salles, count, page, limit));
});

/**
 * 📥 Import de l'inventaire des salles (lignes déjà lues du CSV par le frontend).
 * Colonnes : nom_salle, type_salle, capacite, campus (code G/ST ou nom), etage,
 * equipements (« a, b »), capacite_examen, reservable_par.
 * Tout ou rien : la moindre ligne invalide annule l'import et toutes les erreurs sont listées.
 * Une salle déjà connue (même nom) est mise à jour, les autres sont créées.
 */
export const importSalles = asyncHandler(async (req, res) => {
    const lignes = Array.isArray(req.body?.salles) ? req.body.salles : null;
    if (!lignes || lignes.length === 0) {
        return res.status(400).json({ message: "Erreur de validation", error: "Aucune ligne à importer (champ salles)" });
    }
    if (lignes.length > 1000) {
        return res.status(400).json({ message: "Erreur de validation", error: "1000 salles au maximum par import" });
    }

    const campus = await Campus.findAll();
    const trouverCampus = (valeur) => {
        const cle = String(valeur ?? "").trim().toLowerCase();
        return campus.find((c) => c.code.toLowerCase() === cle || c.nom.toLowerCase() === cle);
    };
    const ratio = await lireParametre("ratio_capacite_examen");

    const erreurs = [];
    const nomsVus = new Set();
    const preparees = lignes.map((ligne, index) => {
        const numero = index + 2; // ligne 1 = en-têtes du CSV
        const problemes = [];
        const nom = String(ligne.nom_salle ?? "").trim();
        const type = normaliserTypeSalle(ligne.type_salle);
        const capacite = Number(ligne.capacite);
        const campusLigne = trouverCampus(ligne.campus ?? ligne.code_campus ?? ligne.batiment);
        const etage = ligne.etage === undefined || ligne.etage === "" ? null : Number(ligne.etage);
        const capaciteExamen =
            ligne.capacite_examen === undefined || ligne.capacite_examen === "" ? null : Number(ligne.capacite_examen);
        const reservablePar = ligne.reservable_par ? String(ligne.reservable_par).trim() : "admin";

        if (!nom) problemes.push("nom_salle manquant");
        else if (nomsVus.has(nom.toLowerCase())) problemes.push(`salle « ${nom} » en double dans le fichier`);
        nomsVus.add(nom.toLowerCase());
        if (!TYPES_SALLE.includes(type)) problemes.push(`type_salle « ${ligne.type_salle ?? ""} » inconnu`);
        if (!Number.isInteger(capacite) || capacite < 1) problemes.push("capacite doit être un entier positif");
        if (!campusLigne) problemes.push(`campus « ${ligne.campus ?? ligne.batiment ?? ""} » inconnu`);
        if (etage !== null && !Number.isInteger(etage)) problemes.push("etage doit être un entier");
        if (capaciteExamen !== null && (!Number.isInteger(capaciteExamen) || capaciteExamen < 0 || capaciteExamen > capacite)) {
            problemes.push("capacite_examen doit être un entier entre 0 et la capacité");
        }
        if (!RESERVABLE_PAR.includes(reservablePar)) problemes.push("reservable_par doit valoir admin ou enseignants");

        if (problemes.length) erreurs.push({ ligne: numero, nom_salle: nom || null, erreurs: problemes });

        return {
            nom_salle: nom,
            type_salle: type,
            capacite,
            id_campus: campusLigne?.id_campus,
            etage,
            equipements: normaliserEquipements(ligne.equipements) ?? [],
            capacite_examen: capaciteExamen ?? Math.floor(capacite * ratio),
            reservable_par: reservablePar,
            disponible: ligne.disponible === undefined ? true : !["false", "0", "non", false, 0].includes(ligne.disponible),
        };
    });

    if (erreurs.length) {
        return res.status(400).json({ message: "Import refusé : corrigez les lignes signalées", erreurs });
    }

    let crees = 0;
    let misesAJour = 0;
    await sequelize.transaction(async (transaction) => {
        for (const data of preparees) {
            const existante = await Salle.unscoped().findOne({ where: { nom_salle: data.nom_salle }, transaction });
            if (existante) {
                await existante.update(data, { transaction });
                misesAJour += 1;
            } else {
                await Salle.create(data, { transaction });
                crees += 1;
            }
        }
    });

    res.json({ message: "Import terminé", crees, mises_a_jour: misesAJour });
});
