import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SQL_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "sql", "0001-baseline.sql");

const hasColumn = async (queryInterface, table, column) => {
    const columns = await queryInterface.describeTable(table).catch(() => null);
    return Boolean(columns?.[column]);
};

/**
 * Schéma de référence au 3 octobre 2026 (DDL exporté de MySQL, sans multi-tenant).
 *
 * - Base vide : crée les 21 tables.
 * - Base existante (créée par l'ancien sync() du serveur) : CREATE TABLE IF NOT EXISTS
 *   ne touche pas aux tables présentes ; on ajoute seulement les colonnes que l'ancien
 *   démarrage ajoutait à la main (Notifications.lien, colonnes de génération).
 */
export const up = async ({ sequelize, queryInterface }) => {
    const statements = fs
        .readFileSync(SQL_FILE, "utf8")
        .split(/;\s*\n/)
        .map((sql) => sql.trim())
        .filter(Boolean);

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
        for (const sql of statements) {
            await sequelize.query(sql);
        }
    } finally {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    const { DataTypes } = await import("sequelize");
    const catchUp = [
        ["Notifications", "lien", { type: DataTypes.STRING(500), allowNull: true }],
        ["Affectations", "id_snapshot", { type: DataTypes.INTEGER, allowNull: true }],
        ["Affectations", "id_generation_session", { type: DataTypes.INTEGER, allowNull: true }],
        ["Affectations", "is_generated", { type: DataTypes.BOOLEAN, defaultValue: false }],
        ["Affectations", "score_contrib", { type: DataTypes.FLOAT, allowNull: true }],
    ];
    for (const [table, column, definition] of catchUp) {
        if (!(await hasColumn(queryInterface, table, column))) {
            await queryInterface.addColumn(table, column, definition);
        }
    }
};

export const down = async () => {
    throw new Error("La migration de référence est irréversible : restaurer une sauvegarde de la base.");
};
