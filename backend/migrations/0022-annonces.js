/**
 * Annonces ciblées (phase R1, remplace les e-mails d'information) : l'administration, un
 * responsable de filière ou un enseignant écrit à une portée (même modèle que les événements :
 * établissement, campus, filière, niveau d'une filière ou groupe).
 *  - Annonces : le message, sa portée, son public (étudiants, enseignants ou les deux).
 *  - AnnoncesDestinataires : la liste figée à l'envoi, avec la date de lecture (accusé de lecture,
 *    relance des non-lus).
 *  - AnnoncesPiecesJointes : un PDF ou une image (5 Mo au plus), à part pour ne jamais le charger
 *    avec la liste des annonces.
 */
const PORTEES = ["etablissement", "campus", "filiere", "niveau", "groupe"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const versAnnonce = {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Annonces", key: "id_annonce" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    };

    await queryInterface.createTable("Annonces", {
        id_annonce: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        corps: { type: DataTypes.TEXT, allowNull: false },
        portee: { type: DataTypes.ENUM(...PORTEES), allowNull: false, defaultValue: "etablissement" },
        id_cible: { type: DataTypes.INTEGER, allowNull: true },
        niveau: { type: DataTypes.STRING(50), allowNull: true },
        public: { type: DataTypes.ENUM("etudiants", "enseignants", "tous"), allowNull: false, defaultValue: "etudiants" },
        envoyer_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        id_user_auteur: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        relancee_le: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Annonces", ["id_user_auteur"]);

    await queryInterface.createTable("AnnoncesDestinataires", {
        id_annonce: { ...versAnnonce, primaryKey: true },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        lu_le: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex("AnnoncesDestinataires", ["id_user"]);

    await queryInterface.createTable("AnnoncesPiecesJointes", {
        id_annonce: { ...versAnnonce, primaryKey: true },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        contenu: { type: DataTypes.BLOB("medium"), allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("AnnoncesPiecesJointes");
    await queryInterface.dropTable("AnnoncesDestinataires");
    await queryInterface.dropTable("Annonces");
};
