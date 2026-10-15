import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, Groupe, SupportCours } from "../../models/index.js";
import { definirClientStudyLib, transmettreDepot } from "../../services/cours/studylib.js";

/**
 * Espace de cours d'une classe (docs/plans/espace-de-cours.md, lot E-2). La promotion a deux TD ;
 * le TD1 (et son TP1) est la classe étudiée, confiée à deux enseignants ; le TD2 à un troisième.
 * StudyLib est remplacé par un faux qui garde ses documents et note chaque appel : on vérifie que
 * Planner n'appelle StudyLib qu'après avoir vérifié les droits, avec le bon jeton.
 */

let admin, prof, coprof, profTd2, etuTd1, etuTp1, etuTd2, fixture, td1, td2;
let base;
const appels = [];
const documents = new Map();
let moduleDuDepot = null;

// ── Faux StudyLib ──────────────────────────────────────────────────────
const reponse = (status, corps) => new Response(corps === undefined ? null : JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
const fauxStudyLib = async (url, options) => {
    const adresse = new URL(url);
    const chemin = adresse.pathname.replace(/^\/api/, "");
    const jeton = jwt.decode(String(options.headers?.Authorization ?? "").replace("Bearer ", "")) ?? {};
    let corps = "";
    if (options.body) for await (const morceau of options.body) corps += morceau;
    appels.push({ methode: options.method, chemin, jeton, parametres: Object.fromEntries(adresse.searchParams) });

    if (options.method === "POST" && chemin === "/classe/documents") {
        const id = crypto.randomUUID();
        const titre = /name="title"\r\n\r\n([^\r]*)/.exec(corps)?.[1] ?? "Sans titre";
        documents.set(id, { id, title: titre, visibility: "class", owner: jeton.sub, mime_type: "application/pdf", file_size: 1234, module: { code: moduleDuDepot ?? fixture.cours.code_cours } });
        return reponse(201, { data: documents.get(id) });
    }
    const m = /^\/classe\/documents\/([^/]+)(\/publier)?$/.exec(chemin);
    if (m) {
        const doc = documents.get(m[1]);
        const visible = doc && (doc.visibility === "school" || doc.owner === jeton.sub);
        if (!visible) return reponse(404, { message: "Not Found" });
        if (options.method === "DELETE") return documents.delete(doc.id), reponse(204);
        if (options.method === "PATCH") doc.visibility = "school";
        return reponse(200, { data: doc });
    }
    const l = /^\/interne\/documents\/([^/]+)\/lien$/.exec(chemin);
    if (l && jeton.aud === "studylib-interne" && jeton.doc === l[1] && documents.has(l[1])) return reponse(200, { url: `https://fichiers.test/${l[1]}`, expires_in: 300 });
    return reponse(401, { message: "Unauthenticated." });
};

const appelsStudyLib = () => appels.splice(0);

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    [prof, coprof, profTd2] = [await createUser("enseignant"), await createUser("enseignant"), await createUser("enseignant")];
    fixture = await createPlanningFixture({ admin });
    const promo = fixture.groupe;
    const commun = { niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere };
    td1 = await Groupe.create({ ...commun, nom_groupe: "TD1", id_groupe_parent: promo.id_groupe, type_groupe: "td" });
    td2 = await Groupe.create({ ...commun, nom_groupe: "TD2", id_groupe_parent: promo.id_groupe, type_groupe: "td" });
    const tp1 = await Groupe.create({ ...commun, nom_groupe: "TP1", id_groupe_parent: td1.id_groupe, type_groupe: "tp" });
    [etuTd1, etuTp1, etuTd2] = [await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant")];
    for (const [etu, groupe] of [[etuTd1, td1], [etuTp1, tp1], [etuTd2, td2]]) await Appartenir.create({ id_user_etudiant: etu.id_user, id_groupe: groupe.id_groupe });

    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TD", volume_heures: 21, niveau_groupe: "td" });
    for (const [groupe, enseignants] of [[td1, [prof, coprof]], [td2, [profTd2]]]) {
        const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 20 });
        await enseignement.setGroupes([groupe.id_groupe]);
        for (const e of enseignants) await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: e.id_user, role: "principal", statut_service: "accepte" });
    }
    base = `/api/classes/${fixture.cours.id_cours}/${td1.id_groupe}`;
    definirClientStudyLib(fauxStudyLib);
});
beforeEach(async () => {
    await resetRateLimiters();
    appels.length = 0;
    moduleDuDepot = null;
});
afterAll(async () => {
    definirClientStudyLib(null);
    await closeDatabase();
});

const deposer = (client, url = `${base}/fichiers`, titre = "Chapitre 1") =>
    client.agent.post(url).set("X-CSRF-Token", client.csrf).field("title", titre).attach("file", Buffer.from("%PDF-1.4\n%%EOF\n"), "chapitre.pdf");

