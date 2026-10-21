import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, Groupe, Notification, SessionQuiz } from "../../models/index.js";

/**
 * Quiz en direct du Studio (docs/plans/sortie-classquiz.md, lot SC-1a) : lancement par l'enseignant
 * pour sa classe, arrivée par le code, question par question, réponses corrigées et chronométrées
 * par le serveur (justesse et rapidité), fermeture d'office, classement, équipes, podium.
 */

let prof;
let collegue;
let etudiant;
let camarade;
let etranger;
let fixture;
let p;
let e;
let c;

const QUESTIONS = [
    { type: "choix_unique", enonce: "Port de SSH ?", points: 1, donnees: { options: [{ id: "o1", texte: "21" }, { id: "o2", texte: "22" }, { id: "o3", texte: "23" }], bonne: "o2" } },
    { type: "vrai_faux", enonce: "TCP garantit l'ordre des segments.", points: 1, donnees: { reponse: true } },
];

const creerQuiz = async (questions = QUESTIONS) => {
    const quiz = (await p.send("post", "/api/studio-quiz/questionnaires", { titre: "Réseaux en direct" })).body;
    for (const q of questions) expect((await p.send("post", `/api/studio-quiz/questionnaires/${quiz.id_questionnaire}/questions`, q)).status).toBe(201);
    return quiz;
};

const lancer = async (corps = {}) => {
    const quiz = await creerQuiz();
    const res = await p.send("post", "/api/quiz-direct", { id_questionnaire: quiz.id_questionnaire, id_groupe: fixture.groupe.id_groupe, ...corps });
    expect(res.status).toBe(201);
    return res.body;
};

const agir = (direct, action) => p.send("post", `/api/quiz-direct/${direct.id_session}/${action}`);
const ecran = (client, direct, depuis) => client.get(`/api/quiz-direct/${direct.id_session}/joueur${depuis === undefined ? "" : `?depuis=${depuis}`}`);
const repondre = (client, direct, index, reponse) => client.send("post", `/api/quiz-direct/${direct.id_session}/reponses`, { index, reponse });

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    prof = await createUser("enseignant");
    collegue = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Mintsa", nom: "Obame" });
    camarade = await createUser("etudiant", { prenom: "Yasmine", nom: "Alaoui" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant: prof, etudiant });
    await Appartenir.create({ id_user_etudiant: camarade.id_user, id_groupe: fixture.groupe.id_groupe });
    await Appartenir.create({ id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe });
    // Deux groupes de TP dans la classe : le défi par équipes
    const base = { niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe };
    const tp1 = await Groupe.create({ ...base, nom_groupe: "TP1" });
    const tp2 = await Groupe.create({ ...base, nom_groupe: "TP2" });
    await Appartenir.create({ id_user_etudiant: etudiant.id_user, id_groupe: tp1.id_groupe });
    await Appartenir.create({ id_user_etudiant: camarade.id_user, id_groupe: tp2.id_groupe });
    p = await loginAs(prof);
    e = await loginAs(etudiant);
    c = await loginAs(camarade);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Lancer un quiz en direct", () => {
    test("connexion exigée ; réservé à l'auteur du quiz, enseignant", async () => {
        expect((await anonymous().get("/api/quiz-direct/1")).status).toBe(401);
        const quiz = await creerQuiz();
        expect((await e.send("post", "/api/quiz-direct", { id_questionnaire: quiz.id_questionnaire })).status).toBe(403);
        expect((await (await loginAs(collegue)).send("post", "/api/quiz-direct", { id_questionnaire: quiz.id_questionnaire })).status).toBe(404);
    });

    test("une question qui ne se pose pas en direct : refusé, avec la raison", async () => {
        const quiz = await creerQuiz([...QUESTIONS, { type: "reponse_libre", enonce: "Rôle d'un routeur ?", points: 2, donnees: { corrige: "Relie des réseaux" } }]);
        const res = await p.send("post", "/api/quiz-direct", { id_questionnaire: quiz.id_questionnaire });
        expect(res.status).toBe(409);
        expect(res.body.code).toBe("QUESTIONS_HORS_DIRECT");
    });

    test("lancé pour la classe : étape « attente », code, étudiants prévenus ; le code mène au direct", async () => {
        const direct = await lancer({ duree_question_s: 30 });
        expect(direct).toMatchObject({ etape: "attente", total: 2, duree_s: 30, joueurs: 0 });
        expect(direct.code).toMatch(/^[A-Z2-9]{6}$/);
        expect(direct.notifies).toBeGreaterThanOrEqual(2);
        expect(await Notification.count({ where: { id_user: etudiant.id_user, titre: "Quiz en direct" } })).toBeGreaterThan(0);

        const accueil = await e.send("post", "/api/passations/rejoindre", { code: direct.code });
        expect(accueil.status).toBe(200);
        expect(accueil.body).toMatchObject({ mode: "direct", id_session: direct.id_session });
        const tentative = await e.send("post", `/api/passations/sessions/${direct.id_session}/tentatives`);
        expect(tentative.status).toBe(409);
        expect(tentative.body.code).toBe("QUIZ_EN_DIRECT");
    });
});

