import { DemandeReport, Affectation, Users, Cours, Groupe, Salle, Creneau } from "../models/index.js";
import { notifierAdministrateurs } from "../utils/notificationHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { enregistrerSeance, notifierChangementSeance } from "../services/planning/seances.js";
import { dateISO, dateLisible, propositionsDeReport, retenirProposition, seanceAReporter } from "../services/planning/reports.js";
import { planification, repondreErreurPlanning } from "../utils/erreursPlanning.js";
import { repondreErreur } from "../utils/erreurs.js";

// Créneau et salle retenus pour le report, joints aux demandes renvoyées
const PLACE_RETENUE = [
    { model: Creneau, as: "creneauNouveau" },
    { model: Salle, as: "salleNouvelle", attributes: ["id_salle", "nom_salle"] },
];

const LIBELLE_REFUS = "Aucun créneau libre ce jour-là";

/** Réponse 422 : pas de place à cette date ; les dates proches qui en ont, pour ne pas laisser sans issue. */
const repondreSansCreneau = (res, date, resultat) =>
    repondreErreur(res, 422, `${LIBELLE_REFUS} (${dateLisible(date)}).`, {
        code: "AUCUN_CRENEAU_LIBRE",
        donnees: { dates_proches: resultat.dates_proches, refus: resultat.refus },
    });

/**
 * Contrôleur pour les demandes de report
 */

// 🔍 Récupérer toutes les demandes de report
export const getAllDemandesReport = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});

// 🔍 Récupérer une demande de report par ID
export const getDemandeReportById = asyncHandler(async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id, {
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
    });

    const isOwner = demande?.id_user_enseignant === req.user.id_user;
    if (!demande || (req.user.role !== "admin" && !isOwner)) {
        return res
            .status(404)
            .json({ message: "Demande de report non trouvée" });
    }

    res.json(demande);
});

// Le créneau souhaité est facultatif : sans lui, le serveur retient le meilleur créneau libre de la date ;
// avec lui, il doit être libre. La salle n'est jamais saisie : celle de la séance si elle est libre, sinon une autre
const EDITABLE_FIELDS = ["motif", "nouvelle_date", "id_creneau_nouveau"];

/**
 * Charge une demande modifiable par l'utilisateur courant :
 * l'admin peut tout gérer, un enseignant seulement ses demandes encore en attente.
 * Envoie la réponse d'erreur et renvoie null si l'accès est refusé.
 */
const loadEditableDemande = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);
    const isAdmin = req.user.role === "admin";

    if (!demande || (!isAdmin && demande.id_user_enseignant !== req.user.id_user)) {
        res.status(404).json({ message: "Demande de report non trouvée" });
        return null;
    }
    if (!isAdmin && demande.statut_demande !== "en_attente") {
        res.status(400).json({
            message: "Demande déjà traitée",
            error: "Une demande approuvée ou refusée ne peut plus être modifiée",
        });
        return null;
    }
    return demande;
};

// 🔎 Créneaux et salles libres pour reporter une séance à une date (l'enseignant voit ce qui sera proposé)
export const propositionsPourSeance = planification(async (req, res) => {
    const affectation = await seanceAReporter(req.body.id_affectation, req.user);
    res.json(await propositionsDeReport({ affectation, date: req.body.date }));
});

// 🔎 Même chose pour une demande en attente, à sa date ou à une autre (approuver avec modification, admin)
export const propositionsPourDemande = planification(async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ message: "Demande de report non trouvée" });
    const affectation = await Affectation.findByPk(demande.id_affectation);
    res.json(await propositionsDeReport({ affectation, date: req.query.date || demande.nouvelle_date }));
});

