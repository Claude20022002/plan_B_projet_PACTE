import request from "supertest";
import app from "../../app.js";
import { closeDatabase } from "./helpers/testApp.js";

/**
 * Route de santé (lot ME-0b) : la commande de mise en ligne (deploy/vps/deployer.sh) y lit le commit
 * de l'image en marche et refuse de conclure s'il n'est pas celui qu'elle a déployé.
 */

const AVANT = process.env.PLANNER_VERSION;
afterAll(async () => {
    if (AVANT === undefined) delete process.env.PLANNER_VERSION;
    else process.env.PLANNER_VERSION = AVANT;
    await closeDatabase();
});

test("annonce le commit de l'image, posé à la construction", async () => {
    process.env.PLANNER_VERSION = "0123456789abcdef0123456789abcdef01234567";
    const { status, body } = await request(app).get("/health");
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "healthy", version: "0123456789abcdef0123456789abcdef01234567" });
});

test("sans version posée (construction locale), la version est nulle et la route répond", async () => {
    delete process.env.PLANNER_VERSION;
    const { status, body } = await request(app).get("/health");
    expect(status).toBe(200);
    expect(body.version).toBeNull();
});
