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
import { Users, Etudiant } from "../../models/index.js";

let admin;
let etudiant;
let clients;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    etudiant = await createUser("etudiant");
    clients = { admin: await loginAs(admin), etudiant: await loginAs(etudiant) };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Création d'utilisateur par l'admin", () => {
    test("crée un compte utilisable : mot de passe haché, téléphone vide accepté", async () => {
        const response = await clients.admin.send("post", "/api/users", {
            nom: "Bennani",
            prenom: "Salma",
            email: "salma.bennani@hestim.test",
            role: "enseignant",
            telephone: "",
            password: "Bienvenue@2026",
        });
        expect(response.status).toBe(201);
        expect(containsPasswordHash(response.body)).toBe(false);

        const stored = await Users.scope("withPassword").findOne({ where: { email: "salma.bennani@hestim.test" } });
        expect(stored.password_hash).toMatch(/^\$2[aby]\$/);

        const login = await anonymous()
            .post("/api/auth/login")
            .send({ email: "salma.bennani@hestim.test", password: "Bienvenue@2026" });
        expect(login.status).toBe(200);
    });

    test("refuse un mot de passe faible", async () => {
        const response = await clients.admin.send("post", "/api/users", {
            nom: "A", prenom: "B", email: "faible@hestim.test", role: "etudiant", password: "motdepasse",
        });
        expect(response.status).toBe(400);
    });

    test("ignore un password_hash fourni par le client", async () => {
        const response = await clients.admin.send("post", "/api/users", {
            nom: "C", prenom: "D", email: "hash@hestim.test", role: "etudiant",
            password: "Bienvenue@2026", password_hash: "en-clair",
        });
        expect(response.status).toBe(201);
        const stored = await Users.scope("withPassword").findOne({ where: { email: "hash@hestim.test" } });
        expect(stored.password_hash).not.toBe("en-clair");
    });

    test("un non-admin ne crée pas de compte", async () => {
        const response = await clients.etudiant.send("post", "/api/users", {
            nom: "E", prenom: "F", email: "intrus@hestim.test", role: "admin", password: "Bienvenue@2026",
        });
        expect(response.status).toBe(403);
    });
});

describe("Modification de son propre profil", () => {
    test("ne permet ni de devenir admin, ni de se réactiver, ni de changer d'email", async () => {
        const response = await clients.etudiant.send("put", `/api/users/${etudiant.id_user}`, {
            nom: "NouveauNom",
            role: "admin",
            actif: true,
            email: "nouvel.email@hestim.test",
        });
        expect(response.status).toBe(200);

        await etudiant.reload();
        expect(etudiant.role).toBe("etudiant");
        expect(etudiant.email).not.toBe("nouvel.email@hestim.test");
        expect(etudiant.nom).toBe("NouveauNom");

        // Et le rôle effectif reste étudiant
        expect((await clients.etudiant.get("/api/users")).status).toBe(403);
    });

    test("changer son mot de passe exige l'actuel", async () => {
        const sansActuel = await clients.etudiant.send("put", `/api/users/${etudiant.id_user}`, {
            password: "Nouveau@2026",
        });
        expect(sansActuel.status).toBe(400);

        const mauvais = await clients.etudiant.send("put", `/api/users/${etudiant.id_user}`, {
            password: "Nouveau@2026",
            current_password: "Faux@2026",
        });
        expect(mauvais.status).toBe(400);

        const ok = await clients.etudiant.send("put", `/api/users/${etudiant.id_user}`, {
            password: "Nouveau@2026",
            current_password: PASSWORD,
        });
        expect(ok.status).toBe(200);
    });

    test("un étudiant ne modifie pas sa fiche de scolarité", async () => {
        const response = await clients.etudiant.send("put", `/api/etudiants/${etudiant.id_user}`, {
            numero_etudiant: "HACK001",
        });
        expect(response.status).toBe(403);
        const fiche = await Etudiant.findByPk(etudiant.id_user);
        expect(fiche.numero_etudiant).not.toBe("HACK001");
    });

    test("l'admin peut changer le rôle d'un compte", async () => {
        const cible = await createUser("etudiant");
        const response = await clients.admin.send("put", `/api/users/${cible.id_user}`, { role: "enseignant" });
        expect(response.status).toBe(200);
        await cible.reload();
        expect(cible.role).toBe("enseignant");
    });
});

describe("Aucune fuite de hash", () => {
    test("GET /api/users et /api/auth/me ne contiennent pas password_hash", async () => {
        const list = await clients.admin.get("/api/users");
        const me = await clients.admin.get("/api/auth/me");
        expect(list.status).toBe(200);
        expect(me.status).toBe(200);
        expect(containsPasswordHash(list.body)).toBe(false);
        expect(containsPasswordHash(me.body)).toBe(false);
    });
});
