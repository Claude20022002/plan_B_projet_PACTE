import crypto from "crypto";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, Notification, QuizPartie } from "../../models/index.js";

/**
 * Phase Q : le fork de ClassQuiz signale « partie démarrée » (webhook signé) ; Planner la
 * rattache à la séance en cours de l'enseignant, prévient ses étudiants et leur propose la
 * partie avec le code déjà rempli. Un étudiant d'un autre groupe ne la voit pas.
 */

const SECRET = crypto.randomBytes(24).toString("hex");
const QUIZ = "https://quiz.hestim.test";
const aujourdhui = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });

let admin;
let enseignant;
let etudiant;
let etrangere;
let fixture;

const signer = (corps, { ts = Math.floor(Date.now() / 1000), cle = SECRET } = {}) => ({
    "X-Hestim-Timestamp": String(ts),
    "X-Hestim-Signature": crypto.createHmac("sha256", cle).update(`${ts}.${corps}`).digest("hex"),
});
const evenement = (extra = {}) => JSON.stringify({
    event: "game.started",
    game_id: crypto.randomUUID(),
    game_pin: "482913",
    quiz_title: "Révision PySpark",
    game_mode: "kahoot",
    user_email: enseignant.email,
    ...extra,
});
const envoyer = (corps, entetes = signer(corps)) =>
    anonymous().post("/api/quiz/webhook").set("Content-Type", "application/json").set(entetes).send(corps);

beforeAll(async () => {
    Object.assign(process.env, { QUIZ_WEBHOOK_SECRET: SECRET, QUIZ_URL: QUIZ });
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Mintsa", nom: "Obame" });
    etrangere = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    await Appartenir.create({ id_user_etudiant: etrangere.id_user, id_groupe: fixture.autreGroupe.id_groupe });
    // Séance de l'enseignant aujourd'hui, sur un créneau qui couvre toute la journée
    await fixture.creneau.update({ heure_debut: "00:00:00", heure_fin: "23:59:00", duree_minutes: 1439 });
    await fixture.affectation.update({ date_seance: aujourdhui(), statut: "confirme" });
});
afterAll(async () => {
    delete process.env.QUIZ_WEBHOOK_SECRET;
    process.env.QUIZ_URL = "";
    await closeDatabase();
});
beforeEach(resetRateLimiters);

describe("Webhook « partie démarrée » de ClassQuiz", () => {
    test("rattache la partie à la séance en cours et prévient les étudiants du groupe seulement", async () => {
        const corps = evenement();
        const reponse = await envoyer(corps);
        expect(reponse.status).toBe(201);
        expect(reponse.body).toMatchObject({ seance: fixture.affectation.id_affectation, notifies: 1 });

        const notes = await Notification.findAll({ where: { titre: "Quiz en cours" } });
        expect(notes.map((n) => n.id_user)).toEqual([etudiant.id_user]);
        expect(notes[0]).toMatchObject({ lien: "/jeux" });
        expect(notes[0].message).toContain("Révision PySpark");

        // Le fork peut réessayer : pas de doublon ni de seconde notification
        expect((await envoyer(corps)).status).toBe(201);
        expect(await QuizPartie.count()).toBe(1);
        expect(await Notification.count({ where: { titre: "Quiz en cours" } })).toBe(1);
    });

    test("l'étudiant du groupe retrouve la partie avec le code et son nom pré-remplis ; pas l'autre groupe", async () => {
        const client = await loginAs(etudiant);
        const { body } = await client.get("/api/quiz/parties/en-cours");
        expect(body.data).toHaveLength(1);
        const [partie] = body.data;
        expect(partie).toMatchObject({ titre: "Révision PySpark", pin: "482913", module: { code: fixture.cours.code_cours } });
        const url = new URL(partie.url);
        expect(url.origin + url.pathname).toBe(`${QUIZ}/play`);
        expect(url.searchParams.get("pin")).toBe("482913");
        expect(url.searchParams.get("name")).toBe("Mintsa O.");

        const autre = await loginAs(etrangere);
        expect((await autre.get("/api/quiz/parties/en-cours")).body.data).toEqual([]);

        const prof = await loginAs(enseignant);
        const siennes = (await prof.get("/api/quiz/parties/en-cours")).body.data;
        expect(siennes).toHaveLength(1);
        expect(new URL(siennes[0].url).searchParams.get("name")).toBeNull();
        expect((await prof.get("/api/quiz/config")).body).toEqual({ actif: true, url: QUIZ, peutLancer: true });
        expect((await client.get("/api/quiz/config")).body.peutLancer).toBe(false);
    });

    test("signature absente, fausse, d'une autre clé ou trop ancienne : refusée", async () => {
        const corps = evenement();
        expect((await envoyer(corps, {})).status).toBe(401);
        expect((await envoyer(corps, { ...signer(corps), "X-Hestim-Signature": "0".repeat(64) })).status).toBe(401);
        expect((await envoyer(corps, signer(corps, { cle: crypto.randomBytes(24).toString("hex") }))).status).toBe(401);
        expect((await envoyer(corps, signer(corps, { ts: Math.floor(Date.now() / 1000) - 600 }))).status).toBe(401);
        // Corps modifié après signature
        expect((await envoyer(corps.replace("482913", "111111"), signer(corps))).status).toBe(401);
    });

    test("expéditeur inconnu de Planner ou étudiant : accepté sans suite ; événement invalide refusé", async () => {
        expect((await envoyer(evenement({ user_email: "inconnu@ailleurs.test" }))).status).toBe(202);
        expect((await envoyer(evenement({ user_email: etudiant.email }))).status).toBe(202);
        expect((await envoyer(evenement({ event: "game.ended" }))).status).toBe(400);
        expect((await envoyer(evenement({ game_pin: "12ab" }))).status).toBe(400);
        expect(await QuizPartie.count({ where: { id_user_enseignant: etudiant.id_user } })).toBe(0);
    });

    test("sans séance en cours : partie enregistrée pour l'enseignant, personne n'est prévenu", async () => {
        const autreProf = await createUser("enseignant");
        const reponse = await envoyer(evenement({ user_email: autreProf.email }));
        expect(reponse.status).toBe(201);
        expect(reponse.body).toMatchObject({ seance: null, notifies: 0 });
    });

    test("désactivé sans secret configuré", async () => {
        const secret = process.env.QUIZ_WEBHOOK_SECRET;
        process.env.QUIZ_WEBHOOK_SECRET = "";
        try {
            expect((await envoyer(evenement())).status).toBe(503);
        } finally {
            process.env.QUIZ_WEBHOOK_SECRET = secret;
        }
    });
});