describe("Espace de cours : supports d'une classe", () => {
    test("l'enseignant dépose un fichier : transmis à StudyLib avec son jeton, rangé dans « Général »", async () => {
        const client = await loginAs(prof);
        const res = await deposer(client);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ type: "document", titre: "Chapitre 1", type_mime: "application/pdf", taille: 1234, dans_bibliotheque: false });
        expect(appelsStudyLib()).toEqual([expect.objectContaining({ methode: "POST", chemin: "/classe/documents", parametres: { filiere: fixture.filiere.code_filiere, module: fixture.cours.code_cours }, jeton: expect.objectContaining({ sub: String(prof.id_user), aud: ["planner", "studylib"] }) })]);

        const espace = await client.get(`${base}/supports`);
        expect(espace.status).toBe(200);
        expect(espace.body).toMatchObject({ gere: true, classe: { nom_groupe: "TD1" }, sections: [{ titre: "Général", supports: [{ titre: "Chapitre 1", modifiable: true }] }] });
    });

    test("hors de ses classes : 404, et StudyLib n'est jamais appelé", async () => {
        const autre = await loginAs(profTd2);
        expect((await autre.get(`${base}/supports`)).status).toBe(404);
        expect((await deposer(autre)).status).toBe(404);
        expect((await autre.send("post", `${base}/liens`, { url: "https://exemple.org" })).status).toBe(404);
        const etranger = await loginAs(etuTd2);
        expect((await etranger.get(`${base}/supports`)).status).toBe(404);
        expect((await deposer(etranger)).status).toBe(404);
        expect(appelsStudyLib()).toEqual([]);
    });

    test("les étudiants du TD et de son TP voient et ouvrent ; le lien passe par un jeton de service d'un seul document", async () => {
        const support = await SupportCours.findOne({ where: { titre: "Chapitre 1" } });
        for (const etu of [etuTd1, etuTp1]) {
            const client = await loginAs(etu);
            const espace = await client.get(`${base}/supports`);
            expect(espace.body).toMatchObject({ gere: false, sections: [{ supports: [{ titre: "Chapitre 1", modifiable: false }] }] });
            const ouvert = await client.get(`/api/supports-cours/${support.id_support}/ouvrir`);
            expect(ouvert.status).toBe(200);
            expect(ouvert.body.url).toBe(`https://fichiers.test/${support.id_document}`);
            const [appel] = appelsStudyLib();
            expect(appel.jeton).toMatchObject({ aud: "studylib-interne", scope: "document:lien", doc: support.id_document, sub: String(etu.id_user) });
            expect(appel.jeton.exp - appel.jeton.iat).toBeLessThanOrEqual(60);
        }
        const etranger = await loginAs(etuTd2);
        expect((await etranger.get(`/api/supports-cours/${support.id_support}/ouvrir`)).status).toBe(404);
    });

    test("un support masqué disparaît pour les étudiants, pas pour l'enseignant", async () => {
        const support = await SupportCours.findOne({ where: { titre: "Chapitre 1" } });
        const client = await loginAs(prof);
        expect((await client.send("put", `/api/supports-cours/${support.id_support}`, { visible: false })).status).toBe(200);
        const etu = await loginAs(etuTd1);
        expect((await etu.get(`${base}/supports`)).body.sections).toEqual([]);
        expect((await etu.get(`/api/supports-cours/${support.id_support}/ouvrir`)).status).toBe(404);
        expect((await client.get(`/api/supports-cours/${support.id_support}/ouvrir`)).status).toBe(200);
        await client.send("put", `/api/supports-cours/${support.id_support}`, { visible: true });
    });

    test("un document déposé dans un autre module est retiré de StudyLib et refusé", async () => {
        moduleDuDepot = "AUTRE-MODULE";
        const res = await deposer(await loginAs(prof));
        expect(res.status).toBe(400);
        const [depot, retrait] = appelsStudyLib();
        expect(depot.methode).toBe("POST");
        expect(retrait).toMatchObject({ methode: "DELETE", chemin: expect.stringContaining("/classe/documents/") });
    });

    test("liens : http ou https seulement", async () => {
        const client = await loginAs(prof);
        expect((await client.send("post", `${base}/liens`, { url: "javascript:alert(1)" })).status).toBe(400);
        expect((await client.send("post", `${base}/liens`, { url: "pas une adresse" })).status).toBe(400);
        const res = await client.send("post", `${base}/liens`, { url: "https://www.anssi.gouv.fr/nis2", titre: "Directive NIS2" });
        expect(res.status).toBe(201);
        const ouvert = await (await loginAs(etuTd1)).get(`/api/supports-cours/${res.body.id_support}/ouvrir`);
        expect(ouvert.body.url).toBe("https://www.anssi.gouv.fr/nis2");
    });

    test("épingler un document de la Bibliothèque, pas le document de classe d'un autre ; le retirer ne le supprime pas", async () => {
        const publie = crypto.randomUUID();
        const prive = crypto.randomUUID();
        documents.set(publie, { id: publie, title: "Cours de l'an dernier", visibility: "school", owner: "999", mime_type: "application/pdf", file_size: 10, module: { code: "X" } });
        documents.set(prive, { id: prive, title: "Notes", visibility: "class", owner: "999", module: { code: "X" } });
        const client = await loginAs(prof);
        expect((await client.send("post", `${base}/bibliotheque`, { id_document: prive })).status).toBe(404);
        const res = await client.send("post", `${base}/bibliotheque`, { id_document: publie });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ titre: "Cours de l'an dernier", dans_bibliotheque: true });
        appelsStudyLib();
        expect((await client.send("delete", `/api/supports-cours/${res.body.id_support}`)).status).toBe(204);
        expect(appelsStudyLib()).toEqual([]);
        expect(documents.has(publie)).toBe(true);
    });

    test("un co-enseignant ajoute mais ne retire pas le support d'un autre ; l'auteur publie puis retire", async () => {
        const support = await SupportCours.findOne({ where: { titre: "Chapitre 1" } });
        const co = await loginAs(coprof);
        expect((await co.get(`${base}/supports`)).body.gere).toBe(true);
        expect((await co.send("delete", `/api/supports-cours/${support.id_support}`)).status).toBe(403);
        expect((await co.send("post", `/api/supports-cours/${support.id_support}/publier`)).status).toBe(403);

        const client = await loginAs(prof);
        const publie = await client.send("post", `/api/supports-cours/${support.id_support}/publier`);
        expect(publie.status).toBe(200);
        expect(publie.body.dans_bibliotheque).toBe(true);
        expect(documents.get(support.id_document).visibility).toBe("school");
        expect((await client.send("post", `/api/supports-cours/${support.id_support}/publier`)).status).toBe(409);
    });

    test("le retrait d'un document de classe le supprime aussi de StudyLib, et se journalise", async () => {
        const client = await loginAs(prof);
        const depot = await deposer(client, `${base}/fichiers`, "Brouillon");
        appelsStudyLib();
        expect((await client.send("delete", `/api/supports-cours/${depot.body.id_support}`)).status).toBe(204);
        expect(appelsStudyLib()).toEqual([expect.objectContaining({ methode: "DELETE" })]);
        expect(documents.has(depot.body.id_document)).toBe(false);
    });
});

