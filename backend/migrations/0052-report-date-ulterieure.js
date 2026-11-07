/**
 * Report « à une date ultérieure » (retours du 21 octobre 2026, lot R-1) : l'administration accepte un
 * report sans fixer de date. La séance passe « à reprogrammer » (elle libère sa salle et son créneau),
 * la demande aussi ; l'administration fixe la date plus tard, puis l'enseignant confirme comme pour
 * tout report. Retour arrière : une séance à reprogrammer redevient planifiée à sa date d'origine.
 */
const SEANCES = ["planifie", "confirme", "annule", "reporte", "realise"];
const DEMANDES = ["en_attente", "a_confirmer", "approuve", "refuse"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.changeColumn("Affectations", "statut", { type: DataTypes.ENUM(...SEANCES, "a_reprogrammer"), defaultValue: "planifie" });
    await queryInterface.changeColumn("DemandeReports", "statut_demande", { type: DataTypes.ENUM(...DEMANDES, "a_reprogrammer"), defaultValue: "en_attente" });
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.sequelize.query("UPDATE Affectations SET statut = 'planifie' WHERE statut = 'a_reprogrammer'");
    await queryInterface.sequelize.query("UPDATE DemandeReports SET statut_demande = 'en_attente' WHERE statut_demande = 'a_reprogrammer'");
    await queryInterface.changeColumn("DemandeReports", "statut_demande", { type: DataTypes.ENUM(...DEMANDES), defaultValue: "en_attente" });
    await queryInterface.changeColumn("Affectations", "statut", { type: DataTypes.ENUM(...SEANCES), defaultValue: "planifie" });
};
