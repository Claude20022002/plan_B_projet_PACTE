import { ValeurParametre, VersionParametres } from "../../../models/index.js";
import { ErreurMetier } from "../../planning/enseignements.js";
import { controlerEcriture } from "./ecriture.js";
import { aujourdhui, leCatalogue, lireLignes, valeursEnVigueur } from "./lecture.js";

/**
 * Versions des réglages du moteur (lot MP-1, D-07) : un brouillon se prépare, puis s'applique en une
 * fois ; ensuite il ne change plus (I-D5), et l'annuler crée une version inverse. Le chemin passe par
 * le modèle plutôt que par config/db.js : la connexion ne s'importe pas hors de models/ (R-2).
 * L'aperçu de ce qui bouge reste au lot ME-2b.
 */

/** Réglages refusés : la route rend la liste, chacun avec son code et sa phrase. */
export class ErreurReglages extends ErreurMetier {
    constructor(violations) {
        super("Ces réglages sont refusés", 400, "REGLAGES_REFUSES");
        this.violations = violations;
    }
}

const ETABLISSEMENT = "etablissement";
const transaction = (travail) => VersionParametres.sequelize.transaction(travail);

const normaliser = (l) => ({
    cle: l.cle,
    portee: l.portee ?? ETABLISSEMENT,
    id_portee: l.id_portee === undefined || l.id_portee === null ? "" : String(l.id_portee),
    valeur: l.valeur,
    force: l.force,
    poids: l.poids,
    retiree: Boolean(l.retiree),
});

const cleDeCible = (l) => `${l.portee}|${l.id_portee}`;
const cibleDe = (l) => (l.portee === ETABLISSEMENT ? {} : { [l.portee]: l.id_portee });

/**
 * Contrôle toutes les lignes d'une version. Les bornes s'essaient avec les autres lignes de la même
 * cible déjà posées : changer ensemble un minimum et un maximum ne doit pas être refusé à tort.
 */
const controler = async (lignes, auteur, date, options) => {
    const { parametres, dependances } = leCatalogue();
    const parId = new Map(parametres.map((p) => [p.id, p]));
    const violations = [];
    const signaler = (l, code, message) => violations.push({ cle: l.cle, portee: l.portee, id_portee: l.id_portee, code, message });

    const vues = new Set();
    const valeursDe = new Map();
    for (const l of lignes) {
        const p = parId.get(l.cle);
        if (!p) {
            signaler(l, "parametre_inconnu", `Aucun paramètre « ${l.cle} ».`);
            continue;
        }
        const cle = `${l.cle}|${cleDeCible(l)}`;
        if (vues.has(cle)) signaler(l, "doublon", "Ce réglage figure deux fois dans la version.");
        vues.add(cle);
        if ((l.portee === ETABLISSEMENT) !== (l.id_portee === "")) signaler(l, "cible_invalide", "Un réglage d'établissement n'a pas d'identifiant, les autres en ont un.");
        if (!l.retiree && l.valeur === undefined && l.force === undefined && l.poids === undefined) signaler(l, "ligne_vide", "Ce réglage ne change rien.");

        const cibleCle = cleDeCible(l);
        if (!valeursDe.has(cibleCle)) {
            const { valeurs } = await valeursEnVigueur({ date, cible: cibleDe(l), ...options });
            for (const autre of lignes.filter((x) => cleDeCible(x) === cibleCle && x.valeur !== undefined && !x.retiree)) valeurs.set(autre.cle, autre.valeur);
            valeursDe.set(cibleCle, valeurs);
        }
        const refus = controlerEcriture({ parametre: p, portee: l.portee, valeur: l.retiree ? undefined : l.valeur, force: l.force, poids: l.poids, auteur, valeurs: valeursDe.get(cibleCle), dependances });
        for (const r of refus) signaler(l, r.code, r.message);
    }
    return violations;
};

const exigerDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) throw new ErreurMetier("La date d'effet s'écrit AAAA-MM-JJ", 400, "DATE_EFFET_INVALIDE");
    if (date < aujourdhui()) throw new ErreurMetier("La date d'effet est passée : un réglage ne change pas le passé", 400, "DATE_EFFET_PASSEE");
};

/** Crée un brouillon : il n'a aucun effet tant qu'il n'est pas appliqué. */
export const creerVersion = async ({ libelle, date_effet = aujourdhui(), lignes, id_auteur, auteur }) => {
    exigerDate(date_effet);
    if (!Array.isArray(lignes) || !lignes.length) throw new ErreurMetier("Une version contient au moins un réglage", 400, "VERSION_VIDE");
    const normalisees = lignes.map(normaliser);
    const violations = await controler(normalisees, auteur, date_effet);
    if (violations.length) throw new ErreurReglages(violations);
    return transaction(async (t) => {
        const version = await VersionParametres.create({ libelle, date_effet, statut: "brouillon", id_auteur }, { transaction: t });
        await ValeurParametre.bulkCreate(normalisees.map((l) => ({ ...l, id_version: version.id_version })), { transaction: t });
        return version;
    });
};

