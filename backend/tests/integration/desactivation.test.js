import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, createPlanningFixture, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Appartenir, AuthSession, Desactivation, JournalSecurite, PushToken, Users } from "../../models/index.js";
import { aujourdhui } from "../../services/planning/affectationRules.js";
import { appliquerProgrammees, envoyerPreavis } from "../../services/desactivation/programmation.js";

/**
 * Lot ME-17 : désactivation des comptes par l'administration (plan multi-établissements,
 * fichier 11, § 11.2). Désactivation immédiate et programmée, préavis, séances d'un enseignant,
 * dernier administrateur, réactivation, lot, suppression réservée aux comptes sans historique,
 * anonymisation.
 */

const dansJours = (n) => new Date(Date.parse(`${aujourdhui()}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

let admin;
let adminClient;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    adminClient = await loginAs(admin);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Désactivation immédiate", () => {
    test("un étudiant désactivé est coupé partout, son historique reste, il se réactive", async () => {
        const etudiant = await createUser("etudiant");
        const session = await loginAs(etudiant);
        await PushToken.create({ id_user: etudiant.id_user, token: `ExponentPushToken[${etudiant.id_user}]` });

        const res = await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "depart" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ statut: "desactive", effet_le: aujourdhui() });

        // La session ouverte ne sert plus, la connexion est refusée avec un message clair
        expect([401, 403]).toContain((await session.get("/api/users/" + etudiant.id_user)).status);
        const login = await anonymous().post("/api/auth/login").send({ email: etudiant.email, password: PASSWORD });
        expect(login.status).toBe(403);
        expect(login.body.error).toMatch(/scolarité/);
        expect(await AuthSession.count({ where: { id_user: etudiant.id_user, revoked_at: null } })).toBe(0);
        expect(await PushToken.count({ where: { id_user: etudiant.id_user } })).toBe(0);
        expect(await Desactivation.count({ where: { id_user: etudiant.id_user, action: "desactivation", motif: "depart" } })).toBe(1);
        expect(await JournalSecurite.count({ where: { id_user: etudiant.id_user, evenement: "compte_desactive" } })).toBe(1);

        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/reactivation`)).status).toBe(200);
        expect((await anonymous().post("/api/auth/login").send({ email: etudiant.email, password: PASSWORD })).status).toBe(200);
    });

    test("refuse un motif inconnu, une date passée et son propre compte", async () => {
        const etudiant = await createUser("etudiant");
        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "humeur" })).status).toBe(400);
        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "depart", date: "2020-01-01" })).status).toBe(400);
        const soi = await adminClient.send("post", `/api/users/${admin.id_user}/desactivation`, { motif: "autre" });
        expect(soi.status).toBe(409);
        expect(soi.body.code).toBe("SOI_MEME");
    });

    test("réservé à l'administration", async () => {
        const etudiant = await createUser("etudiant");
        const autre = await createUser("etudiant");
        const client = await loginAs(etudiant);
        expect((await client.send("post", `/api/users/${autre.id_user}/desactivation`, { motif: "depart" })).status).toBe(403);
        expect((await client.get(`/api/users/${autre.id_user}/desactivation`)).status).toBe(403);
    });
});

describe("Enseignant qui a des séances à venir", () => {
    test("bloqué tant que les séances ne sont pas traitées ; l'aperçu les liste ; annuler les traite", async () => {
        const prof = await createUser("enseignant");
        const { affectation } = await createPlanningFixture({ admin, enseignant: prof });

        const apercu = await adminClient.get(`/api/users/${prof.id_user}/desactivation`);
        expect(apercu.status).toBe(200);
        expect(apercu.body.a_traiter).toBe(1);
        expect(apercu.body.seances[0]).toMatchObject({ id_affectation: affectation.id_affectation, module: "Algorithmique" });

        const refus = await adminClient.send("post", `/api/users/${prof.id_user}/desactivation`, { motif: "fin_contrat" });
        expect(refus.status).toBe(409);
        expect(refus.body.code).toBe("SEANCES_A_TRAITER");
        expect((await Users.findByPk(prof.id_user)).actif).toBe(true);

        // La fenêtre de modification classique suit la même règle
        expect((await adminClient.send("put", `/api/users/${prof.id_user}`, { actif: false })).status).toBe(409);

        const ok = await adminClient.send("post", `/api/users/${prof.id_user}/desactivation`, { motif: "fin_contrat", seances: "annuler" });
        expect(ok.status).toBe(200);
        expect(ok.body.seances_annulees).toBe(1);
        expect((await Affectation.findByPk(affectation.id_affectation)).statut).toBe("annule");
    });
});

