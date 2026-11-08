import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs, anonymous } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, EnvoiEdt, Notification, ResponsableFiliere, Salle, Users } from "../../models/index.js";
import { calendrierIcs, instantLocal } from "../../services/calendrier/ics.js";
import { changementsEntre, lignesDuMois, rappelerChangementsNonPublies } from "../../services/calendrier/envoiEdt.js";

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
    test("heure de l'école convertie en UTC, selon l'heure légale du Maroc à cette date", () => {
        // 2025 : toutes les versions de la base des fuseaux s'accordent (UTC+1, UTC+0 pendant le Ramadan)
        expect(instantLocal("2025-06-02", "09:00:00").toISOString()).toBe("2025-06-02T08:00:00.000Z");
        expect(instantLocal("2025-03-03", "13:30").toISOString()).toBe("2025-03-03T13:30:00.000Z");
        // Dates à venir : l'heure légale peut changer (le Maroc est repassé à UTC+0 le 20 septembre 2026
        // dans la tzdata 2026c) ; on vérifie l'aller-retour plutôt qu'un décalage figé
        const heureDeLEcole = (instant) => instant.toLocaleString("sv-SE", { timeZone: "Africa/Casablanca" }).slice(0, 16);
        expect(heureDeLEcole(instantLocal("2026-10-14", "09:00:00"))).toBe("2026-10-14 09:00");
        expect(heureDeLEcole(instantLocal("2027-01-04", "13:30"))).toBe("2027-01-04 13:30");
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
        // L'étudiant ne voit que les mois publiés pour sa classe (retirés ensuite : les tests d'envoi repartent de zéro)
        const mois = [...new Set([dansJours(10), dansJours(11)].map((d) => d.slice(0, 7)))];
        for (const m of mois) await EnvoiEdt.create({ id_groupe: fixture.groupe.id_groupe, mois: m, seances: await lignesDuMois(fixture.groupe, m), envoye_le: new Date(), nb_destinataires: 1 });
        try {
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
        } finally {
            await EnvoiEdt.destroy({ where: { id_groupe: fixture.groupe.id_groupe, mois } });
        }
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
        // Avant la publication, l'étudiant ne voit pas le mois ; après, il le voit
        const vue = await loginAs(etudiant);
        const mensuel = `/api/emplois-du-temps/groupe/${fixture.groupe.id_groupe}/mensuel?mois=${mois}`;
        const avant = await vue.get(mensuel);
        expect(avant.status).toBe(404);
        expect(avant.body.code).toBe("EDT_NON_PUBLIE");
        const premier = await adm.send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere });
        expect(premier.status).toBe(200);
        expect(premier.body.envoye).toBe(1);
        expect((await vue.get(mensuel)).status).toBe(200);
        const notes = await Notification.findAll({ where: { id_user: etudiant.id_user, lien: `/emploi-du-temps/mensuel?groupe=${fixture.groupe.id_groupe}&mois=${mois}` } });
        expect(notes).toHaveLength(1);
        expect(notes[0].titre).toMatch(/^Emploi du temps de /);

        const second = await adm.send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere });
        expect(second.body).toMatchObject({ envoye: 0, modifie: 0, inchange: 1 });
        expect((await adm.get(`/api/agenda/edt-mensuel/etat?mois=${mois}&id_filiere=${fixture.filiere.id_filiere}`)).body).toMatchObject({ publie: true, destinataires: 1 });
    });

    test("le soir, l'administration est rappelée des changements non publiés ; republier les envoie aux étudiants", async () => {
        const autreSalle = await Salle.create({ nom_salle: "G-RENVOI", type_salle: "Salle de cours", capacite: 40, id_campus: fixture.salle.id_campus });
        await seance.update({ id_salle: autreSalle.id_salle });
        const adm = await loginAs(admin);
        const etat = (await adm.get(`/api/agenda/edt-mensuel/etat?mois=${mois}&id_filiere=${fixture.filiere.id_filiere}`)).body;
        expect(etat.classes_a_republier).toEqual([expect.objectContaining({ id_groupe: fixture.groupe.id_groupe, changements: 1 })]);

        expect((await rappelerChangementsNonPublies()).a_republier).toBe(1);
        expect(await Notification.count({ where: { id_user: admin.id_user, titre: "Changements à publier" } })).toBe(1);
        // Les étudiants n'ont rien reçu : ils le verront à la publication
        expect((await Notification.findAll({ where: { id_user: etudiant.id_user } })).some((n) => n.titre.endsWith("modifié"))).toBe(false);

        const republie = await adm.send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere });
        expect(republie.body.modifie).toBe(1);
        const modifie = (await Notification.findAll({ where: { id_user: etudiant.id_user } })).find((n) => n.titre.endsWith("modifié"));
        expect(modifie.message).toContain("G-RENVOI");
        expect((await rappelerChangementsNonPublies()).a_republier).toBe(0);
    });

    test("le responsable de la filière peut publier", async () => {
        const responsable = await createUser("enseignant");
        await ResponsableFiliere.create({ id_user: responsable.id_user, id_filiere: fixture.filiere.id_filiere });
        expect((await (await loginAs(responsable)).send("post", "/api/agenda/edt-mensuel/publier", { mois, id_filiere: fixture.filiere.id_filiere })).status).toBe(200);
    });

    test("une annulation se dit une fois ; une séance annulée jamais publiée ne se dit pas", () => {
        const base = { cours: "Big Data", type: "TD", salle: "S01", enseignant: "Adil Benkirane", debut: "09:00", fin: "10:45", date: "2026-10-12" };
        expect(changementsEntre([{ ...base, id: 1, statut: "planifie" }], [{ ...base, id: 1, statut: "annule" }])).toEqual([expect.stringMatching(/^Annulé : /)]);
        expect(changementsEntre([{ ...base, id: 1, statut: "annule" }], [{ ...base, id: 1, statut: "annule" }])).toEqual([]);
        expect(changementsEntre([], [{ ...base, id: 2, statut: "annule" }])).toEqual([]);
        expect(changementsEntre([{ ...base, id: 3, statut: "annule" }], [])).toEqual([]);
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
