import sequelize from "../config/db.js";
import { Campus, CompetenceEnseignant, Cours, Creneau, Enseignant, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { hashPassword } from "../utils/passwordHelper.js";
import { pick } from "../utils/validationHelper.js";
import { chargesEnseignants, disponibiliteEnseignant } from "../services/planning/enseignants.js";
import { STATUTS_ENSEIGNANT } from "../config/referentiel.js";
import { creerLienInvitation, empreinteInutilisable, envoyerInvitation } from "../services/comptes.js";

/**
 * Contrôleur pour les enseignants : permanents et vacataires, service dû, compétences.
 */

const ENSEIGNANT_FIELDS = [
    "specialite",
    "departement",
    "grade",
    "bureau",
    "statut",
    "service_annuel_heures",
    "max_heures_semaine",
    "id_campus_prefere",
    "entreprise",
];

const introuvable = (res, id) =>
    res.status(404).json({ message: "Enseignant non trouvé", error: `Aucun enseignant trouvé avec l'ID ${id}` });

// 📊 Charge de chaque enseignant sur l'année (active par défaut) face à son service dû
export const getChargesEnseignants = asyncHandler(async (req, res) => {
    res.json(await chargesEnseignants({ idAnnee: req.query.id_annee || null }));
});

// 📊 Charge d'un enseignant (l'enseignant lui-même ou l'administration)
export const getChargeEnseignant = asyncHandler(async (req, res) => {
    const { annee, charges } = await chargesEnseignants({ idAnnee: req.query.id_annee || null, idUser: Number(req.params.id) });
    if (charges.length === 0) return introuvable(res, req.params.id);
    res.json({ annee, ...charges[0] });
});

// 🎓 Modules qu'un enseignant peut prendre
export const getCompetences = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);
    if (!enseignant) return introuvable(res, req.params.id);
    const competences = await CompetenceEnseignant.findAll({ where: { id_user: enseignant.id_user }, attributes: ["id_cours"] });
    const cours = await Cours.findAll({
        where: { id_cours: competences.map((c) => c.id_cours) },
        attributes: ["id_cours", "code_cours", "nom_cours", "semestre", "id_filiere"],
        order: [["code_cours", "ASC"]],
    });
    res.json(cours);
});

// ✏️ Remplacer la liste des compétences (ids de modules)
export const setCompetences = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);
    if (!enseignant) return introuvable(res, req.params.id);
    const ids = [...new Set((req.body.cours || []).map(Number))];
    if ((await Cours.count({ where: { id_cours: ids } })) !== ids.length) {
        return res.status(400).json({ message: "Erreur de validation", error: "Module introuvable" });
    }
    await sequelize.transaction(async (transaction) => {
        await CompetenceEnseignant.destroy({ where: { id_user: enseignant.id_user }, transaction });
        await CompetenceEnseignant.bulkCreate(ids.map((id_cours) => ({ id_user: enseignant.id_user, id_cours })), { transaction });
    });
    res.json({ message: "Compétences enregistrées", cours: ids });
});

// 🕐 Disponibilité sur un créneau à une date (règle permanent / vacataire)
export const getDisponibiliteEnseignant = asyncHandler(async (req, res) => {
    const { date, id_creneau } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !id_creneau) {
        return res.status(400).json({ message: "Erreur de validation", error: "Paramètres date (AAAA-MM-JJ) et id_creneau requis" });
    }
    if (!(await Creneau.findByPk(id_creneau))) {
        return res.status(404).json({ message: "Créneau non trouvé", error: `Aucun créneau avec l'ID ${id_creneau}` });
    }
    res.json(await disponibiliteEnseignant({ idUser: Number(req.params.id), date, idCreneau: Number(id_creneau) }));
});

const campusInconnu = async (data) =>
    data.id_campus_prefere !== undefined && data.id_campus_prefere !== null && !(await Campus.findByPk(data.id_campus_prefere));

// 🔍 Récupérer tous les enseignants (avec pagination)
export const getAllEnseignants = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = {};
    if (req.query.statut) where.statut = req.query.statut;

    const { count, rows: enseignants } = await Enseignant.findAndCountAll({
        where,
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Campus, as: "campus_prefere", attributes: ["id_campus", "code", "nom"] },
        ],
        limit,
        offset,
        order: [["id_user", "ASC"]],
    });

    res.json(createPaginationResponse(enseignants, count, page, limit));
});

// 🔍 Récupérer un enseignant par ID
export const getEnseignantById = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(enseignant);
});

