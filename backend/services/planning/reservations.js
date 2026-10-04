import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Affectation,
    Creneau,
    Disponibilite,
    Evenement,
    Filiere,
    Groupe,
    Reservation,
    ReservationParticipant,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { aujourdhui, evenementConcerne, jourDe, minutes, seChevauchent } from "./affectationRules.js";
import { groupesLies } from "./groupes.js";
import { lireParametre } from "./referentiel.js";
import { occupationsDuJour } from "./occupations.js";
import { ViolationsBloquantes, notifierChangementSeance } from "./seances.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Réservations de salles hors cours (phase P5). Une demande ne bloque rien tant qu'elle n'est
 * pas validée ; elle est vérifiée à la demande puis de nouveau à la validation, avec les mêmes
 * occupations que les séances (séances, réservations validées, examens). L'administration
 * peut forcer en justifiant. Une réunion dans une salle ouverte aux enseignants (ou sans salle)
 * est validée d'office ; une réservation faite par l'administration aussi.
 */

const hhmm = (h) => String(h).slice(0, 5);
const nomComplet = (u) => (u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() : "");

export const INCLUDES_RESERVATION = [
    { model: Salle, as: "salle" },
    { model: Users, as: "demandeur", attributes: ["id_user", "nom", "prenom", "email", "role"] },
    { model: Users, as: "valideur", attributes: ["id_user", "nom", "prenom"] },
    {
        model: ReservationParticipant,
        as: "participants",
        include: [
            { model: Users, as: "user", attributes: ["id_user", "nom", "prenom", "role"] },
            { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "effectif"] },
        ],
    },
    { model: Affectation, as: "seance_origine", attributes: ["id_affectation", "date_seance", "id_groupe", "id_user_enseignant", "statut"] },
];

/**
 * Vérifie une réservation sans rien écrire. `resa` : type, date, heure_debut, heure_fin,
 * id_salle, participants [{ id_user | id_groupe, role }], id_reservation si elle existe.
 */
