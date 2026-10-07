import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    Groupe,
    Reservation,
    ReservationParticipant,
    Salle,
    SessionExamen,
    SessionExamenSalle,
    Surveillance,
} from "../../models/index.js";
import { appliquerRamadan } from "./ramadan.js";

/**
 * Tout ce qui occupe des salles, des personnes ou des groupes un jour donné, sous une forme
 * commune : séances actives, réservations validées, épreuves d'examen non annulées.
 * { source, id, libelle, heure_debut, heure_fin, salles: [{ id_salle, id_campus }], personnes: [id_user], groupes: [id_groupe] }
 * Sert aux règles des séances (phase B), des réservations et des examens (phase P5), et à la
 * recherche de créneaux libres (I8).
 */

export const STATUTS_SEANCE_ACTIFS = ["planifie", "confirme", "reporte", "realise"];

const hhmm = (h) => String(h).slice(0, 5);

const depuisSeance = (a) => ({
    source: "seance",
    id: a.id_affectation,
    id_cours: a.id_cours,
    libelle: `${a.cours?.nom_cours ?? "Séance"} (${hhmm(a.creneau.heure_debut)}-${hhmm(a.creneau.heure_fin)})`,
    heure_debut: a.creneau.heure_debut,
    heure_fin: a.creneau.heure_fin,
    salles: a.salle ? [{ id_salle: a.salle.id_salle, id_campus: a.salle.id_campus }] : [],
    personnes: [
        ...new Set([a.id_user_enseignant, ...(a.enseignement?.services ?? []).filter((s) => s.role === "co_enseignant").map((s) => s.id_user)]),
    ],
    groupes: [...new Set([a.id_groupe, ...(a.enseignement?.groupes ?? []).map((g) => g.id_groupe)])],
});

const depuisReservation = (r) => ({
    source: "reservation",
    id: r.id_reservation,
    libelle: `${r.titre} (${hhmm(r.heure_debut)}-${hhmm(r.heure_fin)})`,
    heure_debut: r.heure_debut,
    heure_fin: r.heure_fin,
    salles: r.salle ? [{ id_salle: r.salle.id_salle, id_campus: r.salle.id_campus }] : [],
    personnes: [...new Set(r.participants.filter((p) => p.id_user).map((p) => p.id_user))],
    groupes: [...new Set(r.participants.filter((p) => p.id_groupe).map((p) => p.id_groupe))],
});

const depuisExamen = (e) => ({
    source: "examen",
    id: e.id_session,
    libelle: `Examen : ${e.titre} (${hhmm(e.heure_debut)}-${hhmm(e.heure_fin)})`,
    heure_debut: e.heure_debut,
    heure_fin: e.heure_fin,
    salles: e.salles.map((s) => ({ id_salle: s.id_salle, id_campus: s.salle?.id_campus })),
    personnes: [...new Set(e.surveillances.map((s) => s.id_user))],
    groupes: e.groupes.map((g) => g.id_groupe),
});

/**
 * @param {string} date AAAA-MM-JJ
 * @param {object} options sources (séance, réservation, examen), exclusions par source ({ seance: id, reservation: id, examen: id })
 */
export const occupationsDuJour = async (date, { transaction, sources = ["seance", "reservation", "examen"], exclure = {} } = {}) => {
    const sauf = (cle, id) => (id ? { [cle]: { [Op.ne]: id } } : {});
    const [seances, reservations, examens] = await Promise.all([
        sources.includes("seance")
            ? Affectation.findAll({
                  where: { date_seance: date, statut: STATUTS_SEANCE_ACTIFS, ...sauf("id_affectation", exclure.seance) },
                  include: [
                      { model: Creneau, as: "creneau" },
                      { model: Salle, as: "salle" },
                      { model: Cours, as: "cours", attributes: ["nom_cours"] },
                      {
                          model: Enseignement,
                          as: "enseignement",
                          include: [
                              { model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } },
                              { model: EnseignementEnseignant, as: "services", where: { statut_service: { [Op.ne]: "refuse" } }, required: false },
                          ],
                      },
                  ],
                  transaction,
              })
            : [],
        sources.includes("reservation")
            ? Reservation.findAll({
                  where: { date, statut: "validee", ...sauf("id_reservation", exclure.reservation) },
                  include: [{ model: Salle, as: "salle" }, { model: ReservationParticipant, as: "participants" }],
                  transaction,
              })
            : [],
        sources.includes("examen")
            ? SessionExamen.findAll({
                  where: { date, statut: { [Op.ne]: "annulee" }, ...sauf("id_session", exclure.examen) },
                  include: [
                      { model: SessionExamenSalle, as: "salles", include: [{ model: Salle, as: "salle" }] },
                      { model: Surveillance, as: "surveillances" },
                      { model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } },
                  ],
                  transaction,
              })
            : [],
    ]);
    await appliquerRamadan(seances, { transaction });
    return [...seances.map(depuisSeance), ...reservations.map(depuisReservation), ...examens.map(depuisExamen)];
};
