/**
 * Envoi automatique de l'emploi du temps et abonnement calendrier (phase R4, remplace l'e-mail
 * avec le PDF du mois).
 *  - AbonnementsCalendrier : l'adresse secrète du flux ICS personnel (une par compte, renouvelable).
 *  - EnvoisEdt : le dernier emploi du temps envoyé à un groupe pour un mois (séances au moment de
 *    l'envoi) ; sert à ne renvoyer que s'il a changé, avec la liste des changements. Un mois n'est
 *    envoyé automatiquement qu'après une première publication par l'administration.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("AbonnementsCalendrier", {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        jeton: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable("EnvoisEdt", {
        id_envoi: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_groupe: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Groupes", key: "id_groupe" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        mois: { type: DataTypes.STRING(7), allowNull: false },
        seances: { type: DataTypes.JSON, allowNull: false },
        envoye_le: { type: DataTypes.DATE, allowNull: false },
        nb_destinataires: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        id_user_publication: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("EnvoisEdt", ["id_groupe", "mois"], { unique: true, name: "envois_edt_groupe_mois" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("EnvoisEdt");
    await queryInterface.dropTable("AbonnementsCalendrier");
};
