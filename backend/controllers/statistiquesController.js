import { Affectation, AnneeUniversitaire, Salle, Creneau, Users, Groupe, Cours, Filiere, Conflit } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/*
 * Les totaux sont calculés par MySQL (GROUP BY) : on ne charge plus toutes les séances en mémoire
 * pour les additionner en JavaScript (une année ≈ 18 000 séances : plus d'une seconde par appel).
 * Les heures se déduisent du nombre de séances par créneau × la durée du créneau.
 */

const HEURES_DISPO_PAR_SEMAINE = 40; // On suppose une semaine de 40 h ouvrées (5 jours × 8 h)
const arrondi = (x) => Math.round(x * 100) / 100;

/** Séances non annulées, sur la période demandée s'il y en a une. */
const filtreSeances = ({ date_debut, date_fin }, autres = {}) => ({
    statut: { [Op.ne]: "annule" },
    ...(date_debut && date_fin ? { date_seance: { [Op.between]: [date_debut, date_fin] } } : {}),
    ...autres,
});

const periodeDe = ({ date_debut, date_fin, annee_libelle }) => (date_debut && date_fin ? { date_debut, date_fin, annee: annee_libelle ?? null } : null);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Périmètre des statistiques. Par défaut, l'année universitaire en cours (celle qui contient
 * aujourd'hui, sinon l'année active, sinon la dernière commencée) : les calculs ne lisent que ses
 * séances (index sur la date) au lieu de tout l'historique, qui grandit chaque année.
 * L'administration peut aussi choisir : ?date_debut=…&date_fin=… (période libre), ?id_annee=…
 * (une autre année) ou ?portee=tout (toutes les années).
 */
export const perimetreStatistiques = async (req, res, next) => {
    const { date_debut, date_fin, id_annee, portee } = req.query;
    if (DATE.test(String(date_debut ?? "")) && DATE.test(String(date_fin ?? ""))) return next();
    delete req.query.date_debut;
    delete req.query.date_fin;
    if (portee === "tout") return next();

    const aujourdhui = new Date().toLocaleDateString("en-CA", { timeZone: process.env.APP_TIMEZONE || "Africa/Casablanca" });
    const annee = id_annee
        ? await AnneeUniversitaire.findByPk(Number(id_annee) || 0)
        : (await AnneeUniversitaire.findOne({ where: { date_debut: { [Op.lte]: aujourdhui }, date_fin: { [Op.gte]: aujourdhui } } })) ||
          (await AnneeUniversitaire.findOne({ where: { active: true } })) ||
          (await AnneeUniversitaire.findOne({ where: { date_debut: { [Op.lte]: aujourdhui } }, order: [["date_debut", "DESC"]] }));
    if (id_annee && !annee) return res.status(404).json({ message: "Année universitaire introuvable" });
    if (annee) {
        req.query.date_debut = String(annee.date_debut).slice(0, 10);
        req.query.date_fin = String(annee.date_fin).slice(0, 10);
        req.query.annee_libelle = annee.libelle;
    }
    return next();
};

/**
 * Nombre de séances par combinaison de colonnes (`cles`), avec la première séance rencontrée
 * (`premiere`) pour garder l'ordre d'apparition des anciennes réponses en cas d'égalité.
 */
const compter = (where, cles, include) =>
    Affectation.findAll({
        where,
        include,
        attributes: [
            ...cles.map((c) => (Array.isArray(c) ? c : [sequelize.col(`Affectation.${c}`), c])),
            [sequelize.fn("COUNT", sequelize.col("Affectation.id_affectation")), "n"],
            [sequelize.fn("MIN", sequelize.col("Affectation.id_affectation")), "premiere"],
        ],
        group: cles.map((c) => (Array.isArray(c) ? c[1] : `Affectation.${c}`)),
        order: [[sequelize.literal("premiere"), "ASC"]],
        raw: true,
    }).then((lignes) => lignes.map((l) => ({ ...l, n: Number(l.n) })));

const creneauxParId = async () => new Map((await Creneau.findAll({ raw: true })).map((c) => [c.id_creneau, c]));
const heuresDe = (ligne, creneaux) => (ligne.n * (creneaux.get(ligne.id_creneau)?.duree_minutes ?? 0)) / 60;

/** Additionne séances et heures par clé (lignes groupées par clé et créneau). */
const cumuler = (lignes, creneaux, cle) => {
    const parCle = new Map();
    for (const l of lignes) {
        const cumul = parCle.get(l[cle]) ?? { nombre_seances: 0, total_heures: 0 };
        cumul.nombre_seances += l.n;
        cumul.total_heures += heuresDe(l, creneaux);
        parCle.set(l[cle], cumul);
    }
    return parCle;
};

