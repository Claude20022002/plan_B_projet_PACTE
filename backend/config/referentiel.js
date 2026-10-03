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
