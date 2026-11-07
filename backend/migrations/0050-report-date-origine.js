/**
 * Date et créneau de la séance au moment de la demande de report (recette du 20 octobre, M-6) :
 * l'écran lisait la toute première date de la séance (date_seance_initiale), fausse après
 * plusieurs reports, ou la date actuelle, réécrite par l'approbation. Les demandes encore en cours
 * reprennent la séance telle qu'elle est (elle n'a pas bougé depuis) ; les anciennes restent vides.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("DemandeReports", "date_seance_origine", { type: DataTypes.DATEONLY, allowNull: true });
    await queryInterface.addColumn("DemandeReports", "id_creneau_origine", { type: DataTypes.INTEGER, allowNull: true, references: { model: "Creneaux", key: "id_creneau" }, onDelete: "SET NULL", onUpdate: "CASCADE" });
    await queryInterface.sequelize.query(
        `UPDATE DemandeReports d JOIN Affectations a ON a.id_affectation = d.id_affectation
         SET d.date_seance_origine = a.date_seance, d.id_creneau_origine = a.id_creneau
         WHERE d.statut_demande IN ('en_attente', 'a_confirmer')`
    );
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("DemandeReports", "id_creneau_origine");
    await queryInterface.removeColumn("DemandeReports", "date_seance_origine");
};
