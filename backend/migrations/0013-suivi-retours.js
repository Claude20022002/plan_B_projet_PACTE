/**
 * Phase P7 — suivi du réalisé, et retour de séance en un clic (innovation I7).
 * - Affectations.statut : « realise » (séance faite) et realisee_le.
 * - RetoursSeance : note de 1 à 5 et un mot facultatif, SANS lien avec l'étudiant (anonymat).
 * - RetoursSeanceParticipations : qui a déjà répondu à quelle séance (un retour par étudiant),
 *   sans lien avec le contenu de la réponse.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.changeColumn("Affectations", "statut", {
        type: DataTypes.ENUM("planifie", "confirme", "annule", "reporte", "realise"),
        defaultValue: "planifie",
    });
    await queryInterface.addColumn("Affectations", "realisee_le", { type: DataTypes.DATE, allowNull: true });

    await queryInterface.createTable("RetoursSeance", {
        id_retour: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Affectations", key: "id_affectation" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        note: { type: DataTypes.TINYINT, allowNull: false },
        mot: { type: DataTypes.STRING(40), allowNull: true },
        // Jour seulement (pas d'heure exacte) : on ne recoupe pas une réponse avec une participation
        jour: { type: DataTypes.DATEONLY, allowNull: false },
    });
    await queryInterface.addIndex("RetoursSeance", ["id_affectation"]);

    await queryInterface.createTable("RetoursSeanceParticipations", {
        id_affectation: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Affectations", key: "id_affectation" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
    });
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.dropTable("RetoursSeanceParticipations");
    await queryInterface.dropTable("RetoursSeance");
    await queryInterface.removeColumn("Affectations", "realisee_le");
    await queryInterface.changeColumn("Affectations", "statut", {
        type: DataTypes.ENUM("planifie", "confirme", "annule", "reporte"),
        defaultValue: "planifie",
    });
};
