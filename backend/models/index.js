import Users from "./Users.js";
import Enseignant from "./Enseignant.js";
import Etudiant from "./Etudiant.js";
import Filiere from "./Filiere.js";
import Groupe from "./Groupe.js";
import Salle from "./Salle.js";
import Cours from "./Cours.js";
import Creneau from "./Creneau.js";
import Affectation from "./Affectation.js";
import DemandeReport from "./DemandeReport.js";
import Conflit from "./Conflit.js";
import Notification from "./Notification.js";
import HistoriqueAffectation from "./HistoriqueAffectation.js";
import Disponibilite from "./Disponibilite.js";
import ConflitAffectation from "./ConflitAffectation.js";
import Appartenir from "./Appartenir.js";
import PasswordResetToken from "./PasswordResetToken.js";
import Evenement from "./Evenement.js";

// ==================== RELATIONS USER ====================

// User -> Enseignant (1:1)
Users.hasOne(Enseignant, {
    foreignKey: "id_user",
    as: "enseignant",
    onDelete: "CASCADE",
});
Enseignant.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user",
    targetKey: "id_user",
});

// User -> Etudiant (1:1)
Users.hasOne(Etudiant, {
    foreignKey: "id_user",
    as: "etudiant",
    onDelete: "CASCADE",
});
Etudiant.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user",
    targetKey: "id_user",
});

// User -> Notification (1:n)
Users.hasMany(Notification, {
    foreignKey: "id_user",
    as: "notifications",
    onDelete: "CASCADE",
});
Notification.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user",
    targetKey: "id_user",
});

// User -> Affectation (admin qui crée)
Users.hasMany(Affectation, {
    foreignKey: "id_user_admin",
    as: "affectations_creees",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Users, {
    foreignKey: "id_user_admin",
    as: "admin_createur",
    targetKey: "id_user",
});

// User -> HistoriqueAffectation (admin qui modifie)
Users.hasMany(HistoriqueAffectation, {
    foreignKey: "id_user",
    as: "historiques_modifications",
    onDelete: "SET NULL",
});
HistoriqueAffectation.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user_modificateur",
    targetKey: "id_user",
});

// ==================== RELATIONS FILIERE ====================

// Filiere -> Groupe (1:n)
Filiere.hasMany(Groupe, {
    foreignKey: "id_filiere",
    as: "groupes",
    onDelete: "RESTRICT",
});
Groupe.belongsTo(Filiere, {
    foreignKey: "id_filiere",
    as: "filiere",
});

// Filiere -> Cours (1:n)
Filiere.hasMany(Cours, {
    foreignKey: "id_filiere",
    as: "cours",
    onDelete: "RESTRICT",
});
Cours.belongsTo(Filiere, {
    foreignKey: "id_filiere",
    as: "filiere",
});

// ==================== RELATIONS GROUPE ====================

