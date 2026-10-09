import crypto from "crypto";
import request from "supertest";
import app from "../../app.js";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AuthSession, MfaDefi, Users } from "../../models/index.js";
import { codeDuPas, depuisBase32, pasDe } from "../../utils/totp.js";

/**
 * Double authentification : obligatoire pour l'administration (configurée avant tout le reste),
 * connexion en deux temps (mot de passe, puis code ou code de secours), un code ne sert qu'une
 * fois, désactivation possible pour un enseignant seulement, réinitialisation par un autre admin.
 */

let admin;
let collegue;
let enseignant;
let secret;
let codesSecours;

// Code que l'application d'authentification afficherait (décalage en pas de 30 s)
const codeApp = (s, decalage = 0) => codeDuPas(depuisBase32(s), pasDe() + decalage);
const cookieDe = (res, nom) => {
    const brut = (res.headers["set-cookie"] || []).find((c) => c.startsWith(`${nom}=`));
    return brut ? decodeURIComponent(brut.split(";")[0].slice(nom.length + 1)) : null;
};

/** Connexion en deux temps ; renvoie un client authentifié (comme loginAs) ou la réponse en échec. */
const connexionMfa = async (user, code) => {
    const agent = request.agent(app);
    const premier = await agent.post("/api/auth/login").send({ email: user.email, password: PASSWORD });
    expect(premier.status).toBe(200);
    expect(premier.body).toMatchObject({ mfa_requis: true });
    expect(premier.body.user).toBeUndefined();
    expect(cookieDe(premier, "access_token")).toBeNull();
    const second = await agent.post("/api/auth/mfa/verifier").send({ defi: premier.body.defi, code });
    const csrf = cookieDe(second, "csrf_token");
    return { reponse: second, defi: premier.body.defi, get: (url) => agent.get(url), send: (m, url, body = {}) => agent[m](url).set("X-CSRF-Token", csrf).send(body) };
};

beforeAll(async () => {
    process.env.MFA_ADMINS_OBLIGATOIRE = "true";
    await resetDatabase();
    admin = await createUser("admin");
    collegue = await createUser("admin");
    enseignant = await createUser("enseignant");
});
afterAll(async () => {
    process.env.MFA_ADMINS_OBLIGATOIRE = "false";
    await closeDatabase();
});
beforeEach(resetRateLimiters);

describe("Administrateur sans double authentification", () => {
    test("connecté par mot de passe, il ne peut rien faire d'autre que la configurer", async () => {
        const client = await loginAs(admin);
        const moi = await client.get("/api/auth/me");
        expect(moi.body.user).toMatchObject({ mfa_active: false, mfa_a_configurer: true });
        const bloque = await client.get("/api/users");
        expect(bloque.status).toBe(403);
        expect(bloque.body.code).toBe("MFA_SETUP_REQUIRED");
        expect((await client.get("/api/auth/mfa")).body).toEqual({ active: false, obligatoire: true, possible: true, codes_restants: 0 });
    });

    test("inscription : QR code, premier code faux refusé, puis activée avec 10 codes de secours", async () => {
        const client = await loginAs(admin);
        const debut = await client.send("post", "/api/auth/mfa/inscription");
        expect(debut.status).toBe(200);
        secret = debut.body.secret;
        expect(secret).toMatch(/^[A-Z2-7]{32}$/);
        expect(debut.body.adresse).toContain(`secret=${secret}`);
        // Le secret est chiffré en base, jamais renvoyé ailleurs
        const enBase = await Users.scope("withMfa").findByPk(admin.id_user);
        expect(enBase.mfa_secret).not.toContain(secret);
        expect(enBase.mfa_active).toBe(false);

        expect((await client.send("post", "/api/auth/mfa/confirmation", { code: "000000" })).status).toBe(400);
        const fin = await client.send("post", "/api/auth/mfa/confirmation", { code: codeApp(secret) });
        expect(fin.status).toBe(200);
        codesSecours = fin.body.codes_secours;
        expect(codesSecours).toHaveLength(10);
        expect(codesSecours[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect((await client.get("/api/users")).status).toBe(200);
        expect(JSON.stringify((await client.get("/api/users")).body)).not.toMatch(/mfa_secret|mfa_dernier_pas/);
    });
});

describe("Connexion en deux temps", () => {
    test("mot de passe puis code : session ouverte ; le même code ne resert pas", async () => {
        const code = codeApp(secret, 1);
        const client = await connexionMfa(admin, code);
        expect(client.reponse.status).toBe(200);
        expect(client.reponse.body.user).toMatchObject({ id_user: admin.id_user, mfa_active: true, mfa_a_configurer: false });
        expect((await client.get("/api/users")).status).toBe(200);
        // Rejeu du même code (vu par-dessus l'épaule) : refusé
        expect((await connexionMfa(admin, code)).reponse.status).toBe(401);
    });

    test("code de secours : une seule fois, avec ou sans tiret", async () => {
        const [premier] = codesSecours;
        expect((await connexionMfa(admin, premier.replace("-", "").toLowerCase())).reponse.status).toBe(200);
        expect((await connexionMfa(admin, premier)).reponse.status).toBe(401);
        expect((await (await connexionMfa(admin, codesSecours[1])).get("/api/auth/mfa")).body).toMatchObject({ active: true, codes_restants: 8 });
    });

    test("5 codes faux : le défi est perdu, même avec le bon code ensuite", async () => {
        const essai = await connexionMfa(admin, "111111");
        expect(essai.reponse.status).toBe(401);
        for (let i = 0; i < 4; i += 1) await anonymous().post("/api/auth/mfa/verifier").send({ defi: essai.defi, code: "222222" });
        expect(await MfaDefi.findByPk(crypto.createHash("sha256").update(essai.defi).digest("hex"))).toBeNull();
        expect((await anonymous().post("/api/auth/mfa/verifier").send({ defi: essai.defi, code: codesSecours[2] })).status).toBe(401);
        expect((await anonymous().post("/api/auth/mfa/verifier").send({ defi: "inconnu", code: "123456" })).status).toBe(401);
    });

    test("l'application mobile renvoie vers le site web", async () => {
        const res = await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: admin.email, password: PASSWORD });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("MFA_SITE_WEB");
    });
});

