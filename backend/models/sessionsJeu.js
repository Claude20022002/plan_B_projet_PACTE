import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Modèles des sessions de jeu (migration 0045), réunis ici pour ne pas allonger
 * models/index.js, qui les réexporte avec leurs relations.
 */

const options = (tableName) => ({ tableName, freezeTableName: true });

/** Un jeu lancé par un enseignant pour un module, rejoint par QR code ou par code. */
export const SessionJeu = sequelize.define(
    "SessionJeu",
    {
        id_session_jeu: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        // « individuel » : chacun joue sur son téléphone ; « collectif » : la classe joue au tableau
        mode: { type: DataTypes.STRING(12), allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
        statut: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "ouverte" },
        // Mode collectif : défi projeté, commandes jouées depuis son début, objectif atteint
        id_defi: { type: DataTypes.STRING(80), allowNull: true },
        commandes: { type: DataTypes.JSON, allowNull: true },
        reussi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    options("SessionsJeu")
);

/** Un étudiant qui a rejoint une session. */
export const ParticipationJeu = sequelize.define(
    "ParticipationJeu",
    {
        id_participation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session_jeu: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
    },
    options("ParticipationsJeu")
);

/** Mode collectif : réponse proposée par un étudiant (« attente », « choisie » ou « ecartee »). */
export const PropositionJeu = sequelize.define(
    "PropositionJeu",
    {
        id_proposition: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session_jeu: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        id_defi: { type: DataTypes.STRING(80), allowNull: false },
        texte: { type: DataTypes.STRING(300), allowNull: false },
        statut: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "attente" },
    },
    options("PropositionsJeu")
);

export const relierSessionsJeu = ({ Users, Cours }) => {
    SessionJeu.belongsTo(Cours, { foreignKey: "id_cours", as: "cours" });
    SessionJeu.hasMany(ParticipationJeu, { foreignKey: "id_session_jeu", as: "participations", onDelete: "CASCADE" });
    SessionJeu.hasMany(PropositionJeu, { foreignKey: "id_session_jeu", as: "propositions", onDelete: "CASCADE" });
    ParticipationJeu.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
    PropositionJeu.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
};
