import express from "express";
import request from "supertest";
import sequelize from "../../config/db.js";
import { resetDatabase, closeDatabase } from "./helpers/testApp.js";
import { createRateLimiter, magasinBase, purgerCompteursDebit } from "../../middleware/rateLimiterMiddleware.js";

/**
 * Limiteurs de la connexion gardés en base (CompteursDebit) : les compteurs survivent à un
 * redémarrage, s'incrémentent sans perte sous la concurrence et ne gardent ni adresse ni email
 * en clair.
 */

const FENETRE = 15 * 60 * 1000;

beforeAll(resetDatabase);
afterAll(closeDatabase);

describe("Magasin en base", () => {
    test("le compteur survit à un redémarrage (nouvelle instance) et ne garde que des empreintes", async () => {
        const maintenant = Date.now();
        await magasinBase("essai-redemarrage").compter("10.0.0.1", FENETRE, maintenant);
        await magasinBase("essai-redemarrage").compter("10.0.0.1", FENETRE, maintenant);
        // « Redémarrage » : un magasin neuf retrouve le compte
        expect((await magasinBase("essai-redemarrage").compter("10.0.0.1", FENETRE, maintenant)).count).toBe(3);

        const [lignes] = await sequelize.query("SELECT cle FROM CompteursDebit WHERE cle LIKE 'essai-redemarrage:%'");
        expect(lignes).toHaveLength(1);
        expect(lignes[0].cle).toMatch(/^essai-redemarrage:[0-9a-f]{64}$/);
        expect(lignes[0].cle).not.toContain("10.0.0.1");
    });

    test("fenêtre terminée : le compteur repart de 1", async () => {
        const magasin = magasinBase("essai-fenetre");
        const debut = Date.now();
        await magasin.compter("cle", FENETRE, debut);
        await magasin.compter("cle", FENETRE, debut);
        const apres = await magasin.compter("cle", FENETRE, debut + FENETRE + 1);
        expect(apres.count).toBe(1);
        expect(apres.reset).toBe(debut + FENETRE + 1 + FENETRE);
    });

    test("20 requêtes simultanées : 20 comptées, aucune perdue", async () => {
        const magasin = magasinBase("essai-concurrence");
        const maintenant = Date.now();
        await Promise.all(Array.from({ length: 20 }, () => magasin.compter("cle", FENETRE, maintenant)));
        expect((await magasin.compter("cle", FENETRE, maintenant)).count).toBe(21);
    });

    test("dans le middleware : les échecs comptent, les réussites non, puis 429", async () => {
        const limiteur = createRateLimiter({ nom: "essai-mw", magasin: magasinBase("essai-mw"), max: 3, skipSuccessfulRequests: true });
        const app = express();
        app.get("/connexion", limiteur, (req, res) => res.status(req.query.ok ? 200 : 401).json({}));
        for (let i = 0; i < 5; i += 1) expect((await request(app).get("/connexion?ok=1")).status).toBe(200);
        for (let i = 0; i < 3; i += 1) expect((await request(app).get("/connexion")).status).toBe(401);
        const bloque = await request(app).get("/connexion?ok=1");
        expect(bloque.status).toBe(429);
        expect(bloque.body.retryAfter).toBeGreaterThan(0);
    });

    test("purge : seules les fenêtres terminées sont supprimées", async () => {
        const magasin = magasinBase("essai-purge");
        await magasin.compter("ancienne", 1000, Date.now() - 10_000);
        await magasin.compter("en-cours", FENETRE, Date.now());
        expect(await purgerCompteursDebit()).toBeGreaterThanOrEqual(1);
        const [lignes] = await sequelize.query("SELECT cle FROM CompteursDebit WHERE cle LIKE 'essai-purge:%'");
        expect(lignes).toHaveLength(1);
    });
});
