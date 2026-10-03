import { resetDatabase, closeDatabase, createUser, loginAs, createPlanningFixture } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import { Campus, CoursComposante, Enseignement } from "../../models/index.js";
import { groupesLies } from "../../services/planning/groupes.js";
import { detecterConflitsPourAffectation } from "../../utils/detectConflicts.js";

let clients;
let admin;
let enseignant;

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    enseignant = await createUser("enseignant");
    clients = { admin: await loginAs(admin), enseignant: await loginAs(enseignant) };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

const creerFiliere = async (code, extra = {}) => {
    const response = await clients.admin.send("post", "/api/filieres", { code_filiere: code, nom_filiere: `Filière ${code}`, ...extra });
    expect(response.status).toBe(201);
    return response.body.filiere;
};

const creerGroupe = async (data) => {
    const response = await clients.admin.send("post", "/api/groupes", { annee_scolaire: "2026-2027", effectif: 22, ...data });
    expect(response.status).toBe(201);
    return response.body.groupe;
};

describe("Filières : cycle, école et double diplôme", () => {
    test("création avec les champs de structure, valeurs hors liste refusées", async () => {
        const gandhi = await Campus.findOne({ where: { code: "G" } });
        const filiere = await creerFiliere("IIIA", {
            nom_filiere: "Ingénierie Informatique et Intelligence Artificielle",
            ecole: "engineering",
            cycle: "ingenieur",
            intitule_cycle: "cycle Ingénieur d'Etat",
            premiere_annee_cycle: 3,
            id_campus_prefere: gandhi.id_campus,
            partenaire: "ESTIA",
            annees_a_hestim: 4,
        });
        expect(filiere).toMatchObject({ cycle: "ingenieur", premiere_annee_cycle: 3, campus_prefere: { code: "G" } });

        const mauvaisCycle = await clients.admin.send("put", `/api/filieres/${filiere.id_filiere}`, { cycle: "doctorat" });
        expect(mauvaisCycle.status).toBe(400);
        const campusInconnu = await clients.admin.send("put", `/api/filieres/${filiere.id_filiere}`, { id_campus_prefere: 9999 });
        expect(campusInconnu.status).toBe(400);
    });
});

describe("Maquette : modules et composantes", () => {
    let filiere;
    let module;

    beforeAll(async () => {
        filiere = await creerFiliere("MAQ");
    });

    test("un module créé reçoit sa composante initiale", async () => {
        const response = await clients.admin.send("post", "/api/cours", {
            code_cours: "MAQ-TLC",
            nom_cours: "Théorie des langages et Compilation",
            niveau: "4ème année",
            volume_horaire: 21,
            type_cours: "CM",
            semestre: "S7",
            id_filiere: filiere.id_filiere,
            ects: 3,
        });
        expect(response.status).toBe(201);
        module = response.body.cours;
        expect(module.composantes).toHaveLength(1);
        expect(module.composantes[0]).toMatchObject({ type: "CM", volume_heures: 21, creneaux_par_seance: 2, modalite: "presentiel" });
    });

    test("une seule composante par type ; rythme incohérent refusé", async () => {
        const td = await clients.admin.send("post", `/api/cours/${module.id_cours}/composantes`, {
            type: "TD",
            volume_heures: 10.5,
            niveau_groupe: "td",
            semaine_debut: 2,
            semaine_fin: 8,
            seances_par_semaine: 1,
        });
        expect(td.status).toBe(201);

        const doublon = await clients.admin.send("post", `/api/cours/${module.id_cours}/composantes`, { type: "TD", volume_heures: 4 });
        expect(doublon.status).toBe(409);

        const rythme = await clients.admin.send("put", `/api/composantes/${td.body.composante.id_composante}`, { semaine_debut: 9 });
        expect(rythme.status).toBe(400);
    });

    test("une composante en distanciel ne demande aucune salle", async () => {
        const response = await clients.admin.send("post", `/api/cours/${module.id_cours}/composantes`, {
            type: "Projet",
            volume_heures: 12,
            modalite: "distanciel",
            mention: "Blended Coursera",
            type_salle_requis: "Labo informatique",
        });
        expect(response.status).toBe(201);
        expect(response.body.composante).toMatchObject({ modalite: "distanciel", type_salle_requis: null, mention: "Blended Coursera" });
    });

    test("filtre des modules par période (semestres impairs en S1)", async () => {
        await clients.admin.send("post", "/api/cours", {
            code_cours: "MAQ-PAIR",
            nom_cours: "Module du S8",
            niveau: "4ème année",
            volume_horaire: 20,
            type_cours: "CM",
            semestre: "S8",
            id_filiere: filiere.id_filiere,
        });
        const s1 = await clients.admin.get(`/api/cours?id_filiere=${filiere.id_filiere}&periode=S1&limit=100`);
        expect(s1.body.data.map((c) => c.code_cours)).toEqual(["MAQ-TLC"]);
        const s2 = await clients.admin.get(`/api/cours?id_filiere=${filiere.id_filiere}&periode=S2&limit=100`);
        expect(s2.body.data.map((c) => c.code_cours)).toEqual(["MAQ-PAIR"]);
    });
});

