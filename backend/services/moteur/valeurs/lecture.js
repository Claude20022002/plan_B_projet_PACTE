import { Campus, Cours, Enseignant, Groupe, Salle, ValeurParametre, VersionParametres } from "../../../models/index.js";
import { chargerDependances, chargerParametres, chargerProfils } from "../catalogue/charger.js";
import { resoudreTout } from "./resolution.js";

/**
 * Lecture des valeurs du moteur (lot MP-1) : les lignes des versions appliquées, les valeurs
 * comptées, et le calcul de resolution.js. Rien n'écrit ici. Le catalogue, lui, est une donnée
 * figée à la livraison : il ne se relit pas à chaque requête.
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";

/** La date du jour à l'école, pas celle du fuseau du serveur (AAAA-MM-JJ). */
export const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: FUSEAU });

let catalogue;
/** Paramètres, profils et dépendances du catalogue, chargés une seule fois. */
export const leCatalogue = () => {
    catalogue ??= { parametres: chargerParametres(), profils: chargerProfils(), dependances: chargerDependances() };
    return catalogue;
};

// Les identifiants d'une cible se comparent en chaîne, comme id_portee : 7 et "7" désignent le même enseignant
const normaliserCible = (cible) => Object.fromEntries(Object.entries(cible).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)]));

const versLigne = (v) => ({
    cle: v.cle,
    portee: v.portee,
    id_portee: v.id_portee === "" ? null : v.id_portee,
    valeur: v.valeur,
    force: v.force ?? undefined,
    poids: v.poids ?? undefined,
    retiree: v.retiree,
    statut: v.version.statut,
    date_effet: v.version.date_effet,
    id_version: v.id_version,
});

/** Toutes les lignes des versions appliquées, quelle que soit leur date : resolution.js choisit. */
export const lireLignes = async ({ transaction } = {}) => {
    const lignes = await ValeurParametre.findAll({
        include: [{ model: VersionParametres, as: "version", where: { statut: "appliquee" }, attributes: ["statut", "date_effet"] }],
        transaction,
    });
    return lignes.map(versLigne);
};

/** Valeurs qui se comptent et ne se saisissent jamais (ETA.TAILLE) : elles commandent certaines règles. */
export const lireFaits = async ({ transaction } = {}) => {
    const [campus, salles, classes, enseignants, matieres] = await Promise.all([
        Campus.count({ where: { actif: true }, transaction }),
        Salle.count({ transaction }),
        Groupe.count({ transaction }),
        Enseignant.count({ transaction }),
        Cours.count({ transaction }),
    ]);
    return {
        "ETA.TAILLE.CAMPUS": campus,
        "ETA.TAILLE.SALLES": salles,
        "ETA.TAILLE.CLASSES": classes,
        "ETA.TAILLE.ENSEIGNANTS": enseignants,
        "ETA.TAILLE.MATIERES": matieres,
    };
};

/**
 * Valeurs en vigueur pour une cible, à une date (aujourd'hui par défaut).
 * @param {object} [o] date (AAAA-MM-JJ), cible ({ niveau, filiere, enseignant... })
 */
export const valeursEnVigueur = async ({ date = aujourdhui(), cible = {}, transaction } = {}) => {
    const [lignes, faits] = await Promise.all([lireLignes({ transaction }), lireFaits({ transaction })]);
    return { date, ...resoudreTout({ ...leCatalogue(), lignes, date, cible: normaliserCible(cible), faits }) };
};
