import { resetDatabase, closeDatabase, createUser, loginAs } from "./helpers/testApp.js";
import { resetRateLimiters } from "../../middleware/rateLimiterMiddleware.js";
import {
    Affectation,
    AnneeUniversitaire,
    Appartenir,
    Campus,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    Filiere,
    Groupe,
    Periode,
    ResponsableFiliere,
    RetourSeance,
    Salle,
} from "../../models/index.js";
import { aujourdhui } from "../../services/planning/affectationRules.js";

/**
 * Phase P7 — suivi du réalisé, export des vacataires, retours de séance anonymes (I7).
 */

let admin;
let vacataire;
let permanent;
let etudiants;
let intrus;
let clients;
let ref;

const decaler = (jours) => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};
const MOIS = aujourdhui().slice(0, 7);

beforeAll(async () => {
    await resetDatabase();
    admin = await createUser("admin");
    vacataire = await createUser("enseignant");
    permanent = await createUser("enseignant");
    await Enseignant.update({ statut: "vacataire", entreprise: "ESN casablancaise" }, { where: { id_user: vacataire.id_user } });
    etudiants = [];
    for (let i = 0; i < 6; i += 1) etudiants.push(await createUser("etudiant"));
    intrus = await createUser("etudiant");
    clients = { admin: await loginAs(admin), vacataire: await loginAs(vacataire), permanent: await loginAs(permanent) };

    const gandhi = await Campus.findOne({ where: { code: "G" } });
    const filiere = await Filiere.create({ code_filiere: "SUI", nom_filiere: "Suivi" });
    const autreFiliere = await Filiere.create({ code_filiere: "AUT", nom_filiere: "Autre" });
    const td = await Groupe.create({ nom_groupe: "SUI-4A", niveau: "4ème année", annee: 4, effectif: 25, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: filiere.id_filiere });
    const autreGroupe = await Groupe.create({ nom_groupe: "AUT-4A", niveau: "4ème année", annee: 4, effectif: 25, annee_scolaire: "2026-2027", type_groupe: "td", id_filiere: autreFiliere.id_filiere });
    for (const e of etudiants) await Appartenir.create({ id_user_etudiant: e.id_user, id_groupe: td.id_groupe });
    await Appartenir.create({ id_user_etudiant: intrus.id_user, id_groupe: autreGroupe.id_groupe });
    const salle = await Salle.create({ nom_salle: "G-SUI", type_salle: "Salle de cours", capacite: 30, id_campus: gandhi.id_campus });
    const creneau = await Creneau.create({ jour_semaine: "lundi", heure_debut: "09:00", heure_fin: "10:45", duree_minutes: 105, rang: 1 });
    const cours = await Cours.create({ code_cours: "SUI-NOSQL", nom_cours: "NoSQL", niveau: "4ème année", volume_horaire: 60, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    const composante = await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 60, niveau_groupe: "td" });

    const annee = await AnneeUniversitaire.create({ libelle: "2026-2027", date_debut: decaler(-60), date_fin: decaler(250), active: true });
    // Semestre commencé il y a 4 semaines (sur 16) : 15 h attendues sur 60
    const periode = await Periode.create({ id_annee: annee.id_annee, code: "S1", date_debut: decaler(-28), date_fin: decaler(84), nb_semaines: 16 });
    const enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode.id_periode, heures_prevues: 60 });
    await enseignement.setGroupes([td.id_groupe]);

    const seance = (extra) =>
        Affectation.create({ date_seance: decaler(-1), statut: "confirme", id_cours: cours.id_cours, id_groupe: td.id_groupe, id_user_enseignant: vacataire.id_user, id_salle: salle.id_salle, id_creneau: creneau.id_creneau, id_user_admin: admin.id_user, id_enseignement: enseignement.id_enseignement, ...extra });
    const seances = {
        confirmeePassee: await seance(),
        planifieePassee: await seance({ statut: "planifie", date_seance: decaler(-2) }),
        reporteePassee: await seance({ statut: "reporte", date_seance: decaler(-3) }),
        future: await seance({ statut: "confirme", date_seance: decaler(5) }),
    };
    ref = { filiere, td, cours, periode, enseignement, seances };
});
afterAll(closeDatabase);
beforeEach(resetRateLimiters);

describe("Séances réalisées", () => {
    test("d'office : seules les séances confirmées et passées deviennent réalisées", async () => {
        const response = await clients.admin.send("post", "/api/suivi/actualiser");
        expect(response.body.realisees).toBe(1);
        const statuts = await Promise.all(Object.values(ref.seances).map((s) => Affectation.findByPk(s.id_affectation).then((a) => a.statut)));
        expect(statuts).toEqual(["realise", "planifie", "reporte", "confirme"]);
    });

    test("par l'enseignant, une fois la séance passée ; jamais celle d'un autre", async () => {
        expect((await clients.permanent.send("patch", `/api/suivi/seances/${ref.seances.planifieePassee.id_affectation}/realiser`)).status).toBe(403);
        expect((await clients.vacataire.send("patch", `/api/suivi/seances/${ref.seances.future.id_affectation}/realiser`)).status).toBe(400);
        const ok = await clients.vacataire.send("patch", `/api/suivi/seances/${ref.seances.planifieePassee.id_affectation}/realiser`);
        expect(ok.status).toBe(200);
        expect(ok.body.affectation.statut).toBe("realise");
    });
});