// ➕ Créer un enseignant
export const createEnseignant = asyncHandler(async (req, res) => {
    // Vérifier que l'utilisateur existe
    const user = await Users.findByPk(req.body.id_user);
    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.body.id_user}`,
        });
    }

    // Vérifier que l'utilisateur n'est pas déjà un enseignant
    const existingEnseignant = await Enseignant.findByPk(req.body.id_user);
    if (existingEnseignant) {
        return res.status(409).json({
            message: "Enseignant déjà existant",
            error: `L'utilisateur ${req.body.id_user} est déjà un enseignant`,
        });
    }

    const enseignant = await Enseignant.create({
        ...pick(req.body, ENSEIGNANT_FIELDS),
        id_user: user.id_user,
    });

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.status(201).json({
        message: "Enseignant créé avec succès",
        enseignant: enseignantAvecUser,
    });
});

// ✏️ Mettre à jour un enseignant
export const updateEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    const data = pick(req.body, ENSEIGNANT_FIELDS);
    if (await campusInconnu(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus préféré inconnu" });
    }
    await enseignant.update(data);

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json({
        message: "Enseignant mis à jour avec succès",
        enseignant: enseignantAvecUser,
    });
});

// 🗑️ Supprimer un enseignant
export const deleteEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await enseignant.destroy();

    res.json({
        message: "Enseignant supprimé avec succès",
    });
});

// Colonnes facultatives du fichier d'import : statut, service dû, plafond, entreprise
const nombreOuNull = (valeur) => (valeur === undefined || valeur === null || String(valeur).trim() === "" || Number.isNaN(Number(valeur)) ? null : Number(valeur));
const colonnesP3Import = (ligne) => {
    const statut = String(ligne.statut || "").trim().toLowerCase();
    if (statut && !STATUTS_ENSEIGNANT.includes(statut)) throw new Error(`Statut inconnu : ${ligne.statut} (permanent ou vacataire)`);
    return {
        ...(statut && { statut }),
        service_annuel_heures: nombreOuNull(ligne.service_annuel_heures),
        max_heures_semaine: nombreOuNull(ligne.max_heures_semaine),
        entreprise: String(ligne.entreprise || "").trim() || null,
    };
};

// 📥 Importer des enseignants en masse
export const importEnseignants = asyncHandler(async (req, res) => {
    const { enseignants } = req.body;

    if (!Array.isArray(enseignants) || enseignants.length === 0) {
        return res.status(400).json({
            message: "Données invalides",
            error: "Un tableau d'enseignants est requis",
        });
    }

    const results = {
        success: [],
        errors: [],
    };

    for (const enseignantData of enseignants) {
        try {
            // Vérifier les champs requis
            if (!enseignantData.email || !enseignantData.nom || !enseignantData.prenom) {
                results.errors.push({
                    email: enseignantData.email || "N/A",
                    error: "Champs requis manquants (email, nom, prenom)",
                });
                continue;
            }

            // Colonnes facultatives validées avant toute création (pas de compte orphelin)
            const colonnesP3 = colonnesP3Import(enseignantData);

            // Vérifier si l'email existe déjà
            let user = await Users.findOne({ where: { email: enseignantData.email } });
            
            if (!user) {
                // Créer l'utilisateur
                // Mot de passe du fichier (provisoire) ou aléatoire + invitation ; à changer à la connexion
                const password_hash = enseignantData.password ? await hashPassword(String(enseignantData.password)) : await empreinteInutilisable();

                user = await Users.create({
                    nom: enseignantData.nom,
                    prenom: enseignantData.prenom,
                    email: enseignantData.email,
                    role: "enseignant",
                    telephone: enseignantData.telephone || null,
                    actif: enseignantData.actif !== undefined ? enseignantData.actif : true,
                    password_hash: password_hash,
                    must_change_password: true,
                });
                if (!enseignantData.password) await envoyerInvitation(user, await creerLienInvitation(user));
            } else if (user.role !== "enseignant") {
                // Mettre à jour le rôle si nécessaire
                await user.update({ role: "enseignant" });
            }

            // Vérifier si l'enseignant existe déjà
            const existingEnseignant = await Enseignant.findByPk(user.id_user);
            if (existingEnseignant) {
                results.errors.push({
                    email: enseignantData.email,
                    error: "Enseignant déjà existant",
                });
                continue;
            }

            // Créer l'enseignant
            const enseignant = await Enseignant.create({
                id_user: user.id_user,
                specialite: enseignantData.specialite || null,
                departement: enseignantData.departement || null,
                grade: enseignantData.grade || null,
                bureau: enseignantData.bureau || null,
                ...colonnesP3,
            });

            const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: { exclude: ["password_hash"] },
                    },
                ],
            });

            results.success.push(enseignantAvecUser);
        } catch (error) {
            console.error(`Erreur lors de la création de l'enseignant ${enseignantData.email}:`, error);
            results.errors.push({
                email: enseignantData.email || "N/A",
                error: error.message || "Erreur lors de la création",
            });
        }
    }

    res.status(201).json({
        message: `${results.success.length} enseignant(s) créé(s) avec succès`,
        success: results.success,
        errors: results.errors,
        total: enseignants.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
    });
});
