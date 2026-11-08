/**
 * Sondage de l'enseignant à sa classe (plan multi-établissements, fichier 14, lot EC-9 ;
 * conception-ec9-groupe-b.md). Une question, 2 à 6 choix, une réponse par étudiant, anonyme :
 *  - ConfigurationEtablissement.sondages_actifs : interrupteur de l'école (D-04), éteint pour toutes
 *    les bases, HESTIM compris (règle du fichier 14 : rien n'est allumé par le plan) ;
 *  - Sondages : la question d'une classe (module, groupe), date de fin facultative, clôture ;
 *  - SondagesChoix : les choix et leur compteur de réponses ;
 *  - SondagesParticipations : qui a répondu, sans dire quoi, sans date ni ordre (règle S-6).
 * Retour arrière : les trois tables et la colonne sont retirées.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const cascade = (model, key) => ({ references: { model, key }, onDelete: "CASCADE", onUpdate: "CASCADE" });

    await queryInterface.addColumn("ConfigurationEtablissement", "sondages_actifs", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

    await queryInterface.createTable("Sondages", {
        id_sondage: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_cours: { type: DataTypes.INTEGER, allowNull: false, ...cascade("Cours", "id_cours") },
        id_groupe: { type: DataTypes.INTEGER, allowNull: false, ...cascade("Groupes", "id_groupe") },
        question: { type: DataTypes.STRING(300), allowNull: false },
        ferme_le: { type: DataTypes.DATEONLY, allowNull: true },
        clos_le: { type: DataTypes.DATE, allowNull: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Sondages", ["id_cours", "id_groupe"]);

    await queryInterface.createTable("SondagesChoix", {
        id_choix: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_sondage: { type: DataTypes.INTEGER, allowNull: false, ...cascade("Sondages", "id_sondage") },
        rang: { type: DataTypes.TINYINT, allowNull: false },
        libelle: { type: DataTypes.STRING(100), allowNull: false },
        reponses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    });
    await queryInterface.addIndex("SondagesChoix", ["id_sondage", "rang"]);

    await queryInterface.createTable("SondagesParticipations", {
        id_sondage: { type: DataTypes.INTEGER, primaryKey: true, ...cascade("Sondages", "id_sondage") },
        id_user: { type: DataTypes.INTEGER, primaryKey: true, ...cascade("Users", "id_user") },
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("SondagesParticipations");
    await queryInterface.dropTable("SondagesChoix");
    await queryInterface.dropTable("Sondages");
    await queryInterface.removeColumn("ConfigurationEtablissement", "sondages_actifs");
};
