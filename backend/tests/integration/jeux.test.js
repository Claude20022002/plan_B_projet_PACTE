import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AnneeUniversitaire, Appartenir, Cours, CoursComposante, Enseignement, EnseignementEnseignant, Groupe, JeuProgression, Periode } from "../../models/index.js";
import { defisLinux } from "../../../shared/terminal/jeu.js";
import { AVATARS } from "../../../shared/jeux/avatars.js";

/** Commandes qui résolvent un défi (sa solution, une commande par ligne) */
const solution = (id) => defisLinux("en").find((d) => d.id === id).solution.split("\n");

/**
 * Jeux intégrés (terminal Linux) : un enseignant propose le jeu dans son module, les étudiants
 * du module le voient (y compris inscrits dans un sous-groupe), leurs réussites sont comptées
 * par le serveur (points selon les indices, première réussite seulement) et l'enseignant suit
 * la progression de son module. Personne ne peut agir sur un module qui n'est pas le sien.
 */

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let etudiantTp;
let etranger;
let fixture;
let autreModule;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant", { prenom: "Mintsa", nom: "Obame" });
    etudiantTp = await createUser("etudiant", { prenom: "Yanis", nom: "Alaoui" });
    etranger = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });

    // Le module de l'enseignant est suivi par la promotion (fixture.groupe) ; un TP de cette
    // promotion et un autre groupe sans ce module
    const tp = await Groupe.create({ nom_groupe: "IIA-3A-TP1", niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere, id_groupe_parent: fixture.groupe.id_groupe, type_groupe: "tp" });
    await Appartenir.bulkCreate([
        { id_user_etudiant: etudiantTp.id_user, id_groupe: tp.id_groupe },
        { id_user_etudiant: etranger.id_user, id_groupe: fixture.autreGroupe.id_groupe },
    ]);
    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-22", nb_semaines: 15 });
    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TP", volume_heures: 21, niveau_groupe: "promotion" });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 21 });
    await enseignement.setGroupes([fixture.groupe.id_groupe]);
    await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: enseignant.id_user, role: "principal", statut_service: "accepte" });

    autreModule = await Cours.create({ code_cours: "RES-1", nom_cours: "Réseaux", niveau: "3A", volume_horaire: 20, type_cours: "CM", semestre: "S1", id_filiere: fixture.filiere.id_filiere });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Catalogue des jeux", () => {
    test("exige une connexion", async () => {
        expect((await anonymous().get("/api/jeux")).status).toBe(401);
    });

    test("l'administration ne gère pas les jeux", async () => {
        const direction = await loginAs(admin);
        expect((await direction.get("/api/jeux")).status).toBe(403);
        expect((await direction.get("/api/jeux/historique")).status).toBe(403);
        expect((await direction.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours })).status).toBe(403);
        expect((await direction.get("/api/quiz/config")).body.peutLancer).toBe(false);
        expect((await direction.get("/api/quiz/parties/historique")).body.data).toEqual([]);
    });

    test("l'enseignant voit ses modules, même sans jeu proposé ; pas ceux des autres", async () => {
        const res = await (await loginAs(enseignant)).get("/api/jeux");
        expect(res.body.modules).toEqual([{ id_cours: fixture.cours.id_cours, code: fixture.cours.code_cours, nom: "Algorithmique", jeux: [], details: [] }]);
        expect((await (await loginAs(autreEnseignant)).get("/api/jeux")).body.modules).toEqual([]);
    });

    test("l'enseignant voit tout le catalogue (pour choisir) ; l'étudiant, rien tant qu'aucun jeu n'est proposé", async () => {
        const res = await (await loginAs(enseignant)).get("/api/jeux");
        expect(res.status).toBe(200);
        const terminal = res.body.jeux.find((j) => j.code === "terminal-linux");
        expect(terminal).toMatchObject({ type: "terminal", source: { licence: "MIT" }, progression: { reussis: 0, total: 66, points: 0 } });
        const eleve = await (await loginAs(etudiant)).get("/api/jeux");
        expect(eleve.body).toMatchObject({ jeux: [], modules: [] });
        // Ni progression ni défi pour un jeu qui n'est pas proposé dans ses modules
        expect((await (await loginAs(etudiant)).get("/api/jeux/terminal-linux/progression")).status).toBe(403);
    });
});