describe("Espace de cours : sections", () => {
    test("créer, renommer, ordonner ; une section non vide ne se supprime pas", async () => {
        const client = await loginAs(prof);
        const s = await client.send("post", `${base}/sections`, { titre: "Semaine 1" });
        expect(s.status).toBe(201);
        expect((await client.send("post", `${base}/sections`, { titre: "  " })).status).toBe(400);
        expect((await client.send("put", `/api/sections-cours/${s.body.id_section}`, { titre: "Semaine 2" })).body.titre).toBe("Semaine 2");

        const ids = (await client.get(`${base}/supports`)).body.sections.map((x) => x.id_section);
        expect((await client.send("put", `${base}/sections/ordre`, { ids: [ids[0]] })).status).toBe(400);
        expect((await client.send("put", `${base}/sections/ordre`, { ids: [...ids].reverse() })).status).toBe(204);
        expect((await client.get(`${base}/supports`)).body.sections[0].titre).toBe("Semaine 2");

        const general = ids[0];
        expect((await client.send("delete", `/api/sections-cours/${general}`)).status).toBe(409);
        expect((await client.send("delete", `/api/sections-cours/${s.body.id_section}`)).status).toBe(204);
        const autre = await loginAs(profTd2);
        expect((await autre.send("put", `/api/sections-cours/${general}`, { titre: "Piraté" })).status).toBe(404);
    });

    test("déposer dans une section précise", async () => {
        const client = await loginAs(prof);
        const s = await client.send("post", `${base}/sections`, { titre: "TP" });
        const res = await deposer(client, `/api/sections-cours/${s.body.id_section}/fichiers`, "Sujet de TP");
        expect(res.status).toBe(201);
        expect(res.body.id_section).toBe(s.body.id_section);
    });
});

describe("Mes cours de l'étudiant", () => {
    test("ses classes qui ont un support publié, sous-groupes compris", async () => {
        for (const etu of [etuTd1, etuTp1]) {
            const res = await (await loginAs(etu)).get("/api/etudiant/cours");
            expect(res.status).toBe(200);
            expect(res.body).toEqual([expect.objectContaining({ id_cours: fixture.cours.id_cours, id_groupe: td1.id_groupe, nom_groupe: "TD1" })]);
        }
        expect((await (await loginAs(etuTd2)).get("/api/etudiant/cours")).body).toEqual([]);
        expect((await (await loginAs(prof)).get("/api/etudiant/cours")).status).toBe(403);
    });
});

describe("Transmission à StudyLib", () => {
    test("taille annoncée trop grande ou absente, formulaire d'un autre type : refusé avant tout envoi", async () => {
        const entetes = (h) => ({ headers: { "content-type": "multipart/form-data; boundary=x", ...h }, cookies: {} });
        await expect(transmettreDepot(entetes({ "content-length": String(30 * 1024 * 1024) }))).rejects.toMatchObject({ status: 413 });
        await expect(transmettreDepot(entetes({}))).rejects.toMatchObject({ status: 411 });
        await expect(transmettreDepot({ headers: { "content-type": "application/json", "content-length": "10" }, cookies: {} })).rejects.toMatchObject({ status: 400 });
        expect(appelsStudyLib()).toEqual([]);
    });
});
