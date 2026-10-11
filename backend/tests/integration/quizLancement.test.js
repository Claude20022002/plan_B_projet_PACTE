import crypto from "crypto";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Notification, QuizPartie } from "../../models/index.js";
import { definirClientClassQuiz } from "../../services/quiz/clientClassQuiz.js";

/**
 * Lot CQ-1 : l'enseignant lance une partie en direct depuis Planner. Le fork (remplacé ici) crée
 * la partie ; Planner la rattache à la séance, prévient les étudiants et remet à l'enseignant seul
 * le code et l'identifiant qui donnent la main sur la partie.
 */

const QUIZ = crypto.randomUUID();
const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });

let enseignant;
let collegue;
let etudiant;
let fixture;
let clients;
let appels;

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    collegue = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    await fixture.creneau.update({ heure_debut: "00:00:00", heure_fin: "23:59:00", duree_minutes: 1439 });
    await fixture.affectation.update({ date_seance: aujourdhui(), statut: "confirme" });
    clients = { enseignant: await loginAs(enseignant), collegue: await loginAs(collegue), etudiant: await loginAs(etudiant), admin: await loginAs(admin) };
});
afterAll(async () => {
    definirClientClassQuiz(null);
    await closeDatabase();
});
beforeEach(() => {
    resetRateLimiters();
    appels = [];
    let pin = 480000;
    definirClientClassQuiz(async (chemin, corps) => {
        appels.push({ chemin, corps });
        pin += 1;
        return { game_id: crypto.randomUUID(), game_pin: String(pin), quiz_id: corps.quiz_id, titre: "Révision PySpark", nb_questions: 7, game_mode: "kahoot" };
    });
});

const lancer = (client, corps) => client.send("post", "/api/quiz/parties", corps);

describe("Lancer une partie en direct depuis Planner", () => {
    test("la partie est créée par une requête au fork, rattachée à la séance choisie, et les étudiants sont prévenus", async () => {
        const reponse = await lancer(clients.enseignant, { id_quiz: QUIZ, id_affectation: fixture.affectation.id_affectation });
        expect(reponse.status).toBe(201);
        expect(appels).toEqual([{ chemin: "/api/v1/hestim/parties", corps: { email: enseignant.email, quiz_id: QUIZ } }]);
        expect(reponse.body).toMatchObject({ id_affectation: fixture.affectation.id_affectation, titre: "Révision PySpark", nb_questions: 7, notifies: 1, animation: { game_pin: "480001", socket: "/socket.io/" } });

        const partie = await QuizPartie.findByPk(reponse.body.id_quiz_partie);
        expect(partie).toMatchObject({ id_user_enseignant: enseignant.id_user, pin: "480001", mode: "kahoot", game_id: reponse.body.animation.game_id });
        expect((await Notification.findAll({ where: { titre: "Quiz en cours" } })).map((n) => n.id_user)).toEqual([etudiant.id_user]);
    });

    test("sans séance désignée, la séance en cours est prise ; l'identifiant d'animation ne sort que du lancement", async () => {
        const reponse = await lancer(clients.enseignant, { id_quiz: QUIZ });
        expect(reponse.body.id_affectation).toBe(fixture.affectation.id_affectation);
        for (const client of [clients.enseignant, clients.etudiant]) {
            const liste = await client.get("/api/quiz/parties/en-cours");
            expect(liste.body.data.length).toBeGreaterThan(0);
            expect(JSON.stringify(liste.body)).not.toContain(reponse.body.animation.game_id);
        }
    });

    test("refus sans appel au fork : autre rôle, quiz mal formé, séance d'un collègue ou d'un autre jour", async () => {
        expect((await lancer(clients.etudiant, { id_quiz: QUIZ })).status).toBe(403);
        expect((await lancer(clients.admin, { id_quiz: QUIZ })).status).toBe(403);
        expect((await lancer(clients.enseignant, { id_quiz: "pas-un-quiz" })).status).toBe(400);
        expect((await lancer(clients.collegue, { id_quiz: QUIZ, id_affectation: fixture.affectation.id_affectation })).status).toBe(404);
        expect((await lancer(clients.enseignant, { id_quiz: QUIZ, id_affectation: 999999 })).status).toBe(404);
        await fixture.affectation.update({ date_seance: "2027-03-01" });
        expect((await lancer(clients.enseignant, { id_quiz: QUIZ, id_affectation: fixture.affectation.id_affectation })).status).toBe(409);
        await fixture.affectation.update({ date_seance: aujourdhui() });
        expect(appels).toEqual([]);
    });

    test("un collègue sans séance lance quand même, sans rattachement ; une réponse inattendue du fork est refusée", async () => {
        const libre = await lancer(clients.collegue, { id_quiz: QUIZ });
        expect(libre.status).toBe(201);
        expect(libre.body).toMatchObject({ id_affectation: null, notifies: 0 });

        const avant = await QuizPartie.count();
        definirClientClassQuiz(async () => ({ game_id: "x", game_pin: "abc" }));
        expect((await lancer(clients.enseignant, { id_quiz: QUIZ })).status).toBe(502);
        expect(await QuizPartie.count()).toBe(avant);
    });
});
