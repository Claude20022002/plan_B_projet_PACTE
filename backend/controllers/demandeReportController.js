import { DemandeReport, Affectation, Creneau } from "../models/index.js";
import { creerNotification } from "../utils/notificationHelper.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pick } from "../utils/validationHelper.js";
import { dateISO, dateLisible, propositionsDeReport, retenirProposition, seanceAReporter } from "../services/planning/reports.js";
import { notifierNouvelleDemande, notifierPropositionAConfirmer, verifierPlace } from "../services/planning/reportDecision.js";
import { planification } from "../utils/erreursPlanning.js";
import { repondreErreur } from "../utils/erreurs.js";
import { LIBELLE_REFUS, demandeComplete, inclusionsDemande, repondreSansCreneau } from "./reportCommun.js";

/**
 * Demandes de report : l'enseignant demande (le système retient un créneau et une salle libres),
 * l'administration valide ou refuse. Valider ne déplace pas encore la séance : la demande passe
 * « a_confirmer » et l'enseignant confirme ou propose un autre créneau
 * (controllers/reportConfirmationController.js).
 */

// Une demande en cours bloque une nouvelle demande sur la même séance
const STATUTS_EN_COURS = ["en_attente", "a_confirmer"];

// 🔍 Récupérer toutes les demandes de report
export const getAllDemandesReport = asyncHandler(async (req, res) => {
    res.json(await DemandeReport.findAll({ include: inclusionsDemande(), order: [["date_demande", "DESC"]] }));
});

// 🔍 Récupérer une demande de report par ID
export const getDemandeReportById = asyncHandler(async (req, res) => {
    const demande = await demandeComplete(req.params.id);
    const isOwner = demande?.id_user_enseignant === req.user.id_user;
    if (!demande || (req.user.role !== "admin" && !isOwner)) {
        return res.status(404).json({ message: "Demande de report non trouvée" });
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
            error: "Une demande validée ou refusée ne peut plus être modifiée",
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
        where: { id_affectation: affectation.id_affectation, statut_demande: STATUTS_EN_COURS },
    });
    if (demandeEnCours) {
        return res.status(409).json({
            message: "Demande déjà en cours",
            error: "Une demande de report est déjà en cours pour cette séance",
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
        // La séance telle qu'elle est à la demande : elle reste la « date d'origine » après le report
        date_seance_origine: affectation.date_seance,
        id_creneau_origine: affectation.id_creneau,
    });

    const complete = await demandeComplete(demande.id_demande);
    await notifierNouvelleDemande(complete);
    res.status(201).json(complete);
});

// ✏️ Mettre à jour une demande de report
export const updateDemandeReport = planification(async (req, res) => {
    const demande = await loadEditableDemande(req, res);
    if (!demande) return;

    // Le statut ne change que via PATCH /:id/traiter et /:id/confirmer
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
    res.json(await demandeComplete(demande.id_demande));
});

/**
 * La place que l'administration valide : sans choix, celle de la demande recalculée au jour de la
 * décision (la meilleure si elle a été prise entre-temps) ; avec « id_creneau » (et « id_salle »,
 * « date »), son propre choix. Envoie la réponse et renvoie null s'il n'y a plus de place.
 */
const placeValidee = async (req, res, demande, affectation) => {
    const date = dateISO(req.body.date || demande.nouvelle_date);
    if (req.body.id_creneau) {
        if (!(await Creneau.findByPk(req.body.id_creneau))) {
            repondreErreur(res, 404, "Créneau introuvable");
            return null;
        }
        const id_salle = req.body.id_salle === undefined ? affectation.id_salle : req.body.id_salle;
        return { date, id_creneau: Number(req.body.id_creneau), id_salle };
    }
    const resultat = await propositionsDeReport({ affectation, date });
    const retenue = resultat.propositions.find((p) => p.id_creneau === demande.id_creneau_nouveau) ?? resultat.propositions[0];
    if (!retenue) {
        repondreErreur(res, 409, `${LIBELLE_REFUS} (${dateLisible(date)}) : choisissez une autre date ou un autre créneau.`, {
            code: "AUCUN_CRENEAU_LIBRE",
            violations: [{ code: "aucun_creneau_libre", bloquant: true, message: LIBELLE_REFUS }],
            donnees: { dates_proches: resultat.dates_proches, refus: resultat.refus },
        });
        return null;
    }
    return { date, id_creneau: retenue.id_creneau, id_salle: retenue.id_salle };
};

// ✅ Valider ou refuser une demande de report (administration)
export const traiterDemandeReport = planification(async (req, res) => {
    const { action } = req.body; // "approuver" ou "refuser"
    if (!["approuver", "refuser"].includes(action)) {
        return res.status(400).json({ message: "Action invalide", error: "L'action doit être 'approuver' ou 'refuser'" });
    }

    const demande = await DemandeReport.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ message: "Demande de report non trouvée" });
    // Une proposition encore à confirmer peut être retirée (refusée), pas revalidée
    const traitable = action === "refuser" ? STATUTS_EN_COURS : ["en_attente"];
    if (!traitable.includes(demande.statut_demande)) {
        return res.status(400).json({ message: "Demande déjà traitée", error: "Cette demande n'attend plus de décision de l'administration" });
    }

    if (action === "approuver") {
        // Valider = proposer la place à l'enseignant, sous les mêmes règles qu'une séance saisie :
        // 409 si une règle bloque (la demande reste en attente), sauf forçage justifié, appliqué à la confirmation
        const affectation = await Affectation.findByPk(demande.id_affectation);
        if (!affectation) return res.status(404).json({ message: "Affectation non trouvée" });
        const place = await placeValidee(req, res, demande, affectation);
        if (!place) return;
        const forcer = req.body.forcer === true;
        await verifierPlace(affectation, place, { forcer, justification: req.body.justification });
        await demande.update({
            statut_demande: "a_confirmer",
            nouvelle_date: place.date,
            id_creneau_nouveau: place.id_creneau,
            id_salle_nouvelle: place.id_salle ?? null,
            id_user_decision: req.user.id_user,
            justification_forcage: forcer ? String(req.body.justification).trim() : null,
        });
        await notifierPropositionAConfirmer(demande, affectation);
    } else {
        // Un refus peut s'expliquer : la raison, si l'administration la donne, est gardée et lue par l'enseignant
        const raison = String(req.body.motif || "").trim();
        await demande.update({ statut_demande: "refuse", motif_decision: raison || null, id_user_decision: req.user.id_user });
        try {
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

    res.json({
        message: action === "approuver" ? "Report validé : l'enseignant doit le confirmer" : "Demande refusée",
        demande: await demandeComplete(demande.id_demande),
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
    res.json(
        await DemandeReport.findAll({
            where: { id_user_enseignant: req.params.id_enseignant },
            include: inclusionsDemande({ avecEnseignant: false }),
            order: [["date_demande", "DESC"]],
        })
    );
});

// 🔍 Récupérer les demandes de report par statut
export const getDemandesReportByStatut = asyncHandler(async (req, res) => {
    res.json(await DemandeReport.findAll({ where: { statut_demande: req.params.statut }, include: inclusionsDemande(), order: [["date_demande", "DESC"]] }));
});