/**
 * GET /api/statistiques/salles/occupation
 * Taux d'occupation global des salles
 */
export const getOccupationSalles = asyncHandler(async (req, res) => {
    const [salles, lignes, creneaux] = await Promise.all([
        Salle.findAll({ where: { disponible: true }, raw: true }),
        compter(filtreSeances(req.query), ["id_salle", "id_creneau"]),
        creneauxParId(),
    ]);
    const parSalle = cumuler(lignes, creneaux, "id_salle");

    const occupationParSalle = salles.map((salle) => {
        const { nombre_seances = 0, total_heures = 0 } = parSalle.get(salle.id_salle) ?? {};
        return {
            id_salle: salle.id_salle,
            nom_salle: salle.nom_salle,
            type_salle: salle.type_salle,
            capacite: salle.capacite,
            nombre_seances,
            total_heures: arrondi(total_heures),
            taux_occupation: arrondi((total_heures / HEURES_DISPO_PAR_SEMAINE) * 100),
        };
    });

    const tauxOccupationGlobal = occupationParSalle.reduce((sum, salle) => sum + salle.taux_occupation, 0) / occupationParSalle.length;

    res.json({
        periode: periodeDe(req.query),
        taux_occupation_global: arrondi(tauxOccupationGlobal),
        salles: occupationParSalle.sort((a, b) => b.taux_occupation - a.taux_occupation),
    });
});

/**
 * GET /api/statistiques/salles/:id/occupation
 * Occupation d'une salle spécifique
 */
export const getOccupationSalle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const salle = await Salle.findByPk(id);
    if (!salle) {
        return res.status(404).json({ message: "Salle non trouvée" });
    }

    const [lignes, creneaux] = await Promise.all([compter(filtreSeances(req.query, { id_salle: id }), ["id_creneau"]), creneauxParId()]);

    let totalHeures = 0;
    let nombreSeances = 0;
    // Statistiques par jour de la semaine
    const statsParJour = {};
    for (const l of lignes) {
        const heures = heuresDe(l, creneaux);
        totalHeures += heures;
        nombreSeances += l.n;
        const jour = creneaux.get(l.id_creneau)?.jour_semaine;
        if (jour) {
            statsParJour[jour] ??= { nombre_seances: 0, heures: 0 };
            statsParJour[jour].nombre_seances += l.n;
            statsParJour[jour].heures += heures;
        }
    }

    res.json({
        salle: {
            id_salle: salle.id_salle,
            nom_salle: salle.nom_salle,
            type_salle: salle.type_salle,
            capacite: salle.capacite,
        },
        periode: periodeDe(req.query),
        statistiques: {
            nombre_seances: nombreSeances,
            total_heures: arrondi(totalHeures),
            taux_occupation: arrondi((totalHeures / HEURES_DISPO_PAR_SEMAINE) * 100),
            stats_par_jour: statsParJour,
        },
    });
});

/**
 * GET /api/statistiques/salles/frequence
 * Fréquence d'utilisation des salles
 */
export const getFrequenceSalles = asyncHandler(async (req, res) => {
    const frequence = await Affectation.findAll({
        where: filtreSeances(req.query),
        include: [{ model: Salle, as: "salle", attributes: ["nom_salle"] }],
        attributes: ["id_salle", [sequelize.fn("COUNT", sequelize.col("Affectation.id_affectation")), "count"]],
        group: ["id_salle"],
        order: [[sequelize.literal("count"), "DESC"]],
    });

    res.json({
        periode: periodeDe(req.query),
        frequence_utilisation: frequence.map((item) => ({
            id_salle: item.id_salle,
            nom_salle: item.salle?.nom_salle,
            nombre_utilisations: item.get("count"),
        })),
    });
});

/** Nombre de séances par jour et heure de début (créneaux de même horaire regroupés). */
const activiteParCreneau = async (query) => {
    const [lignes, creneaux] = await Promise.all([compter(filtreSeances(query), ["id_creneau"]), creneauxParId()]);
    const activite = {};
    for (const l of lignes) {
        const creneau = creneaux.get(l.id_creneau);
        if (!creneau) continue;
        const key = `${creneau.jour_semaine}_${creneau.heure_debut}`;
        activite[key] ??= { jour: creneau.jour_semaine, heure_debut: creneau.heure_debut, heure_fin: creneau.heure_fin, nombre_seances: 0 };
        activite[key].nombre_seances += l.n;
    }
    return activite;
};

