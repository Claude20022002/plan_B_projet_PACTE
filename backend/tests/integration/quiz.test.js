import crypto from "crypto";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Appartenir, Groupe, Notification, QuizPartie, QuizResultat } from "../../models/index.js";

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

describe("Fin de partie : scores, équipes et nuages de mots", () => {
    let gameId;
    let yanis;
    let sara;
    const jeton = (url) => new URL(url).searchParams.get("hid");
    const fin = (extra = {}) => JSON.stringify({ event: "game.finished", game_id: gameId, game_pin: "731406", quiz_title: "Spark", user_email: enseignant.email, nb_questions: 3, joueurs: [], questions: [], ...extra });
    const lienDe = async (user) => (await (await loginAs(user)).get("/api/quiz/parties/en-cours")).body.data.find((p) => p.pin === "731406").url;

    beforeAll(async () => {
        // Deux TP dans la promotion de la séance : ils s'affrontent
        const tp = (nom) => Groupe.create({ nom_groupe: nom, niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
        const tp1 = await tp("TP1");
        const tp2 = await tp("TP2");
        yanis = await createUser("etudiant", { prenom: "Yanis", nom: "Alaoui" });
        sara = await createUser("etudiant", { prenom: "Sara", nom: "Bennani" });
        await Appartenir.bulkCreate([
            { id_user_etudiant: etudiant.id_user, id_groupe: tp1.id_groupe },
            { id_user_etudiant: yanis.id_user, id_groupe: tp2.id_groupe },
            { id_user_etudiant: sara.id_user, id_groupe: tp2.id_groupe },
        ]);
        gameId = crypto.randomUUID();
        expect((await envoyer(evenement({ game_id: gameId, game_pin: "731406", quiz_title: "Spark" }))).status).toBe(201);
    });

    test("le lien de chaque étudiant porte un jeton signé pour cette partie et pour lui", async () => {
        const [a, b] = [jeton(await lienDe(etudiant)), jeton(await lienDe(yanis))];
        expect(a).toMatch(new RegExp(`^${etudiant.id_user}\\.[A-Za-z0-9_-]{32}$`));
        expect(b).not.toBe(a);
        // L'enseignant n'a pas de jeton
        const prof = (await (await loginAs(enseignant)).get("/api/quiz/parties/en-cours")).body.data.find((p) => p.pin === "731406");
        expect(new URL(prof.url).searchParams.get("hid")).toBeNull();
    });

    test("scores rattachés aux étudiants reconnus ; jeton forgé ou réutilisé : score anonyme", async () => {
        const [hMintsa, hYanis, hSara] = [jeton(await lienDe(etudiant)), jeton(await lienDe(yanis)), jeton(await lienDe(sara))];
        const corps = fin({
            joueurs: [
                { pseudo: "Mintsa O.", score: 2400, bonnes: 3, hid: hMintsa, sorties: 3, sorties_duree_ms: 42000, captures: 2 },
                // Valeurs hors plafond (50 sorties) ramenées au plafond
                { pseudo: "Yanis A.", score: 1800, bonnes: 2, hid: hYanis, sorties: 999, sorties_duree_ms: -5 },
                { pseudo: "Sara B.", score: 1800, bonnes: 2, hid: hSara },
                { pseudo: "Invité", score: 900, bonnes: 1 },
                { pseudo: "Pirate", score: 3000, bonnes: 3, hid: `${etrangere.id_user}.${"A".repeat(32)}` },
                { pseudo: "Mintsa bis", score: 100, bonnes: 0, hid: hMintsa },
            ],
            questions: [
                { index: 0, type: "ABCD", question: "Spark est…", reponses: 6 },
                { index: 2, type: "TEXT", question: "Un mot pour Spark ?", reponses: 6, reponses_libres: ["Rapide", "rapide ", "RAPIDE", "Distribué", "distribue", ""] },
            ],
        });
        const reponse = await envoyer(corps);
        expect(reponse.status).toBe(201);
        expect(reponse.body.resultats).toBe(6);
        const resultats = await QuizResultat.findAll({ order: [["rang", "ASC"], ["pseudo", "ASC"]] });
        expect(resultats.map((r) => [r.pseudo, r.rang, r.id_user])).toEqual([
            ["Pirate", 1, null],
            ["Mintsa O.", 2, etudiant.id_user],
            ["Sara B.", 3, sara.id_user],
            ["Yanis A.", 3, yanis.id_user],
            ["Invité", 5, null],
            ["Mintsa bis", 6, null],
        ]);
        // Chaque étudiant reconnu est prévenu de son score
        const notes = await Notification.findAll({ where: { titre: "Résultats du quiz" } });
        expect(notes.map((n) => n.id_user).sort()).toEqual([etudiant.id_user, yanis.id_user, sara.id_user].sort());
        expect(notes.find((n) => n.id_user === etudiant.id_user).message).toBe("Spark : 2400 pts, 2e sur 6.");

        // Le fork renvoie aussi à l'enregistrement des résultats : pas de doublon
        expect((await envoyer(corps)).status).toBe(200);
        expect(await QuizResultat.count()).toBe(6);
        expect(await Notification.count({ where: { titre: "Résultats du quiz" } })).toBe(3);
    });

    test("l'enseignant voit le classement complet, les équipes par groupe de TP et le nuage de mots", async () => {
        const partie = await QuizPartie.findOne({ where: { game_id: gameId } });
        const { status, body } = await (await loginAs(enseignant)).get(`/api/quiz/parties/${partie.id_quiz_partie}/resultats`);
        expect(status).toBe(200);
        expect(body.partie).toMatchObject({ titre: "Spark", nb_joueurs: 6, nb_questions: 3, module: { code: fixture.cours.code_cours } });
        expect(body.classement).toHaveLength(6);
        expect(body.classement[1]).toMatchObject({ pseudo: "Mintsa O.", etudiant: { prenom: "Mintsa", nom: "Obame" } });
        // Journal des sorties, pour l'enseignant de la partie
        const sorties = Object.fromEntries(body.classement.map((c) => [c.pseudo, [c.sorties, c.sorties_duree_ms, c.captures]]));
        expect(sorties).toMatchObject({ "Mintsa O.": [3, 42000, 2], "Yanis A.": [50, 0, 0], Invité: [0, 0, 0] });
        expect(body.equipes.map((e) => [e.nom, e.joueurs, e.moyenne, e.rang])).toEqual([["TP1", 1, 2400, 1], ["TP2", 2, 1800, 2]]);
        expect(body.nuages).toEqual([{ index: 2, question: "Un mot pour Spark ?", mots: [{ texte: "Rapide", nombre: 3 }, { texte: "Distribué", nombre: 2 }] }]);
    });

    test("l'étudiant voit son score, le podium et les équipes ; pas les noms, ni une partie d'un autre groupe", async () => {
        const partie = await QuizPartie.findOne({ where: { game_id: gameId } });
        const url = `/api/quiz/parties/${partie.id_quiz_partie}/resultats`;
        const { body } = await (await loginAs(yanis)).get(url);
        expect(body.moi).toEqual({ pseudo: "Yanis A.", score: 1800, bonnes: 2, rang: 3 });
        expect(body.classement.map((c) => c.pseudo)).toEqual(["Pirate", "Mintsa O.", "Sara B.", "Yanis A."]);
        expect(JSON.stringify(body.classement)).not.toMatch(/etudiant|Obame|sorties|captures/);
        expect(body.equipes).toHaveLength(2);

        expect((await (await loginAs(etrangere)).get(url)).status).toBe(404);
        expect((await (await loginAs(await createUser("enseignant"))).get(url)).status).toBe(404);
        // L'administration ne suit pas les jeux
        expect((await (await loginAs(admin)).get(url)).status).toBe(404);
        expect((await (await loginAs(enseignant)).get("/api/quiz/parties/abc/resultats")).status).toBe(404);
    });

    test("historique : les parties de l'enseignant, les scores de l'étudiant", async () => {
        const prof = (await (await loginAs(enseignant)).get("/api/quiz/parties/historique")).body.data;
        expect(prof).toEqual([expect.objectContaining({ titre: "Spark", nb_joueurs: 6, moyenne: Math.round((3000 + 2400 + 1800 + 1800 + 900 + 100) / 6) })]);
        const moi = (await (await loginAs(etudiant)).get("/api/quiz/parties/historique")).body.data;
        expect(moi).toEqual([expect.objectContaining({ titre: "Spark", score: 2400, rang: 2, nb_joueurs: 6, module: { code: fixture.cours.code_cours, nom: "Algorithmique" } })]);
        expect((await (await loginAs(etrangere)).get("/api/quiz/parties/historique")).body.data).toEqual([]);
    });

    test("fin d'une partie inconnue de Planner : acceptée sans suite ; signature exigée", async () => {
        expect((await envoyer(fin({ game_id: crypto.randomUUID() }))).status).toBe(202);
        expect((await envoyer(fin(), {})).status).toBe(401);
    });
});
