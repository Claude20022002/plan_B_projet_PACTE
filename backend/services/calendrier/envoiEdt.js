import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import { passage } from "../taches/periodiques.js";
import { Affectation, Appartenir, EnseignementGroupe, EnvoiEdt, Filiere, Groupe, Notification, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { ancetres } from "../planning/groupes.js";
import { appliquerRamadan } from "../planning/ramadan.js";
import { filieresDuResponsable } from "../planning/droits.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { notifierAdministrateurs } from "../../utils/notificationHelper.js";
import { INCLUDES_LIGNE, ligneDe } from "./versionPubliee.js";

/**
 * Envoi de l'emploi du temps du mois (phase R4, remplace l'e-mail avec le PDF). L'administration
 * ou le responsable publie le mois d'une filière : chaque classe reçoit une notification (et un
 * push) et un e-mail avec le lien de l'EDT officiel, imprimable en PDF. Les étudiants voient
 * ensuite cette version publiée (versionPubliee.js) : un changement en masse n'apparaît qu'à la
 * publication suivante, qui envoie la liste des changements. Chaque soir, l'administration est
 * rappelée des classes qui ont des changements non publiés (décision du 21 octobre 2026).
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
// Les séances annulées sont publiées aussi : l'étudiant les voit barrées
const STATUTS_PUBLIES = ["planifie", "confirme", "reporte", "realise", "annule"];
const annulee = (l) => l.statut === "annule";
const MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const CHANGEMENTS_MAX_MESSAGE = 12;

export const libelleMois = (mois) => new Date(`${mois}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const libelleJour = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
export const moisCourant = (maintenant = new Date()) => maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU }).slice(0, 7);
const lienEdt = (idGroupe, mois) => `/emploi-du-temps/mensuel?groupe=${idGroupe}&mois=${mois}`;

/** Séances du mois que suit une classe (les siennes, celles de ses groupes parents, les mutualisées), annulées comprises. */
export const lignesDuMois = async (groupe, mois) => {
    const famille = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere }, attributes: ["id_groupe", "id_groupe_parent"] });
    const ids = [groupe.id_groupe, ...ancetres(groupe, new Map(famille.map((g) => [g.id_groupe, g]))).map((g) => g.id_groupe)];
    const mutualises = (await EnseignementGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_enseignement"] })).map((l) => l.id_enseignement);
    const [a, m] = mois.split("-").map(Number);
    const seances = await Affectation.findAll({
        where: {
            date_seance: { [Op.between]: [`${mois}-01`, new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)] },
            statut: STATUTS_PUBLIES,
            [Op.or]: [{ id_groupe: ids }, ...(mutualises.length ? [{ id_enseignement: mutualises }] : [])],
        },
        include: INCLUDES_LIGNE,
    });
    await appliquerRamadan(seances);
    return seances
        .filter((s) => s.creneau)
        .map(ligneDe)
        .sort((x, y) => `${x.date}${x.debut}`.localeCompare(`${y.date}${y.debut}`));
};

const nomSeance = (l) => `${l.cours}${l.type ? ` (${l.type})` : ""}`;
const quand = (l) => `${libelleJour(l.date)} ${l.debut}`;

/** Changements entre deux envois, en phrases courtes, dans l'ordre du calendrier. */
export const changementsEntre = (avant, apres) => {
    const parId = new Map(avant.map((l) => [l.id, l]));
    const restants = new Set(apres.map((l) => l.id));
    const changements = [];
    for (const l of apres) {
        const ancien = parId.get(l.id);
        // Une annulation se dit une fois ; une séance annulée jamais publiée ne se dit pas
        if (annulee(l)) {
            if (ancien && !annulee(ancien)) changements.push({ date: l.date, texte: `Annulé : ${quand(l)} · ${nomSeance(l)}` });
            continue;
        }
        if (!ancien || annulee(ancien)) {
            changements.push({ date: l.date, texte: `Ajout : ${quand(l)}–${l.fin} · ${nomSeance(l)}${l.salle ? ` · ${l.salle}` : ""}` });
            continue;
        }
        const details = [];
        if (ancien.date !== l.date || ancien.debut !== l.debut || ancien.fin !== l.fin) details.push(`${quand(ancien)} → ${quand(l)}`);
        if (ancien.salle !== l.salle) details.push(`salle ${ancien.salle ?? "non attribuée"} → ${l.salle ?? "non attribuée"}`);
        if (ancien.enseignant !== l.enseignant) details.push(`enseignant ${ancien.enseignant ?? "non attribué"} → ${l.enseignant ?? "non attribué"}`);
        if (details.length) changements.push({ date: l.date, texte: `Modifié : ${nomSeance(l)} (${details.join(" ; ")})` });
    }
    for (const l of avant.filter((x) => !restants.has(x.id) && !annulee(x))) changements.push({ date: l.date, texte: `Annulé ou retiré : ${quand(l)} · ${nomSeance(l)}` });
    return changements.sort((x, y) => x.date.localeCompare(y.date)).map((c) => c.texte);
};

