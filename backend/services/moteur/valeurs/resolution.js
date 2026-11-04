import { coherenceDesValeurs } from "../catalogue/verifier.js";

/**
 * Valeurs résolues du moteur (lot MP-1) : quelle valeur s'applique à une cible, à une date.
 * Du moins précis au plus précis : catalogue, profil, établissement, pédagogique, individuel.
 * Fonctions pures : elles reçoivent les lignes déjà lues en base, et n'ont besoin d'aucune connexion.
 * Le choix de ces lignes (versions appliquées, immuables) est décrit dans conception-mp1.md.
 */

/** Portées pédagogiques, de la plus large à la plus fine. Une portée individuelle passe après elles. */
const PEDAGOGIQUES = ["cycle", "niveau", "filiere"];
const ETABLISSEMENT = "etablissement";

// Rang de précision d'une portée : l'individuel vaut toujours plus que le pédagogique
export const rangDePortee = (portee) => {
    if (portee === ETABLISSEMENT) return 0;
    const i = PEDAGOGIQUES.indexOf(portee);
    return i >= 0 ? i + 1 : PEDAGOGIQUES.length + 1;
};

/** Le paramètre peut-il prendre une valeur à cette portée ? Son niveau et sa cible en décident. */
export const porteeAdmise = (p, portee) => {
    if (portee === ETABLISSEMENT) return p.niveaux.includes("G");
    if (PEDAGOGIQUES.includes(portee)) return p.niveaux.includes("P");
    return p.niveaux.includes("I") && p.cible === portee;
};

const cleDeLigne = (l) => `${l.cle}|${l.portee}|${l.id_portee ?? ""}`;

/**
 * Lignes en vigueur à une date : version appliquée, déjà prise d'effet ; pour une même portée, la
 * plus récente gagne (à date égale, la version au plus grand numéro). Une ligne « retiree » annule
 * ce réglage : la valeur redescend d'un cran, ce qui permet d'annuler sans jamais modifier une
 * version appliquée (invariant I-D5).
 */
export const lignesEnVigueur = (lignes, date) => {
    const retenues = new Map();
    for (const l of lignes) {
        if (l.statut !== "appliquee" || l.date_effet > date) continue;
        const cle = cleDeLigne(l);
        const deja = retenues.get(cle);
        if (!deja || l.date_effet > deja.date_effet || (l.date_effet === deja.date_effet && l.id_version > deja.id_version)) retenues.set(cle, l);
    }
    return [...retenues.values()].filter((l) => !l.retiree);
};

// Une ligne concerne-t-elle cette cible ? L'établissement vaut pour tous ; sinon, l'identifiant doit correspondre.
const concerne = (l, cible) => l.portee === ETABLISSEMENT || (cible[l.portee] !== undefined && cible[l.portee] === l.id_portee);

const parParametre = (lignes) => {
    const index = new Map();
    for (const l of lignes) index.set(l.cle, [...(index.get(l.cle) ?? []), l]);
    return index;
};

/**
 * Résout un paramètre pour une cible.
 * La force ne change que si le catalogue l'admet ; une règle stricte n'a jamais de poids (D-09).
 * @returns {{ id, valeur, force, poids, origine, trace }}
 */
export const resoudreParametre = (p, { profil = null, lignes = [], cible = {} }) => {
    let valeur = p.defaut;
    let force = p.force;
    let poids = p.poids;
    let origine = "catalogue";
    const trace = [{ origine, valeur }];

    const appliquer = (reglage, nom) => {
        if ("valeur" in reglage && reglage.valeur !== undefined) {
            valeur = reglage.valeur;
            origine = nom;
            trace.push({ origine: nom, valeur });
        }
        if (reglage.force && p.force_reglable) force = reglage.force;
        if (reglage.poids > 0) poids = reglage.poids;
    };

    const dansLeProfil = profil?.reglages?.[p.id];
    if (dansLeProfil) appliquer(dansLeProfil, `profil:${profil.code}`);

    const miennes = lignes.filter((l) => l.cle === p.id && concerne(l, cible)).sort((a, b) => rangDePortee(a.portee) - rangDePortee(b.portee));
    for (const l of miennes) appliquer(l, l.portee);

    return { id: p.id, valeur, force, poids: force === "souple" ? poids : null, origine, trace };
};

const comparer = (a, op, b) => {
    if (op === ">=") return a !== null && a !== undefined && a >= b;
    if (op === "<=") return a !== null && a !== undefined && a <= b;
    if (op === "=") return a === b;
    if (op === "!=") return (a ?? null) !== b;
    return [a].flat().includes(b);
};

/**
 * Une règle compte-t-elle dans le calcul ? Pas si sa valeur la désactive, ni si une condition
 * « active_si » n'est pas remplie : le moteur n'a pas à porter des règles sans objet.
 */
export const regleActive = (p, resolu, valeurs, dependances) => {
    if (p.role !== "regle") return false;
    if (resolu.valeur === false || resolu.valeur === null || resolu.valeur === undefined) return false;
    return dependances.filter((d) => d.type === "active_si" && d.de === p.id).every((d) => comparer(valeurs.get(d.vers), d.op, d.val));
};

/** Le profil se résout d'abord : il dépend de la cible (une école peut avoir un primaire et un lycée). */
const profilDeLaCible = (parametres, profils, lignes, cible) => {
    const p = parametres.find((x) => x.id === "ETA.ID.PROFIL");
    const code = p ? resoudreParametre(p, { lignes, cible }).valeur : null;
    return profils.find((x) => x.code === code) ?? null;
};

/**
 * Résout tout le catalogue pour une cible et une date.
 * @param {object} o parametres, profils, dependances, lignes (lues en base), date, cible
 * @param {object} [o.faits] valeurs comptées, jamais saisies (nombre de campus...)
 * @returns {{ profil, valeurs: Map, resultats: Map, actives: string[], alertes: string[] }}
 */
export const resoudreTout = ({ parametres, profils = [], dependances = [], lignes = [], date, cible = {}, faits = {} }) => {
    const enVigueur = lignesEnVigueur(lignes, date);
    const profil = profilDeLaCible(parametres, profils, enVigueur, cible);
    const index = parParametre(enVigueur);
    const resultats = new Map(parametres.map((p) => [p.id, resoudreParametre(p, { profil, lignes: index.get(p.id) ?? [], cible })]));
    const valeurs = new Map([...resultats].map(([id, r]) => [id, r.valeur]));
    for (const [id, v] of Object.entries(faits)) valeurs.set(id, v);
    return {
        profil: profil?.code ?? null,
        valeurs,
        resultats,
        actives: parametres.filter((p) => regleActive(p, resultats.get(p.id), valeurs, dependances)).map((p) => p.id),
        alertes: coherenceDesValeurs(valeurs, dependances),
    };
};
