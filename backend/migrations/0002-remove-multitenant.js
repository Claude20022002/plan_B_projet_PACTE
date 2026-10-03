/**
 * Retrait du multi-tenant (décision du 2 octobre 2026 : une seule école, HESTIM).
 * Supprime les colonnes id_institution (avec leurs clés étrangères et index) puis
 * les tables Subscriptions, InstitutionUsers, Plans et Institutions.
 * Sans effet sur une base créée par la migration de référence (déjà sans multi-tenant).
 */
const TENANT_TABLES = ["Subscriptions", "InstitutionUsers", "Plans", "Institutions"];

export const up = async ({ sequelize }) => {
    const [columns] = await sequelize.query(
        `SELECT TABLE_NAME AS tableName FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'id_institution'
           AND TABLE_NAME NOT IN (:tenantTables)`,
        { replacements: { tenantTables: TENANT_TABLES } }
    );

    for (const { tableName } of columns) {
        const [foreignKeys] = await sequelize.query(
            `SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName
               AND COLUMN_NAME = 'id_institution' AND REFERENCED_TABLE_NAME IS NOT NULL`,
            { replacements: { tableName } }
        );
        for (const { name } of foreignKeys) {
            await sequelize.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${name}\``);
        }

        const [indexes] = await sequelize.query(
            `SELECT DISTINCT INDEX_NAME AS name FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName
               AND COLUMN_NAME = 'id_institution' AND INDEX_NAME <> 'PRIMARY'`,
            { replacements: { tableName } }
        );
        for (const { name } of indexes) {
            await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${name}\``);
        }

        await sequelize.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`id_institution\``);
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
        for (const table of TENANT_TABLES) {
            await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        }
    } finally {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }
};

export const down = async () => {
    throw new Error("Le retrait du multi-tenant est irréversible : restaurer une sauvegarde de la base.");
};
