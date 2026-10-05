import crypto from "crypto";
import { Op } from "sequelize";
import { Affectation, Appartenir, Creneau, Cours, QuizPartie, Users } from "../../models/index.js";
import { groupesANotifier } from "../planning/seances.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Parties ClassQuiz (phase Q). Le fork de ClassQuiz signale chaque partie lancée par un
 * enseignant (POST signé HMAC) ; Planner la rattache à la séance que l'enseignant donne à ce
 * moment-là, prévient les étudiants de ses groupes (notification + push) et la leur propose
 * dans l'application, avec le code déjà rempli.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const TOLERANCE_SIGNATURE_S = 300;
// Une partie se rejoint dans les premières minutes ; au-delà, elle n'est plus proposée
const DUREE_PROPOSEE_MIN = 120;
// Lancer le quiz un peu avant le début de la séance compte encore pour elle
const AVANCE_SEANCE_MIN = 15;

const ROLES_ENSEIGNANT = ["enseignant", "admin"];

export const urlQuiz = () => process.env.QUIZ_URL?.replace(/\/$/, "") || null;

const secret = () => {
    const valeur = process.env.QUIZ_WEBHOOK_SECRET || "";
    return valeur.length >= 32 ? valeur : null;
};

export const webhookActif = () => secret() !== null;

/**
 * Vérifie la signature du fork : HMAC-SHA256 de « <horodatage>.<corps brut> », en hexadécimal,
 * horodatage à 5 minutes près (rejeu). Comparaison en temps constant.
 */
export const signatureValide = (corpsBrut, horodatage, signature) => {
    const cle = secret();
    if (!cle || typeof horodatage !== "string" || typeof signature !== "string") return false;
    const ts = Number(horodatage);
    if (!Number.isInteger(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SIGNATURE_S) return false;
    const attendue = crypto.createHmac("sha256", cle).update(`${horodatage}.`).update(corpsBrut).digest("hex");
    const a = Buffer.from(attendue);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const maintenantLocal = () => {
    const now = new Date();
    return {
        date: now.toLocaleDateString("en-CA", { timeZone: FUSEAU }),
        minutes: (() => {
            const [h, m] = now.toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" }).split(":");
            return Number(h) * 60 + Number(m);
        })(),
    };
};
const enMinutes = (heure) => {
    const [h, m] = String(heure).split(":");
    return Number(h) * 60 + Number(m);
};

/** Séance que l'enseignant donne maintenant (ou commence dans moins de 15 minutes). */
export const seanceEnCours = async (idEnseignant) => {
    const { date, minutes } = maintenantLocal();
    const seances = await Affectation.findAll({
        where: { id_user_enseignant: idEnseignant, date_seance: date, statut: { [Op.in]: ["planifie", "confirme", "realise"] } },
        include: [{ model: Creneau, as: "creneau" }, { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }],
    });
    return seances.find((s) => s.creneau
        && enMinutes(s.creneau.heure_debut) - AVANCE_SEANCE_MIN <= minutes
        && minutes <= enMinutes(s.creneau.heure_fin)) ?? null;
};

/**
 * Enregistre une partie signalée par le fork. Idempotent sur game_id (le fork peut réessayer).
 * Retourne { partie, notifies } ; null si l'expéditeur n'est pas un enseignant de Planner.
 */
export const enregistrerPartie = async (evenement) => {
    const email = String(evenement.user_email ?? "").toLowerCase();
    const enseignant = email ? await Users.findOne({ where: { email } }) : null;
    if (!enseignant || !enseignant.actif || !ROLES_ENSEIGNANT.includes(enseignant.role)) return null;

    const existante = await QuizPartie.findOne({ where: { game_id: String(evenement.game_id) } });
    if (existante) return { partie: existante, notifies: 0 };

    const seance = await seanceEnCours(enseignant.id_user);
    const partie = await QuizPartie.create({
        game_id: String(evenement.game_id),
        pin: String(evenement.game_pin),
        titre: String(evenement.quiz_title ?? "Quiz").slice(0, 255),
        mode: evenement.game_mode ? String(evenement.game_mode).slice(0, 30) : null,
        id_user_enseignant: enseignant.id_user,
        id_affectation: seance?.id_affectation ?? null,
        demarree_le: new Date(),
    });

    let notifies = 0;
    if (seance) {
        const groupes = await groupesANotifier([seance.id_groupe]);
        const etudiants = [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"] }))
            .map((a) => a.id_user_etudiant))];
        if (etudiants.length) {
            // Le push suit automatiquement chaque notification (services/push.js)
            await creerNotificationsMultiples({
                id_users: etudiants,
                titre: "Quiz en cours",
                message: `${partie.titre} — ${seance.cours?.nom_cours ?? "votre séance"}. Rejoignez la partie depuis l'application.`,
                type_notification: "info",
                lien: "/jeux",
            });
            notifies = etudiants.length;
        }
    }
    return { partie, notifies };
};

const enVue = (partie, user) => {
    const base = urlQuiz();
    const nom = user.role === "etudiant" ? `${user.prenom ?? ""} ${(user.nom ?? "").slice(0, 1)}.`.trim() : null;
    const params = new URLSearchParams({ pin: partie.pin, ...(nom ? { name: nom } : {}) });
    return {
        id: partie.id_quiz_partie,
        titre: partie.titre,
        pin: partie.pin,
        mode: partie.mode,
        demarree_le: partie.demarree_le,
        module: partie.affectation?.cours ? { code: partie.affectation.cours.code_cours, nom: partie.affectation.cours.nom_cours } : null,
        url: base ? `${base}/play?${params}` : null,
    };
};

/**
 * Parties encore proposées : pour un étudiant, celles des séances de ses groupes (et de leurs
 * groupes parents) ; pour un enseignant, les siennes.
 */
export const partiesEnCours = async (user) => {
    const depuis = new Date(Date.now() - DUREE_PROPOSEE_MIN * 60 * 1000);
    const include = [{ model: Affectation, as: "affectation", required: false, include: [{ model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] }] }];

    if (ROLES_ENSEIGNANT.includes(user.role)) {
        const parties = await QuizPartie.findAll({ where: { id_user_enseignant: user.id_user, demarree_le: { [Op.gte]: depuis } }, include, order: [["demarree_le", "DESC"]] });
        return parties.map((p) => enVue(p, user));
    }

    const parties = await QuizPartie.findAll({
        where: { demarree_le: { [Op.gte]: depuis }, id_affectation: { [Op.ne]: null } },
        include,
        order: [["demarree_le", "DESC"]],
    });
    if (!parties.length) return [];
    const mesGroupes = new Set((await Appartenir.findAll({ where: { id_user_etudiant: user.id_user }, attributes: ["id_groupe"] })).map((a) => a.id_groupe));
    const visibles = [];
    for (const partie of parties) {
        // La séance vise un groupe ; ses sous-groupes (où l'étudiant est inscrit) en font partie
        const groupes = await groupesANotifier([partie.affectation.id_groupe]);
        if (groupes.some((g) => mesGroupes.has(g))) visibles.push(enVue(partie, user));
    }
    return visibles;
};