describe("Groupes emboîtés : promotion ⊃ TD ⊃ TP", () => {
    let filiere;
    let promo;
    let tdA;

    beforeAll(async () => {
        filiere = await creerFiliere("GRP");
        promo = await creerGroupe({ nom_groupe: "4A GRP", niveau: "4ème année", type_groupe: "promotion", id_filiere: filiere.id_filiere, effectif: 44 });
        tdA = await creerGroupe({ nom_groupe: "GRP-4A", niveau: "4ème année", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere });
    });

    test("l'année d'études se déduit du niveau", () => {
        expect(promo.annee).toBe(4);
        expect(tdA.parent).toMatchObject({ id_groupe: promo.id_groupe });
    });

    test("un parent doit être plus large et de la même filière ; pas de cycle", async () => {
        const autreFiliere = await creerFiliere("AUT");
        const horsFiliere = await clients.admin.send("post", "/api/groupes", {
            nom_groupe: "AUT-1", niveau: "4ème année", annee_scolaire: "2026-2027", id_filiere: autreFiliere.id_filiere, id_groupe_parent: promo.id_groupe,
        });
        expect(horsFiliere.status).toBe(400);

        const promoSousTd = await clients.admin.send("put", `/api/groupes/${promo.id_groupe}`, { id_groupe_parent: tdA.id_groupe });
        expect(promoSousTd.status).toBe(400);

        const tdSousTd = await clients.admin.send("post", "/api/groupes", {
            nom_groupe: "GRP-4A-bis", niveau: "4ème année", annee_scolaire: "2026-2027", id_filiere: filiere.id_filiere,
            type_groupe: "td", id_groupe_parent: tdA.id_groupe,
        });
        expect(tdSousTd.status).toBe(400);
    });

    test("arbre de la filière et groupes liés pour les conflits", async () => {
        const tp = await creerGroupe({ nom_groupe: "GRP-4A-TP1", niveau: "4ème année", type_groupe: "tp", id_groupe_parent: tdA.id_groupe, id_filiere: filiere.id_filiere, effectif: 11 });
        const arbre = await clients.admin.get(`/api/groupes/arbre?id_filiere=${filiere.id_filiere}`);
        expect(arbre.status).toBe(200);
        expect(arbre.body[0]).toMatchObject({ nom_groupe: "4A GRP", sous_groupes: [{ nom_groupe: "GRP-4A", sous_groupes: [{ nom_groupe: "GRP-4A-TP1" }] }] });

        // Un TP est occupé quand sa promotion a cours, et inversement
        expect((await groupesLies(tp.id_groupe)).sort()).toEqual([promo.id_groupe, tdA.id_groupe, tp.id_groupe].sort());
        expect(await groupesLies(promo.id_groupe)).toEqual(expect.arrayContaining([tdA.id_groupe, tp.id_groupe]));
    });

    test("une promotion qui a des sous-groupes ne se supprime pas", async () => {
        const response = await clients.admin.send("delete", `/api/groupes/${promo.id_groupe}`);
        expect(response.status).toBe(409);
    });
});

