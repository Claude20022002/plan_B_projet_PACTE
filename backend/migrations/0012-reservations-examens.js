/**
 * Phase P5 — réservations de salles au-delà des cours, et examens avec surveillants.
 * - Reservations : rattrapage, réunion, soutenance, examen ponctuel, événement, club ; une salle
 *   (facultative pour une réunion à distance), une date et une plage horaire libre ; demandée,
 *   puis validée ou refusée par l'administration (ou validée d'office selon la salle).
 * - ReservationParticipants : personnes (jury, intervenants) ou groupes concernés : ils sont
 *   bloqués comme pour un cours.
 * - SessionsExamen : épreuve d'un module pour des groupes, sur une ou plusieurs salles
 *   (SessionExamenSalles), avec des surveillants par salle (Surveillances).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const horodatage = {
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    };
    const fk = (table, cle, onDelete = "CASCADE", allowNull = false) => ({
        type: DataTypes.INTEGER,
        allowNull,
        references: { model: table, key: cle },
        onDelete,
        onUpdate: "CASCADE",
    });

    await queryInterface.createTable("Reservations", {
        id_reservation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        type: { type: DataTypes.ENUM("rattrapage", "reunion", "soutenance", "examen", "evenement", "club"), allowNull: false },
        titre: { type: DataTypes.STRING, allowNull: false },
        description: DataTypes.TEXT,
        id_salle: fk("Salles", "id_salle", "SET NULL", true),
        date: { type: DataTypes.DATEONLY, allowNull: false },
        heure_debut: { type: DataTypes.TIME, allowNull: false },
        heure_fin: { type: DataTypes.TIME, allowNull: false },
        statut: { type: DataTypes.ENUM("demandee", "validee", "refusee", "annulee"), allowNull: false, defaultValue: "demandee" },
        motif_refus: DataTypes.TEXT,
        // Rattrapage : séance d'origine (annulée ou reportée) ; à la validation, une séance est créée
        id_affectation_origine: fk("Affectations", "id_affectation", "SET NULL", true),
        id_affectation_creee: fk("Affectations", "id_affectation", "SET NULL", true),
        id_demandeur: fk("Users", "id_user", "CASCADE"),
        id_valideur: fk("Users", "id_user", "SET NULL", true),
        date_validation: DataTypes.DATE,
        force: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        justification_force: DataTypes.TEXT,
        ...horodatage,
    });
    await queryInterface.addIndex("Reservations", ["date", "statut"]);

    await queryInterface.createTable("ReservationParticipants", {
        id_participant: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_reservation: fk("Reservations", "id_reservation"),
        id_user: fk("Users", "id_user", "CASCADE", true),
        id_groupe: fk("Groupes", "id_groupe", "CASCADE", true),
        role: { type: DataTypes.ENUM("participant", "jury", "president", "etudiant", "intervenant"), allowNull: false, defaultValue: "participant" },
        ...horodatage,
    });

    await queryInterface.createTable("SessionsExamen", {
        id_session: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING, allowNull: false },
        id_cours: fk("Cours", "id_cours", "CASCADE"),
        id_periode: fk("Periodes", "id_periode", "SET NULL", true),
        date: { type: DataTypes.DATEONLY, allowNull: false },
        heure_debut: { type: DataTypes.TIME, allowNull: false },
        heure_fin: { type: DataTypes.TIME, allowNull: false },
        statut: { type: DataTypes.ENUM("brouillon", "publiee", "annulee"), allowNull: false, defaultValue: "brouillon" },
        id_createur: fk("Users", "id_user", "CASCADE"),
        ...horodatage,
    });
    await queryInterface.addIndex("SessionsExamen", ["date"]);

    await queryInterface.createTable("SessionExamenGroupes", {
        id_session: { ...fk("SessionsExamen", "id_session"), primaryKey: true },
        id_groupe: { ...fk("Groupes", "id_groupe"), primaryKey: true },
        ...horodatage,
    });

    await queryInterface.createTable("SessionExamenSalles", {
        id_session: { ...fk("SessionsExamen", "id_session"), primaryKey: true },
        id_salle: { ...fk("Salles", "id_salle"), primaryKey: true },
        // Étudiants placés dans cette salle (≤ capacité d'examen)
        effectif: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...horodatage,
    });

    await queryInterface.createTable("Surveillances", {
        id_surveillance: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: fk("SessionsExamen", "id_session"),
        id_salle: fk("Salles", "id_salle"),
        id_user: fk("Users", "id_user"),
        ...horodatage,
    });
    await queryInterface.addIndex("Surveillances", ["id_session", "id_user"], { unique: true });
};

export const down = async ({ queryInterface }) => {
    for (const table of ["Surveillances", "SessionExamenSalles", "SessionExamenGroupes", "SessionsExamen", "ReservationParticipants", "Reservations"]) {
        await queryInterface.dropTable(table);
    }
};
