import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { ErreurMetier } from "../../services/planning/enseignements.js";
import { definirClientClassQuiz } from "../../services/quiz/clientClassQuiz.js";

/**
 * Mes quiz (reste du lot IA-4) : l'enseignant relit et modifie depuis Planner un quiz qu'il a dans
 * le service de quiz. Le fork est remplacé par un faux qui garde les quiz de chaque enseignant.
 */

const QUIZ = "6f1c2a4e-1b2c-4d5e-8f90-123456789abc";
const LIBRE = "0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
let prof;
let collegue;
let etudiant;
let ecritures;

const qcm = (question, justes = [0]) => ({
    question,
    time: "30",
    type: justes.length > 1 ? "CHECK" : "ABCD",
    image: null,
    answers: ["BGP", "OSPF", "RIP"].map((answer, i) => ({ answer, right: justes.includes(i), color: null })),
});

beforeAll(async () => {
    await resetDatabase();
    prof = await createUser("enseignant");
    collegue = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    const quizDe = {
        [QUIZ]: { proprietaire: prof.email, titre: "Routage", description: "", questions: [qcm("Entre systèmes autonomes ?"), qcm("Protocoles à vecteur de distance ?", [1, 2])] },
        [LIBRE]: { proprietaire: prof.email, titre: "Réponses libres", description: "", questions: [{ question: "Un mot ?", time: "20", type: "TEXT", answers: [] }] },
    };
    definirClientClassQuiz(async (chemin, corps) => {
        const [, id, requete] = /^\/api\/v1\/hestim\/quiz\/([^?]+)(?:\?(.*))?$/.exec(chemin);
        const email = corps ? corps.email : new URLSearchParams(requete).get("email");
        const quiz = quizDe[id];
        if (!corps) return quiz?.proprietaire === email ? { id, titre: quiz.titre, description: quiz.description, questions: quiz.questions } : null;
        ecritures.push({ id, corps });
        if (quiz?.proprietaire !== email) throw new ErreurMetier("Le service de quiz a refusé la demande : quiz introuvable pour cet enseignant", 422);
        return { id, titre: corps.titre, nb_questions: corps.questions.length };
    });
});
afterAll(async () => {
    definirClientClassQuiz(null);
    await closeDatabase();
});
beforeEach(() => {
    ecritures = [];
    resetRateLimiters();
});

describe("Mes quiz : relire puis modifier un quiz du service de quiz", () => {
    test("l'enseignant relit son quiz au format d'écriture", async () => {
        const res = await (await loginAs(prof)).get(`/api/quiz/mes-quiz/${QUIZ}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: QUIZ, titre: "Routage", modifiable: true });
        expect(res.body.questions[1]).toEqual({
            question: "Protocoles à vecteur de distance ?",
            time: 30,
            type: "CHECK",
            answers: [{ answer: "BGP", right: false }, { answer: "OSPF", right: true }, { answer: "RIP", right: true }],
        });
    });

    test("un quiz avec une question que Planner ne sait pas écrire se lit, mais n'est pas modifiable", async () => {
        const res = await (await loginAs(prof)).get(`/api/quiz/mes-quiz/${LIBRE}`);
        expect(res.status).toBe(200);
        expect(res.body.modifiable).toBe(false);
    });

    test("la nouvelle version part au fork, pour le compte de l'enseignant", async () => {
        const client = await loginAs(prof);
        const { body: quiz } = await client.get(`/api/quiz/mes-quiz/${QUIZ}`);
        const questions = [...quiz.questions, { question: "Port de BGP ?", time: 20, type: "ABCD", answers: [{ answer: "179", right: true }, { answer: "80", right: false }] }];
        const res = await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: "  Routage, version 2  ", questions });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: QUIZ, titre: "Routage, version 2", nb_questions: 3 });
        expect(ecritures).toHaveLength(1);
        expect(ecritures[0].corps).toMatchObject({ email: prof.email, titre: "Routage, version 2", description: "" });
        expect(ecritures[0].corps.questions[2]).toEqual({ question: "Port de BGP ?", time: 20, type: "ABCD", answers: [{ answer: "179", right: true }, { answer: "80", right: false }] });
    });

    test("le quiz d'un collègue ne se lit ni ne se modifie", async () => {
        const client = await loginAs(collegue);
        expect((await client.get(`/api/quiz/mes-quiz/${QUIZ}`)).status).toBe(404);
        const res = await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: "Pris", questions: [qcm("Q ?")] });
        expect(res.status).toBe(422);
        expect(res.body.message).toContain("quiz introuvable");
    });

    test("version incomplète ou hors des types de Planner : refusée avant le fork", async () => {
        const client = await loginAs(prof);
        expect((await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: " ", questions: [qcm("Q ?")] })).status).toBe(400);
        expect((await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: "Routage", questions: [] })).status).toBe(400);
        expect((await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: "Routage", questions: [{ question: "Un mot ?", time: 20, type: "TEXT", answers: [] }] })).status).toBe(400);
        expect((await client.get("/api/quiz/mes-quiz/pas-un-identifiant")).status).toBe(404);
        expect(ecritures).toHaveLength(0);
    });

    test("réservé aux enseignants", async () => {
        const client = await loginAs(etudiant);
        expect((await client.get(`/api/quiz/mes-quiz/${QUIZ}`)).status).toBe(403);
        expect((await client.send("put", `/api/quiz/mes-quiz/${QUIZ}`, { titre: "x", questions: [qcm("Q ?")] })).status).toBe(403);
    });
});
