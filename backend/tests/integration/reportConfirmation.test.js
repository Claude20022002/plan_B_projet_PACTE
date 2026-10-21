import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Campus, Cours, Creneau, DemandeReport, Filiere, Groupe, HistoriqueAffectation, Notification, Salle } from "../../models/index.js";

/**
 * Report confirmé par l'enseignant (décision du 21 octobre 2026) : après la validation de
 * l'administration, l'enseignant accepte, ou propose un autre créneau que le serveur vérifie
 * (groupe, enseignant, salles). Le circuit nominal est dans regles.test.js.
 */

let admin;
let profA;
let profB;
let clients;
let ref;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    profA = await createUser("enseignant");
    profB = await createUser("enseignant");
    clients = { admin: await loginAs(admin), profA: await loginAs(profA), profB: await loginAs(profB) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "CNF", nom_filiere: "Confirmation" });
    const promo = await Groupe.create({ nom_groupe: "4A CNF", niveau: "4ème année", annee: 4, effectif: 30, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const td1 = await Groupe.create({ nom_groupe: "CNF-4A", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const td2 = await Groupe.create({ nom_groupe: "CNF-4B", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    const salle = (nom) => Salle.create({ nom_salle: nom, type_salle: "Salle de cours", capacite: 40, id_campus: gandhi.id_campus });
    const creneau = (jour_semaine, heure_debut, heure_fin, rang) => Creneau.create({ jour_semaine, heure_debut, heure_fin, duree_minutes: 90, rang });
    ref = {
        td1,
        td2,
        salles: { g1: await salle("C-R1"), g2: await salle("C-R2") },
        creneaux: {
            lun1: await creneau("lundi", "09:00", "10:45", 1),
            lun2: await creneau("lundi", "11:00", "12:30", 2),
            lun3: await creneau("lundi", "13:30", "15:15", 3),
            mar1: await creneau("mardi", "09:00", "10:45", 1),
        },
        cours: await Cours.create({ code_cours: "CNF-ALGO", nom_cours: "Algorithmique", niveau: "4ème année", volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere }),
    };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const creer = (extra) =>
    clients.admin.send("post", "/api/affectations", {
        id_cours: ref.cours.id_cours,
        id_groupe: ref.td1.id_groupe,
        id_user_enseignant: profA.id_user,
        id_salle: ref.salles.g1.id_salle,
        id_creneau: ref.creneaux.lun1.id_creneau,
        ...extra,
    });

/** Une séance de profA, sa demande de report, validée par l'administration. */
const reportValide = async (dateSeance, nouvelleDate) => {
    const seance = (await creer({ date_seance: dateSeance })).body.affectation;
    const demande = (await clients.profA.send("post", "/api/demandes-report", { id_affectation: seance.id_affectation, motif: "Colloque", nouvelle_date: nouvelleDate })).body;
    expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { action: "approuver" })).status).toBe(200);
    return { seance, demande, confirmer: (corps, client = clients.profA) => client.send("patch", `/api/demandes-report/${demande.id_demande}/confirmer`, corps) };
};

test("à confirmer : une seule demande par séance, l'enseignant de la séance seul, pas de seconde validation", async () => {
    const { seance, demande, confirmer } = await reportValide("2027-05-03", "2027-05-04");
    expect((await clients.profA.send("post", "/api/demandes-report", { id_affectation: seance.id_affectation, motif: "Autre", nouvelle_date: "2027-05-11" })).status).toBe(409);
    expect((await confirmer({ action: "accepter" }, clients.profB)).status).toBe(404);
    expect((await confirmer({ action: "oublier" })).status).toBe(400);
    expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { action: "approuver" })).status).toBe(400);
    expect((await confirmer({ action: "accepter" })).status).toBe(200);
    expect((await confirmer({ action: "accepter" })).body.code).toBe("PAS_A_CONFIRMER");
});

test("l'enseignant propose un autre créneau : pris, refusé avec ce qui est libre ; libre, validé", async () => {
    // Le lundi 17 mai à 11:00, le groupe a déjà cours (étudiants occupés)
    expect((await creer({ date_seance: "2027-05-17", id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: ref.creneaux.lun2.id_creneau })).status).toBe(201);
    const { seance, demande, confirmer } = await reportValide("2027-05-10", "2027-05-11");

    expect((await confirmer({ action: "proposer", nouvelle_date: "2027-05-17" })).status).toBe(400);
    const pris = await confirmer({ action: "proposer", nouvelle_date: "2027-05-17", id_creneau: ref.creneaux.lun2.id_creneau });
    expect(pris.status).toBe(422);
    expect(pris.body.code).toBe("AUCUN_CRENEAU_LIBRE");
    expect(pris.body.propositions.length).toBeGreaterThan(0);
    expect((await DemandeReport.findByPk(demande.id_demande)).statut_demande).toBe("a_confirmer");

    const libre = await confirmer({ action: "proposer", nouvelle_date: "2027-05-17", id_creneau: ref.creneaux.lun3.id_creneau });
    expect(libre.status).toBe(200);
    expect(libre.body.demande).toMatchObject({ statut_demande: "approuve", nouvelle_date: "2027-05-17", id_creneau_nouveau: ref.creneaux.lun3.id_creneau });
    expect(await Affectation.findByPk(seance.id_affectation)).toMatchObject({ date_seance: "2027-05-17", id_creneau: ref.creneaux.lun3.id_creneau, statut: "reporte" });
    expect(await Notification.count({ where: { id_user: admin.id_user, titre: "Report déplacé par l'enseignant" } })).toBe(1);
});

test("la place validée a été prise avant la confirmation : 409, la demande reste à confirmer", async () => {
    const { seance, demande, confirmer } = await reportValide("2027-05-24", "2027-05-31");
    const validee = await DemandeReport.findByPk(demande.id_demande);
    // Entre-temps, le groupe reçoit un autre cours à cette heure-là
    expect((await creer({ date_seance: "2027-05-31", id_user_enseignant: profB.id_user, id_salle: ref.salles.g2.id_salle, id_creneau: validee.id_creneau_nouveau })).status).toBe(201);
    const response = await confirmer({ action: "accepter" });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CRENEAU_PLUS_LIBRE");
    expect((await DemandeReport.findByPk(demande.id_demande)).statut_demande).toBe("a_confirmer");
    expect((await Affectation.findByPk(seance.id_affectation)).date_seance).toBe("2027-05-24");
});

test("un forçage de l'administration est appliqué à la confirmation, en son nom", async () => {
    const seance = (await creer({ date_seance: "2027-06-07" })).body.affectation;
    expect((await creer({ date_seance: "2027-06-14", id_groupe: ref.td2.id_groupe, id_user_enseignant: profB.id_user })).status).toBe(201);
    const demande = (await clients.profA.send("post", "/api/demandes-report", { id_affectation: seance.id_affectation, motif: "Colloque", nouvelle_date: "2027-06-14" })).body;
    const imposer = { action: "approuver", id_creneau: ref.creneaux.lun1.id_creneau, id_salle: ref.salles.g1.id_salle, forcer: true };
    expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, imposer)).status).toBe(400);
    expect((await clients.admin.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { ...imposer, justification: "Salle partagée pour la journée" })).status).toBe(200);
    expect((await clients.profA.send("patch", `/api/demandes-report/${demande.id_demande}/confirmer`, { action: "accepter" })).status).toBe(200);
    const historique = await HistoriqueAffectation.findOne({ where: { id_affectation: seance.id_affectation, action: "report" } });
    expect(historique).toMatchObject({ force: true, id_user: admin.id_user });
});