/** Étudiants inscrits directement dans la classe (comptes actifs). */
const etudiantsDe = async (idGroupe) => {
    const ids = (await Appartenir.findAll({ where: { id_groupe: idGroupe }, attributes: ["id_user_etudiant"] })).map((a) => a.id_user_etudiant);
    return ids.length ? Users.findAll({ where: { id_user: ids, actif: true, role: "etudiant" }, attributes: ["id_user", "email"] }) : [];
};

/** Notification (et push) à chaque étudiant, puis e-mails en arrière-plan. */
const prevenir = async (etudiants, { titre, message, texteEmail, lien }) => {
    if (!etudiants.length) return;
    await sequelize.transaction((transaction) =>
        Notification.bulkCreate(
            etudiants.map((e) => ({ id_user: e.id_user, titre, message, type_notification: "info", lue: false, lien })),
            { transaction, individualHooks: true }
        )
    );
    (async () => {
        for (const e of etudiants) {
            if (!e.email) continue;
            try {
                await sendEmail({ to: e.email, subject: `[HESTIM] ${titre}`, text: texteEmail });
            } catch (error) {
                console.error("E-mail d'emploi du temps impossible :", error.message);
            }
        }
    })();
};

/**
 * Envoie l'EDT d'une classe pour un mois : première fois, ou s'il a changé depuis le dernier
 * envoi (avec les changements). Rien si la classe n'a ni séance ni étudiant, ou rien n'a changé.
 * @returns {"envoye"|"modifie"|"inchange"|"vide"}
 */
const envoyerClasse = async (groupe, mois, { idUser = null }) => {
    const [lignes, precedent] = await Promise.all([lignesDuMois(groupe, mois), EnvoiEdt.findOne({ where: { id_groupe: groupe.id_groupe, mois } })]);
    const etudiants = await etudiantsDe(groupe.id_groupe);
    const nombre = lignes.filter((l) => !annulee(l)).length;
    if (!precedent && (!nombre || !etudiants.length)) return "vide";
    const nomMois = libelleMois(mois);
    const lien = lienEdt(groupe.id_groupe, mois);
    const adresse = `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}${lien}`;

    if (!precedent) {
        await prevenir(etudiants, {
            titre: `Emploi du temps de ${nomMois}`,
            message: `${groupe.nom_groupe} : ${nombre} séance(s). Consultez-le ou imprimez-le en PDF depuis l'application.`,
            texteEmail: `Bonjour,\n\nL'emploi du temps de ${nomMois} (${groupe.nom_groupe}) est publié : ${nombre} séance(s).\nIl se consulte et s'imprime en PDF ici : ${adresse}\n\nVous serez prévenu de chaque changement.\n\nHESTIM Planner`,
            lien,
        });
        await EnvoiEdt.create({ id_groupe: groupe.id_groupe, mois, seances: lignes, envoye_le: new Date(), nb_destinataires: etudiants.length, id_user_publication: idUser });
        return "envoye";
    }

    const changements = changementsEntre(precedent.seances ?? [], lignes);
    if (!changements.length) return "inchange";
    const liste = changements.slice(0, CHANGEMENTS_MAX_MESSAGE);
    const suite = changements.length > liste.length ? `\n… et ${changements.length - liste.length} autre(s).` : "";
    await prevenir(etudiants, {
        titre: `Emploi du temps de ${nomMois} modifié`,
        message: `${groupe.nom_groupe} : ${changements.length} changement(s). ${liste[0]}${changements.length > 1 ? " …" : ""}`.slice(0, 480),
        texteEmail: `Bonjour,\n\nL'emploi du temps de ${nomMois} (${groupe.nom_groupe}) a changé :\n\n${liste.map((c) => `• ${c}`).join("\n")}${suite}\n\nEmploi du temps à jour (imprimable en PDF) : ${adresse}\n\nHESTIM Planner`,
        lien,
    });
    await precedent.update({ seances: lignes, envoye_le: new Date(), nb_destinataires: etudiants.length, ...(idUser ? { id_user_publication: idUser } : {}) });
    return "modifie";
};

const bilanVide = () => ({ classes: 0, envoye: 0, modifie: 0, inchange: 0, vide: 0 });

/** Publier et envoyer le mois d'une filière (administration, ou responsable de cette filière). */
export const publierEdtDuMois = async (user, { mois, id_filiere: idFiliere } = {}) => {
    if (!MOIS.test(String(mois ?? ""))) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    const id = Number(idFiliere);
    const filiere = Number.isInteger(id) && id > 0 ? await Filiere.findByPk(id) : null;
    if (!filiere) throw new ErreurMetier("Filière introuvable", 404);
    if (user.role !== "admin" && !(user.role === "enseignant" && (await filieresDuResponsable(user.id_user)).includes(filiere.id_filiere))) {
        throw new ErreurMetier("Réservé à l'administration et au responsable de la filière", 403);
    }
    const groupes = await Groupe.findAll({ where: { id_filiere: filiere.id_filiere } });
    const bilan = bilanVide();
    for (const groupe of groupes) {
        bilan[await envoyerClasse(groupe, mois, { idUser: user.id_user })] += 1;
        bilan.classes += 1;
    }
    return { mois, filiere: { id: filiere.id_filiere, code: filiere.code_filiere }, ...bilan };
};

