import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AnneeUniversitaire, Appartenir, CoursComposante, Devoir, Enseignement, EnseignementEnseignant, Groupe, Notification, Periode } from "../../models/index.js";
import { definirClientClassQuiz } from "../../services/quiz/devoirs.js";

/**
 * Devoirs notés : un enseignant donne l'un de ses quiz ClassQuiz en devoir dans son module ;
 * Planner copie les questions (ClassQuiz remplacé ici par un faux), les sert sans les réponses,
 * corrige et note sur 20, une copie par étudiant ; correction visible après la date limite.
 */

const QUIZ_ID = "3c98bb3c-b762-47ce-a418-e8daf3c7d3ed";
const QUESTIONS = [
    { question: "<p>Quelle fonction affiche du texte ?</p>", time: "20", type: "ABCD", answers: [{ right: false, answer: "echo()" }, { right: true, answer: "print()" }, { right: false, answer: "printf()" }] },
    { question: "Types immuables ?", time: "20", type: "CHECK", answers: [{ right: true, answer: "tuple" }, { right: false, answer: "list" }, { right: true, answer: "str" }] },
    { question: "Fonction d'affichage ?", time: "20", type: "TEXT", answers: [{ answer: "print", case_sensitive: false }] },
    { question: "len('abcd') ?", time: "20", type: "RANGE", answers: { min: 0, max: 10, min_correct: 4, max_correct: 4 } },
    { question: "Ordre d'exécution", time: "20", type: "ORDER", answers: [{ answer: "lire" }, { answer: "calculer" }, { answer: "afficher" }] },
    { question: "Votre ressenti ?", time: "20", type: "VOTING", answers: [{ answer: "Facile" }, { answer: "Difficile" }] },
];

