/**
 * BaseModel.js - Senior Software Engineer
 * Base class for all Oracle models in Reactik V2 module.
 */
const oracledb = require('oracledb');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    /**
     * Executes SQL query with bind parameters.
     */
    async execute(query, params = {}, options = {}) {
        let connection;
        try {
            connection = await oracledb.getConnection();
            const result = await connection.execute(query, params, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: options.autoCommit || false
            });
            return result;
        } catch (err) {
            console.error(`DB Error in ${this.tableName}:`, err);
            throw err;
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error("Error closing connection:", err);
                }
            }
        }
    }
}

module.exports = BaseModel;
