import { resetDatabase, closeDatabase, createUser, loginAs, createPlanningFixture } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Campus, Salle, Evenement } from "../../models/index.js";

let clients;
let gandhi;
let stendhal;

beforeAll(async () => {
    await resetDatabase();
    const admin = await createUser("admin");
    const enseignant = await createUser("enseignant");
    const etudiant = await createUser("etudiant");
    clients = {
        admin: await loginAs(admin),
        enseignant: await loginAs(enseignant),
        etudiant: await loginAs(etudiant),
    };
    gandhi = await Campus.findOne({ where: { code: "G" } });
    stendhal = await Campus.findOne({ where: { code: "ST" } });
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Campus", () => {
    test("Gandhi et Stendhal existent dès la migration et sont visibles par tous", async () => {
        const response = await clients.etudiant.get("/api/campus");
        expect(response.status).toBe(200);
        expect(response.body.map((c) => c.code)).toEqual(expect.arrayContaining(["G", "ST"]));
        expect(response.body.find((c) => c.code === "G").adresse).toMatch(/Ghandi/);
    });

    test("seul l'admin crée un campus ; code en double refusé", async () => {
        const refus = await clients.enseignant.send("post", "/api/campus", { code: "AN", nom: "Annexe" });
        expect(refus.status).toBe(403);

        const cree = await clients.admin.send("post", "/api/campus", { code: "an", nom: "Annexe" });
        expect(cree.status).toBe(201);
        expect(cree.body.campus.code).toBe("AN");

        const doublon = await clients.admin.send("post", "/api/campus", { code: "AN", nom: "Autre" });
        expect(doublon.status).toBe(409);
    });

    test("un campus qui a des salles ne peut pas être supprimé", async () => {
        await Salle.create({ nom_salle: "ST-TEST", type_salle: "Salle TD", capacite: 24, id_campus: stendhal.id_campus });
        const response = await clients.admin.send("delete", `/api/campus/${stendhal.id_campus}`);
        expect(response.status).toBe(409);
    });

    test("temps de trajet : défaut, puis valeur renseignée (paire rangée)", async () => {
        const avant = await clients.etudiant.get("/api/campus/trajets");
        expect(avant.body).toMatchObject({ defaut_minutes: 30, trajets: [] });

        const memeCampus = await clients.admin.send("put", "/api/campus/trajets", {
            id_campus_a: gandhi.id_campus,
            id_campus_b: gandhi.id_campus,
            minutes: 10,
        });
        expect(memeCampus.status).toBe(400);

        const enregistre = await clients.admin.send("put", "/api/campus/trajets", {
            id_campus_a: stendhal.id_campus,
            id_campus_b: gandhi.id_campus,
            minutes: 25,
        });
        expect(enregistre.status).toBe(201);

        const misAJour = await clients.admin.send("put", "/api/campus/trajets", {
            id_campus_a: gandhi.id_campus,
            id_campus_b: stendhal.id_campus,
            minutes: 20,
        });
        expect(misAJour.status).toBe(200);

        const apres = await clients.etudiant.get("/api/campus/trajets");
        expect(apres.body.trajets).toHaveLength(1);
        expect(apres.body.trajets[0].minutes).toBe(20);
    });
});

