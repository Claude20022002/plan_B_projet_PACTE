/**
 * Paramètres de planification modifiables par l'administration.
 * La base (table ParametresPlanning) ne stocke que les valeurs modifiées : sans ligne,
 * c'est la valeur par défaut ci-dessous qui s'applique. Les valeurs inconnues de
 * l'école (pause du vendredi, trajet entre campus…) sont des hypothèses à confirmer.
 */

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

const entier = (min, max) => (v) => Number.isInteger(v) && v >= min && v <= max;

export const PARAMETRES_PLANNING = {
    max_heures_jour_groupe: {
        defaut: 8,
        valider: entier(1, 12),
        description: "Nombre maximal d'heures de cours par jour pour un groupe",
    },
    max_heures_jour_enseignant: {
        defaut: 8,
        valider: entier(1, 12),
        description: "Nombre maximal d'heures de cours par jour pour un enseignant",
    },
    pause_vendredi: {
        defaut: { active: true, debut: "12:30", fin: "14:30" },
        valider: (v) =>
            v !== null && typeof v === "object" && typeof v.active === "boolean" &&
            HEURE.test(v.debut) && HEURE.test(v.fin) && v.debut < v.fin,
        description: "Pause du vendredi midi : aucun cours de formation initiale sur cette plage",
    },
    samedi_apres_midi_initiale: {
        defaut: false,
        valider: (v) => typeof v === "boolean",
        description: "Autoriser des cours de formation initiale le samedi après-midi",
    },
    duree_seance_defaut_minutes: {
        defaut: 90,
        valider: entier(30, 300),
        description: "Durée d'une séance par défaut (minutes)",
    },
    ratio_capacite_examen: {
        defaut: 0.5,
        valider: (v) => typeof v === "number" && v > 0 && v <= 1,
        description: "Part de la capacité d'une salle utilisable en examen (si non renseignée sur la salle)",
    },
    trajet_inter_campus_defaut_minutes: {
        defaut: 30,
        valider: entier(0, 240),
        description: "Temps de trajet entre deux campus quand aucun trajet n'est renseigné",
    },
};

export const estParametreConnu = (cle) => Object.hasOwn(PARAMETRES_PLANNING, cle);
