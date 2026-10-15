"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.ensureDatabaseExists = ensureDatabaseExists;
const promise_1 = require("mysql2/promise");
exports.databaseConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    username: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'jeux_hestim',
};
async function ensureDatabaseExists() {
    const connection = await (0, promise_1.createConnection)({
        host: exports.databaseConfig.host,
        port: exports.databaseConfig.port,
        user: exports.databaseConfig.username,
        password: exports.databaseConfig.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${exports.databaseConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
}
//# sourceMappingURL=database.js.map