/**
 * Lien de visioconférence d'une séance à distance (plan multi-établissements, fichier 14, lot EC-11 ;
 * conception-ec11-groupe-b.md) : une adresse facultative sur la séance, posée par son enseignant ou
 * l'administration, lue par les étudiants de ses groupes. Vide, rien ne change. Retour arrière : la
 * colonne est retirée, les liens posés sont perdus.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Affectations", "lien_visio", { type: DataTypes.STRING(500), allowNull: true });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("Affectations", "lien_visio");
};
