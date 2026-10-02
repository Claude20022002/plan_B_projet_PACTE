import {
    resetDatabase,
    closeDatabase,
    createUser,
    loginAs,
    anonymous,
    containsPasswordHash,
    PASSWORD,
} from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { PasswordResetToken, AuthSession } from "../../models/index.js";
import crypto from "crypto";

beforeAll(resetDatabase);
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Inscription publique", () => {
    test("POST /api/auth/register n'existe plus", async () => {
        const response = await anonymous()
            .post("/api/auth/register")
            .send({ nom: "X", prenom: "Y", email: "pirate@x.test", password: PASSWORD, role: "admin" });
        expect(response.status).toBe(404);
    });
});

describe("Connexion", () => {
    test("réussit, pose les cookies et ne renvoie jamais le hash", async () => {
        const admin = await createUser("admin");
        const response = await anonymous().post("/api/auth/login").send({ email: admin.email, password: PASSWORD });

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(admin.email);
        expect(containsPasswordHash(response.body)).toBe(false);
        const cookies = response.headers["set-cookie"].join(";");
        expect(cookies).toMatch(/access_token=.*HttpOnly/);
        expect(cookies).toMatch(/SameSite=Strict/i);
    });

    test("même réponse 401 pour un email inconnu et un mauvais mot de passe", async () => {
        const user = await createUser("etudiant");
        const unknown = await anonymous().post("/api/auth/login").send({ email: "inconnu@x.test", password: PASSWORD });
        const wrong = await anonymous().post("/api/auth/login").send({ email: user.email, password: "Mauvais@123" });

        expect(unknown.status).toBe(401);
        expect(wrong.status).toBe(401);
        expect(unknown.body).toEqual(wrong.body);
    });

    test("un compte désactivé n'est révélé qu'avec le bon mot de passe", async () => {
        const user = await createUser("etudiant", { actif: false });
        const wrong = await anonymous().post("/api/auth/login").send({ email: user.email, password: "Mauvais@123" });
        const right = await anonymous().post("/api/auth/login").send({ email: user.email, password: PASSWORD });

        expect(wrong.status).toBe(401);
        expect(right.status).toBe(403);
    });

    test("rejette un email non textuel (pas de clause IN injectée)", async () => {
        const user = await createUser("etudiant");
        const response = await anonymous()
            .post("/api/auth/login")
            .send({ email: [user.email, "autre@x.test"], password: PASSWORD });
        expect(response.status).toBe(400);
    });

    test("bloque après 20 tentatives (429)", async () => {
        const statuses = [];
        for (let i = 0; i < 21; i += 1) {
            const response = await anonymous()
                .post("/api/auth/login")
                .send({ email: "brute@x.test", password: `Essai@${i}` });
            statuses.push(response.status);
        }
        expect(statuses.slice(0, 20).every((status) => status === 401)).toBe(true);
        expect(statuses[20]).toBe(429);
    });
});

describe("Protection CSRF", () => {
    test("une requête modifiante sans en-tête X-CSRF-Token est refusée", async () => {
        const etudiant = await createUser("etudiant");
        const client = await loginAs(etudiant);

        const withoutHeader = await client.agent.post("/api/auth/logout-all").send({});
        expect(withoutHeader.status).toBe(403);
        expect(withoutHeader.body.code).toBe("CSRF_INVALID");

        const withHeader = await client.send("post", "/api/auth/logout-all");
        expect(withHeader.status).toBe(200);
    });

    test("une origine non autorisée est refusée", async () => {
        const etudiant = await createUser("etudiant");
        const client = await loginAs(etudiant);
        const response = await client.agent
            .post("/api/auth/logout-all")
            .set("Origin", "https://site-malveillant.example")
            .set("X-CSRF-Token", client.csrf)
            .send({});
        expect(response.status).toBe(403);
    });
});

describe("Sessions", () => {
    test("après déconnexion, l'ancien jeton d'accès est refusé", async () => {
        const etudiant = await createUser("etudiant");
        const client = await loginAs(etudiant);
        expect((await client.get("/api/auth/me")).status).toBe(200);

        // Le cookie d'accès (encore valide 15 min) est rejoué tel quel après la déconnexion
        await client.send("post", "/api/auth/logout");

        const replay = await anonymous().get("/api/auth/me").set("Cookie", client.accessCookie);
        expect(replay.status).toBe(401);
    });

    test("réinitialiser le mot de passe révoque toutes les sessions", async () => {
        const etudiant = await createUser("etudiant");
        const client = await loginAs(etudiant);

        const token = crypto.randomBytes(32).toString("hex");
        await PasswordResetToken.create({
            id_user: etudiant.id_user,
            token: crypto.createHash("sha256").update(token).digest("hex"),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
            used: false,
        });

        const reset = await anonymous()
            .post("/api/auth/reset-password")
            .send({ token, id_user: etudiant.id_user, password: "Nouveau@2026" });
        expect(reset.status).toBe(200);

        const actives = await AuthSession.count({ where: { id_user: etudiant.id_user, revoked_at: null } });
        expect(actives).toBe(0);
        expect((await client.get("/api/auth/me")).status).toBe(401);
    });

    test("mot de passe oublié : même réponse pour un compte inconnu ou désactivé", async () => {
        const inactif = await createUser("etudiant", { actif: false });
        const unknown = await anonymous().post("/api/auth/forgot-password").send({ email: "personne@x.test" });
        const disabled = await anonymous().post("/api/auth/forgot-password").send({ email: inactif.email });

        expect(unknown.status).toBe(200);
        expect(disabled.status).toBe(200);
        expect(unknown.body).toEqual(disabled.body);
    });
});
