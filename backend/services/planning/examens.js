import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Cours,
    Creneau,
    Disponibilite,
    Enseignant,
    Groupe,
    Salle,
    SessionExamen,
    SessionExamenGroupe,
    SessionExamenSalle,
    Surveillance,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { aujourdhui, jourDe, minutes, seChevauchent } from "./affectationRules.js";
import { groupesLies } from "./groupes.js";
import { lireParametre } from "./referentiel.js";
import { occupationsDuJour } from "./occupations.js";
import { ViolationsBloquantes, notifierChangementSeance } from "./seances.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Examens (phase P5) : une épreuve d'un module pour des groupes, répartie sur des salles en
 * capacité d'examen, avec des surveillants par salle. Les surveillances sont équilibrées entre
 * enseignants (le moins sollicité d'abord) parmi ceux qui sont libres à cette heure-là.
 */

export const INCLUDES_EXAMEN = [
    { model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"] },
    { model: Groupe, as: "groupes", attributes: ["id_groupe", "nom_groupe", "effectif", "id_filiere"], through: { attributes: [] } },
    { model: SessionExamenSalle, as: "salles", include: [{ model: Salle, as: "salle" }] },
    { model: Surveillance, as: "surveillances", include: [{ model: Users, as: "surveillant", attributes: ["id_user", "nom", "prenom"] }] },
];

const placesExamen = async (salle) => salle.capacite_examen ?? Math.floor(salle.capacite * (await lireParametre("ratio_capacite_examen")));
const nomComplet = (u) => (u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() : "");

/** Répartit l'effectif entre les salles, au prorata de leurs places d'examen. */
export const repartir = (effectif, salles) => {
    const total = salles.reduce((t, s) => t + s.places, 0);
    if (!total) return salles.map((s) => ({ ...s, effectif: 0 }));
    let reste = effectif;
    const parts = salles.map((s, i) => {
        const part = i === salles.length - 1 ? reste : Math.min(s.places, Math.round((effectif * s.places) / total));
        reste -= part;
        return { ...s, effectif: part };
    });
    return parts;
};

/** Personnes occupées ou indisponibles pendant une plage (pour choisir des surveillants). */
const personnesPrises = async ({ date, heure_debut, heure_fin, idSession, transaction }) => {
    const plage = { heure_debut, heure_fin };
    const occupations = await occupationsDuJour(date, { transaction, exclure: { examen: idSession } });
    const prises = new Map();
    for (const o of occupations.filter((x) => seChevauchent(plage, x))) o.personnes.forEach((id) => prises.set(id, o.libelle));
    const indisponibles = await Disponibilite.findAll({
        where: { disponible: false, date_debut: { [Op.lte]: date }, date_fin: { [Op.gte]: date } },
        include: [{ model: Creneau, as: "creneau" }],
        transaction,
    });
    for (const d of indisponibles.filter((x) => x.creneau && x.creneau.jour_semaine === jourDe(date) && seChevauchent(plage, x.creneau))) {
        prises.set(d.id_user_enseignant, d.raison_indisponibilite || "indisponibilité déclarée");
    }
    return prises;
};

/**
 * Vérifie une épreuve : horaires, date, groupes et salles libres, places d'examen suffisantes,
 * surveillants libres et en nombre suffisant par salle (avertissement).
 */
export const validerExamen = async (examen, { transaction } = {}) => {
    const violations = [];
    const signaler = (code, message, extra = {}, bloquant = true) => violations.push({ code, bloquant, message, ...extra });
    const plage = { heure_debut: examen.heure_debut, heure_fin: examen.heure_fin };
    if (!(minutes(examen.heure_fin) > minutes(examen.heure_debut))) signaler("horaires", "L'heure de fin doit suivre l'heure de début");
    if (examen.date < aujourdhui()) signaler("date_passee", `La date ${examen.date} est passée`);

    const groupes = await Groupe.findAll({ where: { id_groupe: examen.groupes }, transaction });
    const salles = await Salle.findAll({ where: { id_salle: examen.salles.map((s) => s.id_salle) }, transaction });
    if (!groupes.length) signaler("groupes_requis", "Choisissez au moins un groupe");
    if (!salles.length) signaler("salle_requise", "Choisissez au moins une salle");
    if (violations.some((v) => v.code === "horaires")) return { violations, bloquant: true };

    const effectif = groupes.reduce((t, g) => t + (g.effectif || 0), 0);
    let places = 0;
    for (const salle of salles) {
        if (salle.disponible === false) signaler("salle_indisponible", `La salle ${salle.nom_salle} est hors service`);
        places += await placesExamen(salle);
    }
    if (salles.length && effectif > places) signaler("capacite", `${effectif} étudiants pour ${places} places d'examen`);

    const groupesOccupes = new Set((await Promise.all(groupes.map((g) => groupesLies(g.id_groupe, transaction)))).flat());
    const occupations = await occupationsDuJour(examen.date, { transaction, exclure: { examen: examen.id_session } });
    for (const o of occupations.filter((x) => seChevauchent(plage, x))) {
        const reference = { source: o.source, id_occupation: o.id };
        for (const salle of salles.filter((s) => o.salles.some((x) => x.id_salle === s.id_salle))) signaler("conflit_salle", `${salle.nom_salle} est occupée : ${o.libelle}`, reference);
        if (o.groupes.some((id) => groupesOccupes.has(id))) signaler("conflit_groupe", `Un groupe a déjà cours : ${o.libelle}`, reference);
    }

    const surveillances = examen.surveillances ?? [];
    if (surveillances.length) {
        const prises = await personnesPrises({ ...examen, idSession: examen.id_session, transaction });
        const users = await Users.findAll({ where: { id_user: surveillances.map((s) => s.id_user) }, attributes: ["id_user", "nom", "prenom"], transaction });
        for (const u of users.filter((x) => prises.has(x.id_user))) signaler("surveillant_pris", `${nomComplet(u)} : ${prises.get(u.id_user)}`, { id_user: u.id_user });
    }
    const minimum = await lireParametre("surveillants_par_salle");
    for (const salle of salles) {
        const nombre = surveillances.filter((s) => s.id_salle === salle.id_salle).length;
        if (nombre < minimum) signaler("surveillants_manquants", `${salle.nom_salle} : ${nombre} surveillant(s) sur ${minimum}`, { id_salle: salle.id_salle }, false);
    }
    return { violations, bloquant: violations.some((v) => v.bloquant) };
};

const charger = (id, transaction) => SessionExamen.findByPk(id, { include: INCLUDES_EXAMEN, transaction });

/** Crée ou modifie une épreuve ; sans effectifs fournis, les étudiants sont répartis au prorata des places. */
export const enregistrerExamen = async ({ id = null, donnees, groupes, salles, user, forcer = false, justification = null }) =>
    sequelize.transaction(async (transaction) => {
        const existant = id ? await charger(id, transaction) : null;
        if (id && !existant) throw new ErreurMetier("Épreuve non trouvée", 404);
        const base = existant ? { ...existant.get({ plain: true }), groupes: existant.groupes.map((g) => g.id_groupe), salles: existant.salles, surveillances: existant.surveillances } : {};
        const examen = {
            ...base,
            ...donnees,
            groupes: groupes ?? base.groupes ?? [],
            salles: salles ?? base.salles?.map((s) => ({ id_salle: s.id_salle, effectif: s.effectif })) ?? [],
            id_session: id ?? undefined,
        };
        // Des surveillants gardés sur une salle retirée n'ont plus lieu d'être
        examen.surveillances = (examen.surveillances ?? []).filter((s) => examen.salles.some((x) => x.id_salle === s.id_salle));

        const { violations } = await validerExamen(examen, { transaction });
        if (violations.some((v) => v.bloquant)) {
            if (!forcer || user.role !== "admin") throw new ViolationsBloquantes(violations);
            if (!String(justification || "").trim()) throw new ErreurMetier("Indiquez pourquoi l'épreuve est enregistrée malgré les règles", 400);
        }

        const champs = { titre: examen.titre, id_cours: examen.id_cours, id_periode: examen.id_periode ?? null, date: examen.date, heure_debut: examen.heure_debut, heure_fin: examen.heure_fin };
        const session = existant ? await existant.update(champs, { transaction }) : await SessionExamen.create({ ...champs, id_createur: user.id_user }, { transaction });

        if (groupes) {
            await SessionExamenGroupe.destroy({ where: { id_session: session.id_session }, transaction });
            await SessionExamenGroupe.bulkCreate(groupes.map((id_groupe) => ({ id_session: session.id_session, id_groupe })), { transaction });
        }
        if (salles) {
            const effectif = (await Groupe.findAll({ where: { id_groupe: examen.groupes }, transaction })).reduce((t, g) => t + (g.effectif || 0), 0);
            const sallesBase = await Salle.findAll({ where: { id_salle: salles.map((s) => s.id_salle) }, transaction });
            const avecPlaces = [];
            for (const s of salles) avecPlaces.push({ id_salle: s.id_salle, places: await placesExamen(sallesBase.find((x) => x.id_salle === s.id_salle)), effectif: s.effectif });
            const repartition = avecPlaces.every((s) => Number.isInteger(s.effectif)) ? avecPlaces : repartir(effectif, avecPlaces);
            await SessionExamenSalle.destroy({ where: { id_session: session.id_session }, transaction });
            await SessionExamenSalle.bulkCreate(repartition.map((s) => ({ id_session: session.id_session, id_salle: s.id_salle, effectif: s.effectif })), { transaction });
            await Surveillance.destroy({ where: { id_session: session.id_session, id_salle: { [Op.notIn]: salles.map((s) => s.id_salle) } }, transaction });
        }
        return { examen: await charger(session.id_session, transaction), violations };
    });

/**
 * Affecte les surveillants d'office : par salle, le nombre fixé par les paramètres, parmi les
 * enseignants libres à cette heure, en commençant par les moins sollicités de la période.
 */
export const affecterSurveillants = async (id) =>
    sequelize.transaction(async (transaction) => {
        const examen = await charger(id, transaction);
        if (!examen) throw new ErreurMetier("Épreuve non trouvée", 404);
        const minimum = await lireParametre("surveillants_par_salle");
        const prises = await personnesPrises({ date: examen.date, heure_debut: examen.heure_debut, heure_fin: examen.heure_fin, idSession: examen.id_session, transaction });

        const enseignants = await Enseignant.findAll({ include: [{ model: Users, as: "user", where: { actif: true }, attributes: ["id_user", "nom", "prenom"] }], transaction });
        // Charge de surveillance : nombre d'épreuves surveillées sur la même période (ou toutes, sans période)
        const autres = await Surveillance.findAll({
            include: [{ model: SessionExamen, as: "session", attributes: [], where: { statut: { [Op.ne]: "annulee" }, id_session: { [Op.ne]: examen.id_session }, ...(examen.id_periode ? { id_periode: examen.id_periode } : {}) } }],
            transaction,
        });
        const charge = new Map();
        autres.forEach((s) => charge.set(s.id_user, (charge.get(s.id_user) || 0) + 1));

        const candidats = enseignants
            .filter((e) => !prises.has(e.id_user))
            .sort((a, b) => (charge.get(a.id_user) || 0) - (charge.get(b.id_user) || 0) || Number(a.statut === "vacataire") - Number(b.statut === "vacataire") || a.id_user - b.id_user);

        const besoin = examen.salles.length * minimum;
        await Surveillance.destroy({ where: { id_session: examen.id_session }, transaction });
        const retenus = candidats.slice(0, besoin);
        await Surveillance.bulkCreate(
            retenus.map((e, i) => ({ id_session: examen.id_session, id_salle: examen.salles[Math.floor(i / minimum)].id_salle, id_user: e.id_user })),
            { transaction }
        );
        return { examen: await charger(examen.id_session, transaction), manquants: Math.max(0, besoin - retenus.length) };
    });

/** Affectation manuelle des surveillants ; ils doivent être libres (sauf forçage). */
export const definirSurveillants = async ({ id, surveillances, user, forcer = false, justification = null }) =>
    sequelize.transaction(async (transaction) => {
        const examen = await charger(id, transaction);
        if (!examen) throw new ErreurMetier("Épreuve non trouvée", 404);
        if (surveillances.some((s) => !examen.salles.some((x) => x.id_salle === s.id_salle))) throw new ErreurMetier("Un surveillant est placé dans une salle qui n'est pas celle de l'épreuve", 400);
        const { violations } = await validerExamen(
            { ...examen.get({ plain: true }), groupes: examen.groupes.map((g) => g.id_groupe), salles: examen.salles, surveillances },
            { transaction }
        );
        const bloquantes = violations.filter((v) => v.bloquant && v.code === "surveillant_pris");
        if (bloquantes.length && !(forcer && user.role === "admin" && String(justification || "").trim())) throw new ViolationsBloquantes(violations);
        await Surveillance.destroy({ where: { id_session: examen.id_session }, transaction });
        await Surveillance.bulkCreate(surveillances.map((s) => ({ id_session: examen.id_session, id_salle: s.id_salle, id_user: s.id_user })), { transaction });
        return { examen: await charger(examen.id_session, transaction), violations };
    });

/** Publie l'épreuve : surveillants et étudiants des groupes sont prévenus. */
export const publierExamen = async (id) => {
    const examen = await charger(id);
    if (!examen) throw new ErreurMetier("Épreuve non trouvée", 404);
    if (examen.statut === "annulee") throw new ErreurMetier("Cette épreuve est annulée", 400);
    await examen.update({ statut: "publiee" });
    const quand = `le ${examen.date} de ${String(examen.heure_debut).slice(0, 5)} à ${String(examen.heure_fin).slice(0, 5)}`;
    const surveillants = [...new Set(examen.surveillances.map((s) => s.id_user))];
    if (surveillants.length) {
        await creerNotificationsMultiples({ id_users: surveillants, titre: "Surveillance d'examen", message: `Vous surveillez « ${examen.titre} » ${quand}.`, type_notification: "info", lien: "/mes-surveillances" }).catch(() => {});
    }
    if (examen.groupes.length) {
        await notifierChangementSeance({
            affectation: { id_groupe: examen.groupes[0].id_groupe, id_user_enseignant: examen.id_createur },
            idGroupes: examen.groupes.map((g) => g.id_groupe),
            titre: "Examen planifié",
            message: `« ${examen.titre} » ${quand} (${examen.salles.map((s) => s.salle?.nom_salle).join(", ")}).`,
            notifierEnseignant: false,
        });
    }
    return charger(id);
};

/** Nombre de surveillances par enseignant (sur une période, ou toutes) : contrôle de l'équilibre. */
export const chargeSurveillances = async ({ idPeriode = null } = {}) => {
    const lignes = await Surveillance.findAll({
        include: [
            { model: SessionExamen, as: "session", attributes: ["id_periode"], where: { statut: { [Op.ne]: "annulee" }, ...(idPeriode ? { id_periode: idPeriode } : {}) } },
            { model: Users, as: "surveillant", attributes: ["id_user", "nom", "prenom"] },
        ],
    });
    const parUser = new Map();
    for (const l of lignes) {
        const actuel = parUser.get(l.id_user) || { id_user: l.id_user, nom: l.surveillant?.nom, prenom: l.surveillant?.prenom, surveillances: 0 };
        actuel.surveillances += 1;
        parUser.set(l.id_user, actuel);
    }
    return [...parUser.values()].sort((a, b) => b.surveillances - a.surveillances);
};
