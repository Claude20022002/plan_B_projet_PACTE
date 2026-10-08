import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Notification, ResponsableFiliere, Salle, Users } from "../../models/index.js";
import { calendrierIcs, instantLocal } from "../../services/calendrier/ics.js";
import { changementsEntre, renvoyerChangements } from "../../services/calendrier/envoiEdt.js";

/**
 * R4 — agenda et emploi du temps : abonnement ICS personnel (adresse secrète, renouvelable) et
 * envoi du mois aux classes (publication, puis renvoi des seuls changements).
 */

let admin;
let enseignant;
let autreEnseignant;
let etudiant;
let fixture;
let seance;
let annulee;
let mois;

const dansJours = (n) => {
    const d = new Date(Date.now() + n * 864e5);
    return d.toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });
};

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant", { prenom: "Hicham", nom: "Jazouli" });
    autreEnseignant = await createUser("enseignant");
    etudiant = await createUser("etudiant");
    fixture = await createPlanningFixture({ admin, enseignant, etudiant });
    const commun = { id_cours: fixture.cours.id_cours, id_groupe: fixture.groupe.id_groupe, id_user_enseignant: enseignant.id_user, id_salle: fixture.salle.id_salle, id_creneau: fixture.creneau.id_creneau, id_user_admin: admin.id_user };
    seance = await Affectation.create({ ...commun, date_seance: dansJours(10), statut: "planifie" });
    annulee = await Affectation.create({ ...commun, date_seance: dansJours(11), statut: "annule" });
    mois = dansJours(10).slice(0, 7);
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Format iCalendar", () => {
    test("heure de l'école convertie en UTC (Maroc : UTC+1 hors Ramadan)", () => {
        expect(instantLocal("2026-10-14", "09:00:00").toISOString()).toBe("2026-10-14T08:00:00.000Z");
        expect(instantLocal("2027-01-04", "13:30").toISOString()).toBe("2027-01-04T12:30:00.000Z");
    });

    test("échappement, lignes CRLF pliées à 75 octets", () => {
        const ics = calendrierIcs("Agenda", [{ uid: "x", debut: new Date("2026-10-14T08:00:00Z"), fin: new Date("2026-10-14T09:45:00Z"), titre: "Big Data, TD; groupe 1", description: `Ligne 1\nLigne 2 ${"é".repeat(60)}` }]);
        expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
        expect(ics).toContain("SUMMARY:Big Data\\, TD\\; groupe 1");
        expect(ics).toContain("DTSTART:20261014T080000Z");
        for (const ligne of ics.split("\r\n")) expect(Buffer.byteLength(ligne)).toBeLessThanOrEqual(75);
    });
});

describe("Abonnement calendrier", () => {
    let chemin;

    test("l'étudiant obtient une adresse stable ; son flux contient ses séances, l'annulée marquée annulée", async () => {
        const session = await loginAs(etudiant);
        const premiere = (await session.get("/api/agenda/abonnement")).body;
        expect(premiere.chemin).toMatch(/^\/api\/agenda\/[A-Za-z0-9_-]{43}\.ics$/);
        expect((await session.get("/api/agenda/abonnement")).body.chemin).toBe(premiere.chemin);
        chemin = premiere.chemin;

        const flux = await anonymous().get(chemin);
        expect(flux.status).toBe(200);
        expect(flux.headers["content-type"]).toContain("text/calendar");
        expect(flux.text).toContain(`UID:seance-${seance.id_affectation}@hestim-planner`);
        expect(flux.text).toContain("SUMMARY:Algorithmique (CM)");
        const blocAnnule = flux.text.split("BEGIN:VEVENT").find((b) => b.includes(`seance-${annulee.id_affectation}@`));
        expect(blocAnnule).toContain("STATUS:CANCELLED");
        expect(blocAnnule).toContain("SUMMARY:Annulé : Algorithmique");
    });

    test("l'enseignant voit ses séances avec le groupe", async () => {
        const { chemin: sien } = (await (await loginAs(enseignant)).get("/api/agenda/abonnement")).body;
        const flux = await anonymous().get(sien);
        expect(flux.text).toContain(`UID:seance-${seance.id_affectation}@hestim-planner`);
        expect(flux.text).toContain(`Groupe : ${fixture.groupe.nom_groupe}`);
    });

    test("renouveler coupe l'ancienne adresse ; adresse inconnue ou compte désactivé : 404", async () => {
        const session = await loginAs(etudiant);
        const nouvelle = (await session.send("post", "/api/agenda/abonnement/renouveler")).body.chemin;
        expect(nouvelle).not.toBe(chemin);
        expect((await anonymous().get(chemin)).status).toBe(404);
        expect((await anonymous().get(nouvelle)).status).toBe(200);
        expect((await anonymous().get("/api/agenda/inconnu.ics")).status).toBe(404);
        await Users.update({ actif: false }, { where: { id_user: etudiant.id_user } });
        expect((await anonymous().get(nouvelle)).status).toBe(404);
        await Users.update({ actif: true }, { where: { id_user: etudiant.id_user } });
    });
});

