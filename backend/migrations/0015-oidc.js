/**
 * Phase Q — Planner fournisseur OpenID Connect (oidc-provider) pour ClassQuiz.
 * OidcPayloads : stockage des objets du fournisseur (sessions, interactions, codes,
 * jetons, autorisations), un enregistrement par (modèle, identifiant), avec expiration.
 * Remplace l'adaptateur en mémoire, perdu à chaque redémarrage du backend.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("OidcPayloads", {
        id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
        model: { type: DataTypes.STRING(40), allowNull: false, primaryKey: true },
        payload: { type: DataTypes.JSON, allowNull: false },
        grant_id: { type: DataTypes.STRING(255), allowNull: true },
        user_code: { type: DataTypes.STRING(255), allowNull: true },
        uid: { type: DataTypes.STRING(255), allowNull: true },
        expires_at: { type: DataTypes.DATE, allowNull: true },
        consumed_at: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("OidcPayloads", ["grant_id"]);
    await queryInterface.addIndex("OidcPayloads", ["uid"]);
    await queryInterface.addIndex("OidcPayloads", ["expires_at"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("OidcPayloads");
};
