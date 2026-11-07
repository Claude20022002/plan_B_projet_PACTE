import crypto from "crypto";
import request from "supertest";
import app from "../../app.js";
import sequelize from "../../config/db.js";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { ConfigurationEtablissement, QuizPartie } from "../../models/index.js";
import { oublierIdentite } from "../../services/etablissement/identite.js";
import { definirClientClassQuiz } from "../../services/quiz/clientClassQuiz.js";
import { reinitialiserFournisseur } from "../../services/oidc/provider.js";
import { migrator } from "../../migrations/migrator.js";

/**
 * ClassQuiz derrière une fonctionnalité de l'établissement (plan multi-établissements, lot ME-0c) :
 * éteint pour une installation neuve, allumé pour une base qui avait déjà des comptes (HESTIM).
 * Éteint, le serveur se comporte comme sans ClassQuiz configuré, même quand QUIZ_URL, le secret
 * du webhook et celui du client OpenID Connect sont présents.
 */

const SECRET = crypto.randomBytes(24).toString("hex");
const QUIZ = "https://quiz.hestim.test";
const EMETTEUR = "https://planner.hestim.test/api/oidc";
const QUIZ_ID = crypto.randomUUID();

let enseignant;
let appels;

const allumer = async (actif) => {
    await ConfigurationEtablissement.update({ classquiz_actif: actif }, { where: { id: 1 } });
    oublierIdentite();
};

const webhook = (corps) => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", SECRET).update(`${ts}.${corps}`).digest("hex");
    return anonymous().post("/api/quiz/webhook").set("Content-Type", "application/json").set("X-Hestim-Timestamp", String(ts)).set("X-Hestim-Signature", signature).send(corps);
};
const partieDemarree = () => JSON.stringify({ event: "game.started", game_id: crypto.randomUUID(), game_pin: "482913", quiz_title: "Révision", game_mode: "kahoot", user_email: enseignant.email });

beforeAll(async () => {
    Object.assign(process.env, { QUIZ_URL: QUIZ, QUIZ_WEBHOOK_SECRET: SECRET, CLASSQUIZ_OIDC_CLIENT_SECRET: SECRET, OIDC_ISSUER: EMETTEUR });
    reinitialiserFournisseur();
    await resetDatabase();
    enseignant = await createUser("enseignant");
    definirClientClassQuiz(async (chemin, corps) => {
        appels.push(chemin);
        return { game_id: crypto.randomUUID(), game_pin: "480001", quiz_id: corps?.quiz_id, titre: "Révision", nb_questions: 3, game_mode: "kahoot" };
    });
});
afterAll(async () => {
    definirClientClassQuiz(null);
    for (const cle of ["QUIZ_URL", "QUIZ_WEBHOOK_SECRET", "CLASSQUIZ_OIDC_CLIENT_SECRET", "OIDC_ISSUER"]) delete process.env[cle];
    reinitialiserFournisseur();
    await closeDatabase();
});
beforeEach(() => {
    resetRateLimiters();
    appels = [];
});

describe("ClassQuiz éteint pour l'école", () => {
    beforeAll(() => allumer(false));

    test("le site ne propose pas de lancer un quiz : actif faux, sans adresse", async () => {
        const { status, body } = await (await loginAs(enseignant)).get("/api/quiz/config");
        expect(status).toBe(200);
        expect(body).toEqual({ actif: false, url: null, peutLancer: false });
    });

    test("lancer une partie ou ouvrir un quiz : refusé, sans appeler ClassQuiz", async () => {
        const client = await loginAs(enseignant);
        for (const reponse of [
            await client.send("post", "/api/quiz/parties", { id_quiz: QUIZ_ID }),
            await client.get(`/api/quiz/mes-quiz/${QUIZ_ID}`),
        ]) {
            expect(reponse.status).toBe(503);
            expect(reponse.body.message).toBe("ClassQuiz n'est pas ouvert pour cet établissement");
        }
        expect(appels).toEqual([]);
        expect(await QuizPartie.count()).toBe(0);
    });

    test("le webhook signé est refusé et n'enregistre rien", async () => {
        expect((await webhook(partieDemarree())).status).toBe(503);
        expect(await QuizPartie.count()).toBe(0);
    });

    test("le fournisseur OpenID Connect ne répond pas", async () => {
        expect((await request(app).get("/api/oidc/.well-known/openid-configuration")).status).toBe(404);
    });
});

describe("ClassQuiz allumé pour l'école (HESTIM)", () => {
    beforeAll(() => allumer(true));

    test("tout revient : configuration, partie, webhook et OpenID Connect", async () => {
        const client = await loginAs(enseignant);
        expect((await client.get("/api/quiz/config")).body).toEqual({ actif: true, url: QUIZ, peutLancer: true });
        expect((await webhook(partieDemarree())).status).toBe(201);
        expect((await request(app).get("/api/oidc/.well-known/openid-configuration")).status).toBe(200);
        // Le lancement atteint de nouveau ClassQuiz
        await client.send("post", "/api/quiz/parties", { id_quiz: QUIZ_ID });
        expect(appels).toEqual(["/api/v1/hestim/parties"]);
    });
});

describe("La migration 0057", () => {
    // Rejoue 0057 sur la base de test : vide de comptes, puis avec un compte
    const rejouer = async () => {
        await migrator.down({ to: "0057-classquiz-par-etablissement.js" });
        await migrator.up();
        oublierIdentite();
        return (await ConfigurationEtablissement.findByPk(1)).classquiz_actif;
    };

    test("éteint pour une installation neuve, allumé pour une base qui a déjà des comptes", async () => {
        expect(await rejouer()).toBe(true);
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        const [comptes] = await sequelize.query("SELECT * FROM Users");
        await sequelize.query("DELETE FROM Users");
        try {
            expect(await rejouer()).toBe(false);
        } finally {
            await sequelize.getQueryInterface().bulkInsert("Users", comptes);
            await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        }
    });
});
