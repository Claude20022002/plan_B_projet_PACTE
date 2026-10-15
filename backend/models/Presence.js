import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Présence d'un étudiant à une séance (I1) : par scan du QR ou cochée par l'enseignant. */
const Presence = sequelize.define(
    "Presence",
    {
        id_presence: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        source: { type: DataTypes.ENUM("qr", "manuel"), allowNull: false, defaultValue: "qr" },
        marque_le: { type: DataTypes.DATE, allowNull: false },
        // Empreinte de l'installation de l'application qui a scanné (un téléphone = un étudiant par séance)
        appareil: { type: DataTypes.STRING(64), allowNull: true },
        // Vu dans la salle lors d'une vérification surprise
        verifie_le: { type: DataTypes.DATE, allowNull: true },
        // Présent ou en retard (absent : pas de ligne) ; motif facultatif ; trace d'une correction à la main
        statut: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "present", validate: { isIn: [["present", "retard"]] } },
        motif: { type: DataTypes.STRING(200), allowNull: true },
        modifie_par: { type: DataTypes.INTEGER, allowNull: true },
        modifie_le: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "Presences", freezeTableName: true }
);

export default Presence;