describe("Salles rattachées à un campus", () => {
    test("type hors liste refusé ; création avec campus, capacité d'examen par défaut et batiment compatible", async () => {
        const mauvaisType = await clients.admin.send("post", "/api/salles", {
            nom_salle: "G-X01",
            type_salle: "Piscine",
            capacite: 30,
            id_campus: gandhi.id_campus,
        });
        expect(mauvaisType.status).toBe(400);

        const response = await clients.admin.send("post", "/api/salles", {
            nom_salle: "G-LABOCIV",
            type_salle: "Labo génie civil",
            capacite: 30,
            id_campus: gandhi.id_campus,
            equipements: "Presse hydraulique, Vidéoprojecteur",
        });
        expect(response.status).toBe(201);
        expect(response.body.salle).toMatchObject({
            capacite_examen: 15,
            batiment: "Gandhi",
            campus: { code: "G" },
            equipements: ["Presse hydraulique", "Vidéoprojecteur"],
            reservable_par: "admin",
        });
    });

    test("filtre par code campus", async () => {
        const response = await clients.etudiant.get("/api/salles?campus=ST&limit=100");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.every((s) => s.campus.code === "ST")).toBe(true);
    });

    test("une salle incluse dans une séance porte son campus", async () => {
        const admin = await createUser("admin");
        const enseignant = await createUser("enseignant");
        const { affectation } = await createPlanningFixture({ admin, enseignant });
        const response = await clients.admin.get(`/api/affectations/${affectation.id_affectation}`);
        expect(response.status).toBe(200);
        const seance = response.body.affectation ?? response.body;
        expect(seance.salle).toMatchObject({ batiment: "Gandhi", campus: { code: "G" } });
    });

    test("import tout ou rien : une ligne invalide annule tout et chaque erreur est listée", async () => {
        const avant = await Salle.count();
        const response = await clients.admin.send("post", "/api/salles/import", {
            salles: [
                { nom_salle: "ST-IMP1", type_salle: "Salle TD", capacite: "24", campus: "ST" },
                { nom_salle: "ST-IMP2", type_salle: "Hangar", capacite: "0", campus: "Lune" },
                { nom_salle: "ST-IMP1", type_salle: "Salle TD", capacite: "24", campus: "ST" },
            ],
        });
        expect(response.status).toBe(400);
        expect(response.body.erreurs.map((e) => e.ligne)).toEqual([3, 4]);
        expect(response.body.erreurs[0].erreurs).toHaveLength(3);
        expect(await Salle.count()).toBe(avant);
    });

    test("import valide : crée les nouvelles salles et met à jour les existantes", async () => {
        const response = await clients.admin.send("post", "/api/salles/import", {
            salles: [
                { nom_salle: "ST-IMP1", type_salle: "Laboratoire informatique", capacite: "28", campus: "Stendhal", equipements: "28 postes; AutoCAD" },
                { nom_salle: "ST-TEST", type_salle: "Salle TD", capacite: "30", campus: "st", reservable_par: "enseignants" },
            ],
        });
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ crees: 1, mises_a_jour: 1 });

        const importee = await Salle.findOne({ where: { nom_salle: "ST-IMP1" } });
        expect(importee.type_salle).toBe("Labo informatique");
        expect(importee.equipements).toEqual(["28 postes", "AutoCAD"]);
        const majee = await Salle.findOne({ where: { nom_salle: "ST-TEST" } });
        expect(majee).toMatchObject({ capacite: 30, reservable_par: "enseignants" });
    });

    test("l'import est réservé à l'admin", async () => {
        const response = await clients.enseignant.send("post", "/api/salles/import", { salles: [] });
        expect(response.status).toBe(403);
    });
});