describe("Envoi de l'emploi du temps du mois", () => {
    test("réservé à l'administration et au responsable de la filière", async () => {
        const corps = { mois, id_filiere: fixture.filiere.id_filiere };
        expect((await (await loginAs(etudiant)).send("post", "/api/agenda/edt-mensuel/publier", corps)).status).toBe(403);
        expect((await (await loginAs(autreEnseignant)).send("post", "/api/agenda/edt-mensuel/publier", corps)).status).toBe(403);
        expect((await (await loginAs(admin)).send("post", "/api/agenda/edt-mensuel/publier", { ...corps, mois: "2026-13" })).status).toBe(400);
    });

    test("publication : la classe est prévenue ; republier sans changement n'envoie rien", async () => {
        const adm = await loginAs(admin);
        const premier = await adm.send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere });
        expect(premier.status).toBe(200);
        expect(premier.body.envoye).toBe(1);
        const notes = await Notification.findAll({ where: { id_user: etudiant.id_user, lien: `/emploi-du-temps/mensuel?groupe=${fixture.groupe.id_groupe}&mois=${mois}` } });
        expect(notes).toHaveLength(1);
        expect(notes[0].titre).toMatch(/^Emploi du temps de /);

        const second = await adm.send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere });
        expect(second.body).toMatchObject({ envoye: 0, modifie: 0, inchange: 1 });
        expect((await adm.get(`/api/agenda/edt-mensuel/etat?mois=${mois}&id_filiere=${fixture.filiere.id_filiere}`)).body).toMatchObject({ publie: true, destinataires: 1 });
    });

    test("le soir, un mois publié qui a changé est renvoyé avec les changements", async () => {
        const autreSalle = await Salle.create({ nom_salle: "G-RENVOI", type_salle: "Salle de cours", capacite: 40, id_campus: fixture.salle.id_campus });
        await seance.update({ id_salle: autreSalle.id_salle });
        const bilan = await renvoyerChangements();
        expect(bilan.modifie).toBe(1);
        const modifie = (await Notification.findAll({ where: { id_user: etudiant.id_user } })).find((n) => n.titre.endsWith("modifié"));
        expect(modifie.message).toContain("salle");
        expect(modifie.message).toContain("G-RENVOI");
        expect((await renvoyerChangements()).modifie).toBe(0);
    });

    test("le responsable de la filière peut publier", async () => {
        const responsable = await createUser("enseignant");
        await ResponsableFiliere.create({ id_user: responsable.id_user, id_filiere: fixture.filiere.id_filiere });
        expect((await (await loginAs(responsable)).send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere })).status).toBe(200);
    });

    test("changements décrits : ajout, déplacement, retrait", () => {
        const base = { cours: "Big Data", type: "TD", salle: "S01", enseignant: "Adil Benkirane", fin: "10:45" };
        const avant = [{ ...base, id: 1, date: "2026-10-12", debut: "09:00" }, { ...base, id: 2, date: "2026-10-13", debut: "09:00" }];
        const apres = [{ ...base, id: 1, date: "2026-10-14", debut: "13:30", fin: "15:15" }, { ...base, id: 3, date: "2026-10-15", debut: "09:00" }];
        const lignes = changementsEntre(avant, apres);
        expect(lignes).toHaveLength(3);
        expect(lignes.find((l) => l.startsWith("Modifié"))).toContain("→");
        expect(lignes.some((l) => l.startsWith("Ajout"))).toBe(true);
        expect(lignes.some((l) => l.startsWith("Annulé ou retiré"))).toBe(true);
    });
});
