import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    Appartenir,
    Campus,
    Conflit,
    Cours,
    CoursComposante,
    Creneau,
    DemandeReport,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Evenement,
    Filiere,
    Groupe,
    HistoriqueAffectation,
    Notification,
    ParametrePlanning,
    Salle,
} from "../../models/index.js";

/**
 * Phase B — règles d'une séance : refus 409 avec la liste des violations, forçage justifié
 * par l'administration, conflits ouverts puis résolus, reports soumis aux mêmes règles.
 */

let admin;
let profA;
let profB;
let vacataire;
let etudiant;
let clients;
let ref;

// Lundi 1er mars 2027 et le mardi suivant : dates futures, sans férié
const LUNDI = "2027-03-01";
const MARDI = "2027-03-02";
const VENDREDI = "2027-03-05";

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    profA = await createUser("enseignant");
    profB = await createUser("enseignant");
    vacataire = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    await Enseignant.update({ statut: "vacataire" }, { where: { id_user: vacataire.id_user } });
    clients = { admin: await loginAs(admin), profA: await loginAs(profA) };

    const [gandhi, stendhal] = await Promise.all([Campus.findOne({ where: { code: "G" } }), Campus.findOne({ where: { code: "ST" } })]);
    const filiere = await Filiere.create({ code_filiere: "RGL", nom_filiere: "Règles" });
    const promo = await Groupe.create({ nom_groupe: "4A RGL", niveau: "4ème année", annee: 4, effectif: 30, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const td1 = await Groupe.create({ nom_groupe: "RGL-4A", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const td2 = await Groupe.create({ nom_groupe: "RGL-4B", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const tp = await Groupe.create({ nom_groupe: "RGL-4A1", niveau: "4ème année", annee: 4, effectif: 8, annee_scolaire: "2026-2027", type_groupe: "tp", id_groupe_parent: td1.id_groupe, id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td1.id_groupe });

    const salle = (nom, extra) => Salle.create({ nom_salle: nom, type_salle: "Salle de cours", capacite: 40, id_campus: gandhi.id_campus, ...extra });
    const salles = {
        g1: await salle("G-R1"),
        g2: await salle("G-R2"),
        st: await salle("ST-R1", { id_campus: stendhal.id_campus }),
        petite: await salle("G-PETITE", { capacite: 10 }),
        labo: await salle("G-LAB", { type_salle: "Labo informatique", capacite: 30 }),
    };
    const creneau = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    const creneaux = {
        lun1: await creneau("lundi", "09:00", "10:45", 1),
        lun2: await creneau("lundi", "11:00", "12:30", 2),
        lun3: await creneau("lundi", "13:30", "15:15", 3),
        lun4: await creneau("lundi", "15:30", "17:00", 4),
        mar1: await creneau("mardi", "09:00", "10:45", 1),
        venMidi: await creneau("vendredi", "12:00", "13:30", 5),
    };
    const cours = await Cours.create({ code_cours: "RGL-NOSQL", nom_cours: "Bases NoSQL", niveau: "4ème année", volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    ref = { filiere, promo, td1, td2, tp, salles, creneaux, cours };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const seance = (extra = {}) => ({
    date_seance: LUNDI,
    id_cours: ref.cours.id_cours,
    id_groupe: ref.td2.id_groupe,
    id_user_enseignant: profA.id_user,
    id_salle: ref.salles.g1.id_salle,
    id_creneau: ref.creneaux.lun1.id_creneau,
    ...extra,
});
const creer = (extra) => clients.admin.send("post", "/api/affectations", seance(extra));
const codes = (response) => (response.body.violations || []).filter((v) => v.bloquant).map((v) => v.code);

describe("Règles bloquantes : 409 et liste des violations", () => {
    let premiere;

    test("une séance conforme est créée et tracée dans l'historique", async () => {
        const response = await creer();
        expect(response.status).toBe(201);
        expect(response.body.force).toBe(false);
        premiere = response.body.affectation;
        expect(await HistoriqueAffectation.count({ where: { id_affectation: premiere.id_affectation, action: "creation", force: false } })).toBe(1);
    });

    test("même salle, même enseignant, même groupe au même moment : refusé, rien n'est créé", async () => {
        const avant = await Affectation.count();
        const salle = await creer({ id_groupe: ref.td1.id_groupe, id_user_enseignant: profB.id_user });
        expect(salle.status).toBe(409);
        expect(codes(salle)).toEqual(["conflit_salle"]);

        const prof = await creer({ id_groupe: ref.td1.id_groupe, id_salle: ref.salles.g2.id_salle });
        expect(codes(prof)).toEqual(["conflit_enseignant"]);

        const groupe = await creer({ id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle });
        expect(codes(groupe)).toEqual(["conflit_groupe"]);
        expect(await Affectation.count()).toBe(avant);
    });

    test("hiérarchie : un CM de la promotion pendant un TP de l'un de ses groupes est refusé", async () => {
        const tp = await creer({ id_groupe: ref.tp.id_groupe, id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: ref.creneaux.lun3.id_creneau });
        expect(tp.status).toBe(201);
        const cm = await creer({ id_groupe: ref.promo.id_groupe, id_salle: ref.salles.labo.id_salle, id_creneau: ref.creneaux.lun3.id_creneau });
        expect(cm.status).toBe(409);
        expect(codes(cm)).toContain("conflit_groupe");
    });

    test("jour du créneau, date passée, capacité, type de salle", async () => {
        expect(codes(await creer({ id_creneau: ref.creneaux.mar1.id_creneau, id_groupe: ref.td1.id_groupe, id_salle: ref.salles.g2.id_salle, id_user_enseignant: profB.id_user }))).toContain("jour_creneau");
        expect(codes(await creer({ date_seance: "2025-03-03", id_groupe: ref.td1.id_groupe, id_salle: ref.salles.g2.id_salle, id_user_enseignant: profB.id_user }))).toEqual(["date_passee"]);
        expect(codes(await creer({ id_groupe: ref.td1.id_groupe, id_salle: ref.salles.petite.id_salle, id_user_enseignant: profB.id_user }))).toEqual(["capacite"]);

        const tp = await CoursComposante.create({ id_cours: ref.cours.id_cours, type: "TP", volume_heures: 9, niveau_groupe: "td", type_salle_requis: "Labo informatique" });
        const enseignement = await Enseignement.create({ id_composante: tp.id_composante, heures_prevues: 9 });
        await enseignement.setGroupes([ref.td1.id_groupe]);
        const mauvaiseSalle = await creer({ id_enseignement: enseignement.id_enseignement, id_groupe: ref.td1.id_groupe, id_salle: ref.salles.g2.id_salle, id_user_enseignant: profB.id_user, id_creneau: ref.creneaux.lun4.id_creneau });
        expect(codes(mauvaiseSalle)).toEqual(["type_salle"]);
        // L'enseignant hors de l'équipe n'est qu'un avertissement
        expect(mauvaiseSalle.body.violations.find((v) => v.code === "hors_equipe")).toMatchObject({ bloquant: false });
    });

    test("vacataire sans disponibilité déclarée : refusé ; permanent sans déclaration : accepté", async () => {
        const vac = await creer({ id_groupe: ref.td1.id_groupe, id_salle: ref.salles.g2.id_salle, id_user_enseignant: vacataire.id_user, id_creneau: ref.creneaux.lun2.id_creneau });
        expect(codes(vac)).toEqual(["enseignant_indisponible"]);
    });

    test("deux séances qui se suivent sur deux campus sans le temps de trajet : refusé", async () => {
        // TD2 a cours à Gandhi de 9 h à 10 h 45 ; 15 min ne suffisent pas pour Stendhal (30 min par défaut)
        const response = await creer({ id_user_enseignant: profB.id_user, id_salle: ref.salles.st.id_salle, id_creneau: ref.creneaux.lun2.id_creneau });
        expect(codes(response)).toEqual(["trajet_campus"]);
    });

    test("événement bloquant de la filière et pause du vendredi midi", async () => {
        await Evenement.create({ titre: "Journée projets RGL", date_debut: MARDI, date_fin: MARDI, type_evenement: "autre", portee: "filiere", id_cible: ref.filiere.id_filiere, bloque_affectations: true, id_user_createur: admin.id_user });
        expect(codes(await creer({ date_seance: MARDI, id_creneau: ref.creneaux.mar1.id_creneau }))).toEqual(["evenement"]);
        expect(codes(await creer({ date_seance: VENDREDI, id_creneau: ref.creneaux.venMidi.id_creneau }))).toEqual(["pause_vendredi"]);
    });

    test("maximum d'heures par jour pour un groupe", async () => {
        await ParametrePlanning.upsert({ cle: "max_heures_jour_groupe", valeur: 3 });
        // TD2 a déjà 1 h 45 lundi ; 1 h 45 de plus dépasse 3 h
        const response = await creer({ id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: ref.creneaux.lun4.id_creneau });
        expect(codes(response)).toEqual(["max_heures_groupe"]);
        await ParametrePlanning.destroy({ where: { cle: "max_heures_jour_groupe" } });
    });

    test("la vérification renvoie les violations sans rien créer", async () => {
        const avant = await Affectation.count();
        const response = await clients.admin.send("post", "/api/affectations/verifier", seance());
        expect(response.status).toBe(200);
        expect(response.body.bloquant).toBe(true);
        expect(response.body.violations.map((v) => v.code)).toEqual(expect.arrayContaining(["conflit_salle", "conflit_enseignant", "conflit_groupe"]));
        expect(await Affectation.count()).toBe(avant);
    });

    test("modifier le commentaire d'une séance ne la revalide pas", async () => {
        const response = await clients.admin.send("put", `/api/affectations/${premiere.id_affectation}`, { commentaire: "Apporter les ordinateurs" });
        expect(response.status).toBe(200);
    });
});

describe("Co-enseignement : les deux enseignants sont bloqués", () => {
    test("le co-enseignant d'un enseignement ne peut pas avoir cours ailleurs au même moment", async () => {
        const projet = await CoursComposante.create({ id_cours: ref.cours.id_cours, type: "Projet", volume_heures: 30, niveau_groupe: "td" });
        const enseignement = await Enseignement.create({ id_composante: projet.id_composante, heures_prevues: 30 });
        await enseignement.setGroupes([ref.td2.id_groupe]);
        await EnseignementEnseignant.bulkCreate([
            { id_enseignement: enseignement.id_enseignement, id_user: profA.id_user, role: "principal", statut_service: "accepte" },
            { id_enseignement: enseignement.id_enseignement, id_user: profB.id_user, role: "co_enseignant", statut_service: "accepte" },
        ]);
        const ok = await creer({ date_seance: "2027-03-08", id_enseignement: enseignement.id_enseignement });
        expect(ok.status).toBe(201);
        const ailleurs = await creer({ date_seance: "2027-03-08", id_groupe: ref.td1.id_groupe, id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle });
        expect(codes(ailleurs)).toEqual(["conflit_enseignant"]);
    });
});

describe("Forçage par l'administration", () => {
    let forcee;

    test("forcer exige une justification", async () => {
        const response = await creer({ id_groupe: ref.td1.id_groupe, id_user_enseignant: profB.id_user, forcer: true });
        expect(response.status).toBe(400);
    });

    test("avec justification : créée, tracée, conflit ouvert", async () => {
        const response = await creer({ id_groupe: ref.td1.id_groupe, id_user_enseignant: profB.id_user, forcer: true, justification: "Salle partagée exceptionnellement (soutenance)" });
        expect(response.status).toBe(201);
        expect(response.body.force).toBe(true);
        forcee = response.body.affectation;
        const historique = await HistoriqueAffectation.findOne({ where: { id_affectation: forcee.id_affectation } });
        expect(historique).toMatchObject({ force: true, commentaire: expect.stringContaining("soutenance") });
        const conflits = await Conflit.findAll({ where: { resolu: false, type_conflit: "salle" }, include: ["affectations"] });
        expect(conflits.some((c) => c.affectations.some((a) => a.id_affectation === forcee.id_affectation))).toBe(true);
    });

    test("annuler la séance forcée résout son conflit et prévient les étudiants du groupe", async () => {
        const response = await clients.admin.send("put", `/api/affectations/${forcee.id_affectation}`, { statut: "annule" });
        expect(response.status).toBe(200);
        const ouverts = await Conflit.findAll({ where: { resolu: false }, include: [{ association: "affectations", where: { id_affectation: forcee.id_affectation } }] });
        expect(ouverts).toHaveLength(0);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Séance annulée" } })).toBe(1);
        expect(await HistoriqueAffectation.count({ where: { id_affectation: forcee.id_affectation, action: "annulation" } })).toBe(1);
    });

    test("un enseignant ne force rien (création réservée à l'administration)", async () => {
        const response = await clients.profA.send("post", "/api/affectations", seance({ forcer: true, justification: "x" }));
        expect(response.status).toBe(403);
    });
});

describe("Reports soumis aux règles", () => {
    let seanceReportee;

    beforeAll(async () => {
        seanceReportee = (await creer({ date_seance: "2027-03-15", id_groupe: ref.promo.id_groupe, id_salle: ref.salles.labo.id_salle })).body.affectation;
    });

    test("approuvé : la séance passe au créneau de même rang le nouveau jour, l'origine est gardée", async () => {
        const demande = await clients.profA.send("post", "/api/demandes-report", { id_affectation: seanceReportee.id_affectation, motif: "Jury externe", nouvelle_date: "2027-03-16" });
        expect(demande.status).toBe(201);
        const response = await clients.admin.send("patch", `/api/demandes-report/${demande.body.id_demande}/traiter`, { action: "approuver" });
        expect(response.status).toBe(200);
        const apres = await Affectation.findByPk(seanceReportee.id_affectation);
        expect(apres).toMatchObject({
            date_seance: "2027-03-16",
            id_creneau: ref.creneaux.mar1.id_creneau,
            statut: "reporte",
            date_seance_initiale: "2027-03-15",
            id_creneau_initial: ref.creneaux.lun1.id_creneau,
        });
        expect(await HistoriqueAffectation.count({ where: { id_affectation: seanceReportee.id_affectation, action: "report" } })).toBe(1);
        // L'étudiant d'un TD de la promotion est prévenu
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Séance reportée" } })).toBe(1);
    });

    test("un report vers un créneau occupé est refusé et la demande reste en attente", async () => {
        const occupante = await creer({ date_seance: "2027-03-22", id_groupe: ref.td1.id_groupe, id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle });
        expect(occupante.status).toBe(201);
        const autre = (await creer({ date_seance: "2027-03-29", id_groupe: ref.td1.id_groupe, id_user_enseignant: profA.id_user, id_salle: ref.salles.g1.id_salle })).body.affectation;
        const demande = await clients.profA.send("post", "/api/demandes-report", { id_affectation: autre.id_affectation, motif: "Déplacement", nouvelle_date: "2027-03-22" });
        const response = await clients.admin.send("patch", `/api/demandes-report/${demande.body.id_demande}/traiter`, { action: "approuver" });
        expect(response.status).toBe(409);
        expect(codes(response)).toContain("conflit_groupe");
        expect((await DemandeReport.findByPk(demande.body.id_demande)).statut_demande).toBe("en_attente");
        expect((await Affectation.findByPk(autre.id_affectation)).date_seance).toBe("2027-03-29");
    });
});
