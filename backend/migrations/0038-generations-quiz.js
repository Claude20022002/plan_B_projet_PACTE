/**
 * Quiz générés par l'IA (docs/plans/quiz-ia.md, lot IA-3) : une ligne par génération.
 *  - contexte : enseignant, module, classe facultative (devoir à venir), source et plage ;
 *  - support_texte : texte extrait (repères compris), gardé pour régénérer une question ;
 *  - brouillon : questions relues et modifiées par l'enseignant avant création dans ClassQuiz ;
 *  - jetons et durée : suivi du coût.
 * Au bout de 30 jours, support_texte et brouillon sont effacés (les compteurs restent).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("GenerationsQuiz", {
        id_generation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        id_cours: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Cours", key: "id_cours" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Groupes", key: "id_groupe" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        source: { type: DataTypes.STRING(20), allowNull: false },
        nom_source: { type: DataTypes.STRING(255), allowNull: true },
        plage: { type: DataTypes.STRING(100), allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: false },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_cours" },
        erreur: { type: DataTypes.STRING(500), allowNull: true },
        support_texte: { type: DataTypes.TEXT("long"), allowNull: true },
        brouillon: { type: DataTypes.JSON, allowNull: true },
        modele: { type: DataTypes.STRING(100), allowNull: true },
        jetons_entree: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        jetons_sortie: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        duree_ms: { type: DataTypes.INTEGER, allowNull: true },
        id_quiz_classquiz: { type: DataTypes.STRING(36), allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    // Quota du jour et liste d'un enseignant ; purge par date
    await queryInterface.addIndex("GenerationsQuiz", ["id_user", "createdAt"], { name: "generations_quiz_user_date" });
    await queryInterface.addIndex("GenerationsQuiz", ["createdAt"], { name: "generations_quiz_date" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("GenerationsQuiz");
};