/**
 * GET /api/statistiques/activite/heures-creuses
 * Identifier les heures creuses
 */
export const getHeuresCreuses = asyncHandler(async (req, res) => {
    const activite = await activiteParCreneau(req.query);

    // Identifier les heures creuses (moins de 2 séances)
    const heuresCreuses = Object.values(activite)
        .filter((creneau) => creneau.nombre_seances < 2)
        .sort((a, b) => a.jour.localeCompare(b.jour) || a.heure_debut.localeCompare(b.heure_debut));

    res.json({
        periode: periodeDe(req.query),
        heures_creuses: heuresCreuses,
        total_creneaux_analyses: Object.keys(activite).length,
    });
});

/**
 * GET /api/statistiques/activite/pics
 * Identifier les pics d'activité
 */
export const getPicsActivite = asyncHandler(async (req, res) => {
    const activite = await activiteParCreneau(req.query);

    // Identifier les pics (plus de 5 séances)
    const pics = Object.values(activite)
        .filter((creneau) => creneau.nombre_seances >= 5)
        .sort((a, b) => b.nombre_seances - a.nombre_seances);

    res.json({
        periode: periodeDe(req.query),
        pics_activite: pics,
        total_creneaux_analyses: Object.keys(activite).length,
    });
});

/**
 * GET /api/statistiques/enseignants/charge
 * Charge de travail des enseignants
 */
export const getChargeEnseignants = asyncHandler(async (req, res) => {
    const where = filtreSeances(req.query);
    const [lignes, coursDistincts, creneaux] = await Promise.all([
        compter(where, ["id_user_enseignant", "id_creneau"]),
        Affectation.findAll({
            where,
            include: [{ model: Cours, as: "cours", attributes: [] }],
            attributes: ["id_user_enseignant", [sequelize.literal("COUNT(DISTINCT CAST(`cours`.`nom_cours` AS BINARY))"), "nombre"]],
            group: ["Affectation.id_user_enseignant"],
            raw: true,
        }),
        creneauxParId(),
    ]);
    const parEnseignant = cumuler(lignes, creneaux, "id_user_enseignant");
    const nbCours = new Map(coursDistincts.map((c) => [c.id_user_enseignant, Number(c.nombre)]));
    const enseignants = await Users.findAll({ where: { id_user: [...parEnseignant.keys()] }, attributes: ["id_user", "nom", "prenom"], raw: true });
    const parId = new Map(enseignants.map((e) => [e.id_user, e]));

    const result = [...parEnseignant]
        .filter(([id]) => parId.has(id))
        .map(([id, cumul]) => ({
            id_user: id,
            nom: parId.get(id).nom,
            prenom: parId.get(id).prenom,
            nombre_seances: cumul.nombre_seances,
            total_heures: arrondi(cumul.total_heures),
            nombre_cours_differents: nbCours.get(id) ?? 0,
        }));

    res.json({
        periode: periodeDe(req.query),
        charge_enseignants: result.sort((a, b) => b.total_heures - a.total_heures),
    });
});

/**
 * GET /api/statistiques/groupes/occupation
 * Occupation par groupe
 */
export const getOccupationGroupes = asyncHandler(async (req, res) => {
    const [lignes, creneaux] = await Promise.all([compter(filtreSeances(req.query), ["id_groupe", "id_creneau"]), creneauxParId()]);
    const parGroupe = cumuler(lignes, creneaux, "id_groupe");
    const groupes = await Groupe.findAll({ where: { id_groupe: [...parGroupe.keys()] }, attributes: ["id_groupe", "nom_groupe", "niveau"], raw: true });
    const parId = new Map(groupes.map((g) => [g.id_groupe, g]));

    const result = [...parGroupe]
        .filter(([id]) => parId.has(id))
        .map(([id, cumul]) => ({
            id_groupe: id,
            nom_groupe: parId.get(id).nom_groupe,
            niveau: parId.get(id).niveau,
            nombre_seances: cumul.nombre_seances,
            total_heures: arrondi(cumul.total_heures),
        }));

    res.json({
        periode: periodeDe(req.query),
        occupation_groupes: result.sort((a, b) => b.total_heures - a.total_heures),
    });
});

/**
 * GET /api/statistiques/dashboard
 * Tableau de bord complet avec toutes les statistiques
 */
