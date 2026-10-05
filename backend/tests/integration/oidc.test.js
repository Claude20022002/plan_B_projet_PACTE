import crypto from "crypto";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { idCompte, idUserDe, reinitialiserFournisseur } from "../../services/oidc/provider.js";

/**
 * Phase Q : Planner fournisseur OpenID Connect pour ClassQuiz. Un enseignant connecté à Planner
 * obtient un ID token au format qu'attend ClassQuiz (sub UUID, revendications dans l'ID token,
 * refresh token) ; un visiteur passe par /connexion ; un étudiant est refusé.
 */

const SECRET = crypto.randomBytes(24).toString("hex");
const QUIZ = "https://quiz.hestim.test";
const REDIRECTION = `${QUIZ}/api/v1/users/oauth/custom/auth`;
const EMETTEUR = "https://planner.hestim.test/api/oidc";

let enseignant;
let etudiant;

const chemin = (location) => {
    const url = new URL(location, EMETTEUR);
    return url.pathname + url.search;
};
const demande = (extra = {}) => `/api/oidc/auth?${new URLSearchParams({
    client_id: "classquiz",
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: REDIRECTION,
    state: "etat-1",
    nonce: "nonce-1",
    ...extra,
})}`;

/** Suit les redirections internes au fournisseur jusqu'à sortir de /api/oidc. */
const parcourir = async (agent, url) => {
    let reponse = await agent.get(url);
    for (let i = 0; i < 5 && [302, 303].includes(reponse.status) && chemin(reponse.headers.location).startsWith("/api/oidc/"); i++) {
        reponse = await agent.get(chemin(reponse.headers.location));
    }
    return reponse;
};

beforeAll(async () => {
    Object.assign(process.env, { CLASSQUIZ_OIDC_CLIENT_SECRET: SECRET, QUIZ_URL: QUIZ, OIDC_ISSUER: EMETTEUR });
    reinitialiserFournisseur();
    await resetDatabase();
    enseignant = await createUser("enseignant", { prenom: "Amina", nom: "Lahlou", email: "amina.lahlou@hestim.test" });
    etudiant = await createUser("etudiant");
});
afterAll(async () => {
    delete process.env.CLASSQUIZ_OIDC_CLIENT_SECRET;
    reinitialiserFournisseur();
    await closeDatabase();
});
beforeEach(resetRateLimiters);

