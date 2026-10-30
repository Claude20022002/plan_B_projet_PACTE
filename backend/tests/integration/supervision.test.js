import http from "node:http";
import { jest } from "@jest/globals";
import { resetDatabase, closeDatabase, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { ConfigurationEtablissement } from "../../models/index.js";
import { noterRequete, reinitialiserCompteurs } from "../../services/supervision/compteurs.js";

/**
 * Supervision (lot ME-21) : ce que la sonde extérieure lit. Santé publique (base, solveur, taux
 * d'erreurs 500), mesures derrière le jeton de supervision, et rien de personnel dans les réponses.
 */

const JETON = "jeton-de-supervision-des-tests-0123456789";
let fauxSolveur;
let solveurRepond = true;
const ENV = { SOLVER_URL: process.env.SOLVER_URL, SUPERVISION_TOKEN: process.env.SUPERVISION_TOKEN, SUPERVISION_SEUIL_ERREURS: process.env.SUPERVISION_SEUIL_ERREURS };

beforeAll(async () => {
    await resetDatabase();
    // Faux solveur : /health répond 200, ou 503 quand solveurRepond est faux
    fauxSolveur = http.createServer((req, res) => {
        res.writeHead(req.url === "/health" && solveurRepond ? 200 : 503).end();
    });
    await new Promise((pret) => fauxSolveur.listen(0, "127.0.0.1", pret));
    process.env.SOLVER_URL = `http://127.0.0.1:${fauxSolveur.address().port}`;
});
afterAll(async () => {
    for (const [cle, valeur] of Object.entries(ENV)) {
        if (valeur === undefined) delete process.env[cle];
        else process.env[cle] = valeur;
    }
    await new Promise((fin) => fauxSolveur.close(fin));
    await closeDatabase();
});
beforeEach(() => {
    resetRateLimiters();
    reinitialiserCompteurs();
    solveurRepond = true;
    delete process.env.SUPERVISION_SEUIL_ERREURS;
    jest.restoreAllMocks();
});

const sante = () => anonymous().get("/api/supervision/sante");

describe("Santé publique", () => {
    test("tout va bien : 200, sans compte, jamais en cache, et rien d'autre que des états", async () => {
        const reponse = await sante();
        expect(reponse.status).toBe(200);
        expect(reponse.headers["cache-control"]).toBe("no-store");
        expect(reponse.body).toEqual({ etat: "ok", base: "ok", solveur: "ok", erreurs: "ok" });
    });

    test("solveur arrêté : dégradé, mais le service répond (200)", async () => {
        solveurRepond = false;
        const reponse = await sante();
        expect(reponse.status).toBe(200);
        expect(reponse.body).toMatchObject({ etat: "degrade", solveur: "injoignable", base: "ok" });
    });

    test("trop d'erreurs 500 sur 15 minutes : « erreurs » passe à « elevees »", async () => {
        process.env.SUPERVISION_SEUIL_ERREURS = "3";
        noterRequete(5, 500);
        noterRequete(5, 502);
        expect((await sante()).body.erreurs).toBe("ok");
        noterRequete(5, 500);
        expect((await sante()).body).toMatchObject({ etat: "degrade", erreurs: "elevees" });
    });

    test("base injoignable : 503, la sonde déclenche l'alerte", async () => {
        jest.spyOn(ConfigurationEtablissement, "count").mockRejectedValue(new Error("connexion refusée"));
        const reponse = await sante();
        expect(reponse.status).toBe(503);
        expect(reponse.body).toMatchObject({ etat: "degrade", base: "injoignable" });
    });
});

describe("Mesures, derrière le jeton de supervision", () => {
    const mesures = (jeton) => {
        const requete = anonymous().get("/api/supervision/mesures");
        return jeton === undefined ? requete : requete.set("X-Supervision-Jeton", jeton);
    };

    test("jeton non configuré : 404", async () => {
        delete process.env.SUPERVISION_TOKEN;
        expect((await mesures(JETON)).status).toBe(404);
    });

    test("sans jeton ou avec un autre : 401", async () => {
        process.env.SUPERVISION_TOKEN = JETON;
        expect((await mesures()).status).toBe(401);
        expect((await mesures(`${JETON}x`)).status).toBe(401);
        expect((await mesures("x".repeat(JETON.length))).status).toBe(401);
    });

    test("avec le jeton : trafic, temps de réponse, erreurs, courriels, générations, MySQL ; rien d'autre", async () => {
        process.env.SUPERVISION_TOKEN = JETON;
        await sante();
        await anonymous().get("/api/route-inexistante");
        const { status, body } = await mesures(JETON);
        expect(status).toBe(200);
        expect(Object.keys(body).sort()).toEqual(["courriels_en_echec", "erreurs_5xx", "fenetre_minutes", "generations_en_cours", "mysql", "requetes", "temps_reponse_ms"]);
        expect(body.requetes).toBeGreaterThanOrEqual(2);
        expect(body.temps_reponse_ms.p95).toEqual(expect.any(Number));
        expect(body.generations_en_cours).toBe(0);
        expect(body.mysql).toEqual({ ouvertes: expect.any(Number), plafond: expect.any(Number) });
        expect(body.mysql.ouvertes).toBeGreaterThan(0);
    });
});
