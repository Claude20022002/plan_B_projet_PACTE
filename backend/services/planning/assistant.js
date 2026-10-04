import { Op } from "sequelize";
import {
    Affectation,
    CoursComposante,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    Salle,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { aujourdhui, jourDe, minutes, seChevauchent, validerAffectation } from "./affectationRules.js";
import { groupesLies } from "./groupes.js";
import { occupationsDuJour } from "./occupations.js";
import { validerReservation } from "./reservations.js";

/**
 * Assistant de planification (innovation I8) : propose des créneaux libres pour une séance
 * (rattrapage, report, déplacement) ou une réservation (soutenance, réunion). Chaque candidat
 * est d'abord filtré sur les occupations du jour (rapide), puis confirmé par le moteur de règles
 * de la phase B ; les créneaux écartés sont comptés par raison pour expliquer le résultat.
 */

const LIMITE_JOURS = 31;
const TYPES_COURANTS = ["Salle de cours", "Salle TD", "Amphithéâtre"];
const CODES_SALLE = new Set(["conflit_salle", "capacite", "type_salle", "equipements", "salle_indisponible"]);
const RAISONS = {
    enseignant_pris: "Enseignant déjà pris",
    groupe_pris: "Groupe déjà pris",
    aucune_salle: "Aucune salle adaptée libre",
    participant_pris: "Un participant est pris",
};

const ajouterJour = (date, n) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

/** Jours ouvrés (hors dimanche) d'une plage, à partir d'aujourd'hui au plus tôt. */
const joursDe = (debut, fin) => {
    const premier = debut < aujourdhui() ? aujourdhui() : debut;
    const jours = [];
    for (let d = premier; d <= fin && jours.length < LIMITE_JOURS; d = ajouterJour(d, 1)) {
        if (jourDe(d) !== "dimanche") jours.push(d);
    }
    return jours;
};

const compter = (refus, code) => {
    refus[code] = (refus[code] || 0) + 1;
};

/** Raisons de refus, de la plus fréquente à la plus rare, avec un libellé. */
const resumerRefus = (refus, libelles = {}) =>
    Object.entries(refus)
        .sort((a, b) => b[1] - a[1])
        .map(([code, nombre]) => ({ code, nombre, libelle: RAISONS[code] ?? libelles[code] ?? code }));

/**
 * Créneaux libres pour une séance. `seance` : id_groupe, id_user_enseignant, id_cours,
 * id_enseignement, id_salle (salle de référence), id_affectation (exclue des occupations).
 */
export const proposerCreneauxSeance = async ({ seance, date_debut, date_fin, garderSalle = false, limite = 8 }) => {
    const groupe = await Groupe.findByPk(seance.id_groupe, { include: [{ model: Filiere, as: "filiere" }] });
    if (!groupe) throw new ErreurMetier("Groupe introuvable", 404);
    const enseignement = seance.id_enseignement
        ? await Enseignement.findByPk(seance.id_enseignement, {
              include: [
                  { model: Groupe, as: "groupes", through: { attributes: [] } },
                  { model: CoursComposante, as: "composante" },
                  { model: EnseignementEnseignant, as: "services", where: { statut_service: { [Op.ne]: "refuse" } }, required: false },
              ],
          })
        : null;
    const idsEnseignants = [...new Set([seance.id_user_enseignant, ...(enseignement?.services ?? []).filter((s) => s.role === "co_enseignant").map((s) => s.id_user)])];
    const idsGroupes = [...new Set([seance.id_groupe, ...(enseignement?.groupes ?? []).map((g) => g.id_groupe)])];
    const groupesOccupes = new Set((await Promise.all(idsGroupes.map((id) => groupesLies(id)))).flat());
    const effectif = enseignement ? enseignement.groupes.reduce((t, g) => t + (g.effectif || 0), 0) : groupe.effectif || 0;

    const salleRef = seance.id_salle ? await Salle.findByPk(seance.id_salle) : null;
    const typeRequis = enseignement?.composante?.type_salle_requis ?? null;
    const distanciel = enseignement?.composante?.modalite === "distanciel";
    const campusRef = salleRef?.id_campus ?? groupe.filiere?.id_campus_prefere ?? null;
    const types = typeRequis ? [typeRequis] : [...new Set([...(salleRef ? [salleRef.type_salle] : []), ...TYPES_COURANTS])];
    const salles = distanciel
        ? []
        : (await Salle.findAll({ where: { disponible: true, capacite: { [Op.gte]: effectif }, type_salle: types } })).sort(
              (a, b) =>
                  Number(b.id_salle === salleRef?.id_salle) - Number(a.id_salle === salleRef?.id_salle) ||
                  Number(b.id_campus === campusRef) - Number(a.id_campus === campusRef) ||
                  a.capacite - b.capacite
          );
    const sallesCandidates = garderSalle && salleRef ? salles.filter((s) => s.id_salle === salleRef.id_salle) : salles;

    const regime = groupe.filiere?.regime ?? "initiale";
    const creneaux = await Creneau.findAll({ where: { regime, variante: "normale" }, order: [["heure_debut", "ASC"]] });
    const refus = {};
    const libelles = {};
    const propositions = [];

    for (const date of joursDe(date_debut, date_fin)) {
        if (propositions.length >= limite) break;
        const occupations = await occupationsDuJour(date, { exclure: { seance: seance.id_affectation } });
        for (const creneau of creneaux.filter((c) => c.jour_semaine === jourDe(date))) {
            if (propositions.length >= limite) break;
            const enMemeTemps = occupations.filter((o) => seChevauchent(creneau, o));
            if (enMemeTemps.some((o) => o.personnes.some((id) => idsEnseignants.includes(id)))) {
                compter(refus, "enseignant_pris");
                continue;
            }
            if (enMemeTemps.some((o) => o.groupes.some((id) => groupesOccupes.has(id)))) {
                compter(refus, "groupe_pris");
                continue;
            }
            const libres = distanciel ? [null] : sallesCandidates.filter((s) => !enMemeTemps.some((o) => o.salles.some((x) => x.id_salle === s.id_salle)));
            if (!libres.length) {
                compter(refus, "aucune_salle");
                continue;
            }
            // Confirmation par le moteur de règles, sur les premières salles libres
            for (const salle of libres.slice(0, 3)) {
                const { violations } = await validerAffectation({ ...seance, date_seance: date, id_creneau: creneau.id_creneau, id_salle: salle?.id_salle ?? null });
                const bloquantes = violations.filter((v) => v.bloquant);
                if (!bloquantes.length) {
                    propositions.push({
                        date,
                        jour: creneau.jour_semaine,
                        id_creneau: creneau.id_creneau,
                        heure_debut: String(creneau.heure_debut).slice(0, 5),
                        heure_fin: String(creneau.heure_fin).slice(0, 5),
                        id_salle: salle?.id_salle ?? null,
                        nom_salle: salle?.nom_salle ?? null,
                        meme_salle: Boolean(salle && salleRef && salle.id_salle === salleRef.id_salle),
                        avertissements: violations.filter((v) => !v.bloquant),
                    });
                    break;
                }
                bloquantes.forEach((v) => {
                    compter(refus, v.code);
                    libelles[v.code] ??= v.message;
                });
                if (!bloquantes.every((v) => CODES_SALLE.has(v.code))) break;
            }
        }
    }
    return { propositions, refus: resumerRefus(refus, libelles) };
};

/** Créneaux libres pour la séance existante `id` (rattrapage, report, déplacement). */
export const proposerPourSeance = async ({ id, ...options }) => {
    const affectation = await Affectation.findByPk(id);
    if (!affectation) throw new ErreurMetier("Affectation non trouvée", 404);
    return { seance: affectation, ...(await proposerCreneauxSeance({ seance: affectation.get({ plain: true }), ...options })) };
};

const heure = (total) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

/**
 * Plages libres pour une réservation (soutenance, réunion…) : les débuts de créneaux de la
 * grille, avec la durée demandée ; tous les participants libres et une salle assez grande.
 */
export const proposerCreneauxReservation = async ({ type = "soutenance", participants = [], duree_minutes = 60, date_debut, date_fin, id_salle = null, limite = 8 }) => {
    const idsUsers = [...new Set(participants.filter((p) => p.id_user).map((p) => Number(p.id_user)))];
    const idsGroupes = [...new Set(participants.filter((p) => p.id_groupe).map((p) => Number(p.id_groupe)))];
    const groupes = await Groupe.findAll({ where: { id_groupe: idsGroupes } });
    const groupesOccupes = new Set((await Promise.all(idsGroupes.map((id) => groupesLies(id)))).flat());
    const effectif = idsUsers.length + groupes.reduce((t, g) => t + (g.effectif || 0), 0);
    const typesPreferes = type === "reunion" ? ["Salle de réunion", "Salle de cours"] : ["Salle de cours", "Salle de réunion", "Amphithéâtre"];
    const salles = (await Salle.findAll({ where: { disponible: true, capacite: { [Op.gte]: Math.max(effectif, 1) }, ...(id_salle ? { id_salle } : { type_salle: typesPreferes }) } })).sort(
        (a, b) => typesPreferes.indexOf(a.type_salle) - typesPreferes.indexOf(b.type_salle) || a.capacite - b.capacite
    );
    const debuts = [...new Set((await Creneau.findAll({ where: { regime: "initiale", variante: "normale" } })).map((c) => `${c.jour_semaine}|${String(c.heure_debut).slice(0, 5)}`))];

    const refus = {};
    const libelles = {};
    const propositions = [];
    for (const date of joursDe(date_debut, date_fin)) {
        if (propositions.length >= limite) break;
        const occupations = await occupationsDuJour(date);
        const heures = debuts.filter((d) => d.startsWith(`${jourDe(date)}|`)).map((d) => d.split("|")[1]).sort();
        for (const debut of heures) {
            if (propositions.length >= limite) break;
            const plage = { heure_debut: debut, heure_fin: heure(minutes(debut) + Number(duree_minutes)) };
            const enMemeTemps = occupations.filter((o) => seChevauchent(plage, o));
            if (enMemeTemps.some((o) => o.personnes.some((id) => idsUsers.includes(id)))) {
                compter(refus, "participant_pris");
                continue;
            }
            if (enMemeTemps.some((o) => o.groupes.some((id) => groupesOccupes.has(id)))) {
                compter(refus, "groupe_pris");
                continue;
            }
            const salle = salles.find((s) => !enMemeTemps.some((o) => o.salles.some((x) => x.id_salle === s.id_salle)));
            if (!salle && type !== "reunion") {
                compter(refus, "aucune_salle");
                continue;
            }
            const { violations } = await validerReservation({ type, date, ...plage, id_salle: salle?.id_salle ?? null, participants });
            const bloquantes = violations.filter((v) => v.bloquant);
            if (bloquantes.length) {
                bloquantes.forEach((v) => {
                    compter(refus, v.code);
                    libelles[v.code] ??= v.message;
                });
                continue;
            }
            propositions.push({ date, ...plage, id_salle: salle?.id_salle ?? null, nom_salle: salle?.nom_salle ?? null, avertissements: violations.filter((v) => !v.bloquant) });
        }
    }
    return { propositions, refus: resumerRefus(refus, libelles) };
};
