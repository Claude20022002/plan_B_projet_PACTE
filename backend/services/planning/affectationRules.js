import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Evenement,
    Filiere,
    Groupe,
    Salle,
    Users,
} from "../../models/index.js";
import { anneeDepuisNiveau } from "../../config/referentiel.js";
import { groupesLies } from "./groupes.js";
import { lireParametre, minutesTrajet } from "./referentiel.js";
import { disponibiliteEnseignant } from "./enseignants.js";

/**
 * Règles d'une séance (phase B). `validerAffectation` renvoie la liste des violations, sans
 * rien écrire : chacune a un code, un message en français, `bloquant` (vrai = la séance est
 * refusée en 409, sauf forçage justifié par l'administration) et parfois la séance en cause.
 *
 * Bloquant : chevauchement de salle, d'enseignant (co-enseignants compris) ou de groupe
 * (hiérarchie promotion > TD > TP et groupes mutualisés compris), jour et grille du créneau,
 * pause du vendredi, samedi après-midi, capacité, type de salle et équipements, salle hors
 * service, enseignant indisponible (vacataire opt-in, permanent opt-out), trajet entre campus,
 * événement bloquant, maximum d'heures par jour, date passée.
 * Avertissement : vœu « à éviter », plafond hebdomadaire, enseignant hors de l'équipe.
 */

// Séances qui occupent leur créneau (une séance reportée l'occupe à sa nouvelle date)
export const STATUTS_ACTIFS = ["planifie", "confirme", "reporte"];

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const APRES_MIDI = 12 * 60 + 30;

export const minutes = (heure) => {
    const [h, m] = String(heure).split(":").map(Number);
    return h * 60 + (m || 0);
};
const hhmm = (heure) => String(heure).slice(0, 5);
export const jourDe = (date) => JOURS[new Date(`${date}T12:00:00Z`).getUTCDay()];
export const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: FUSEAU });
const seChevauchent = (a, b) => minutes(a.heure_debut) < minutes(b.heure_fin) && minutes(b.heure_debut) < minutes(a.heure_fin);
const duree = (creneau) => minutes(creneau.heure_fin) - minutes(creneau.heure_debut);
const nomComplet = (u) => (u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() : "");

/** Lundi et samedi de la semaine d'une date (pour le plafond hebdomadaire). */
const semaineDe = (date) => {
    const d = new Date(`${date}T12:00:00Z`);
    const decalage = (d.getUTCDay() + 6) % 7;
    const lundi = new Date(d);
    lundi.setUTCDate(d.getUTCDate() - decalage);
    const dimanche = new Date(lundi);
    dimanche.setUTCDate(lundi.getUTCDate() + 6);
    return [lundi.toISOString().slice(0, 10), dimanche.toISOString().slice(0, 10)];
};

// Équipe d'un enseignement : enseignants proposés ou acceptés (un refus libère l'enseignant)
const INCLUDE_EQUIPE = {
    model: EnseignementEnseignant,
    as: "services",
    attributes: ["id_user", "role", "statut_service"],
    where: { statut_service: { [Op.ne]: "refuse" } },
    required: false,
};

/** Enseignants qu'une séance occupe : le titulaire et les co-enseignants de son enseignement. */
const enseignantsDe = (seance, enseignement) =>
    [...new Set([seance.id_user_enseignant, ...(enseignement?.services ?? []).filter((s) => s.role === "co_enseignant").map((s) => s.id_user)])].filter(Boolean);

/** Groupes qu'une séance réunit : ceux de son enseignement (mutualisation), sinon son groupe. */
const groupesDe = (seance, enseignement) => [...new Set([seance.id_groupe, ...(enseignement?.groupes ?? []).map((g) => g.id_groupe)])].filter(Boolean);

/** Un événement bloquant concerne-t-il cette séance ? */
const evenementConcerne = (evenement, { salle, groupe, groupesOccupes, creneau }) => {
    if (evenement.heure_debut && evenement.heure_fin && !seChevauchent(creneau, evenement)) return false;
    switch (evenement.portee) {
        case "etablissement":
            return true;
        case "campus":
            return Boolean(salle) && salle.id_campus === evenement.id_cible;
        case "filiere":
            return groupe.id_filiere === evenement.id_cible;
        case "niveau":
            return (
                (!evenement.id_cible || groupe.id_filiere === evenement.id_cible) &&
                (groupe.annee ?? anneeDepuisNiveau(groupe.niveau)) === anneeDepuisNiveau(evenement.niveau)
            );
        case "groupe":
            return groupesOccupes.has(evenement.id_cible);
        default:
            return false;
    }
};

