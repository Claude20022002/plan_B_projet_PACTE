import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { MediaQuiz, Questionnaire, QuestionQuiz } from "../../models/index.js";
import { definirClientClassQuiz } from "../../services/quiz/clientClassQuiz.js";
import { ErreurMetier } from "../../services/planning/enseignements.js";
import { convertirQuestion, importerPourEnseignantsActifs } from "../../services/studio/importClassQuiz.js";
import { definirTelechargeurClassQuiz } from "../../services/studio/mediasClassQuiz.js";

/**
 * Import des quiz de ClassQuiz dans le Studio (sortie de ClassQuiz, lot SC-2) : correspondance des
 * types, questions ignorées dites dans le bilan, brouillon à relire, pas de doublon, et seulement
 * les enseignants actifs pour la commande d'administration. Le fork est un faux client.
 */

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const ID_C = "33333333-3333-4333-8333-333333333333";
const ID_INACTIF = "44444444-4444-4444-8444-444444444444";

// Deux images du fork : l'une se télécharge (un vrai PNG d'un pixel), l'autre a disparu du stockage
const IMAGE_OK = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const IMAGE_PERDUE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb--cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c20000000049454e44ae426082", "hex");

const reponses = (...textes) => textes.map(([answer, right]) => ({ answer, right: right === true }));
const QUIZ_A = {
    id: ID_A,
    titre: "Réseaux : bases",
    description: "Contrôle 1",
    questions: [
        { type: "ABCD", question: "Quelle couche gère le routage ?", time: "20", image: IMAGE_OK, answers: reponses(["Physique"], ["Réseau", true], ["Application"]) },
        { type: "CHECK", question: "Quels protocoles sont de la couche transport ?", time: "20", answers: reponses(["TCP", true], ["UDP", true], ["HTTP"]) },
        { type: "TEXT", question: "Quel protocole traduit les noms de domaine ?", time: "20", image: IMAGE_PERDUE, answers: [{ answer: "DNS", case_sensitive: false }, { answer: "Domain Name System", case_sensitive: false }] },
        { type: "ORDER", question: "Classez les couches du bas vers le haut", time: "30", answers: [{ answer: "Physique" }, { answer: "Liaison" }, { answer: "Réseau" }] },
        { type: "RANGE", question: "Combien de bits dans une adresse IPv4 ?", time: "20", answers: { min: 0, max: 128, min_correct: 30, max_correct: 34 } },
        { type: "VOTING", question: "Quel langage préférez-vous ?", time: "20", answers: reponses(["C"], ["Python"]) },
        { type: "SLIDE", question: "Pause", time: "5", answers: [] },
    ],
};
const QUIZ_B = { id: ID_B, titre: "Sondage seul", description: "", questions: [{ type: "VOTING", question: "Votre avis ?", time: "20", answers: reponses(["Oui"], ["Non"]) }] };
const QUIZ_C = { id: ID_C, titre: "Chez un collègue", description: "", questions: [{ type: "ABCD", question: "Question du collègue ?", time: "20", answers: reponses(["Oui", true], ["Non"]) }] };
const QUIZ_INACTIF = { id: ID_INACTIF, titre: "D'un enseignant parti", description: "", questions: [{ type: "ABCD", question: "Question ancienne ?", time: "20", answers: reponses(["Oui", true], ["Non"]) }] };

let prof;
let collegue;
let parti;
let clients;

/** Faux fork : les quiz par adresse e-mail de l'enseignant, comme les routes signées /api/v1/hestim/… */
const brancherFork = () => {
    const parEmail = new Map([
        [prof.email, [QUIZ_A, QUIZ_B]],
        [collegue.email, [QUIZ_C]],
        [parti.email, [QUIZ_INACTIF]],
    ]);
    definirClientClassQuiz(async (chemin) => {
        const adresse = new URL(chemin, "http://fork");
        const siens = parEmail.get(adresse.searchParams.get("email")) ?? [];
        if (adresse.pathname === "/api/v1/hestim/quizzes") return siens.map((q) => ({ id: q.id, titre: q.titre, nb_questions: q.questions.length }));
        const id = adresse.pathname.split("/").pop();
        return siens.find((q) => q.id === id) ?? null;
    });
};

