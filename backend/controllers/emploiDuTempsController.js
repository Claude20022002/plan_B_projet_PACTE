import {
    Affectation,
    Cours,
    Groupe,
    Salle,
    Creneau,
    Users,
    Disponibilite,
    Appartenir,
    Etudiant,
    Filiere,
} from "../models/index.js";
import { Op } from "sequelize";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Formate les affectations en emploi du temps organisé par jour
 */
const formatEmploiDuTemps = (affectations) => {
    const joursSemaine = [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
    ];

    const emploiParJour = {};
    joursSemaine.forEach((jour) => {
        emploiParJour[jour] = [];
    });

    affectations.forEach((aff) => {
        if (aff.creneau && aff.creneau.jour_semaine) {
            const jour = aff.creneau.jour_semaine.toLowerCase();
            if (emploiParJour[jour]) {
                emploiParJour[jour].push({
                    id_affectation: aff.id_affectation,
                    date_seance: aff.date_seance,
                    heure_debut: aff.creneau.heure_debut,
                    heure_fin: aff.creneau.heure_fin,
                    periode: aff.creneau.periode,
                    cours: aff.cours
                        ? {
                            id_cours: aff.cours.id_cours,
                            code_cours: aff.cours.code_cours,
                            nom_cours: aff.cours.nom_cours,
                            type_cours: aff.cours.type_cours,
                        }
                        : null,
                    salle: aff.salle
                        ? {
                            id_salle: aff.salle.id_salle,
                            nom_salle: aff.salle.nom_salle,
                            type_salle: aff.salle.type_salle,
                            batiment: aff.salle.batiment,
                            etage: aff.salle.etage,
                        }
                        : null,
                    enseignant: aff.enseignant
                        ? {
                            id_user: aff.enseignant.id_user,
                            nom: aff.enseignant.nom,
                            prenom: aff.enseignant.prenom,
                        }
                        : null,
                    groupe: aff.groupe
                        ? {
                            id_groupe: aff.groupe.id_groupe,
                            nom_groupe: aff.groupe.nom_groupe,
                        }
                        : null,
                    statut: aff.statut,
                    commentaire: aff.commentaire,
                });
            }
        }
    });

    // Trier chaque jour par heure de début
    Object.keys(emploiParJour).forEach((jour) => {
        emploiParJour[jour].sort((a, b) => {
            return a.heure_debut.localeCompare(b.heure_debut);
        });
    });

    return emploiParJour;
};

/**
 * GET /api/emplois-du-temps/enseignant/:id
 * Récupérer l'emploi du temps d'un enseignant
 */
export const getEmploiDuTempsEnseignant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    // Construire les conditions de date
    const whereConditions = {
        id_user_enseignant: id,
        statut: { [Op.ne]: "annule" }, // Exclure les cours annulés
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    } else if (date_debut) {
        whereConditions.date_seance = {
            [Op.gte]: date_debut,
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });

    const emploiParJour = formatEmploiDuTemps(affectations);

    res.json({
        enseignant_id: id,
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        emploi_du_temps: emploiParJour,
        affectations: affectations.map((aff) => ({
            id_affectation: aff.id_affectation,
            date_seance: aff.date_seance,
            statut: aff.statut,
            cours: aff.cours?.nom_cours,
            groupe: aff.groupe?.nom_groupe,
            salle: aff.salle?.nom_salle,
            creneau: aff.creneau
                ? `${aff.creneau.jour_semaine} ${aff.creneau.heure_debut}-${aff.creneau.heure_fin}`
                : null,
        })),
    });
});

/**
 * GET /api/emplois-du-temps/groupe/:id
 * Récupérer l'emploi du temps d'un groupe
 */
export const getEmploiDuTempsGroupe = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        id_groupe: id,
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    } else if (date_debut) {
        whereConditions.date_seance = {
            [Op.gte]: date_debut,
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Cours, as: "cours" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });

    const groupe = await Groupe.findByPk(id, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    const emploiParJour = formatEmploiDuTemps(affectations);

    res.json({
        groupe_id: id,
        groupe: groupe
            ? {
                id_groupe: groupe.id_groupe,
                nom_groupe: groupe.nom_groupe,
                niveau: groupe.niveau,
                filiere: groupe.filiere?.nom_filiere,
            }
            : null,
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        emploi_du_temps: emploiParJour,
        affectations: affectations.map((aff) => ({
            id_affectation: aff.id_affectation,
            date_seance: aff.date_seance,
            statut: aff.statut,
            cours: aff.cours?.nom_cours,
            enseignant: aff.enseignant
                ? `${aff.enseignant.prenom} ${aff.enseignant.nom}`
                : null,
            salle: aff.salle?.nom_salle,
            creneau: aff.creneau
                ? `${aff.creneau.jour_semaine} ${aff.creneau.heure_debut}-${aff.creneau.heure_fin}`
                : null,
        })),
    });
});

