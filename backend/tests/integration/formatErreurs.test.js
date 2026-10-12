import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";

/**
 * Format commun des erreurs (lot A-5, docs/api/ERREURS.md) : { message, code, violations? }, sur
 * trois routes représentatives — un refus de planification (409, règles enfreintes), une erreur
 * métier (404), une route inconnue (gestionnaire global). Validation et doublon : tests unitaires
 * du gestionnaire (tests/middleware/errorHandler.test.js).
 */

let admin;
let fixture;
let client;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    const enseignant = await createUser("enseignant");
    fixture = await createPlanningFixture({ admin, enseignant });
});
afterAll(closeDatabase);
beforeEach(async () => {
    resetRateLimiters();
    client ??= await loginAs(admin);
});

/** Les seuls champs du format commun : rien d'autre ne sort (ni error, ni errors, ni details). */
const champsDuFormat = (corps) => Object.keys(corps).every((k) => ["message", "code", "violations"].includes(k));

describe("Format commun des erreurs (A-5)", () => {
    test("séance refusée : 409 REGLES_ENFREINTES, la première règle bloquante en message, toutes en violations", async () => {
        const autre = await createUser("enseignant");
        const res = await client.send("post", "/api/affectations", {
            date_seance: fixture.affectation.date_seance,
            id_cours: fixture.cours.id_cours,
            id_groupe: fixture.autreGroupe.id_groupe,
            id_user_enseignant: autre.id_user,
            id_salle: fixture.salle.id_salle,
            id_creneau: fixture.creneau.id_creneau,
        });
        expect(res.status).toBe(409);
        expect(res.body.code).toBe("REGLES_ENFREINTES");
        const bloquantes = res.body.violations.filter((v) => v.bloquant);
        expect(bloquantes.map((v) => v.code)).toContain("conflit_salle");
        expect(res.body.message).toBe(bloquantes[0].message);
        expect(champsDuFormat(res.body)).toBe(true);
    });

    test("erreur métier : son statut, le code du statut, le message", async () => {
        const res = await client.send("post", "/api/presences/demandes-telephone/999999/accepter");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: "Demande introuvable", code: "INTROUVABLE" });
    });

    test("route inconnue : 404 INTROUVABLE par le gestionnaire global", async () => {
        const res = await client.get("/api/route-qui-n-existe-pas");
        expect(res.status).toBe(404);
        expect(res.body.code).toBe("INTROUVABLE");
        expect(res.body.message).toMatch(/Route non trouvée/);
        expect(champsDuFormat(res.body)).toBe(true);
    });
});
