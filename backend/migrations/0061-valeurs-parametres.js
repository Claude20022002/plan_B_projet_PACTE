/**
 * Valeurs du moteur de planification, versionnées et datées (lot MP-1, D-07 ; fichier 04).
 * Une version appliquée n'est jamais modifiée (I-D5) : on en crée une autre. Une seule table de
 * valeurs, avec sa portée : une règle est un paramètre comme un autre.
 *
 * Une base qui a déjà des comptes (celle de l'école d'origine) reçoit une version initiale datée du
 * jour : profil université, et ses réglages modifiés dans ParametresPlanning, convertis aux unités
 * du catalogue. Une installation neuve part sans aucune ligne. Rien ne lit encore ces tables pour
 * générer : ParametresPlanning reste la source de la génération jusqu'au lot MP-5.
 */

// Figée ici : une migration ne dépend pas d'un fichier qui évoluera (voir services/moteur/valeurs/anciensParametres.js)
const CONVERSIONS = {
    max_heures_jour_groupe: ["HOR.REGLE.MAX_H_JOUR_GROUPE", (v) => v * 60],
    max_heures_jour_enseignant: ["ENS.CHARGE.MAX_H_JOUR", (v) => v * 60],
    duree_seance_defaut_minutes: ["MAT.VOL.DUREE_REC", (v) => v],
    ratio_capacite_examen: ["EXA.EPREUVE.RATIO_CAPACITE", (v) => Math.round(v * 100)],
    surveillants_par_salle: ["EXA.EPREUVE.SURVEILLANTS_PAR_SALLE", (v) => v],
    trajet_inter_campus_defaut_minutes: ["LOG.TRAJET.CAMPUS_DEFAUT", (v) => v],
};

const lireJson = (v) => (typeof v === "string" ? JSON.parse(v) : v);

const versionInitiale = async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const [[{ comptes }]] = await sequelize.query("SELECT COUNT(*) AS comptes FROM Users");
    if (!Number(comptes)) return;

    const maintenant = new Date();
    await queryInterface.bulkInsert("VersionsParametres", [
        { libelle: "Version initiale : réglages existants", date_effet: maintenant.toISOString().slice(0, 10), statut: "appliquee", appliquee_le: maintenant, createdAt: maintenant, updatedAt: maintenant },
    ]);
    const [[{ id }]] = await sequelize.query("SELECT MAX(id_version) AS id FROM VersionsParametres");
    const [anciens] = await sequelize.query("SELECT cle, valeur FROM ParametresPlanning");
    const convertis = anciens.filter((a) => CONVERSIONS[a.cle]).map((a) => [CONVERSIONS[a.cle][0], CONVERSIONS[a.cle][1](lireJson(a.valeur))]);
    const lignes = [["ETA.ID.PROFIL", "universite"], ...convertis].map(([cle, valeur]) => ({ id_version: id, cle, portee: "etablissement", id_portee: "", valeur: JSON.stringify(valeur), retiree: false }));
    await queryInterface.bulkInsert("ValeursParametres", lignes);
};

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("VersionsParametres", {
        id_version: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        libelle: { type: DataTypes.STRING(200), allowNull: true },
        date_effet: { type: DataTypes.DATEONLY, allowNull: false },
        statut: { type: DataTypes.ENUM("brouillon", "appliquee", "annulee"), allowNull: false, defaultValue: "brouillon" },
        impact: { type: DataTypes.JSON, allowNull: true },
        id_auteur: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL" },
        appliquee_le: { type: DataTypes.DATE, allowNull: true },
        // La version inverse dit laquelle elle annule : une version n'est annulée qu'une fois
        annule_version: { type: DataTypes.INTEGER, allowNull: true, unique: true, references: { model: "VersionsParametres", key: "id_version" } },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.createTable("ValeursParametres", {
        id_version: { type: DataTypes.INTEGER, primaryKey: true, references: { model: "VersionsParametres", key: "id_version" }, onDelete: "CASCADE" },
        cle: { type: DataTypes.STRING(64), primaryKey: true },
        portee: { type: DataTypes.STRING(20), primaryKey: true },
        // Chaîne vide pour l'établissement : MySQL n'applique pas l'unicité d'une clé sur un NULL
        id_portee: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: "" },
        valeur: { type: DataTypes.JSON, allowNull: true },
        force: { type: DataTypes.ENUM("strict", "souple"), allowNull: true },
        poids: { type: DataTypes.INTEGER, allowNull: true },
        retiree: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await queryInterface.addIndex("ValeursParametres", ["cle"], { name: "valeurs_parametres_cle" });
    await versionInitiale(queryInterface);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("ValeursParametres");
    await queryInterface.dropTable("VersionsParametres");
};