describe("Proposer un jeu dans un module", () => {
    test("un étudiant ne peut pas proposer de jeu", async () => {
        const client = await loginAs(etudiant);
        const res = await client.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours });
        expect(res.status).toBe(403);
    });

    test("un enseignant ne peut pas proposer de jeu dans un module qu'il n'enseigne pas", async () => {
        const client = await loginAs(autreEnseignant);
        const res = await client.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours });
        expect(res.status).toBe(403);
        const res2 = await (await loginAs(enseignant)).send("post", "/api/jeux/terminal-linux/modules", { id_cours: autreModule.id_cours });
        expect(res2.status).toBe(403);
    });

    test("jeu ou module inconnu : 404", async () => {
        const client = await loginAs(enseignant);
        expect((await client.send("post", "/api/jeux/inconnu/modules", { id_cours: fixture.cours.id_cours })).status).toBe(404);
        expect((await client.send("post", "/api/jeux/terminal-linux/modules", { id_cours: 999999 })).status).toBe(404);
        expect((await client.send("post", "/api/jeux/terminal-linux/modules", { id_cours: "1 OR 1=1" })).status).toBe(404);
    });

    test("l'enseignant du module le propose ; ses étudiants le voient, sous-groupes compris", async () => {
        const prof = await loginAs(enseignant);
        const res = await prof.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours });
        expect(res.status).toBe(201);
        // But par défaut : s'entraîner
        expect(res.body).toMatchObject({ but: "entrainer", notion: null });
        // Idempotent ; la seconde fois précise le but et la notion
        const precise = await prof.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours, but: "verifier", notion: "  les droits des fichiers  " });
        expect(precise.status).toBe(200);
        expect(precise.body).toMatchObject({ but: "verifier", notion: "les droits des fichiers" });
        expect((await prof.send("post", "/api/jeux/terminal-linux/modules", { id_cours: fixture.cours.id_cours, but: "jouer" })).status).toBe(400);

        for (const user of [etudiant, etudiantTp]) {
            const vue = await (await loginAs(user)).get("/api/jeux");
            expect(vue.body.modules).toEqual([{ id_cours: fixture.cours.id_cours, code: fixture.cours.code_cours, nom: "Algorithmique", jeux: ["terminal-linux"], details: [{ code: "terminal-linux", but: "verifier", notion: "les droits des fichiers" }] }]);
            expect(vue.body.jeux.map((j) => j.code)).toEqual(["terminal-linux"]);
        }
        // Espace Activités : le jeu apparaît dans le module, avec son but et sa notion
        const activites = await (await loginAs(etudiant)).get("/api/activites");
        expect(activites.status).toBe(200);
        expect(activites.body.modules).toHaveLength(1);
        expect(activites.body.modules[0]).toMatchObject({ code: fixture.cours.code_cours, quiz: [], jeux: [{ code: "terminal-linux", but: "verifier", notion: "les droits des fichiers" }] });
        expect((await (await loginAs(admin)).get("/api/activites")).body.modules).toEqual([]);
        const autre = await (await loginAs(etranger)).get("/api/jeux");
        expect(autre.body.modules).toEqual([]);
        // L'enseignant voit aussi le jeu dans son module
        expect((await prof.get("/api/jeux")).body.modules[0].jeux).toEqual(["terminal-linux"]);
        expect((await prof.get("/api/jeux/terminal-linux/modules")).body.data).toEqual([{ id_cours: fixture.cours.id_cours, code: fixture.cours.code_cours, nom: "Algorithmique" }]);
    });
});

describe("Progression", () => {
    test("les points sont calculés par le serveur selon les indices ; la première réussite compte", async () => {
        const client = await loginAs(etudiant);
        const premier = await client.send("post", "/api/jeux/terminal-linux/defis/orientation-01/reussite", { indices: 2, points: 9999, commandes: solution("orientation-01") });
        expect(premier.status).toBe(201);
        expect(premier.body).toMatchObject({ cree: true, points: 60, progression: { reussis: 1, points: 60 } });

        const rejoue = await client.send("post", "/api/jeux/terminal-linux/defis/orientation-01/reussite", { indices: 0, commandes: ["pwd"] });
        expect(rejoue.status).toBe(200);
        expect(rejoue.body).toMatchObject({ cree: false, points: 60, progression: { reussis: 1, points: 60 } });

        expect((await client.send("post", "/api/jeux/terminal-linux/defis/combine-01/reussite", { indices: 0, commandes: solution("combine-01") })).status).toBe(201);
        const progression = await client.get("/api/jeux/terminal-linux/progression");
        expect(progression.body).toMatchObject({ reussis: 2, total: 66, points: 210 });
        expect(progression.body.defis.map((d) => d.id)).toEqual(["orientation-01", "combine-01"]);
    });

    test("défi inconnu ou nombre d'indices invalide : refusé", async () => {
        const client = await loginAs(etudiant);
        expect((await client.send("post", "/api/jeux/terminal-linux/defis/inexistant/reussite", {})).status).toBe(404);
        const commandes = solution("navigation-01");
        expect((await client.send("post", "/api/jeux/terminal-linux/defis/navigation-01/reussite", { indices: 7, commandes })).status).toBe(400);
        expect((await client.send("post", "/api/jeux/terminal-linux/defis/navigation-01/reussite", { indices: "2; DROP", commandes })).status).toBe(400);
        expect(await JeuProgression.count({ where: { id_user: etudiant.id_user, id_defi: "navigation-01" } })).toBe(0);
    });

    test("le serveur rejoue la partie : sans objectif atteint, rien n'est enregistré", async () => {
        const client = await loginAs(etudiantTp);
        const url = "/api/jeux/terminal-linux/defis/combine-01/reussite";
        // Aucune commande, commandes qui n'atteignent pas l'objectif, format invalide
        expect((await client.send("post", url, { indices: 0 })).status).toBe(400);
        expect((await client.send("post", url, { indices: 0, commandes: ["ls", "pwd"] })).status).toBe(422);
        expect((await client.send("post", url, { indices: 0, commandes: "cd ~/projects" })).status).toBe(400);
        expect((await client.send("post", url, { indices: 0, commandes: [42] })).status).toBe(400);
        expect((await client.send("post", url, { indices: 0, commandes: Array(301).fill("pwd") })).status).toBe(400);
        // La moitié de la solution ne suffit pas
        expect((await client.send("post", url, { indices: 0, commandes: solution("combine-01").slice(0, 2) })).status).toBe(422);
        expect(await JeuProgression.count({ where: { id_user: etudiantTp.id_user } })).toBe(0);
    });

    test("la progression de chacun lui est propre", async () => {
        const res = await (await loginAs(etudiantTp)).get("/api/jeux/terminal-linux/progression");
        expect(res.body).toMatchObject({ reussis: 0, points: 0, defis: [] });
    });

    test("sans jeton CSRF, une réussite n'est pas enregistrée", async () => {
        const client = await loginAs(etudiantTp);
        const res = await client.agent.post("/api/jeux/terminal-linux/defis/navigation-02/reussite").send({ indices: 0, commandes: solution("navigation-02") });
        expect(res.status).toBe(403);
    });
});