describe("Une partie, de bout en bout", () => {
    let direct;

    beforeAll(async () => {
        direct = await lancer();
    });

    test("seuls les étudiants de la classe rejoignent ; l'écran exige d'avoir rejoint", async () => {
        expect((await ecran(e, direct)).status).toBe(403);
        expect((await (await loginAs(etranger)).send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).status).toBe(403);
        expect((await p.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).status).toBe(403);
        expect((await e.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).body.etape).toBe("attente");
        expect((await c.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).status).toBe(200);
        const vue = (await p.get(`/api/quiz-direct/${direct.id_session}`)).body;
        expect(vue.joueurs).toBe(2);
        expect(vue.arrivees).toEqual(expect.arrayContaining(["Mintsa Obame", "Yasmine Alaoui"]));
    });

    test("question ouverte : ni l'écran projeté ni les téléphones ne voient la bonne réponse", async () => {
        const vue = (await agir(direct, "suivante")).body;
        expect(vue).toMatchObject({ etape: "question", index: 0 });
        expect(vue.correction).toBeUndefined();
        const tel = (await ecran(e, direct)).body;
        expect(tel).toMatchObject({ etape: "question", index: 0, repondu: false });
        expect(JSON.stringify(tel)).not.toMatch(/bonne/);
        expect((await agir(direct, "suivante")).status).toBe(409);
    });

    test("une réponse par question ; mauvais numéro refusé ; la dernière réponse ferme la question", async () => {
        expect((await repondre(e, direct, 1, true)).body.code).toBe("QUESTION_FERMEE");
        expect((await repondre(e, direct, 0, "")).status).toBe(400);
        expect((await repondre(e, direct, 0, "o2")).body).toEqual({ envoyee: true });
        expect((await repondre(e, direct, 0, "o1")).body.code).toBe("DEJA_REPONDU");
        expect((await ecran(e, direct)).body.repondu).toBe(true);
        expect((await repondre(c, direct, 0, "o1")).status).toBe(200);

        const vue = (await p.get(`/api/quiz-direct/${direct.id_session}`)).body;
        expect(vue.etape).toBe("correction");
        expect(vue.correction).toMatchObject({ bonne_reponse: "o2", justes: 1 });
        expect(vue.correction.repartition).toEqual([{ id: "o1", nombre: 1 }, { id: "o2", nombre: 1 }, { id: "o3", nombre: 0 }]);
    });

    test("correction sur le téléphone : juste et rapide, plus de la moitié des points ; faux, rien", async () => {
        const moi = (await ecran(e, direct)).body;
        expect(moi).toMatchObject({ etape: "correction", bonne_reponse: "o2", mon_rang: 1, joueurs: 2 });
        expect(moi.ma_reponse.statut).toBe("juste");
        expect(moi.ma_reponse.points).toBeGreaterThan(500);
        expect(moi.ma_reponse.points).toBeLessThanOrEqual(1000);
        const lui = (await ecran(c, direct)).body;
        expect(lui.ma_reponse).toMatchObject({ statut: "faux", points: 0 });
        expect(lui.mon_rang).toBe(2);
    });

    test("version inchangée : rien à recharger", async () => {
        const { version } = (await ecran(e, direct)).body;
        expect((await ecran(e, direct, version)).body).toMatchObject({ inchange: true, version });
    });

    test("classement et défi par groupes de TP", async () => {
        const vue = (await agir(direct, "classement")).body;
        expect(vue.etape).toBe("classement");
        expect(vue.classement.map((j) => [j.prenom, j.rang])).toEqual([["Mintsa", 1], ["Yasmine", 2]]);
        expect(vue.equipes.map((eq) => eq.nom)).toEqual(["TP1", "TP2"]);
    });

    test("temps écoulé : la réponse est refusée et la question se ferme d'elle-même", async () => {
        expect((await agir(direct, "suivante")).body).toMatchObject({ etape: "question", index: 1 });
        await SessionQuiz.update({ direct_debut_ms: Date.now() - 60000 }, { where: { id_session: direct.id_session } });
        expect((await repondre(e, direct, 1, true)).body.code).toBe("QUESTION_FERMEE");
        expect((await ecran(e, direct)).body).toMatchObject({ etape: "correction", ma_reponse: null });
    });

    test("après la dernière question : terminé, podium ; plus rien ne s'y joue", async () => {
        expect((await agir(direct, "suivante")).body.etape).toBe("termine");
        const fin = (await ecran(c, direct)).body;
        expect(fin.etape).toBe("termine");
        expect(fin.podium.map((j) => j.prenom)).toEqual(["Mintsa", "Yasmine"]);
        expect((await agir(direct, "suivante")).status).toBe(409);
        expect((await e.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).body.code).toBe("DIRECT_TERMINE");
    });

    test("l'écran de l'enseignant reste à son auteur", async () => {
        expect((await (await loginAs(collegue)).get(`/api/quiz-direct/${direct.id_session}`)).status).toBe(404);
        expect((await e.get(`/api/quiz-direct/${direct.id_session}`)).status).toBe(403);
    });
});

