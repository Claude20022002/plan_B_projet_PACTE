import request from "supertest";
import app from "../../app.js";
import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import sequelize from "../../config/db.js";
import { JournalSecurite } from "../../models/index.js";
import { ECHECS_MAX } from "../../services/mfa.js";
import { purgerJournal } from "../../services/journalSecurite.js";
import { codeDuPas, depuisBase32, pasDe } from "../../utils/totp.js";

/**
 * Journal de sécurité (OWASP A09) et limite des codes de double authentification faux par compte
 * (tous défis confondus), sûre face aux requêtes simultanées.
 */

let admin;
let etudiant;
let enseignant;
let secret;

const evenements = (where) => JournalSecurite.findAll({ where, order: [["id_evenement", "ASC"]] });
const codeApp = (decalage = 0) => codeDuPas(depuisBase32(secret), pasDe() + decalage);
// Un code de 6 chiffres qui n'est pas celui de l'application (ni du pas voisin)
const codeFaux = () => {
    const justes = [-1, 0, 1].map(codeApp);
    let n = 123456;
    while (justes.includes(String(n))) n += 1;
    return String(n);
};
const defiDe = async (user) => {
    const res = await anonymous().post("/api/auth/login").send({ email: user.email, password: PASSWORD });
    expect(res.body).toMatchObject({ mfa_requis: true });
    return res.body.defi;
};
const presenter = (defi, code) => anonymous().post("/api/auth/mfa/verifier").send({ defi, code });

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    etudiant = await createUser("etudiant");
    enseignant = await createUser("enseignant");
    // Double authentification de l'enseignant
    const client = await loginAs(enseignant);
    secret = (await client.send("post", "/api/auth/mfa/inscription")).body.secret;
    expect((await client.send("post", "/api/auth/mfa/confirmation", { code: codeApp() })).status).toBe(200);
});
beforeEach(resetRateLimiters);
afterAll(closeDatabase);

describe("Journal de sécurité", () => {
    test("connexion échouée puis réussie : email, adresse et navigateur, jamais le mot de passe", async () => {
        await request(app).post("/api/auth/login").set("User-Agent", "Navigateur-essai").send({ email: etudiant.email, password: "MauvaisMotDePasse1!" });
        await request(app).post("/api/auth/login").send({ email: "inconnu@hestim.test", password: "x" });
        await loginAs(etudiant);

        const [echec] = await evenements({ evenement: "connexion_echec", id_user: etudiant.id_user });
        expect(echec).toMatchObject({ email: etudiant.email, user_agent: "Navigateur-essai" });
        expect(echec.ip).toBeTruthy();
        expect(JSON.stringify(echec.toJSON())).not.toContain("MauvaisMotDePasse1!");
        // Compte inexistant : l'email tenté est gardé, sans compte
        expect(await evenements({ evenement: "connexion_echec", email: "inconnu@hestim.test" })).toEqual([expect.objectContaining({ id_user: null })]);
        expect(await evenements({ evenement: "connexion_reussie", id_user: etudiant.id_user })).toHaveLength(1);
    });

    test("changement de rôle et désactivation par l'administration : avant, après et auteur", async () => {
        const cible = await createUser("etudiant");
        const client = await loginAs(admin);
        expect((await client.send("put", `/api/users/${cible.id_user}`, { role: "enseignant", actif: false })).status).toBe(200);

        const [modif] = await evenements({ evenement: "compte_modifie", id_user: cible.id_user });
        expect(modif.id_acteur).toBe(admin.id_user);
        expect(modif.details).toEqual({ role: { avant: "etudiant", apres: "enseignant" }, actif: { avant: true, apres: false } });

        // Rien de sensible modifié : pas d'événement
        await client.send("put", `/api/users/${cible.id_user}`, { nom: "Autre" });
        expect(await evenements({ evenement: "compte_modifie", id_user: cible.id_user })).toHaveLength(1);
    });

    test("consultation réservée à l'administration, filtres et pages", async () => {
        const client = await loginAs(admin);
        const res = await client.get(`/api/journal-securite?evenement=connexion_echec&par_page=1`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ page: 1, par_page: 1 });
        expect(res.body.total).toBeGreaterThanOrEqual(2);
        expect(res.body.evenements).toHaveLength(1);
        expect(res.body.evenements[0].evenement).toBe("connexion_echec");

        // Auteur d'une action d'administration : son nom, pas seulement son identifiant
        const modif = await client.get(`/api/journal-securite?evenement=compte_modifie`);
        expect(modif.body.evenements[0]).toMatchObject({ acteur: { id_user: admin.id_user, email: admin.email }, details: { role: { avant: "etudiant", apres: "enseignant" } } });

        expect((await (await loginAs(etudiant)).get("/api/journal-securite")).status).toBe(403);
    });
});