// ➕ Créer une demande de report
export const createDemandeReport = planification(async (req, res) => {
    const data = pick(req.body, [...EDITABLE_FIELDS, "id_affectation"]);

    const affectation = await Affectation.findByPk(data.id_affectation);
    if (!affectation) {
        return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // L'enseignant et le statut sont déterminés par le serveur, jamais par le client
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && affectation.id_user_enseignant !== req.user.id_user) {
        return res.status(403).json({
            message: "Accès interdit",
            error: "Vous ne pouvez demander le report que de vos propres séances",
        });
    }

    const demandeEnCours = await DemandeReport.findOne({
        where: { id_affectation: affectation.id_affectation, statut_demande: "en_attente" },
    });
    if (demandeEnCours) {
        return res.status(409).json({
            message: "Demande déjà en cours",
            error: "Une demande de report est déjà en attente pour cette séance",
        });
    }

    if (!String(data.motif || "").trim()) {
        return res.status(400).json({ message: "Indiquez le motif du report" });
    }
    // Contrôle dès la demande : une date sans place, ou un créneau pris, est refusé tout de suite, avec les dates proches
    const resultat = await propositionsDeReport({ affectation, date: data.nouvelle_date });
    const retenue = retenirProposition(resultat, data.id_creneau_nouveau);
    if (!retenue) return repondreSansCreneau(res, resultat.date, resultat);

    const demande = await DemandeReport.create({
        ...data,
        nouvelle_date: resultat.date,
        id_creneau_nouveau: retenue.id_creneau,
        id_salle_nouvelle: retenue.id_salle,
        id_user_enseignant: affectation.id_user_enseignant,
        statut_demande: "en_attente",
    });

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
    });

    // Notifier les administrateurs de la nouvelle demande
    try {
        const enseignantNom = demandeComplete.enseignant 
            ? `${demandeComplete.enseignant.prenom || ''} ${demandeComplete.enseignant.nom || ''}`.trim()
            : 'Un enseignant';
        
        // Utiliser notifierAdministrateurs pour notifier tous les admins en une fois
        await notifierAdministrateurs({
            titre: "Nouvelle demande de report",
            message: `${enseignantNom} a soumis une demande de report pour le ${demandeComplete.nouvelle_date}. Motif : ${demandeComplete.motif || 'Non spécifié'}`,
            type_notification: "info",
            lien: "/gestion/demandes-report",
        });
        
        // Envoyer aussi des emails aux admins si configuré
        const { sendDemandeReportNotification } = await import("../utils/sendEmail.js");
        const admins = await Users.findAll({
            where: { role: "admin", actif: true },
            attributes: ['id_user', 'email'],
        });
        
        for (const admin of admins) {
            if (admin.email) {
                try {
                    await sendDemandeReportNotification({
                        to: admin.email,
                        demande: demandeComplete,
                    });
                } catch (emailError) {
                    console.error(`Erreur lors de l'envoi de l'email à l'admin ${admin.id_user}:`, emailError);
                }
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de la notification de demande de report:", error);
        // Ne pas bloquer la réponse si la notification échoue
    }

    res.status(201).json(demandeComplete);
});

// ✏️ Mettre à jour une demande de report
export const updateDemandeReport = planification(async (req, res) => {
    const demande = await loadEditableDemande(req, res);
    if (!demande) return;

    // Le statut ne change que via PATCH /:id/traiter (qui applique le report)
    const champs = pick(req.body, EDITABLE_FIELDS);
    if (champs.nouvelle_date || champs.id_creneau_nouveau) {
        // Nouvelle date ou nouveau créneau : la salle suit, ou refus tout de suite
        const affectation = await Affectation.findByPk(demande.id_affectation);
        const resultat = await propositionsDeReport({ affectation, date: champs.nouvelle_date || demande.nouvelle_date });
        const retenue = retenirProposition(resultat, champs.id_creneau_nouveau ?? (champs.nouvelle_date && dateISO(champs.nouvelle_date) !== dateISO(demande.nouvelle_date) ? null : demande.id_creneau_nouveau));
        if (!retenue) return repondreSansCreneau(res, resultat.date, resultat);
        Object.assign(champs, { nouvelle_date: resultat.date, id_creneau_nouveau: retenue.id_creneau, id_salle_nouvelle: retenue.id_salle });
    }
    await demande.update(champs);

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
    });

    res.json(demandeComplete);
});

