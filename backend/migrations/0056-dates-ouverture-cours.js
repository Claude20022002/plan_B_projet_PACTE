/**
 * Dates d'ouverture et de fermeture des sections et des supports de cours (plan multi-établissements,
 * fichier 14, lot EC-1 ; Moodle « restreindre l'accès », Classroom « programmer ») : un support peut
 * être préparé à l'avance et n'apparaître chez les étudiants qu'à sa date, puis disparaître à sa
 * fermeture. Deux dates facultatives, incluses l'une et l'autre ; vides, rien ne change (comportement
 * d'avant). Retour arrière : les colonnes sont retirées, les éléments redeviennent visibles selon
 * leur seul interrupteur « visible ».
 */
const TABLES = ["SectionsCours", "SupportsCours"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    for (const table of TABLES) {
        await queryInterface.addColumn(table, "visible_du", { type: DataTypes.DATEONLY, allowNull: true });
        await queryInterface.addColumn(table, "visible_jusqu_au", { type: DataTypes.DATEONLY, allowNull: true });
    }
};

export const down = async ({ queryInterface }) => {
    for (const table of TABLES) {
        await queryInterface.removeColumn(table, "visible_jusqu_au");
        await queryInterface.removeColumn(table, "visible_du");
    }
};
