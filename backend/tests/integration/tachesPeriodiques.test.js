import { resetDatabase, closeDatabase, createUser, createPlanningFixture } from "./helpers/testApp.js";
import { Notification } from "../../models/index.js";
import { rappelerAppels } from "../../services/presences/rappelAppel.js";
import { passage, tacheUnique } from "../../services/taches/periodiques.js";

/**
 * Tâches périodiques (lot A-7) : deux instances de l'API lancent les mêmes minuteries ; le verrou
 * MySQL fait qu'une seule fait le travail. La séance de la fixture finit le lundi 4 janvier 2027
 * à 10 h 45 (heure de Casablanca) : à 10 h 40, un rappel de l'appel est dû.
 */

let enseignant;
let lien;

const finDeSeance = new Date("2027-01-04T10:40:00+01:00");

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    const fixture = await createPlanningFixture({ admin, enseignant });
    lien = `/appel/${fixture.affectation.id_affectation}`;
});
afterAll(closeDatabase);

describe("Tâches périodiques sous verrou", () => {
    test("tant qu'une instance fait la tâche, l'autre passe son tour ; ensuite le verrou est libre", async () => {
        let terminer;
        const longue = tacheUnique("essai", () => new Promise((resolve) => { terminer = resolve; }));
        // Laisse la première prendre le verrou
        await new Promise((resolve) => setTimeout(resolve, 200));

        let appels = 0;
        const tache = async () => { appels += 1; return "fait"; };
        expect(await tacheUnique("essai", tache)).toEqual({ faite: false });
        expect(appels).toBe(0);
        // Une autre tâche, un autre verrou
        expect(await tacheUnique("autre", tache)).toEqual({ faite: true, resultat: "fait" });

        terminer("fini");
        expect(await longue).toEqual({ faite: true, resultat: "fini" });
        expect(await tacheUnique("essai", tache)).toEqual({ faite: true, resultat: "fait" });
    });

    test("deux passages simultanés du rappel de l'appel ne font qu'un seul envoi", async () => {
        // Chaque passage lit d'abord les rappels déjà partis : sans verrou, les deux lisaient « aucun »
        // et envoyaient chacun le leur
        const [a, b] = await Promise.all([
            passage("rappel-appel", () => rappelerAppels(finDeSeance)),
            passage("rappel-appel", () => rappelerAppels(finDeSeance)),
        ]);
        const envoyes = [a, b].filter((p) => p.faite).reduce((total, p) => total + p.resultat, 0);
        expect(envoyes).toBe(1);
        expect(await Notification.count({ where: { id_user: enseignant.id_user, lien } })).toBe(1);
    });

    test("une tâche en échec libère le verrou et ne lève pas d'erreur dans la minuterie", async () => {
        const issue = await passage("essai", async () => { throw new Error("base indisponible"); });
        expect(issue.faite).toBe(false);
        expect(issue.erreur.message).toBe("base indisponible");
        expect(await tacheUnique("essai", async () => 1)).toEqual({ faite: true, resultat: 1 });
    });
});
