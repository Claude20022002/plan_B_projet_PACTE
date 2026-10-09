/**
 * Compteurs des limiteurs de débit de la connexion (middleware/rateLimiterMiddleware.js) : gardés
 * en base, ils survivent à un redémarrage du serveur (une attaque par force brute ne repart pas
 * de zéro) et seraient partagés entre plusieurs instances. Clé : limiteur et empreinte SHA-256 de
 * l'adresse ou du compte (aucune donnée personnelle en clair). Fin de fenêtre en millisecondes
 * depuis l'époque Unix (aucun fuseau horaire en jeu). Les lignes expirées sont purgées chaque jour.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("CompteursDebit", {
        cle: { type: DataTypes.STRING(100), primaryKey: true },
        compteur: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        expire_ms: { type: DataTypes.BIGINT, allowNull: false },
    });
    await queryInterface.addIndex("CompteursDebit", ["expire_ms"], { name: "compteurs_debit_expire" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("CompteursDebit");
};
