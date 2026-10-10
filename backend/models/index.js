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
import Reservation from "./Reservation.js";
import ReservationParticipant from "./ReservationParticipant.js";
import SessionExamen from "./SessionExamen.js";
import SessionExamenGroupe from "./SessionExamenGroupe.js";
import SessionExamenSalle from "./SessionExamenSalle.js";
import Surveillance from "./Surveillance.js";
import RetourSeance from "./RetourSeance.js";
import RetourSeanceParticipation from "./RetourSeanceParticipation.js";
import PushToken from "./PushToken.js";
import OidcPayload from "./OidcPayload.js";
import QuizPartie from "./QuizPartie.js";
import QuizResultat from "./QuizResultat.js";
import Devoir from "./Devoir.js";
import DevoirRendu from "./DevoirRendu.js";
import FichierDevoir from "./FichierDevoir.js";
import AbonnementCalendrier from "./AbonnementCalendrier.js";
import EnvoiEdt from "./EnvoiEdt.js";
import AppelSeance from "./AppelSeance.js";
import Presence from "./Presence.js";
import SignalementPresence from "./SignalementPresence.js";
import AppareilEtudiant from "./AppareilEtudiant.js";
import MfaCodeSecours from "./MfaCodeSecours.js";
import JournalSecurite from "./JournalSecurite.js";
import GenerationQuiz from "./GenerationQuiz.js";
import MfaDefi from "./MfaDefi.js";
import JeuModule from "./JeuModule.js";
import JeuProgression from "./JeuProgression.js";
import JeuProfil from "./JeuProfil.js";
import PasserelleWeb from "./PasserelleWeb.js";
import Annonce from "./Annonce.js";
import AnnonceDestinataire from "./AnnonceDestinataire.js";
import AnnoncePieceJointe from "./AnnoncePieceJointe.js";
// Cycle volontaire : services/push.js n'utilise les modèles qu'à l'appel, jamais au chargement
import { planifierPush } from "../services/push.js";
import AuthSession from "./AuthSession.js";
import GenerationSession from "./GenerationSession.js";
import PlanningSnapshot from "./PlanningSnapshot.js";
import Campus from "./Campus.js";
import TrajetCampus from "./TrajetCampus.js";
import AnneeUniversitaire from "./AnneeUniversitaire.js";
import Periode from "./Periode.js";
import ParametrePlanning from "./ParametrePlanning.js";
import CoursComposante from "./CoursComposante.js";
import Enseignement from "./Enseignement.js";
import EnseignementGroupe from "./EnseignementGroupe.js";
import CompetenceEnseignant from "./CompetenceEnseignant.js";
import EnseignementEnseignant from "./EnseignementEnseignant.js";
import ResponsableFiliere from "./ResponsableFiliere.js";

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

Users.hasMany(GenerationSession, {
    foreignKey: "id_user_admin",
    as: "generation_sessions",
    onDelete: "RESTRICT",
});

// User -> PasswordResetToken (1:n) — utilisé par POST /api/auth/reset-password
Users.hasMany(PasswordResetToken, {
    foreignKey: "id_user",
    as: "password_reset_tokens",
    onDelete: "CASCADE",
});
PasswordResetToken.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user",
    targetKey: "id_user",
});

Users.hasMany(AuthSession, {
    foreignKey: "id_user",
    as: "auth_sessions",
    onDelete: "CASCADE",
});

AuthSession.belongsTo(Users, {
    foreignKey: "id_user",
    as: "user",
    targetKey: "id_user",
});
GenerationSession.belongsTo(Users, {
    foreignKey: "id_user_admin",
    as: "admin_createur",
    targetKey: "id_user",
});

Users.hasMany(PlanningSnapshot, {
    foreignKey: "id_user_admin",
    as: "planning_snapshots",
    onDelete: "RESTRICT",
});
PlanningSnapshot.belongsTo(Users, {
    foreignKey: "id_user_admin",
    as: "admin_createur",
    targetKey: "id_user",
});

