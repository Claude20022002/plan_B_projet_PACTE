import { Op } from "sequelize";
import {
    Appartenir,
    Cours,
    CoursComposante,
    Creneau,
    DemandeReport,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    Periode,
    ResponsableFiliere,
} from "../../models/index.js";
import { compteOuErreur, dateEffet, seancesFutures } from "./regles.js";

/**
 * Aperçu d'une désactivation (« aperçu puis appliquer », plan, fichier 11, § 11.2) : ce que la
 * désactivation d'un compte touche à partir de sa date d'effet. Rien n'est modifié ici.
 *  - enseignant : séances encore à faire (bloquantes tant qu'elles ne sont ni confiées à un
 *    remplaçant ni annulées), services engagés, responsabilités de filière et de module,
 *    demandes de report en cours ;
 *  - étudiant : groupes, avec l'effectif saisi que la désactivation rendra trop élevé.
 */

const DEMANDES_EN_COURS = ["en_attente", "a_confirmer", "a_reprogrammer"];

const seance = (s) => ({
    id_affectation: s.id_affectation,
    date: s.date_seance,
    heure_debut: s.creneau ? String(s.creneau.heure_debut).slice(0, 5) : null,
    heure_fin: s.creneau ? String(s.creneau.heure_fin).slice(0, 5) : null,
    module: s.cours?.nom_cours ?? null,
    groupe: s.groupe?.nom_groupe ?? null,
});

/** Ce qui concerne l'enseignement : séances, services, responsabilités, demandes. */
const partEnseignant = async (idUser, depuis) => {
    const [seances, services, filieres, modules, demandes] = await Promise.all([
        seancesFutures(idUser, depuis, {
            include: [
                { model: Creneau, as: "creneau", attributes: ["heure_debut", "heure_fin"] },
                { model: Cours, as: "cours", attributes: ["nom_cours"] },
                { model: Groupe, as: "groupe", attributes: ["nom_groupe"] },
            ],
        }),
        EnseignementEnseignant.findAll({
            where: { id_user: idUser, statut_service: { [Op.ne]: "refuse" } },
            include: [
                {
                    model: Enseignement,
                    as: "enseignement",
                    required: true,
                    include: [
                        { model: Periode, as: "periode", required: true, where: { date_fin: { [Op.gte]: depuis } }, attributes: ["code", "date_fin"] },
                        { model: CoursComposante, as: "composante", attributes: ["type"], include: [{ model: Cours, as: "cours", attributes: ["nom_cours"] }] },
                    ],
                },
            ],
        }),
        ResponsableFiliere.findAll({ where: { id_user: idUser }, include: [{ model: Filiere, as: "filiere", attributes: ["code_filiere", "nom_filiere"] }] }),
        Cours.findAll({ where: { id_responsable: idUser }, attributes: ["id_cours", "code_cours", "nom_cours"] }),
        DemandeReport.count({ where: { id_user_enseignant: idUser, statut_demande: DEMANDES_EN_COURS } }),
    ]);
    return {
        seances: seances.map(seance),
        services: services.map((s) => ({
            id_enseignement: s.id_enseignement,
            module: s.enseignement.composante?.cours?.nom_cours ?? null,
            nature: s.enseignement.composante?.type ?? null,
            periode: s.enseignement.periode.code,
            statut: s.statut_service,
        })),
        responsabilites: {
            filieres: filieres.map((r) => ({ id_filiere: r.id_filiere, code: r.filiere?.code_filiere, nom: r.filiere?.nom_filiere })),
            modules: modules.map((c) => ({ id_cours: c.id_cours, code: c.code_cours, nom: c.nom_cours })),
        },
        demandes_report_en_cours: demandes,
    };
};

/** Groupes d'un étudiant, avec leur effectif saisi (utilisé par le solveur pour la capacité). */
const partEtudiant = async (idUser) => {
    const appartenances = await Appartenir.findAll({
        where: { id_user_etudiant: idUser },
        include: [{ model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "effectif", "annee_scolaire"] }],
    });
    return { groupes: appartenances.filter((a) => a.groupe).map((a) => a.groupe.get({ plain: true })) };
};

/** Aperçu complet, à afficher avant « Désactiver ». */
export const apercuDesactivation = async (idUser, { date } = {}) => {
    const depuis = dateEffet(date);
    const user = await compteOuErreur(idUser);
    const base = {
        compte: {
            id_user: user.id_user,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
            actif: user.actif,
            desactivation_prevue_le: user.desactivation_prevue_le,
            desactivation_motif: user.desactivation_motif,
        },
        date_effet: depuis,
    };
    if (user.role === "enseignant") {
        const enseignant = await partEnseignant(user.id_user, depuis);
        return { ...base, ...enseignant, a_traiter: enseignant.seances.length };
    }
    if (user.role === "etudiant") return { ...base, ...(await partEtudiant(user.id_user)), a_traiter: 0 };
    return { ...base, a_traiter: 0 };
};
