/**
 * Demandes de changement de téléphone (docs/plans/remarques-par-profil.md, lot R-10). Un compte
 * étudiant est lié à un seul téléphone pour l'appel ; quand il en change, l'étudiant déclare le
 * nouveau depuis l'application et l'administration accepte ou refuse. Une ligne par demande, gardée
 * après décision : la trace reste, pour que la protection contre la fraude reste entière.
 *  - appareil : empreinte du nouveau téléphone (jamais l'identifiant lui-même) ;
 *  - statut : « en_attente », « acceptee » ou « refusee » ;
 *  - id_user_admin et decidee_le : qui a décidé, et quand.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("DemandesTelephone", {
        id_demande: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        appareil: { type: DataTypes.STRING(64), allowNull: false },
        motif: { type: DataTypes.STRING(255), allowNull: true },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_attente" },
        id_user_admin: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        decidee_le: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("DemandesTelephone", ["statut", "createdAt"]);
    await queryInterface.addIndex("DemandesTelephone", ["id_user", "statut"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("DemandesTelephone");
};
