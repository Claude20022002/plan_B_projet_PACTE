import crypto from "crypto";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, AppelSeance, Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, JournalSecurite, Presence } from "../../models/index.js";

/**
 * Appel à trois statuts et historique d'une classe (docs/plans/espace-de-cours.md, lot E-6) :
 * présent, en retard, absent (pas d'« excusé ») ; correction après l'appel journalisée ; bilan des
 * séances, taux par étudiant (appels fermés seulement), export CSV protégé contre les formules.
 */

let prof, autreProf, etudiants, fixture, base, s1, s2, s3;

const seance = (date, extra = {}) =>
    Affectation.create({ statut: "realise", id_cours: fixture.cours.id_cours, id_groupe: fixture.groupe.id_groupe, id_salle: fixture.salle.id_salle, id_creneau: fixture.creneau.id_creneau, id_user_admin: fixture.admin.id_user, id_user_enseignant: prof.id_user, date_seance: date, ...extra });
const fermer = (s) => AppelSeance.create({ id_affectation: s.id_affectation, secret: crypto.randomBytes(32).toString("base64url"), ouvert_le: new Date(), ferme_le: new Date(), id_user_ouverture: prof.id_user });

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    prof = await createUser("enseignant");
    autreProf = await createUser("enseignant");
    fixture = { ...(await createPlanningFixture({ admin })), admin };
    etudiants = [
        await createUser("etudiant", { nom: "Alami", prenom: "Sara" }),
        await createUser("etudiant", { nom: "=HYPERLINK(\"x\")", prenom: "Piège" }),
        await createUser("etudiant", { nom: "Bennani", prenom: "Omar" }),
    ];
    for (const e of etudiants) await Appartenir.create({ id_user_etudiant: e.id_user, id_groupe: fixture.groupe.id_groupe });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "CM", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: prof.id_user, role: "principal", statut_service: "accepte" });

    // Deux séances passées, appel fermé ; une troisième sans appel (ne compte pas)
    [s1, s2, s3] = [await seance("2026-09-07"), await seance("2026-09-14"), await seance("2026-09-21")];
    await fermer(s1);
    await fermer(s2);
    await Presence.bulkCreate([
        { id_affectation: s1.id_affectation, id_user: etudiants[0].id_user, source: "qr", marque_le: new Date(), statut: "present" },
        { id_affectation: s2.id_affectation, id_user: etudiants[0].id_user, source: "qr", marque_le: new Date(), statut: "retard" },
        { id_affectation: s1.id_affectation, id_user: etudiants[2].id_user, source: "qr", marque_le: new Date(), statut: "present" },
        { id_affectation: s2.id_affectation, id_user: etudiants[2].id_user, source: "qr", marque_le: new Date(), statut: "present" },
    ]);
    base = `/api/classes/${fixture.cours.id_cours}/${fixture.groupe.id_groupe}`;
});
beforeEach(resetRateLimiters);
afterAll(closeDatabase);

const url = (s, e) => `/api/presences/seances/${s.id_affectation}/etudiants/${e.id_user}`;

describe("Appel : présent, en retard, absent", () => {
    test("en retard avec un motif, puis absent ; « excusé » n'existe pas", async () => {
        const client = await loginAs(prof);
        const res = await client.send("put", url(s3, etudiants[1]), { statut: "retard", motif: "Bus en retard" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ statut: "retard", present: true });
        const liste = await client.get(`/api/presences/seances/${s3.id_affectation}`);
        expect(liste.body.retards).toBe(1);
        expect(liste.body.etudiants.find((e) => e.id_user === etudiants[1].id_user)).toMatchObject({ statut: "retard", motif: "Bus en retard", present: true });

        expect((await client.send("put", url(s3, etudiants[1]), { statut: "excuse" })).status).toBe(400);
        expect((await client.send("put", url(s3, etudiants[1]), { statut: "absent" })).body).toEqual({ statut: "absent", present: false });
        expect(await Presence.count({ where: { id_affectation: s3.id_affectation } })).toBe(0);
        // L'ancienne case à cocher marche encore
        expect((await client.send("put", url(s3, etudiants[1]), { present: true })).body.statut).toBe("present");
        await client.send("put", url(s3, etudiants[1]), { present: false });
    });

    test("une correction après la fermeture de l'appel est journalisée", async () => {
        const client = await loginAs(prof);
        expect((await client.send("put", url(s1, etudiants[2]), { statut: "retard" })).status).toBe(200);
        const trace = await JournalSecurite.findOne({ where: { evenement: "presence_corrigee" }, order: [["id_evenement", "DESC"]] });
        expect(trace).not.toBeNull();
        expect(JSON.stringify(trace.details)).toContain('"avant":"present"');
        await client.send("put", url(s1, etudiants[2]), { statut: "present" });
    });

    test("un autre enseignant ne touche pas à l'appel", async () => {
        expect((await (await loginAs(autreProf)).send("put", url(s1, etudiants[0]), { statut: "absent" })).status).toBe(403);
    });
});

describe("Historique de la classe", () => {
    test("les séances, la plus récente d'abord, avec leur bilan", async () => {
        const res = await (await loginAs(prof)).get(`${base}/appels`);
        expect(res.status).toBe(200);
        expect(res.body.map((s) => [s.date, s.appel, s.presents, s.retards, s.absents])).toEqual([
            ["2026-09-21", "a_faire", 0, 0, null],
            ["2026-09-14", "ferme", 1, 1, 1],
            ["2026-09-07", "ferme", 2, 0, 1],
        ]);
    });

    test("taux par étudiant sur les appels fermés, les plus absents d'abord", async () => {
        const res = await (await loginAs(prof)).get(`${base}/eleves`);
        expect(res.body.seances_comptees).toBe(2);
        expect(res.body.etudiants.map((e) => [e.prenom, e.presents, e.retards, e.absences, e.taux])).toEqual([
            ["Piège", 0, 0, 2, 0],
            ["Sara", 1, 1, 0, 100],
            ["Omar", 2, 0, 0, 100],
        ]);
    });

    test("export CSV : une colonne par séance, formules neutralisées, export journalisé", async () => {
        const res = await (await loginAs(prof)).get(`${base}/presences.csv`);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("text/csv");
        const lignes = res.text.replace(/^\uFEFF/, "").trim().split("\r\n");
        expect(lignes[0]).toMatch(/^Nom;Prénom;Présences;Retards;Absences;Taux \(%\);2026-09-07 \d\d:\d\d;2026-09-14/);
        expect(lignes).toContain("Alami;Sara;1;1;0;100;P;R");
        expect(lignes.find((l) => l.includes("Piège"))).toMatch(/^"'=HYPERLINK\(""x""\)";Piège;0;0;2;0;A;A$/);
        expect(await JournalSecurite.count({ where: { evenement: "presences_exportees" } })).toBe(1);
    });

    test("hors de ses classes : 404 pour un autre enseignant et pour un étudiant", async () => {
        for (const compte of [autreProf, etudiants[0]]) {
            const client = await loginAs(compte);
            for (const chemin of ["appels", "eleves", "presences.csv"]) expect((await client.get(`${base}/${chemin}`)).status).toBe(404);
        }
    });
});