/** Changements d'une classe pour un mois depuis sa dernière publication (en phrases), ou null s'il n'est pas publié. */
const changementsNonPublies = async (groupe, envoi) => (envoi ? changementsEntre(envoi.seances ?? [], await lignesDuMois(groupe, envoi.mois)) : null);

/**
 * Où en sont les envois d'une filière pour un mois (affiché sur la page de l'EDT du mois) : publié
 * ou non, et les classes dont le planning a changé depuis, à republier.
 */
export const etatEnvois = async (user, { mois, id_filiere: idFiliere } = {}) => {
    if (!MOIS.test(String(mois ?? ""))) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    if (user.role === "etudiant") throw new ErreurMetier("Accès interdit", 403);
    const groupes = await Groupe.findAll({ where: { id_filiere: Number(idFiliere) || 0 } });
    const envois = groupes.length ? await EnvoiEdt.findAll({ where: { mois, id_groupe: groupes.map((g) => g.id_groupe) } }) : [];
    const aRepublier = [];
    for (const envoi of envois) {
        const groupe = groupes.find((g) => g.id_groupe === envoi.id_groupe);
        const changements = await changementsNonPublies(groupe, envoi);
        if (changements?.length) aRepublier.push({ id_groupe: groupe.id_groupe, nom_groupe: groupe.nom_groupe, changements: changements.length });
    }
    return {
        publie: envois.length > 0,
        dernier_envoi: envois.reduce((d, e) => (!d || e.envoye_le > d ? e.envoye_le : d), null),
        destinataires: envois.reduce((t, e) => t + e.nb_destinataires, 0),
        classes_a_republier: aRepublier,
    };
};

/**
 * Rappel du soir à l'administration : les classes dont un mois publié (le mois en cours ou les
 * suivants) a des changements non publiés. Les étudiants ne reçoivent rien : ils verront ces
 * changements à la prochaine publication (« Publier et envoyer »).
 * @returns {{ classes: number, a_republier: number }}
 */
export const rappelerChangementsNonPublies = async (maintenant = new Date()) => {
    const envois = await EnvoiEdt.findAll({ where: { mois: { [Op.gte]: moisCourant(maintenant) } }, include: [{ model: Groupe, as: "groupe" }] });
    const liste = [];
    for (const envoi of envois.filter((e) => e.groupe)) {
        const changements = await changementsNonPublies(envoi.groupe, envoi);
        if (changements?.length) liste.push({ groupe: envoi.groupe, mois: envoi.mois, nombre: changements.length });
    }
    if (liste.length) {
        const apercu = liste.slice(0, 5).map((c) => `${c.groupe.nom_groupe} (${libelleMois(c.mois)}, ${c.nombre})`).join(", ");
        await notifierAdministrateurs({
            titre: "Changements à publier",
            message: `${liste.length} classe(s) ont des changements que les étudiants ne voient pas encore : ${apercu}${liste.length > 5 ? "…" : ""}. Publiez le mois concerné depuis « EDT du mois ».`,
            type_notification: "warning",
            lien: lienEdt(liste[0].groupe.id_groupe, liste[0].mois),
        });
    }
    return { classes: envois.length, a_republier: liste.length };
};

// ── Planificateur (lancé par server.js, jamais pendant les tests) ─────────

/** Chaque jour à EDT_ENVOI_HEURE (18 h par défaut, heure de l'école) : rappel des changements non publiés. */
export const demarrerRenvoiQuotidien = () => {
    const heure = Number(process.env.EDT_ENVOI_HEURE ?? 18);
    if (!Number.isInteger(heure) || heure < 0 || heure > 23) return null;
    let dernierJour = null;
    const verifier = async () => {
        const maintenant = new Date();
        const local = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(maintenant);
        const partie = (type) => local.find((p) => p.type === type)?.value;
        const jourLocal = `${partie("year")}-${partie("month")}-${partie("day")}`;
        if (Number(partie("hour")) !== heure || dernierJour === jourLocal) return;
        dernierJour = jourLocal;
        // Une seule instance à la fois (lot A-7)
        await passage("rappel-edt", () => rappelerChangementsNonPublies(maintenant), (bilan) => `${bilan.a_republier} classe(s) à republier sur ${bilan.classes}`);
    };
    const minuterie = setInterval(verifier, 10 * 60 * 1000);
    minuterie.unref();
    return minuterie;
};
