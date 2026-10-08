/**
 * Espace « Activités » : quiz, jeux et devoirs forment un même ensemble, choisi par l'enseignant
 * dans un module, avec un but (vérifier la compréhension ou s'entraîner) et, s'il le souhaite, la
 * notion visée (« les boucles », « le present perfect »…).
 *  - JeuxModules : un jeu proposé sert d'abord à s'entraîner ;
 *  - Devoirs : un devoir sert d'abord à vérifier la compréhension.
 */
const BUTS = ["verifier", "entrainer"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("JeuxModules", "but", { type: DataTypes.ENUM(...BUTS), allowNull: false, defaultValue: "entrainer" });
    await queryInterface.addColumn("JeuxModules", "notion", { type: DataTypes.STRING(120), allowNull: true });
    await queryInterface.addColumn("Devoirs", "but", { type: DataTypes.ENUM(...BUTS), allowNull: false, defaultValue: "verifier" });
    await queryInterface.addColumn("Devoirs", "notion", { type: DataTypes.STRING(120), allowNull: true });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("Devoirs", "notion");
    await queryInterface.removeColumn("Devoirs", "but");
    await queryInterface.removeColumn("JeuxModules", "notion");
    await queryInterface.removeColumn("JeuxModules", "but");
};
