import { Op } from "sequelize";
import { Desactivation, Users } from "../../models/index.js";
import sequelize from "../../config/db.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { notifierAdministrateurs } from "../../utils/notificationHelper.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { journaliser } from "../journalSecurite.js";
import { appliquerEffets } from "./desactivation.js";
import { seancesFutures, verifierCible } from "./regles.js";
import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Désactivations programmées (lot ME-17), passées chaque heure par une tâche périodique :
 *  1. préavis : un courriel 5 jours avant la date d'effet (décision du 24 octobre, Q-14), si
 *     l'administration ne l'a pas décoché ; envoyé une seule fois ;
 *  2. échéance : le compte est désactivé le jour venu, sauf si l'enseignant a, entre-temps,
 *     des séances à venir : la désactivation attend, et l'administration est prévenue une fois
 *     par jour, jusqu'à ce que ces séances soient traitées.
 */

export const JOURS_PREAVIS = 5;

/** Date du jour (fuseau de l'établissement) décalée de `n` jours, au format AAAA-MM-JJ. */
const dansJours = (jour, n) => new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

const texteDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Envoie les préavis dus ; rend le nombre de courriels envoyés. */
export const envoyerPreavis = async (jour = aujourdhui()) => {
    const concernes = await Users.findAll({
        where: { actif: true, desactivation_preavis: true, preavis_envoye_le: null, desactivation_prevue_le: { [Op.between]: [jour, dansJours(jour, JOURS_PREAVIS)] } },
    });
    let envoyes = 0;
    for (const user of concernes) {
        try {
            await sendEmail({
                to: user.email,
                subject: "Votre accès à Planner prendra fin bientôt",
                text:
                    `Bonjour ${user.prenom},\n\nVotre accès à Planner prendra fin le ${texteDate(user.desactivation_prevue_le)}.\n` +
                    "Pensez à enregistrer ce dont vous avez besoin avant cette date. Pour toute question, écrivez à la scolarité.\n",
            });
            await user.update({ preavis_envoye_le: new Date() });
            envoyes += 1;
        } catch (erreur) {
            // Un courriel en échec sera retenté au prochain passage : la date d'envoi reste vide
            console.error("Préavis de désactivation :", erreur.message);
        }
    }
    return envoyes;
};

/** Signale une désactivation qui attend (séances à traiter, dernier administrateur), une fois par jour au plus. */
const signalerAttente = async (user, raison, details, jour) => {
    const deja = await Desactivation.count({ where: { id_user: user.id_user, action: "report", effet_le: jour } });
    if (deja) return;
    await Desactivation.create({ id_user: user.id_user, action: "report", motif: user.desactivation_motif, effet_le: jour, details });
    await notifierAdministrateurs({
        titre: "Désactivation en attente",
        message: `La désactivation de ${user.prenom} ${user.nom} attend : ${raison}.`,
        type_notification: "warning",
        lien: details.seances ? "/gestion/imprevus" : "/gestion/utilisateurs",
    }).catch(() => {});
};

/** Ce qui empêche, le jour venu, d'appliquer la désactivation ; null si rien. */
const empechement = async (user, jour) => {
    try {
        // Les règles ont pu changer depuis la programmation : dernier administrateur actif restant
        await verifierCible(null, user);
    } catch (erreur) {
        if (erreur instanceof ErreurMetier) return { raison: erreur.message.toLowerCase(), details: { code: erreur.code } };
        throw erreur;
    }
    const futures = user.role === "enseignant" ? await seancesFutures(user.id_user, jour) : [];
    if (futures.length) return { raison: `${futures.length} séance(s) à venir à confier à un remplaçant ou à annuler`, details: { seances: futures.length } };
    return null;
};

/** Applique les désactivations arrivées à échéance ; rend le nombre de comptes désactivés. */
export const appliquerProgrammees = async (jour = aujourdhui()) => {
    const echues = await Users.findAll({ where: { actif: true, desactivation_prevue_le: { [Op.lte]: jour } } });
    let desactives = 0;
    for (const user of echues) {
        const obstacle = await empechement(user, jour);
        if (obstacle) {
            await signalerAttente(user, obstacle.raison, obstacle.details, jour);
            continue;
        }
        const motif = user.desactivation_motif;
        await sequelize.transaction(async (transaction) => {
            await appliquerEffets(user, transaction);
            await Desactivation.create({ id_user: user.id_user, action: "desactivation", motif, effet_le: jour, details: { programmee: true } }, { transaction });
        });
        await journaliser(null, { evenement: "compte_desactive", user, details: { motif, programmee: true } });
        desactives += 1;
    }
    return desactives;
};

/** Passage complet de la tâche : préavis puis échéances. */
export const passerDesactivations = async () => ({ preavis: await envoyerPreavis(), desactives: await appliquerProgrammees() });
