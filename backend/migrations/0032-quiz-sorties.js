/**
 * Quiz ClassQuiz : journal des sorties (anti-fraude, lot 3). Pour chaque joueur, le nombre de
 * sorties de l'onglet ou de l'application pendant les questions et leur durée cumulée, envoyés
 * par le fork avec les scores. Visibles de l'enseignant de la partie seulement.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("QuizResultats", "sorties", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn("QuizResultats", "sorties_duree_ms", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("QuizResultats", "sorties_duree_ms");
    await queryInterface.removeColumn("QuizResultats", "sorties");
};