describe("Personnage du joueur", () => {
    test("tiré du numéro du joueur, puis celui qu'il choisit ; liste fermée", async () => {
        const client = await loginAs(etudiantTp);
        expect(AVATARS).toContain((await client.get("/api/jeux")).body.profil.avatar);

        expect((await client.send("put", "/api/jeux/profil", { avatar: "pirate" })).status).toBe(400);
        expect((await client.send("put", "/api/jeux/profil", {})).status).toBe(400);
        expect((await client.send("put", "/api/jeux/profil", { avatar: "female-c" })).body).toEqual({ avatar: "female-c" });
        expect((await client.send("put", "/api/jeux/profil", { avatar: "male-d" })).status).toBe(200);
        expect((await client.get("/api/jeux")).body.profil).toEqual({ avatar: "male-d" });
    });
});

describe("Suivi du module par l'enseignant", () => {
    test("classe les étudiants du module par points, sans données personnelles", async () => {
        const res = await (await loginAs(enseignant)).get(`/api/jeux/terminal-linux/modules/${fixture.cours.id_cours}/suivi`);
        expect(res.status).toBe(200);
        expect(res.body.etudiants.map((e) => [e.prenom, e.points, e.reussis])).toEqual([["Mintsa", 210, 2], ["Yanis", 0, 0]]);
        // Le personnage choisi par Yanis, celui tiré du numéro pour Mintsa
        expect(res.body.etudiants[1].avatar).toBe("male-d");
        expect(AVATARS).toContain(res.body.etudiants[0].avatar);
        expect(JSON.stringify(res.body)).not.toMatch(/email|password/);
    });

    test("réservé aux enseignants du module", async () => {
        const url = `/api/jeux/terminal-linux/modules/${fixture.cours.id_cours}/suivi`;
        expect((await (await loginAs(etudiant)).get(url)).status).toBe(403);
        expect((await (await loginAs(autreEnseignant)).get(url)).status).toBe(403);
        expect((await (await loginAs(admin)).get(url)).status).toBe(403);
    });

    test("historique de l'enseignant : défis réussis par ses étudiants, jour par jour, sans noms", async () => {
        const res = await (await loginAs(enseignant)).get("/api/jeux/historique");
        expect(res.status).toBe(200);
        const defis = res.body.data.filter((e) => e.type === "defis");
        expect(defis).toHaveLength(1);
        expect(defis[0]).toEqual(expect.objectContaining({ module: expect.objectContaining({ code: fixture.cours.code_cours }), nb_defis: 2, nb_etudiants: 1 }));
        expect(JSON.stringify(res.body)).not.toMatch(/Mintsa|Obame|email/);
        // Un autre enseignant ne voit rien de ce module ; l'historique est réservé aux enseignants
        expect((await (await loginAs(autreEnseignant)).get("/api/jeux/historique")).body.data).toEqual([]);
        expect((await (await loginAs(etudiant)).get("/api/jeux/historique")).status).toBe(403);
    });

    test("retirer le jeu du module le fait disparaître pour les étudiants", async () => {
        const prof = await loginAs(enseignant);
        expect((await (await loginAs(autreEnseignant)).send("delete", `/api/jeux/terminal-linux/modules/${fixture.cours.id_cours}`)).status).toBe(403);
        const res = await prof.send("delete", `/api/jeux/terminal-linux/modules/${fixture.cours.id_cours}`);
        expect(res.body).toEqual({ retires: 1 });
        expect((await (await loginAs(etudiant)).get("/api/jeux")).body.modules).toEqual([]);
    });
});