describe("Fournisseur OpenID Connect pour ClassQuiz", () => {
    test("découverte : émetteur, points d'accès publics (derrière la passerelle) et clés publiques seulement", async () => {
        // ClassQuiz lit la découverte par l'adresse publique : Caddy puis nginx transmettent hôte et protocole
        const decouverte = await request(app).get("/api/oidc/.well-known/openid-configuration")
            .set("X-Forwarded-Proto", "https").set("X-Forwarded-Host", "planner.hestim.test");
        expect(decouverte.status).toBe(200);
        expect(decouverte.body).toMatchObject({ issuer: EMETTEUR, token_endpoint: `${EMETTEUR}/token` });
        expect(decouverte.body.id_token_signing_alg_values_supported).toContain("RS256");

        const jwks = await request(app).get(chemin(decouverte.body.jwks_uri));
        expect(jwks.body.keys).toHaveLength(1);
        expect(jwks.body.keys[0]).not.toHaveProperty("d");
    });

    test("un enseignant connecté à Planner obtient un ID token au format de ClassQuiz", async () => {
        const client = await loginAs(enseignant);
        const retour = await parcourir(client.agent, demande());
        expect(retour.status).toBe(303);
        const url = new URL(retour.headers.location);
        expect(url.origin + url.pathname).toBe(REDIRECTION);
        expect(url.searchParams.get("state")).toBe("etat-1");
        const code = url.searchParams.get("code");
        expect(code).toBeTruthy();

        const jetons = await request(app).post("/api/oidc/token").auth("classquiz", SECRET).type("form")
            .send({ grant_type: "authorization_code", code, redirect_uri: REDIRECTION });
        expect(jetons.status).toBe(200);
        expect(jetons.body.refresh_token).toBeTruthy(); // exigé par ClassQuiz

        const { keys } = (await request(app).get("/api/oidc/jwks")).body;
        const cle = crypto.createPublicKey({ key: keys[0], format: "jwk" });
        const identite = jwt.verify(jetons.body.id_token, cle, { algorithms: ["RS256"], issuer: EMETTEUR, audience: "classquiz" });
        expect(identite).toMatchObject({
            sub: idCompte(enseignant.id_user),
            nonce: "nonce-1",
            email: "amina.lahlou@hestim.test",
            email_verified: true,
            preferred_username: "amina.lahlou",
            name: "Amina Lahlou",
        });
        expect(identite.sub).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(idUserDe(identite.sub)).toBe(enseignant.id_user);

        // Le code ne se rejoue pas
        const rejeu = await request(app).post("/api/oidc/token").auth("classquiz", SECRET).type("form")
            .send({ grant_type: "authorization_code", code, redirect_uri: REDIRECTION });
        expect(rejeu.status).toBe(400);
    });

    test("le jeton du fournisseur n'ouvre pas l'API de Planner (autre émetteur, autre audience)", async () => {
        const client = await loginAs(enseignant);
        const code = new URL((await parcourir(client.agent, demande())).headers.location).searchParams.get("code");
        const { body } = await request(app).post("/api/oidc/token").auth("classquiz", SECRET).type("form")
            .send({ grant_type: "authorization_code", code, redirect_uri: REDIRECTION });

        for (const jeton of [body.id_token, body.access_token]) {
            const reponse = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${jeton}`);
            expect(reponse.status).toBe(401);
        }
    });

    test("sans session Planner : passage par la page de connexion, qui ramène à l'interaction", async () => {
        const agent = request.agent(app);
        const reponse = await parcourir(agent, demande());
        expect(reponse.status).toBe(303);
        const url = new URL(reponse.headers.location, EMETTEUR);
        expect(url.pathname).toBe("/connexion");
        expect(url.searchParams.get("next")).toMatch(/^\/api\/oidc\/interaction\/[A-Za-z0-9_-]+$/);
    });

    test("un étudiant est refusé : access_denied renvoyé à ClassQuiz, sans code", async () => {
        const client = await loginAs(etudiant);
        const reponse = await parcourir(client.agent, demande());
        const url = new URL(reponse.headers.location);
        expect(url.origin + url.pathname).toBe(REDIRECTION);
        expect(url.searchParams.get("error")).toBe("access_denied");
        expect(url.searchParams.get("code")).toBeNull();
    });

    test("adresse de retour inconnue ou mauvais secret : refus sans redirection", async () => {
        const client = await loginAs(enseignant);
        const detourne = await client.agent.get(demande({ redirect_uri: "https://pirate.test/vol" }));
        expect(detourne.status).toBe(400);
        expect(detourne.headers.location).toBeUndefined();

        const mauvais = await request(app).post("/api/oidc/token").auth("classquiz", "faux-secret").type("form")
            .send({ grant_type: "authorization_code", code: "x", redirect_uri: REDIRECTION });
        expect(mauvais.status).toBe(401);
    });

    test("un compte désactivé après coup n'obtient plus de jeton", async () => {
        const prof = await createUser("enseignant");
        const client = await loginAs(prof);
        const code = new URL((await parcourir(client.agent, demande())).headers.location).searchParams.get("code");
        await prof.update({ actif: false });

        const jetons = await request(app).post("/api/oidc/token").auth("classquiz", SECRET).type("form")
            .send({ grant_type: "authorization_code", code, redirect_uri: REDIRECTION });
        expect(jetons.status).toBe(400);
    });
});
