import { resetDatabase, closeDatabase, createUser, createPlanningFixture } from "./helpers/testApp.js";
import { Affectation, Notification } from "../../models/index.js";
import { fermerAppel, ouvrirAppel } from "../../services/presences/appel.js";
import { rappelerAppels } from "../../services/presences/rappelAppel.js";
import { mesClasses } from "../../services/planning/mesClasses.js";

/**
 * Rappel de l'appel : 5 minutes avant la fin d'une séance, l'enseignant qui n'a pas terminé
 * l'appel est prévenu, une seule fois. La séance de la fixture a lieu le lundi 4 janvier 2027,
 * de 9 h à 10 h 45 (heure de Casablanca, UTC+1).
 */

let admin;
let enseignant;
let fixture;
let lien;

const a = (heure) => new Date(`2027-01-04T${heure}:00+01:00`);
const rappels = () => Notification.findAll({ where: { id_user: enseignant.id_user, lien }, order: [["id_notification", "ASC"]], raw: true });

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    fixture = await createPlanningFixture({ admin, enseignant });
    lien = `/appel/${fixture.affectation.id_affectation}`;
});
afterAll(closeDatabase);

describe("Rappel de l'appel", () => {
    test("rien avant les 5 dernières minutes, ni après la fin, ni un autre jour", async () => {
        expect(await rappelerAppels(a("08:58"))).toBe(0);
        expect(await rappelerAppels(a("10:39"))).toBe(0);
        expect(await rappelerAppels(a("10:46"))).toBe(0);
        expect(await rappelerAppels(new Date("2027-01-05T10:42:00+01:00"))).toBe(0);
        expect(await rappels()).toHaveLength(0);
    });

    test("5 minutes avant la fin, sans appel : un rappel qui ouvre l'appel, une seule fois", async () => {
        expect(await rappelerAppels(a("10:40"))).toBe(1);
        expect(await rappelerAppels(a("10:41"))).toBe(0);
        expect(await rappelerAppels(a("10:45"))).toBe(0);
        const recus = await rappels();
        expect(recus).toHaveLength(1);
        expect(recus[0]).toMatchObject({ titre: "Rappel : faites l'appel", type_notification: "warning" });
        expect(recus[0].message).toContain("10:45");
    });

    test("le délai est réglable, et 0 coupe les rappels", async () => {
        await Notification.destroy({ where: { lien } });
        expect(await rappelerAppels(a("10:36"), 0)).toBe(0);
        expect(await rappelerAppels(a("10:36"), 10)).toBe(1);
    });

    test("appel encore ouvert : rappel de le terminer ; appel terminé ou séance annulée : aucun rappel", async () => {
        await Notification.destroy({ where: { lien } });
        await ouvrirAppel(enseignant, fixture.affectation.id_affectation, a("09:05"));
        expect(await mesClasses(enseignant, { jour: "2027-01-04", heure: "10:00" })).toEqual([
            expect.objectContaining({ en_cours: true, prochaine_seance: expect.objectContaining({ appel: "ouvert" }) }),
        ]);
        expect(await rappelerAppels(a("10:42"))).toBe(1);
        expect((await rappels())[0].titre).toBe("Rappel : terminez l'appel");

        await Notification.destroy({ where: { lien } });
        await fermerAppel(enseignant, fixture.affectation.id_affectation);
        expect(await rappelerAppels(a("10:43"))).toBe(0);

        await Affectation.update({ statut: "annule" }, { where: { id_affectation: fixture.affectation.id_affectation } });
        expect(await rappelerAppels(a("10:43"))).toBe(0);
    });
});

describe("Mes classes : état de l'appel de la séance du jour", () => {
    test("à faire tant que l'appel n'est pas ouvert ; absent pour une séance d'un autre jour", async () => {
        const autre = await createUser("enseignant");
        const seance = await Affectation.create({
            date_seance: "2027-01-11",
            statut: "planifie",
            id_cours: fixture.cours.id_cours,
            id_groupe: fixture.autreGroupe.id_groupe,
            id_user_enseignant: autre.id_user,
            id_salle: fixture.salle.id_salle,
            id_creneau: fixture.creneau.id_creneau,
            id_user_admin: admin.id_user,
        });
        expect((await mesClasses(autre, { jour: "2027-01-11", heure: "09:30" }))[0].prochaine_seance).toMatchObject({ id_affectation: seance.id_affectation, appel: "a_faire" });
        expect((await mesClasses(autre, { jour: "2027-01-08", heure: "09:30" }))[0].prochaine_seance.appel).toBeNull();
    });
});
