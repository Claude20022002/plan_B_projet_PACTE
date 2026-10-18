import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AnneeUniversitaire, Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, JeuModule, Periode } from "../../models/index.js";
import { defisLinux } from "../../../shared/terminal/jeu.js";

/** Commandes qui résolvent un défi (sa solution, une commande par ligne) */
const solution = (id) => defisLinux("en").find((d) => d.id === id).solution.split("\n");

/**
 * Sessions de jeu lancées en classe : l'enseignant lance un jeu pour son module (QR code et code),
 * les étudiants du module le rejoignent ; en mode individuel chacun joue de son côté, en mode
 * collectif les étudiants proposent et l'enseignant choisit la commande jouée au tableau.
 */

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let etranger;
let fixture;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Mintsa", nom: "Obame" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    await Appartenir.create({ id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe });

    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-22", nb_semaines: 15 });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TP", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignant.id_user, role: "principal", statut_service: "accepte" });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const lancer = async (mode) => (await loginAs(enseignant)).send("post", "/api/sessions-jeu", { code_jeu: "terminal-linux", id_cours: fixture.cours.id_cours, mode });

describe("Lancer une session", () => {
    test("exige une connexion ; réservé aux enseignants", async () => {
        expect((await anonymous().get("/api/sessions-jeu")).status).toBe(401);
        const corps = { code_jeu: "terminal-linux", id_cours: fixture.cours.id_cours, mode: "individuel" };
        expect((await (await loginAs(admin)).send("post", "/api/sessions-jeu", corps)).status).toBe(403);
        expect((await (await loginAs(etudiant)).send("post", "/api/sessions-jeu", corps)).status).toBe(403);
    });

    test("seulement dans ses modules, pour un jeu et un mode connus", async () => {
        const autre = await loginAs(autreEnseignant);
        expect((await autre.send("post", "/api/sessions-jeu", { code_jeu: "terminal-linux", id_cours: fixture.cours.id_cours, mode: "individuel" })).status).toBe(403);
        const prof = await loginAs(enseignant);
        expect((await prof.send("post", "/api/sessions-jeu", { code_jeu: "inconnu", id_cours: fixture.cours.id_cours, mode: "individuel" })).status).toBe(404);
        expect((await prof.send("post", "/api/sessions-jeu", { code_jeu: "terminal-linux", id_cours: 999999, mode: "individuel" })).status).toBe(404);
        expect((await prof.send("post", "/api/sessions-jeu", { code_jeu: "terminal-linux", id_cours: fixture.cours.id_cours, mode: "solo" })).status).toBe(400);
    });

    test("le lancement donne un code lisible et ouvre le jeu au module", async () => {
        const res = await lancer("individuel");
        expect(res.status).toBe(201);
        expect(res.body.code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
        expect(res.body).toMatchObject({ mode: "individuel", statut: "ouverte", module: { id_cours: fixture.cours.id_cours } });
        expect(await JeuModule.count({ where: { code_jeu: "terminal-linux", id_cours: fixture.cours.id_cours } })).toBe(1);
        const ouvertes = await (await loginAs(enseignant)).get("/api/sessions-jeu");
        expect(ouvertes.body.data.map((s) => s.id_session_jeu)).toContain(res.body.id_session_jeu);
        // Un autre enseignant ne voit pas la session
        expect((await (await loginAs(autreEnseignant)).get(`/api/sessions-jeu/${res.body.id_session_jeu}`)).status).toBe(404);
    });
});

describe("Mode individuel", () => {
    test("les étudiants du module rejoignent par le code ; les autres non", async () => {
        const { body: session } = await lancer("individuel");
        const eleve = await loginAs(etudiant);
        // Code tapé en minuscules, avec un espace : accepté
        const saisi = `${session.code.slice(0, 3).toLowerCase()} ${session.code.slice(3)}`;
        const rejoint = await eleve.send("post", "/api/sessions-jeu/rejoindre", { code: saisi });
        expect(rejoint.status).toBe(200);
        expect(rejoint.body).toMatchObject({ id_session_jeu: session.id_session_jeu, code_jeu: "terminal-linux", mode: "individuel" });
        expect((await eleve.send("post", "/api/sessions-jeu/rejoindre", { code: session.code })).status).toBe(200);
        expect((await eleve.send("post", "/api/sessions-jeu/rejoindre", { code: "ZZZZZZ" })).status).toBe(404);
        expect((await (await loginAs(etranger)).send("post", "/api/sessions-jeu/rejoindre", { code: session.code })).status).toBe(403);
        expect((await (await loginAs(enseignant)).send("post", "/api/sessions-jeu/rejoindre", { code: session.code })).status).toBe(403);
        // Proposer une réponse n'a pas de sens quand chacun joue de son côté
        expect((await eleve.send("post", `/api/sessions-jeu/${session.id_session_jeu}/propositions`, { texte: "ls" })).status).toBe(409);
    });

    test("l'enseignant voit qui a rejoint et les défis réussis depuis le lancement", async () => {
        const { body: session } = await lancer("individuel");
        const eleve = await loginAs(etudiant);
        await eleve.send("post", "/api/sessions-jeu/rejoindre", { code: session.code });
        const defi = defisLinux("en")[1];
        expect((await eleve.send("post", `/api/jeux/terminal-linux/defis/${defi.id}/reussite`, { indices: 0, commandes: solution(defi.id) })).status).toBe(201);
        const suivi = await (await loginAs(enseignant)).get(`/api/sessions-jeu/${session.id_session_jeu}`);
        expect(suivi.status).toBe(200);
        expect(suivi.body.participants).toEqual([expect.objectContaining({ id_user: etudiant.id_user, prenom: "Mintsa", defis: 1 })]);
        expect(suivi.body.participants[0].points).toBeGreaterThan(0);
    });
});

describe("Mode collectif", () => {
    test("les étudiants proposent, l'enseignant choisit la commande jouée au tableau", async () => {
        const { body: session } = await lancer("collectif");
        expect(session.id_defi).toBe(defisLinux("en")[0].id);
        const eleve = await loginAs(etudiant);
        await eleve.send("post", "/api/sessions-jeu/rejoindre", { code: session.code });
        const url = `/api/sessions-jeu/${session.id_session_jeu}`;

        // Une seule réponse en attente par étudiant : la seconde remplace la première
        expect((await eleve.send("post", `${url}/propositions`, { texte: "   " })).status).toBe(400);
        expect((await eleve.send("post", `${url}/propositions`, { texte: "x".repeat(301) })).status).toBe(400);
        expect((await eleve.send("post", `${url}/propositions`, { texte: "ls" })).status).toBe(201);
        const [premiere] = solution(session.id_defi);
        await eleve.send("post", `${url}/propositions`, { texte: premiere });
        const prof = await loginAs(enseignant);
        const suivi = await prof.get(url);
        expect(suivi.body.propositions).toEqual([expect.objectContaining({ texte: premiere, prenom: "Mintsa" })]);

        const joue = await prof.send("post", `${url}/commandes`, { id_proposition: suivi.body.propositions[0].id_proposition });
        expect(joue.status).toBe(200);
        expect(joue.body.commandes).toEqual([premiere]);
        // Déjà jouée : plus en attente
        expect((await prof.send("post", `${url}/commandes`, { id_proposition: suivi.body.propositions[0].id_proposition })).status).toBe(404);

        // L'enseignant tape le reste de la solution : le serveur rejoue et constate la réussite
        let dernier = joue;
        for (const ligne of solution(session.id_defi).slice(1)) dernier = await prof.send("post", `${url}/commandes`, { texte: ligne });
        expect(dernier.body.reussi).toBe(true);

        const tableau = await eleve.get(`${url}/tableau`);
        expect(tableau.status).toBe(200);
        expect(tableau.body).toMatchObject({ reussi: true, ma_proposition: { texte: premiere, statut: "choisie" } });
        // Le code reste à l'enseignant
        expect(tableau.body.code).toBeUndefined();
        // Un étudiant qui n'a pas rejoint ne voit rien
        expect((await (await loginAs(etranger)).get(`${url}/tableau`)).status).toBe(404);
        // L'étudiant ne joue pas au tableau
        expect((await eleve.send("post", `${url}/commandes`, { texte: "ls" })).status).toBe(403);
    });

    test("changer de défi remet le terminal à zéro ; une session terminée ne s'ouvre plus", async () => {
        const { body: session } = await lancer("collectif");
        const prof = await loginAs(enseignant);
        const url = `/api/sessions-jeu/${session.id_session_jeu}`;
        await prof.send("post", `${url}/commandes`, { texte: "pwd" });
        expect((await prof.send("put", `${url}/defi`, { id_defi: "inconnu" })).status).toBe(404);
        const suivant = defisLinux("en")[2].id;
        const change = await prof.send("put", `${url}/defi`, { id_defi: suivant });
        expect(change.body).toMatchObject({ id_defi: suivant, commandes: [], reussi: false });

        expect((await prof.send("post", `${url}/terminer`)).body.statut).toBe("fermee");
        expect((await prof.send("post", `${url}/commandes`, { texte: "ls" })).status).toBe(409);
        expect((await (await loginAs(etudiant)).send("post", "/api/sessions-jeu/rejoindre", { code: session.code })).status).toBe(409);
    });
});