export const validerReservation = async (resa, { transaction, verrouiller = false } = {}) => {
    const violations = [];
    const signaler = (code, message, extra = {}, bloquant = true) => violations.push({ code, bloquant, message, ...extra });
    const plage = { heure_debut: resa.heure_debut, heure_fin: resa.heure_fin };
    const participants = resa.participants ?? [];
    const idsUsers = [...new Set(participants.filter((p) => p.id_user).map((p) => Number(p.id_user)))];
    const idsGroupes = [...new Set(participants.filter((p) => p.id_groupe).map((p) => Number(p.id_groupe)))];

    if (!(minutes(resa.heure_fin) > minutes(resa.heure_debut))) signaler("horaires", "L'heure de fin doit suivre l'heure de début");
    if (resa.date < aujourdhui()) signaler("date_passee", `La date ${resa.date} est passée`);

    const [salle, users, groupes] = await Promise.all([
        resa.id_salle ? Salle.findByPk(resa.id_salle, { transaction }) : null,
        Users.findAll({ where: { id_user: idsUsers }, attributes: ["id_user", "nom", "prenom", "actif"], transaction }),
        Groupe.findAll({ where: { id_groupe: idsGroupes }, include: [{ model: Filiere, as: "filiere" }], transaction }),
    ]);
    if (resa.id_salle && !salle) signaler("introuvable", "Salle introuvable");
    if (users.length !== idsUsers.length) signaler("introuvable", "Participant introuvable");
    if (groupes.length !== idsGroupes.length) signaler("introuvable", "Groupe introuvable");
    if (violations.some((v) => v.code === "introuvable" || v.code === "horaires")) return { violations, bloquant: true };

    const groupesOccupes = new Set((await Promise.all(idsGroupes.map((id) => groupesLies(id, transaction)))).flat());
    if (verrouiller) {
        const lock = transaction.LOCK.UPDATE;
        if (salle) await Salle.findByPk(salle.id_salle, { transaction, lock });
        await Users.findAll({ where: { id_user: idsUsers }, transaction, lock });
        await Groupe.findAll({ where: { id_groupe: [...groupesOccupes] }, transaction, lock });
    }
    const parId = new Map(users.map((u) => [u.id_user, u]));

    // Salle : nécessaire sauf pour une réunion (possible à distance), en service, assez grande
    const effectif = idsUsers.length + groupes.reduce((t, g) => t + (g.effectif || 0), 0);
    if (!salle && resa.type !== "reunion") signaler("salle_requise", "Cette réservation a besoin d'une salle");
    if (salle) {
        if (salle.disponible === false) signaler("salle_indisponible", `La salle ${salle.nom_salle} est hors service`);
        const places = resa.type === "examen" ? salle.capacite_examen ?? Math.floor(salle.capacite * (await lireParametre("ratio_capacite_examen"))) : salle.capacite;
        if (effectif > places) signaler("capacite", `${effectif} personnes pour ${places} places en ${salle.nom_salle}${resa.type === "examen" ? " (capacité d'examen)" : ""}`);
    }
    if (resa.type === "soutenance" && participants.filter((p) => ["jury", "president"].includes(p.role)).length < 2) {
        signaler("jury_incomplet", "Un jury de soutenance compte d'ordinaire au moins deux enseignants", {}, false);
    }

    // Occupations du jour : séances, réservations validées, examens
    const occupations = await occupationsDuJour(resa.date, { transaction, exclure: { reservation: resa.id_reservation } });
    for (const o of occupations.filter((x) => seChevauchent(plage, x))) {
        const reference = { source: o.source, id_occupation: o.id };
        if (salle && o.salles.some((x) => x.id_salle === salle.id_salle)) signaler("conflit_salle", `${salle.nom_salle} est occupée : ${o.libelle}`, reference);
        for (const idUser of o.personnes.filter((id) => idsUsers.includes(id))) {
            signaler("conflit_participant", `${nomComplet(parId.get(idUser))} est pris : ${o.libelle}`, { ...reference, id_user: idUser });
        }
        if (o.groupes.some((id) => groupesOccupes.has(id))) signaler("conflit_groupe", `Un groupe concerné est pris : ${o.libelle}`, reference);
    }

    // Indisponibilités déclarées des participants sur un créneau qui recoupe la plage
    if (idsUsers.length) {
        const indisponibles = await Disponibilite.findAll({
            where: { id_user_enseignant: idsUsers, disponible: false, date_debut: { [Op.lte]: resa.date }, date_fin: { [Op.gte]: resa.date } },
            include: [{ model: Creneau, as: "creneau" }],
            transaction,
        });
        for (const d of indisponibles.filter((x) => x.creneau && x.creneau.jour_semaine === jourDe(resa.date) && seChevauchent(plage, x.creneau))) {
            signaler("participant_indisponible", `${nomComplet(parId.get(d.id_user_enseignant))} : ${d.raison_indisponibilite || "indisponibilité déclarée"}`, { id_user: d.id_user_enseignant });
        }
    }

    // Événements bloquants (férié, examens de l'établissement, journée de filière…)
    const evenements = await Evenement.findAll({
        where: { bloque_affectations: true, date_debut: { [Op.lte]: resa.date }, date_fin: { [Op.gte]: resa.date } },
        transaction,
    });
    for (const e of evenements) {
        const concerne =
            e.portee === "etablissement"
                ? !e.heure_debut || seChevauchent(plage, e)
                : e.portee === "campus"
                  ? Boolean(salle) && salle.id_campus === e.id_cible && (!e.heure_debut || seChevauchent(plage, e))
                  : groupes.some((g) => evenementConcerne(e, { salle, groupe: g, groupesOccupes, creneau: plage }));
        // Un examen de l'établissement peut se tenir pendant la période d'examens
        if (concerne && !(resa.type === "examen" && e.type_evenement === "examen")) signaler("evenement", e.titre, { id_evenement: e.id_evenement });
    }

    return { violations, bloquant: violations.some((v) => v.bloquant) };
};