/**
 * GET /api/emplois-du-temps/etudiant/:id
 * Récupérer l'emploi du temps d'un étudiant (via son groupe)
 */
export const getEmploiDuTempsEtudiant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    // Trouver les groupes de l'étudiant
    const appartenances = await Appartenir.findAll({
        where: { id_user_etudiant: id },
        include: [{ model: Groupe, as: "groupe" }],
    });

    if (appartenances.length === 0) {
        return res.status(404).json({
            message: "Aucun groupe trouvé pour cet étudiant",
        });
    }

    const idGroupes = appartenances.map((app) => app.id_groupe);

    const whereConditions = {
        id_groupe: { [Op.in]: idGroupes },
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    } else if (date_debut) {
        whereConditions.date_seance = {
            [Op.gte]: date_debut,
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });

    const etudiant = await Etudiant.findByPk(id, {
        include: [{ model: Users, as: "user" }],
    });

    const emploiParJour = formatEmploiDuTemps(affectations);

    res.json({
        etudiant_id: id,
        etudiant: etudiant
            ? {
                numero_etudiant: etudiant.numero_etudiant,
                nom: etudiant.user?.nom,
                prenom: etudiant.user?.prenom,
                niveau: etudiant.niveau,
            }
            : null,
        groupes: appartenances.map((app) => ({
            id_groupe: app.groupe.id_groupe,
            nom_groupe: app.groupe.nom_groupe,
        })),
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        emploi_du_temps: emploiParJour,
        affectations: affectations.map((aff) => ({
            id_affectation: aff.id_affectation,
            date_seance: aff.date_seance,
            statut: aff.statut,
            cours: aff.cours?.nom_cours,
            groupe: aff.groupe?.nom_groupe,
            enseignant: aff.enseignant
                ? `${aff.enseignant.prenom} ${aff.enseignant.nom}`
                : null,
            salle: aff.salle?.nom_salle,
            creneau: aff.creneau
                ? `${aff.creneau.jour_semaine} ${aff.creneau.heure_debut}-${aff.creneau.heure_fin}`
                : null,
        })),
    });
});

/**
 * GET /api/emplois-du-temps/salle/:id
 * Récupérer l'emploi du temps d'une salle
 */
export const getEmploiDuTempsSalle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        id_salle: id,
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    } else if (date_debut) {
        whereConditions.date_seance = {
            [Op.gte]: date_debut,
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });

    const salle = await Salle.findByPk(id);

    const emploiParJour = formatEmploiDuTemps(affectations);

    res.json({
        salle_id: id,
        salle: salle
            ? {
                  id_salle: salle.id_salle,
                  nom_salle: salle.nom_salle,
                  type_salle: salle.type_salle,
                  capacite: salle.capacite,
                  batiment: salle.batiment,
                  etage: salle.etage,
              }
            : null,
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        emploi_du_temps: emploiParJour,
        affectations: affectations.map((aff) => ({
            id_affectation: aff.id_affectation,
            date_seance: aff.date_seance,
            statut: aff.statut,
            cours: aff.cours?.nom_cours,
            groupe: aff.groupe?.nom_groupe,
            enseignant: aff.enseignant
                ? `${aff.enseignant.prenom} ${aff.enseignant.nom}`
                : null,
            creneau: aff.creneau
                ? `${aff.creneau.jour_semaine} ${aff.creneau.heure_debut}-${aff.creneau.heure_fin}`
                : null,
        })),
    });
});

/**
 * GET /api/emplois-du-temps/consolide
 * Récupérer l'emploi du temps consolidé (toutes les affectations)
 */
