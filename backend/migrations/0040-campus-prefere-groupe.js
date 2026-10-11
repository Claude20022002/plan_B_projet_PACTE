/**
 * Campus préféré d'un groupe (constat du groupe B, 11 octobre 2026). Jusqu'ici le campus préféré se
 * réglait seulement par filière ; or deux promotions d'une même filière peuvent avoir cours sur
 * deux campus (la 3A IIIA à Stendhal, la 4A IIIA à Gandhi), et le solveur ne pouvait pas le savoir.
 * Le campus d'un groupe l'emporte sur celui de sa filière ; un groupe de TD ou de TP sans campus
 * prend celui de sa promotion (services/planning/groupes.js). Vide : rien ne change.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Groupes", "id_campus_prefere", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Campus", key: "id_campus" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("Groupes", "id_campus_prefere");
};
