/**
 * Phase P2 — enseignements (composante × groupes, mutualisation).
 * - Enseignements et EnseignementGroupes.
 * - Affectations : id_enseignement ; id_salle devient facultative (séances en distanciel).
 * - Reprise : un enseignement par couple (cours, groupe) déjà planifié, auquel ses séances
 *   sont rattachées. La période reste vide : à préciser lors de la préparation du semestre.
 */
export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes, QueryTypes } = await import("sequelize");

    await queryInterface.createTable("Enseignements", {
        id_enseignement: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_composante: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "CoursComposantes", key: "id_composante" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_periode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Periodes", key: "id_periode" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        libelle: { type: DataTypes.STRING, allowNull: true },
        heures_prevues: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable("EnseignementGroupes", {
        id_enseignement: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Enseignements", key: "id_enseignement" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_groupe: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Groupes", key: "id_groupe" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.changeColumn("Affectations", "id_salle", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("Affectations", "id_enseignement", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Enseignements", key: "id_enseignement" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    const [couples] = await sequelize.query(
        `SELECT DISTINCT a.id_cours, a.id_groupe, c.id_composante, c.volume_heures
         FROM Affectations a
         JOIN CoursComposantes c ON c.id_cours = a.id_cours`
    );
    const now = new Date();
    for (const couple of couples) {
        // L'identifiant inséré est rendu par la requête elle-même (LAST_INSERT_ID dépend de la connexion du pool)
        const [id] = await sequelize.query(
            `INSERT INTO Enseignements (id_composante, heures_prevues, createdAt, updatedAt)
             VALUES (:composante, :heures, :now, :now)`,
            {
                type: QueryTypes.INSERT,
                replacements: { composante: couple.id_composante, heures: couple.volume_heures, now },
            }
        );
        await queryInterface.bulkInsert("EnseignementGroupes", [
            { id_enseignement: id, id_groupe: couple.id_groupe, createdAt: now, updatedAt: now },
        ]);
        await sequelize.query(
            "UPDATE Affectations SET id_enseignement = :id WHERE id_cours = :cours AND id_groupe = :groupe",
            { replacements: { id, cours: couple.id_cours, groupe: couple.id_groupe } }
        );
    }
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
