import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import crypto from "crypto";
import { Affectation, AppareilEtudiant, Appartenir, Groupe, SignalementPresence } from "../../models/index.js";
import { scannerCode } from "../../services/presences/appel.js";

/**
 * I1 — appel par QR code : l'enseignant ouvre l'appel le jour de la séance, le code change toutes
 * les 30 s et ne vaut qu'une minute, seuls les étudiants des groupes de la séance sont acceptés,
 * l'enseignant coche à la main et ferme l'appel (séance réalisée).
 * Anti-fraude : scan depuis l'application seulement, un téléphone = un étudiant par séance
 * (signalement des deux), un compte = un téléphone (déliaison par l'administration),
 * vérification surprise facultative.
 */

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let seance;
let code;

const TELEPHONE_A = "installation-telephone-a";
const TELEPHONE_B = "installation-telephone-b";
const TELEPHONE_C = "installation-telephone-c";

const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });

/** Session de l'application mobile : Bearer, X-Client: mobile et identifiant d'installation. */
const application = async (user, appareil) => {
    const { access_token } = (await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: user.email, password: PASSWORD })).body;
    return {
        scanner: (corps) => {
            const requete = anonymous().post("/api/presences/scanner").set("X-Client", "mobile").set("Authorization", `Bearer ${access_token}`);
            return (appareil ? requete.set("X-Appareil", appareil) : requete).send(corps);
        },
    };
};

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Salma", nom: "Bennani" });
    etudiantTp = await createUser("etudiant", { prenom: "Yassine", nom: "Alami" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    const tp = await Groupe.create({ nom_groupe: "TP1", niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etudiantTp.id_user, id_groupe: tp.id_groupe },
        { id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe },
    ]);
    seance = await Affectation.create({
        date_seance: aujourdhui(),
        statut: "confirme",
        id_cours: fixture.cours.id_cours,
        id_groupe: fixture.groupe.id_groupe,
        id_user_enseignant: enseignant.id_user,
        id_salle: fixture.salle.id_salle,
        id_creneau: fixture.creneau.id_creneau,
        id_user_admin: admin.id_user,
    });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Ouvrir l'appel", () => {
    test("réservé aux enseignants de la séance, le jour même", async () => {
        expect((await (await loginAs(autreEnseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`)).status).toBe(403);
        expect((await (await loginAs(etudiant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`)).status).toBe(403);
        // La séance de la fixture est en janvier 2027 : pas aujourd'hui
        expect((await (await loginAs(enseignant)).send("post", `/api/presences/seances/${fixture.affectation.id_affectation}/ouvrir`)).status).toBe(409);
    });

    test("l'enseignant obtient un code signé et l'adresse du QR", async () => {
        const res = await (await loginAs(enseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/ouvrir`);
        expect(res.status).toBe(200);
        expect(res.body.code).toMatch(new RegExp(`^${seance.id_affectation}\\.\\d+\\.[A-Za-z0-9_-]{22}$`));
        expect(res.body.url).toContain(`/presence?c=${encodeURIComponent(res.body.code)}`);
        expect(res.body.expire_dans_ms).toBeLessThanOrEqual(30000);
        code = (await (await loginAs(enseignant)).get(`/api/presences/seances/${seance.id_affectation}/code`)).body.code;
    });
});

describe("Scanner", () => {
    test("seulement depuis l'application : le site (cookie) et une application sans identifiant sont refusés", async () => {
        expect((await (await loginAs(etudiant)).send("post", "/api/presences/scanner", { code })).status).toBe(403);
        expect((await (await application(etudiant, null)).scanner({ code })).status).toBe(403);
        expect((await (await application(etudiant, "court")).scanner({ code })).status).toBe(403);
    });

    test("un étudiant d'un groupe de la séance est présent, une seule fois", async () => {
        const app = await application(etudiant, TELEPHONE_A);
        const premier = await app.scanner({ code });
        expect(premier.status).toBe(200);
        expect(premier.body).toMatchObject({ deja: false, seance: { id: seance.id_affectation, cours: "Algorithmique" } });
        expect((await app.scanner({ code })).body.deja).toBe(true);
    });

    test("un téléphone ne pointe qu'un étudiant par séance : refus et signalement des deux", async () => {
        const res = await (await application(etudiantTp, TELEPHONE_A)).scanner({ code });
        expect(res.status).toBe(409);
        const signalements = await SignalementPresence.findAll({ where: { id_affectation: seance.id_affectation, motif: "appareil_partage" } });
        expect(signalements.map((s) => [s.id_user, s.id_user_lie]).sort()).toEqual([[etudiant.id_user, etudiantTp.id_user], [etudiantTp.id_user, etudiant.id_user]].sort());
        // Une nouvelle tentative ne duplique pas les signalements
        await (await application(etudiantTp, TELEPHONE_A)).scanner({ code });
        expect(await SignalementPresence.count({ where: { id_affectation: seance.id_affectation } })).toBe(2);
    });

    test("le QR scanné (adresse du site) marche aussi, pour un sous-groupe, avec son propre téléphone", async () => {
        const res = await (await application(etudiantTp, TELEPHONE_B)).scanner({ code: `https://planner.exemple/presence?c=${encodeURIComponent(code)}` });
        expect(res.status).toBe(200);
    });

    test("refus : autre groupe, code trafiqué, code expiré, pas un étudiant", async () => {
        const app = await application(etranger, TELEPHONE_C);
        expect((await app.scanner({ code })).status).toBe(403);
        const trafique = code.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
        expect((await app.scanner({ code: trafique })).status).toBe(400);
        expect((await app.scanner({ code: "bonjour" })).status).toBe(400);
        await expect(scannerCode({ role: "etudiant", id_user: etudiant.id_user }, code, new Date(Date.now() + 2 * 60 * 1000), TELEPHONE_A)).rejects.toMatchObject({ status: 410 });
        expect((await (await loginAs(enseignant)).send("post", "/api/presences/scanner", { code })).status).toBe(403);
    });
});

describe("Liste d'appel et vérification surprise", () => {
    test("attendus, présents et signalements ; l'enseignant coche et décoche à la main", async () => {
        const prof = await loginAs(enseignant);
        const liste = (await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(liste.etudiants.map((e) => e.id_user).sort()).toEqual([etudiant.id_user, etudiantTp.id_user].sort());
        expect(liste.presents).toBe(2);
        expect(liste.appel.ouvert).toBe(true);
        expect(liste.etudiants.find((e) => e.id_user === etudiant.id_user).signalements).toEqual([{ motif: "appareil_partage", lie: "Yassine Alami" }]);

        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etudiantTp.id_user}`, { present: false })).status).toBe(200);
        expect((await prof.get(`/api/presences/seances/${seance.id_affectation}/code`)).body.presents).toBe(1);
        await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etudiantTp.id_user}`, { present: true });
        const apres = (await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(apres.etudiants.find((e) => e.id_user === etudiantTp.id_user)).toMatchObject({ present: true, source: "manuel", verifie: false });
        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/etudiants/${etranger.id_user}`, { present: true })).status).toBe(404);
    });

    test("tirage parmi les présents par scan non vérifiés ; vu dans la salle → vérifié", async () => {
        const prof = await loginAs(enseignant);
        expect((await (await loginAs(etudiant)).send("post", `/api/presences/seances/${seance.id_affectation}/verification`, {})).status).toBe(403);
        const tirage = (await prof.send("post", `/api/presences/seances/${seance.id_affectation}/verification`, { nombre: 3 })).body;
        // etudiantTp a été coché à la main : seul le présent par scan est tiré
        expect(tirage).toEqual({ etudiants: [{ id_user: etudiant.id_user, nom: "Bennani", prenom: "Salma" }], restants: 0 });
        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/verification/${etudiant.id_user}`, { present: true })).body).toEqual({ present: true });
        expect((await prof.send("post", `/api/presences/seances/${seance.id_affectation}/verification`, {})).body.etudiants).toEqual([]);
        expect((await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body.etudiants.find((e) => e.id_user === etudiant.id_user).verifie).toBe(true);
    });

    test("absent à la vérification : présence retirée et signalement", async () => {
        const prof = await loginAs(enseignant);
        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/verification/${etudiantTp.id_user}`, { present: false })).body).toEqual({ present: false });
        expect((await prof.send("put", `/api/presences/seances/${seance.id_affectation}/verification/${etudiantTp.id_user}`, { present: false })).status).toBe(404);
        const liste = (await prof.get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(liste.etudiants.find((e) => e.id_user === etudiantTp.id_user)).toMatchObject({ present: false });
        expect(liste.etudiants.find((e) => e.id_user === etudiantTp.id_user).signalements.map((s) => s.motif)).toEqual(["appareil_partage", "absent_verification"]);
    });

    test("signalements : réservés à l'administration", async () => {
        expect((await (await loginAs(enseignant)).get("/api/presences/signalements")).status).toBe(403);
        const { data } = (await (await loginAs(admin)).get("/api/presences/signalements")).body;
        expect(data).toHaveLength(3);
        expect(data[0]).toMatchObject({ motif: "absent_verification", etudiant: "Yassine Alami", seance: { id: seance.id_affectation, cours: "Algorithmique" } });
    });
});

describe("Un compte = un téléphone", () => {
    const empreinte = (appareil) => crypto.createHash("sha256").update(appareil).digest("hex");

    test("le premier scan accepté lie le compte au téléphone", async () => {
        expect((await AppareilEtudiant.findByPk(etudiant.id_user)).appareil).toBe(empreinte(TELEPHONE_A));
        expect((await AppareilEtudiant.findByPk(etudiantTp.id_user)).appareil).toBe(empreinte(TELEPHONE_B));
        // Un scan refusé (autre groupe) ne lie rien
        expect(await AppareilEtudiant.findByPk(etranger.id_user)).toBeNull();
    });

    test("depuis un autre téléphone que celui du compte : refus et signalement", async () => {
        const res = await (await application(etudiantTp, TELEPHONE_C)).scanner({ code });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/lié à un autre téléphone/);
        expect(await SignalementPresence.count({ where: { id_affectation: seance.id_affectation, id_user: etudiantTp.id_user, motif: "autre_telephone" } })).toBe(1);
        const liste = (await (await loginAs(enseignant)).get(`/api/presences/seances/${seance.id_affectation}`)).body;
        expect(liste.etudiants.find((e) => e.id_user === etudiantTp.id_user).present).toBe(false);
    });

    test("depuis le téléphone lié au compte d'un autre étudiant : refus, signalement et pas de liaison", async () => {
        const nouveau = await createUser("etudiant", { prenom: "Imane", nom: "Tazi" });
        await Appartenir.create({ id_user_etudiant: nouveau.id_user, id_groupe: fixture.groupe.id_groupe });
        const res = await (await application(nouveau, TELEPHONE_B)).scanner({ code });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/compte d'un autre étudiant/);
        const signalement = await SignalementPresence.findOne({ where: { id_user: nouveau.id_user, motif: "telephone_d_un_autre" } });
        expect(signalement.id_user_lie).toBe(etudiantTp.id_user);
        expect(await AppareilEtudiant.findByPk(nouveau.id_user)).toBeNull();
    });

    test("l'administration voit le téléphone lié et le délie ; le scan suivant lie le nouveau", async () => {
        const urlTelephone = `/api/presences/etudiants/${etudiantTp.id_user}/telephone`;
        expect((await (await loginAs(enseignant)).get(urlTelephone)).status).toBe(403);
        expect((await (await loginAs(etudiantTp)).send("delete", urlTelephone)).status).toBe(403);
        const direction = await loginAs(admin);
        expect((await direction.get(`/api/presences/etudiants/${enseignant.id_user}/telephone`)).status).toBe(404);
        expect((await direction.get(urlTelephone)).body).toMatchObject({ lie: true });

        // Les signalements portent l'étudiant et l'état de son téléphone (pour le délier)
        const { data } = (await direction.get("/api/presences/signalements")).body;
        expect(data.find((s) => s.motif === "autre_telephone")).toMatchObject({ id_user: etudiantTp.id_user, etudiant: "Yassine Alami" });
        expect(data.find((s) => s.motif === "autre_telephone").telephone_lie_le).not.toBeNull();

        expect((await direction.send("delete", urlTelephone)).body).toEqual({ delie: true });
        expect((await direction.get(urlTelephone)).body).toEqual({ lie: false, lie_le: null });
        expect((await direction.send("delete", urlTelephone)).body).toEqual({ delie: false });

        expect((await (await application(etudiantTp, TELEPHONE_C)).scanner({ code })).status).toBe(200);
        expect((await AppareilEtudiant.findByPk(etudiantTp.id_user)).appareil).toBe(empreinte(TELEPHONE_C));
    });
});

describe("Fermeture", () => {
    test("fermer : séance réalisée, plus aucun scan accepté", async () => {
        const res = await (await loginAs(enseignant)).send("post", `/api/presences/seances/${seance.id_affectation}/fermer`);
        // Salma (scan vérifié) et Yassine (pointé avec son nouveau téléphone après la déliaison)
        expect(res.body).toMatchObject({ presents: 2, statut: "realise" });
        expect((await Affectation.findByPk(seance.id_affectation)).statut).toBe("realise");
        expect((await (await application(etudiant, TELEPHONE_A)).scanner({ code })).status).toBe(409);
        expect((await (await loginAs(etudiant)).get("/api/presences/miennes")).body.data.map((p) => p.id_affectation)).toContain(seance.id_affectation);
    });
});
