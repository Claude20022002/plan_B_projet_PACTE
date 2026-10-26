/**
 * L'année d'un groupe devient une vraie clé (plan multi-établissements, fichier 11, § 11.4, lot
 * ME-18). Jusqu'ici, Groupes.annee_scolaire était un texte libre (« 2025-2026 » ou « 2025/2026 »)
 * sans lien avec AnneesUniversitaires : rien ne permettait de ne montrer à un étudiant que les
 * groupes de l'année en cours, et ses modules de deux années se mélangeaient.
 *
 * Étendre puis contracter (D-16) : la colonne id_annee s'ajoute et se remplit ; annee_scolaire
 * reste, lue par l'existant, et ne sera retirée qu'une version plus tard.
 *
 * Remplissage : chaque texte est rapproché du libellé d'une année (« / » lu comme « - »). Un
 * texte de la forme AAAA-AAAA sans année correspondante crée l'année (1er septembre - 31 août,
 * non active) : les dates se corrigent ensuite dans le calendrier. Un texte illisible laisse
 * id_annee vide : le groupe reste visible comme aujourd'hui, et la liste en est écrite au journal.
 */
const normaliser = (texte) => String(texte ?? "").replace("/", "-").trim();
const ANNEE = /^(\d{4})-(\d{4})$/;

export const up = async ({ queryInterface }) => {
    const { DataTypes, QueryTypes } = await import("sequelize");
    const sql = queryInterface.sequelize;
    await queryInterface.addColumn("Groupes", "id_annee", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "AnneesUniversitaires", key: "id_annee" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });
    await queryInterface.addIndex("Groupes", ["id_annee"], { name: "groupes_id_annee" });

    const annees = await sql.query("SELECT id_annee, libelle FROM AnneesUniversitaires", { type: QueryTypes.SELECT });
    const parLibelle = new Map(annees.map((a) => [normaliser(a.libelle), a.id_annee]));
    const textes = await sql.query("SELECT DISTINCT annee_scolaire FROM Groupes", { type: QueryTypes.SELECT });
    const illisibles = [];
    for (const { annee_scolaire: texte } of textes) {
        const libelle = normaliser(texte);
        let idAnnee = parLibelle.get(libelle);
        const forme = libelle.match(ANNEE);
        if (!idAnnee && forme && Number(forme[2]) === Number(forme[1]) + 1) {
            const maintenant = new Date();
            await queryInterface.bulkInsert("AnneesUniversitaires", [
                { libelle, date_debut: `${forme[1]}-09-01`, date_fin: `${forme[2]}-08-31`, active: false, createdAt: maintenant, updatedAt: maintenant },
            ]);
            [{ id_annee: idAnnee }] = await sql.query("SELECT id_annee FROM AnneesUniversitaires WHERE libelle = ?", { replacements: [libelle], type: QueryTypes.SELECT });
            parLibelle.set(libelle, idAnnee);
        }
        if (!idAnnee) {
            illisibles.push(texte);
            continue;
        }
        await sql.query("UPDATE Groupes SET id_annee = ? WHERE annee_scolaire = ?", { replacements: [idAnnee, texte] });
    }
    if (illisibles.length) console.warn(`Migration 0054 : année non reconnue pour les groupes de « ${illisibles.join(" », « ")} » (id_annee laissé vide)`);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeIndex("Groupes", "groupes_id_annee");
    await queryInterface.removeColumn("Groupes", "id_annee");
};
