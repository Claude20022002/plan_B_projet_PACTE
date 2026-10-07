import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    AnneeUniversitaire,
    Appartenir,
    Campus,
    Cours,
    CoursComposante,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    Disponibilite,
    Filiere,
    Groupe,
    Notification,
    Periode,
    Reservation,
    Salle,
    SessionExamenSalle,
    Surveillance,
} from "../../models/index.js";

/**
 * Phase P5 — réservations hors cours et examens : demande puis validation, mêmes occupations
 * que les séances (dans les deux sens). Examens surveillés par le personnel de l'administration
 * (équilibré), contrôles par les enseignants du module.
 */

let admin;
let personnel;
let profA;
let profB;
let profs;
let etudiant;
let clients;
let ref;

const LUNDI = "2027-04-05";

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    // Personnel de l'administration qui surveille les examens (comptes administrateurs)
    personnel = [await createUser("admin"), await createUser("admin"), await createUser("admin"), await createUser("admin"), await createUser("admin")];
    profA = await createUser("enseignant");
    profB = await createUser("enseignant");
    profs = [await createUser("enseignant"), await createUser("enseignant"), await createUser("enseignant"), await createUser("enseignant")];
    etudiant = await createUser("etudiant");
    clients = { admin: await loginAs(admin), profA: await loginAs(profA), profB: await loginAs(profB), etudiant: await loginAs(etudiant) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "RSV", nom_filiere: "Réservations" });
    const promo = await Groupe.create({ nom_groupe: "5A RSV", niveau: "5ème année", annee: 5, effectif: 30, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    const td1 = await Groupe.create({ nom_groupe: "RSV-5A", niveau: "5ème année", annee: 5, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: td1.id_groupe });
    const salle = (nom, extra = {}) => Salle.create({ nom_salle: nom, type_salle: "Salle de cours", capacite: 40, id_campus: gandhi.id_campus, ...extra });
    const salles = {
        s1: await salle("G-RSV1"),
        s2: await salle("G-RSV2"),
        reunion: await salle("G-REU", { type_salle: "Salle de réunion", capacite: 10, reservable_par: "enseignants" }),
        amphi: await salle("G-AMPHIRSV", { type_salle: "Amphithéâtre", capacite: 100, capacite_examen: 50 }),
    };
    const lun1 = await Creneau.create({ jour_semaine: "lundi", heure_debut: "09:00", heure_fin: "10:45", duree_minutes: 105, rang: 1 });
    const lun3 = await Creneau.create({ jour_semaine: "lundi", heure_debut: "13:30", heure_fin: "15:15", duree_minutes: 105, rang: 3 });
    const cours = await Cours.create({ code_cours: "RSV-PFE", nom_cours: "Projet de fin d'études", niveau: "5ème année", volume_horaire: 30, type_cours: "CM", semestre: "S9", id_filiere: filiere.id_filiere });
    ref = { filiere, promo, td1, salles, lun1, lun3, cours };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const reservation = (extra = {}) => ({
    type: "soutenance",
    titre: "Soutenance PFE",
    id_salle: ref.salles.s1.id_salle,
    date: LUNDI,
    heure_debut: "09:00",
    heure_fin: "10:30",
    participants: [
        { id_user: profA.id_user, role: "president" },
        { id_user: profB.id_user, role: "jury" },
    ],
    ...extra,
});
const codes = (r) => (r.body.violations || []).filter((v) => v.bloquant).map((v) => v.code);

describe("Réservations : demande, validation, refus", () => {
    let premiere;
    let seconde;

    test("une demande d'enseignant attend la validation et ne bloque rien", async () => {
        const r1 = await clients.profA.send("post", "/api/reservations", reservation());
        expect(r1.status).toBe(201);
        expect(r1.body.reservation.statut).toBe("demandee");
        premiere = r1.body.reservation;
        expect(await Notification.count({ where: { id_user: admin.id_user, titre: "Réservation à valider" } })).toBe(1);

        // Même salle, même heure : acceptée en demande, puisque la première n'est pas validée
        const r2 = await clients.profB.send("post", "/api/reservations", reservation({ titre: "Réunion d'équipe", type: "evenement", participants: [] }));
        expect(r2.status).toBe(201);
        seconde = r2.body.reservation;
    });

    test("la validation revérifie : la seconde est refusée en 409 une fois la première validée", async () => {
        expect((await clients.admin.send("patch", `/api/reservations/${premiere.id_reservation}/valider`)).status).toBe(200);
        const conflit = await clients.admin.send("patch", `/api/reservations/${seconde.id_reservation}/valider`);
        expect(conflit.status).toBe(409);
        expect(codes(conflit)).toEqual(["conflit_salle"]);

        expect((await clients.admin.send("patch", `/api/reservations/${seconde.id_reservation}/refuser`, {})).status).toBe(400);
        const refus = await clients.admin.send("patch", `/api/reservations/${seconde.id_reservation}/refuser`, { motif: "Salle prise par une soutenance" });
        expect(refus.body.reservation.statut).toBe("refusee");
        expect(await Notification.count({ where: { id_user: profB.id_user, titre: "Réservation refusée" } })).toBe(1);
    });

    test("une réunion dans une salle ouverte aux enseignants est validée d'office, le demandeur y participe", async () => {
        const r = await clients.profB.send("post", "/api/reservations", reservation({ type: "reunion", titre: "Réunion pédagogique", id_salle: ref.salles.reunion.id_salle, heure_debut: "13:30", heure_fin: "14:30", participants: [] }));
        expect(r.status).toBe(201);
        expect(r.body.reservation.statut).toBe("validee");
        expect(r.body.reservation.participants.map((p) => p.id_user)).toContain(profB.id_user);
    });

    test("une séance ne peut pas prendre la salle ni le jury d'une soutenance validée", async () => {
        const base = { date_seance: LUNDI, id_cours: ref.cours.id_cours, id_groupe: ref.td1.id_groupe, id_creneau: ref.lun1.id_creneau };
        const salle = await clients.admin.send("post", "/api/affectations", { ...base, id_user_enseignant: profs[0].id_user, id_salle: ref.salles.s1.id_salle });
        expect(codes(salle)).toEqual(["conflit_salle"]);
        const jury = await clients.admin.send("post", "/api/affectations", { ...base, id_user_enseignant: profA.id_user, id_salle: ref.salles.s2.id_salle });
        expect(codes(jury)).toEqual(["conflit_enseignant"]);
    });

    test("participants : groupe qui a cours, indisponibilité déclarée", async () => {
        await clients.admin.send("post", "/api/affectations", { date_seance: LUNDI, id_cours: ref.cours.id_cours, id_groupe: ref.td1.id_groupe, id_creneau: ref.lun3.id_creneau, id_user_enseignant: profs[0].id_user, id_salle: ref.salles.s2.id_salle });
        const groupe = await clients.admin.send("post", "/api/reservations/verifier", reservation({ id_salle: ref.salles.amphi.id_salle, heure_debut: "14:00", heure_fin: "15:00", participants: [{ id_groupe: ref.promo.id_groupe, role: "etudiant" }] }));
        expect(groupe.body.violations.map((v) => v.code)).toContain("conflit_groupe");

        await Disponibilite.create({ id_user_enseignant: profs[1].id_user, id_creneau: ref.lun1.id_creneau, date_debut: LUNDI, date_fin: LUNDI, disponible: false, raison_indisponibilite: "Congrès" });
        const indispo = await clients.admin.send("post", "/api/reservations/verifier", reservation({ id_salle: ref.salles.amphi.id_salle, participants: [{ id_user: profs[1].id_user, role: "jury" }] }));
        expect(indispo.body.violations.find((v) => v.code === "participant_indisponible")?.message).toMatch(/Congrès/);
    });

    test("droits : examen et validation réservés à l'administration, annulation au demandeur", async () => {
        expect((await clients.profA.send("post", "/api/reservations", reservation({ type: "examen", date: "2027-04-12" }))).status).toBe(403);
        expect((await clients.profA.send("patch", `/api/reservations/${premiere.id_reservation}/valider`)).status).toBe(403);
        expect((await clients.profB.send("patch", `/api/reservations/${premiere.id_reservation}/annuler`)).status).toBe(403);
        // Le jury voit la soutenance où il siège ; l'étudiant (ni demandeur ni participant) ne la voit pas
        expect((await clients.profB.get("/api/reservations")).body.map((r) => r.id_reservation)).toContain(premiere.id_reservation);
        expect((await clients.etudiant.get("/api/reservations")).body).toHaveLength(0);
        const annulation = await clients.profA.send("patch", `/api/reservations/${premiere.id_reservation}/annuler`);
        expect(annulation.body.reservation.statut).toBe("annulee");
    });

    test("rattrapage : sur une séance de l'enseignant, son groupe participe d'office", async () => {
        const seance = await Affectation.findOne({ where: { id_user_enseignant: profs[0].id_user } });
        const autre = await clients.profA.send("post", "/api/reservations", reservation({ type: "rattrapage", titre: "Rattrapage", id_affectation_origine: seance.id_affectation, date: "2027-04-13", participants: [] }));
        expect(autre.status).toBe(403);
        const client = await loginAs(profs[0]);
        const ok = await client.send("post", "/api/reservations", reservation({ type: "rattrapage", titre: "Rattrapage", id_affectation_origine: seance.id_affectation, date: "2027-04-13", participants: [] }));
        expect(ok.status).toBe(201);
        expect(ok.body.reservation.participants.map((p) => p.id_groupe)).toContain(ref.td1.id_groupe);
    });
});

describe("Examens et surveillances", () => {
    let examen;
    const epreuve = (extra = {}) => ({
        titre: "Examen PFE",
        id_cours: ref.cours.id_cours,
        date: "2027-04-19",
        heure_debut: "09:00",
        heure_fin: "11:00",
        groupes: [ref.promo.id_groupe],
        salles: [{ id_salle: ref.salles.s1.id_salle }],
        ...extra,
    });

    test("places d'examen insuffisantes : refusé ; avec l'amphi, les étudiants sont répartis", async () => {
        const trop = await clients.admin.send("post", "/api/examens", epreuve());
        expect(trop.status).toBe(409);
        expect(codes(trop)).toEqual(["capacite"]);

        const ok = await clients.admin.send("post", "/api/examens", epreuve({ salles: [{ id_salle: ref.salles.s1.id_salle }, { id_salle: ref.salles.amphi.id_salle }] }));
        expect(ok.status).toBe(201);
        examen = ok.body.examen;
        const repartition = await SessionExamenSalle.findAll({ where: { id_session: examen.id_session } });
        expect(repartition.reduce((t, s) => t + s.effectif, 0)).toBe(30);
        expect(ok.body.violations.filter((v) => v.code === "surveillants_manquants")).toHaveLength(2);
    });

    test("une épreuve ne peut pas tomber pendant un cours d'un de ses groupes", async () => {
        await clients.admin.send("post", "/api/affectations", { date_seance: "2027-04-19", id_cours: ref.cours.id_cours, id_groupe: ref.td1.id_groupe, id_creneau: ref.lun3.id_creneau, id_user_enseignant: profA.id_user, id_salle: ref.salles.s2.id_salle });
        const pendantCours = await clients.admin.send("post", "/api/examens", epreuve({ heure_debut: "14:00", heure_fin: "16:00", salles: [{ id_salle: ref.salles.amphi.id_salle }] }));
        expect(codes(pendantCours)).toContain("conflit_groupe");
    });

    test("surveillants d'office d'un examen : deux par salle, parmi le personnel de l'administration, jamais un enseignant", async () => {
        const response = await clients.admin.send("post", `/api/examens/${examen.id_session}/surveillants/auto`);
        expect(response.status).toBe(200);
        const surveillants = await Surveillance.findAll({ where: { id_session: examen.id_session } });
        expect(surveillants).toHaveLength(4);
        const administration = new Set([admin, ...personnel].map((u) => u.id_user));
        expect(surveillants.every((s) => administration.has(s.id_user))).toBe(true);
    });

    test("une seconde épreuve prend d'abord les enseignants qui n'ont pas encore surveillé", async () => {
        const seconde = await clients.admin.send("post", "/api/examens", epreuve({ titre: "Examen 2", date: "2027-04-20", groupes: [ref.td1.id_groupe], salles: [{ id_salle: ref.salles.amphi.id_salle }] }));
        await clients.admin.send("post", `/api/examens/${seconde.body.examen.id_session}/surveillants/auto`);
        const premiers = new Set((await Surveillance.findAll({ where: { id_session: examen.id_session } })).map((s) => s.id_user));
        const nouveaux = await Surveillance.findAll({ where: { id_session: seconde.body.examen.id_session } });
        // 6 personnes de l'administration, 4 déjà prises : les 2 restantes passent en premier
        expect(nouveaux.every((s) => !premiers.has(s.id_user))).toBe(true);
        const charge = await clients.admin.get("/api/examens/surveillances/charge");
        expect(Math.max(...charge.body.map((c) => c.surveillances))).toBe(1);
    });

    test("publication : étudiants et surveillants prévenus, chacun voit ce qui le concerne", async () => {
        expect((await clients.admin.send("patch", `/api/examens/${examen.id_session}/publier`)).status).toBe(200);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Examen planifié" } })).toBe(1);
        expect((await clients.etudiant.get("/api/examens/mes-examens")).body.map((e) => e.id_session)).toEqual([examen.id_session]);
        const surveillant = (await Surveillance.findOne({ where: { id_session: examen.id_session } })).id_user;
        const client = await loginAs({ email: (await Reservation.sequelize.models.Users.findByPk(surveillant)).email });
        expect((await client.get("/api/examens/mes-surveillances")).body.map((e) => e.id_session)).toContain(examen.id_session);
    });

    test("contrôle : surveillé par l'enseignant du module, pendant sa propre séance sans conflit", async () => {
        const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
        const periode = await Periode.create({ id_annee: annee.id_annee, code: "S2", date_debut: "2027-02-01", date_fin: "2027-06-30", nb_semaines: 16 });
        const composante = await CoursComposante.create({ id_cours: ref.cours.id_cours, type: "CM", volume_heures: 30, niveau_groupe: "td" });
        const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 30 });
        await enseignement.setGroupes([ref.td1.id_groupe]);
        await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: profB.id_user, role: "principal", statut_service: "accepte" });
        // Séance du module de profB dans G-RSV2, le lundi 26 avril de 9 h à 10 h 45
        const seance = await clients.admin.send("post", "/api/affectations", { date_seance: "2027-04-26", id_cours: ref.cours.id_cours, id_groupe: ref.td1.id_groupe, id_creneau: ref.lun1.id_creneau, id_user_enseignant: profB.id_user, id_salle: ref.salles.s2.id_salle });
        expect(seance.status).toBe(201);

        const controle = await clients.admin.send("post", "/api/examens", epreuve({ titre: "Contrôle PFE", nature: "controle", date: "2027-04-26", heure_debut: "09:30", heure_fin: "10:30", groupes: [ref.td1.id_groupe], salles: [{ id_salle: ref.salles.s2.id_salle }] }));
        expect(controle.status).toBe(201);
        expect(controle.body.examen.nature).toBe("controle");
        await clients.admin.send("post", `/api/examens/${controle.body.examen.id_session}/surveillants/auto`);
        const surveillants = await Surveillance.findAll({ where: { id_session: controle.body.examen.id_session } });
        expect(surveillants.map((s) => s.id_user)).toEqual([profB.id_user]);

        // Le même créneau en examen reste un conflit avec la séance
        const examenPendantSeance = await clients.admin.send("post", "/api/examens", epreuve({ titre: "Examen pendant cours", date: "2027-04-26", heure_debut: "09:30", heure_fin: "10:30", groupes: [ref.td1.id_groupe], salles: [{ id_salle: ref.salles.s2.id_salle }] }));
        expect(codes(examenPendantSeance)).toEqual(expect.arrayContaining(["conflit_salle", "conflit_groupe"]));
    });

    test("le personnel de l'administration voit ses surveillances publiées", async () => {
        const surveillant = (await Surveillance.findOne({ where: { id_session: examen.id_session } })).id_user;
        const client = await loginAs({ email: (await Reservation.sequelize.models.Users.findByPk(surveillant)).email });
        expect((await client.get("/api/examens/mes-surveillances")).status).toBe(200);
    });

    test("une séance ne peut pas prendre une salle d'examen pendant l'épreuve", async () => {
        const response = await clients.admin.send("post", "/api/affectations", { date_seance: "2027-04-19", id_cours: ref.cours.id_cours, id_groupe: ref.td1.id_groupe, id_creneau: ref.lun1.id_creneau, id_user_enseignant: profB.id_user, id_salle: ref.salles.amphi.id_salle });
        expect(codes(response)).toEqual(expect.arrayContaining(["conflit_salle", "conflit_groupe"]));
    });
});
