import {
    resetDatabase,
    closeDatabase,
    createUser,
    loginAs,
    anonymous,
    createPlanningFixture,
    containsPasswordHash,
} from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Notification, DemandeReport, Creneau } from "../../models/index.js";

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let autreEtudiant;
let fixture;
let clients;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    autreEtudiant = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });

    clients = {
        admin: await loginAs(admin),
        enseignant: await loginAs(enseignant),
        autreEnseignant: await loginAs(autreEnseignant),
        etudiant: await loginAs(etudiant),
        autreEtudiant: await loginAs(autreEtudiant),
    };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Routes autrefois publiques : authentification obligatoire", () => {
    test.each([
        "/api/notifications",
        "/api/notifications/user/1",
        "/api/appartenances",
        "/api/demandes-report",
        "/api/demandes-report/statut/en_attente",
        "/api/conflits/non-resolus/liste",
    ])("GET %s sans session → 401", async (url) => {
        const response = await anonymous().get(url);
        expect(response.status).toBe(401);
        expect(containsPasswordHash(response.body)).toBe(false);
    });
});

describe("Notifications", () => {
    let notifEtudiant;

    beforeAll(async () => {
        notifEtudiant = await Notification.create({
            id_user: etudiant.id_user,
            titre: "Séance reportée",
            message: "Test",
            type_notification: "info",
        });
    });

    test("un utilisateur lit ses notifications, sans hash", async () => {
        const response = await clients.etudiant.get(`/api/notifications/user/${etudiant.id_user}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(containsPasswordHash(response.body)).toBe(false);
    });

    test("un utilisateur ne lit pas les notifications d'un autre", async () => {
        const response = await clients.autreEtudiant.get(`/api/notifications/user/${etudiant.id_user}`);
        expect(response.status).toBe(403);
    });

    test("un utilisateur ne marque pas comme lue la notification d'un autre", async () => {
        const response = await clients.autreEtudiant.send("patch", `/api/notifications/${notifEtudiant.id_notification}/lire`);
        expect(response.status).toBe(404);
        await notifEtudiant.reload();
        expect(notifEtudiant.lue).toBe(false);
    });

    test("seul l'admin liste toutes les notifications ou en crée", async () => {
        expect((await clients.etudiant.get("/api/notifications")).status).toBe(403);
        expect(
            (await clients.etudiant.send("post", "/api/notifications", {
                id_user: autreEtudiant.id_user, titre: "Spam", message: "x",
            })).status
        ).toBe(403);

        const list = await clients.admin.get("/api/notifications");
        expect(list.status).toBe(200);
        expect(containsPasswordHash(list.body)).toBe(false);
    });

    test("« tout marquer comme lu » ne touche que ses propres notifications", async () => {
        const autre = await Notification.create({
            id_user: autreEtudiant.id_user, titre: "A", message: "B", type_notification: "info",
        });

        const forbidden = await clients.etudiant.send("patch", `/api/notifications/user/${autreEtudiant.id_user}/tout-lire`);
        expect(forbidden.status).toBe(403);

        const own = await clients.etudiant.send("patch", `/api/notifications/user/${etudiant.id_user}/tout-lire`);
        expect(own.status).toBe(200);
        await autre.reload();
        expect(autre.lue).toBe(false);
    });
});

describe("Appartenances", () => {
    test("un étudiant ne liste pas les appartenances et ne change pas de groupe", async () => {
        expect((await clients.etudiant.get("/api/appartenances")).status).toBe(403);
        const move = await clients.etudiant.send("post", "/api/appartenances", {
            id_user_etudiant: etudiant.id_user,
            id_groupe: fixture.autreGroupe.id_groupe,
        });
        expect(move.status).toBe(403);
    });

    test("le personnel lit les appartenances sans hash", async () => {
        const response = await clients.enseignant.get(`/api/appartenances/groupe/${fixture.groupe.id_groupe}`);
        expect(response.status).toBe(200);
        expect(containsPasswordHash(response.body)).toBe(false);
    });
});

describe("Demandes de report", () => {
    test("l'enseignant est déduit de la séance, le statut est forcé à en_attente", async () => {
        const response = await clients.enseignant.send("post", "/api/demandes-report", {
            id_affectation: fixture.affectation.id_affectation,
            nouvelle_date: "2027-01-11",
            motif: "Conférence",
            id_user_enseignant: autreEnseignant.id_user,
            statut_demande: "approuve",
        });
        expect(response.status).toBe(201);
        expect(response.body.id_user_enseignant).toBe(enseignant.id_user);
        expect(response.body.statut_demande).toBe("en_attente");
    });

    test("un enseignant ne demande pas le report de la séance d'un collègue", async () => {
        const response = await clients.autreEnseignant.send("post", "/api/demandes-report", {
            id_affectation: fixture.affectation.id_affectation,
            nouvelle_date: "2027-01-11",
            motif: "Usurpation",
        });
        expect(response.status).toBe(403);
    });

    test("un étudiant ne crée pas de demande", async () => {
        const response = await clients.etudiant.send("post", "/api/demandes-report", {
            id_affectation: fixture.affectation.id_affectation,
            nouvelle_date: "2027-01-11",
            motif: "x",
        });
        expect(response.status).toBe(403);
    });

    test("PUT ne permet pas d'approuver sa propre demande", async () => {
        const demande = await DemandeReport.findOne({ where: { id_user_enseignant: enseignant.id_user } });
        const response = await clients.enseignant.send("put", `/api/demandes-report/${demande.id_demande}`, {
            statut_demande: "approuve",
            motif: "Motif corrigé",
        });
        expect(response.status).toBe(200);
        await demande.reload();
        expect(demande.statut_demande).toBe("en_attente");
        expect(demande.motif).toBe("Motif corrigé");
    });

    test("seul l'admin traite une demande et liste toutes les demandes", async () => {
        const demande = await DemandeReport.findOne({ where: { id_user_enseignant: enseignant.id_user } });
        expect((await clients.enseignant.get("/api/demandes-report")).status).toBe(403);
        expect(
            (await clients.enseignant.send("patch", `/api/demandes-report/${demande.id_demande}/traiter`, { action: "approuver" })).status
        ).toBe(403);
        expect((await clients.admin.get("/api/demandes-report")).status).toBe(200);
    });

    test("un enseignant ne lit pas les demandes d'un collègue", async () => {
        const response = await clients.autreEnseignant.get(`/api/demandes-report/enseignant/${enseignant.id_user}`);
        expect(response.status).toBe(403);
    });
});

describe("Affectations et emplois du temps", () => {
    test("seul l'admin liste toutes les affectations", async () => {
        expect((await clients.etudiant.get("/api/affectations")).status).toBe(403);
        expect((await clients.admin.get("/api/affectations")).status).toBe(200);
    });

    test("un étudiant voit les séances de son groupe, pas celles d'un autre", async () => {
        expect((await clients.etudiant.get(`/api/affectations/groupe/${fixture.groupe.id_groupe}`)).status).toBe(200);
        expect((await clients.etudiant.get(`/api/affectations/groupe/${fixture.autreGroupe.id_groupe}`)).status).toBe(403);
        expect((await clients.autreEtudiant.get(`/api/affectations/${fixture.affectation.id_affectation}`)).status).toBe(404);
        expect((await clients.etudiant.get(`/api/affectations/${fixture.affectation.id_affectation}`)).status).toBe(200);
    });

    test("l'emploi du temps personnel n'est visible que par son titulaire ou le personnel", async () => {
        expect((await clients.autreEtudiant.get(`/api/emplois-du-temps/etudiant/${etudiant.id_user}`)).status).toBe(403);
        expect((await clients.autreEnseignant.get(`/api/emplois-du-temps/enseignant/${enseignant.id_user}`)).status).toBe(403);
        expect((await clients.enseignant.get(`/api/emplois-du-temps/enseignant/${enseignant.id_user}`)).status).toBe(200);
    });

    test("id_user_admin est pris dans la session, pas dans le corps", async () => {
        const response = await clients.admin.send("post", "/api/affectations", {
            date_seance: "2027-01-18",
            id_cours: fixture.cours.id_cours,
            id_groupe: fixture.autreGroupe.id_groupe,
            id_user_enseignant: autreEnseignant.id_user,
            id_salle: fixture.salle.id_salle,
            id_creneau: fixture.creneau.id_creneau,
            id_user_admin: enseignant.id_user,
        });
        expect(response.status).toBe(201);
        expect(response.body.affectation.id_user_admin).toBe(admin.id_user);
    });
});

describe("Créneaux et conflits", () => {
    test("seul l'admin crée un créneau", async () => {
        const before = await Creneau.count();
        const response = await clients.etudiant.send("post", "/api/creneaux", {
            jour_semaine: "mardi", heure_debut: "08:00", heure_fin: "09:00", duree_minutes: 60,
        });
        expect(response.status).toBe(403);
        expect(await Creneau.count()).toBe(before);
    });

    test("les conflits sont réservés à l'admin", async () => {
        expect((await clients.enseignant.get("/api/conflits/non-resolus/liste")).status).toBe(403);
        expect((await clients.admin.get("/api/conflits/non-resolus/liste")).status).toBe(200);
    });
});

describe("Route inconnue", () => {
    test("404, pas 500", async () => {
        const reponse = await clients.admin.get("/api/route-inexistante");
        expect(reponse.status).toBe(404);
        expect(reponse.body.message).toMatch(/Route non trouvée/);
    });
});
