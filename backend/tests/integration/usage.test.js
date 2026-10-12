import crypto from "crypto";
import sequelize from "../../config/db.js";
import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { AppelSeance, AuthSession, JournalSecurite, QuizPartie } from "../../models/index.js";

/**
 * Compteurs d'usage mensuels (lot R-12). Mois observé : mars 2027. Un compte est actif s'il s'est
 * connecté dans le mois : une session ouverte ou utilisée ce mois-là, ou une connexion réussie au
 * journal de sécurité.
 */

const MOIS = "2027-03";
const dans = (jour) => new Date(`2027-03-${jour}T10:00:00Z`);
let admin;
let etudiants;
let enseignant;

/** Session d'un compte, ouverte le `createdAt` donné (date posée à la main : Sequelize la remplit seul). */
const session = async (user, { createdAt, lastUsed = null }) => {
    const s = await AuthSession.create({
        id_user: user.id_user,
        session_id: crypto.randomUUID(),
        family_id: crypto.randomUUID(),
        refresh_token_hash: crypto.randomBytes(32).toString("hex"),
        expires_at: new Date(createdAt.getTime() + 7 * 86400000),
        last_used_at: lastUsed,
    });
    await sequelize.query("UPDATE AuthSessions SET createdAt = ? WHERE id_auth_session = ?", { replacements: [createdAt, s.id_auth_session] });
};

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    etudiants = [await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant"), await createUser("etudiant")];
    const fixture = await createPlanningFixture({ admin, enseignant });

    await session(etudiants[0], { createdAt: dans("02") }); // connecté début mars
    await session(etudiants[1], { createdAt: new Date("2027-02-20T10:00:00Z"), lastUsed: dans("05") }); // resté connecté depuis février
    await session(etudiants[1], { createdAt: dans("06") }); // une seconde session : compté une fois
    await JournalSecurite.create({ evenement: "connexion_reussie", id_user: etudiants[2].id_user, createdAt: dans("10") }); // seulement au journal
    await session(etudiants[3], { createdAt: new Date("2027-04-01T00:00:00Z") }); // avril : pas en mars
    await session(enseignant, { createdAt: dans("31") });

    await AppelSeance.create({ id_affectation: fixture.affectation.id_affectation, secret: "s".repeat(64), ouvert_le: dans("04"), ferme_le: dans("04") });
    await QuizPartie.create({ game_id: crypto.randomUUID(), pin: "482913", titre: "Spark", id_user_enseignant: enseignant.id_user, demarree_le: dans("08"), terminee_le: dans("08"), nb_joueurs: 18 });
    await QuizPartie.create({ game_id: crypto.randomUUID(), pin: "482914", titre: "Hors mois", id_user_enseignant: enseignant.id_user, demarree_le: dans("08"), terminee_le: new Date("2027-04-02T10:00:00Z"), nb_joueurs: 30 });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Compteurs d'usage du mois (R-12)", () => {
    test("comptes actifs par rôle, appels validés, quiz joués, devoirs rendus", async () => {
        const res = await (await loginAs(admin)).get(`/api/statistiques/usage?mois=${MOIS}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            mois: MOIS,
            definition_actif: expect.stringContaining("au moins une fois dans le mois"),
            comptes_actifs: { total: 4, etudiant: 3, enseignant: 1, admin: 0 },
            appels_valides: 1,
            quiz: { parties: 1, joueurs: 18 },
            devoirs_rendus: 0,
        });
    });

    test("export CSV pour le relevé ; mois illisible refusé ; réservé à l'administration", async () => {
        const client = await loginAs(admin);
        const csv = await client.get(`/api/statistiques/usage.csv?mois=${MOIS}`);
        expect(csv.status).toBe(200);
        expect(csv.headers["content-type"]).toMatch(/text\/csv/);
        expect(csv.text).toContain("2027-03;comptes actifs;4");
        expect(csv.text).toContain("2027-03;comptes actifs : etudiant;3");
        expect((await client.get("/api/statistiques/usage?mois=mars")).status).toBe(400);
        expect((await (await loginAs(enseignant)).get(`/api/statistiques/usage?mois=${MOIS}`)).status).toBe(403);
    });
});