const echouerSiBloquant = (violations, { user, forcer, justification }) => {
    if (!violations.some((v) => v.bloquant)) return false;
    if (!forcer || user.role !== "admin") throw new ViolationsBloquantes(violations);
    if (!String(justification || "").trim()) throw new ErreurMetier("Indiquez pourquoi la réservation est enregistrée malgré les règles", 400);
    return true;
};

const charger = (id, transaction) => Reservation.findByPk(id, { include: INCLUDES_RESERVATION, transaction });

/** Prévient les participants (et les étudiants des groupes) d'une réservation validée ou annulée. */
const notifierParticipants = async (reservation, titre, message) => {
    try {
        const users = reservation.participants.filter((p) => p.id_user && p.id_user !== reservation.id_demandeur).map((p) => p.id_user);
        if (users.length) await creerNotificationsMultiples({ id_users: users, titre, message, type_notification: "info", lien: "/notifications" });
        const groupes = reservation.participants.filter((p) => p.id_groupe).map((p) => p.id_groupe);
        if (groupes.length) {
            await notifierChangementSeance({ affectation: { id_groupe: groupes[0], id_user_enseignant: reservation.id_demandeur }, idGroupes: groupes, titre, message, notifierEnseignant: false });
        }
    } catch (error) {
        console.error("Notification de réservation impossible :", error.message);
    }
};

const notifierDemandeur = (reservation, titre, message, type = "info") =>
    creerNotificationsMultiples({ id_users: [reservation.id_demandeur], titre, message, type_notification: type, lien: "/reservations" }).catch(() => {});

const libelle = (r) => `« ${r.titre} » le ${r.date} de ${hhmm(r.heure_debut)} à ${hhmm(r.heure_fin)}${r.salle ? ` en ${r.salle.nom_salle}` : ""}`;

/**
 * Crée une réservation (demande). Validée d'office si l'administration la crée, ou s'il s'agit
 * d'une réunion dans une salle ouverte aux enseignants (ou sans salle).
 */
export const creerReservation = async ({ donnees, participants = [], user, forcer = false, justification = null }) => {
    const resultat = await sequelize.transaction(async (transaction) => {
        // Un rattrapage porte sur une séance de l'enseignant ; son groupe y participe d'office
        const liste = [...participants];
        if (donnees.type === "rattrapage") {
            const origine = donnees.id_affectation_origine ? await Affectation.findByPk(donnees.id_affectation_origine, { transaction }) : null;
            if (!origine) throw new ErreurMetier("Un rattrapage précise la séance à rattraper", 400);
            if (user.role !== "admin" && origine.id_user_enseignant !== user.id_user) throw new ErreurMetier("Vous ne pouvez rattraper que vos propres séances", 403);
            if (!liste.some((p) => Number(p.id_groupe) === origine.id_groupe)) liste.push({ id_groupe: origine.id_groupe, role: "etudiant" });
            if (!liste.some((p) => Number(p.id_user) === origine.id_user_enseignant)) liste.push({ id_user: origine.id_user_enseignant, role: "intervenant" });
        }
        // Le demandeur assiste à sa réunion
        if (donnees.type === "reunion" && !liste.some((p) => Number(p.id_user) === user.id_user)) liste.push({ id_user: user.id_user, role: "participant" });

        const { violations } = await validerReservation({ ...donnees, participants: liste }, { transaction, verrouiller: true });
        const force = echouerSiBloquant(violations, { user, forcer, justification });

        const salle = donnees.id_salle ? await Salle.findByPk(donnees.id_salle, { transaction }) : null;
        const valideeDOffice = user.role === "admin" || (donnees.type === "reunion" && (!salle || salle.reservable_par === "enseignants"));
        const reservation = await Reservation.create(
            {
                ...donnees,
                id_demandeur: user.id_user,
                statut: valideeDOffice ? "validee" : "demandee",
                ...(valideeDOffice ? { id_valideur: user.id_user, date_validation: new Date() } : {}),
                force,
                justification_force: force ? justification.trim() : null,
            },
            { transaction }
        );
        await ReservationParticipant.bulkCreate(
            liste.map((p) => ({ id_reservation: reservation.id_reservation, id_user: p.id_user ?? null, id_groupe: p.id_groupe ?? null, role: p.role ?? "participant" })),
            { transaction }
        );
        return { reservation: await charger(reservation.id_reservation, transaction), violations, force };
    });

    const r = resultat.reservation;
    if (r.statut === "validee") await notifierParticipants(r, "Nouvelle réservation", `Vous êtes concerné par ${libelle(r)}.`);
    else {
        const { notifierAdministrateurs } = await import("../../utils/notificationHelper.js");
        await notifierAdministrateurs({
            titre: "Réservation à valider",
            message: `${nomComplet(r.demandeur)} demande ${libelle(r)}.`,
            type_notification: "info",
            lien: "/gestion/reservations",
        }).catch(() => {});
    }
    return resultat;
};

