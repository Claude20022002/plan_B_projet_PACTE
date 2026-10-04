import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, Cours, Filiere, Groupe } from "../../models/index.js";

/**
 * Phase C1 : Planner fournisseur d'identité. Jetons RS256 vérifiables avec le JWKS, client mobile
 * (jetons dans le corps), CSRF limité à l'authentification par cookies, référentiel pour StudyLib.
 */

let etudiant;
let enseignant;
let groupeTd;

const MOBILE = { "X-Client": "mobile" };
const cookieDe = (reponse, nom) => (reponse.headers["set-cookie"] || []).find((c) => c.startsWith(`${nom}=`));
const jetonDuCookie = (reponse) => decodeURIComponent(cookieDe(reponse, "access_token").split(";")[0].slice("access_token=".length));
const connexionMobile = (user) => anonymous().post("/api/auth/login").set(MOBILE).send({ email: user.email, password: PASSWORD });

beforeAll(async () => {
    await resetDatabase();
    enseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    const filiere = await Filiere.create({ code_filiere: "IIIA", nom_filiere: "Ingénierie informatique et IA", ecole: "engineering", cycle: "ingenieur" });
    const promo = await Groupe.create({ nom_groupe: "4A IIIA", niveau: "4ème année", annee: 4, effectif: 30, annee_scolaire: "2026-2027", type_groupe: "promotion", id_filiere: filiere.id_filiere });
    groupeTd = await Groupe.create({ nom_groupe: "IIIA-4A", niveau: "4ème année", annee: 4, effectif: 15, annee_scolaire: "2026-2027", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etudiant.id_user, id_groupe: promo.id_groupe },
        { id_user_etudiant: etudiant.id_user, id_groupe: groupeTd.id_groupe },
    ]);
    await Cours.create({ code_cours: "IIIA-ML", nom_cours: "Machine Learning", niveau: "4ème année", volume_horaire: 30, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Jetons RS256 et JWKS", () => {
    test("le jeton d'accès se vérifie avec la clé publiée, pour Planner et StudyLib, et porte l'identité", async () => {
        const jwks = await anonymous().get("/api/.well-known/jwks.json");
        expect(jwks.status).toBe(200);
        expect(jwks.headers["cache-control"]).toMatch(/max-age=600/);
        const [cle] = jwks.body.keys;
        expect(cle).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig" });
        expect(cle).not.toHaveProperty("d"); // jamais la partie privée

        const connexion = await anonymous().post("/api/auth/login").send({ email: etudiant.email, password: PASSWORD });
        const jeton = jetonDuCookie(connexion);
        const { header } = jwt.decode(jeton, { complete: true });
        expect(header).toMatchObject({ alg: "RS256", kid: cle.kid });

        const clePublique = crypto.createPublicKey({ key: cle, format: "jwk" });
        const charge = jwt.verify(jeton, clePublique, { algorithms: ["RS256"], audience: "studylib", issuer: "hestim-planner" });
        expect(charge).toMatchObject({ sub: String(etudiant.id_user), role: "etudiant", email: etudiant.email, filiere: "IIIA", groupe: "IIIA-4A", annee: 4 });
        expect(charge.aud).toEqual(["planner", "studylib"]);
        expect(charge.sid).toBeTruthy();
    });

    test("jeton forgé refusé : HS256 signé avec la clé publique, alg none, kid inconnu", async () => {
        const { keys } = (await anonymous().get("/api/.well-known/jwks.json")).body;
        const connexion = await anonymous().post("/api/auth/login").send({ email: enseignant.email, password: PASSWORD });
        const vrai = jwt.decode(jetonDuCookie(connexion));
        const charge = { sub: vrai.sub, sid: vrai.sid, role: "admin", iss: "hestim-planner", aud: ["planner"] };

        const pemPublic = crypto.createPublicKey({ key: keys[0], format: "jwk" }).export({ type: "spki", format: "pem" });
        const hs256 = jwt.sign(charge, pemPublic, { algorithm: "HS256", keyid: keys[0].kid });
        const aucun = `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT", kid: keys[0].kid })).toString("base64url")}.${Buffer.from(JSON.stringify(charge)).toString("base64url")}.`;
        const autreCle = jwt.sign(charge, crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey, { algorithm: "RS256", keyid: "inconnu" });
        const usurpe = jwt.sign(charge, crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey, { algorithm: "RS256", keyid: keys[0].kid });

        for (const jeton of [hs256, aucun, autreCle, usurpe]) {
            const reponse = await anonymous().get("/api/auth/me").set("Authorization", `Bearer ${jeton}`);
            expect(reponse.status).toBe(401);
        }
    });
});

describe("Client mobile", () => {
    test("connexion : jetons dans le corps, aucun cookie ; l'API répond au Bearer", async () => {
        const reponse = await connexionMobile(etudiant);
        expect(reponse.status).toBe(200);
        expect(reponse.body).toMatchObject({ token_type: "Bearer", expires_in: expect.any(Number) });
        expect(reponse.body.access_token).toBeTruthy();
        expect(reponse.body.refresh_token).toBeTruthy();
        expect(reponse.headers["set-cookie"]).toBeUndefined();

        const moi = await anonymous().get("/api/auth/me").set("Authorization", `Bearer ${reponse.body.access_token}`);
        expect(moi.status).toBe(200);
        expect(moi.body.user.email).toBe(etudiant.email);
    });

    test("renouvellement par le corps avec rotation ; un ancien jeton rejoué révoque toute la famille", async () => {
        const premier = (await connexionMobile(enseignant)).body;
        const second = await anonymous().post("/api/auth/refresh").set(MOBILE).send({ refresh_token: premier.refresh_token });
        expect(second.status).toBe(200);
        expect(second.body.refresh_token).not.toBe(premier.refresh_token);
        expect(second.headers["set-cookie"]).toBeUndefined();

        // Rejeu de l'ancien jeton (vol présumé) : refus, et la session renouvelée tombe aussi
        const rejeu = await anonymous().post("/api/auth/refresh").set(MOBILE).send({ refresh_token: premier.refresh_token });
        expect(rejeu.status).toBe(403);
        expect(rejeu.body.code).toBe("REFRESH_REUSE_DETECTED");
        const apres = await anonymous().get("/api/auth/me").set("Authorization", `Bearer ${second.body.access_token}`);
        expect(apres.status).toBe(401);
        expect((await anonymous().post("/api/auth/refresh").set(MOBILE).send({ refresh_token: second.body.refresh_token })).status).toBe(403);
    });

    test("un navigateur ne peut pas se présenter comme l'application (en-tête Origin)", async () => {
        const reponse = await anonymous().post("/api/auth/login").set(MOBILE).set("Origin", "http://localhost:5173").send({ email: etudiant.email, password: PASSWORD });
        expect(reponse.status).toBe(400);
        expect(reponse.body.access_token).toBeUndefined();
    });

    test("Bearer sans cookie : pas de jeton CSRF exigé ; la déconnexion révoque la session", async () => {
        const { access_token, refresh_token } = (await connexionMobile(etudiant)).body;
        const sortie = await anonymous().post("/api/auth/logout").set(MOBILE).set("Authorization", `Bearer ${access_token}`).send({ refresh_token });
        expect(sortie.status).toBe(200);
        expect((await anonymous().get("/api/auth/me").set("Authorization", `Bearer ${access_token}`)).status).toBe(401);
        expect((await anonymous().post("/api/auth/refresh").set(MOBILE).send({ refresh_token })).status).toBe(403);
    });
});

describe("CSRF limité aux cookies", () => {
    test("session par cookies : une écriture sans jeton CSRF est refusée, même avec un Bearer en plus", async () => {
        const client = await loginAs(enseignant);
        expect((await client.agent.post("/api/auth/logout")).status).toBe(403);
        const { access_token } = (await connexionMobile(enseignant)).body;
        const mixte = await client.agent.post("/api/auth/logout").set("Authorization", `Bearer ${access_token}`);
        expect(mixte.status).toBe(403);
        expect((await client.send("post", "/api/auth/logout")).status).toBe(200);
    });
});

describe("Référentiel pour StudyLib", () => {
    const JETON = "integration-de-test-0123456789abcdef";

    afterEach(() => {
        delete process.env.INTEGRATION_TOKEN;
    });

    test("désactivé sans jeton configuré ; refusé sans le bon jeton ; données publiques de la maquette sinon", async () => {
        expect((await anonymous().get("/api/integration/referentiel")).status).toBe(503);
        process.env.INTEGRATION_TOKEN = "court";
        expect((await anonymous().get("/api/integration/referentiel").set("X-Integration-Token", "court")).status).toBe(503);

        process.env.INTEGRATION_TOKEN = JETON;
        expect((await anonymous().get("/api/integration/referentiel")).status).toBe(401);
        expect((await anonymous().get("/api/integration/referentiel").set("X-Integration-Token", `${JETON}x`)).status).toBe(401);
        // Un jeton d'utilisateur ne suffit pas
        const { access_token } = (await connexionMobile(enseignant)).body;
        expect((await anonymous().get("/api/integration/referentiel").set("Authorization", `Bearer ${access_token}`)).status).toBe(401);

        const reponse = await anonymous().get("/api/integration/referentiel").set("X-Integration-Token", JETON);
        expect(reponse.status).toBe(200);
        expect(reponse.body.filieres).toEqual([{ code: "IIIA", nom: "Ingénierie informatique et IA", ecole: "engineering", cycle: "ingenieur" }]);
        expect(reponse.body.modules).toEqual([{ code: "IIIA-ML", nom: "Machine Learning", semestre: 7, filiere: "IIIA", ects: null }]);
        // Rien de personnel dans le référentiel
        expect(JSON.stringify(reponse.body)).not.toMatch(/@/);
    });
});
