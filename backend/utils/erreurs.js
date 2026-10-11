/**
 * Format commun des erreurs de l'API (lot A-5), documenté dans docs/api/ERREURS.md :
 *   { message, code?, violations? }
 * - message : phrase en français, affichable telle quelle ;
 * - code : identifiant stable en capitales, pour qu'un écran réagisse sans lire le message ;
 * - violations : détail, quand il y en a plusieurs (règles de planification, champs invalides).
 * Le gestionnaire global et les erreurs de planification l'emploient ; les anciens contrôleurs s'y
 * alignent au fil de A-6.
 */

const CODES_PAR_STATUT = {
    400: "REQUETE_INVALIDE",
    401: "NON_AUTHENTIFIE",
    403: "INTERDIT",
    404: "INTROUVABLE",
    409: "CONFLIT",
    413: "TROP_VOLUMINEUX",
    422: "REFUSE",
    429: "TROP_DE_REQUETES",
    500: "ERREUR_SERVEUR",
    502: "SERVICE_EXTERNE",
    503: "INDISPONIBLE",
    504: "DELAI_DEPASSE",
};

/** Rend le code par défaut d'un statut HTTP (ERREUR_SERVEUR pour un statut inconnu de 500 et plus). */
export const codeDuStatut = (statut) => CODES_PAR_STATUT[statut] ?? (statut >= 500 ? "ERREUR_SERVEUR" : "REQUETE_INVALIDE");

/** Rend le corps d'une erreur au format commun ; `code` et `violations` sont facultatifs. */
export const corpsErreur = (statut, message, { code, violations } = {}) => ({
    message,
    code: code ?? codeDuStatut(statut),
    ...(violations?.length ? { violations } : {}),
});

/** Répond une erreur au format commun. */
export const repondreErreur = (res, statut, message, options) => res.status(statut).json(corpsErreur(statut, message, options));
