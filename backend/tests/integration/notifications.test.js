import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Notification } from "../../models/index.js";

/**
 * Liste des notifications d'un utilisateur : historique borné aux plus récentes (chaque
 * changement de séance en crée une), non lues toutes renvoyées (le badge les compte).
 */

let etudiant;
let session;

beforeAll(async () => {
    await resetDatabase();
    etudiant = await createUser("etudiant");
    // 230 notifications, une par minute ; les 40 plus anciennes ne sont pas lues
    const debut = Date.UTC(2026, 9, 1, 8, 0, 0);
    await Notification.bulkCreate(
        Array.from({ length: 230 }, (_, i) => ({
            id_user: etudiant.id_user,
            titre: `Notification ${i}`,
            message: "Séance déplacée",
            lue: i >= 40,
            date_envoi: new Date(debut + i * 60_000),
        }))
    );
});
beforeEach(async () => {
    resetRateLimiters();
    session ??= await loginAs(etudiant);
});
afterAll(closeDatabase);

describe("GET /api/notifications/user/:id", () => {
    test("200 plus récentes seulement, de la plus récente à la plus ancienne", async () => {
        const res = await session.get(`/api/notifications/user/${etudiant.id_user}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(200);
        expect(res.body[0].titre).toBe("Notification 229");
        expect(res.body.at(-1).titre).toBe("Notification 30");
    });

    test("les non lues sont toutes renvoyées, même hors des 200 plus récentes", async () => {
        const res = await session.get(`/api/notifications/user/${etudiant.id_user}/non-lues`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(40);
        expect(res.body.every((n) => n.lue === false)).toBe(true);
    });
});
