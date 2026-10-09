import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, AnneeUniversitaire } from "../../models/index.js";

/**
 * Statistiques : par défaut sur l'année universitaire en cours (les calculs ne lisent pas tout
 * l'historique), ou sur une autre année, toutes les années ou une période libre au choix.
 */

let admin;
let enseignant;
let ancienne;
let direction;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    const fixture = await createPlanningFixture({ admin, enseignant });
    // Année en cours (contient la séance de la fixture, en janvier 2027) et année précédente
    await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-31", active: true });
    ancienne = await AnneeUniversitaire.create({ libelle: "2025-2026", date_debut: "2025-09-01", date_fin: "2026-07-31", active: false });
    const { id_affectation, createdAt, updatedAt, ...seance } = fixture.affectation.toJSON();
    await Affectation.create({ ...seance, date_seance: "2026-03-02" });
    await Affectation.create({ ...seance, date_seance: "2026-03-09", statut: "annule" });
    direction = await loginAs(admin);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const seances = async (query = "") => {
    const res = await direction.get(`/api/statistiques/dashboard${query}`);
    expect(res.status).toBe(200);
    return { total: res.body.resume.total_affectations, periode: res.body.periode };
};

describe("Périmètre des statistiques", () => {
    test("par défaut : l'année universitaire en cours", async () => {
        expect(await seances()).toEqual({ total: 1, periode: { date_debut: "2026-09-01", date_fin: "2027-07-31", annee: "2026-2027" } });
    });

    test("une autre année, toutes les années, ou une période libre", async () => {
        expect(await seances(`?id_annee=${ancienne.id_annee}`)).toEqual({ total: 1, periode: { date_debut: "2025-09-01", date_fin: "2026-07-31", annee: "2025-2026" } });
        // Toutes les années : les séances annulées restent exclues
        expect(await seances("?portee=tout")).toEqual({ total: 2, periode: null });
        expect((await seances("?date_debut=2026-03-01&date_fin=2026-03-31")).total).toBe(1);
        // Dates invalides : retour à l'année en cours
        expect((await seances("?date_debut=mars&date_fin=avril")).periode.annee).toBe("2026-2027");
    });

    test("le même périmètre s'applique aux indicateurs ; année inconnue : 404 ; réservé à l'administration", async () => {
        const kpis = await direction.get(`/api/statistiques/kpis?id_annee=${ancienne.id_annee}`);
        expect(kpis.status).toBe(200);
        expect(kpis.body.periode).toMatchObject({ annee: "2025-2026" });
        expect((await direction.get("/api/statistiques/dashboard?id_annee=999999")).status).toBe(404);
        expect((await (await loginAs(enseignant)).get("/api/statistiques/dashboard")).status).toBe(403);
    });
});
