/**
 * Phase P3 — enseignants et services.
 * - Enseignants : statut (permanent / vacataire), service annuel, maximum hebdomadaire,
 *   campus préféré, entreprise d'origine.
 * - Disponibilites : vœu non bloquant (préféré / à éviter).
 * - CompetencesEnseignants, EnseignementEnseignants (co-enseignement), ResponsablesFilieres.
 * - Reprise : chaque enseignant qui assure déjà des séances devient l'enseignant principal
 *   (service accepté) de l'enseignement correspondant, et compétent sur le module.
 */
export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("Enseignants", "statut", {
        type: DataTypes.ENUM("permanent", "vacataire"),
        allowNull: false,
        defaultValue: "permanent",
    });
    await queryInterface.addColumn("Enseignants", "service_annuel_heures", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("Enseignants", "max_heures_semaine", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("Enseignants", "id_campus_prefere", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Campus", key: "id_campus" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Enseignants", "entreprise", { type: DataTypes.STRING, allowNull: true });

    await queryInterface.addColumn("Disponibilites", "preference", {
        type: DataTypes.ENUM("neutre", "prefere", "eviter"),
        allowNull: false,
        defaultValue: "neutre",
    });

    const horodatage = {
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    };
    const versUser = {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "Users", key: "id_user" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    };

    await queryInterface.createTable("CompetencesEnseignants", {
        id_user: versUser,
        id_cours: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Cours", key: "id_cours" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        ...horodatage,
    });

    await queryInterface.createTable("EnseignementEnseignants", {
        id_enseignement: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Enseignements", key: "id_enseignement" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user: versUser,
        role: { type: DataTypes.ENUM("principal", "co_enseignant"), allowNull: false, defaultValue: "principal" },
        statut_service: { type: DataTypes.ENUM("propose", "accepte", "refuse"), allowNull: false, defaultValue: "propose" },
        heures: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
        motif_refus: { type: DataTypes.STRING, allowNull: true },
        ...horodatage,
    });
    await queryInterface.addIndex("EnseignementEnseignants", ["id_user", "statut_service"]);

    await queryInterface.createTable("ResponsablesFilieres", {
        id_user: versUser,
        id_filiere: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Filiere", key: "id_filiere" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        ...horodatage,
    });

    // Reprise depuis les séances déjà planifiées
    const now = new Date();
    const [services] = await sequelize.query(
        `SELECT DISTINCT id_enseignement, id_user_enseignant AS id_user
         FROM Affectations WHERE id_enseignement IS NOT NULL`
    );
    const parEnseignement = new Map();
    for (const { id_enseignement, id_user } of services) {
        if (!parEnseignement.has(id_enseignement)) parEnseignement.set(id_enseignement, []);
        parEnseignement.get(id_enseignement).push(id_user);
    }
    const lignes = [...parEnseignement.entries()].flatMap(([idEnseignement, enseignants]) =>
        enseignants.map((idUser, index) => ({
            id_enseignement: idEnseignement,
            id_user: idUser,
            // Plusieurs enseignants sur les mêmes séances : le premier est principal, les autres co-enseignants
            role: index === 0 ? "principal" : "co_enseignant",
            statut_service: "accepte",
            createdAt: now,
            updatedAt: now,
        }))
    );
    if (lignes.length) await queryInterface.bulkInsert("EnseignementEnseignants", lignes);

    const [competences] = await sequelize.query(
        "SELECT DISTINCT id_user_enseignant AS id_user, id_cours FROM Affectations"
    );
    if (competences.length) {
        await queryInterface.bulkInsert(
            "CompetencesEnseignants",
            competences.map((c) => ({ ...c, createdAt: now, updatedAt: now }))
        );
    }
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
