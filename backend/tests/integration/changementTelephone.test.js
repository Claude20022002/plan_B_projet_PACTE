import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AppareilEtudiant, DemandeTelephone, JournalSecurite, Notification } from "../../models/index.js";
import { empreinteAppareil } from "../../services/presences/appareil.js";

/**
 * Changement de téléphone (lot R-10) : l'étudiant déclare depuis l'application le téléphone qu'il
 * tient en main ; l'administration accepte (le téléphone déclaré, et lui seul, est lié) ou refuse.
 * Chaque demande et chaque décision est gardée et journalisée.
 */

const ANCIEN = "installation-ancien-telephone";
const NOUVEAU = "installation-nouveau-telephone";
const AUTRE = "installation-autre-telephone";

let admin;
let etudiant;
let camarade;
let enseignant;

/** Session de l'application mobile (Bearer, X-Client: mobile) sur le téléphone `appareil`. */
const application = async (user, appareil) => {
    const { access_token } = (await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: user.email, password: PASSWORD })).body;
    const entetes = (requete) => {
        requete.set("X-Client", "mobile").set("Authorization", `Bearer ${access_token}`);
        return appareil ? requete.set("X-Appareil", appareil) : requete;
    };
    return {
        demander: (corps = {}) => entetes(anonymous().post("/api/presences/telephone/demande")).send(corps),
        maDemande: () => entetes(anonymous().get("/api/presences/telephone/demande")),
    };
};

const telephoneDe = async (user) => (await AppareilEtudiant.findByPk(user.id_user))?.appareil ?? null;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    etudiant = await createUser("etudiant", { prenom: "Salma", nom: "Bennani" });
    camarade = await createUser("etudiant", { prenom: "Yassine", nom: "Alami" });
    enseignant = await createUser("enseignant");
    await AppareilEtudiant.bulkCreate([
        { id_user: etudiant.id_user, appareil: empreinteAppareil(ANCIEN), lie_le: new Date("2026-09-15T08:00:00Z") },
        { id_user: camarade.id_user, appareil: empreinteAppareil(AUTRE), lie_le: new Date("2026-09-15T08:00:00Z") },
    ]);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("La demande de l'étudiant", () => {
    test("depuis l'application seulement, avec un autre téléphone que le sien et que celui d'un camarade", async () => {
        // Depuis le site (pas d'identifiant d'installation)
        expect((await (await loginAs(etudiant)).send("post", "/api/presences/telephone/demande", {})).status).toBe(403);
        expect((await (await application(etudiant, ANCIEN)).demander()).status).toBe(409);
        const pris = await (await application(etudiant, AUTRE)).demander();
        expect(pris.status).toBe(409);
        expect(pris.body.message).toContain("autre étudiant");
        expect(await DemandeTelephone.count()).toBe(0);
    });

    test("la demande est enregistrée, l'administration prévenue, et l'ancien téléphone reste lié en attendant", async () => {
        const app = await application(etudiant, NOUVEAU);
        const res = await app.demander({ motif: "  Écran cassé  " });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ statut: "en_attente", motif: "Écran cassé", decidee_le: null });
        expect((await app.maDemande()).body.data).toMatchObject({ id: res.body.id, statut: "en_attente" });

        expect(await telephoneDe(etudiant)).toBe(empreinteAppareil(ANCIEN));
        // Seule l'empreinte du nouveau téléphone est gardée
        expect((await DemandeTelephone.findByPk(res.body.id)).appareil).toBe(empreinteAppareil(NOUVEAU));
        const note = await Notification.findOne({ where: { id_user: admin.id_user, titre: "Changement de téléphone" } });
        expect(note.message).toBe("Salma Bennani demande à pointer avec un nouveau téléphone. Motif : Écran cassé");
        expect(await JournalSecurite.count({ where: { evenement: "telephone_demande", id_user: etudiant.id_user } })).toBe(1);

        // Une seconde déclaration remplace la première, sans nouvelle notification
        expect((await app.demander()).body.id).toBe(res.body.id);
        expect(await DemandeTelephone.count()).toBe(1);
        expect(await Notification.count({ where: { titre: "Changement de téléphone" } })).toBe(1);
    });

    test("sans téléphone lié, pas de demande : le prochain scan le liera", async () => {
        const sansTelephone = await createUser("etudiant");
        expect((await (await application(sansTelephone, NOUVEAU)).demander()).status).toBe(409);
    });
});

