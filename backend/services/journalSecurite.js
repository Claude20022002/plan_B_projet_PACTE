import { Op } from "sequelize";
import { JournalSecurite, Users } from "../models/index.js";

/**
 * Journal de sécurité (OWASP A09, ASVS V7) : qui, quoi, d'où, quand. Jamais de mot de passe, de
 * code ni de jeton dans les détails. Une écriture qui échoue est signalée dans les logs mais ne
 * bloque jamais l'action journalisée.
 */
export const EVENEMENTS = [
    "connexion_reussie",
    "connexion_echec",
    "connexion_compte_desactive",
    "mfa_echec",
    "mfa_bloque",
    "mfa_code_secours_utilise",
    "mfa_activee",
    "mfa_desactivee",
    "mfa_codes_regeneres",
    "mfa_reinitialisee",
    "mot_de_passe_change",
    "mot_de_passe_reinitialise",
    "mot_de_passe_reinitialise_admin",
    "refresh_reutilise",
    "deconnexion_partout",
    "session_revoquee",
    "compte_cree",
    "compte_modifie",
    "compte_supprime",
    "comptes_importes",
    "appareil_delie",
    "quiz_ia_genere",
];

const borne = (texte, max) => (texte == null ? null : String(texte).slice(0, max));

/** Origine d'une requête, à passer aux services qui journalisent sans voir la requête. */
export const contexteDe = (req) => ({ ip: req?.ip ?? null, user_agent: req?.get?.("user-agent") ?? null });

/**
 * @param {{ ip?: string, user_agent?: string }|null} contexte origine (contexteDe(req))
 * @param {{ evenement: string, user?: object, id_user?: number, email?: string, acteur?: object, details?: object }} donnees
 */
export const journaliser = async (contexte, { evenement, user = null, id_user = null, email = null, acteur = null, details = null }, { transaction } = {}) => {
    try {
        if (!EVENEMENTS.includes(evenement)) throw new Error(`Événement inconnu : ${evenement}`);
        await JournalSecurite.create(
            {
                evenement,
                id_user: user?.id_user ?? id_user,
                email: borne(user?.email ?? email, 255),
                // L'acteur n'est noté que s'il agit sur le compte d'un autre
                id_acteur: acteur && acteur.id_user !== (user?.id_user ?? id_user) ? acteur.id_user : null,
                ip: borne(contexte?.ip, 45),
                user_agent: borne(contexte?.user_agent, 255),
                details,
            },
            { transaction }
        );
    } catch (erreur) {
        console.error("Journal de sécurité :", erreur.message);
    }
};

/** Nombre d'événements d'un compte depuis une date (ex. codes faux récents). */
export const compterRecents = (idUser, evenement, depuis, { transaction } = {}) =>
    JournalSecurite.count({ where: { id_user: idUser, evenement, createdAt: { [Op.gte]: depuis } }, transaction });

/**
 * Conservation : JOURNAL_SECURITE_JOURS jours (365 par défaut, durée habituelle pour un journal
 * de sécurité ; 30 au minimum, la limite de la double authentification lit les échecs récents).
 * Suppression par lots : la table n'est jamais verrouillée longtemps. Renvoie le nombre supprimé.
 */
export const purgerJournal = async (maintenant = new Date()) => {
    const jours = Math.max(30, Number(process.env.JOURNAL_SECURITE_JOURS) || 365);
    const limite = new Date(maintenant.getTime() - jours * 24 * 3600 * 1000);
    const LOT = 5000;
    let total = 0;
    for (;;) {
        const supprimes = await JournalSecurite.destroy({ where: { createdAt: { [Op.lt]: limite } }, limit: LOT });
        total += supprimes;
        if (supprimes < LOT) return total;
    }
};

const PAR_PAGE_MAX = 100;

/** Consultation (administration) : filtres facultatifs, les plus récents d'abord, par pages. */
export const lireJournal = async ({ id_user, evenement, du, au, page = 1, par_page = 50 } = {}) => {
    const where = {};
    if (id_user) where.id_user = Number(id_user) || 0;
    if (evenement) where.evenement = String(evenement);
    const date = (valeur) => (/^\d{4}-\d{2}-\d{2}$/.test(String(valeur ?? "")) ? valeur : null);
    if (date(du) || date(au)) {
        where.createdAt = { ...(date(du) ? { [Op.gte]: new Date(`${du}T00:00:00Z`) } : {}), ...(date(au) ? { [Op.lte]: new Date(`${au}T23:59:59.999Z`) } : {}) };
    }
    const limite = Math.min(PAR_PAGE_MAX, Math.max(1, Number(par_page) || 50));
    const numero = Math.max(1, Number(page) || 1);
    const { count, rows } = await JournalSecurite.findAndCountAll({
        where,
        order: [["createdAt", "DESC"], ["id_evenement", "DESC"]],
        limit: limite,
        offset: (numero - 1) * limite,
        raw: true,
    });
    // Nom de l'administrateur qui a agi (une lecture pour la page ; compte supprimé : null)
    const idsActeurs = [...new Set(rows.map((r) => r.id_acteur).filter(Boolean))];
    const acteurs = idsActeurs.length ? await Users.findAll({ where: { id_user: idsActeurs }, attributes: ["id_user", "nom", "prenom", "email"], raw: true }) : [];
    const parId = new Map(acteurs.map((a) => [a.id_user, a]));
    return { total: count, page: numero, par_page: limite, evenements: rows.map((r) => ({ ...r, acteur: parId.get(r.id_acteur) ?? null })) };
};