export const getDashboard = asyncHandler(async (req, res) => {
    const where = filtreSeances(req.query);

    const [distincts, totalSalles, totalEnseignants, totalGroupes, totalUsers, totalCours, totalAdmins, parCreneau, creneaux] = await Promise.all([
        Affectation.findOne({
            where,
            attributes: [
                [sequelize.fn("COUNT", sequelize.col("id_affectation")), "seances"],
                [sequelize.literal("COUNT(DISTINCT `id_salle`)"), "salles"],
                [sequelize.literal("COUNT(DISTINCT `id_user_enseignant`)"), "enseignants"],
            ],
            raw: true,
        }),
        Salle.count({ where: { disponible: true } }),
        Users.count({ where: { role: "enseignant", actif: true } }),
        Groupe.count(),
        Users.count({ where: { actif: true } }),
        Cours.count(),
        Users.count({ where: { role: "admin", actif: true } }),
        compter(where, ["id_creneau"]),
        creneauxParId(),
    ]);

    const totalHeures = parCreneau.reduce((s, l) => s + heuresDe(l, creneaux), 0);

    res.json({
        periode: periodeDe(req.query),
        resume: {
            total_users: totalUsers,
            total_admins: totalAdmins,
            total_affectations: Number(distincts.seances),
            total_salles: totalSalles,
            salles_utilisees: Number(distincts.salles),
            total_enseignants: totalEnseignants,
            enseignants_actifs: Number(distincts.enseignants),
            total_groupes: totalGroupes,
            total_cours: totalCours,
            total_heures: arrondi(totalHeures),
        },
        note: "Utilisez les endpoints spécifiques pour des statistiques détaillées",
    });
});

/**
 * GET /api/statistiques/kpis
 * KPIs consolidés pour le tableau de bord administrateur
 * Retourne tous les indicateurs en un seul appel
 */
