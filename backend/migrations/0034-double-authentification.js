/**
 * Double authentification (TOTP, application d'authentification) : obligatoire pour
 * l'administration, possible pour les enseignants.
 *  - Users.mfa_secret : secret TOTP chiffré (AES-256-GCM) ; posé dès l'inscription, actif après
 *    confirmation d'un premier code (mfa_active) ; mfa_dernier_pas : dernier pas de 30 s utilisé
 *    (un code ne sert qu'une fois).
 *  - MfaCodesSecours : 10 codes de secours à usage unique (empreintes SHA-256).
 *  - MfaDefis : connexion en deux temps : après le mot de passe, un défi de 5 minutes (5 essais)
 *    attend le code ; la session n'est ouverte qu'avec lui.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Users", "mfa_secret", { type: DataTypes.STRING(255), allowNull: true });
    await queryInterface.addColumn("Users", "mfa_active", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn("Users", "mfa_dernier_pas", { type: DataTypes.BIGINT, allowNull: true });

    const utilisateur = { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    await queryInterface.createTable("MfaCodesSecours", {
        id_code: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: utilisateur,
        code_hash: { type: DataTypes.STRING(64), allowNull: false },
        utilise_le: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("MfaCodesSecours", ["id_user"]);

    await queryInterface.createTable("MfaDefis", {
        defi_hash: { type: DataTypes.STRING(64), primaryKey: true },
        id_user: utilisateur,
        mobile: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        essais: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        expire_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("MfaDefis");
    await queryInterface.dropTable("MfaCodesSecours");
    await queryInterface.removeColumn("Users", "mfa_dernier_pas");
    await queryInterface.removeColumn("Users", "mfa_active");
    await queryInterface.removeColumn("Users", "mfa_secret");
};