describe("Enseignements : génération depuis la maquette, mutualisation, découpage", () => {
    let periode;
    let filiere;
    let promo;
    let tds;
    let moduleS7;

    beforeAll(async () => {
        const annee = await clients.admin.send("post", "/api/calendrier/annees", {
            libelle: "2026-2027", date_debut: "2026-09-01", date_fin: "2027-07-15", active: true,
        });
        const s1 = await clients.admin.send("post", `/api/calendrier/annees/${annee.body.annee.id_annee}/periodes`, {
            code: "S1", date_debut: "2026-09-14", date_fin: "2027-01-23", nb_semaines: 16,
        });
        periode = s1.body.periode;

        filiere = await creerFiliere("ENS");
        promo = await creerGroupe({ nom_groupe: "4A ENS", niveau: "4ème année", type_groupe: "promotion", id_filiere: filiere.id_filiere, effectif: 44 });
        tds = [
            await creerGroupe({ nom_groupe: "ENS-4A", niveau: "4ème année", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere }),
            await creerGroupe({ nom_groupe: "ENS-4B", niveau: "4ème année", type_groupe: "td", id_groupe_parent: promo.id_groupe, id_filiere: filiere.id_filiere }),
        ];
        // Groupe d'une autre année scolaire : jamais pris en compte pour 2026-2027
        await creerGroupe({ nom_groupe: "ENS-4A-ancien", niveau: "4ème année", type_groupe: "td", id_filiere: filiere.id_filiere, annee_scolaire: "2025/2026" });

        const cree = await clients.admin.send("post", "/api/cours", {
            code_cours: "ENS-NOSQL", nom_cours: "Bases de données NoSQL", niveau: "4ème année",
            volume_horaire: 21, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere,
        });
        moduleS7 = cree.body.cours;
        // CM pour la promotion, TD par groupe, TP sans demi-groupe existant
        await CoursComposante.update({ niveau_groupe: "promotion" }, { where: { id_cours: moduleS7.id_cours } });
        await clients.admin.send("post", `/api/cours/${moduleS7.id_cours}/composantes`, { type: "TD", volume_heures: 10.5, niveau_groupe: "td" });
        await clients.admin.send("post", `/api/cours/${moduleS7.id_cours}/composantes`, { type: "TP", volume_heures: 9, niveau_groupe: "tp" });
        // Module du S8 : hors période S1
        await clients.admin.send("post", "/api/cours", {
            code_cours: "ENS-S8", nom_cours: "Module S8", niveau: "4ème année",
            volume_horaire: 20, type_cours: "CM", semestre: "S8", id_filiere: filiere.id_filiere,
        });
    });

    test("génère 1 CM pour la promotion et 1 TD par groupe ; signale le TP sans demi-groupe ; idempotent", async () => {
        const premiere = await clients.admin.send("post", "/api/enseignements/generer", { id_periode: periode.id_periode, id_filiere: filiere.id_filiere });
        expect(premiere.status).toBe(201);
        expect(premiere.body).toMatchObject({ crees: 3, existants: 0, annee_scolaire: "2026-2027" });
        expect(premiere.body.sans_groupe).toEqual([expect.objectContaining({ code_cours: "ENS-NOSQL", type: "TP", niveau_groupe: "tp" })]);

        const relance = await clients.admin.send("post", "/api/enseignements/generer", { id_periode: periode.id_periode, id_filiere: filiere.id_filiere });
        expect(relance.body).toMatchObject({ crees: 0, existants: 3 });

        const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${filiere.id_filiere}`);
        const cm = liste.body.find((e) => e.composante.type === "CM");
        expect(cm).toMatchObject({ effectif: 44, heures_prevues: 21, groupes: [expect.objectContaining({ nom_groupe: "4A ENS" })] });
    });

    test("mutualiser les deux TD, puis les découper à nouveau", async () => {
        const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${filiere.id_filiere}`);
        const idsTd = liste.body.filter((e) => e.composante.type === "TD").map((e) => e.id_enseignement);

        const fusion = await clients.admin.send("post", "/api/enseignements/fusionner", { ids: idsTd });
        expect(fusion.status).toBe(200);
        expect(fusion.body.enseignement.groupes.map((g) => g.nom_groupe).sort()).toEqual(["ENS-4A", "ENS-4B"]);
        expect(await Enseignement.count({ where: { id_enseignement: idsTd } })).toBe(1);

        const decoupe = await clients.admin.send("post", `/api/enseignements/${fusion.body.enseignement.id_enseignement}/scinder`);
        expect(decoupe.status).toBe(200);
        expect(decoupe.body.ids).toHaveLength(2);
    });

    test("une promotion et l'un de ses TD ne suivent pas le même enseignement", async () => {
        const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${filiere.id_filiere}`);
        const cm = liste.body.find((e) => e.composante.type === "CM");
        const response = await clients.admin.send("put", `/api/enseignements/${cm.id_enseignement}`, { groupes: [promo.id_groupe, tds[0].id_groupe] });
        expect(response.status).toBe(400);
    });

    test("mutualiser un CM avec un TD est refusé (types différents)", async () => {
        const liste = await clients.admin.get(`/api/enseignements?id_periode=${periode.id_periode}&id_filiere=${filiere.id_filiere}`);
        const cm = liste.body.find((e) => e.composante.type === "CM");
        const td = liste.body.find((e) => e.composante.type === "TD");
        const response = await clients.admin.send("post", "/api/enseignements/fusionner", { ids: [cm.id_enseignement, td.id_enseignement] });
        expect(response.status).toBe(400);
    });

    test("réservé à l'administration", async () => {
        expect((await clients.enseignant.get("/api/enseignements")).status).toBe(403);
    });
});

describe("Reprise des séances existantes et salle facultative", () => {
    test("une composante qui porte des séances ne se supprime pas", async () => {
        const autreAdmin = await createUser("admin");
        const { affectation, cours, groupe } = await createPlanningFixture({ admin: autreAdmin, enseignant });
        const composante = await CoursComposante.findOne({ where: { id_cours: cours.id_cours } })
            ?? (await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 30 }));
        const enseignement = await Enseignement.create({ id_composante: composante.id_composante, heures_prevues: 30 });
        await enseignement.setGroupes([groupe.id_groupe]);
        await affectation.update({ id_enseignement: enseignement.id_enseignement });

        const response = await clients.admin.send("delete", `/api/composantes/${composante.id_composante}`);
        expect(response.status).toBe(409);
    });

    test("deux séances sans salle (distanciel) ne sont pas en conflit de salle", async () => {
        const autreAdmin = await createUser("admin");
        const profA = await createUser("enseignant");
        const profB = await createUser("enseignant");
        const { affectation, autreGroupe } = await createPlanningFixture({ admin: autreAdmin, enseignant: profA });
        // Séance existante passée en distanciel (sans salle)
        await affectation.update({ id_salle: null });
        // Autre groupe, autre enseignant, même créneau, aussi en distanciel
        const conflits = await detecterConflitsPourAffectation({
            date_seance: affectation.date_seance,
            id_creneau: affectation.id_creneau,
            id_salle: null,
            id_groupe: autreGroupe.id_groupe,
            id_user_enseignant: profB.id_user,
        });
        expect(conflits.filter((c) => c.type === "salle")).toEqual([]);
    });
});

describe("Événements sur une demi-journée", () => {
    test("les deux heures ou aucune ; fin après début", async () => {
        const base = { titre: "Activités d'intégration : Accueil & Découverte", date_debut: "2026-10-19", date_fin: "2026-10-19", type_evenement: "formation" };
        expect((await clients.admin.send("post", "/api/evenements", { ...base, heure_debut: "13:30" })).status).toBe(400);
        expect((await clients.admin.send("post", "/api/evenements", { ...base, heure_debut: "17:00", heure_fin: "13:30" })).status).toBe(400);
        const ok = await clients.admin.send("post", "/api/evenements", { ...base, heure_debut: "13:30", heure_fin: "17:00" });
        expect(ok.status).toBe(201);
        expect(ok.body.evenement).toMatchObject({ heure_debut: "13:30" });
    });
});