describe("Calendrier académique", () => {
    let annee;

    test("création d'une année active et de ses semestres, dans ses bornes", async () => {
        const creee = await clients.admin.send("post", "/api/calendrier/annees", {
            libelle: "2026-2027",
            date_debut: "2026-09-01",
            date_fin: "2027-07-15",
            active: true,
        });
        expect(creee.status).toBe(201);
        annee = creee.body.annee;

        const s1 = await clients.admin.send("post", `/api/calendrier/annees/${annee.id_annee}/periodes`, {
            code: "S1",
            date_debut: "2026-09-14",
            date_fin: "2027-01-23",
            nb_semaines: 16,
        });
        expect(s1.status).toBe(201);

        const chevauche = await clients.admin.send("post", `/api/calendrier/annees/${annee.id_annee}/periodes`, {
            code: "S2",
            date_debut: "2027-01-20",
            date_fin: "2027-06-15",
            nb_semaines: 16,
        });
        expect(chevauche.status).toBe(400);

        const horsAnnee = await clients.admin.send("post", `/api/calendrier/annees/${annee.id_annee}/periodes`, {
            code: "S2",
            date_debut: "2027-02-01",
            date_fin: "2027-08-30",
            nb_semaines: 16,
        });
        expect(horsAnnee.status).toBe(400);

        const lecture = await clients.etudiant.get("/api/calendrier/annees");
        expect(lecture.status).toBe(200);
        expect(lecture.body[0].periodes.map((p) => p.code)).toEqual(["S1"]);
    });

    test("une seule année active à la fois", async () => {
        await clients.admin.send("post", "/api/calendrier/annees", {
            libelle: "2027-2028",
            date_debut: "2027-09-01",
            date_fin: "2028-07-15",
            active: true,
        });
        const lecture = await clients.admin.get("/api/calendrier/annees");
        expect(lecture.body.filter((a) => a.active).map((a) => a.libelle)).toEqual(["2027-2028"]);
    });

    test("génération des fériés marocains : fêtes lunaires à confirmer, sans doublon si on relance", async () => {
        const premiere = await clients.admin.send("post", `/api/calendrier/annees/${annee.id_annee}/feries`);
        expect(premiere.status).toBe(201);
        expect(premiere.body.crees).toBeGreaterThan(10);
        expect(premiere.body.a_confirmer).toBeGreaterThanOrEqual(3);

        const relance = await clients.admin.send("post", `/api/calendrier/annees/${annee.id_annee}/feries`);
        expect(relance.body.crees).toBe(0);

        const aConfirmer = await clients.etudiant.get("/api/evenements?a_confirmer=true");
        expect(aConfirmer.body.map((e) => e.titre)).toEqual(expect.arrayContaining(["Aïd al-Fitr", "Ramadan"]));
    });

    test("un étudiant ne modifie pas le calendrier", async () => {
        const response = await clients.etudiant.send("post", "/api/calendrier/annees", {
            libelle: "2030-2031",
            date_debut: "2030-09-01",
            date_fin: "2031-07-01",
        });
        expect(response.status).toBe(403);
    });
});

describe("Événements : portée et confirmation", () => {
    test("une portée « groupe » exige un groupe existant", async () => {
        const response = await clients.admin.send("post", "/api/evenements", {
            titre: "Sortie pédagogique",
            date_debut: "2026-11-10",
            date_fin: "2026-11-10",
            portee: "groupe",
        });
        expect(response.status).toBe(400);
    });

    test("semaine d'examens limitée à un campus", async () => {
        const response = await clients.admin.send("post", "/api/evenements", {
            titre: "Examens S1",
            date_debut: "2027-01-18",
            date_fin: "2027-01-23",
            type_evenement: "examen",
            portee: "campus",
            id_cible: stendhal.id_campus,
        });
        expect(response.status).toBe(201);
        expect(response.body.evenement).toMatchObject({ portee: "campus", id_cible: stendhal.id_campus, date_confirmee: true });
    });

    test("confirmer une fête décalée d'un jour", async () => {
        const fitr = await Evenement.findOne({ where: { titre: "Aïd al-Fitr", date_debut: "2027-03-10" } });
        const response = await clients.admin.send("patch", `/api/evenements/${fitr.id_evenement}/confirmer`, {
            date_debut: "2027-03-11",
            date_fin: "2027-03-12",
        });
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ decale: true, evenement: { date_confirmee: true, date_debut: "2027-03-11" } });
    });
});