describe("Désactivation programmée", () => {
    test("attend sa date, prévient 5 jours avant, s'applique le jour venu, s'annule", async () => {
        const etudiant = await createUser("etudiant");
        const res = await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "diplome", date: dansJours(10) });
        expect(res.body).toMatchObject({ statut: "programmee", effet_le: dansJours(10) });
        expect((await Users.findByPk(etudiant.id_user)).actif).toBe(true);

        // Trop tôt pour le préavis ; puis à 5 jours, une seule fois
        await envoyerPreavis(aujourdhui());
        expect((await Users.findByPk(etudiant.id_user)).preavis_envoye_le).toBeNull();
        expect(await envoyerPreavis(dansJours(5))).toBeGreaterThanOrEqual(1);
        expect((await Users.findByPk(etudiant.id_user)).preavis_envoye_le).not.toBeNull();
        expect(await envoyerPreavis(dansJours(6))).toBe(0);

        await appliquerProgrammees(dansJours(9));
        expect((await Users.findByPk(etudiant.id_user)).actif).toBe(true);
        await appliquerProgrammees(dansJours(10));
        expect((await Users.findByPk(etudiant.id_user)).actif).toBe(false);
    });

    test("une programmation s'annule ; sans préavis, aucun courriel", async () => {
        const etudiant = await createUser("etudiant");
        await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "exclusion", date: dansJours(3), preavis: false });
        expect(await envoyerPreavis(aujourdhui())).toBe(0);
        expect((await adminClient.send("delete", `/api/users/${etudiant.id_user}/desactivation`)).status).toBe(200);
        const user = await Users.findByPk(etudiant.id_user);
        expect(user.desactivation_prevue_le).toBeNull();
        expect(user.actif).toBe(true);
    });

    test("le jour venu, ne désactive pas le dernier administrateur actif", async () => {
        const second = await createUser("admin");
        const secondClient = await loginAs(second);
        // Le premier programme la désactivation du second, puis est lui-même désactivé
        await adminClient.send("post", `/api/users/${second.id_user}/desactivation`, { motif: "depart", date: dansJours(2) });
        expect((await secondClient.send("post", `/api/users/${admin.id_user}/desactivation`, { motif: "autre" })).status).toBe(200);

        await appliquerProgrammees(dansJours(2));
        expect((await Users.findByPk(second.id_user)).actif).toBe(true);
        expect(await Desactivation.count({ where: { id_user: second.id_user, action: "report" } })).toBe(1);

        // Remise en état pour les autres tests
        expect((await secondClient.send("post", `/api/users/${admin.id_user}/reactivation`)).status).toBe(200);
        adminClient = await loginAs(admin);
    });
});

