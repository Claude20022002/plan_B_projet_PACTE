import { aujourdhui } from '../../../shared/dates.js';

/**
 * Année choisie sur les pages de gestion (lot ME-18) : l'identifiant d'une année universitaire,
 * ou TOUTES. Sans choix valable, l'année en cours ; sans année en cours, toutes les années.
 */
export const TOUTES = 'tout';

/** L'année en cours : celle marquée active, sinon celle qui contient le jour (même règle que le serveur). */
export const anneeEnCours = (annees, jour = aujourdhui()) =>
    annees.find((a) => a.active) ?? annees.find((a) => a.date_debut <= jour && jour <= a.date_fin) ?? null;

/** Valeur du sélecteur : le choix s'il désigne encore une année existante, sinon l'année en cours. */
export const valeurRetenue = (annees, choix, jour = aujourdhui()) => {
    if (choix === TOUTES) return TOUTES;
    if (annees.some((a) => String(a.id_annee) === choix)) return choix;
    const courante = anneeEnCours(annees, jour);
    return courante ? String(courante.id_annee) : TOUTES;
};

/** Paramètre des listes de groupes : `id_annee`, ou rien pour toutes les années. */
export const filtreAnnee = (valeur) => (valeur && valeur !== TOUTES ? { id_annee: valeur } : {});

/** L'année qui contient le jour (AAAA-MM-JJ), sinon l'année en cours. */
export const anneeDuJour = (annees, jour) =>
    (jour && annees.find((a) => a.date_debut <= jour && jour <= a.date_fin)) || anneeEnCours(annees);

/**
 * Groupes d'une année (valeur du sélecteur), et ceux dont l'année est inconnue : on ne cache rien
 * par erreur, comme le serveur pour les étudiants. Les groupes `gardes` (identifiants déjà choisis)
 * restent toujours, pour qu'un choix fait sur une autre année ne s'efface pas.
 */
export const groupesDeLAnnee = (groupes, valeur, gardes = []) => {
    if (!valeur || valeur === TOUTES) return groupes;
    const choisis = new Set(gardes.filter(Boolean).map(Number));
    return groupes.filter((g) => g.id_annee == null || String(g.id_annee) === String(valeur) || choisis.has(g.id_groupe));
};

/** Groupes à proposer pour une séance, un examen ou une réservation à cette date (lot ME-18). */
export const groupesDuJour = (groupes, annees, jour, gardes = []) =>
    groupesDeLAnnee(groupes, anneeDuJour(annees, jour)?.id_annee, gardes);
