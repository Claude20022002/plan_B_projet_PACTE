/**
 * Devoirs avec dépôt de fichier (phase R3, remplace Google Classroom) : en plus des quiz corrigés
 * par Planner, un devoir « fichier » (consignes, énoncé facultatif) que l'étudiant rend sous forme
 * de fichier ; l'enseignant note sur 20 et commente. Le retard est signalé, pas refusé.
 *  - Devoirs : type (quiz | fichier), consignes ; quiz_id et questions deviennent facultatifs.
 *  - DevoirsRendus : note facultative (copie pas encore corrigée), commentaire, date de notation,
 *    retard ; réponses et décompte facultatifs (copie fichier).
 *  - FichiersDevoirs : énoncé (id_user nul) et copies (id_user de l'étudiant), 10 Mo au plus.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Devoirs", "type", { type: DataTypes.ENUM("quiz", "fichier"), allowNull: false, defaultValue: "quiz" });
    await queryInterface.addColumn("Devoirs", "consignes", { type: DataTypes.TEXT, allowNull: true });
    await queryInterface.changeColumn("Devoirs", "quiz_id", { type: DataTypes.STRING(64), allowNull: true });
    await queryInterface.changeColumn("Devoirs", "questions", { type: DataTypes.JSON, allowNull: true });

    await queryInterface.changeColumn("DevoirsRendus", "reponses", { type: DataTypes.JSON, allowNull: true });
    await queryInterface.changeColumn("DevoirsRendus", "bonnes", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.changeColumn("DevoirsRendus", "notees", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.changeColumn("DevoirsRendus", "note", { type: DataTypes.DECIMAL(4, 2), allowNull: true });
    await queryInterface.addColumn("DevoirsRendus", "commentaire", { type: DataTypes.TEXT, allowNull: true });
    await queryInterface.addColumn("DevoirsRendus", "note_le", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addColumn("DevoirsRendus", "en_retard", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

    await queryInterface.createTable("FichiersDevoirs", {
        id_fichier: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_devoir: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Devoirs", key: "id_devoir" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        // Nul pour l'énoncé de l'enseignant ; sinon l'étudiant qui rend
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        contenu: { type: DataTypes.BLOB("medium"), allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("FichiersDevoirs", ["id_devoir", "id_user"]);
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.dropTable("FichiersDevoirs");
    await queryInterface.removeColumn("DevoirsRendus", "en_retard");
    await queryInterface.removeColumn("DevoirsRendus", "note_le");
    await queryInterface.removeColumn("DevoirsRendus", "commentaire");
    await queryInterface.removeColumn("Devoirs", "consignes");
    await queryInterface.removeColumn("Devoirs", "type");
    // Colonnes redevenues obligatoires : suppose qu'il ne reste que des devoirs quiz
    await queryInterface.changeColumn("DevoirsRendus", "note", { type: DataTypes.DECIMAL(4, 2), allowNull: false });
    await queryInterface.changeColumn("DevoirsRendus", "notees", { type: DataTypes.INTEGER, allowNull: false });
    await queryInterface.changeColumn("DevoirsRendus", "bonnes", { type: DataTypes.INTEGER, allowNull: false });
    await queryInterface.changeColumn("DevoirsRendus", "reponses", { type: DataTypes.JSON, allowNull: false });
    await queryInterface.changeColumn("Devoirs", "questions", { type: DataTypes.JSON, allowNull: false });
    await queryInterface.changeColumn("Devoirs", "quiz_id", { type: DataTypes.STRING(64), allowNull: false });
};
