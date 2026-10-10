import { resetDatabase, closeDatabase, createUser, createPlanningFixture, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Affectation, Appartenir, CoursComposante, Enseignement, EnseignementEnseignant, Groupe } from "../../models/index.js";
import { mesClasses } from "../../services/planning/mesClasses.js";

/**
 * « Mes classes » d'un enseignant (services et emploi du temps) et refus d'écrire aux classes d'un
 * collègue. Module partagé : la promotion a deux TD, chacun confié à un enseignant ; un troisième
 * remplace sur une séance du TD2.
 */

let admin;
let profTd1;
let profTd2;
let remplacant;
let fixture;
let promo;
let td1;
let td2;
let tp1;

const dansUneSemaine = () => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    profTd1 = await createUser("enseignant");
    profTd2 = await createUser("enseignant");
    remplacant = await createUser("enseignant");
    fixture = await createPlanningFixture({ admin });
    promo = fixture.groupe;
    await promo.update({ type_groupe: "promotion" });
    const commun = { niveau: "3A", effectif: 12, annee_scolaire: "2026-2027", id_filiere: fixture.filiere.id_filiere };
    td1 = await Groupe.create({ ...commun, nom_groupe: "TD1", id_groupe_parent: promo.id_groupe, type_groupe: "td" });
    td2 = await Groupe.create({ ...commun, nom_groupe: "TD2", id_groupe_parent: promo.id_groupe, type_groupe: "td" });
    tp1 = await Groupe.create({ ...commun, nom_groupe: "TP1", id_groupe_parent: td1.id_groupe, type_groupe: "tp" });
    for (const [n, groupe] of [[3, td1], [2, td2], [2, tp1]]) {
        for (let i = 0; i < n; i += 1) await Appartenir.create({ id_user_etudiant: (await createUser("etudiant")).id_user, id_groupe: groupe.id_groupe });
    }

    const composante = await CoursComposante.create({ id_cours: fixture.cours.id_cours, type: "TD", volume_heures: 21, niveau_groupe: "td" });
    for (const [groupe, prof] of [[td1, profTd1], [td2, profTd2]]) {
        const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 20 });
        await enseignement.setGroupes([groupe.id_groupe]);
        await EnseignementEnseignant.create({ id_enseignement: enseignement.id_enseignement, id_user: prof.id_user, role: "principal", statut_service: "accepte" });
    }
    // Séances à venir : TD1 par son enseignant ; TD2 par le remplaçant (sans service)
    const seance = { statut: "planifie", id_cours: fixture.cours.id_cours, id_salle: fixture.salle.id_salle, id_creneau: fixture.creneau.id_creneau, id_user_admin: admin.id_user };
    await Affectation.create({ ...seance, date_seance: "2027-01-04", id_groupe: td1.id_groupe, id_user_enseignant: profTd1.id_user });
    await Affectation.create({ ...seance, date_seance: "2027-01-11", id_groupe: td2.id_groupe, id_user_enseignant: remplacant.id_user });
});
beforeEach(resetRateLimiters);
afterAll(closeDatabase);

describe("Mes classes", () => {
    test("service et emploi du temps : la classe, son effectif (sous-groupes compris) et sa prochaine séance", async () => {
        const client = await loginAs(profTd1);
        const res = await client.get("/api/enseignants/mes-classes");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id_cours: fixture.cours.id_cours,
                id_groupe: td1.id_groupe,
                nom_groupe: "TD1",
                effectif: 5,
                sources: ["emploi_du_temps", "service"],
                en_cours: false,
                prochaine_seance: expect.objectContaining({ date: "2027-01-04", heure_debut: "09:00", heure_fin: "10:45", salle: fixture.salle.nom_salle }),
            }),
        ]);
    });

    test("un remplaçant sans service a pour classe le groupe de sa séance", async () => {
        const classes = await mesClasses(remplacant);
        expect(classes.map((c) => [c.nom_groupe, c.sources])).toEqual([["TD2", ["emploi_du_temps"]]]);
    });

    test("séance du jour en cours : la classe passe en premier, marquée en cours", async () => {
        const classes = await mesClasses(profTd1, { jour: "2027-01-04", heure: "09:30" });
        expect(classes[0]).toMatchObject({ nom_groupe: "TD1", en_cours: true });
        // Après la fin de la séance, elle n'est plus la prochaine
        expect((await mesClasses(profTd1, { jour: "2027-01-04", heure: "11:00" }))[0].prochaine_seance).toBeNull();
    });

    test("réservé aux enseignants", async () => {
        expect((await (await loginAs(admin)).get("/api/enseignants/mes-classes")).status).toBe(403);
    });
});

describe("Devoirs : seulement pour ses classes", () => {
    const devoir = (idGroupe) => ({ type: "fichier", titre: "TP noté", id_cours: fixture.cours.id_cours, ...(idGroupe ? { id_groupe: idGroupe } : {}), date_limite: dansUneSemaine() });

    test("sa classe et ses sous-groupes : accepté", async () => {
        const client = await loginAs(profTd1);
        expect((await client.send("post", "/api/devoirs", devoir(td1.id_groupe))).status).toBe(201);
        expect((await client.send("post", "/api/devoirs", devoir(tp1.id_groupe))).status).toBe(201);
    });

    test("la classe d'un collègue dans le même module : refusée", async () => {
        const res = await (await loginAs(profTd1)).send("post", "/api/devoirs", devoir(td2.id_groupe));
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/pas l'une de vos classes/);
    });

    test("tout le module alors qu'un collègue y a une classe : refusé, il faut choisir sa classe", async () => {
        const res = await (await loginAs(profTd1)).send("post", "/api/devoirs", devoir(null));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/choisissez l'une de vos classes/);
    });

    test("le remplaçant écrit au TD2 qu'il a en séance", async () => {
        expect((await (await loginAs(remplacant)).send("post", "/api/devoirs", devoir(td2.id_groupe))).status).toBe(201);
    });
});
