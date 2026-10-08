import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Affectation,
    Appartenir,
    Cours,
    CoursComposante,
    Creneau,
    Enseignement,
    EnseignementGroupe,
    EnvoiEdt,
    Filiere,
    Groupe,
    Notification,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { ancetres } from "../planning/groupes.js";
import { appliquerRamadan } from "../planning/ramadan.js";
import { filieresDuResponsable } from "../planning/droits.js";
import { sendEmail } from "../../utils/sendEmail.js";

/**
 * Envoi de l'emploi du temps du mois (phase R4, remplace l'e-mail avec le PDF). L'administration
 * ou le responsable publie le mois d'une filière : chaque classe reçoit une notification (et un
 * push) et un e-mail avec le lien de l'EDT officiel, imprimable en PDF. Ensuite, chaque soir,
 * un mois déjà publié est renvoyé s'il a changé, avec la liste des changements. Un mois jamais
 * publié n'est jamais envoyé : un planning en préparation ne part pas aux étudiants.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const STATUTS_ACTIFS = ["planifie", "confirme", "reporte", "realise"];
const MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const CHANGEMENTS_MAX_MESSAGE = 12;

const hhmm = (h) => String(h ?? "").slice(0, 5);
export const libelleMois = (mois) => new Date(`${mois}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const libelleJour = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
export const moisCourant = (maintenant = new Date()) => maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU }).slice(0, 7);
const lienEdt = (idGroupe, mois) => `/emploi-du-temps/mensuel?groupe=${idGroupe}&mois=${mois}`;

/** Séances actives du mois que suit une classe (les siennes, celles de ses groupes parents, les mutualisées). */
export const lignesDuMois = async (groupe, mois) => {
    const famille = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere }, attributes: ["id_groupe", "id_groupe_parent"] });
    const ids = [groupe.id_groupe, ...ancetres(groupe, new Map(famille.map((g) => [g.id_groupe, g]))).map((g) => g.id_groupe)];
    const mutualises = (await EnseignementGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_enseignement"] })).map((l) => l.id_enseignement);
    const [a, m] = mois.split("-").map(Number);
    const seances = await Affectation.findAll({
        where: {
            date_seance: { [Op.between]: [`${mois}-01`, new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)] },
            statut: STATUTS_ACTIFS,
            [Op.or]: [{ id_groupe: ids }, ...(mutualises.length ? [{ id_enseignement: mutualises }] : [])],
        },
        include: [
            { model: Cours, as: "cours", attributes: ["nom_cours", "type_cours"] },
            { model: Creneau, as: "creneau" },
            { model: Salle, as: "salle" },
            { model: Users, as: "enseignant", attributes: ["nom", "prenom"] },
            { model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["type", "modalite"] }] },
        ],
    });
    await appliquerRamadan(seances);
    return seances
        .filter((s) => s.creneau)
        .map((s) => ({
            id: s.id_affectation,
            date: String(s.date_seance).slice(0, 10),
            debut: hhmm(s.creneau.heure_debut),
            fin: hhmm(s.creneau.heure_fin),
            cours: s.cours?.nom_cours ?? "Séance",
            type: s.enseignement?.composante?.type ?? s.cours?.type_cours ?? null,
            salle: s.enseignement?.composante?.modalite === "distanciel" ? "Distanciel" : s.salle?.nom_salle ?? null,
            enseignant: s.enseignant ? `${s.enseignant.prenom} ${s.enseignant.nom}` : null,
        }))
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
        if (!ancien) {
            changements.push({ date: l.date, texte: `Ajout : ${quand(l)}–${l.fin} · ${nomSeance(l)}${l.salle ? ` · ${l.salle}` : ""}` });
            continue;
        }
        const details = [];
        if (ancien.date !== l.date || ancien.debut !== l.debut || ancien.fin !== l.fin) details.push(`${quand(ancien)} → ${quand(l)}`);
        if (ancien.salle !== l.salle) details.push(`salle ${ancien.salle ?? "non attribuée"} → ${l.salle ?? "non attribuée"}`);
        if (ancien.enseignant !== l.enseignant) details.push(`enseignant ${ancien.enseignant ?? "non attribué"} → ${l.enseignant ?? "non attribué"}`);
        if (details.length) changements.push({ date: l.date, texte: `Modifié : ${nomSeance(l)} (${details.join(" ; ")})` });
    }
    for (const l of avant.filter((x) => !restants.has(x.id))) changements.push({ date: l.date, texte: `Annulé ou retiré : ${quand(l)} · ${nomSeance(l)}` });
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
const envoyerClasse = async (groupe, mois, { idUser = null, origine }) => {
    const [lignes, precedent] = await Promise.all([lignesDuMois(groupe, mois), EnvoiEdt.findOne({ where: { id_groupe: groupe.id_groupe, mois } })]);
    const etudiants = await etudiantsDe(groupe.id_groupe);
    if (!precedent && (!lignes.length || !etudiants.length)) return "vide";
    const nomMois = libelleMois(mois);
    const lien = lienEdt(groupe.id_groupe, mois);
    const adresse = `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}${lien}`;

    if (!precedent) {
        await prevenir(etudiants, {
            titre: `Emploi du temps de ${nomMois}`,
            message: `${groupe.nom_groupe} : ${lignes.length} séance(s). Consultez-le ou imprimez-le en PDF depuis l'application.`,
            texteEmail: `Bonjour,\n\nL'emploi du temps de ${nomMois} (${groupe.nom_groupe}) est publié : ${lignes.length} séance(s).\nIl se consulte et s'imprime en PDF ici : ${adresse}\n\nIl se met à jour tout seul ; vous serez prévenu de chaque changement.\n\nHESTIM Planner`,
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
        texteEmail: `Bonjour,\n\nL'emploi du temps de ${nomMois} (${groupe.nom_groupe}) a changé${origine === "auto" ? " depuis le dernier envoi" : ""} :\n\n${liste.map((c) => `• ${c}`).join("\n")}${suite}\n\nEmploi du temps à jour (imprimable en PDF) : ${adresse}\n\nHESTIM Planner`,
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
        bilan[await envoyerClasse(groupe, mois, { idUser: user.id_user, origine: "publication" })] += 1;
        bilan.classes += 1;
    }
    return { mois, filiere: { id: filiere.id_filiere, code: filiere.code_filiere }, ...bilan };
};

/** Où en sont les envois d'une filière pour un mois (affiché sur la page de l'EDT du mois). */
export const etatEnvois = async (user, { mois, id_filiere: idFiliere } = {}) => {
    if (!MOIS.test(String(mois ?? ""))) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    if (user.role === "etudiant") throw new ErreurMetier("Accès interdit", 403);
    const groupes = await Groupe.findAll({ where: { id_filiere: Number(idFiliere) || 0 }, attributes: ["id_groupe"] });
    const envois = groupes.length ? await EnvoiEdt.findAll({ where: { mois, id_groupe: groupes.map((g) => g.id_groupe) }, attributes: ["id_groupe", "envoye_le", "nb_destinataires"] }) : [];
    return {
        publie: envois.length > 0,
        dernier_envoi: envois.reduce((d, e) => (!d || e.envoye_le > d ? e.envoye_le : d), null),
        destinataires: envois.reduce((t, e) => t + e.nb_destinataires, 0),
    };
};

/**
 * Renvoi automatique (chaque soir) : les mois déjà publiés, du mois en cours aux suivants, qui
 * ont changé depuis le dernier envoi. Les mois passés ne sont plus suivis.
 */
export const renvoyerChangements = async (maintenant = new Date()) => {
    const envois = await EnvoiEdt.findAll({ where: { mois: { [Op.gte]: moisCourant(maintenant) } }, include: [{ model: Groupe, as: "groupe" }] });
    const bilan = bilanVide();
    for (const envoi of envois.filter((e) => e.groupe)) {
        bilan[await envoyerClasse(envoi.groupe, envoi.mois, { origine: "auto" })] += 1;
        bilan.classes += 1;
    }
    return bilan;
};

// ── Planificateur (lancé par server.js, jamais pendant les tests) ─────────

/** Chaque jour à EDT_ENVOI_HEURE (18 h par défaut, heure de l'école) : renvoi des mois modifiés. */
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
        try {
            const bilan = await renvoyerChangements(maintenant);
            if (bilan.modifie) console.log(`--> EDT du mois : ${bilan.modifie} classe(s) prévenue(s) d'un changement`);
        } catch (error) {
            console.error("--> Renvoi des EDT :", error.message);
        }
    };
    const minuterie = setInterval(verifier, 10 * 60 * 1000);
    minuterie.unref();
    return minuterie;
};