describe("Grilles horaires : régime, variante et rang", () => {
    const creer = (creneau) => clients.admin.send("post", "/api/creneaux", creneau);
    const grille = async (regime, variante) => {
        const response = await clients.admin.get(`/api/creneaux?jour_semaine=mardi&regime=${regime}&variante=${variante}&limit=100`);
        return response.body.data.map((c) => [c.heure_debut.slice(0, 5), c.rang]);
    };

    test("le rang suit l'ordre des heures, quel que soit l'ordre de saisie ; durée calculée", async () => {
        expect((await creer({ jour_semaine: "mardi", heure_debut: "11:00", heure_fin: "12:30" })).status).toBe(201);
        const premier = await creer({ jour_semaine: "mardi", heure_debut: "09:00", heure_fin: "10:30" });
        expect(premier.body.creneau).toMatchObject({ duree_minutes: 90, rang: 1, regime: "initiale", variante: "normale" });
        expect(await grille("initiale", "normale")).toEqual([["09:00", 1], ["11:00", 2]]);
    });

    test("la variante ramadan forme sa propre grille, aux mêmes rangs", async () => {
        await creer({ jour_semaine: "mardi", heure_debut: "10:00", heure_fin: "11:00", variante: "ramadan" });
        await creer({ jour_semaine: "mardi", heure_debut: "09:00", heure_fin: "10:00", variante: "ramadan" });
        expect(await grille("initiale", "ramadan")).toEqual([["09:00", 1], ["10:00", 2]]);
    });

    test("formation continue : créneau du soir dans une grille séparée ; doublon refusé dans la même grille", async () => {
        const soir = await creer({ jour_semaine: "mardi", heure_debut: "18:30", heure_fin: "21:30", regime: "continue" });
        expect(soir.body.creneau.rang).toBe(1);
        const doublon = await creer({ jour_semaine: "mardi", heure_debut: "18:30", heure_fin: "21:30", regime: "continue" });
        expect(doublon.status).toBe(409);
    });

    test("supprimer un créneau renumérote la grille", async () => {
        const liste = await clients.admin.get("/api/creneaux?jour_semaine=mardi&regime=initiale&variante=normale");
        const premier = liste.body.data.find((c) => c.rang === 1);
        await clients.admin.send("delete", `/api/creneaux/${premier.id_creneau}`);
        expect(await grille("initiale", "normale")).toEqual([["11:00", 1]]);
    });

    test("fin avant début refusée", async () => {
        const response = await creer({ jour_semaine: "mercredi", heure_debut: "12:00", heure_fin: "10:00" });
        expect(response.status).toBe(400);
    });
});

describe("Paramètres de planification", () => {
    test("valeurs par défaut lisibles par l'admin seulement", async () => {
        expect((await clients.enseignant.get("/api/parametres-planning")).status).toBe(403);
        const response = await clients.admin.get("/api/parametres-planning");
        expect(response.status).toBe(200);
        expect(response.body.pause_vendredi).toMatchObject({ modifie: false, valeur: { active: true } });
    });

    test("valeur invalide refusée, valeur valide enregistrée puis réinitialisée", async () => {
        const invalide = await clients.admin.send("put", "/api/parametres-planning/max_heures_jour_groupe", { valeur: 40 });
        expect(invalide.status).toBe(400);

        const inconnu = await clients.admin.send("put", "/api/parametres-planning/couleur_prefere", { valeur: 1 });
        expect(inconnu.status).toBe(404);

        const ok = await clients.admin.send("put", "/api/parametres-planning/max_heures_jour_groupe", { valeur: 7 });
        expect(ok.status).toBe(200);
        const lecture = await clients.admin.get("/api/parametres-planning");
        expect(lecture.body.max_heures_jour_groupe).toMatchObject({ valeur: 7, modifie: true });

        await clients.admin.send("delete", "/api/parametres-planning/max_heures_jour_groupe");
        const apres = await clients.admin.get("/api/parametres-planning");
        expect(apres.body.max_heures_jour_groupe).toMatchObject({ valeur: 8, modifie: false });
    });

    test("le ratio de capacité d'examen modifié s'applique aux nouvelles salles", async () => {
        await clients.admin.send("put", "/api/parametres-planning/ratio_capacite_examen", { valeur: 0.25 });
        const response = await clients.admin.send("post", "/api/salles", {
            nom_salle: "G-RATIO",
            type_salle: "Salle de cours",
            capacite: 40,
            id_campus: gandhi.id_campus,
        });
        expect(response.body.salle.capacite_examen).toBe(10);
        await clients.admin.send("delete", "/api/parametres-planning/ratio_capacite_examen");
    });
});
