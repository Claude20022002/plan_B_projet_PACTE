/**
 * Noms affichés sans tiret long (« — ») : le seed nommait ainsi quelques filières et un module
 * (« Ingénierie Informatique — IA & Big Data »), et les descriptions de filières « Cycle — Nom ».
 * Ce tiret casse la lecture : parenthèses pour les spécialités, « Cycle : Nom » pour les
 * descriptions, virgule pour tout autre nom qui en contiendrait encore. StudyLib reprend les noms
 * à la synchronisation suivante du référentiel.
 */
const TIRET = "—";

const RENOMMAGES = [
    ["Filiere", "nom_filiere", `Ingénierie Informatique ${TIRET} IA & Big Data`, "Ingénierie Informatique (IA & Big Data)"],
    ["Filiere", "nom_filiere", `Ingénierie Informatique ${TIRET} Cybersécurité`, "Ingénierie Informatique (Cybersécurité)"],
    ["Filiere", "nom_filiere", `Ingénierie Informatique ${TIRET} Génie Logiciel`, "Ingénierie Informatique (Génie Logiciel)"],
    ["Filiere", "nom_filiere", `Programme Grande École ${TIRET} Marketing Digital et Innovation`, "Programme Grande École (Marketing Digital et Innovation)"],
    ["Cours", "nom_cours", `IBM Data Science ${TIRET} certificat professionnel (cours 1 à 4)`, "IBM Data Science, certificat professionnel (cours 1 à 4)"],
];

export const up = async ({ queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    const anciensNoms = new Map(RENOMMAGES.filter(([table]) => table === "Filiere").map(([, , ancien, nouveau]) => [nouveau, ancien]));

    for (const [table, colonne, ancien, nouveau] of RENOMMAGES) {
        await sequelize.query(`UPDATE \`${table}\` SET \`${colonne}\` = :nouveau WHERE \`${colonne}\` = :ancien`, { replacements: { ancien, nouveau } });
    }

    // Descriptions du seed « Cycle — Nom » → « Cycle : Nom » ; toute autre description : virgule
    const [filieres] = await sequelize.query(`SELECT id_filiere, nom_filiere, description FROM \`Filiere\` WHERE description LIKE :motif`, { replacements: { motif: `%${TIRET}%` } });
    for (const f of filieres) {
        const nomDuSeed = anciensNoms.get(f.nom_filiere) ?? f.nom_filiere;
        const suffixe = ` ${TIRET} ${nomDuSeed}`;
        const description = f.description.endsWith(suffixe) ? `${f.description.slice(0, -suffixe.length)} : ${f.nom_filiere}` : f.description.replaceAll(` ${TIRET} `, ", ").replaceAll(TIRET, "-");
        await sequelize.query("UPDATE `Filiere` SET description = :description WHERE id_filiere = :id", { replacements: { description, id: f.id_filiere } });
    }

    // Filet de sécurité : tout autre nom affiché qui contiendrait encore ce tiret
    for (const [table, colonne] of [["Filiere", "nom_filiere"], ["Cours", "nom_cours"], ["Groupes", "nom_groupe"], ["Salles", "nom_salle"]]) {
        await sequelize.query(`UPDATE \`${table}\` SET \`${colonne}\` = REPLACE(REPLACE(\`${colonne}\`, :espace, ', '), :tiret, '-') WHERE \`${colonne}\` LIKE :motif`, {
            replacements: { espace: ` ${TIRET} `, tiret: TIRET, motif: `%${TIRET}%` },
        });
    }
};

export const down = async ({ queryInterface }) => {
    // Seuls les renommages connus sont réversibles ; le reste est purement typographique
    for (const [table, colonne, ancien, nouveau] of RENOMMAGES) {
        await queryInterface.sequelize.query(`UPDATE \`${table}\` SET \`${colonne}\` = :ancien WHERE \`${colonne}\` = :nouveau`, { replacements: { ancien, nouveau } });
    }
};
