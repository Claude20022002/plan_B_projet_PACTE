import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";

let clients;

beforeAll(async () => {
    await resetDatabase();
    clients = {
        admin: await loginAs(await createUser("admin")),
        enseignant: await loginAs(await createUser("enseignant")),
        etudiant: await loginAs(await createUser("etudiant")),
    };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Liste de tous les étudiants", () => {
    test("réservée à l'administration : un enseignant ou un étudiant n'obtient pas les coordonnées de toute l'école", async () => {
        expect((await clients.admin.get("/api/etudiants")).status).toBe(200);
        expect((await clients.enseignant.get("/api/etudiants")).status).toBe(403);
        expect((await clients.etudiant.get("/api/etudiants")).status).toBe(403);
    });
});