describe("Double authentification : codes faux limités par compte", () => {
    test("requêtes simultanées sur un même défi : 5 essais au plus", async () => {
        const avant = await JournalSecurite.count({ where: { evenement: "mfa_echec", id_user: enseignant.id_user } });
        const defi = await defiDe(enseignant);
        const reponses = await Promise.all(Array.from({ length: 8 }, () => presenter(defi, codeFaux())));
        expect(reponses.every((r) => r.status === 401)).toBe(true);
        const apres = await JournalSecurite.count({ where: { evenement: "mfa_echec", id_user: enseignant.id_user } });
        expect(apres - avant).toBeLessThanOrEqual(5);
        // Le défi est épuisé
        expect((await presenter(defi, codeApp(1))).body.message).toMatch(/expirée|Trop d'essais/);
        await JournalSecurite.destroy({ where: { evenement: "mfa_echec" } });
    });

    test(`au-delà de ${ECHECS_MAX} codes faux (plusieurs défis), même le bon code est refusé, puis la fenêtre passe`, async () => {
        // Le mot de passe connu permet d'ouvrir autant de défis qu'on veut : la limite est par compte
        // (4 codes par défi, sous les 5 essais d'un défi)
        let defi;
        for (let i = 0; i < ECHECS_MAX; i += 1) {
            if (i % 4 === 0) {
                resetRateLimiters();
                defi = await defiDe(enseignant);
            }
            expect((await presenter(defi, codeFaux())).status).toBe(401);
        }
        const bloque = await presenter(await defiDe(enseignant), codeApp(1));
        expect(bloque.status).toBe(429);
        expect(bloque.body.message).toMatch(/Trop de codes incorrects/);
        expect(await evenements({ evenement: "mfa_bloque", id_user: enseignant.id_user })).toHaveLength(1);

        // 15 minutes plus tard (échecs vieillis) : le bon code ouvre la session
        await sequelize.query("UPDATE JournalSecurite SET createdAt = createdAt - INTERVAL 16 MINUTE WHERE evenement = 'mfa_echec'");
        const ouvert = await presenter(await defiDe(enseignant), codeApp(1));
        expect(ouvert.status).toBe(200);
        expect(await evenements({ evenement: "connexion_reussie", id_user: enseignant.id_user })).toEqual(
            expect.arrayContaining([expect.objectContaining({ details: { mobile: false, mfa: true } })])
        );
    });
});

describe("Conservation", () => {
    test("les événements de plus d'un an sont purgés, les récents gardés", async () => {
        await JournalSecurite.bulkCreate([
            { evenement: "connexion_echec", email: "vieux@hestim.test" },
            { evenement: "connexion_echec", email: "recent@hestim.test" },
        ]);
        await sequelize.query("UPDATE JournalSecurite SET createdAt = createdAt - INTERVAL 400 DAY WHERE email = 'vieux@hestim.test'");
        expect(await purgerJournal()).toBe(1);
        expect(await JournalSecurite.count({ where: { email: "vieux@hestim.test" } })).toBe(0);
        expect(await JournalSecurite.count({ where: { email: "recent@hestim.test" } })).toBe(1);
    });
});
