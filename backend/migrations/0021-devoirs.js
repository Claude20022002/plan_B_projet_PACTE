/**
 * Devoirs notés (phase Q) : un enseignant donne l'un de ses quiz ClassQuiz en devoir dans un
 * module, à rendre avant une date limite. Planner copie les questions (le quiz peut ensuite
 * changer sans modifier le devoir), corrige lui-même les réponses et note sur 20.
 *  - Devoirs : le devoir, son module, le groupe visé (sinon tous les étudiants du module) et la
 *    copie des questions avec leurs réponses attendues (jamais envoyées aux étudiants avant la
 *    date limite).
 *  - DevoirsRendus : une copie par étudiant (une seule tentative), ses réponses et sa note.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("Devoirs", {
        id_devoir: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING(255), allowNull: false },
        quiz_id: { type: DataTypes.STRING(64), allowNull: false },
        questions: { type: DataTypes.JSON, allowNull: false },
        id_cours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Cours", key: "id_cours" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_groupe: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Groupes", key: "id_groupe" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        date_limite: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Devoirs", ["id_cours"]);

    await queryInterface.createTable("DevoirsRendus", {
        id_devoir_rendu: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_devoir: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Devoirs", key: "id_devoir" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        reponses: { type: DataTypes.JSON, allowNull: false },
        bonnes: { type: DataTypes.INTEGER, allowNull: false },
        notees: { type: DataTypes.INTEGER, allowNull: false },
        note: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
        rendu_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("DevoirsRendus", ["id_devoir", "id_user"], { unique: true, name: "devoirs_rendus_devoir_etudiant" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("DevoirsRendus");
    await queryInterface.dropTable("Devoirs");
};
