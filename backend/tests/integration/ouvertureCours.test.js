import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, Groupe, SectionCours, SupportCours } from "../../models/index.js";
import { aujourdhui } from "../../services/planning/affectationRules.js";

/**
 * Dates d'ouverture et de fermeture des sections et des supports de cours (plan multi-établissements,
 * fichier 14, lot EC-1). Un étudiant ne voit un élément que si son interrupteur est allumé et si le
 * jour de l'école tombe entre les deux dates (incluses). L'enseignant voit toujours tout.
 */

let prof, etu, fixture, td1, base, idSection, idSupport;

const jour = (decalage) => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + decalage);
    return d.toISOString().slice(0, 10);
};

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    prof = await createUser("enseignant");
    etu = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin });
    td1 = await Groupe.create({ niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, nom_groupe: "TD1", id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "td" });
    await Appartenir.create({ id_user_etudiant: etu.id_user, id_groupe: td1.id_groupe });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TD", volume_heures: 21, niveau_groupe: "td" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 20 });
    await enseignement.setGroupes([td1.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: prof.id_user, role: "principal", statut_service: "accepte" });
    base = `/api/classes/${fixture.cours.id_cours}/${td1.id_groupe}`;

    // Une section et un lien, créés par l'enseignant
    const client = await loginAs(prof);
    idSection = (await client.send("post", `${base}/sections`, { titre: "Semaine 1" })).body.id_section;
    idSupport = (await client.send("post", `/api/sections-cours/${idSection}/liens`, { url: "https://exemple.org/cours", titre: "Polycopié" })).body.id_support;
});
beforeEach(async () => {
    await resetRateLimiters();
    // Chaque cas part d'un support et d'une section sans date, visibles
    const neuf = { visible: true, visible_du: null, visible_jusqu_au: null };
    await SupportCours.update(neuf, { where: { id_support: idSupport } });
    await SectionCours.update(neuf, { where: { id_section: idSection } });
});
afterAll(async () => {
    await closeDatabase();
});

const modifierSupport = async (champs) => (await loginAs(prof)).send("put", `/api/supports-cours/${idSupport}`, champs);
const modifierSection = async (champs) => (await loginAs(prof)).send("put", `/api/sections-cours/${idSection}`, champs);
/** Ce que l'étudiant voit : titres des supports, et si l'adresse s'ouvre */
const vueEtudiant = async () => {
    const client = await loginAs(etu);
    const espace = await client.get(`${base}/supports`);
    const ouvrir = await client.get(`/api/supports-cours/${idSupport}/ouvrir`);
    const mesCours = await client.get("/api/etudiant/cours");
    return { titres: espace.body.sections.flatMap((s) => s.supports.map((x) => x.titre)), ouvre: ouvrir.status === 200, classes: mesCours.body.length };
};

describe("Ouverture et fermeture d'un support", () => {
    test("sans date : visible, comme avant", async () => {
        expect(await vueEtudiant()).toEqual({ titres: ["Polycopié"], ouvre: true, classes: 1 });
    });

    test("pas encore ouvert : caché de l'étudiant (liste, adresse, Mes cours) ; l'enseignant le voit avec ses dates", async () => {
        expect((await modifierSupport({ visible_du: jour(1) })).status).toBe(200);
        expect(await vueEtudiant()).toEqual({ titres: [], ouvre: false, classes: 0 });
        const prof1 = await (await loginAs(prof)).get(`${base}/supports`);
        expect(prof1.body.sections[0].supports[0]).toMatchObject({ titre: "Polycopié", visible: true, visible_du: jour(1), visible_jusqu_au: null });
    });

    test("le jour de l'ouverture, il apparaît ; le jour de la fermeture, il est encore là ; le lendemain, il disparaît", async () => {
        await modifierSupport({ visible_du: aujourdhui(), visible_jusqu_au: aujourdhui() });
        expect(await vueEtudiant()).toEqual({ titres: ["Polycopié"], ouvre: true, classes: 1 });
        await modifierSupport({ visible_du: jour(-3), visible_jusqu_au: jour(-1) });
        expect(await vueEtudiant()).toEqual({ titres: [], ouvre: false, classes: 0 });
    });

    test("l'interrupteur « masqué » l'emporte sur des dates ouvertes", async () => {
        await modifierSupport({ visible_du: jour(-1), visible_jusqu_au: jour(1), visible: false });
        expect((await vueEtudiant()).titres).toEqual([]);
        await modifierSupport({ visible: true });
        expect((await vueEtudiant()).titres).toEqual(["Polycopié"]);
    });

    test("retirer les dates (null ou vide) rend le support visible", async () => {
        await modifierSupport({ visible_du: jour(5) });
        expect((await vueEtudiant()).titres).toEqual([]);
        expect((await modifierSupport({ visible_du: null, visible_jusqu_au: "" })).status).toBe(200);
        expect(await vueEtudiant()).toEqual({ titres: ["Polycopié"], ouvre: true, classes: 1 });
    });

    test("dates refusées : format illisible, fermeture avant l'ouverture (y compris avec une date déjà enregistrée)", async () => {
        expect((await modifierSupport({ visible_du: "demain" })).status).toBe(400);
        expect((await modifierSupport({ visible_du: "2026-02-30" })).status).toBe(400);
        const incoherent = await modifierSupport({ visible_du: jour(3), visible_jusqu_au: jour(1) });
        expect(incoherent.status).toBe(400);
        expect(incoherent.body.message).toMatch(/fermeture précède/);
        await modifierSupport({ visible_du: jour(3) });
        expect((await modifierSupport({ visible_jusqu_au: jour(1) })).status).toBe(400);
        await modifierSupport({ visible_du: null });
    });

    test("un étudiant ne peut pas poser de dates", async () => {
        const res = await (await loginAs(etu)).send("put", `/api/supports-cours/${idSupport}`, { visible_du: jour(30) });
        expect(res.status).toBeGreaterThanOrEqual(403);
        expect((await vueEtudiant()).titres).toEqual(["Polycopié"]);
    });
});

describe("Ouverture et fermeture d'une section", () => {
    test("une section fermée cache ses supports, même ouverts ; rouverte, ils reviennent", async () => {
        expect((await modifierSection({ visible_jusqu_au: jour(-1) })).status).toBe(200);
        expect(await vueEtudiant()).toEqual({ titres: [], ouvre: false, classes: 0 });
        const enseignant = await (await loginAs(prof)).get(`${base}/supports`);
        expect(enseignant.body.sections[0]).toMatchObject({ titre: "Semaine 1", visible_jusqu_au: jour(-1), supports: [{ titre: "Polycopié" }] });
        await modifierSection({ visible_jusqu_au: null });
        expect(await vueEtudiant()).toEqual({ titres: ["Polycopié"], ouvre: true, classes: 1 });
    });

    test("section programmée dans une semaine : rien chez l'étudiant d'ici là", async () => {
        await modifierSection({ visible_du: jour(7) });
        expect((await vueEtudiant()).titres).toEqual([]);
        expect((await modifierSection({ visible_du: jour(7), visible_jusqu_au: jour(2) })).status).toBe(400);
        await modifierSection({ visible_du: null });
    });
});
