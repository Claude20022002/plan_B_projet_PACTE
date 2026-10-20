import { resetDatabase, closeDatabase, createUser, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";

/**
 * Limiteur global de l'API : par compte connecté, par adresse IP sans compte. Toutes les requêtes
 * des tests viennent de 127.0.0.1, comme une classe derrière le Wi-Fi de l'école.
 */

let etudiant;
let autreEtudiant;

beforeAll(async () => {
    await resetDatabase();
    etudiant = await createUser("etudiant");
    autreEtudiant = await createUser("etudiant");
});
afterAll(closeDatabase);

/** Requêtes encore permises dans la fenêtre, lues dans l'en-tête du limiteur global */
const restantes = (reponse) => Number(reponse.headers["x-ratelimit-remaining"]);

test("deux comptes sur la même adresse ont chacun leur compteur ; sans compte, on compte par adresse", async () => {
    const a = await loginAs(etudiant);
    const b = await loginAs(autreEtudiant);
    await resetRateLimiters();

    const premiere = restantes(await a.get("/api/auth/csrf-token"));
    for (let i = 0; i < 4; i += 1) await a.get("/api/auth/csrf-token");
    expect(restantes(await a.get("/api/auth/csrf-token"))).toBe(premiere - 5);

    // Les requêtes de A n'entament ni le compteur de B, ni celui de l'adresse
    expect(restantes(await b.get("/api/auth/csrf-token"))).toBe(premiere);
    expect(restantes(await anonymous().get("/api/auth/csrf-token"))).toBe(premiere);
    expect(restantes(await anonymous().get("/api/auth/csrf-token"))).toBe(premiere - 1);
});
