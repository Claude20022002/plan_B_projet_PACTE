/**
 * Visa de l'administration sur une séance réalisée (docs/plans/remarques-par-profil.md, lot R-11).
 * Une séance passée est comptée réalisée d'office, même si le cours n'a pas eu lieu : avant
 * l'export de la paie des vacataires, l'administration confirme ou écarte les séances sans appel
 * validé. Une ligne par séance décidée ; pas de ligne = pas de décision.
 *  - decision : « confirmee » (le cours a eu lieu) ou « ecartee » (il ne compte pas) ;
 *  - motif : facultatif, pour garder la raison d'une séance écartée ;
 *  - id_user_admin et updatedAt : qui a décidé, et quand.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("VisasSeance", {
        id_affectation: { type: DataTypes.INTEGER, primaryKey: true, references: { model: "Affectations", key: "id_affectation" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        decision: { type: DataTypes.STRING(20), allowNull: false },
        motif: { type: DataTypes.STRING(255), allowNull: true },
        id_user_admin: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("VisasSeance");
};