test("terminer pendant l'attente ; le limiteur global ne compte pas ces routes", async () => {
    const direct = await lancer();
    // Une lecture comptée par le limiteur global (pas /auth/csrf-token, qui changerait le jeton CSRF du client)
    const avant = await e.get("/api/passations/mes-tentatives");
    await e.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`);
    for (let i = 0; i < 3; i += 1) await ecran(e, direct);
    const apres = await e.get("/api/passations/mes-tentatives");
    expect(Number(apres.headers["x-ratelimit-remaining"])).toBe(Number(avant.headers["x-ratelimit-remaining"]) - 1);
    expect((await agir(direct, "terminer")).body.etape).toBe("termine");
});

test("média d'une question : l'enseignant le voit, un joueur seulement une fois la question projetée", async () => {
    const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 7)]);
    const image = (await p.agent.post("/api/studio-quiz/medias?nom=topologie.png&description=Topologie").set("X-CSRF-Token", p.csrf).set("Content-Type", "image/png").send(PNG)).body;
    const quiz = (await p.send("post", "/api/studio-quiz/questionnaires", { titre: "Topologie" })).body;
    await p.send("post", `/api/studio-quiz/questionnaires/${quiz.id_questionnaire}/questions`, QUESTIONS[0]);
    await p.send("post", `/api/studio-quiz/questionnaires/${quiz.id_questionnaire}/questions`, { ...QUESTIONS[1], id_media: image.id_media });
    const direct = (await p.send("post", "/api/quiz-direct", { id_questionnaire: quiz.id_questionnaire })).body;
    const url = `/api/quiz-direct/${direct.id_session}/medias/${image.id_media}`;
    expect((await e.send("post", `/api/quiz-direct/${direct.id_session}/rejoindre`)).status).toBe(200);

    expect((await p.agent.get(url)).status).toBe(200);
    await agir(direct, "suivante");
    expect((await e.get(url)).status).toBe(404);
    await agir(direct, "fermer");
    await agir(direct, "suivante");
    expect((await ecran(e, direct)).body.media).toMatchObject({ id_media: image.id_media, type: "image", description: "Topologie" });
    expect((await e.get(url)).status).toBe(200);
    expect((await c.get(url)).status).toBe(403);
});
