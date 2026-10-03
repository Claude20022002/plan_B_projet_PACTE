/**
 * Phase P1 — grilles horaires par régime.
 * - Creneaux : régime (initiale, continue, executive), variante (normale, ramadan) et rang
 *   (position dans la journée), calculé ici pour les créneaux existants.
 * - Filiere : régime de formation (temps plein par défaut).
 */
export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("Creneaux", "regime", {
        type: DataTypes.ENUM("initiale", "continue", "executive"),
        allowNull: false,
        defaultValue: "initiale",
    });
    await queryInterface.addColumn("Creneaux", "variante", {
        type: DataTypes.ENUM("normale", "ramadan"),
        allowNull: false,
        defaultValue: "normale",
    });
    await queryInterface.addColumn("Creneaux", "rang", { type: DataTypes.INTEGER, allowNull: true });

    await sequelize.query(`
        UPDATE Creneaux c
        JOIN (
            SELECT id_creneau,
                   ROW_NUMBER() OVER (PARTITION BY jour_semaine, regime, variante ORDER BY heure_debut, heure_fin) AS rn
            FROM Creneaux
        ) r ON r.id_creneau = c.id_creneau
        SET c.rang = r.rn
    `);
    await queryInterface.addIndex("Creneaux", ["regime", "variante", "jour_semaine", "rang"]);

    await queryInterface.addColumn("Filiere", "regime", {
        type: DataTypes.ENUM("initiale", "continue", "executive"),
        allowNull: false,
        defaultValue: "initiale",
    });
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
