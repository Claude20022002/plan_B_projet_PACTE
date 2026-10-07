import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AnneeUniversitaire, Appartenir, CoursComposante, Devoir, Enseignement, EnseignementEnseignant, Groupe, Notification, Periode } from "../../models/index.js";

/**
 * Devoirs avec dépôt de fichier (R3) : l'enseignant donne un devoir « fichier » (consignes,
 * énoncé), l'étudiant dépose sa copie (remplaçable tant qu'elle n'est pas corrigée, en retard
 * après la date limite), l'enseignant la télécharge, la note sur 20 et la commente.
 */

let enseignant;
let autreEnseignant;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let idDevoir;

const PDF = Buffer.from("%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n", "latin1");
const ZIP = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("contenu de l'archive")]);
const ZIP_TYPE = "application/zip";
const demain = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString();

const deposer = (session, chemin, contenu, type, nom) =>
    session.agent.put(`${chemin}?nom=${encodeURIComponent(nom)}`).set("X-CSRF-Token", session.csrf).set("Content-Type", type).send(contenu);
const telecharger = (session, chemin) =>
    session.agent.get(chemin).buffer(true).parse((r, cb) => {
        const morceaux = [];
        r.on("data", (m) => morceaux.push(m));
        r.on("end", () => cb(null, Buffer.concat(morceaux)));
    });

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
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
    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-22", nb_semaines: 15 });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TD", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignant.id_user, role: "principal", statut_service: "accepte" });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Donner un devoir fichier", () => {
    test("titre requis, type connu, dans ses modules seulement", async () => {
        const base = { type: "fichier", id_cours: fixture.cours.id_cours, date_limite: demain() };
        const prof = await loginAs(enseignant);
        expect((await prof.send("post", "/api/devoirs", { ...base, titre: " " })).status).toBe(400);
        expect((await prof.send("post", "/api/devoirs", { ...base, type: "oral", titre: "x" })).status).toBe(400);
        expect((await (await loginAs(autreEnseignant)).send("post", "/api/devoirs", { ...base, titre: "Rapport" })).status).toBe(403);
    });

    test("créé avec ses consignes ; les étudiants du module sont prévenus", async () => {
        const res = await (await loginAs(enseignant)).send("post", "/api/devoirs", { type: "fichier", titre: "Rapport de TP réseaux", consignes: "Un PDF de 5 pages au plus.", id_cours: fixture.cours.id_cours, date_limite: demain() });
        expect(res.status).toBe(201);
        expect(res.body.devoir).toMatchObject({ type: "fichier", titre: "Rapport de TP réseaux", nb_questions: 0 });
        expect(res.body.notifies).toBe(2);
        idDevoir = res.body.devoir.id;
        expect(await Notification.count({ where: { id_user: etudiantTp.id_user, titre: "Nouveau devoir" } })).toBe(1);
    });

    test("énoncé déposé par l'enseignant, téléchargé par un étudiant visé, pas par un autre", async () => {
        const prof = await loginAs(enseignant);
        const res = await deposer(prof, `/api/devoirs/${idDevoir}/enonce`, PDF, "application/pdf", "Énoncé TP.pdf");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ nom: "Énoncé TP.pdf", type: "application/pdf", taille: PDF.length });
        const lu = await telecharger(await loginAs(etudiant), `/api/devoirs/${idDevoir}/enonce`);
        expect(lu.status).toBe(200);
        expect(Buffer.compare(lu.body, PDF)).toBe(0);
        expect((await (await loginAs(etranger)).get(`/api/devoirs/${idDevoir}/enonce`)).status).toBe(404);
        expect((await deposer(await loginAs(etudiant), `/api/devoirs/${idDevoir}/enonce`, PDF, "application/pdf", "x.pdf")).status).toBe(403);
    });
});

