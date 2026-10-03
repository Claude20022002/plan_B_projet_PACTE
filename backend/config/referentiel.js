/**
 * Listes fermées du référentiel de l'établissement (phase P1).
 * Une seule source pour les modèles, les validations et les migrations.
 */

export const TYPES_SALLE = [
    "Amphithéâtre",
    "Salle de cours",
    "Salle TD",
    "Labo informatique",
    "Labo génie civil",
    "Labo génie industriel",
    "Labo électronique & réseaux",
    "Salle de réunion",
];

// Anciens libellés (seed, saisies libres) ramenés vers la liste fermée
export const ALIAS_TYPES_SALLE = {
    "amphi": "Amphithéâtre",
    "amphitheatre": "Amphithéâtre",
    "amphithéâtre": "Amphithéâtre",
    "salle de cours": "Salle de cours",
    "salle": "Salle de cours",
    "salle td": "Salle TD",
    "td": "Salle TD",
    "laboratoire informatique": "Labo informatique",
    "labo informatique": "Labo informatique",
    "labo info": "Labo informatique",
    "salle informatique": "Labo informatique",
    "laboratoire": "Labo informatique",
    "salle de réunion": "Salle de réunion",
    "salle de reunion": "Salle de réunion",
};

export const normaliserTypeSalle = (valeur) => {
    if (!valeur) return valeur;
    const brut = String(valeur).trim();
    if (TYPES_SALLE.includes(brut)) return brut;
    return ALIAS_TYPES_SALLE[brut.toLowerCase()] || brut;
};

export const RESERVABLE_PAR = ["admin", "enseignants"];

// Régimes de formation de HESTIM : temps plein, horaires aménagés, executive
export const REGIMES = ["initiale", "continue", "executive"];

// Variante de grille horaire : la variante ramadan réutilise les mêmes rangs à horaires réduits
export const VARIANTES_GRILLE = ["normale", "ramadan"];

export const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export const TYPES_EVENEMENT = ["vacances", "examen", "ferie", "reunion", "formation", "ramadan", "stage", "autre"];

// Portée d'un événement : qui il bloque
export const PORTEES_EVENEMENT = ["etablissement", "campus", "filiere", "niveau", "groupe"];

export const CODES_PERIODE = ["S1", "S2"];

// ==================== OFFRE DE FORMATION (phase P2) ====================

export const ECOLES = ["engineering", "business"];

export const CYCLES = ["prepa", "licence", "ingenieur", "master", "executive"];

export const TYPES_COMPOSANTE = ["CM", "TD", "TP", "Projet"];

// Granularité du groupe qui suit la composante : toute la promotion, un groupe de TD, un demi-groupe de TP
export const NIVEAUX_GROUPE = ["promotion", "td", "tp"];

export const TYPES_GROUPE = NIVEAUX_GROUPE;

export const MODALITES = ["presentiel", "distanciel", "hybride"];

/** Ancien Cours.type_cours (texte libre) → type de composante. */
export const normaliserTypeComposante = (valeur) => {
    const brut = String(valeur || "").trim().toLowerCase();
    if (brut === "td" || brut.startsWith("travaux dirig")) return "TD";
    if (brut === "tp" || brut.startsWith("travaux prat")) return "TP";
    if (brut.startsWith("projet") || brut === "pfe") return "Projet";
    return "CM";
};

/** Numéro d'année d'études lu dans un libellé de niveau (« 4ème année », « 4A », « 1ère année Prépa »). */
export const anneeDepuisNiveau = (niveau) => {
    const chiffre = String(niveau || "").match(/\d/);
    return chiffre ? Number(chiffre[0]) : null;
};

/**
 * Un semestre (« S7 ») se déroule dans la période S1 s'il est impair, S2 s'il est pair.
 * Retourne null si le libellé n'a pas de numéro.
 */
export const periodeDuSemestre = (semestre) => {
    const numero = Number(String(semestre || "").match(/\d+/)?.[0]);
    if (!numero) return null;
    return numero % 2 === 1 ? "S1" : "S2";
};

// Ordre d'emboîtement : une promotion contient des groupes de TD, qui contiennent des groupes de TP
export const RANG_TYPE_GROUPE = { promotion: 0, td: 1, tp: 2 };

// ==================== ENSEIGNANTS ET SERVICES (phase P3) ====================

// Permanent : disponible sauf indisponibilité déclarée. Vacataire : disponible seulement là où il l'a déclaré.
export const STATUTS_ENSEIGNANT = ["permanent", "vacataire"];

export const ROLES_SERVICE = ["principal", "co_enseignant"];

export const STATUTS_SERVICE = ["propose", "accepte", "refuse"];

// Vœu sur un créneau : simple préférence, jamais bloquante
export const PREFERENCES_CRENEAU = ["neutre", "prefere", "eviter"];