GenerationSession.hasOne(PlanningSnapshot, {
    foreignKey: "id_generation_session",
    as: "snapshot",
    onDelete: "SET NULL",
});
PlanningSnapshot.belongsTo(GenerationSession, {
    foreignKey: "id_generation_session",
    as: "generation_session",
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

PlanningSnapshot.hasMany(Affectation, {
    foreignKey: "id_snapshot",
    as: "affectations",
    onDelete: "SET NULL",
});
Affectation.belongsTo(PlanningSnapshot, {
    foreignKey: "id_snapshot",
    as: "snapshot",
});

GenerationSession.hasMany(Affectation, {
    foreignKey: "id_generation_session",
    as: "affectations",
    onDelete: "SET NULL",
});
Affectation.belongsTo(GenerationSession, {
    foreignKey: "id_generation_session",
    as: "generation_session",
});
Affectation.belongsTo(Creneau, {
    foreignKey: "id_creneau",
    as: "creneau",
});
// Séance reportée : créneau d'origine (heure d'avant le report)
Affectation.belongsTo(Creneau, {
    foreignKey: "id_creneau_initial",
    as: "creneauInitial",
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

// ==================== RÉFÉRENTIEL ÉTABLISSEMENT (phase P1) ====================

// Campus -> Salle (1:n). Une salle n'existe que sur un campus : suppression refusée tant qu'il a des salles.
Campus.hasMany(Salle, { foreignKey: "id_campus", as: "salles", onDelete: "RESTRICT" });
Salle.belongsTo(Campus, { foreignKey: "id_campus", as: "campus" });

// Le campus accompagne toute salle chargée (y compris dans les include des séances) :
// c'est lui qui alimente salle.batiment pour le frontend existant.
Salle.addScope(
    "defaultScope",
    { include: [{ model: Campus, as: "campus", attributes: ["id_campus", "code", "nom"] }] },
    { override: true }
);

TrajetCampus.belongsTo(Campus, { foreignKey: "id_campus_a", as: "campus_a" });
TrajetCampus.belongsTo(Campus, { foreignKey: "id_campus_b", as: "campus_b" });

// Année universitaire -> Période (1:n)
AnneeUniversitaire.hasMany(Periode, { foreignKey: "id_annee", as: "periodes", onDelete: "CASCADE" });
Periode.belongsTo(AnneeUniversitaire, { foreignKey: "id_annee", as: "annee" });

Evenement.belongsTo(Users, { foreignKey: "id_user_createur", as: "createur", targetKey: "id_user" });

// ==================== OFFRE DE FORMATION (phase P2) ====================

Filiere.belongsTo(Campus, { foreignKey: "id_campus_prefere", as: "campus_prefere" });
Cours.belongsTo(Users, { foreignKey: "id_responsable", as: "responsable", targetKey: "id_user" });

// Cours (module) -> CoursComposante (CM, TD, TP, Projet)
Cours.hasMany(CoursComposante, { foreignKey: "id_cours", as: "composantes", onDelete: "CASCADE" });
CoursComposante.belongsTo(Cours, { foreignKey: "id_cours", as: "cours" });

// Groupes emboîtés : promotion -> TD -> TP
Groupe.hasMany(Groupe, { foreignKey: "id_groupe_parent", as: "sous_groupes" });
Groupe.belongsTo(Groupe, { foreignKey: "id_groupe_parent", as: "parent" });

// Enseignement = composante × groupes (mutualisation) sur une période
CoursComposante.hasMany(Enseignement, { foreignKey: "id_composante", as: "enseignements", onDelete: "CASCADE" });
Enseignement.belongsTo(CoursComposante, { foreignKey: "id_composante", as: "composante" });
Enseignement.belongsTo(Periode, { foreignKey: "id_periode", as: "periode" });
Enseignement.belongsToMany(Groupe, {
    through: EnseignementGroupe,
    foreignKey: "id_enseignement",
    otherKey: "id_groupe",
    as: "groupes",
});
Groupe.belongsToMany(Enseignement, {
    through: EnseignementGroupe,
    foreignKey: "id_groupe",
    otherKey: "id_enseignement",
    as: "enseignements",
});
Enseignement.hasMany(Affectation, { foreignKey: "id_enseignement", as: "seances" });
Affectation.belongsTo(Enseignement, { foreignKey: "id_enseignement", as: "enseignement" });

// ==================== ENSEIGNANTS ET SERVICES (phase P3) ====================

Enseignant.belongsTo(Campus, { foreignKey: "id_campus_prefere", as: "campus_prefere" });

// Compétences : modules qu'un enseignant peut prendre
Users.belongsToMany(Cours, { through: CompetenceEnseignant, foreignKey: "id_user", otherKey: "id_cours", as: "competences" });
Cours.belongsToMany(Users, { through: CompetenceEnseignant, foreignKey: "id_cours", otherKey: "id_user", as: "enseignants_competents" });

// Services : enseignants d'un enseignement (avec co-enseignement)
Enseignement.hasMany(EnseignementEnseignant, { foreignKey: "id_enseignement", as: "services", onDelete: "CASCADE" });
EnseignementEnseignant.belongsTo(Enseignement, { foreignKey: "id_enseignement", as: "enseignement" });
EnseignementEnseignant.belongsTo(Users, { foreignKey: "id_user", as: "enseignant", targetKey: "id_user" });
Users.hasMany(EnseignementEnseignant, { foreignKey: "id_user", as: "services" });

// Responsables de filière
Filiere.hasMany(ResponsableFiliere, { foreignKey: "id_filiere", as: "responsables", onDelete: "CASCADE" });
ResponsableFiliere.belongsTo(Filiere, { foreignKey: "id_filiere", as: "filiere" });
ResponsableFiliere.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });
Users.hasMany(ResponsableFiliere, { foreignKey: "id_user", as: "responsabilites" });

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

// ==================== RÉSERVATIONS ET EXAMENS (phase P5) ====================
Reservation.belongsTo(Salle, { foreignKey: "id_salle", as: "salle" });
Reservation.belongsTo(Users, { foreignKey: "id_demandeur", as: "demandeur", targetKey: "id_user" });
Reservation.belongsTo(Users, { foreignKey: "id_valideur", as: "valideur", targetKey: "id_user" });
Reservation.belongsTo(Affectation, { foreignKey: "id_affectation_origine", as: "seance_origine" });
Reservation.belongsTo(Affectation, { foreignKey: "id_affectation_creee", as: "seance_creee" });
Reservation.hasMany(ReservationParticipant, { foreignKey: "id_reservation", as: "participants", onDelete: "CASCADE" });
ReservationParticipant.belongsTo(Reservation, { foreignKey: "id_reservation", as: "reservation" });
ReservationParticipant.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });
ReservationParticipant.belongsTo(Groupe, { foreignKey: "id_groupe", as: "groupe" });

