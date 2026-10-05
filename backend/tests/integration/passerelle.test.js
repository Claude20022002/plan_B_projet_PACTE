import request from "supertest";
import app from "../../app.js";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { PasserelleWeb, Users } from "../../models/index.js";

/**
 * Passerelle de l'application mobile vers les sites web : un code à usage unique de 60 s,
 * échangé par le navigateur du téléphone contre une session web, puis redirection vers un
 * chemin de la plateforme seulement.
 */

let etudiant;
let jetonMobile;

const demander = (corps, jeton = jetonMobile) => anonymous().post("/api/auth/passerelle").set("X-Client", "mobile").set("Authorization", `Bearer ${jeton}`).send(corps);
const suivre = (code, agent = anonymous()) => agent.get(`/api/auth/passerelle?code=${encodeURIComponent(code)}`);
const cookieAcces = (reponse) => (reponse.headers["set-cookie"] || []).find((c) => c.startsWith("access_token="));

beforeAll(async () => {
    await resetDatabase();
    etudiant = await createUser("etudiant");
    jetonMobile = (await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: etudiant.email, password: PASSWORD })).body.access_token;
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Passerelle mobile → web", () => {
    test("le code ouvre une session web et mène au chemin demandé", async () => {
        const reponse = await demander({ suite: "/biblio/" });
        expect(reponse.status).toBe(201);
        expect(reponse.body.expire_dans).toBe(60);
        // Seule l'empreinte du code est en base
        expect(await PasserelleWeb.count({ where: { code_hash: reponse.body.code } })).toBe(0);

        const navigateur = request.agent(app);
        const suite = await suivre(reponse.body.code, navigateur);
        expect(suite.status).toBe(303);
        expect(suite.headers.location).toBe("/biblio/");
        expect(suite.headers["cache-control"]).toBe("no-store");
        expect(cookieAcces(suite)).toBeDefined();
        // Le navigateur est connecté avec le compte de l'application
        const moi = await navigateur.get("/api/auth/me");
        expect(moi.status).toBe(200);
        expect(moi.body.user.email).toBe(etudiant.email);
    });

    test("usage unique", async () => {
        const { code } = (await demander({ suite: "/jeux" })).body;
        expect((await suivre(code)).headers.location).toBe("/jeux");
        const rejoue = await suivre(code);
        expect(rejoue.status).toBe(303);
        expect(rejoue.headers.location).toBe("/");
        expect(cookieAcces(rejoue)).toBeUndefined();
    });

    test("code expiré, inconnu ou compte désactivé : pas de session", async () => {
        const { code } = (await demander({ suite: "/" })).body;
        await PasserelleWeb.update({ expire_le: new Date(Date.now() - 1000) }, { where: {} });
        expect(cookieAcces(await suivre(code))).toBeUndefined();
        expect((await suivre("inconnu")).headers.location).toBe("/");
        expect((await anonymous().get("/api/auth/passerelle")).headers.location).toBe("/");

        const autre = await createUser("etudiant");
        const jeton = (await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: autre.email, password: PASSWORD })).body.access_token;
        const codeAutre = (await demander({ suite: "/" }, jeton)).body.code;
        await Users.update({ actif: false }, { where: { id_user: autre.id_user } });
        expect(cookieAcces(await suivre(codeAutre))).toBeUndefined();
    });

    test("seuls les chemins de la plateforme sont acceptés", async () => {
        for (const suite of ["//exemple.org", "https://exemple.org", "/\\exemple.org", "javascript:alert(1)", "biblio", "/a b", `/${"x".repeat(300)}`, 42]) {
            expect((await demander({ suite })).status).toBe(400);
        }
        expect((await demander({ suite: "/emploi-du-temps?semaine=2026-10-05" })).status).toBe(201);
    });

    test("réservé à l'application connectée", async () => {
        // Sans jeton : arrêté par la protection CSRF, avant même l'authentification
        expect((await anonymous().post("/api/auth/passerelle").set("X-Client", "mobile").send({ suite: "/" })).status).toBe(403);
        expect((await demander({ suite: "/" }, "jeton-invalide")).status).toBe(401);
        // Session web (cookies) : elle n'en a pas besoin
        const web = await loginAs(etudiant);
        expect((await web.send("post", "/api/auth/passerelle", { suite: "/" })).status).toBe(403);
        // Un navigateur qui se fait passer pour l'application (en-tête Origin)
        expect((await demander({ suite: "/" }).set("Origin", "https://exemple.org")).status).toBe(403);
    });
});
