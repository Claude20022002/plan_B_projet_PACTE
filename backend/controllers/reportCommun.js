import { Affectation, Cours, Creneau, DemandeReport, Groupe, Salle, Users } from "../models/index.js";
import { dateLisible } from "../services/planning/reports.js";
import { repondreErreur } from "../utils/erreurs.js";

/**
 * Ce que partagent les contrôleurs des demandes de report : la demande renvoyée aux écrans (séance,
 * enseignant, place retenue) et la réponse « aucun créneau libre ».
 */

const SANS_MOT_DE_PASSE = { exclude: ["password_hash"] };

// Créneau et salle retenus pour le report, joints aux demandes renvoyées
const PLACE_RETENUE = [
    { model: Creneau, as: "creneauNouveau" },
    { model: Salle, as: "salleNouvelle", attributes: ["id_salle", "nom_salle"] },
];

// La séance concernée, avec ce qu'en affichent les écrans
const SEANCE = {
    model: Affectation,
    as: "affectation",
    include: [
        { model: Cours, as: "cours" },
        { model: Groupe, as: "groupe" },
        { model: Users, as: "enseignant", attributes: SANS_MOT_DE_PASSE },
        { model: Salle, as: "salle" },
        { model: Creneau, as: "creneau" },
    ],
};

/** Inclusions d'une demande complète ; `avecEnseignant` : l'enseignant demandeur (inutile dans sa propre liste). */
export const inclusionsDemande = ({ avecEnseignant = true } = {}) => [
    ...PLACE_RETENUE,
    ...(avecEnseignant ? [{ model: Users, as: "enseignant", attributes: SANS_MOT_DE_PASSE }] : []),
    SEANCE,
];

/** La demande telle que les écrans la lisent. */
export const demandeComplete = (id) => DemandeReport.findByPk(id, { include: inclusionsDemande() });

export const LIBELLE_REFUS = "Aucun créneau libre ce jour-là";

/** Réponse 422 : pas de place à cette date (ou le créneau choisi est pris) ; ce qui reste libre, pour ne pas laisser sans issue. */
export const repondreSansCreneau = (res, date, resultat) =>
    repondreErreur(res, 422, `${LIBELLE_REFUS} (${dateLisible(date)}).`, {
        code: "AUCUN_CRENEAU_LIBRE",
        donnees: { propositions: resultat.propositions, dates_proches: resultat.dates_proches, refus: resultat.refus },
    });
