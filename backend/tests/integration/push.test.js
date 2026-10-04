import { resetDatabase, closeDatabase, createUser, loginAs, anonymous, PASSWORD } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import sequelize from "../../config/db.js";
import { Notification, PushToken, Users } from "../../models/index.js";
import { attendreFilePush, definirClientPush } from "../../services/push.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";

/**
 * Phase D3 : notifications push de l'application mobile. Le service Expo est remplacé par un
 * faux client qui enregistre ce qu'il reçoit.
 */

const MORT = "ExponentPushToken[appareil-desinstalle]";
let appels;
let etudiant;
let autre;
let admin;

const jeton = (nom) => `ExponentPushToken[${nom}]`;
const envoyes = () => appels.flat();

beforeAll(async () => {
    await resetDatabase();
    etudiant = await createUser("etudiant");
    autre = await createUser("etudiant");
    admin = await createUser("admin");
});
beforeEach(() => {
    resetRateLimiters();
    appels = [];
    definirClientPush({
        chunkPushNotifications: (messages) => [messages],
        sendPushNotificationsAsync: async (lot) => {
            appels.push(lot);
            return lot.map((m) => (m.to === MORT ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok", id: "ticket" }));
        },
    });
});
afterAll(async () => {
    definirClientPush(null);
    await closeDatabase();
});

describe("Inscription des appareils", () => {
    test("l'application s'inscrit en Bearer (sans CSRF) ; jeton et plateforme validés", async () => {
        const { access_token } = (await anonymous().post("/api/auth/login").set("X-Client", "mobile").send({ email: etudiant.email, password: PASSWORD })).body;
        const envoyer = (corps) => anonymous().post("/api/push-tokens").set("Authorization", `Bearer ${access_token}`).send(corps);

        expect((await envoyer({ token: jeton("tel-etudiant"), plateforme: "android" })).status).toBe(201);
        expect((await envoyer({ token: "n-importe-quoi" })).status).toBe(400);
        expect((await envoyer({ token: jeton("x"), plateforme: "windows" })).status).toBe(400);
        expect((await envoyer({ token: { $ne: null } })).status).toBe(400);
        // Sans aucun identifiant : arrêté par le CSRF ; avec un Bearer invalide : 401
        expect((await anonymous().post("/api/push-tokens").send({ token: jeton("anonyme") })).status).toBe(403);
        expect((await anonymous().post("/api/push-tokens").set("Authorization", "Bearer faux").send({ token: jeton("anonyme") })).status).toBe(401);
        expect(await PushToken.count({ where: { id_user: etudiant.id_user } })).toBe(1);
    });

    test("un téléphone qui change de compte suit le nouveau compte ; on ne supprime que ses propres jetons", async () => {
        const client = await loginAs(autre);
        expect((await client.send("post", "/api/push-tokens", { token: jeton("tel-etudiant") })).status).toBe(201);
        expect((await PushToken.findOne({ where: { token: jeton("tel-etudiant") } })).id_user).toBe(autre.id_user);

        const premier = await loginAs(etudiant);
        await premier.send("delete", `/api/push-tokens/${encodeURIComponent(jeton("tel-etudiant"))}`);
        expect(await PushToken.count({ where: { token: jeton("tel-etudiant") } })).toBe(1);
        expect((await client.send("delete", `/api/push-tokens/${encodeURIComponent(jeton("tel-etudiant"))}`)).status).toBe(204);
        expect(await PushToken.count({ where: { token: jeton("tel-etudiant") } })).toBe(0);
    });
});

describe("Envoi", () => {
    beforeAll(async () => {
        await PushToken.destroy({ where: {} });
        await PushToken.bulkCreate([
            { id_user: etudiant.id_user, token: jeton("etudiant-1") },
            { id_user: etudiant.id_user, token: MORT },
            { id_user: autre.id_user, token: jeton("autre-1") },
            { id_user: admin.id_user, token: jeton("admin-1") },
        ]);
    });

    test("chaque notification part sur les appareils du destinataire, groupée en un appel ; jeton mort supprimé", async () => {
        await creerNotificationsMultiples({ id_users: [etudiant.id_user, autre.id_user], titre: "Séance reportée", message: "Machine Learning passe au mardi", lien: "/emploi-du-temps/etudiant" });
        await attendreFilePush();

        expect(appels).toHaveLength(1);
        expect(envoyes().map((m) => m.to).sort()).toEqual([MORT, jeton("autre-1"), jeton("etudiant-1")].sort());
        expect(envoyes()[0]).toMatchObject({ title: "Séance reportée", body: "Machine Learning passe au mardi", data: { lien: "/emploi-du-temps/etudiant" } });
        expect(await PushToken.count({ where: { token: MORT } })).toBe(0);
    });

    test("rien ne part pour une notification d'une transaction annulée", async () => {
        await sequelize
            .transaction(async (transaction) => {
                await Notification.create({ id_user: autre.id_user, titre: "Annulée", message: "x", type_notification: "info", lue: false }, { transaction });
                throw new Error("annulation");
            })
            .catch(() => {});
        await attendreFilePush();
        expect(envoyes()).toHaveLength(0);

        await sequelize.transaction((transaction) => Notification.create({ id_user: autre.id_user, titre: "Validée", message: "y", type_notification: "info", lue: false }, { transaction }));
        await attendreFilePush();
        expect(envoyes().map((m) => m.title)).toEqual(["Validée"]);
    });

    test("un compte désactivé ne reçoit plus rien", async () => {
        await Users.update({ actif: false }, { where: { id_user: admin.id_user } });
        await creerNotificationsMultiples({ id_users: [admin.id_user], titre: "Info", message: "z" });
        await attendreFilePush();
        expect(envoyes()).toHaveLength(0);
        await Users.update({ actif: true }, { where: { id_user: admin.id_user } });
    });

    test("Expo injoignable : la notification est créée quand même", async () => {
        definirClientPush({
            chunkPushNotifications: (m) => [m],
            sendPushNotificationsAsync: async () => {
                throw new Error("ECONNREFUSED");
            },
        });
        const [notification] = await creerNotificationsMultiples({ id_users: [autre.id_user], titre: "Panne", message: "w" });
        await attendreFilePush();
        expect(await Notification.findByPk(notification.id_notification)).not.toBeNull();
    });
});
