/**
 * Date du jour à l'école, au format AAAA-MM-JJ, pour le site et l'application (lot B-2) : une seule
 * définition à la place des copies de `new Date().toISOString().slice(0, 10)`.
 *
 * Le calcul se fait en UTC, plus un décalage écrit ici seulement. Le Maroc est à UTC+0 toute
 * l'année depuis le 20 septembre 2026 (backend/tzdata/LISEZMOI.md). Surtout pas de fuseau
 * « Africa/Casablanca » demandé au navigateur : une base de fuseaux ancienne croit encore le Maroc
 * à UTC+1 et se tromperait de jour entre 23 h et minuit (le serveur embarque sa propre base pour
 * la même raison). Si l'heure légale change de nouveau, seul DECALAGE_ECOLE_MINUTES change.
 */

/** Décalage de l'heure de l'école sur UTC, en minutes */
export const DECALAGE_ECOLE_MINUTES = 0;

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Date de l'école (AAAA-MM-JJ) à l'instant donné, par défaut maintenant. */
export const aujourdhui = (maintenant = new Date()) =>
  new Date(maintenant.getTime() + DECALAGE_ECOLE_MINUTES * 60 * 1000).toISOString().slice(0, 10);

/** Date de l'école (AAAA-MM-JJ) dans n jours (négatif : il y a n jours). */
export const dansJours = (n, maintenant = new Date()) => aujourdhui(new Date(maintenant.getTime() + n * JOUR_MS));

/**
 * Locale de l'écran pour les dates, les heures et les nombres. En anglais aussi, l'heure sur
 * 24 h et le jour avant le mois (en-GB), comme les emplois du temps de l'école : « en » seul
 * donnait « 10:20 PM » et « 10/20/2026 » à côté de « 15:30 » (recette du 20 octobre, m-6).
 */
export const localeEcran = (langue) => (String(langue ?? '').startsWith('en') ? 'en-GB' : 'fr-FR');
