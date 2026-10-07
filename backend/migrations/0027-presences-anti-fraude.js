/**
 * Appel par QR code : anti-fraude (suite d'I1).
 *  - Presences.appareil : empreinte (SHA-256) de l'identifiant d'installation de l'application qui a
 *    scanné ; un même téléphone ne pointe qu'un seul étudiant par séance (index unique, les
 *    présences cochées à la main n'en ont pas).
 *  - Presences.verifie_le : l'étudiant a été vu dans la salle lors d'une vérification surprise.
 *  - SignalementsPresence : soupçons à examiner (téléphone partagé, absent à la vérification).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Presences", "appareil", { type: DataTypes.STRING(64), allowNull: true });
    await queryInterface.addColumn("Presences", "verifie_le", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addIndex("Presences", ["id_affectation", "appareil"], { unique: true, name: "presences_seance_appareil" });

    await queryInterface.createTable("SignalementsPresence", {
        id_signalement: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Affectations", key: "id_affectation" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        motif: { type: DataTypes.ENUM("appareil_partage", "absent_verification"), allowNull: false },
        // Pour un téléphone partagé : l'autre étudiant pointé avec le même téléphone
        id_user_lie: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        id_user_auteur: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("SignalementsPresence", ["id_affectation"]);
    await queryInterface.addIndex("SignalementsPresence", ["id_user"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("SignalementsPresence");
    await queryInterface.removeIndex("Presences", "presences_seance_appareil");
    await queryInterface.removeColumn("Presences", "verifie_le");
    await queryInterface.removeColumn("Presences", "appareil");
};