describe("Avancement et heures", () => {
    test("module en retard sur son rythme, heures planifiées et non planifiées", async () => {
        const response = await clients.admin.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`);
        expect(response.status).toBe(200);
        // 2 séances réalisées × 1 h 45 = 3,5 h ; 15 h attendues après 4 semaines sur 16
        expect(response.body[0]).toMatchObject({ heures_prevues: 60, heures_realisees: 3.5, heures_attendues: 15, en_retard: true, reste: 56.5 });
        expect(response.body[0].heures_planifiees).toBe(7);
    });

    test("un responsable ne voit que sa filière ; un enseignant non responsable est refusé", async () => {
        expect((await clients.permanent.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`)).status).toBe(403);
        await ResponsableFiliere.create({ id_user: permanent.id_user, id_filiere: ref.filiere.id_filiere });
        const client = await loginAs(permanent);
        expect((await client.get(`/api/suivi/modules?id_periode=${ref.periode.id_periode}`)).body).toHaveLength(1);
    });

    test("heures réalisées du mois et export CSV des vacataires", async () => {
        // Les séances d'hier et d'avant-hier peuvent tomber le mois précédent : on interroge leur mois
        const mois = decaler(-1).slice(0, 7);
        const heures = await clients.admin.get(`/api/suivi/enseignants?mois=${mois}`);
        expect(heures.body.find((h) => h.id_user === vacataire.id_user).heures_realisees).toBeGreaterThan(0);

        const csv = await clients.admin.get(`/api/suivi/vacataires.csv?mois=${mois}`);
        expect(csv.status).toBe(200);
        expect(csv.headers["content-type"]).toMatch(/text\/csv/);
        expect(csv.text).toMatch(/ESN casablancaise/);
        expect(csv.text).toMatch(/;1,8;SUI-NOSQL NoSQL;SUI-4A;G-SUI/);
        expect((await clients.admin.get("/api/suivi/vacataires.csv?mois=octobre")).status).toBe(400);
        expect(MOIS).toMatch(/^\d{4}-\d{2}$/);
    });
});

describe("Retours de séance (I7)", () => {
    test("l'étudiant voit la séance à évaluer, répond une fois, anonymement", async () => {
        const client = await loginAs(etudiants[0]);
        const aDonner = await client.get("/api/suivi/retours/a-donner");
        expect(aDonner.body.map((s) => s.id_affectation)).toContain(ref.seances.confirmeePassee.id_affectation);

        const url = `/api/suivi/retours/seances/${ref.seances.confirmeePassee.id_affectation}`;
        expect((await client.send("post", url, { note: 9 })).status).toBe(400);
        expect((await client.send("post", url, { note: 4, mot: "Clair" })).status).toBe(201);
        expect((await client.send("post", url, { note: 5 })).status).toBe(409);
        // Aucune trace de l'étudiant dans le retour lui-même
        expect(Object.keys((await RetourSeance.findOne()).get({ plain: true }))).not.toContain("id_user");
        expect((await client.get("/api/suivi/retours/a-donner")).body.map((s) => s.id_affectation)).not.toContain(ref.seances.confirmeePassee.id_affectation);

        const autre = await loginAs(intrus);
        expect((await autre.send("post", url, { note: 1 })).status).toBe(403);
        // Une séance non réalisée ne s'évalue pas
        expect((await client.send("post", `/api/suivi/retours/seances/${ref.seances.reporteePassee.id_affectation}`, { note: 3 })).status).toBe(400);
    });

    test("l'enseignant ne voit la tendance qu'à partir de 5 réponses, et seulement les mots répétés", async () => {
        expect((await clients.vacataire.get("/api/suivi/retours/mes-modules")).body[0]).toMatchObject({ nombre: 1, visible: false });
        const notes = [5, 4, 3, 5];
        const mots = ["clair", "Rapide", "rapide", "exemples concrets"];
        for (const [i, etudiant] of etudiants.slice(1, 5).entries()) {
            const client = await loginAs(etudiant);
            await client.send("post", `/api/suivi/retours/seances/${ref.seances.confirmeePassee.id_affectation}`, { note: notes[i], mot: mots[i] });
        }
        const tendance = (await clients.vacataire.get("/api/suivi/retours/mes-modules")).body[0];
        expect(tendance).toMatchObject({ nombre: 5, visible: true, moyenne: 4.2, repartition: [0, 0, 1, 2, 2] });
        expect(tendance.mots).toEqual([
            { mot: "clair", nombre: 2 },
            { mot: "rapide", nombre: 2 },
        ]);
    });
});
