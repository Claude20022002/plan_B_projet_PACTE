import { Op } from "sequelize";
import {
    Affectation,
    AnneeUniversitaire,
    Conflit,
    Cours,
    CoursComposante,
    Disponibilite,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Evenement,
    Filiere,
    Groupe,
    Periode,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS } from "./affectationRules.js";
import { anneeDepuisNiveau, periodeDuSemestre } from "../../config/referentiel.js";
import { filieresDuResponsable } from "./droits.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Assistant « Préparer le semestre » (phase P4) : état des 8 étapes par filière, calculé à partir
 * des données (rien n'est coché à la main). Le responsable mène les étapes 2 à 5 et 7 pour sa
 * filière ; l'administration les étapes 1, 6 et 8, et voit tout.
 */

const pourcent = (fait, total) => (total ? Math.round((100 * fait) / total) : 0);
const etat = (avancement, total = 1) => (total === 0 ? "a_faire" : avancement >= 100 ? "fait" : avancement > 0 ? "en_cours" : "a_faire");
const normaliserAnnee = (v) => String(v || "").replace("/", "-").trim();

/** Étape 1 (commune) : période datée, fériés et semaine d'examens dans le calendrier. */
const etapeCalendrier = async (periode) => {
    const evenements = await Evenement.findAll({ where: { date_debut: { [Op.lte]: periode.date_fin }, date_fin: { [Op.gte]: periode.date_debut } }, attributes: ["type_evenement", "date_confirmee"] });
    const feries = evenements.filter((e) => e.type_evenement === "ferie").length;
    const examens = evenements.filter((e) => e.type_evenement === "examen").length;
    const aConfirmer = evenements.filter((e) => e.date_confirmee === false).length;
    const avancement = 50 + (feries ? 25 : 0) + (examens ? 25 : 0);
    return { cle: "calendrier", avancement, etat: etat(avancement), detail: { feries, examens, a_confirmer: aConfirmer }, lien: "/gestion/calendrier" };
};

/**
 * Données de l'assistant pour plusieurs filières, lues en une passe (une requête par nature de
 * donnée, quel que soit le nombre de filières) puis rangées par filière : l'écran ne fait plus
 * une série de requêtes par filière.
 */
const chargerDonnees = async ({ filieres, periode }) => {
    const idsFilieres = filieres.map((f) => f.id_filiere);
    const parFiliere = (liste, cle) => {
        const rangement = new Map(idsFilieres.map((id) => [id, []]));
        for (const element of liste) rangement.get(cle(element))?.push(element);
        return rangement;
    };

    const [cours, groupes, enseignements] = await Promise.all([
        Cours.findAll({ where: { id_filiere: idsFilieres }, include: [{ model: CoursComposante, as: "composantes", attributes: ["id_composante"] }] }),
        Groupe.findAll({ where: { id_filiere: idsFilieres } }),
        Enseignement.findAll({
            where: { id_periode: periode.id_periode },
            include: [
                { model: CoursComposante, as: "composante", required: true, include: [{ model: Cours, as: "cours", required: true, where: { id_filiere: idsFilieres }, attributes: ["id_cours", "id_filiere"] }] },
                { model: EnseignementEnseignant, as: "services", required: false },
            ],
        }),
    ]);
    const filiereDe = new Map(enseignements.map((e) => [e.id_enseignement, e.composante.cours.id_filiere]));

    // Vacataires engagés (toutes filières) et ceux qui ont déclaré des disponibilités sur la période
    const idsEngages = [...new Set(enseignements.flatMap((e) => e.services.filter((s) => s.statut_service !== "refuse").map((s) => s.id_user)))];
    const vacataires = idsEngages.length ? await Enseignant.findAll({ where: { id_user: idsEngages, statut: "vacataire" }, include: [{ model: Users, as: "user", attributes: ["id_user", "nom", "prenom"] }] }) : [];
    const [disponibilites, seances, conflits] = await Promise.all([
        vacataires.length
            ? Disponibilite.findAll({ where: { id_user_enseignant: vacataires.map((v) => v.id_user), disponible: true, date_debut: { [Op.lte]: periode.date_fin }, date_fin: { [Op.gte]: periode.date_debut } }, attributes: ["id_user_enseignant"] })
            : [],
        enseignements.length
            ? Affectation.findAll({
                  where: { id_enseignement: [...filiereDe.keys()], statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [periode.date_debut, periode.date_fin] } },
                  attributes: ["id_affectation", "id_enseignement", "statut"],
              })
            : [],
        // Conflits non résolus touchant une séance de la période : filtrés par jointure (pas de longue liste d'identifiants)
        enseignements.length
            ? Conflit.findAll({
                  where: { resolu: false },
                  attributes: ["id_conflit"],
                  include: [
                      {
                          model: Affectation,
                          as: "affectations",
                          attributes: ["id_affectation", "id_enseignement"],
                          through: { attributes: [] },
                          where: { id_enseignement: [...filiereDe.keys()], statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [periode.date_debut, periode.date_fin] } },
                      },
                  ],
              })
            : [],
    ]);
    const declarants = new Set(disponibilites.map((d) => d.id_user_enseignant));

    return {
        cours: parFiliere(cours, (c) => c.id_filiere),
        groupes: parFiliere(groupes, (g) => g.id_filiere),
        enseignements: parFiliere(enseignements, (e) => filiereDe.get(e.id_enseignement)),
        seances: parFiliere(seances, (s) => filiereDe.get(s.id_enseignement)),
        // Un conflit compte une fois pour chaque filière dont il touche une séance
        conflits: new Map(idsFilieres.map((id) => [id, conflits.filter((c) => c.affectations.some((a) => filiereDe.get(a.id_enseignement) === id)).length])),
        vacataires: new Map(vacataires.map((v) => [v.id_user, v])),
        declarants,
    };
};

