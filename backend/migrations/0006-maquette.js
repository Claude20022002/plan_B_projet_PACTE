import { normaliserTypeComposante } from "../config/referentiel.js";

/**
 * Phase P2 — offre de formation (maquette).
 * - Filiere : école, cycle, intitulé du cycle et année où il commence, campus préféré,
 *   partenaire de double diplôme, nombre d'années suivies à HESTIM.
 * - Cours : ECTS et enseignant responsable.
 * - CoursComposantes : CM / TD / TP / Projet avec volume, groupe concerné, salle requise,
 *   créneaux par séance, modalité (présentiel / distanciel) et rythme. Chaque cours
 *   existant reçoit une composante reprise de type_cours et volume_horaire.
 * - Evenements : plage horaire facultative (activités d'une demi-journée).
 */
export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("Filiere", "ecole", {
        type: DataTypes.ENUM("engineering", "business"),
        allowNull: false,
        defaultValue: "engineering",
    });
    await queryInterface.addColumn("Filiere", "cycle", {
        type: DataTypes.ENUM("prepa", "licence", "ingenieur", "master", "executive"),
        allowNull: true,
    });
    await queryInterface.addColumn("Filiere", "intitule_cycle", { type: DataTypes.STRING, allowNull: true });
    await queryInterface.addColumn("Filiere", "premiere_annee_cycle", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("Filiere", "id_campus_prefere", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Campus", key: "id_campus" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Filiere", "partenaire", { type: DataTypes.STRING, allowNull: true });
    await queryInterface.addColumn("Filiere", "annees_a_hestim", { type: DataTypes.INTEGER, allowNull: true });

    await queryInterface.addColumn("Cours", "ects", { type: DataTypes.DECIMAL(4, 1), allowNull: true });
    await queryInterface.addColumn("Cours", "id_responsable", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id_user" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    await queryInterface.createTable("CoursComposantes", {
        id_composante: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_cours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Cours", key: "id_cours" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        type: { type: DataTypes.ENUM("CM", "TD", "TP", "Projet"), allowNull: false },
        volume_heures: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
        type_salle_requis: { type: DataTypes.STRING, allowNull: true },
        equipements_requis: { type: DataTypes.JSON, allowNull: true },
        niveau_groupe: { type: DataTypes.ENUM("promotion", "td", "tp"), allowNull: false, defaultValue: "promotion" },
        creneaux_par_seance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        modalite: {
            type: DataTypes.ENUM("presentiel", "distanciel", "hybride"),
            allowNull: false,
            defaultValue: "presentiel",
        },
        mention: { type: DataTypes.STRING, allowNull: true },
        semaine_debut: { type: DataTypes.INTEGER, allowNull: true },
        semaine_fin: { type: DataTypes.INTEGER, allowNull: true },
        seances_par_semaine: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("CoursComposantes", ["id_cours", "type"], { unique: true });

    // Reprise : une composante par cours existant. Les séances existantes étant faites par
    // groupe (pas en promotion entière), la composante reprise vise le niveau « td ».
    const [cours] = await sequelize.query("SELECT id_cours, type_cours, volume_horaire FROM Cours");
    const now = new Date();
    if (cours.length) {
        await queryInterface.bulkInsert(
            "CoursComposantes",
            cours.map((c) => ({
                id_cours: c.id_cours,
                type: normaliserTypeComposante(c.type_cours),
                volume_heures: c.volume_horaire,
                equipements_requis: JSON.stringify([]),
                niveau_groupe: "td",
                creneaux_par_seance: 2,
                modalite: "presentiel",
                createdAt: now,
                updatedAt: now,
            }))
        );
    }

    await queryInterface.addColumn("Evenements", "heure_debut", { type: DataTypes.TIME, allowNull: true });
    await queryInterface.addColumn("Evenements", "heure_fin", { type: DataTypes.TIME, allowNull: true });
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
