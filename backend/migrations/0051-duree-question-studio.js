/**
 * Durée d'une question du Studio, en secondes (5 à 120, comme le direct) (import complet des quiz de ClassQuiz, décision du
 * 21 octobre 2026 : tout est repris chez nous). Vide : la question prend la durée réglée pour la
 * diffusion en direct. Les questions existantes restent vides.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("QuestionsQuestionnaire", "duree_s", { type: DataTypes.INTEGER, allowNull: true });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("QuestionsQuestionnaire", "duree_s");
};
