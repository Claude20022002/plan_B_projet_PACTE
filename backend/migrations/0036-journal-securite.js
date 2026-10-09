/**
 * Journal de sécurité (OWASP A09, ASVS V7) : connexions, double authentification, mots de passe,
 * sessions et comptes. En écriture seule pour l'application. Sans clé étrangère vers Users : la
 * trace d'un compte survit à sa suppression (l'email est conservé avec l'événement).
 * Sert aussi à limiter les codes de double authentification faux par compte (services/mfa.js).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("JournalSecurite", {
        id_evenement: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        evenement: { type: DataTypes.STRING(40), allowNull: false },
        // Compte concerné, et qui a agi s'il s'agit d'un autre (administrateur)
        id_user: { type: DataTypes.INTEGER, allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        id_acteur: { type: DataTypes.INTEGER, allowNull: true },
        ip: { type: DataTypes.STRING(45), allowNull: true },
        user_agent: { type: DataTypes.STRING(255), allowNull: true },
        details: { type: DataTypes.JSON, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    // Échecs récents d'un compte (limite de la double authentification), historique d'un compte
    await queryInterface.addIndex("JournalSecurite", ["id_user", "evenement", "createdAt"], { name: "journal_securite_user_evenement" });
    // Consultation par type d'événement et par date (administration)
    await queryInterface.addIndex("JournalSecurite", ["evenement", "createdAt"], { name: "journal_securite_evenement" });
    await queryInterface.addIndex("JournalSecurite", ["createdAt"], { name: "journal_securite_date" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("JournalSecurite");
};