let enseignant;
let autreEnseignant;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let tp;
let appels;
const demain = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString();

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Mintsa", nom: "Obame" });
    etudiantTp = await createUser("etudiant", { prenom: "Yanis", nom: "Alaoui" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    tp = await Groupe.create({ nom_groupe: "TP1", niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
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

    appels = [];
    definirClientClassQuiz(async (chemin) => {
        appels.push(chemin);
        if (chemin.startsWith("/api/v1/hestim/quizzes")) return [{ id: QUIZ_ID, titre: "Python : les bases", nb_questions: QUESTIONS.length }];
        if (chemin.startsWith(`/api/v1/hestim/quiz/${QUIZ_ID}`) && chemin.includes(encodeURIComponent(enseignant.email))) return { id: QUIZ_ID, titre: "Python : les bases", questions: QUESTIONS };
        return null;
    });
});
afterAll(async () => {
    definirClientClassQuiz(null);
    await closeDatabase();
});
beforeEach(resetRateLimiters);

let idDevoir;

describe("Donner un devoir", () => {
    test("l'enseignant voit ses quiz ClassQuiz ; pas un étudiant", async () => {
        const res = await (await loginAs(enseignant)).get("/api/devoirs/quiz-disponibles");
        expect(res.body.data).toEqual([{ id: QUIZ_ID, titre: "Python : les bases", nb_questions: 6 }]);
        expect(appels.at(-1)).toBe(`/api/v1/hestim/quizzes?email=${encodeURIComponent(enseignant.email)}`);
        expect((await (await loginAs(etudiant)).get("/api/devoirs/quiz-disponibles")).status).toBe(403);
    });

    test("refusé hors de ses modules, sans date à venir, pour un quiz qui n'est pas le sien ou un groupe hors module", async () => {
        const corps = { quiz_id: QUIZ_ID, id_cours: fixture.cours.id_cours, date_limite: demain() };
        expect((await (await loginAs(autreEnseignant)).send("post", "/api/devoirs", corps)).status).toBe(403);
        const prof = await loginAs(enseignant);
        expect((await prof.send("post", "/api/devoirs", { ...corps, date_limite: "2020-01-01" })).status).toBe(400);
        expect((await prof.send("post", "/api/devoirs", { ...corps, quiz_id: "pas-un-uuid" })).status).toBe(400);
        expect((await prof.send("post", "/api/devoirs", { ...corps, quiz_id: "00000000-0000-0000-0000-000000000000" })).status).toBe(404);
        expect((await prof.send("post", "/api/devoirs", { ...corps, id_groupe: fixture.autreGroupe.id_groupe })).status).toBe(400);
        expect(await Devoir.count()).toBe(0);
    });

    test("le devoir copie les questions et prévient les étudiants du module (sous-groupes compris)", async () => {
        const res = await (await loginAs(enseignant)).send("post", "/api/devoirs", { quiz_id: QUIZ_ID, id_cours: fixture.cours.id_cours, date_limite: demain() });
        expect(res.status).toBe(201);
        expect(res.body.devoir).toMatchObject({ titre: "Python : les bases", nb_questions: 6, nb_notees: 5, ouvert: true, module: { code: fixture.cours.code_cours } });
        expect(res.body.notifies).toBe(2);
        idDevoir = res.body.devoir.id;
        const notes = await Notification.findAll({ where: { titre: "Nouveau devoir" } });
        expect(notes.map((n) => n.id_user).sort()).toEqual([etudiant.id_user, etudiantTp.id_user].sort());
    });
});

describe("Faire le devoir", () => {
    test("les étudiants visés le voient à rendre ; pas un étudiant d'un autre groupe", async () => {
        const liste = (await (await loginAs(etudiantTp)).get("/api/devoirs")).body.data;
        expect(liste).toEqual([expect.objectContaining({ id: idDevoir, ouvert: true, rendu: null })]);
        expect((await (await loginAs(etranger)).get("/api/devoirs")).body.data).toEqual([]);
        expect((await (await loginAs(etranger)).get(`/api/devoirs/${idDevoir}`)).status).toBe(404);
    });

    test("le sujet ne contient pas les réponses attendues", async () => {
        const { body } = await (await loginAs(etudiant)).get(`/api/devoirs/${idDevoir}`);
        expect(body.questions).toHaveLength(6);
        expect(body.questions[0]).toEqual({ index: 0, type: "ABCD", question: "Quelle fonction affiche du texte ?", image: null, temps: 20, choix: ["echo()", "print()", "printf()"] });
        expect(body.questions[3]).toMatchObject({ type: "RANGE", min: 0, max: 10 });
        expect([...body.questions[4].choix].sort()).toEqual(["afficher", "calculer", "lire"]);
        expect(JSON.stringify(body)).not.toMatch(/right|min_correct|case_sensitive|attendue/);
    });

    test("une copie notée sur 20 par le serveur, une seule fois", async () => {
        const client = await loginAs(etudiant);
        expect((await client.send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [1, [0, 2]] })).status).toBe(400);
        const parfait = await client.send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [1, [2, 0], " Print ", 4, ["lire", "calculer", "afficher"], 0], note: 0 });
        expect(parfait.status).toBe(201);
        expect(parfait.body).toEqual({ note: 20, bonnes: 5, notees: 5 });
        expect((await client.send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [0, [], "", 0, [], 1] })).status).toBe(409);

        const moyen = await (await loginAs(etudiantTp)).send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [1, [0], "printf", 4, ["calculer", "lire", "afficher"], 1] });
        expect(moyen.body).toEqual({ note: 8, bonnes: 2, notees: 5 });
        // Avant la date limite : sa note et ses réponses, pas la correction
        const vue = (await (await loginAs(etudiantTp)).get(`/api/devoirs/${idDevoir}`)).body;
        expect(vue.rendu).toMatchObject({ note: 8, bonnes: 2 });
        expect(vue.questions[2]).toMatchObject({ ma_reponse: "printf" });
        expect(vue.questions[2].attendue).toBeUndefined();
    });

    test("l'enseignant voit les notes, la moyenne et qui n'a pas rendu", async () => {
        const { body } = await (await loginAs(enseignant)).get(`/api/devoirs/${idDevoir}/resultats`);
        expect(body.moyenne).toBe(14);
        expect(body.rendus).toBe(2);
        expect(body.etudiants.map((e) => [e.prenom, e.note])).toEqual([["Mintsa", 20], ["Yanis", 8]]);
        expect((await (await loginAs(etudiant)).get(`/api/devoirs/${idDevoir}/resultats`)).status).toBe(403);
        expect((await (await loginAs(autreEnseignant)).get(`/api/devoirs/${idDevoir}/resultats`)).status).toBe(403);
        const donnes = (await (await loginAs(enseignant)).get("/api/devoirs")).body.data;
        expect(donnes).toEqual([expect.objectContaining({ id: idDevoir, rendus: 2, moyenne: 14 })]);
    });

    test("après la date limite : plus de copie, correction visible", async () => {
        await Devoir.update({ date_limite: new Date(Date.now() - 1000) }, { where: { id_devoir: idDevoir } });
        const vue = (await (await loginAs(etudiantTp)).get(`/api/devoirs/${idDevoir}`)).body;
        expect(vue.devoir.ouvert).toBe(false);
        expect(vue.questions[0]).toMatchObject({ attendue: [1], juste: true });
        expect(vue.questions[2]).toMatchObject({ attendue: ["print"], juste: false });
        expect(vue.questions[3]).toMatchObject({ attendue: { min: 4, max: 4 }, juste: true });
        const autre = await createUser("etudiant");
        await Appartenir.create({ id_user_etudiant: autre.id_user, id_groupe: tp.id_groupe });
        expect((await (await loginAs(autre)).send("post", `/api/devoirs/${idDevoir}/rendu`, { reponses: [1, [0, 2], "print", 4, [], 0] })).status).toBe(409);
    });

    test("suppression réservée aux enseignants du module", async () => {
        expect((await (await loginAs(autreEnseignant)).send("delete", `/api/devoirs/${idDevoir}`)).status).toBe(403);
        expect((await (await loginAs(enseignant)).send("delete", `/api/devoirs/${idDevoir}`)).body).toEqual({ supprime: true });
        expect(await Devoir.count()).toBe(0);
    });
});
