/**
 * Nature d'une épreuve : « examen » (session d'examens, surveillée par du personnel de
 * l'administration) ou « controle » (contrôle d'un module, surveillé par ses propres enseignants).
 * À HESTIM, les enseignants ne surveillent en général que leurs contrôles (7 octobre 2026).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("SessionsExamen", "nature", {
        type: DataTypes.ENUM("examen", "controle"),
        allowNull: false,
        defaultValue: "examen",
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("SessionsExamen", "nature");
};