export const getKPIs = asyncHandler(async (req, res) => {
    const where = filtreSeances(req.query);

    const [parSalle, parEnseignant, parGroupe, parCreneau, parFiliere, creneaux, sallesDisponibles, totalConflits, conflitsNonResolus, filieres, groupesAll] = await Promise.all([
        compter(where, ["id_salle", "id_creneau"]),
        compter(where, ["id_user_enseignant", "id_creneau"]),
        compter(where, ["id_groupe", "id_creneau"]),
        compter(where, ["id_creneau"]),
        compter(where, [[sequelize.col("cours.id_filiere"), "id_filiere"], "id_creneau"], [{ model: Cours, as: "cours", attributes: [] }]),
        creneauxParId(),
        Salle.findAll({ where: { disponible: true }, attributes: ["id_salle", "nom_salle"], raw: true }),
        Conflit.count(),
        Conflit.count({ where: { resolu: false } }),
        Filiere.findAll({ attributes: ["id_filiere", "nom_filiere"], raw: true }),
        Groupe.findAll({ attributes: ["id_groupe", "effectif"], raw: true }),
    ]);
    const totalSallesDisponibles = sallesDisponibles.length;

    // ── 1. Taux d'occupation des salles ──────────────────────────────
    const heuresParSalle = new Map([...cumuler(parSalle, creneaux, "id_salle")].map(([id, c]) => [id, c.total_heures]).filter(([, h]) => h > 0));
    const totalHeuresUtilisees = [...heuresParSalle.values()].reduce((s, h) => s + h, 0);
    const tauxOccupationSalles =
        totalSallesDisponibles > 0 ? Math.min(100, Math.round((totalHeuresUtilisees / (totalSallesDisponibles * HEURES_DISPO_PAR_SEMAINE)) * 10000) / 100) : 0;
    const sallesOccupees = heuresParSalle.size;
    const sallesStats = sallesDisponibles
        .map((s) => ({
            nom: s.nom_salle,
            heures: arrondi(heuresParSalle.get(s.id_salle) || 0),
            taux: Math.min(100, Math.round(((heuresParSalle.get(s.id_salle) || 0) / HEURES_DISPO_PAR_SEMAINE) * 10000) / 100),
        }))
        .sort((a, b) => b.taux - a.taux)
        .slice(0, 10);

    // ── 2. Moyenne d'heures par enseignant ───────────────────────────
    const heuresParEnseignant = [...cumuler(parEnseignant, creneaux, "id_user_enseignant").values()].map((c) => c.total_heures).filter((h) => h > 0);
    const enseignantsAvecHeures = heuresParEnseignant.length;
    const totalHeuresEnseignants = heuresParEnseignant.reduce((s, h) => s + h, 0);
    const moyenneHeuresEnseignant = enseignantsAvecHeures > 0 ? arrondi(totalHeuresEnseignants / enseignantsAvecHeures) : 0;

    // ── 3. Moyenne d'heures par étudiant (via groupes) ───────────────
    const heuresParGroupe = cumuler(parGroupe, creneaux, "id_groupe");
    let totalEtudiantsConcernes = 0;
    let totalHeuresEtudiants = 0;
    groupesAll.forEach((g) => {
        const effectif = g.effectif || 1;
        const heures = heuresParGroupe.get(g.id_groupe)?.total_heures || 0;
        if (heures > 0) {
            totalEtudiantsConcernes += effectif;
            totalHeuresEtudiants += heures * effectif;
        }
    });
    const moyenneHeuresEtudiant = totalEtudiantsConcernes > 0 ? arrondi(totalHeuresEtudiants / totalEtudiantsConcernes) : 0;

    // ── 4. Créneaux les plus demandés ────────────────────────────────
    const creneauxLesPlusDemandes = parCreneau
        .filter((l) => creneaux.has(l.id_creneau))
        .map((l) => {
            const c = creneaux.get(l.id_creneau);
            return { id: l.id_creneau, label: `${c.jour_semaine} ${c.heure_debut}-${c.heure_fin}`, jour: c.jour_semaine, heure_debut: c.heure_debut, heure_fin: c.heure_fin, count: l.n };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);

    // ── 5. Taux de conflits de réservation ───────────────────────────
    const totalAffectations = parCreneau.reduce((s, l) => s + l.n, 0);
    const tauxConflits = totalAffectations > 0 ? Math.round((conflitsNonResolus / totalAffectations) * 10000) / 100 : 0;

    // ── 6. Durée moyenne des cours ───────────────────────────────────
    const avecDuree = parCreneau.filter((l) => creneaux.get(l.id_creneau)?.duree_minutes);
    const nbAvecDuree = avecDuree.reduce((s, l) => s + l.n, 0);
    const dureeMoyenneCours = nbAvecDuree > 0 ? arrondi(avecDuree.reduce((s, l) => s + l.n * creneaux.get(l.id_creneau).duree_minutes, 0) / nbAvecDuree) : 0;

    // ── 7. Répartition des cours par filière ─────────────────────────
    const repartitionParFiliere = {};
    const nomFiliere = new Map(filieres.map((f) => [f.id_filiere, f.nom_filiere]));
    filieres.forEach((f) => {
        // id_filiere : le frontend utilise la même couleur de ligne partout
        repartitionParFiliere[f.nom_filiere] = { id_filiere: f.id_filiere, nom: f.nom_filiere, nombre_seances: 0, nombre_heures: 0 };
    });
    for (const l of parFiliere) {
        const nom = nomFiliere.get(l.id_filiere);
        if (!nom) continue;
        repartitionParFiliere[nom].nombre_seances += l.n;
        repartitionParFiliere[nom].nombre_heures += heuresDe(l, creneaux);
    }
    Object.values(repartitionParFiliere).forEach((f) => {
        f.nombre_heures = arrondi(f.nombre_heures);
    });

    res.json({
        periode: periodeDe(req.query),
        kpis: {
            taux_occupation_salles: {
                valeur: tauxOccupationSalles,
                unite: "%",
                detail: { salles_occupees: sallesOccupees, total_salles: totalSallesDisponibles },
                graphique: sallesStats,
            },
            moyenne_heures_enseignant: {
                valeur: moyenneHeuresEnseignant,
                unite: "h",
                detail: { enseignants_actifs: enseignantsAvecHeures, total_heures: arrondi(totalHeuresEnseignants) },
            },
            moyenne_heures_etudiant: {
                valeur: moyenneHeuresEtudiant,
                unite: "h",
                detail: { etudiants_concernes: totalEtudiantsConcernes },
            },
            creneaux_les_plus_demandes: {
                top: creneauxLesPlusDemandes,
            },
            taux_conflits: {
                valeur: tauxConflits,
                unite: "%",
                detail: {
                    conflits_non_resolus: conflitsNonResolus,
                    total_conflits: totalConflits,
                    total_affectations: totalAffectations,
                },
            },
            duree_moyenne_cours: {
                valeur: dureeMoyenneCours,
                unite: "min",
                valeur_heures: arrondi(dureeMoyenneCours / 60),
            },
            repartition_par_filiere: {
                data: Object.values(repartitionParFiliere).sort((a, b) => b.nombre_seances - a.nombre_seances),
            },
        },
    });
});
