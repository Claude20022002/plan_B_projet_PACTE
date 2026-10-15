/**
 * Espace de cours d'une classe (docs/plans/espace-de-cours.md, lot E-2). Une classe est le couple
 * (module, groupe) ; elle n'a pas de table. Ses supports sont rangés en sections :
 *  - SectionsCours : titre, ordre, visible ; une section « Général » est créée au premier ajout ;
 *  - SupportsCours : un document de StudyLib (id_document, jamais le fichier lui-même) ou un lien.
 *    type_mime et taille recopient ceux du document pour lister sans appeler StudyLib ;
 *    dans_bibliotheque : le document est aussi publié pour toute l'école.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const utilisateur = (allowNull) => ({ type: DataTypes.INTEGER, allowNull, references: { model: "Users", key: "id_user" }, onDelete: allowNull ? "SET NULL" : "CASCADE", onUpdate: "CASCADE" });
    const dates = { createdAt: { type: DataTypes.DATE, allowNull: false }, updatedAt: { type: DataTypes.DATE, allowNull: false } };

    await queryInterface.createTable("SectionsCours", {
        id_section: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_cours: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Cours", key: "id_cours" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        id_groupe: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Groupes", key: "id_groupe" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        titre: { type: DataTypes.STRING(120), allowNull: false },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        id_user_auteur: utilisateur(true),
        ...dates,
    });
    await queryInterface.addIndex("SectionsCours", ["id_cours", "id_groupe", "ordre"]);

    await queryInterface.createTable("SupportsCours", {
        id_support: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_section: { type: DataTypes.INTEGER, allowNull: false, references: { model: "SectionsCours", key: "id_section" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        type: { type: DataTypes.STRING(10), allowNull: false },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        id_document: { type: DataTypes.CHAR(36), allowNull: true },
        url: { type: DataTypes.STRING(2048), allowNull: true },
        type_mime: { type: DataTypes.STRING(120), allowNull: true },
        taille: { type: DataTypes.INTEGER, allowNull: true },
        dans_bibliotheque: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        id_user_auteur: utilisateur(true),
        ...dates,
    });
    await queryInterface.addIndex("SupportsCours", ["id_section", "ordre"]);
    await queryInterface.addIndex("SupportsCours", ["id_document"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("SupportsCours");
    await queryInterface.dropTable("SectionsCours");
};
