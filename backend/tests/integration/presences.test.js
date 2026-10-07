import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Appartenir, Groupe } from "../../models/index.js";
import { scannerCode } from "../../services/presences/appel.js";

/**
 * I1 — appel par QR code : l'enseignant ouvre l'appel le jour de la séance, le code change toutes
 * les 30 s et ne vaut qu'une minute, seuls les étudiants des groupes de la séance sont acceptés,
 * l'enseignant coche à la main et ferme l'appel (séance réalisée).
 */

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let seance;
let code;

const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Salma", nom: "Bennani" });
    etudiantTp = await createUser("etudiant", { prenom: "Yassine", nom: "Alami" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    const tp = await Groupe.create({ nom_groupe: "TP1", niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etudiantTp.id_user, id_groupe: tp.id_groupe },
        { id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe },
    ]);
    seance = await Affectation.create({
        date_seance: aujourdhui(),
        statut: "confirme",
        id_cours: fixture.cours.id_cours,
        id_groupe: fixture.groupe.id_groupe,
        id_user_enseignant: enseignant.id_user,
        id_salle: fixture.salle.id_salle,
        id_creneau: fixture.creneau.id_creneau,
        id_user_admin: admin.id_user,
    });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Ouvrir l'appel", () => {
    test("réservé aux enseignants de la séance, le jour même", async () => {
        expect((await (await loginAs(autreEnseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`)).status).toBe(403);
        expect((await (await loginAs(etudiant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`)).status).toBe(403);
        // La séance de la fixture est en janvier 2027 : pas aujourd'hui
        expect((await (await loginAs(enseignant)).send("post", `/api/presences/seances/${fixture.affectation.id_affectation}/ouvrir`)).status).toBe(409);
    });

    test("l'enseignant obtient un code signé et l'adresse du QR", async () => {
        const res = await (await loginAs(enseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`);
        expect(res.status).toBe(200);
        expect(res.body.code).toMatch(new RegExp(`^${seance.id_affectation}\\.\\d+\\.[A-Za-z0-9_-]{22}$`));
        expect(res.body.url).toContain(`/presence?c=${encodeURIComponent(res.body.code)}`);
        expect(res.body.expire_dans_ms).toBeLessThanOrEqual(30000);
        code = (await (await loginAs(enseignant)).get(`/api/presences/seances/${seance.id_affectation}/code`)).body.code;
    });
});

describe("Scanner", () => {
    test("un étudiant d'un groupe de la séance est présent, une seule fois", async () => {
        const session = await loginAs(etudiant);
        const premier = await session.send("post", "/api/presences/scanner", { code });
        expect(premier.status).toBe(200);
        expect(premier.body).toMatchObject({ deja: false, seance: { id: seance.id_affectation, cours: "Algorithmique" } });
        expect((await session.send("post", "/api/presences/scanner", { code })).body.deja).toBe(true);
    });

    test("le QR scanné par l'appareil photo (adresse du site) marche aussi, pour un sous-groupe", async () => {
        const res = await (await loginAs(etudiantTp)).send("post", "/api/presences/scanner", { code: `https://planner.exemple/presence?c=${encodeURIComponent(code)}` });
        expect(res.status).toBe(200);
    });

    test("refus : autre groupe, code trafiqué, code expiré, pas un étudiant", async () => {
        expect((await (await loginAs(etranger)).send("post", "/api/presences/scanner", { code })).status).toBe(403);
        const trafique = code.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
        expect((await (await loginAs(etranger)).send("post", "/api/presences/scanner", { code: trafique })).status).toBe(400);
        expect((await (await loginAs(etudiant)).send("post", "/api/presences/scanner", { code: "bonjour" })).status).toBe(400);
        await expect(scannerCode({ role: "etudiant", id_user: etudiant.id_user }, code, new Date(Date.now() + 2 * 60 * 1000))).rejects.toMatchObject({ status: 410 });
        expect((await (await loginAs(enseignant)).send("post", "/api/presences/scanner", { code })).status).toBe(403);
    });
});

describe("Liste d'appel et fermeture", () => {
    test("attendus et présents ; l'enseignant coche et décoche à la main", async () => {
        const prof = await loginAs(enseignant);
        const liste = (await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(liste.etudiants.map((e) => e.id_user).sort()).toEqual([etudiant.id_user, etudiantTp.id_user].sort());
        expect(liste.presents).toBe(2);
        expect(liste.appel.ouvert).toBe(true);

        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etudiantTp.id_user}`, { present: false })).status).toBe(200);
        expect((await prof.get(`/api/presences/seances/${seance.id_affectation}/code`)).body.presents).toBe(1);
        await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etudiantTp.id_user}`, { present: true });
        const apres = (await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(apres.etudiants.find((e) => e.id_user === etudiantTp.id_user)).toMatchObject({ present: true, source: "manuel" });
        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etranger.id_user}`, { present: true })).status).toBe(404);
    });

    test("fermer : séance réalisée, plus aucun scan accepté", async () => {
        const res = await (await loginAs(enseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/fermer`);
        expect(res.body).toMatchObject({ presents: 2, statut: "realise" });
        expect((await Affectation.findByPk(seance.id_affectation)).statut).toBe("realise");
        expect((await (await loginAs(etudiant)).send("post", "/api/presences/scanner", { code })).status).toBe(409);
        expect((await (await loginAs(etudiant)).get("/api/presences/miennes")).body.data.map((p) => p.id_affectation)).toContain(seance.id_affectation);
    });
});