describe("Désactivation en lot", () => {
    test("tous les étudiants d'un groupe, avec un bilan par compte", async () => {
        const [e1, e2] = [await createUser("etudiant"), await createUser("etudiant")];
        const { groupe } = await createPlanningFixture({ admin, etudiant: e1 });
        await Appartenir.create({ id_user_etudiant: e2.id_user, id_groupe: groupe.id_groupe });
        const res = await adminClient.send("post", "/api/users/desactivations", { id_groupe: groupe.id_groupe, motif: "diplome" });
        expect(res.status).toBe(200);
        expect(res.body.desactives).toBe(2);
        expect((await Users.findAll({ where: { id_user: [e1.id_user, e2.id_user] } })).every((u) => !u.actif)).toBe(true);
    });

    test("l'aperçu dit qui sera désactivé et qui sera refusé, sans rien changer", async () => {
        const [actif, inactif] = [await createUser("etudiant"), await createUser("etudiant", { actif: false })];
        const prof = await createUser("enseignant");
        await createPlanningFixture({ admin, enseignant: prof });
        const ids = [actif.id_user, inactif.id_user, prof.id_user, admin.id_user].join(",");

        const res = await adminClient.get(`/api/users/desactivations/apercu?ids=${ids}`);
        expect(res.status).toBe(200);
        const sort = Object.fromEntries(res.body.comptes.map((c) => [c.id_user, c]));
        expect(sort[actif.id_user].prevu).toBe("a_desactiver");
        expect(sort[inactif.id_user].prevu).toBe("deja_desactive");
        expect(sort[prof.id_user]).toMatchObject({ prevu: "seances_a_traiter", seances: 1 });
        expect(sort[admin.id_user].prevu).toBe("soi_meme");
        expect(res.body).toMatchObject({ a_desactiver: 1, refuses: 3 });
        expect((await Users.findByPk(actif.id_user)).actif).toBe(true);

        expect((await adminClient.get("/api/users/desactivations/apercu")).status).toBe(400);
    });

    test("un lot fait par erreur se rétablit d'un geste : réactivés, programmations annulées", async () => {
        const [e1, e2] = [await createUser("etudiant"), await createUser("etudiant")];
        const { groupe } = await createPlanningFixture({ admin, etudiant: e1 });
        await Appartenir.create({ id_user_etudiant: e2.id_user, id_groupe: groupe.id_groupe });
        await adminClient.send("post", "/api/users/desactivations", { id_groupe: groupe.id_groupe, motif: "diplome" });

        const res = await adminClient.send("post", "/api/users/reactivations", { id_groupe: groupe.id_groupe });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ reactives: 2, refuses: 0 });
        expect((await Users.findAll({ where: { id_user: [e1.id_user, e2.id_user] } })).every((u) => u.actif)).toBe(true);

        // Programmé pour plus tard, puis rétabli : la date est retirée ; un compte resté actif ne bouge pas
        await adminClient.send("post", "/api/users/desactivations", { ids: [e1.id_user], motif: "depart", date: dansJours(10) });
        const retour = await adminClient.send("post", "/api/users/reactivations", { ids: [e1.id_user, e2.id_user] });
        expect(retour.body).toMatchObject({ programmations_annulees: 1, inchanges: 1 });
        expect((await Users.findByPk(e1.id_user)).desactivation_prevue_le).toBeNull();
    });
});

describe("Supprimer ou désactiver", () => {
    test("un compte sans historique se supprime ; un compte qui s'est connecté non", async () => {
        const jamais = await createUser("etudiant");
        expect((await adminClient.send("delete", `/api/users/${jamais.id_user}`)).status).toBe(200);

        const venu = await createUser("etudiant");
        await loginAs(venu);
        const refus = await adminClient.send("delete", `/api/users/${venu.id_user}`);
        expect(refus.status).toBe(409);
        expect(await Users.count({ where: { id_user: venu.id_user } })).toBe(1);
    });

    test("l'anonymisation efface l'identité d'un compte désactivé, et ne se défait pas", async () => {
        const etudiant = await createUser("etudiant");
        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/anonymisation`)).status).toBe(409);
        await adminClient.send("post", `/api/users/${etudiant.id_user}/desactivation`, { motif: "depart" });
        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/anonymisation`)).status).toBe(200);

        const user = await Users.findByPk(etudiant.id_user);
        expect(user).toMatchObject({ nom: "Ancien compte", email: `anonyme-${etudiant.id_user}@invalide.local`, telephone: null });
        expect(user.anonymise_le).not.toBeNull();
        expect((await adminClient.send("post", `/api/users/${etudiant.id_user}/reactivation`)).status).toBe(409);
    });
});
