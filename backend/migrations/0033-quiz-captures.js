/**
 * Quiz ClassQuiz : captures d'écran faites pendant les questions (anti-fraude, lot 4). L'iPhone
 * ne permet pas de les empêcher, seulement de les détecter : l'application les signale, le fork
 * les compte et les envoie avec les scores. Visibles de l'enseignant de la partie seulement.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("QuizResultats", "captures", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("QuizResultats", "captures");
};
