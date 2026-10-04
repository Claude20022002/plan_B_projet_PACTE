import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Surveillant affecté à une salle d'une épreuve. */
const Surveillance = sequelize.define(
    "Surveillance",
    {
        id_surveillance: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: { type: DataTypes.INTEGER, allowNull: false },
        id_salle: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "Surveillances", freezeTableName: true }
);

export default Surveillance;
