/**
 * Index des séances (optimisation). Presque toutes les lectures filtrent par date : jour et créneau
 * (conflits, occupations, assistant), liste paginée la plus récente d'abord, période d'un groupe,
 * d'un enseignant ou d'une salle (emplois du temps, ICS, imprévus), statut et période (suivi du
 * réalisé). Sans index sur date_seance, une
 * journée ou un mois parcouraient toute la table (mesuré sur une année de 18 000 séances : 12 à
 * 17 ms par lecture, appelée en boucle par la validation).
 */
const INDEX = [
    // Seul (InnoDB y ajoute la clé primaire) : sert aussi le tri « date puis id » des listes paginées
    { champs: ["date_seance"], nom: "affectations_date" },
    { champs: ["id_groupe", "date_seance"], nom: "affectations_groupe_date" },
    { champs: ["id_user_enseignant", "date_seance"], nom: "affectations_enseignant_date" },
    { champs: ["id_salle", "date_seance"], nom: "affectations_salle_date" },
    { champs: ["statut", "date_seance"], nom: "affectations_statut_date" },
];

export const up = async ({ queryInterface }) => {
    for (const { champs, nom } of INDEX) {
        await queryInterface.addIndex("Affectations", champs, { name: nom });
    }
};

export const down = async ({ queryInterface }) => {
    for (const { nom } of INDEX) {
        await queryInterface.removeIndex("Affectations", nom);
    }
};