describe("Gestion", () => {
    test("un administrateur ne peut pas la désactiver ; un enseignant peut l'activer et la désactiver", async () => {
        const direction = await connexionMfa(admin, codesSecours[3]);
        expect((await direction.send("post", "/api/auth/mfa/desactivation", { password: PASSWORD, code: codesSecours[4] })).status).toBe(403);

        const prof = await loginAs(enseignant);
        expect((await prof.get("/api/auth/mfa")).body).toMatchObject({ active: false, obligatoire: false });
        // Facultative pour un enseignant : rien n'est bloqué sans elle
        expect((await prof.get("/api/annonces")).status).toBe(200);
        const s = (await prof.send("post", "/api/auth/mfa/inscription")).body.secret;
        const { codes_secours: codes } = (await prof.send("post", "/api/auth/mfa/confirmation", { code: codeApp(s) })).body;
        expect((await prof.send("post", "/api/auth/mfa/desactivation", { password: "Faux@2026", code: codes[0] })).status).toBe(400);
        expect((await prof.send("post", "/api/auth/mfa/desactivation", { password: PASSWORD, code: codes[0] })).body).toEqual({ active: false });
        // Connexion de nouveau en un temps
        expect((await anonymous().post("/api/auth/login").send({ email: enseignant.email, password: PASSWORD })).body.user).toBeDefined();
    });

    test("réinitialisation par un autre administrateur : sessions fermées, à reconfigurer", async () => {
        const session = await connexionMfa(admin, codesSecours[5]);
        expect((await session.send("delete", `/api/users/${admin.id_user}/mfa`)).status).toBe(403);

        // Le collègue configure d'abord la sienne, puis réinitialise celle de l'admin (téléphone perdu)
        const autre = await loginAs(collegue);
        const s = (await autre.send("post", "/api/auth/mfa/inscription")).body.secret;
        await autre.send("post", "/api/auth/mfa/confirmation", { code: codeApp(s) });
        expect((await autre.send("delete", `/api/users/${admin.id_user}/mfa`)).body).toEqual({ reinitialisee: true });

        expect((await session.get("/api/auth/me")).status).toBe(401);
        expect(await AuthSession.count({ where: { id_user: admin.id_user, revoked_at: null } })).toBe(0);
        const relogin = await loginAs(admin);
        expect((await relogin.get("/api/auth/me")).body.user.mfa_a_configurer).toBe(true);
    });
});