const etapesFiliere = ({ filiere, periode, anneeScolaire, donnees }) => {
    const modules = donnees.cours.get(filiere.id_filiere).filter((c) => periodeDuSemestre(c.semestre) === periode.code);
    const avecComposantes = modules.filter((m) => m.composantes.length).length;
    const maquette = pourcent(avecComposantes, modules.length);

    const groupes = donnees.groupes.get(filiere.id_filiere).filter((g) => normaliserAnnee(g.annee_scolaire) === anneeScolaire);
    const anneesAttendues = [...new Set(modules.map((m) => anneeDepuisNiveau(m.niveau)).filter(Boolean))];
    const anneesCouvertes = anneesAttendues.filter((a) => groupes.some((g) => g.type_groupe === "promotion" && (g.annee ?? anneeDepuisNiveau(g.niveau)) === a && g.effectif > 0));
    const groupesEtape = pourcent(anneesCouvertes.length, anneesAttendues.length);

    const enseignements = donnees.enseignements.get(filiere.id_filiere);
    const pourvus = enseignements.filter((e) => e.services.some((s) => s.role === "principal" && s.statut_service === "accepte")).length;
    const aAccepter = enseignements.filter((e) => e.services.some((s) => s.statut_service === "propose")).length;
    const services = pourcent(pourvus, enseignements.length);

    // Vacataires engagés sur la filière : il faut leurs disponibilités (opt-in)
    const idsEngages = [...new Set(enseignements.flatMap((e) => e.services.filter((s) => s.statut_service !== "refuse").map((s) => s.id_user)))];
    const vacataires = idsEngages.map((id) => donnees.vacataires.get(id)).filter(Boolean);
    const sansDispo = vacataires.filter((v) => !donnees.declarants.has(v.id_user));
    const disponibilites = vacataires.length ? pourcent(vacataires.length - sansDispo.length, vacataires.length) : enseignements.length ? 100 : 0;

    const seances = donnees.seances.get(filiere.id_filiere);
    const planifies = new Set(seances.map((s) => s.id_enseignement)).size;
    const generation = pourcent(planifies, enseignements.length);

    const conflits = donnees.conflits.get(filiere.id_filiere);
    const revue = generation === 0 ? 0 : conflits ? 50 : 100;
    const publication = generation === 100 && conflits === 0 ? 100 : 0;

    return [
        { cle: "maquette", avancement: maquette, etat: etat(maquette, modules.length), detail: { modules: modules.length, sans_composante: modules.length - avecComposantes }, lien: "/gestion/cours" },
        { cle: "groupes", avancement: groupesEtape, etat: etat(groupesEtape, anneesAttendues.length), detail: { annees_attendues: anneesAttendues, annees_sans_promotion: anneesAttendues.filter((a) => !anneesCouvertes.includes(a)) }, lien: "/gestion/groupes" },
        { cle: "services", avancement: services, etat: etat(services, enseignements.length), detail: { enseignements: enseignements.length, pourvus, a_accepter: aAccepter }, lien: "/gestion/enseignements" },
        {
            cle: "disponibilites",
            avancement: disponibilites,
            etat: etat(disponibilites, vacataires.length || enseignements.length),
            detail: { vacataires: vacataires.length, sans_disponibilite: sansDispo.map((v) => ({ id_user: v.id_user, nom: v.user.nom, prenom: v.user.prenom })) },
            lien: "/gestion/enseignants",
        },
        { cle: "generation", avancement: generation, etat: etat(generation, enseignements.length), detail: { planifies, seances: seances.length }, lien: "/gestion/generation-automatique" },
        { cle: "revue", avancement: revue, etat: etat(revue), detail: { conflits }, lien: "/gestion/conflits" },
        { cle: "publication", avancement: publication, etat: etat(publication), detail: { confirmees: seances.filter((s) => s.statut === "confirme").length }, lien: "/gestion/emplois-du-temps" },
    ];
};