// Groupe -> Affectation (1:n)
Groupe.hasMany(Affectation, {
    foreignKey: "id_groupe",
    as: "affectations",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Groupe, {
    foreignKey: "id_groupe",
    as: "groupe",
});

// Groupe -> Appartenir (1:n)
Groupe.hasMany(Appartenir, {
    foreignKey: "id_groupe",
    as: "appartenances",
    onDelete: "CASCADE",
});
Appartenir.belongsTo(Groupe, {
    foreignKey: "id_groupe",
    as: "groupe",
});

// ==================== RELATIONS ETUDIANT ====================

// Etudiant -> Appartenir (1:1)
Etudiant.hasOne(Appartenir, {
    foreignKey: "id_user_etudiant",
    as: "appartenance",
    onDelete: "CASCADE",
});
Appartenir.belongsTo(Etudiant, {
    foreignKey: "id_user_etudiant",
    as: "etudiant",
});

// ==================== RELATIONS ENSEIGNANT ====================

// Enseignant -> Affectation (1:n)
Users.hasMany(Affectation, {
    foreignKey: "id_user_enseignant",
    as: "affectations_enseignant",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Users, {
    foreignKey: "id_user_enseignant",
    as: "enseignant",
    targetKey: "id_user",
});

// Enseignant -> DemandeReport (1:n)
Users.hasMany(DemandeReport, {
    foreignKey: "id_user_enseignant",
    as: "demandes_report",
    onDelete: "CASCADE",
});
DemandeReport.belongsTo(Users, {
    foreignKey: "id_user_enseignant",
    as: "enseignant",
    targetKey: "id_user",
});

// Enseignant -> Disponibilite (1:n)
Users.hasMany(Disponibilite, {
    foreignKey: "id_user_enseignant",
    as: "disponibilites",
    onDelete: "CASCADE",
});
Disponibilite.belongsTo(Users, {
    foreignKey: "id_user_enseignant",
    as: "enseignant",
    targetKey: "id_user",
});

// ==================== RELATIONS SALLE ====================

// Salle -> Affectation (1:n)
Salle.hasMany(Affectation, {
    foreignKey: "id_salle",
    as: "affectations",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Salle, {
    foreignKey: "id_salle",
    as: "salle",
});

// ==================== RELATIONS COURS ====================

// Cours -> Affectation (1:n)
Cours.hasMany(Affectation, {
    foreignKey: "id_cours",
    as: "affectations",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Cours, {
    foreignKey: "id_cours",
    as: "cours",
});

// ==================== RELATIONS CRENEAU ====================

// Creneau -> Affectation (1:n)
Creneau.hasMany(Affectation, {
    foreignKey: "id_creneau",
    as: "affectations",
    onDelete: "RESTRICT",
});
Affectation.belongsTo(Creneau, {
    foreignKey: "id_creneau",
    as: "creneau",
});

// Creneau -> Disponibilite (1:n)
Creneau.hasMany(Disponibilite, {
    foreignKey: "id_creneau",
    as: "disponibilites",
    onDelete: "CASCADE",
});
Disponibilite.belongsTo(Creneau, {
    foreignKey: "id_creneau",
    as: "creneau",
});

// ==================== RELATIONS AFFECTATION ====================

// Affectation -> DemandeReport (1:n)
Affectation.hasMany(DemandeReport, {
    foreignKey: "id_affectation",
    as: "demandes_report",
    onDelete: "CASCADE",
});
DemandeReport.belongsTo(Affectation, {
    foreignKey: "id_affectation",
    as: "affectation",
});

// Affectation -> HistoriqueAffectation (1:n)
Affectation.hasMany(HistoriqueAffectation, {
    foreignKey: "id_affectation",
    as: "historiques",
    onDelete: "CASCADE",
});
HistoriqueAffectation.belongsTo(Affectation, {
    foreignKey: "id_affectation",
    as: "affectation",
});

// Affectation -> ConflitAffectation (n:n via table de liaison)
Affectation.belongsToMany(Conflit, {
    through: ConflitAffectation,
    foreignKey: "id_affectation",
    otherKey: "id_conflit",
    as: "conflits",
});
Conflit.belongsToMany(Affectation, {
    through: ConflitAffectation,
    foreignKey: "id_conflit",
    otherKey: "id_affectation",
    as: "affectations",
});

// ==================== RELATIONS CONFLIT ====================

// Conflit -> ConflitAffectation (1:n)
Conflit.hasMany(ConflitAffectation, {
    foreignKey: "id_conflit",
    as: "conflit_affectations",
    onDelete: "CASCADE",
});
ConflitAffectation.belongsTo(Conflit, {
    foreignKey: "id_conflit",
    as: "conflit",
});

// ConflitAffectation -> Affectation
ConflitAffectation.belongsTo(Affectation, {
    foreignKey: "id_affectation",
    as: "affectation",
});

// Export de tous les modèles
export {
    Users,
    Users as User, // Alias pour compatibilité
    Enseignant,
    Etudiant,
    Filiere,
    Groupe,
    Salle,
    Cours,
    Creneau,
    Affectation,
    DemandeReport,
    Conflit,
    Notification,
    HistoriqueAffectation,
    Disponibilite,
    ConflitAffectation,
    Appartenir,
    PasswordResetToken,
    Evenement,
};
