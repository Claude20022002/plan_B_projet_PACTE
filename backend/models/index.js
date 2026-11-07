import sequelize from "../config/db.js";
import * as definitions from "./definitions.js";
import { definirParDefaut } from "../contexte/etablissement.js";
import { resolveur } from "../contexte/resolveur.js";

/**
 * Modèles de l'application (essai réduit de ME-3a, D-03). Les définitions et les relations sont dans
 * definitions.js ; ce fichier n'exporte que des résolveurs : chaque nom renvoie, à chaque accès, le
 * modèle de l'établissement courant (contexte/etablissement.js). Les 127 fichiers qui importent
 * « ../models/index.js » ne changent pas.
 *
 * L'établissement par défaut est celui de config/db.js, avec les modèles de definitions.js : c'est
 * l'école d'aujourd'hui, utilisée hors contexte tant que le mode strict est éteint.
 */
definirParDefaut({ nom: "defaut", sequelize, modeles: definitions });

export const Users = resolveur("Users");
export const User = resolveur("User");
export const Enseignant = resolveur("Enseignant");
export const Etudiant = resolveur("Etudiant");
export const Filiere = resolveur("Filiere");
export const Groupe = resolveur("Groupe");
export const Salle = resolveur("Salle");
export const Cours = resolveur("Cours");
export const Creneau = resolveur("Creneau");
export const Affectation = resolveur("Affectation");
export const DemandeReport = resolveur("DemandeReport");
export const Conflit = resolveur("Conflit");
export const Notification = resolveur("Notification");
export const HistoriqueAffectation = resolveur("HistoriqueAffectation");
export const Disponibilite = resolveur("Disponibilite");
export const ConflitAffectation = resolveur("ConflitAffectation");
export const Appartenir = resolveur("Appartenir");
export const PasswordResetToken = resolveur("PasswordResetToken");
export const Evenement = resolveur("Evenement");
export const AuthSession = resolveur("AuthSession");
export const GenerationSession = resolveur("GenerationSession");
export const PlanningSnapshot = resolveur("PlanningSnapshot");
export const Campus = resolveur("Campus");
export const TrajetCampus = resolveur("TrajetCampus");
export const AnneeUniversitaire = resolveur("AnneeUniversitaire");
export const Periode = resolveur("Periode");
export const ParametrePlanning = resolveur("ParametrePlanning");
export const CoursComposante = resolveur("CoursComposante");
export const Enseignement = resolveur("Enseignement");
export const EnseignementGroupe = resolveur("EnseignementGroupe");
export const CompetenceEnseignant = resolveur("CompetenceEnseignant");
export const EnseignementEnseignant = resolveur("EnseignementEnseignant");
export const ResponsableFiliere = resolveur("ResponsableFiliere");
export const Reservation = resolveur("Reservation");
export const ReservationParticipant = resolveur("ReservationParticipant");
export const SessionExamen = resolveur("SessionExamen");
export const SessionExamenGroupe = resolveur("SessionExamenGroupe");
export const SessionExamenSalle = resolveur("SessionExamenSalle");
export const Surveillance = resolveur("Surveillance");
export const RetourSeance = resolveur("RetourSeance");
export const RetourSeanceParticipation = resolveur("RetourSeanceParticipation");
export const VisaSeance = resolveur("VisaSeance");
export const PushToken = resolveur("PushToken");
export const OidcPayload = resolveur("OidcPayload");
export const QuizPartie = resolveur("QuizPartie");
export const QuizResultat = resolveur("QuizResultat");
export const Devoir = resolveur("Devoir");
export const DevoirRendu = resolveur("DevoirRendu");
export const FichierDevoir = resolveur("FichierDevoir");
export const AbonnementCalendrier = resolveur("AbonnementCalendrier");
export const EnvoiEdt = resolveur("EnvoiEdt");
export const AppelSeance = resolveur("AppelSeance");
export const Presence = resolveur("Presence");
export const SignalementPresence = resolveur("SignalementPresence");
export const AppareilEtudiant = resolveur("AppareilEtudiant");
export const DemandeTelephone = resolveur("DemandeTelephone");
export const ConfigurationEtablissement = resolveur("ConfigurationEtablissement");
export const Desactivation = resolveur("Desactivation");
export const SectionCours = resolveur("SectionCours");
export const SupportCours = resolveur("SupportCours");
export const MfaCodeSecours = resolveur("MfaCodeSecours");
export const JournalSecurite = resolveur("JournalSecurite");
export const GenerationQuiz = resolveur("GenerationQuiz");
export const MfaDefi = resolveur("MfaDefi");
export const JeuModule = resolveur("JeuModule");
export const JeuProgression = resolveur("JeuProgression");
export const JeuProfil = resolveur("JeuProfil");
export const PasserelleWeb = resolveur("PasserelleWeb");
export const Annonce = resolveur("Annonce");
export const AnnonceDestinataire = resolveur("AnnonceDestinataire");
export const AnnoncePieceJointe = resolveur("AnnoncePieceJointe");
export const Questionnaire = resolveur("Questionnaire");
export const QuestionQuiz = resolveur("QuestionQuiz");
export const MediaQuiz = resolveur("MediaQuiz");
export const SessionQuiz = resolveur("SessionQuiz");
export const TentativeQuiz = resolveur("TentativeQuiz");
export const UsageIaQuiz = resolveur("UsageIaQuiz");
export const SessionJeu = resolveur("SessionJeu");
export const ParticipationJeu = resolveur("ParticipationJeu");
export const PropositionJeu = resolveur("PropositionJeu");
export const JoueurDirect = resolveur("JoueurDirect");
export const ReponseDirect = resolveur("ReponseDirect");
