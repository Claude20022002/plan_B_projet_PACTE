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
import { Users, Etudiant, Enseignant } from "../../models/index.js";

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

describe("Liste des comptes", () => {
    test("filtre par rôle ; un rôle inconnu est ignoré", async () => {
        const etudiants = await clients.admin.get("/api/users?role=etudiant&limit=100");
        expect(etudiants.body.data.length).toBeGreaterThan(0);
        expect(etudiants.body.data.every((u) => u.role === "etudiant")).toBe(true);
        const tous = await clients.admin.get("/api/users?role=intrus&limit=100");
        expect(new Set(tous.body.data.map((u) => u.role)).size).toBeGreaterThan(1);
    });
});

describe("Invitations et mot de passe provisoire (phase B)", () => {
    test("sans mot de passe : fiche créée, lien d'invitation, aucun mot de passe connu", async () => {
        const response = await clients.admin.send("post", "/api/users", {
            nom: "Lazrak", prenom: "Omar", email: "omar.lazrak@hestim.test", role: "enseignant",
            profil: { departement: "Génie civil", specialite: "BIM", statut: "vacataire" },
        });
        expect(response.status).toBe(201);
        expect(response.body.user.must_change_password).toBe(true);
        expect(response.body.invitation.lien).toMatch(/reset-password\?token=[0-9a-f]{64}&id=\d+&invitation=1/);
        expect(await Enseignant.findByPk(response.body.user.id_user)).toMatchObject({ departement: "Génie civil", statut: "vacataire" });
        for (const essai of ["password123", PASSWORD]) {
            expect((await anonymous().post("/api/auth/login").send({ email: "omar.lazrak@hestim.test", password: essai })).status).toBe(401);
        }

        // Le lien d'invitation permet de choisir son mot de passe, et lève l'obligation
        const lien = new URL(response.body.invitation.lien);
        const reset = await anonymous().post("/api/auth/reset-password").send({ token: lien.searchParams.get("token"), id_user: lien.searchParams.get("id"), password: "Choisi@2026" });
        expect(reset.status).toBe(200);
        const client = await loginAs({ email: "omar.lazrak@hestim.test" }, "Choisi@2026");
        expect((await client.get("/api/auth/me")).body.user.must_change_password).toBe(false);
    });

    test("mot de passe provisoire : tout est bloqué tant qu'il n'est pas changé", async () => {
        await clients.admin.send("post", "/api/users", { nom: "Tazi", prenom: "Rim", email: "rim.tazi@hestim.test", role: "etudiant", password: "Provisoire@2026" });
        const client = await loginAs({ email: "rim.tazi@hestim.test" }, "Provisoire@2026");
        const me = await client.get("/api/auth/me");
        expect(me.status).toBe(200);
        expect(me.body.user.must_change_password).toBe(true);
        const bloque = await client.get("/api/auth/sessions");
        expect(bloque.status).toBe(403);
        expect(bloque.body.code).toBe("PASSWORD_CHANGE_REQUIRED");

        expect((await client.send("post", "/api/auth/change-password", { current_password: "faux", password: "Nouveau@2026" })).status).toBe(400);
        expect((await client.send("post", "/api/auth/change-password", { current_password: "Provisoire@2026", password: "Provisoire@2026" })).status).toBe(400);
        expect((await client.send("post", "/api/auth/change-password", { current_password: "Provisoire@2026", password: "Nouveau@2026" })).status).toBe(200);
        expect((await client.get("/api/auth/sessions")).status).toBe(200);
    });

    test("un mot de passe redéfini par l'administration est provisoire", async () => {
        const cible = await createUser("enseignant");
        await clients.admin.send("put", `/api/users/${cible.id_user}`, { password: "Temporaire@2026" });
        expect((await Users.findByPk(cible.id_user)).must_change_password).toBe(true);
    });

    test("import sans mot de passe : plus de « password123 »", async () => {
        const response = await clients.admin.send("post", "/api/users/import", { users: [{ nom: "Squalli", prenom: "Ali", email: "ali.squalli@hestim.test", role: "etudiant", numero_etudiant: "E-SQ-1", niveau: "1ère année" }] });
        expect(response.body.successCount).toBe(1);
        expect((await anonymous().post("/api/auth/login").send({ email: "ali.squalli@hestim.test", password: "password123" })).status).toBe(401);
        expect(await Etudiant.findOne({ where: { numero_etudiant: "E-SQ-1" } })).not.toBeNull();
    });
});