beforeAll(async () => {
    await resetDatabase();
    prof = await createUser("enseignant");
    collegue = await createUser("enseignant");
    parti = await createUser("enseignant", { actif: false });
    clients = { prof: await loginAs(prof) };
    brancherFork();
    definirTelechargeurClassQuiz(async (nom) => {
        if (nom === IMAGE_OK) return { contenu: PNG, type: "image/*" };
        throw new ErreurMetier("le service de quiz a répondu 404", 502);
    });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Correspondance des types", () => {
    test("ABCD, CHECK, TEXT, ORDER et RANGE se traduisent ; sondage et diapositive sont ignorés", () => {
        const types = QUIZ_A.questions.map((q) => convertirQuestion(q).question?.type ?? null);
        expect(types).toEqual(["choix_unique", "choix_multiple", "reponse_courte", "ordre", "numerique", null, null]);
        expect(convertirQuestion(QUIZ_A.questions[0]).question.donnees).toMatchObject({ bonne: "o2" });
        expect(convertirQuestion(QUIZ_A.questions[1]).question.donnees).toMatchObject({ bonnes: ["o1", "o2"] });
        expect(convertirQuestion(QUIZ_A.questions[4]).question.donnees).toEqual({ valeur: 32, tolerance: 2 });
        expect(convertirQuestion({ type: "ABCD", question: "Sans bonne réponse ?", answers: reponses(["Oui"], ["Non"]) }).ignoree).toMatch(/aucune bonne réponse/);
    });

    test("la durée du fork est reprise, bornée aux limites du direct (5 à 120 s)", () => {
        const avecDuree = (time) => convertirQuestion({ ...QUIZ_A.questions[0], time }).question.duree_s;
        expect([avecDuree("20"), avecDuree("2"), avecDuree("999"), avecDuree("abc")]).toEqual([20, 5, 120, null]);
    });
});

describe("Import par l'enseignant", () => {
    test("les quiz à importer sont listés, puis importés en brouillon avec un bilan clair", async () => {
        const avant = await clients.prof.get("/api/studio-quiz/classquiz");
        expect(avant.body.a_importer).toBe(2);

        const reponse = await clients.prof.send("post", "/api/studio-quiz/classquiz/importer");
        expect(reponse.status).toBe(200);
        expect(reponse.body).toMatchObject({ importes: 1, deja_importes: 0, erreurs: 0 });
        const [a, b] = reponse.body.quiz;
        expect(a).toMatchObject({ resultat: "importe", importees: 5 });
        expect(a.ignorees.map((i) => i.type)).toEqual(["VOTING", "SLIDE"]);
        // Un quiz fait seulement de sondages n'a rien à importer
        expect(b).toMatchObject({ resultat: "vide", importees: 0 });

        const quiz = await Questionnaire.findByPk(a.id_questionnaire);
        expect(quiz).toMatchObject({ titre: "Réseaux : bases", id_user: prof.id_user });
        expect(quiz.etiquettes).toEqual(["ClassQuiz"]);
        const questions = await QuestionQuiz.findAll({ where: { id_questionnaire: a.id_questionnaire }, order: [["ordre", "ASC"]] });
        expect(questions.map((q) => q.type)).toEqual(["choix_unique", "choix_multiple", "reponse_courte", "ordre", "numerique"]);
        // Brouillon : à relire avant de diffuser
        expect(questions.every((q) => q.a_relire && q.origine === "import")).toBe(true);
        // Durées reprises ; l'image copiée chez nous, celle qui a disparu dite dans le bilan
        expect(questions.map((q) => q.duree_s)).toEqual([20, 20, 20, 30, 20]);
        const media = await MediaQuiz.findByPk(questions[0].id_media);
        expect(media).toMatchObject({ id_user: prof.id_user, type: "image", type_mime: "image/png", origine: "import" });
        expect(questions[2].id_media).toBeNull();
        expect(a.avertissements).toEqual([{ numero: 3, raison: expect.stringMatching(/^image non reprise/) }]);
    });

    test("relancer l'import ne crée aucun doublon", async () => {
        const avant = await Questionnaire.count({ where: { id_user: prof.id_user } });
        const reponse = await clients.prof.send("post", "/api/studio-quiz/classquiz/importer");
        expect(reponse.body).toMatchObject({ importes: 0, deja_importes: 1 });
        expect(await Questionnaire.count({ where: { id_user: prof.id_user } })).toBe(avant);
        // Il reste le quiz fait de sondages seulement, qui n'a jamais rien donné
        expect((await clients.prof.get("/api/studio-quiz/classquiz")).body.a_importer).toBe(1);
    });

    test("le fork absent ne casse rien : rien à importer", async () => {
        definirClientClassQuiz(async () => {
            throw new ErreurMetier("Le service de quiz n'est pas configuré", 503);
        });
        expect((await clients.prof.get("/api/studio-quiz/classquiz")).body).toEqual({ quiz: [], a_importer: 0 });
        brancherFork();
    });
});

describe("Commande d'administration", () => {
    test("seuls les enseignants actifs sont importés", async () => {
        const bilans = await importerPourEnseignantsActifs();
        const emails = bilans.map((b) => b.email);
        expect(emails).toContain(collegue.email);
        expect(emails).not.toContain(parti.email);
        expect(await Questionnaire.count({ where: { id_user: parti.id_user } })).toBe(0);
        expect(await Questionnaire.count({ where: { id_user: collegue.id_user } })).toBe(1);
        expect(await QuestionQuiz.count({ where: { source: `classquiz:${ID_C}` } })).toBe(1);
    });
});
