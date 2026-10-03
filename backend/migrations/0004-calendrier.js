/**
 * Phase P1 — calendrier académique et paramètres de planification.
 * - Années universitaires et périodes (S1, S2).
 * - Événements : portée (établissement, campus, filière, niveau, groupe), date à confirmer
 *   (fêtes lunaires), nouveaux types « ramadan » et « stage ».
 * - ParametresPlanning : valeurs modifiées par l'administration (défauts dans le code).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.createTable("AnneesUniversitaires", {
        id_annee: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        libelle: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        date_debut: { type: DataTypes.DATEONLY, allowNull: false },
        date_fin: { type: DataTypes.DATEONLY, allowNull: false },
        active: { type: DataTypes.BOOLEAN, defaultValue: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable("Periodes", {
        id_periode: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_annee: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "AnneesUniversitaires", key: "id_annee" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        code: { type: DataTypes.ENUM("S1", "S2"), allowNull: false },
        libelle: { type: DataTypes.STRING(100), allowNull: true },
        date_debut: { type: DataTypes.DATEONLY, allowNull: false },
        date_fin: { type: DataTypes.DATEONLY, allowNull: false },
        nb_semaines: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Periodes", ["id_annee", "code"], { unique: true });

    await queryInterface.changeColumn("Evenements", "type_evenement", {
        type: DataTypes.ENUM("vacances", "examen", "ferie", "reunion", "formation", "ramadan", "stage", "autre"),
        defaultValue: "autre",
    });
    await queryInterface.addColumn("Evenements", "portee", {
        type: DataTypes.ENUM("etablissement", "campus", "filiere", "niveau", "groupe"),
        allowNull: false,
        defaultValue: "etablissement",
    });
    await queryInterface.addColumn("Evenements", "id_cible", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("Evenements", "niveau", { type: DataTypes.STRING, allowNull: true });
    await queryInterface.addColumn("Evenements", "date_confirmee", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    });
    await queryInterface.addIndex("Evenements", ["date_debut", "date_fin"]);

    await queryInterface.createTable("ParametresPlanning", {
        cle: { type: DataTypes.STRING(64), primaryKey: true },
        valeur: { type: DataTypes.JSON, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
