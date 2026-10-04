import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Affectation,
    Appartenir,
    Conflit,
    ConflitAffectation,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    Groupe,
    HistoriqueAffectation,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS, minutes, validerAffectation } from "./affectationRules.js";
import { descendants, groupesLies } from "./groupes.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Enregistrement d'une séance sous les règles de la phase B : validation sous verrou dans la
 * transaction, refus en 409 quand une règle bloque, sauf forçage par l'administration avec
 * une justification (tracé dans l'historique, et les chevauchements forcés deviennent des
 * conflits ouverts). Les conflits qui ne tiennent plus sont résolus d'office.
 */

export class ViolationsBloquantes extends Error {
    constructor(violations) {
        super("La séance enfreint des règles de planification");
        this.status = 409;
        this.violations = violations;
    }
}

// Champs dont la modification oblige à revalider la séance
const CHAMPS_PLANNING = ["date_seance", "id_creneau", "id_salle", "id_groupe", "id_user_enseignant", "id_cours", "id_enseignement"];
const TYPES_CONFLIT = { conflit_salle: "salle", conflit_enseignant: "enseignant", conflit_groupe: "groupe" };

const instantane = (affectation) => {
    const { date_seance, id_creneau, id_salle, id_groupe, id_user_enseignant, id_cours, id_enseignement, statut, commentaire } = affectation;
    return { date_seance, id_creneau, id_salle, id_groupe, id_user_enseignant, id_cours, id_enseignement, statut, commentaire };
};

/**
 * Valide puis enregistre une séance. `donnees` : champs de l'affectation ; `id` : séance à
 * modifier (sinon création) ; `action` : action d'historique imposée (ex. « report ») ;
 * `forcer` + `justification` : réservé à l'administration.
 * Retourne { affectation, violations, force, changement } — `changement` dit si la date,
 * l'heure, la salle ou le statut ont bougé (pour notifier).
 */
export const enregistrerSeance = async ({ donnees, id = null, user, forcer = false, justification = null, action = null }) => {
    const resultat = await sequelize.transaction(async (transaction) => {
        const existante = id ? await Affectation.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }) : null;
        if (id && !existante) throw new ErreurMetier("Affectation non trouvée", 404);
        const avant = existante ? instantane(existante) : null;
        const seance = { ...(avant ?? { statut: "planifie" }), ...donnees, ...(id ? { id_affectation: id } : {}) };

        const redevientActive = avant && !STATUTS_ACTIFS.includes(avant.statut) && STATUTS_ACTIFS.includes(seance.statut);
        const planningModifie = !avant || CHAMPS_PLANNING.some((c) => String(seance[c] ?? "") !== String(avant[c] ?? ""));
        const aValider = STATUTS_ACTIFS.includes(seance.statut) && (planningModifie || redevientActive);

        const { violations } = aValider ? await validerAffectation(seance, { transaction, verrouiller: true }) : { violations: [] };
        const bloquantes = violations.filter((v) => v.bloquant);
        const force = bloquantes.length > 0;
        if (force) {
            if (!forcer || user.role !== "admin") throw new ViolationsBloquantes(violations);
            if (!String(justification || "").trim()) throw new ErreurMetier("Indiquez pourquoi la séance est enregistrée malgré les règles", 400);
        }

        const { id_affectation: _ignore, ...champs } = seance;
        const affectation = existante
            ? await existante.update(champs, { transaction })
            : await Affectation.create({ ...champs, id_user_admin: user.id_user }, { transaction });

        const devientInactive = avant && STATUTS_ACTIFS.includes(avant.statut) && !STATUTS_ACTIFS.includes(affectation.statut);
        await HistoriqueAffectation.create(
            {
                id_affectation: affectation.id_affectation,
                id_user: user.id_user,
                action: action ?? (!existante ? "creation" : affectation.statut === "annule" && devientInactive ? "annulation" : "modification"),
                anciens_donnees: avant,
                nouveaux_donnees: { ...instantane(affectation), ...(force ? { violations: bloquantes } : {}) },
                commentaire: force ? `Forcé : ${justification.trim()}` : null,
                force,
            },
            { transaction }
        );

        if (force) await ouvrirConflits(affectation.id_affectation, bloquantes, transaction);
        if (existante) await resoudreConflitsObsoletes(affectation.id_affectation, transaction);

        const changement =
            Boolean(avant) && (["date_seance", "id_creneau", "id_salle"].some((c) => String(avant[c] ?? "") !== String(affectation[c] ?? "")) || avant.statut !== affectation.statut);
        return { affectation, violations, force, avant, changement };
    });
    return resultat;
};

/** Vérifie une séance sans rien enregistrer (POST /affectations/verifier). */
export const verifierSeance = async (seance) => validerAffectation(seance);

/** Supprime une séance ; ses conflits sont résolus avant (ils perdraient l'une de leurs séances). */
export const supprimerSeance = async (id) =>
    sequelize.transaction(async (transaction) => {
        const affectation = await Affectation.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!affectation) throw new ErreurMetier("Affectation non trouvée", 404);
        const liens = await ConflitAffectation.findAll({ where: { id_affectation: id }, transaction });
        if (liens.length) {
            await Conflit.update(
                { resolu: true, date_resolution: new Date() },
                { where: { id_conflit: liens.map((l) => l.id_conflit), resolu: false }, transaction }
            );
        }
        const instant = instantane(affectation);
        await affectation.destroy({ transaction });
        return instant;
    });