describe("Rendre sa copie", () => {
    test("le sujet montre consignes et énoncé ; pas de réponses de quiz", async () => {
        const session = await loginAs(etudiant);
        const sujet = (await session.get(`/api/devoirs/${idDevoir}`)).body;
        expect(sujet.devoir).toMatchObject({ type: "fichier", consignes: "Un PDF de 5 pages au plus.", enonce: { nom: "Énoncé TP.pdf" } });
        expect(sujet.rendu).toBeNull();
        expect((await session.send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [] })).status).toBe(400);
    });

    test("dépôt d'une archive, puis remplacement par un PDF avant correction", async () => {
        const session = await loginAs(etudiant);
        const premier = await deposer(session, `/api/devoirs/${idDevoir}/copie`, ZIP, ZIP_TYPE, "rapport.zip");
        expect(premier.status).toBe(200);
        expect(premier.body).toMatchObject({ en_retard: false, fichier: { nom: "rapport.zip", type: ZIP_TYPE } });
        const second = await deposer(session, `/api/devoirs/${idDevoir}/copie`, PDF, "application/pdf", "rapport.pdf");
        expect(second.body.fichier.nom).toBe("rapport.pdf");
        const sujet = (await session.get(`/api/devoirs/${idDevoir}`)).body;
        expect(sujet.rendu).toMatchObject({ note: null, en_retard: false, fichier: { nom: "rapport.pdf" } });
    });

    test("refus : type non accepté, contenu déguisé, étudiant hors module", async () => {
        const session = await loginAs(etudiantTp);
        expect((await deposer(session, `/api/devoirs/${idDevoir}/copie`, Buffer.from("bonjour"), "text/plain", "a.txt")).status).toBe(415);
        expect((await deposer(session, `/api/devoirs/${idDevoir}/copie`, PDF, ZIP_TYPE, "faux.zip")).status).toBe(415);
        expect((await deposer(await loginAs(etranger), `/api/devoirs/${idDevoir}/copie`, PDF, "application/pdf", "a.pdf")).status).toBe(404);
    });

    test("après la date limite, la copie est acceptée et marquée en retard", async () => {
        await Devoir.update({ date_limite: new Date(Date.now() - 3600 * 1000) }, { where: { id_devoir: idDevoir } });
        const res = await deposer(await loginAs(etudiantTp), `/api/devoirs/${idDevoir}/copie`, PDF, "application/pdf", "en-retard.pdf");
        expect(res.status).toBe(200);
        expect(res.body.en_retard).toBe(true);
    });
});

describe("Corriger", () => {
    test("l'enseignant voit les copies à corriger d'abord et télécharge celle d'un étudiant ; un autre étudiant ne le peut pas", async () => {
        const prof = await loginAs(enseignant);
        const resultats = (await prof.get(`/api/devoirs/${idDevoir}/resultats`)).body;
        expect(resultats).toMatchObject({ rendus: 2, a_corriger: 2 });
        expect(resultats.etudiants.find((e) => e.id_user === etudiantTp.id_user)).toMatchObject({ en_retard: true, note: null, fichier: { nom: "en-retard.pdf" } });
        const copie = await telecharger(prof, `/api/devoirs/${idDevoir}/copies/${etudiant.id_user}`);
        expect(copie.status).toBe(200);
        expect(Buffer.compare(copie.body, PDF)).toBe(0);
        expect((await (await loginAs(etudiantTp)).get(`/api/devoirs/${idDevoir}/copies/${etudiant.id_user}`)).status).toBe(404);
        expect((await (await loginAs(etudiant)).get(`/api/devoirs/${idDevoir}/copies/${etudiant.id_user}`)).status).toBe(200);
    });

    test("note sur 20 et commentaire : l'étudiant est prévenu et ne peut plus remplacer sa copie", async () => {
        const prof = await loginAs(enseignant);
        expect((await prof.send("put", `/api/devoirs/${idDevoir}/copies/${etudiant.id_user}/note`, { note: 25 })).status).toBe(400);
        expect((await (await loginAs(autreEnseignant)).send("put", `/api/devoirs/${idDevoir}/copies/${etudiant.id_user}/note`, { note: 12 })).status).toBe(403);
        const res = await prof.send("put", `/api/devoirs/${idDevoir}/copies/${etudiant.id_user}/note`, { note: "15,5", commentaire: "Bonne analyse, conclusion trop courte." });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ note: 15.5, commentaire: "Bonne analyse, conclusion trop courte." });
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Devoir corrigé" } })).toBe(1);

        const session = await loginAs(etudiant);
        expect((await session.get(`/api/devoirs/${idDevoir}`)).body.rendu).toMatchObject({ note: 15.5, commentaire: "Bonne analyse, conclusion trop courte." });
        expect((await deposer(session, `/api/devoirs/${idDevoir}/copie`, PDF, "application/pdf", "v3.pdf")).status).toBe(409);
        expect((await prof.send("put", `/api/devoirs/${idDevoir}/copies/${etranger.id_user}/note`, { note: 10 })).status).toBe(404);
    });

    test("liste de l'enseignant : copies rendues, à corriger, moyenne des notes", async () => {
        const liste = (await (await loginAs(enseignant)).get("/api/devoirs")).body.data;
        expect(liste.find((d) => d.id === idDevoir)).toMatchObject({ type: "fichier", rendus: 2, a_corriger: 1, moyenne: 15.5 });
        const etu = (await (await loginAs(etudiant)).get("/api/devoirs")).body.data.find((d) => d.id === idDevoir);
        expect(etu.rendu).toMatchObject({ note: 15.5, en_retard: false });
    });
});
