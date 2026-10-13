import { nomsCookies } from "../../config/authCookies.js";

/** Les préfixes de cookies des navigateurs : `__Host-` exige le chemin « / », `__Secure-` seulement HTTPS. */
describe("Noms des cookies d'authentification", () => {
    test("en production, le cookie de renouvellement (chemin /api/auth/refresh) n'a pas le préfixe __Host-", () => {
        const noms = nomsCookies(true);
        expect(noms.renouvellement).toBe("__Secure-refresh_token");
        expect(noms.acces).toMatch(/^__Host-/);
        expect(noms.csrf).toMatch(/^__Host-/);
    });

    test("hors production, aucun préfixe (HTTP local)", () => {
        expect(nomsCookies(false)).toEqual({ acces: "access_token", renouvellement: "refresh_token", csrf: "csrf_token" });
    });
});