/** Conflits ouverts pour les chevauchements acceptés par forçage (un par paire et par type). */
const ouvrirConflits = async (idAffectation, bloquantes, transaction) => {
    for (const v of bloquantes.filter((x) => TYPES_CONFLIT[x.code] && x.id_affectation)) {
        const type = TYPES_CONFLIT[v.code];
        const paire = [idAffectation, v.id_affectation];
        const existants = await Conflit.findAll({
            where: { type_conflit: type, resolu: false },
            include: [{ model: Affectation, as: "affectations", attributes: ["id_affectation"], where: { id_affectation: paire } }],
            transaction,
        });
        if (existants.some((c) => c.affectations.length === 2)) continue;
        const conflit = await Conflit.create({ type_conflit: type, description: v.message, resolu: false }, { transaction });
        await ConflitAffectation.bulkCreate(paire.map((id_affectation) => ({ id_conflit: conflit.id_conflit, id_affectation })), { transaction });
    }
};

const chargerPourConflit = (id, transaction) =>
    Affectation.findByPk(id, {
        include: [
            { model: Creneau, as: "creneau" },
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
    });

const enseignantsDe = (a) => new Set([a.id_user_enseignant, ...(a.enseignement?.services ?? []).filter((s) => s.role === "co_enseignant").map((s) => s.id_user)]);
const groupesDe = (a) => [...new Set([a.id_groupe, ...(a.enseignement?.groupes ?? []).map((g) => g.id_groupe)])];

/** Le conflit tient-il encore entre ces deux séances ? */
const conflitTient = async (type, a, b, transaction) => {
    if (!a || !b || !STATUTS_ACTIFS.includes(a.statut) || !STATUTS_ACTIFS.includes(b.statut)) return false;
    if (a.date_seance !== b.date_seance) return false;
    const chevauche = minutes(a.creneau.heure_debut) < minutes(b.creneau.heure_fin) && minutes(b.creneau.heure_debut) < minutes(a.creneau.heure_fin);
    if (!chevauche) return false;
    if (type === "salle") return a.id_salle != null && a.id_salle === b.id_salle;
    if (type === "enseignant") return [...enseignantsDe(a)].some((id) => enseignantsDe(b).has(id));
    const lies = new Set((await Promise.all(groupesDe(a).map((g) => groupesLies(g, transaction)))).flat());
    return groupesDe(b).some((g) => lies.has(g));
};

/** Résout les conflits d'une séance qui ne tiennent plus (séance déplacée, annulée…). */
export const resoudreConflitsObsoletes = async (idAffectation, transaction) => {
    const liens = await ConflitAffectation.findAll({ where: { id_affectation: idAffectation }, transaction });
    if (!liens.length) return 0;
    const conflits = await Conflit.findAll({
        where: { id_conflit: liens.map((l) => l.id_conflit), resolu: false },
        include: [{ model: Affectation, as: "affectations", attributes: ["id_affectation"] }],
        transaction,
    });
    let resolus = 0;
    for (const conflit of conflits) {
        const [a, b] = await Promise.all(conflit.affectations.slice(0, 2).map((x) => chargerPourConflit(x.id_affectation, transaction)));
        if (!(await conflitTient(conflit.type_conflit, a, b, transaction))) {
            await conflit.update({ resolu: true, date_resolution: new Date() }, { transaction });
            resolus += 1;
        }
    }
    return resolus;
};

/** Étudiants concernés : ceux du groupe et de ses sous-groupes (un étudiant est inscrit dans son groupe le plus fin). */
const groupesANotifier = async (idsGroupes) => {
    const ids = new Set();
    for (const id of idsGroupes) {
        const groupe = await Groupe.findByPk(id);
        if (!groupe) continue;
        const famille = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere } });
        [groupe, ...descendants(groupe, famille)].forEach((g) => ids.add(g.id_groupe));
    }
    return [...ids];
};

/**
 * Prévient l'enseignant et les étudiants d'un changement de séance (modification, report,
 * annulation, suppression). Ne bloque jamais l'enregistrement.
 */
export const notifierChangementSeance = async ({ affectation, titre, message, idGroupes = null, notifierEnseignant = true }) => {
    try {
        if (notifierEnseignant) {
            await creerNotificationsMultiples({ id_users: [affectation.id_user_enseignant], titre, message, type_notification: "warning", lien: "/mes-affectations" });
        }
        const groupes = await groupesANotifier(idGroupes ?? [affectation.id_groupe]);
        const appartenances = await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] });
        const etudiants = [...new Set(appartenances.map((a) => a.id_user_etudiant))];
        if (etudiants.length) {
            await creerNotificationsMultiples({ id_users: etudiants, titre, message, type_notification: "warning", lien: "/emploi-du-temps/etudiant" });
        }
    } catch (error) {
        console.error("Notification de changement de séance impossible :", error.message);
    }
};

