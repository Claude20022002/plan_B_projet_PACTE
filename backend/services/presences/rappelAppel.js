import { Affectation, AppelSeance, Cours, Creneau, Enseignement, EnseignementEnseignant, Groupe, Notification } from "../../models/index.js";
import { minutes } from "../planning/affectationRules.js";
import { horairesSurPlage } from "../planning/ramadan.js";

/**
 * Rappel de l'appel : quelques minutes avant la fin d'une séance (5 par défaut), l'enseignant qui
 * n'a pas fait l'appel, ou qui ne l'a pas terminé, reçoit une notification (et un push) qui ouvre
 * l'écran de l'appel. Un seul rappel par séance et par enseignant. RAPPEL_APPEL_MINUTES=0 le coupe.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const STATUTS_A_RAPPELER = ["planifie", "confirme", "reporte"];
const TITRE_A_FAIRE = "Rappel : faites l'appel";
const TITRE_A_TERMINER = "Rappel : terminez l'appel";

export const delaiRappelAppel = () => {
    const n = Number(process.env.RAPPEL_APPEL_MINUTES ?? 5);
    return Number.isInteger(n) && n >= 0 && n <= 60 ? n : 5;
};

export const lienAppel = (idAffectation) => `/appel/${idAffectation}`;

const heureLocale = (maintenant) => maintenant.toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });
const jourLocal = (maintenant) => maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });

/** Enseignant de la séance et co-enseignants (ceux qui peuvent faire l'appel). */
const enseignantsDe = (seance) => [
    ...new Set(
        [seance.id_user_enseignant, ...(seance.enseignement?.services ?? []).filter((s) => s.role === "co_enseignant" && s.statut_service !== "refuse").map((s) => s.id_user)].filter(Boolean)
    ),
];

/**
 * Envoie les rappels dus à cet instant.
 * @returns {Promise<number>} nombre de rappels envoyés
 */
export const rappelerAppels = async (maintenant = new Date(), delai = delaiRappelAppel()) => {
    if (!delai) return 0;
    const jour = jourLocal(maintenant);
    const heure = heureLocale(maintenant);
    const seances = await Affectation.findAll({
        where: { date_seance: jour, statut: STATUTS_A_RAPPELER },
        attributes: ["id_affectation", "id_user_enseignant", "date_seance"],
        include: [
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours", attributes: ["nom_cours"] },
            { model: Groupe, as: "groupe", attributes: ["nom_groupe"] },
            {
                model: Enseignement,
                as: "enseignement",
                attributes: ["id_enseignement"],
                include: [{ model: EnseignementEnseignant, as: "services", attributes: ["id_user", "role", "statut_service"], required: false }],
            },
        ],
    });
    if (!seances.length) return 0;

    // Séances commencées qui finissent dans le délai, aux horaires du jour (Ramadan compris)
    const horaires = await horairesSurPlage(jour, jour);
    const proches = seances
        .map((seance) => {
            const creneau = horaires(seance.creneau, jour);
            return { seance, debut: String(creneau?.heure_debut ?? "").slice(0, 5), fin: String(creneau?.heure_fin ?? "").slice(0, 5) };
        })
        .filter(({ debut, fin }) => {
            if (!debut || !fin || minutes(debut) > minutes(heure)) return false;
            const reste = minutes(fin) - minutes(heure);
            return reste >= 0 && reste <= delai;
        });
    if (!proches.length) return 0;

    const ids = proches.map((p) => p.seance.id_affectation);
    const [appels, dejaRappeles] = await Promise.all([
        AppelSeance.findAll({ where: { id_affectation: ids }, attributes: ["id_affectation", "ferme_le"] }),
        Notification.findAll({ where: { lien: ids.map(lienAppel), titre: [TITRE_A_FAIRE, TITRE_A_TERMINER] }, attributes: ["id_user", "lien"], raw: true }),
    ]);
    const appelDe = new Map(appels.map((a) => [a.id_affectation, a]));
    const rappeles = new Set(dejaRappeles.map((n) => `${n.id_user}|${n.lien}`));

    const rappels = [];
    for (const { seance, fin } of proches) {
        const appel = appelDe.get(seance.id_affectation);
        if (appel?.ferme_le) continue;
        const lien = lienAppel(seance.id_affectation);
        const classe = [seance.cours?.nom_cours, seance.groupe?.nom_groupe].filter(Boolean).join(" · ") || "Séance";
        for (const idUser of enseignantsDe(seance)) {
            if (rappeles.has(`${idUser}|${lien}`)) continue;
            rappels.push({
                id_user: idUser,
                titre: appel ? TITRE_A_TERMINER : TITRE_A_FAIRE,
                message: appel
                    ? `${classe} se termine à ${fin} : l'appel est encore ouvert. Terminez-le pour enregistrer les présences.`
                    : `${classe} se termine à ${fin} et l'appel n'a pas été fait.`,
                type_notification: "warning",
                lue: false,
                lien,
            });
        }
    }
    if (rappels.length) await Notification.bulkCreate(rappels, { individualHooks: true });
    return rappels.length;
};

// ── Planificateur (lancé par server.js, jamais pendant les tests) ─────────

/** Chaque minute : rappels des séances qui se terminent. */
export const demarrerRappelsAppel = () => {
    if (!delaiRappelAppel()) return null;
    let enCours = false;
    const verifier = async () => {
        if (enCours) return;
        enCours = true;
        try {
            const n = await rappelerAppels();
            if (n) console.log(`--> Appel : ${n} rappel(s) envoyé(s)`);
        } catch (error) {
            console.error("--> Rappels de l'appel :", error.message);
        } finally {
            enCours = false;
        }
    };
    const minuterie = setInterval(verifier, 60 * 1000);
    minuterie.unref();
    return minuterie;
};
