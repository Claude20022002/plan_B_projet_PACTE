/**
 * ClassQuiz derrière une fonctionnalité de l'établissement (plan multi-établissements, lot ME-0c ;
 * D-04 : « ClassQuiz est éteint pour tout nouvel établissement »). Une colonne de la ligne de
 * l'école, dans sa propre base : avec plusieurs écoles, chacune a la sienne.
 *
 * Éteinte par défaut. Allumée seulement pour une base qui a déjà des comptes au moment de la
 * migration : celle de HESTIM, qui utilise ClassQuiz, ne voit aucun changement ; une installation
 * neuve (base vide) part sans ClassQuiz. Rallumer : UPDATE ConfigurationEtablissement SET
 * classquiz_actif = 1 WHERE id = 1 (DEPLOIEMENT.md).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("ConfigurationEtablissement", "classquiz_actif", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.sequelize.query("UPDATE ConfigurationEtablissement SET classquiz_actif = 1 WHERE EXISTS (SELECT 1 FROM Users)");
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("ConfigurationEtablissement", "classquiz_actif");
};
