import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Trace qu'un étudiant a répondu à un sondage, sans lien avec son choix ni date (lot EC-9, règle S-6). */
const SondageParticipation = sequelize.define(
    "SondageParticipation",
    {
        id_sondage: { type: DataTypes.INTEGER, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
    },
    { tableName: "SondagesParticipations", freezeTableName: true, timestamps: false }
);

export default SondageParticipation;