export const etatPreparation = async ({ id_periode, user }) => {
    const periode = await Periode.findByPk(id_periode, { include: [{ model: AnneeUniversitaire, as: "annee" }] });
    if (!periode) throw new ErreurMetier("Période introuvable", 404);
    const anneeScolaire = normaliserAnnee(periode.annee?.libelle);
    const ids = user.role === "admin" ? null : await filieresDuResponsable(user.id_user);
    const filieres = await Filiere.findAll({ where: ids ? { id_filiere: ids } : {}, order: [["code_filiere", "ASC"]] });
    const [calendrier, donnees] = await Promise.all([etapeCalendrier(periode), chargerDonnees({ filieres, periode })]);

    const lignes = [];
    for (const filiere of filieres) {
        const etapes = [calendrier, ...etapesFiliere({ filiere, periode, anneeScolaire, donnees })];
        lignes.push({
            filiere: { id_filiere: filiere.id_filiere, code_filiere: filiere.code_filiere, nom_filiere: filiere.nom_filiere },
            avancement: Math.round(etapes.reduce((t, e) => t + e.avancement, 0) / etapes.length),
            etapes,
        });
    }
    return { periode: { id_periode: periode.id_periode, code: periode.code, date_debut: periode.date_debut, date_fin: periode.date_fin, annee: periode.annee?.libelle }, filieres: lignes };
};

/** Relance les vacataires engagés sur la filière qui n'ont déclaré aucune disponibilité (étape 5). */
export const relancerVacataires = async ({ id_periode, id_filiere }) => {
    const periode = await Periode.findByPk(id_periode, { include: [{ model: AnneeUniversitaire, as: "annee" }] });
    const filiere = await Filiere.findByPk(id_filiere);
    if (!periode || !filiere) throw new ErreurMetier("Période ou filière introuvable", 404);
    const donnees = await chargerDonnees({ filieres: [filiere], periode });
    const etapes = etapesFiliere({ filiere, periode, anneeScolaire: normaliserAnnee(periode.annee?.libelle), donnees });
    const manquants = etapes.find((e) => e.cle === "disponibilites").detail.sans_disponibilite;
    if (manquants.length) {
        await creerNotificationsMultiples({
            id_users: manquants.map((m) => m.id_user),
            titre: "Déclarez vos disponibilités",
            message: `Pour préparer le semestre ${periode.code} en ${filiere.code_filiere}, indiquez vos créneaux disponibles du ${periode.date_debut} au ${periode.date_fin} : sans eux, aucun cours ne peut vous être placé.`,
            type_notification: "warning",
            lien: "/disponibilites",
        });
    }
    return { relances: manquants.length, vacataires: manquants };
};
