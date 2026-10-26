import fs from "node:fs";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { JournalSecurite } from "../../models/index.js";
import { oublierIdentite, nomProduit } from "../../services/etablissement/identite.js";
import { personnaliserCourriel } from "../../utils/sendEmail.js";

/**
 * Identité et marque de l'école (D-21, lots ME-1 et ME-11) : lecture publique (page de connexion,
 * application), réglage par l'administration seule, couleurs illisibles et faux logos refusés.
 * La migration 0055 crée la ligne de l'école pilote, logo compris.
 */

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a80000000049454e44ae426082", "hex");

let admin;
let enseignant;
let direction;

beforeAll(async () => {
    await resetDatabase();
    oublierIdentite();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    direction = await loginAs(admin);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const envoyerLogo = (octets, type = "image/png") => direction.agent.put("/api/etablissement/logo").set("X-CSRF-Token", direction.csrf).set("Content-Type", type).send(octets);

describe("Lecture publique", () => {
    test("sans connexion : nom, produit, couleurs et version du logo de l'école pilote, jamais l'expéditeur", async () => {
        const res = await anonymous().get("/api/etablissement");
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ nom: "HESTIM Engineering & Business School", nom_court: "HESTIM", produit: "HESTIM Planner", couleur_principale: "#001861", couleur_accent: "#F26322" });
        expect(res.body.logo.version).toEqual(expect.any(Number));
        expect(res.body).not.toHaveProperty("adresse_reponse");
        expect(res.body).not.toHaveProperty("expediteur_nom");
    });

    test("le logo se lit sans connexion, avec son vrai type et sans détection par le navigateur", async () => {
        const res = await anonymous().get("/api/etablissement/logo");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toBe("image/png");
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(Buffer.compare(res.body, fs.readFileSync(new URL("../../assets/ecole/logo-hestim.png", import.meta.url)))).toBe(0);
    });
});

describe("Réglage par l'administration", () => {
    test("réservé à l'administration : 401 sans connexion, 403 pour un enseignant", async () => {
        expect((await anonymous().get("/api/etablissement/configuration")).status).toBe(401);
        const prof = await loginAs(enseignant);
        expect((await prof.get("/api/etablissement/configuration")).status).toBe(403);
        expect((await prof.send("put", "/api/etablissement", { nom_court: "EMSI" })).status).toBe(403);
    });

    test("nom court, couleurs et expéditeur changent ; le produit suit ; l'action est journalisée", async () => {
        const res = await direction.send("put", "/api/etablissement", { nom_court: "EMSI", couleur_principale: "#00573f", couleur_accent: "#0E7490", expediteur_nom: "Scolarité EMSI", adresse_reponse: "scolarite@emsi.example" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ nom_court: "EMSI", produit: "EMSI Planner", couleur_principale: "#00573F" });
        expect(await nomProduit()).toBe("EMSI Planner");
        const configuration = await direction.get("/api/etablissement/configuration");
        expect(configuration.body).toMatchObject({ expediteur_nom: "Scolarité EMSI", adresse_reponse: "scolarite@emsi.example" });
        expect(await JournalSecurite.count({ where: { evenement: "identite_ecole_modifiee" } })).toBe(1);
    });

    test("couleur illisible refusée avec un message qui dit quoi faire", async () => {
        const claire = await direction.send("put", "/api/etablissement", { couleur_principale: "#FFD700" });
        expect(claire.status).toBe(400);
        expect(claire.body.code).toBe("COULEUR_ILLISIBLE");
        expect(claire.body.message).toMatch(/plus foncée/);
        // Accent trop sombre : lisible sur blanc, illisible sur le panneau noir
        const sombre = await direction.send("put", "/api/etablissement", { couleur_accent: "#8B0000" });
        expect(sombre.status).toBe(400);
        expect(sombre.body.message).toMatch(/panneau noir/);
        expect((await direction.send("put", "/api/etablissement", { couleur_accent: "orange" })).status).toBe(400);
        expect((await anonymous().get("/api/etablissement")).body.couleur_principale).toBe("#00573F");
    });

    test("champs invalides ou vides refusés", async () => {
        expect((await direction.send("put", "/api/etablissement", { nom_court: "E" })).status).toBe(400);
        expect((await direction.send("put", "/api/etablissement", { adresse_reponse: "pas une adresse" })).status).toBe(400);
        expect((await direction.send("put", "/api/etablissement", {})).status).toBe(400);
    });
});

describe("Logo", () => {
    test("une vraie image PNG remplace le logo et change sa version", async () => {
        const avant = (await anonymous().get("/api/etablissement")).body.logo.version;
        const res = await envoyerLogo(PNG);
        expect(res.status).toBe(200);
        expect(res.body.logo.version).not.toBe(avant);
        expect(Buffer.compare((await anonymous().get("/api/etablissement/logo")).body, PNG)).toBe(0);
    });

    test("le type se lit dans les octets : un SVG ou un faux PNG est refusé", async () => {
        const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        expect((await envoyerLogo(svg, "image/png")).status).toBe(415);
        expect((await envoyerLogo(Buffer.from("pas une image"), "application/octet-stream")).status).toBe(415);
    });

    test("trop lourd : refusé", async () => {
        const lourd = Buffer.concat([PNG, Buffer.alloc(600 * 1024)]);
        expect((await envoyerLogo(lourd)).status).toBe(413);
    });

    test("un enseignant ne peut pas changer le logo ; l'administration peut le retirer", async () => {
        const prof = await loginAs(enseignant);
        const refus = await prof.agent.put("/api/etablissement/logo").set("X-CSRF-Token", prof.csrf).set("Content-Type", "image/png").send(PNG);
        expect(refus.status).toBe(403);
        expect((await direction.send("delete", "/api/etablissement/logo")).status).toBe(200);
        expect((await anonymous().get("/api/etablissement")).body.logo).toBeNull();
        expect((await anonymous().get("/api/etablissement/logo")).status).toBe(404);
    });
});

describe("Courriels", () => {
    test("{{produit}} et {{ecole}} sont remplis, le reste du message intact", () => {
        const message = personnaliserCourriel(
            { subject: "[{{ecole}}] Annonce", text: "À retrouver dans {{produit}}.", html: "<p>L'équipe {{produit}}</p>" },
            { produit: "EMSI Planner", ecole: "EMSI" }
        );
        expect(message).toEqual({ subject: "[EMSI] Annonce", text: "À retrouver dans EMSI Planner.", html: "<p>L'équipe EMSI Planner</p>" });
    });
});
