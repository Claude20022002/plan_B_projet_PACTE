import { CAMPUS_HESTIM, campusCodeFromBatiment } from "../utils/campus.js";
import { normaliserTypeSalle } from "../config/referentiel.js";

/**
 * Phase P1 — campus et salles.
 * - Tables Campus (Gandhi, Stendhal) et TrajetsCampus (temps entre deux campus).
 * - Salles.batiment (texte libre) devient Salles.id_campus : chaque valeur existante est
 *   rattachée à Gandhi, à Stendhal, ou à un campus créé pour elle (aucune salle perdue).
 * - Salles.equipements passe de texte libre à une liste JSON ; ajout de capacite_examen
 *   et reservable_par ; types de salle ramenés à la liste fermée.
 */

const parseEquipements = (valeur) => {
    if (valeur === null || valeur === undefined || valeur === "") return [];
    try {
        const parsed = JSON.parse(valeur);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
        // texte libre : séparé par virgules ou points-virgules
    }
    return String(valeur).split(/[,;]/).map((item) => item.trim()).filter(Boolean);
};

export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.createTable("Campus", {
        id_campus: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
        nom: { type: DataTypes.STRING(100), allowNull: false },
        adresse: { type: DataTypes.STRING(255), allowNull: true },
        actif: { type: DataTypes.BOOLEAN, defaultValue: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable("TrajetsCampus", {
        id_trajet: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_campus_a: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Campus", key: "id_campus" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_campus_b: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Campus", key: "id_campus" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        minutes: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("TrajetsCampus", ["id_campus_a", "id_campus_b"], { unique: true });

    const now = new Date();
    const campusParCode = new Map();
    const creerCampus = async ({ code, nom, adresse = null }) => {
        await queryInterface.bulkInsert("Campus", [{ code, nom, adresse, actif: true, createdAt: now, updatedAt: now }]);
        const [[row]] = await sequelize.query("SELECT id_campus FROM Campus WHERE code = :code", { replacements: { code } });
        campusParCode.set(code, row.id_campus);
        return row.id_campus;
    };
    for (const campus of CAMPUS_HESTIM) {
        await creerCampus(campus);
    }

    // ── Salles.batiment → Salles.id_campus ────────────────────────────────
    await queryInterface.addColumn("Salles", "id_campus", { type: DataTypes.INTEGER, allowNull: true });
    const [batiments] = await sequelize.query("SELECT DISTINCT batiment FROM Salles");
    for (const { batiment } of batiments) {
        const code = campusCodeFromBatiment(batiment);
        const idCampus = campusParCode.get(code) ?? (await creerCampus({ code, nom: String(batiment).trim() || code }));
        await sequelize.query("UPDATE Salles SET id_campus = :idCampus WHERE batiment <=> :batiment", {
            replacements: { idCampus, batiment },
        });
    }
    await queryInterface.changeColumn("Salles", "id_campus", { type: DataTypes.INTEGER, allowNull: false });
    await queryInterface.addConstraint("Salles", {
        fields: ["id_campus"],
        type: "foreign key",
        name: "Salles_id_campus_fk",
        references: { table: "Campus", field: "id_campus" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
    });
    await queryInterface.removeColumn("Salles", "batiment");

    // ── Équipements : texte libre → liste JSON ────────────────────────────
    await queryInterface.addColumn("Salles", "equipements_json", { type: DataTypes.JSON, allowNull: true });
    const [salles] = await sequelize.query("SELECT id_salle, equipements, type_salle FROM Salles");
    for (const salle of salles) {
        await sequelize.query(
            "UPDATE Salles SET equipements_json = :equipements, type_salle = :type WHERE id_salle = :id",
            {
                replacements: {
                    equipements: JSON.stringify(parseEquipements(salle.equipements)),
                    type: normaliserTypeSalle(salle.type_salle),
                    id: salle.id_salle,
                },
            }
        );
    }
    await queryInterface.removeColumn("Salles", "equipements");
    await queryInterface.renameColumn("Salles", "equipements_json", "equipements");

    await queryInterface.addColumn("Salles", "capacite_examen", { type: DataTypes.INTEGER, allowNull: true });
    await sequelize.query("UPDATE Salles SET capacite_examen = FLOOR(capacite / 2)");

    await queryInterface.addColumn("Salles", "reservable_par", {
        type: DataTypes.ENUM("admin", "enseignants"),
        allowNull: false,
        defaultValue: "admin",
    });
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
