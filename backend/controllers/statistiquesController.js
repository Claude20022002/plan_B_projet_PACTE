import {
    Affectation,
    Salle,
    Creneau,
    Users,
    Groupe,
    Disponibilite,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * GET /api/statistiques/salles/occupation
 * Taux d'occupation global des salles
 */
export const getOccupationSalles = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    // Récupérer toutes les salles
    const salles = await Salle.findAll({
        where: { disponible: true },
    });

    // Récupérer les affectations
    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [{ model: Salle, as: "salle" }, { model: Creneau, as: "creneau" }],
    });

    // Calculer l'occupation par salle
    const occupationParSalle = salles.map((salle) => {
        const affectationsSalle = affectations.filter(
            (aff) => aff.id_salle === salle.id_salle
        );

        // Calculer le nombre total d'heures utilisées
        let totalHeures = 0;
        affectationsSalle.forEach((aff) => {
            if (aff.creneau) {
                totalHeures += aff.creneau.duree_minutes / 60;
            }
        });

        // Calculer le taux d'occupation (simplifié)
        // On suppose une semaine de 40h ouvrées (5 jours × 8h)
        const heuresDisponibles = 40; // À ajuster selon vos besoins
        const tauxOccupation = (totalHeures / heuresDisponibles) * 100;

        return {
            id_salle: salle.id_salle,
            nom_salle: salle.nom_salle,
            type_salle: salle.type_salle,
            capacite: salle.capacite,
            nombre_seances: affectationsSalle.length,
            total_heures: Math.round(totalHeures * 100) / 100,
            taux_occupation: Math.round(tauxOccupation * 100) / 100,
        };
    });

    const tauxOccupationGlobal =
        occupationParSalle.reduce((sum, salle) => sum + salle.taux_occupation, 0) /
        occupationParSalle.length;

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        taux_occupation_global: Math.round(tauxOccupationGlobal * 100) / 100,
        salles: occupationParSalle.sort(
            (a, b) => b.taux_occupation - a.taux_occupation
        ),
    });
});

/**
 * GET /api/statistiques/salles/:id/occupation
 * Occupation d'une salle spécifique
 */
export const getOccupationSalle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    const salle = await Salle.findByPk(id);
    if (!salle) {
        return res.status(404).json({ message: "Salle non trouvée" });
    }

    const whereConditions = {
        id_salle: id,
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
        ],
    });

    let totalHeures = 0;
    affectations.forEach((aff) => {
        if (aff.creneau) {
            totalHeures += aff.creneau.duree_minutes / 60;
        }
    });

    const heuresDisponibles = 40; // À ajuster
    const tauxOccupation = (totalHeures / heuresDisponibles) * 100;

    // Statistiques par jour de la semaine
    const statsParJour = {};
    affectations.forEach((aff) => {
        if (aff.creneau && aff.creneau.jour_semaine) {
            const jour = aff.creneau.jour_semaine;
            if (!statsParJour[jour]) {
                statsParJour[jour] = { nombre_seances: 0, heures: 0 };
            }
            statsParJour[jour].nombre_seances++;
            if (aff.creneau.duree_minutes) {
                statsParJour[jour].heures += aff.creneau.duree_minutes / 60;
            }
        }
    });

    res.json({
        salle: {
            id_salle: salle.id_salle,
            nom_salle: salle.nom_salle,
            type_salle: salle.type_salle,
            capacite: salle.capacite,
        },
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        statistiques: {
            nombre_seances: affectations.length,
            total_heures: Math.round(totalHeures * 100) / 100,
            taux_occupation: Math.round(tauxOccupation * 100) / 100,
            stats_par_jour: statsParJour,
        },
    });
});

/**
 * GET /api/statistiques/salles/frequence
 * Fréquence d'utilisation des salles
 */
export const getFrequenceSalles = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [{ model: Salle, as: "salle" }],
        attributes: [
            "id_salle",
            [sequelize.fn("COUNT", sequelize.col("Affectation.id_affectation")), "nombre_utilisations"],
        ],
        group: ["id_salle", "salle.id_salle"],
    });

    const frequence = await Affectation.findAll({
        where: whereConditions,
        include: [{ model: Salle, as: "salle" }],
        attributes: [
            "id_salle",
            [sequelize.fn("COUNT", sequelize.col("Affectation.id_affectation")), "count"],
        ],
        group: ["id_salle"],
        order: [[sequelize.literal("count"), "DESC"]],
    });

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        frequence_utilisation: frequence.map((item) => ({
            id_salle: item.id_salle,
            nom_salle: item.salle?.nom_salle,
            nombre_utilisations: item.get("count"),
        })),
    });
});

/**
 * GET /api/statistiques/activite/heures-creuses
 * Identifier les heures creuses
 */
export const getHeuresCreuses = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [{ model: Creneau, as: "creneau" }],
    });

    // Compter les affectations par créneau
    const activiteParCreneau = {};
    affectations.forEach((aff) => {
        if (aff.creneau) {
            const key = `${aff.creneau.jour_semaine}_${aff.creneau.heure_debut}`;
            if (!activiteParCreneau[key]) {
                activiteParCreneau[key] = {
                    jour: aff.creneau.jour_semaine,
                    heure_debut: aff.creneau.heure_debut,
                    heure_fin: aff.creneau.heure_fin,
                    nombre_seances: 0,
                };
            }
            activiteParCreneau[key].nombre_seances++;
        }
    });

    // Identifier les heures creuses (moins de 2 séances)
    const heuresCreuses = Object.values(activiteParCreneau)
        .filter((creneau) => creneau.nombre_seances < 2)
        .sort((a, b) => a.jour.localeCompare(b.jour) || a.heure_debut.localeCompare(b.heure_debut));

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        heures_creuses: heuresCreuses,
        total_creneaux_analyses: Object.keys(activiteParCreneau).length,
    });
});