// ✅ Valider ou refuser une demande de report
export const traiterDemandeReport = planification(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // "approuver" ou "refuser"

    if (!action || !["approuver", "refuser"].includes(action)) {
        return res.status(400).json({
            message: "Action invalide",
            error: "L'action doit être 'approuver' ou 'refuser'",
        });
    }

    const demande = await DemandeReport.findByPk(id, {
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
    });

    if (!demande) {
        return res.status(404).json({
            message: "Demande de report non trouvée",
        });
    }

    if (demande.statut_demande !== "en_attente") {
        return res.status(400).json({
            message: "Demande déjà traitée",
            error: `Cette demande a déjà été ${demande.statut_demande === "approuve" ? "approuvée" : "refusée"}`,
        });
    }

    const nouveauStatut = action === "approuver" ? "approuve" : "refuse";

    // Approuver = déplacer la séance, sous les mêmes règles qu'une séance créée à la main :
    // 409 si une règle bloque (la demande reste en attente), sauf forçage justifié. Sans choix de
    // l'administration, le créneau et la salle sont ceux de la demande, recalculés au jour de la
    // décision ; avec « id_creneau » (et « id_salle », « date »), c'est l'approbation avec modification.
    if (action === "approuver") {
        const affectation = await Affectation.findByPk(demande.id_affectation, { include: [{ model: Creneau, as: "creneau" }, { model: Cours, as: "cours" }] });
        if (!affectation) {
            return res.status(404).json({ message: "Affectation non trouvée" });
        }

        const date = dateISO(req.body.date || demande.nouvelle_date);
        let creneau;
        let idSalle;
        if (req.body.id_creneau) {
            creneau = await Creneau.findByPk(req.body.id_creneau);
            idSalle = req.body.id_salle === undefined ? affectation.id_salle : req.body.id_salle;
            if (!creneau) return repondreErreur(res, 404, "Créneau introuvable");
        } else {
            const resultat = await propositionsDeReport({ affectation, date });
            const retenue = resultat.propositions.find((p) => p.id_creneau === demande.id_creneau_nouveau) ?? resultat.propositions[0];
            if (!retenue) {
                return repondreErreur(res, 409, `${LIBELLE_REFUS} (${dateLisible(date)}) : choisissez une autre date ou un autre créneau.`, {
                    code: "AUCUN_CRENEAU_LIBRE",
                    violations: [{ code: "aucun_creneau_libre", bloquant: true, message: LIBELLE_REFUS }],
                    donnees: { dates_proches: resultat.dates_proches, refus: resultat.refus },
                });
            }
            creneau = await Creneau.findByPk(retenue.id_creneau);
            idSalle = retenue.id_salle;
        }

        const ancienneDate = affectation.date_seance;
        try {
            await enregistrerSeance({
                id: affectation.id_affectation,
                donnees: {
                    date_seance: date,
                    id_creneau: creneau.id_creneau,
                    id_salle: idSalle ?? null,
                    statut: "reporte",
                    // Première date et heure de la séance, gardées même après plusieurs reports
                    date_seance_initiale: affectation.date_seance_initiale ?? affectation.date_seance,
                    id_creneau_initial: affectation.id_creneau_initial ?? affectation.id_creneau,
                },
                user: req.user,
                forcer: req.body.forcer === true,
                justification: req.body.justification,
                action: "report",
            });
        } catch (error) {
            // Au format commun (A-5) : 409 et règles enfreintes, 4xx métier ; sinon l'erreur remonte
            return repondreErreurPlanning(res, error);
        }
        await demande.update({ statut_demande: nouveauStatut, nouvelle_date: date, id_creneau_nouveau: creneau.id_creneau, id_salle_nouvelle: idSalle ?? null });

        const heure = String(creneau.heure_debut).slice(0, 5);
        const coursNom = affectation.cours?.nom_cours || "votre cours";
        const nouvelleDate = dateLisible(date);
        try {
            const { creerNotification } = await import("../utils/notificationHelper.js");
            await creerNotification({
                id_user: affectation.id_user_enseignant,
                titre: "Demande de report approuvée",
                message: `Votre demande de report pour « ${coursNom} » a été approuvée : ${nouvelleDate} à ${heure}.`,
                type_notification: "success",
                lien: `/emploi-du-temps/enseignant?date=${date}`,
            });
            const { sendReportConfirmation } = await import("../utils/sendEmail.js");
            const enseignant = await Users.findByPk(affectation.id_user_enseignant, { attributes: ["email"] });
            if (enseignant?.email) {
                await sendReportConfirmation({ to: enseignant.email, demande, affectation: await Affectation.findByPk(affectation.id_affectation, { include: [{ model: Cours, as: "cours" }, { model: Salle, as: "salle" }, { model: Creneau, as: "creneau" }] }) });
            }
        } catch (error) {
            console.error("Erreur lors de la notification de l'enseignant:", error);
        }
        // Étudiants du groupe et de ses sous-groupes : le lien ouvre la semaine de la nouvelle date
        await notifierChangementSeance({
            affectation,
            notifierEnseignant: false,
            titre: "Séance reportée",
            message: `« ${coursNom} » du ${dateLisible(ancienneDate)} est reportée au ${nouvelleDate} à ${heure}.`,
            lien: `/emploi-du-temps/etudiant?date=${date}`,
        });
    } else {
        // Un refus peut s'expliquer : la raison, si l'administration la donne, est gardée et lue par l'enseignant
        const raison = String(req.body.motif || "").trim();
        await demande.update({ statut_demande: nouveauStatut, motif_decision: raison || null });
        try {
            const { creerNotification } = await import("../utils/notificationHelper.js");
            await creerNotification({
                id_user: demande.id_user_enseignant,
                titre: "Demande de report refusée",
                message: `Votre demande de report au ${dateLisible(demande.nouvelle_date)} n'a pas été retenue.${raison ? ` Raison : ${raison}` : ""} Vous pouvez faire une nouvelle demande pour une autre date.`,
                type_notification: "error",
                lien: "/demandes-report",
            });
        } catch (error) {
            console.error("Erreur lors de la notification de refus:", error);
        }
    }

    const demandeComplete = await DemandeReport.findByPk(demande.id_demande, {
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
    });

    res.json({
        message: `Demande ${action === "approuver" ? "approuvée" : "refusée"} avec succès`,
        demande: demandeComplete,
    });
});

// 🗑️ Supprimer une demande de report
export const deleteDemandeReport = asyncHandler(async (req, res) => {
    const demande = await loadEditableDemande(req, res);
    if (!demande) return;

    await demande.destroy();

    res.json({ message: "Demande de report supprimée avec succès" });
});

// 🔍 Récupérer les demandes de report par enseignant
export const getDemandesReportByEnseignant = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { id_user_enseignant: req.params.id_enseignant },
        include: [
            ...PLACE_RETENUE,
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});

// 🔍 Récupérer les demandes de report par statut
export const getDemandesReportByStatut = asyncHandler(async (req, res) => {
    const demandes = await DemandeReport.findAll({
        where: { statut_demande: req.params.statut },
        include: [
            ...PLACE_RETENUE,
            {
                model: Users,
                as: "enseignant",
                attributes: { exclude: ["password_hash"] },
            },
            {
                model: Affectation,
                as: "affectation",
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
            },
        ],
        order: [["date_demande", "DESC"]],
    });

    res.json(demandes);
});
