import { Affectation, Creneau } from "../../models/index.js";
import { aujourdhui, jourDe, minutes } from "./affectationRules.js";
import { proposerCreneauxSeance } from "./assistant.js";
import { ErreurMetier } from "./enseignements.js";

/**
 * Report d'une séance (recette du 20 octobre 2026, B-2) : l'enseignant ne choisit que la date. Le
 * créneau et la salle sont ceux que l'assistant de planification trouve libres, sous toutes les
 * règles du moteur : disponibilités de l'enseignant, groupe, effectif et capacité de la salle,
 * équipements, type de salle, campus et temps de trajet, jours bloqués. Le meilleur choix est la
 * même heure dans la même salle, puis la même heure dans une autre salle, puis l'heure la plus proche.
 */

const JOURS_PROCHES = 21;
const NOMBRE_DATES_PROCHES = 4;

const ajouterJours = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

export const dateISO = (valeur) => String(valeur).slice(0, 10);

/** « lundi 30 novembre 2026 » : la date telle qu'on la lit, pour les messages. */
export const dateLisible = (iso) =>
    new Date(`${dateISO(iso)}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Les propositions classées : même heure et même salle d'abord, puis l'heure la plus proche de l'actuelle. */
const classer = (propositions, creneauActuel, salleActuelle) => {
    const debutActuel = minutes(creneauActuel.heure_debut);
    const ecart = (p) => Math.abs(minutes(p.heure_debut) - debutActuel);
    return [...propositions].sort(
        (a, b) =>
            Number(b.id_creneau === creneauActuel.id_creneau) - Number(a.id_creneau === creneauActuel.id_creneau) ||
            Number(b.id_salle === salleActuelle) - Number(a.id_salle === salleActuelle) ||
            ecart(a) - ecart(b)
    );
};

/**
 * Créneaux et salles libres pour reporter `affectation` à `date`. Sans rien ce jour-là, les
 * prochaines dates qui ont de la place (`dates_proches`), pour que la demande ne soit jamais
 * refusée sans issue.
 */
export const propositionsDeReport = async ({ affectation, date }) => {
    const jour = dateISO(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) throw new ErreurMetier("Date invalide", 400);
    if (jour <= aujourdhui()) throw new ErreurMetier("La nouvelle date doit être à venir.", 400);
    const creneauActuel = await Creneau.findByPk(affectation.id_creneau);
    const seance = affectation.get ? affectation.get({ plain: true }) : affectation;
    const memeSeance = (p) => p.date === dateISO(affectation.date_seance) && p.id_creneau === affectation.id_creneau;

    const ce = await proposerCreneauxSeance({ seance, date_debut: jour, date_fin: jour, limite: 20 });
    const propositions = classer(ce.propositions.filter((p) => !memeSeance(p)), creneauActuel, affectation.id_salle);
    if (propositions.length) return { date: jour, propositions, refus: ce.refus, dates_proches: [] };

    const autour = await proposerCreneauxSeance({ seance, date_debut: ajouterJours(jour, -7), date_fin: ajouterJours(jour, JOURS_PROCHES), limite: 40 });
    const parDate = new Map();
    for (const p of classer(autour.propositions.filter((x) => !memeSeance(x) && x.date !== jour), creneauActuel, affectation.id_salle)) {
        if (!parDate.has(p.date)) parDate.set(p.date, p);
    }
    const dates_proches = [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, NOMBRE_DATES_PROCHES);
    return { date: jour, propositions: [], refus: ce.refus, dates_proches };
};

/**
 * La proposition à retenir : celle du créneau que l'enseignant (ou l'administration) a choisi
 * s'il est libre, sinon la meilleure. `null` si le créneau choisi n'est pas libre ce jour-là, ou
 * s'il n'y a rien.
 */
export const retenirProposition = (resultat, idCreneauSouhaite = null) => {
    if (!idCreneauSouhaite) return resultat.propositions[0] ?? null;
    return resultat.propositions.find((p) => p.id_creneau === Number(idCreneauSouhaite)) ?? null;
};

/** Le jour de la semaine d'une date, en toutes lettres, pour les messages d'erreur. */
export const jourEnToutesLettres = (iso) => jourDe(dateISO(iso));

/** Séance à reporter : introuvable ou d'un autre enseignant → erreur métier. */
export const seanceAReporter = async (id, user) => {
    const affectation = await Affectation.findByPk(id);
    if (!affectation) throw new ErreurMetier("Séance introuvable", 404);
    if (user.role !== "admin" && affectation.id_user_enseignant !== user.id_user) throw new ErreurMetier("Vous ne pouvez demander le report que de vos propres séances.", 403);
    return affectation;
};
