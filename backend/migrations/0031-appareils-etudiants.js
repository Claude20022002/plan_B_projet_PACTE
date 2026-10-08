/**
 * Appel par QR code : un compte = un téléphone (anti-fraude, lot 2).
 *  - AppareilsEtudiants : le téléphone (empreinte SHA-256 de l'identifiant d'installation de
 *    l'application) lié à un compte étudiant à son premier scan. Un compte n'a qu'un téléphone,
 *    un téléphone n'a qu'un compte ; seule l'administration délie (changement de téléphone).
 *  - SignalementsPresence.motif : scan refusé depuis un autre téléphone que celui du compte
 *    (autre_telephone), ou depuis le téléphone lié au compte d'un autre étudiant
 *    (telephone_d_un_autre, id_user_lie = cet étudiant).
 */
const MOTIFS_AVANT = ["appareil_partage", "absent_verification"];
const MOTIFS = [...MOTIFS_AVANT, "autre_telephone", "telephone_d_un_autre"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("AppareilsEtudiants", {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        appareil: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        lie_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.changeColumn("SignalementsPresence", "motif", { type: DataTypes.ENUM(...MOTIFS), allowNull: false });
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.bulkDelete("SignalementsPresence", { motif: ["autre_telephone", "telephone_d_un_autre"] });
    await queryInterface.changeColumn("SignalementsPresence", "motif", { type: DataTypes.ENUM(...MOTIFS_AVANT), allowNull: false });
    await queryInterface.dropTable("AppareilsEtudiants");
};