export const getEmploiDuTempsConsolide = asyncHandler(async (req, res) => {
    const { date_debut, date_fin } = req.query;

    const whereConditions = {
        statut: { [Op.ne]: "annule" },
    };

    if (date_debut && date_fin) {
        whereConditions.date_seance = {
            [Op.between]: [date_debut, date_fin],
        };
    } else if (date_debut) {
        whereConditions.date_seance = {
            [Op.gte]: date_debut,
        };
    }

    const affectations = await Affectation.findAll({
        where: whereConditions,
        include: [
            { model: Cours, as: "cours" },
            { model: Groupe, as: "groupe" },
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });

    const emploiParJour = formatEmploiDuTemps(affectations);

    res.json({
        periode: date_debut && date_fin ? { date_debut, date_fin } : null,
        total_affectations: affectations.length,
        emploi_du_temps: emploiParJour,
        resume: {
            par_groupe: {},
            par_enseignant: {},
            par_salle: {},
        },
    });
});

/**
 * POST /api/emplois-du-temps/generer
 * Génération automatique d'emploi du temps (algorithme basique)
 * Note: Cette fonction est une version simplifiée. Une version complète nécessiterait
 * un algorithme d'optimisation plus sophistiqué (algorithme génétique, recuit simulé, etc.)
 */
export const genererEmploiDuTemps = asyncHandler(async (req, res) => {
    const { id_groupe, id_cours, date_debut, date_fin } = req.body;

    // Validation des paramètres
    if (!id_groupe || !id_cours || !date_debut || !date_fin) {
        return res.status(400).json({
            message: "Paramètres manquants",
            error:
                "Les paramètres id_groupe, id_cours, date_debut et date_fin sont requis",
        });
    }

    // Récupérer les informations nécessaires
    const groupe = await Groupe.findByPk(id_groupe);
    const cours = await Cours.findByPk(id_cours);

    if (!groupe || !cours) {
        return res.status(404).json({
            message: "Groupe ou cours non trouvé",
        });
    }

    // Récupérer les créneaux disponibles
    const creneaux = await Creneau.findAll({
        order: [["jour_semaine", "ASC"], ["heure_debut", "ASC"]],
    });

    // Récupérer les salles disponibles pour ce type de cours
    const sallesDisponibles = await Salle.findAll({
        where: {
            disponible: true,
            capacite: { [Op.gte]: groupe.effectif },
        },
    });

    // Récupérer les enseignants disponibles (simplifié - on prend le premier disponible)
    // Dans une vraie implémentation, il faudrait vérifier les disponibilités
    const affectationsExistantes = await Affectation.findAll({
        where: {
            date_seance: {
                [Op.between]: [date_debut, date_fin],
            },
            statut: { [Op.ne]: "annule" },
        },
        include: [{ model: Creneau, as: "creneau" }],
    });

    // Algorithme simplifié de génération
    // Note: Ceci est une version basique. Une vraie implémentation nécessiterait
    // un algorithme d'optimisation pour éviter les conflits et optimiser l'utilisation
    const suggestions = [];

    for (const creneau of creneaux) {
        for (const salle of sallesDisponibles) {
            // Vérifier si la salle est disponible à ce créneau
            const conflitSalle = affectationsExistantes.find(
                (aff) =>
                    aff.id_salle === salle.id_salle &&
                    aff.creneau?.id_creneau === creneau.id_creneau &&
                    aff.statut !== "annule"
            );

            if (!conflitSalle) {
                suggestions.push({
                    creneau: {
                        id_creneau: creneau.id_creneau,
                        jour_semaine: creneau.jour_semaine,
                        heure_debut: creneau.heure_debut,
                        heure_fin: creneau.heure_fin,
                    },
                    salle: {
                        id_salle: salle.id_salle,
                        nom_salle: salle.nom_salle,
                        capacite: salle.capacite,
                    },
                    compatible: true,
                    raison: null,
                });
            }
        }
    }

    res.json({
        message: "Suggestions de créneaux générées",
        groupe: {
            id_groupe: groupe.id_groupe,
            nom_groupe: groupe.nom_groupe,
            effectif: groupe.effectif,
        },
        cours: {
            id_cours: cours.id_cours,
            nom_cours: cours.nom_cours,
            type_cours: cours.type_cours,
        },
        periode: { date_debut, date_fin },
        suggestions: suggestions.slice(0, 10), // Limiter à 10 suggestions
        note: "Cette fonction génère des suggestions. L'admin doit créer les affectations manuellement en utilisant ces suggestions.",
    });
});

