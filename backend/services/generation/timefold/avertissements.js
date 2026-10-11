/**
 * Avertissements donnés avant le calcul de la semaine type : ce qu'aucun calcul ne pourra résoudre,
 * signalé tout de suite pour que l'administration relance l'enseignant ou revoie sa charge, au lieu
 * de le découvrir séance par séance au moment de recopier la semaine sur les dates.
 * Fonctions pures : elles ne lisent que le problème déjà construit (probleme.js).
 */

/** Durée d'un créneau de la grille, en minutes. */
const dureeDe = (creneau) => creneau.fin - creneau.debut;

/**
 * Disponibilités insuffisantes : plus de séances à donner que de créneaux libres dans la semaine.
 * @returns {object|null} l'avertissement, ou null si les créneaux libres suffisent
 */
const disponibilitesInsuffisantes = (enseignant, siennes, voeux, creneaux) => {
    const bloques = new Set(voeux.filter((v) => v.enseignantId === enseignant.id_user && v.type === "INDISPONIBLE").map((v) => v.creneauId));
    if (!bloques.size || !siennes.length) return null;
    const longueur = Math.max(...siennes.map((l) => l.longueur));
    const libres = creneaux.filter((c) => !bloques.has(c.id) && (longueur === 1 || (c.suivantId && !bloques.has(c.suivantId)))).length;
    if (siennes.length <= libres) return null;
    return { type: "disponibilites_insuffisantes", id_user: enseignant.id_user, enseignant: enseignant.nom, statut: enseignant.statut, seances: siennes.length, creneaux_libres: libres };
};

/**
 * Durée la plus courte qu'une leçon peut prendre dans sa grille : le solveur n'a pas encore choisi
 * son créneau, et tous n'ont pas la même durée. Une leçon épinglée a déjà le sien.
 */
const dureeMinimale = (lecon, creneaux) => {
    const parId = new Map(creneaux.map((c) => [c.id, c]));
    if (lecon.epinglee) return parId.has(lecon.creneau?.id) ? dureeDe(parId.get(lecon.creneau.id)) : 0;
    const durees = creneaux
        .filter((c) => c.regime === lecon.regime && (lecon.longueur === 1 || parId.has(c.suivantId)))
        .map((c) => dureeDe(c) + (lecon.longueur === 2 ? dureeDe(parId.get(c.suivantId)) : 0));
    return durees.length ? Math.min(...durees) : 0;
};

/**
 * Plafond hebdomadaire : la semaine type dépasse le plafond de l'enseignant, quels que soient les
 * créneaux choisis. Le calcul ne connaît pas ce plafond ; sans ce signalement, il n'apparaissait
 * qu'en avertissement sur chaque séance recopiée. Compté au plus court : un dépassement signalé
 * est donc certain, et un plafond tout juste tenu peut encore être dépassé d'un quart d'heure.
 * @returns {object|null} l'avertissement, ou null si le plafond tient (ou s'il n'y en a pas)
 */
const plafondHebdomadaireDepasse = (enseignant, siennes, creneaux) => {
    const plafond = enseignant.max_heures_semaine;
    if (!plafond) return null;
    const minutes = siennes.reduce((total, l) => total + dureeMinimale(l, creneaux), 0);
    if (minutes <= plafond * 60) return null;
    return { type: "plafond_hebdomadaire", id_user: enseignant.id_user, enseignant: enseignant.nom, statut: enseignant.statut, plafond_heures: plafond, heures_semaine: Math.round(minutes / 6) / 10, seances: siennes.length };
};

/**
 * @param {object} donnees
 * @param {object[]} donnees.enseignants { id_user, nom, statut, max_heures_semaine }
 * @param {object[]} donnees.voeux vœux envoyés au solveur
 * @param {object[]} donnees.lecons leçons à placer (les seules comptées pour les disponibilités)
 * @param {object[]} donnees.occupations leçons épinglées, déjà en place (comptées dans le plafond)
 * @param {object[]} donnees.creneaux grille envoyée au solveur
 * @returns {object[]} les avertissements, dans l'ordre des enseignants
 */
export const avertissementsAvantGeneration = ({ enseignants, voeux, lecons, occupations = [], creneaux }) =>
    enseignants.flatMap((enseignant) => {
        const aPlacer = lecons.filter((l) => l.enseignants.includes(enseignant.id_user));
        const enPlace = occupations.filter((l) => l.enseignants.includes(enseignant.id_user));
        return [
            disponibilitesInsuffisantes(enseignant, aPlacer, voeux, creneaux),
            plafondHebdomadaireDepasse(enseignant, [...aPlacer, ...enPlace], creneaux),
        ].filter(Boolean);
    });