describe("La décision de l'administration", () => {
    test("la liste des demandes en attente porte l'étudiant et la date de son téléphone actuel", async () => {
        const { status, body } = await (await loginAs(admin)).get("/api/presences/demandes-telephone");
        expect(status).toBe(200);
        expect(body.data).toEqual([
            expect.objectContaining({ statut: "en_attente", etudiant: { id_user: etudiant.id_user, nom: "Salma Bennani", email: etudiant.email }, telephone_lie_le: expect.any(String) }),
        ]);
        expect((await (await loginAs(admin)).get("/api/presences/demandes-telephone?statut=n-importe")).status).toBe(400);
    });

    test("réservée à l'administration", async () => {
        const demande = await DemandeTelephone.findOne();
        expect((await (await loginAs(enseignant)).get("/api/presences/demandes-telephone")).status).toBe(403);
        expect((await (await loginAs(etudiant)).send("post", `/api/presences/demandes-telephone/${demande.id_demande}/accepter`)).status).toBe(403);
        expect((await (await loginAs(admin)).send("post", "/api/presences/demandes-telephone/999999/accepter")).status).toBe(404);
    });

    test("accepter lie le téléphone déclaré, et lui seul ; l'étudiant est prévenu", async () => {
        const demande = await DemandeTelephone.findOne();
        const res = await (await loginAs(admin)).send("post", `/api/presences/demandes-telephone/${demande.id_demande}/accepter`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ statut: "acceptee", decidee_le: expect.any(String) });
        expect(await telephoneDe(etudiant)).toBe(empreinteAppareil(NOUVEAU));
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Nouveau téléphone accepté" } })).toBe(1);
        expect(await JournalSecurite.count({ where: { evenement: "telephone_change_accepte", id_user: etudiant.id_user } })).toBe(1);
        // Une demande se décide une fois
        expect((await (await loginAs(admin)).send("post", `/api/presences/demandes-telephone/${demande.id_demande}/refuser`)).status).toBe(409);
        const traitees = (await (await loginAs(admin)).get("/api/presences/demandes-telephone?statut=acceptee")).body.data;
        expect(traitees).toEqual([expect.objectContaining({ id: demande.id_demande, decidee_par: `${admin.prenom} ${admin.nom}` })]);
    });

    test("refuser laisse le téléphone en place et dit pourquoi à l'étudiant", async () => {
        const { body } = await (await application(etudiant, ANCIEN)).demander();
        const res = await (await loginAs(admin)).send("post", `/api/presences/demandes-telephone/${body.id}/refuser`, { motif: "Venez au bureau avec votre téléphone" });
        expect(res.status).toBe(200);
        expect(res.body.statut).toBe("refusee");
        expect(await telephoneDe(etudiant)).toBe(empreinteAppareil(NOUVEAU));
        const note = await Notification.findOne({ where: { id_user: etudiant.id_user, titre: "Changement de téléphone refusé" } });
        expect(note.message).toContain("Motif : Venez au bureau avec votre téléphone");
        expect((await (await application(etudiant, NOUVEAU)).maDemande()).body.data).toMatchObject({ id: body.id, statut: "refusee" });
    });

    test("un téléphone lié entre-temps à un camarade n'est pas pris : la demande attend", async () => {
        const { body } = await (await application(camarade, "installation-telephone-convoite")).demander();
        // Premier scan d'un nouvel étudiant avec ce téléphone, avant la décision
        const nouveau = await createUser("etudiant");
        await AppareilEtudiant.create({ id_user: nouveau.id_user, appareil: empreinteAppareil("installation-telephone-convoite"), lie_le: new Date() });
        expect((await (await loginAs(admin)).send("post", `/api/presences/demandes-telephone/${body.id}/accepter`)).status).toBe(409);
        expect(await telephoneDe(camarade)).toBe(empreinteAppareil(AUTRE));
        expect((await DemandeTelephone.findByPk(body.id)).statut).toBe("en_attente");
    });
});
