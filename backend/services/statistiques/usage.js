import { Op } from "sequelize";
import { AppelSeance, AuthSession, DevoirRendu, JournalSecurite, QuizPartie, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { champCsv } from "../planning/suivi.js";

/**
 * Compteurs d'usage mensuels (lot R-12), tirés des tables existantes, sans traceur. Ils servent au
 * relevé de la facturation par utilisateur (remarques-par-profil.md, § 5) : est facturé tout compte
 * actif dans le mois, quel que soit son rôle.
 *
 * Compte actif (décision du chef de projet, 11 octobre 2026) : au moins une connexion dans le mois.
 * Une connexion se lit dans les sessions (AuthSessions : une ligne à chaque connexion et à chaque
 * renouvellement, `last_used_at` au dernier usage), car un étudiant qui reste connecté dans
 * l'application ne se reconnecte pas ; le journal de sécurité (connexions réussies, gardées 365
 * jours) complète. Bornes du mois en UTC, l'heure de l'école depuis le 20 septembre 2026.
 */

export const DEFINITION_ACTIF = "Compte qui s'est connecté au moins une fois dans le mois (site ou application).";
const ROLES = ["etudiant", "enseignant", "admin"];

/** Rend { debut, fin } du mois « AAAA-MM » (fin exclue) ; lève une erreur 400 sinon. */
const bornesDuMois = (mois) => {
    const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(mois ?? ""));
    if (!m) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    const [annee, numero] = [Number(m[1]), Number(m[2])];
    return { debut: new Date(Date.UTC(annee, numero - 1, 1)), fin: new Date(Date.UTC(annee, numero, 1)) };
};

/** Rend les identifiants des comptes actifs sur [debut, fin). */
const comptesActifs = async ({ debut, fin }) => {
    const dansLeMois = { [Op.gte]: debut, [Op.lt]: fin };
    const [sessions, connexions] = await Promise.all([
        AuthSession.findAll({ where: { [Op.or]: [{ createdAt: dansLeMois }, { last_used_at: dansLeMois }] }, attributes: ["id_user"], group: ["id_user"], raw: true }),
        JournalSecurite.findAll({ where: { evenement: "connexion_reussie", createdAt: dansLeMois, id_user: { [Op.ne]: null } }, attributes: ["id_user"], group: ["id_user"], raw: true }),
    ]);
    return [...new Set([...sessions, ...connexions].map((l) => l.id_user))];
};

/**
 * Compteurs d'un mois : { mois, definition_actif, comptes_actifs: { total, etudiant, enseignant, admin },
 * appels_valides, quiz: { parties, joueurs }, devoirs_rendus }.
 */
export const usageDuMois = async ({ mois }) => {
    const bornes = bornesDuMois(mois);
    const dansLeMois = { [Op.gte]: bornes.debut, [Op.lt]: bornes.fin };
    const ids = await comptesActifs(bornes);
    const [roles, appels, parties, joueurs, rendus] = await Promise.all([
        ids.length ? Users.findAll({ where: { id_user: ids }, attributes: ["role"], raw: true }) : [],
        AppelSeance.count({ where: { ferme_le: dansLeMois } }),
        QuizPartie.count({ where: { terminee_le: dansLeMois } }),
        QuizPartie.sum("nb_joueurs", { where: { terminee_le: dansLeMois } }),
        DevoirRendu.count({ where: { rendu_le: dansLeMois } }),
    ]);
    const parRole = Object.fromEntries(ROLES.map((r) => [r, roles.filter((u) => u.role === r).length]));
    return {
        mois,
        definition_actif: DEFINITION_ACTIF,
        comptes_actifs: { total: roles.length, ...parRole },
        appels_valides: appels,
        quiz: { parties, joueurs: joueurs ?? 0 },
        devoirs_rendus: rendus,
    };
};

/** Export CSV (séparateur « ; ») des compteurs d'un mois, une ligne par indicateur. */
export const usageCsv = async ({ mois }) => {
    const u = await usageDuMois({ mois });
    const lignes = [
        ["mois", "indicateur", "valeur"],
        [mois, "comptes actifs", u.comptes_actifs.total],
        ...ROLES.map((r) => [mois, `comptes actifs : ${r}`, u.comptes_actifs[r]]),
        [mois, "appels validés", u.appels_valides],
        [mois, "parties de quiz", u.quiz.parties],
        [mois, "joueurs des parties de quiz", u.quiz.joueurs],
        [mois, "devoirs rendus", u.devoirs_rendus],
        [mois, "définition d'un compte actif", u.definition_actif],
    ];
    // BOM : Excel ouvre le fichier en UTF-8 (accents)
    return `${String.fromCharCode(0xfeff)}${lignes.map((l) => l.map(champCsv).join(";")).join("\r\n")}\r\n`;
};
