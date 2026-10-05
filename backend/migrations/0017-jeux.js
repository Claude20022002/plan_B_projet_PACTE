/**
 * Jeux pédagogiques intégrés à Planner (terminal Linux…, catalogue dans shared/jeux/catalogue.js).
 *  - JeuxModules : jeux proposés dans un module (par l'administration, le responsable de la
 *    filière ou un enseignant du module) ; les étudiants du module les voient en premier.
 *  - JeuxProgressions : défis réussis par chaque joueur, points calculés par le serveur.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("JeuxModules", {
        id_jeu_module: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        id_cours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Cours", key: "id_cours" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user_auteur: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("JeuxModules", ["code_jeu", "id_cours"], { unique: true, name: "jeux_modules_jeu_cours" });
    await queryInterface.addIndex("JeuxModules", ["id_cours"]);

    await queryInterface.createTable("JeuxProgressions", {
        id_jeu_progression: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        id_defi: { type: DataTypes.STRING(60), allowNull: false },
        indices: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
        points: { type: DataTypes.INTEGER, allowNull: false },
        reussi_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("JeuxProgressions", ["id_user", "code_jeu", "id_defi"], { unique: true, name: "jeux_progressions_joueur_defi" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("JeuxProgressions");
    await queryInterface.dropTable("JeuxModules");
};