const verrouiller = async (id, t) => {
    const version = await VersionParametres.findByPk(id, { include: [{ model: ValeurParametre, as: "valeurs" }], transaction: t, lock: t.LOCK.UPDATE });
    if (!version) throw new ErreurMetier("Version introuvable", 404);
    return version;
};

/** Applique un brouillon, d'un seul coup. Les contrôles se refont : les réglages ont pu bouger depuis. */
export const appliquerVersion = (id, { auteur }) =>
    transaction(async (t) => {
        const version = await verrouiller(id, t);
        if (version.statut !== "brouillon") throw new ErreurMetier("Seul un brouillon s'applique", 409, "VERSION_NON_BROUILLON");
        exigerDate(version.date_effet);
        const lignes = version.valeurs.map((v) => normaliser({ ...v.get(), force: v.force ?? undefined, poids: v.poids ?? undefined, valeur: v.valeur === null && !v.retiree ? undefined : v.valeur }));
        const violations = await controler(lignes, auteur, version.date_effet, { transaction: t });
        if (violations.length) throw new ErreurReglages(violations);
        return version.update({ statut: "appliquee", appliquee_le: new Date() }, { transaction: t });
    });

/** Abandonne un brouillon. Il reste dans l'historique. */
export const abandonnerVersion = (id) =>
    transaction(async (t) => {
        const version = await verrouiller(id, t);
        if (version.statut !== "brouillon") throw new ErreurMetier("Seul un brouillon s'abandonne : une version appliquée s'annule", 409, "VERSION_NON_BROUILLON");
        return version.update({ statut: "annulee" }, { transaction: t });
    });

// Ordre de deux lignes dans le temps : la date d'effet, puis le numéro de version
const apres = (a, b) => a.date_effet > b.date_effet || (a.date_effet === b.date_effet && a.id_version > b.id_version);

/**
 * Annule une version appliquée en créant son inverse, sans la modifier : chaque réglage reprend sa
 * valeur précédente, ou redescend d'un cran s'il n'en avait pas. Refusé si une version plus récente
 * touche le même réglage : l'annuler écraserait ce qu'elle a décidé.
 */
export const annulerVersion = (id, { id_auteur, auteur }) =>
    transaction(async (t) => {
        const version = await verrouiller(id, t);
        if (version.statut !== "appliquee") throw new ErreurMetier("Seule une version appliquée s'annule", 409, "VERSION_NON_APPLIQUEE");
        if (await VersionParametres.findOne({ where: { annule_version: version.id_version }, transaction: t })) throw new ErreurMetier("Cette version a déjà été annulée", 409, "VERSION_DEJA_ANNULEE");
        if (auteur !== "plateforme" && version.valeurs.some((v) => v.force)) throw new ErreurMetier("Cette version change la force d'une règle : seule la Plateforme peut l'annuler", 403, "DROIT_INSUFFISANT");

        const ref = { date_effet: version.date_effet, id_version: version.id_version };
        const toutes = await lireLignes({ transaction: t });
        const memeReglage = (v) => (l) => l.cle === v.cle && l.portee === v.portee && (l.id_portee ?? "") === v.id_portee && l.id_version !== version.id_version;
        const inverses = [];
        for (const v of version.valeurs) {
            const autres = toutes.filter(memeReglage(v));
            if (autres.some((l) => apres(l, ref))) throw new ErreurMetier(`Une version plus récente change « ${v.cle} » : annulez-la d'abord`, 409, "VERSION_PLUS_RECENTE");
            const precedente = autres.filter((l) => apres(ref, l)).sort((a, b) => (apres(a, b) ? -1 : 1))[0];
            const reprend = precedente && !precedente.retiree;
            inverses.push({ cle: v.cle, portee: v.portee, id_portee: v.id_portee, valeur: reprend ? precedente.valeur : null, force: reprend ? precedente.force ?? null : null, poids: reprend ? precedente.poids ?? null : null, retiree: !reprend });
        }
        const jour = aujourdhui();
        const inverse = await VersionParametres.create(
            { libelle: `Annulation de la version ${version.id_version}`, date_effet: version.date_effet > jour ? version.date_effet : jour, statut: "appliquee", appliquee_le: new Date(), id_auteur, annule_version: version.id_version },
            { transaction: t }
        );
        await ValeurParametre.bulkCreate(inverses.map((l) => ({ ...l, id_version: inverse.id_version })), { transaction: t });
        return inverse;
    });

/** Les versions, de la plus récente à la plus ancienne, avec leurs réglages. */
export const listerVersions = () => VersionParametres.findAll({ include: [{ model: ValeurParametre, as: "valeurs" }], order: [["id_version", "DESC"]], limit: 100 });
