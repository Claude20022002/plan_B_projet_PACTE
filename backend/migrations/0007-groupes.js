import { anneeDepuisNiveau } from "../config/referentiel.js";

/**
 * Phase P2 — groupes emboîtés.
 * - Groupes : type (promotion, td, tp), groupe parent, année d'études (1 à 5).
 * - Reprise : les groupes existants deviennent des groupes de TD, rattachés à une
 *   promotion créée pour chaque (filière, niveau, année scolaire), dont l'effectif est
 *   la somme de ses groupes. Les étudiants restent dans leur groupe.
 */
export const up = async ({ sequelize, queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("Groupes", "type_groupe", {
        type: DataTypes.ENUM("promotion", "td", "tp"),
        allowNull: false,
        defaultValue: "td",
    });
    await queryInterface.addColumn("Groupes", "id_groupe_parent", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Groupes", key: "id_groupe" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Groupes", "annee", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addIndex("Groupes", ["id_filiere", "type_groupe"]);

    const [groupes] = await sequelize.query(
        `SELECT g.id_groupe, g.nom_groupe, g.niveau, g.effectif, g.annee_scolaire, g.id_filiere, f.code_filiere
         FROM Groupes g JOIN Filiere f ON f.id_filiere = g.id_filiere`
    );

    const promotions = new Map();
    for (const groupe of groupes) {
        const cle = `${groupe.id_filiere}|${groupe.niveau}|${groupe.annee_scolaire}`;
        if (!promotions.has(cle)) promotions.set(cle, { ...groupe, enfants: [], effectif_total: 0 });
        const promotion = promotions.get(cle);
        promotion.enfants.push(groupe.id_groupe);
        promotion.effectif_total += Number(groupe.effectif) || 0;
    }

    const nomsPris = new Set(groupes.map((g) => `${g.nom_groupe}|${g.annee_scolaire}`));
    const now = new Date();
    for (const promotion of promotions.values()) {
        const annee = anneeDepuisNiveau(promotion.niveau);
        // « 4A IIIA », sur le modèle de l'emploi du temps officiel (« 4A | IIIA »)
        let nom = annee ? `${annee}A ${promotion.code_filiere}` : `${promotion.code_filiere} ${promotion.niveau}`;
        if (nomsPris.has(`${nom}|${promotion.annee_scolaire}`)) nom = `${nom} (promotion)`;
        nomsPris.add(`${nom}|${promotion.annee_scolaire}`);

        await queryInterface.bulkInsert("Groupes", [
            {
                nom_groupe: nom,
                niveau: promotion.niveau,
                effectif: promotion.effectif_total,
                annee_scolaire: promotion.annee_scolaire,
                id_filiere: promotion.id_filiere,
                type_groupe: "promotion",
                annee,
                createdAt: now,
                updatedAt: now,
            },
        ]);
        const [[{ id }]] = await sequelize.query("SELECT LAST_INSERT_ID() AS id");
        await sequelize.query("UPDATE Groupes SET id_groupe_parent = :parent, annee = :annee WHERE id_groupe IN (:enfants)", {
            replacements: { parent: id, annee, enfants: promotion.enfants },
        });
    }
};

export const down = async () => {
    throw new Error("Migration irréversible : restaurer une sauvegarde de la base.");
};
