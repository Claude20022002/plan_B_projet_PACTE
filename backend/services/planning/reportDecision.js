import { Affectation, Cours, Creneau, Salle, Users } from "../../models/index.js";
import { creerNotification, notifierAdministrateurs } from "../../utils/notificationHelper.js";
import { ViolationsBloquantes, enregistrerSeance, notifierChangementSeance, verifierSeance } from "./seances.js";
import { dateISO, dateLisible } from "./reports.js";
import { ErreurMetier } from "./enseignements.js";

/**
 * Décision d'un report (décision du 21 octobre 2026) : le système propose un créneau et une salle,
 * l'administration valide (la demande passe « a_confirmer », la séance ne bouge pas), puis
 * l'enseignant accepte ou propose un autre créneau, que le serveur vérifie. La séance n'est
 * déplacée, et les étudiants prévenus, qu'une fois le report confirmé.
 */

/** La séance telle qu'elle serait au nouveau créneau, pour la vérifier sans l'enregistrer. */
const seanceDeplacee = (affectation, { date, id_creneau, id_salle }) => ({
    ...affectation.get({ plain: true }),
    date_seance: dateISO(date),
    id_creneau,
    id_salle: id_salle ?? null,
});

/**
 * Vérifie que la place tient encore sous toutes les règles (enseignant, groupe et sous-groupes,
 * salle, capacité, équipements). Lève ViolationsBloquantes (409) si une règle bloque, sauf
 * forçage de l'administration, justifié.
 */
export const verifierPlace = async (affectation, place, { forcer = false, justification = null } = {}) => {
    const { violations } = await verifierSeance(seanceDeplacee(affectation, place));
    if (!violations.some((v) => v.bloquant)) return;
    if (!forcer) throw new ViolationsBloquantes(violations);
    if (!String(justification || "").trim()) throw new ErreurMetier("Indiquez pourquoi le report est validé malgré les règles", 400);
};

/** « lundi 30 novembre 2026 à 09:00, salle G-R1 » : la place telle qu'on la lit. */
export const placeLisible = async ({ date, id_creneau, id_salle }) => {
    const [creneau, salle] = await Promise.all([Creneau.findByPk(id_creneau), id_salle ? Salle.findByPk(id_salle) : null]);
    return `${dateLisible(date)} à ${String(creneau?.heure_debut ?? "").slice(0, 5)}${salle ? `, salle ${salle.nom_salle}` : ""}`;
};

/** Prévient les administrateurs (notification et e-mail) d'une nouvelle demande ; ne bloque jamais. */
export const notifierNouvelleDemande = async (demande) => {
    try {
        const enseignantNom = demande.enseignant ? `${demande.enseignant.prenom || ""} ${demande.enseignant.nom || ""}`.trim() : "Un enseignant";
        await notifierAdministrateurs({
            titre: "Nouvelle demande de report",
            message: `${enseignantNom} demande un report au ${dateLisible(demande.nouvelle_date)}. Motif : ${demande.motif || "non précisé"}`,
            type_notification: "info",
            lien: "/gestion/demandes-report",
        });
        const { sendDemandeReportNotification } = await import("../../utils/sendEmail.js");
        const admins = await Users.findAll({ where: { role: "admin", actif: true }, attributes: ["id_user", "email"] });
        for (const admin of admins) {
            if (!admin.email) continue;
            try {
                await sendDemandeReportNotification({ to: admin.email, demande });
            } catch (emailError) {
                console.error(`Erreur lors de l'envoi de l'email à l'admin ${admin.id_user}:`, emailError);
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de la notification de demande de report:", error);
    }
};

/** Prévient l'enseignant que l'administration a validé une proposition qu'il doit confirmer. */
export const notifierPropositionAConfirmer = async (demande, affectation) => {
    const cours = await Cours.findByPk(affectation.id_cours);
    const place = await placeLisible({ date: demande.nouvelle_date, id_creneau: demande.id_creneau_nouveau, id_salle: demande.id_salle_nouvelle });
    try {
        await creerNotification({
            id_user: demande.id_user_enseignant,
            titre: "Report à confirmer",
            message: `Pour « ${cours?.nom_cours ?? "votre cours"} » du ${dateLisible(affectation.date_seance)}, l'administration propose le ${place}. Confirmez, ou proposez un autre créneau.`,
            type_notification: "info",
            lien: `/demandes-report?demande=${demande.id_demande}`,
        });
    } catch (error) {
        console.error("Notification du report à confirmer impossible :", error.message);
    }
};

/**
 * Applique un report confirmé : déplace la séance (mêmes règles qu'une séance saisie), passe la
 * demande « approuve » et prévient les étudiants et l'administration. `place` : date, créneau,
 * salle ; `parEnseignant` : l'enseignant a proposé lui-même ce créneau.
 */
export const appliquerReport = async ({ demande, place, user, parEnseignant = false }) => {
    const affectation = await Affectation.findByPk(demande.id_affectation, { include: [{ model: Cours, as: "cours" }] });
    if (!affectation) throw new ErreurMetier("Séance introuvable", 404);
    const forcer = !parEnseignant && Boolean(demande.justification_forcage);
    // Le forçage est une décision de l'administration : il s'applique en son nom (historique, contrôle du rôle)
    const auteur = forcer ? await Users.findByPk(demande.id_user_decision) : user;
    const ancienneDate = affectation.date_seance;
    const date = dateISO(place.date);

    await enregistrerSeance({
        id: affectation.id_affectation,
        donnees: {
            date_seance: date,
            id_creneau: place.id_creneau,
            id_salle: place.id_salle ?? null,
            statut: "reporte",
            // Première date et heure de la séance, gardées même après plusieurs reports
            date_seance_initiale: affectation.date_seance_initiale ?? affectation.date_seance,
            id_creneau_initial: affectation.id_creneau_initial ?? affectation.id_creneau,
        },
        user: auteur,
        forcer,
        justification: demande.justification_forcage,
        action: "report",
    });
    await demande.update({ statut_demande: "approuve", nouvelle_date: date, id_creneau_nouveau: place.id_creneau, id_salle_nouvelle: place.id_salle ?? null });

    const coursNom = affectation.cours?.nom_cours || "le cours";
    const lisible = await placeLisible({ ...place, date });
    await notifierChangementSeance({
        affectation,
        notifierEnseignant: false,
        titre: "Séance reportée",
        message: `« ${coursNom} » du ${dateLisible(ancienneDate)} est reportée au ${lisible}.`,
        lien: `/emploi-du-temps/etudiant?date=${date}`,
    });
    try {
        await notifierAdministrateurs({
            titre: parEnseignant ? "Report déplacé par l'enseignant" : "Report confirmé par l'enseignant",
            message: parEnseignant
                ? `L'enseignant a choisi un autre créneau pour « ${coursNom} » : ${lisible}. Il était libre, le report est validé.`
                : `L'enseignant a confirmé le report de « ${coursNom} » au ${lisible}.`,
            type_notification: "info",
            lien: "/gestion/demandes-report",
        });
    } catch (error) {
        console.error("Notification des administrateurs impossible :", error.message);
    }
    return affectation;
};