SessionExamen.belongsTo(Cours, { foreignKey: "id_cours", as: "cours" });
SessionExamen.belongsTo(Periode, { foreignKey: "id_periode", as: "periode" });
SessionExamen.belongsTo(Users, { foreignKey: "id_createur", as: "createur", targetKey: "id_user" });
SessionExamen.belongsToMany(Groupe, { through: SessionExamenGroupe, foreignKey: "id_session", otherKey: "id_groupe", as: "groupes" });
SessionExamen.hasMany(SessionExamenSalle, { foreignKey: "id_session", as: "salles", onDelete: "CASCADE" });
SessionExamenSalle.belongsTo(Salle, { foreignKey: "id_salle", as: "salle" });
SessionExamen.hasMany(Surveillance, { foreignKey: "id_session", as: "surveillances", onDelete: "CASCADE" });
Surveillance.belongsTo(Users, { foreignKey: "id_user", as: "surveillant", targetKey: "id_user" });
Surveillance.belongsTo(Salle, { foreignKey: "id_salle", as: "salle" });
Surveillance.belongsTo(SessionExamen, { foreignKey: "id_session", as: "session" });

// Retours de séance (I7) : anonymes, une participation par étudiant
Affectation.hasMany(RetourSeance, { foreignKey: "id_affectation", as: "retours", onDelete: "CASCADE" });
RetourSeance.belongsTo(Affectation, { foreignKey: "id_affectation", as: "seance" });

// Appareils de l'application mobile (D3)
Users.hasMany(PushToken, { foreignKey: "id_user", as: "pushTokens", onDelete: "CASCADE" });
PushToken.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });
QuizPartie.belongsTo(Affectation, { foreignKey: "id_affectation", as: "affectation" });
QuizPartie.belongsTo(Users, { foreignKey: "id_user_enseignant", as: "enseignant", targetKey: "id_user" });
QuizPartie.hasMany(QuizResultat, { foreignKey: "id_quiz_partie", as: "resultats", onDelete: "CASCADE" });
QuizResultat.belongsTo(QuizPartie, { foreignKey: "id_quiz_partie", as: "partie" });
QuizResultat.belongsTo(Users, { foreignKey: "id_user", as: "joueur", targetKey: "id_user" });
Devoir.belongsTo(Cours, { foreignKey: "id_cours", as: "cours" });
Devoir.belongsTo(Groupe, { foreignKey: "id_groupe", as: "groupe" });
Devoir.belongsTo(Users, { foreignKey: "id_user_enseignant", as: "enseignant", targetKey: "id_user" });
Devoir.hasMany(DevoirRendu, { foreignKey: "id_devoir", as: "rendus", onDelete: "CASCADE" });
DevoirRendu.belongsTo(Devoir, { foreignKey: "id_devoir", as: "devoir" });
DevoirRendu.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
Devoir.hasMany(FichierDevoir, { foreignKey: "id_devoir", as: "fichiers", onDelete: "CASCADE" });