/**
 * GET /api/statistiques/activite/pics
 * Identifier les pics d'activité
 */
export const getPicsActivite = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [{ model: Creneau, as: "creneau" }],
    });

    // Compter les affectations par créneau
    const activiteParCreneau = {};
    affectations.forEach((aff) => {
        if (aff.creneau) {
            const key = `${aff.creneau.jour_semaine}_${aff.creneau.heure_debut}`;
            if (!activiteParCreneau[key]) {
                activiteParCreneau[key] = {
                    jour: aff.creneau.jour_semaine,
                    heure_debut: aff.creneau.heure_debut,
                    heure_fin: aff.creneau.heure_fin,
                    nombre_seances: 0,
                };
            }
            activiteParCreneau[key].nombre_seances++;
        }
    });

    // Identifier les pics (plus de 5 séances)
    const pics = Object.values(activiteParCreneau)
        .filter((creneau) => creneau.nombre_seances >= 5)
        .sort((a, b) => b.nombre_seances - a.nombre_seances);

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        pics_activite: pics,
        total_creneaux_analyses: Object.keys(activiteParCreneau).length,
    });
});

/**
 * GET /api/statistiques/enseignants/charge
 * Charge de travail des enseignants
 */
export const getChargeEnseignants = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Users, as: "enseignant", attributes: { exclude: ["password_hash"] } },
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours" },
        ],
    });

    // Grouper par enseignant
    const chargeParEnseignant = {};
    affectations.forEach((aff) => {
        if (aff.enseignant) {
            const id = aff.enseignant.id_user;
            if (!chargeParEnseignant[id]) {
                chargeParEnseignant[id] = {
                    id_user: id,
                    nom: aff.enseignant.nom,
                    prenom: aff.enseignant.prenom,
                    nombre_seances: 0,
                    total_heures: 0,
                    cours: new Set(),
                };
            }
            chargeParEnseignant[id].nombre_seances++;
            if (aff.creneau) {
                chargeParEnseignant[id].total_heures += aff.creneau.duree_minutes / 60;
            }
            if (aff.cours) {
                chargeParEnseignant[id].cours.add(aff.cours.nom_cours);
            }
        }
    });

    const result = Object.values(chargeParEnseignant).map((enseignant) => ({
        id_user: enseignant.id_user,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        nombre_seances: enseignant.nombre_seances,
        total_heures: Math.round(enseignant.total_heures * 100) / 100,
        nombre_cours_differents: enseignant.cours.size,
    }));

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        charge_enseignants: result.sort((a, b) => b.total_heures - a.total_heures),
    });
});

/**
 * GET /api/statistiques/groupes/occupation
 * Occupation par groupe
 */
export const getOccupationGroupes = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Groupe, as: "groupe" },
            { model: Creneau, as: "creneau" },
        ],
    });

    // Grouper par groupe
    const occupationParGroupe = {};
    affectations.forEach((aff) => {
        if (aff.groupe) {
            const id = aff.groupe.id_groupe;
            if (!occupationParGroupe[id]) {
                occupationParGroupe[id] = {
                    id_groupe: id,
                    nom_groupe: aff.groupe.nom_groupe,
                    niveau: aff.groupe.niveau,
                    nombre_seances: 0,
                    total_heures: 0,
                };
            }
            occupationParGroupe[id].nombre_seances++;
            if (aff.creneau) {
                occupationParGroupe[id].total_heures += aff.creneau.duree_minutes / 60;
            }
        }
    });

    const result = Object.values(occupationParGroupe).map((groupe) => ({
        id_groupe: groupe.id_groupe,
        nom_groupe: groupe.nom_groupe,
        niveau: groupe.niveau,
        nombre_seances: groupe.nombre_seances,
        total_heures: Math.round(groupe.total_heures * 100) / 100,
    }));

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        occupation_groupes: result.sort((a, b) => b.total_heures - a.total_heures),
    });
});

/**
 * GET /api/statistiques/dashboard
 * Tableau de bord complet avec toutes les statistiques
 */
export const getDashboard = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    // Récupérer toutes les statistiques
    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    }

    const [
        totalAffectations,
        totalSalles,
        totalEnseignants,
        totalGroupes,
        affectations,
    ] = await Promise.all([
        Affectation.count({ where: whereConditions }),
        Salle.count({ where: { disponible: true } }),
        Users.count({ where: { role: "enseignant", actif: true } }),
        Groupe.count(),
        Affectation.findAll({
            where: whereConditions,
            include: [
                { model: Salle, as: "salle" },
                { model: Creneau, as: "creneau" },
                { model: Users, as: "enseignant" },
            ],
        }),
    ]);

    // Calculer les statistiques
    const sallesUtilisees = new Set(affectations.map((aff) => aff.id_salle)).size;
    const enseignantsActifs = new Set(
        affectations.map((aff) => aff.id_user_enseignant)
    ).size;

    let totalHeures = 0;
    affectations.forEach((aff) => {
        if (aff.creneau) {
            totalHeures += aff.creneau.duree_minutes / 60;
        }
    });

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        resume: {
            total_affectations: totalAffectations,
            total_salles: totalSalles,
            salles_utilisees: sallesUtilisees,
            total_enseignants: totalEnseignants,
            enseignants_actifs: enseignantsActifs,
            total_groupes: totalGroupes,
            total_heures: Math.round(totalHeures * 100) / 100,
        },
        note: "Utilisez les endpoints spécifiques pour des statistiques détaillées",
    });
});