/** Validation par l'administration : les règles sont revérifiées au moment de valider. */
export const validerDemande = async ({ id, user, forcer = false, justification = null }) => {
    const resultat = await sequelize.transaction(async (transaction) => {
        const reservation = await charger(id, transaction);
        if (!reservation) throw new ErreurMetier("Réservation non trouvée", 404);
        if (reservation.statut !== "demandee") throw new ErreurMetier(`Cette réservation est déjà ${reservation.statut}`, 400);
        const { violations } = await validerReservation(
            { ...reservation.get({ plain: true }), participants: reservation.participants },
            { transaction, verrouiller: true }
        );
        const force = echouerSiBloquant(violations, { user, forcer, justification });
        await reservation.update(
            { statut: "validee", id_valideur: user.id_user, date_validation: new Date(), force, justification_force: force ? justification.trim() : null },
            { transaction }
        );
        return { reservation: await charger(id, transaction), violations, force };
    });
    const r = resultat.reservation;
    await notifierDemandeur(r, "Réservation validée", `Votre demande ${libelle(r)} est validée.`, "success");
    await notifierParticipants(r, "Nouvelle réservation", `Vous êtes concerné par ${libelle(r)}.`);
    return resultat;
};

export const refuserDemande = async ({ id, user, motif }) => {
    if (!String(motif || "").trim()) throw new ErreurMetier("Indiquez le motif du refus", 400);
    const reservation = await charger(id);
    if (!reservation) throw new ErreurMetier("Réservation non trouvée", 404);
    if (reservation.statut !== "demandee") throw new ErreurMetier(`Cette réservation est déjà ${reservation.statut}`, 400);
    await reservation.update({ statut: "refusee", motif_refus: motif.trim(), id_valideur: user.id_user, date_validation: new Date() });
    await notifierDemandeur(reservation, "Réservation refusée", `Votre demande ${libelle(reservation)} est refusée : ${motif.trim()}`, "warning");
    return charger(id);
};

export const annulerReservation = async ({ id, user }) => {
    const reservation = await charger(id);
    if (!reservation) throw new ErreurMetier("Réservation non trouvée", 404);
    if (user.role !== "admin" && reservation.id_demandeur !== user.id_user) throw new ErreurMetier("Seul le demandeur ou l'administration peut annuler", 403);
    if (["annulee", "refusee"].includes(reservation.statut)) throw new ErreurMetier(`Cette réservation est déjà ${reservation.statut}`, 400);
    const etaitValidee = reservation.statut === "validee";
    await reservation.update({ statut: "annulee" });
    if (etaitValidee) await notifierParticipants(reservation, "Réservation annulée", `${libelle(reservation)} est annulée.`);
    return charger(id);
};