// Calendrier et envois de l'emploi du temps (R4)
AbonnementCalendrier.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });
EnvoiEdt.belongsTo(Groupe, { foreignKey: "id_groupe", as: "groupe" });

// Appel par QR code (I1)
Affectation.hasOne(AppelSeance, { foreignKey: "id_affectation", as: "appel", onDelete: "CASCADE" });
Affectation.hasMany(Presence, { foreignKey: "id_affectation", as: "presences", onDelete: "CASCADE" });
Presence.belongsTo(Affectation, { foreignKey: "id_affectation", as: "seance" });
Presence.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
SignalementPresence.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
SignalementPresence.belongsTo(Users, { foreignKey: "id_user_lie", as: "lie", targetKey: "id_user" });
SignalementPresence.belongsTo(Affectation, { foreignKey: "id_affectation", as: "seance" });
Users.hasOne(AppareilEtudiant, { foreignKey: "id_user", as: "appareilAppel", onDelete: "CASCADE" });

// Double authentification
Users.hasMany(MfaCodeSecours, { foreignKey: "id_user", as: "codesSecours", onDelete: "CASCADE" });
MfaDefi.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });

// Jeux intégrés : proposés dans un module, progression par joueur
Cours.hasMany(JeuModule, { foreignKey: "id_cours", as: "jeux", onDelete: "CASCADE" });
JeuModule.belongsTo(Cours, { foreignKey: "id_cours", as: "cours" });
Users.hasMany(JeuProgression, { foreignKey: "id_user", as: "progressionsJeux", onDelete: "CASCADE" });
Users.hasOne(JeuProfil, { foreignKey: "id_user", as: "profilJeux", onDelete: "CASCADE" });
Users.hasMany(PasserelleWeb, { foreignKey: "id_user", as: "passerellesWeb", onDelete: "CASCADE" });

// Annonces ciblées (R1)
Annonce.belongsTo(Users, { foreignKey: "id_user_auteur", as: "auteur", targetKey: "id_user" });
Annonce.hasMany(AnnonceDestinataire, { foreignKey: "id_annonce", as: "destinataires", onDelete: "CASCADE" });
Annonce.hasOne(AnnoncePieceJointe, { foreignKey: "id_annonce", as: "pieceJointe", onDelete: "CASCADE" });
AnnonceDestinataire.belongsTo(Annonce, { foreignKey: "id_annonce", as: "annonce" });
AnnonceDestinataire.belongsTo(Users, { foreignKey: "id_user", as: "user", targetKey: "id_user" });

// Push (D3) : chaque notification part aussi vers les appareils du destinataire, une fois validée
// la transaction qui l'a créée (jamais pour un changement finalement annulé).
Notification.afterCreate((notification, options) => {
    const planifier = () => planifierPush(notification.id_user, { titre: notification.titre, message: notification.message, lien: notification.lien });
    if (options.transaction) options.transaction.afterCommit(planifier);
    else planifier();
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
    AuthSession,
    GenerationSession,
    PlanningSnapshot,
    Campus,
    TrajetCampus,
    AnneeUniversitaire,
    Periode,
    ParametrePlanning,
    CoursComposante,
    Enseignement,
    EnseignementGroupe,
    CompetenceEnseignant,
    EnseignementEnseignant,
    ResponsableFiliere,
    Reservation,
    ReservationParticipant,
    SessionExamen,
    SessionExamenGroupe,
    SessionExamenSalle,
    Surveillance,
    RetourSeance,
    RetourSeanceParticipation,
    PushToken,
    OidcPayload,
    QuizPartie,
    QuizResultat,
    Devoir,
    DevoirRendu,
    FichierDevoir,
    AbonnementCalendrier,
    EnvoiEdt,
    AppelSeance,
    Presence,
    SignalementPresence,
    AppareilEtudiant,
    MfaCodeSecours,
    JournalSecurite,
    GenerationQuiz,
    MfaDefi,
    JeuModule,
    JeuProgression,
    JeuProfil,
    PasserelleWeb,
    Annonce,
    AnnonceDestinataire,
    AnnoncePieceJointe,
};