/**
 * Valide une séance (création ou modification). `seance` : date_seance, id_creneau, id_salle,
 * id_groupe, id_user_enseignant, id_cours, id_enseignement facultatif, id_affectation si elle
 * existe déjà (exclue des comparaisons). Avec `verrouiller`, les lignes de la salle, des
 * enseignants et des groupes sont verrouillées dans `transaction` : deux enregistrements
 * concurrents sur les mêmes ressources passent l'un après l'autre.
 */
export const validerAffectation = async (seance, { transaction, verrouiller = false } = {}) => {
    const violations = [];
    const signaler = (code, message, extra = {}, bloquant = true) => violations.push({ code, bloquant, message, ...extra });
    const options = { transaction };

    const [creneau, groupe, salle, cours, enseignement] = await Promise.all([
        Creneau.findByPk(seance.id_creneau, options),
        Groupe.findByPk(seance.id_groupe, { ...options, include: [{ model: Filiere, as: "filiere" }] }),
        seance.id_salle ? Salle.findByPk(seance.id_salle, options) : null,
        Cours.findByPk(seance.id_cours, options),
        seance.id_enseignement
            ? Enseignement.findByPk(seance.id_enseignement, {
                  ...options,
                  include: [
                      { model: Groupe, as: "groupes", through: { attributes: [] } },
                      { model: CoursComposante, as: "composante" },
                      INCLUDE_EQUIPE,
                  ],
              })
            : null,
    ]);
    if (!creneau) signaler("introuvable", "Créneau introuvable");
    if (!groupe) signaler("introuvable", "Groupe introuvable");
    if (seance.id_salle && !salle) signaler("introuvable", "Salle introuvable");
    if (!cours) signaler("introuvable", "Module introuvable");
    if (seance.id_enseignement && !enseignement) signaler("introuvable", "Enseignement introuvable");
    if (violations.length) return { violations, bloquant: true };

    const idsEnseignants = enseignantsDe(seance, enseignement);
    const idsGroupes = groupesDe(seance, enseignement);
    const groupesOccupes = new Set((await Promise.all(idsGroupes.map((id) => groupesLies(id, transaction)))).flat());

    if (verrouiller) {
        const lock = transaction.LOCK.UPDATE;
        if (salle) await Salle.findByPk(salle.id_salle, { transaction, lock });
        await Users.findAll({ where: { id_user: idsEnseignants }, transaction, lock });
        await Groupe.findAll({ where: { id_groupe: [...groupesOccupes] }, transaction, lock });
    }

    const enseignants = await Users.findAll({
        where: { id_user: idsEnseignants },
        attributes: ["id_user", "nom", "prenom"],
        include: [{ model: Enseignant, as: "enseignant" }],
        transaction,
    });
    const parIdEnseignant = new Map(enseignants.map((u) => [u.id_user, u]));
    const date = seance.date_seance;
    const jour = jourDe(date);
    const regime = groupe.filiere?.regime ?? "initiale";

    // ── Calendrier et grille ──────────────────────────────────────────────
    if (date < aujourdhui()) signaler("date_passee", `La date ${date} est passée`);
    if (jour !== creneau.jour_semaine) {
        signaler("jour_creneau", `Le ${date} est un ${jour}, le créneau choisi est celui du ${creneau.jour_semaine}`);
    }
    if (creneau.regime !== regime) {
        signaler("grille_regime", `Ce créneau appartient à la grille « ${creneau.regime} », la filière suit la grille « ${regime} »`);
    }
    if (regime === "initiale" && jour === "vendredi") {
        const pause = await lireParametre("pause_vendredi");
        if (pause?.active && seChevauchent(creneau, { heure_debut: pause.debut, heure_fin: pause.fin })) {
            signaler("pause_vendredi", `Le créneau empiète sur la pause du vendredi (${pause.debut}-${pause.fin})`);
        }
    }
    if (regime === "initiale" && jour === "samedi" && minutes(creneau.heure_debut) >= APRES_MIDI && !(await lireParametre("samedi_apres_midi_initiale"))) {
        signaler("samedi_apres_midi", "Pas de cours de formation initiale le samedi après-midi");
    }

    // ── Salle ─────────────────────────────────────────────────────────────
    const composante = enseignement?.composante;
    const effectif = enseignement
        ? enseignement.groupes.reduce((total, g) => total + (g.effectif || 0), 0)
        : groupe.effectif || 0;
    if (salle) {
        if (salle.disponible === false) signaler("salle_indisponible", `La salle ${salle.nom_salle} est hors service`);
        if (effectif > salle.capacite) signaler("capacite", `${effectif} étudiants pour ${salle.capacite} places en ${salle.nom_salle}`);
        if (composante?.type_salle_requis && salle.type_salle !== composante.type_salle_requis) {
            signaler("type_salle", `Ce ${composante.type} demande une salle « ${composante.type_salle_requis} », ${salle.nom_salle} est « ${salle.type_salle} »`);
        }
        const manquants = (composante?.equipements_requis ?? []).filter((e) => !(salle.equipements ?? []).includes(e));
        if (manquants.length) signaler("equipements", `Équipements absents de ${salle.nom_salle} : ${manquants.join(", ")}`);
        if (composante?.modalite === "distanciel") signaler("salle_distanciel", "Cette composante est en distanciel : une salle n'est pas nécessaire", {}, false);
    } else if (!composante || composante.modalite === "presentiel") {
        signaler("salle_requise", "Une séance en présentiel a besoin d'une salle");
    }

    // ── Séances du même jour ──────────────────────────────────────────────
    const duJour = await Affectation.findAll({
        where: {
            date_seance: date,
            statut: STATUTS_ACTIFS,
            ...(seance.id_affectation ? { id_affectation: { [Op.ne]: seance.id_affectation } } : {}),
        },
        include: [
            { model: Creneau, as: "creneau" },
            { model: Salle, as: "salle" },
            { model: Cours, as: "cours", attributes: ["nom_cours"] },
            {
                model: Enseignement,
                as: "enseignement",
                include: [{ model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } }, INCLUDE_EQUIPE],
            },
        ],
        transaction,
    });
    const autres = duJour.map((a) => ({
        seance: a,
        enseignants: enseignantsDe(a, a.enseignement),
        groupes: groupesDe(a, a.enseignement),
    }));
    const libelle = (a) => `${a.cours?.nom_cours ?? "une séance"} (${hhmm(a.creneau.heure_debut)}-${hhmm(a.creneau.heure_fin)})`;

    for (const autre of autres) {
        const a = autre.seance;
        if (!seChevauchent(creneau, a.creneau)) continue;
        if (salle && a.id_salle === salle.id_salle) {
            signaler("conflit_salle", `${salle.nom_salle} est déjà occupée : ${libelle(a)}`, { id_affectation: a.id_affectation, type_conflit: "salle" });
        }
        for (const idUser of autre.enseignants.filter((id) => idsEnseignants.includes(id))) {
            signaler("conflit_enseignant", `${nomComplet(parIdEnseignant.get(idUser))} a déjà cours : ${libelle(a)}`, {
                id_affectation: a.id_affectation,
                type_conflit: "enseignant",
                id_user: idUser,
            });
        }
        if (autre.groupes.some((id) => groupesOccupes.has(id))) {
            signaler("conflit_groupe", `Le groupe (ou un groupe qui le contient ou qu'il contient) a déjà cours : ${libelle(a)}`, {
                id_affectation: a.id_affectation,
                type_conflit: "groupe",
            });
        }
    }

    // Trajet entre campus pour les enseignants et les groupes, entre deux séances qui se suivent
    if (salle) {
        const concernees = autres.filter(
            (o) =>
                o.seance.salle &&
                o.seance.salle.id_campus !== salle.id_campus &&
                !seChevauchent(creneau, o.seance.creneau) &&
                (o.enseignants.some((id) => idsEnseignants.includes(id)) || o.groupes.some((id) => groupesOccupes.has(id)))
        );
        for (const o of concernees) {
            const avant = minutes(o.seance.creneau.heure_fin) <= minutes(creneau.heure_debut);
            const ecart = avant ? minutes(creneau.heure_debut) - minutes(o.seance.creneau.heure_fin) : minutes(o.seance.creneau.heure_debut) - minutes(creneau.heure_fin);
            const necessaire = await minutesTrajet(o.seance.salle.id_campus, salle.id_campus);
            if (ecart < necessaire) {
                signaler("trajet_campus", `${ecart} min pour changer de campus ${avant ? "après" : "avant"} ${libelle(o.seance)} (${necessaire} min nécessaires)`, {
                    id_affectation: o.seance.id_affectation,
                });
            }
        }
    }

    // Maximum d'heures par jour
    const dureeSeance = duree(creneau);
    const maxGroupe = (await lireParametre("max_heures_jour_groupe")) * 60;
    const minutesGroupe = autres.filter((o) => o.groupes.some((id) => groupesOccupes.has(id))).reduce((t, o) => t + duree(o.seance.creneau), 0);
    if (minutesGroupe + dureeSeance > maxGroupe) {
        signaler("max_heures_groupe", `Le groupe aurait ${((minutesGroupe + dureeSeance) / 60).toFixed(1)} h de cours ce jour-là (maximum ${maxGroupe / 60} h)`);
    }
    const maxEnseignant = (await lireParametre("max_heures_jour_enseignant")) * 60;
    for (const idUser of idsEnseignants) {
        const minutesProf = autres.filter((o) => o.enseignants.includes(idUser)).reduce((t, o) => t + duree(o.seance.creneau), 0);
        if (minutesProf + dureeSeance > maxEnseignant) {
            signaler("max_heures_enseignant", `${nomComplet(parIdEnseignant.get(idUser))} aurait ${((minutesProf + dureeSeance) / 60).toFixed(1)} h de cours ce jour-là (maximum ${maxEnseignant / 60} h)`, {
                id_user: idUser,
            });
        }
    }

    // ── Événements bloquants (fériés, examens, activités…) ────────────────
    const evenements = await Evenement.findAll({
        where: { bloque_affectations: true, date_debut: { [Op.lte]: date }, date_fin: { [Op.gte]: date } },
        transaction,
    });
    for (const evenement of evenements.filter((e) => evenementConcerne(e, { salle, groupe, groupesOccupes, creneau }))) {
        signaler("evenement", `${evenement.titre}${evenement.date_confirmee === false ? " (date à confirmer)" : ""}`, { id_evenement: evenement.id_evenement });
    }

    // ── Enseignants : disponibilité, vœux, plafond hebdomadaire, équipe ───
    const [lundi, dimanche] = semaineDe(date);
    for (const idUser of idsEnseignants) {
        const nom = nomComplet(parIdEnseignant.get(idUser));
        const dispo = await disponibiliteEnseignant({ idUser, date, idCreneau: creneau.id_creneau });
        if (!dispo.disponible) signaler("enseignant_indisponible", `${nom} : ${dispo.raison}`, { id_user: idUser });
        else if (dispo.preference === "eviter") signaler("voeu_eviter", `${nom} préfère éviter ce créneau`, { id_user: idUser }, false);

        const plafond = parIdEnseignant.get(idUser)?.enseignant?.max_heures_semaine;
        if (plafond) {
            const semaine = await Affectation.findAll({
                where: {
                    id_user_enseignant: idUser,
                    statut: STATUTS_ACTIFS,
                    date_seance: { [Op.between]: [lundi, dimanche] },
                    ...(seance.id_affectation ? { id_affectation: { [Op.ne]: seance.id_affectation } } : {}),
                },
                include: [{ model: Creneau, as: "creneau" }],
                transaction,
            });
            const total = semaine.reduce((t, a) => t + duree(a.creneau), 0) + dureeSeance;
            if (total > plafond * 60) signaler("max_heures_semaine", `${nom} dépasserait son plafond de ${plafond} h cette semaine (${(total / 60).toFixed(1)} h)`, { id_user: idUser }, false);
        }
    }
    if (enseignement && !enseignement.services.some((s) => s.id_user === seance.id_user_enseignant)) {
        signaler("hors_equipe", "Cet enseignant n'est pas dans l'équipe pédagogique de l'enseignement", { id_user: seance.id_user_enseignant }, false);
    }

    return { violations, bloquant: violations.some((v) => v.bloquant) };
};
